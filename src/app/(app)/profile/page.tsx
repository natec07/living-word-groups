import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function MyProfilePage() {
  const session = await auth();
  redirect(`/directory/${session!.user.id}`);
}
