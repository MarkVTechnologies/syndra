"use server";

import { revalidatePath } from "next/cache";
import * as identity from "@san/service-identity";
import { audit } from "@san/service-analytics";
import type { Result } from "@san/core/result";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}

export async function approveAmbassadorAction(userId: string): Promise<Result<true>> {
  const admin = await requireAdmin();
  const result = await identity.approveUser(userId);
  if (!result.ok) return result;

  await audit({
    actorId: admin.id,
    actorRole: "admin",
    action: "user.approve",
    targetType: "user",
    targetId: userId,
    after: { status: "active" },
  });

  revalidatePath("/admin/ambassadors");
  return result;
}

export async function suspendUserAction(userId: string): Promise<Result<true>> {
  const admin = await requireAdmin();
  const result = await identity.suspendUser(userId);
  if (!result.ok) return result;

  await audit({
    actorId: admin.id,
    actorRole: "admin",
    action: "user.suspend",
    targetType: "user",
    targetId: userId,
    after: { status: "suspended" },
  });

  revalidatePath("/admin/ambassadors");
  return result;
}

export async function reactivateUserAction(userId: string): Promise<Result<true>> {
  const admin = await requireAdmin();
  const result = await identity.reactivateUser(userId);
  if (!result.ok) return result;

  await audit({
    actorId: admin.id,
    actorRole: "admin",
    action: "user.reactivate",
    targetType: "user",
    targetId: userId,
    after: { status: "active" },
  });

  revalidatePath("/admin/ambassadors");
  return result;
}
