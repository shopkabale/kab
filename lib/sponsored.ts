import { db } from "@/lib/firebase/config";
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  query, where, serverTimestamp, Timestamp, writeBatch 
} from "firebase/firestore";

export type SponsoredSlot = {
  id: string; // "slot_1", "slot_2", "slot_3", "slot_4"
  sellerUid: string | null;
  productId: string | null;
  startTime: Timestamp | null;
  endTime: Timestamp | null;
  status: "active" | "available";
  bookedNext: boolean;
  nextSellerUid?: string | null;
  nextProductId?: string | null;
};

export type SponsoredRequest = {
  id?: string;
  sellerUid: string;
  productId: string;
  requestedSlot: string | "any";
  paymentRef: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
  isExtension: boolean;
};

// 1. Fetch slots and auto-expire them if time has passed
export async function getSponsoredSlots(): Promise<SponsoredSlot[]> {
  const slotsRef = collection(db, "sponsoredSlots");
  const snap = await getDocs(slotsRef);
  const slots: SponsoredSlot[] = [];
  const batch = writeBatch(db);
  const now = Timestamp.now().toMillis();

  snap.forEach((docSnap) => {
    let slot = { id: docSnap.id, ...docSnap.data() } as SponsoredSlot;

    // Check for expiration
    if (slot.status === "active" && slot.endTime) {
      if (slot.endTime.toMillis() < now) {
        // Slot has expired. Check if someone booked it next.
        if (slot.bookedNext && slot.nextSellerUid) {
          slot = {
            ...slot,
            sellerUid: slot.nextSellerUid,
            productId: slot.nextProductId || null,
            startTime: Timestamp.now(),
            endTime: Timestamp.fromMillis(now + 3 * 24 * 60 * 60 * 1000), // +3 days
            bookedNext: false,
            nextSellerUid: null,
            nextProductId: null,
          };
        } else {
          // Make available
          slot = {
            ...slot,
            status: "available",
            sellerUid: null,
            productId: null,
            startTime: null,
            endTime: null,
          };
        }
        batch.update(doc(db, "sponsoredSlots", slot.id), slot);
      }
    }
    slots.push(slot);
  });

  await batch.commit();
  return slots.sort((a, b) => a.id.localeCompare(b.id));
}

// 2. Seller requests a slot
export async function requestSponsoredSlot(data: Omit<SponsoredRequest, "status" | "createdAt">) {
  const reqRef = doc(collection(db, "sponsoredRequests"));
  await setDoc(reqRef, {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

// 3. Admin: Get pending requests
export async function getPendingRequests(): Promise<SponsoredRequest[]> {
  const q = query(collection(db, "sponsoredRequests"), where("status", "==", "pending"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as SponsoredRequest));
}

// 4. Admin: Approve a request
export async function approveRequest(requestId: string, slotId: string, request: SponsoredRequest) {
  const slotRef = doc(db, "sponsoredSlots", slotId);
  const reqRef = doc(db, "sponsoredRequests", requestId);
  const slotSnap = await getDoc(slotRef);
  
  const slotData = slotSnap.data() as SponsoredSlot;
  const now = Timestamp.now().toMillis();
  const threeDays = 3 * 24 * 60 * 60 * 1000;

  const batch = writeBatch(db);

  if (slotData.status === "available" || !slotData.endTime || slotData.endTime.toMillis() < now) {
    // Activate immediately
    batch.update(slotRef, {
      status: "active",
      sellerUid: request.sellerUid,
      productId: request.productId,
      startTime: serverTimestamp(),
      endTime: Timestamp.fromMillis(now + threeDays),
    });
  } else {
    // Slot is active. Book for the next round.
    batch.update(slotRef, {
      bookedNext: true,
      nextSellerUid: request.sellerUid,
      nextProductId: request.productId,
    });
  }

  // Mark request as approved
  batch.update(reqRef, { status: "approved" });
  await batch.commit();
}

// 5. Seller: Change active product
export async function changeSponsoredProduct(slotId: string, newProductId: string) {
  await updateDoc(doc(db, "sponsoredSlots", slotId), {
    productId: newProductId
  });
}
