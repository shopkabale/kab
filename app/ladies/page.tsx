import { redirect } from 'next/navigation';

export default function LadiesPage() {
  // Instantly redirects all old /ladies traffic to the new combined bucket
  redirect('/category/beauty-fashion');
}
