import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const data = { username: body.username, email: body.email, role: body.role };
  if (body.password) data.password_hash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.update({ where: { user_id: parseInt(id) }, data });
  return NextResponse.json({ ...user, password_hash: undefined });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await prisma.user.delete({ where: { user_id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
