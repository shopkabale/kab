import { notFound } from "next/navigation";
import { getProductByPublicId } from "@/lib/firebase/firestore";
import EditProductForm from "@/components/EditProductForm";

export default async function EditPage({ params }: { params: { publicId: string } }) {
  const product = await getProductByPublicId(params.publicId);

  if (!product) {
    notFound();
  }

  return <EditProductForm product={product} />;
}