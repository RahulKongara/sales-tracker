import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Root page — redirect based on auth state.
 */
export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  redirect("/bills/new");
}
