import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ambassador") {
    redirect("/login");
  }

  return <AmbassadorShell userEmail={session.user.email ?? ""}>{children}</AmbassadorShell>;
}
