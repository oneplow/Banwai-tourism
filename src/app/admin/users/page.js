import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminUsersClient from "./AdminUsersClient";

export const metadata = { title: "จัดการผู้ใช้ | Admin" };

export default async function AdminUsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bw_token")?.value;
  const payload = await verifyToken(token);
  if (payload?.role !== "admin") redirect("/admin");

  const [users, places] = await Promise.all([
    prisma.user.findMany({
      orderBy: { created_at: "desc" },
      include: {
        staff_permissions: { include: { place: { select: { name: true } } } },
      },
    }),
    prisma.place.findMany({
      where: { is_active: true },
      select: { place_id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const safeUsers = users.map((u) => ({
    ...u,
    password: undefined,
    created_at: u.created_at.toISOString(),
    updated_at: u.updated_at.toISOString(),
  }));

  return <AdminUsersClient users={safeUsers} places={places} />;
}
