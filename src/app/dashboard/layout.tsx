import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireServerUser } from "@/lib/firebase/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
   await requireServerUser();

  return <DashboardShell>{children}</DashboardShell>;
}
