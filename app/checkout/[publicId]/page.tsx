import { notFound } from "next/navigation";
import { getProductByPublicId } from "@/lib/firebase/firestore";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage({ params }: { params: { publicId: string } }) {
  const product = await getProductByPublicId(params.publicId);

  if (!product) {
    notFound();
  }

  return <CheckoutForm product={product} />;
}