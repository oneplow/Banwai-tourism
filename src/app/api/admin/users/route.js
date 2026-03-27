import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { created_at: "desc" },
    include: { staff_permissions: { include: { place: { select: { name: true } } } } },
  });
  return NextResponse.json(users.map((u) => ({ ...u, password: undefined })));
}

export async function POST(request) {
  const body = await request.json();
  if (!body.username || !body.email || !body.password) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) return NextResponse.json({ error: "อีเมลนี้มีอยู่แล้ว" }, { status: 400 });

  const hash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: { username: body.username, email: body.email, password: hash, role: body.role || "staff" },
  });
  return NextResponse.json({ ...user, password: undefined }, { status: 201 });
}
