import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = { title: "Admin | บ้านหวาย" };

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("bw_token")?.value;
  if (!token) redirect("/login?redirect=/admin");
  const payload = await verifyToken(token);
  if (!payload) redirect("/login?redirect=/admin");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar user={{ username: payload.username, role: payload.role }} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 min-w-0">
        {children}
      </main>
    </div>
  );
}
