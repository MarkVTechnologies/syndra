import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Layer 2 of 3 (PRD §12.2): middleware already gated the route prefix;
  // this is the handler-level session assertion, defense in depth.
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/admin/login");
  }

  return <AdminShell userEmail={session.user.email ?? ""}>{children}</AdminShell>;
}
