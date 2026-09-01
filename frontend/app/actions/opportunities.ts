"use server";

import { revalidatePath } from "next/cache";
import { OpportunityInput } from "@san/core/schemas/opportunity";
import type { Result } from "@san/core/result";
import { err } from "@san/core/result";
import * as catalog from "@san/service-catalog";
import { audit } from "@san/service-analytics";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}

export async function createOpportunityAction(raw: unknown): Promise<Result<{ id: string }>> {
  const admin = await requireAdmin();
  const parsed = OpportunityInput.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
    }
    return err("VALIDATION_FAILED", "Please check the highlighted fields", fields);
  }

  const result = await catalog.create(parsed.data, admin.id);
  if (!result.ok) return result;

  await audit({
    actorId: admin.id,
    actorRole: "admin",
    action: "opportunity.create",
    targetType: "opportunity",
    targetId: result.data._id.toString(),
    after: { title: result.data.title, slug: result.data.slug },
  });

  revalidatePath("/admin/opportunities");
  return { ok: true, data: { id: result.data._id.toString() } };
}

export async function updateOpportunityAction(id: string, raw: unknown): Promise<Result<true>> {
  const admin = await requireAdmin();
  const parsed = OpportunityInput.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
    }
    return err("VALIDATION_FAILED", "Please check the highlighted fields", fields);
  }

  const before = await catalog.getById(id);
  const result = await catalog.update(id, parsed.data);
  if (!result.ok) return result;

  await audit({
    actorId: admin.id,
    actorRole: "admin",
    action: "opportunity.update",
    targetType: "opportunity",
    targetId: id,
    before: before.ok ? { title: before.data.title } : undefined,
    after: { title: result.data.title },
  });

  revalidatePath("/admin/opportunities");
  revalidatePath(`/admin/opportunities/${id}`);
  return { ok: true, data: true };
}

export async function publishOpportunityAction(id: string): Promise<Result<true>> {
  const admin = await requireAdmin();
  const result = await catalog.publish(id);
  if (!result.ok) return result;

  await audit({
    actorId: admin.id,
    actorRole: "admin",
    action: "opportunity.publish",
    targetType: "opportunity",
    targetId: id,
    after: { status: "published" },
  });

  revalidatePath("/admin/opportunities");
  return { ok: true, data: true };
}

export async function unpublishOpportunityAction(id: string): Promise<Result<true>> {
  const admin = await requireAdmin();
  const result = await catalog.unpublish(id);
  if (!result.ok) return result;

  await audit({
    actorId: admin.id,
    actorRole: "admin",
    action: "opportunity.unpublish",
    targetType: "opportunity",
    targetId: id,
    after: { status: "paused" },
  });

  revalidatePath("/admin/opportunities");
  return { ok: true, data: true };
}

export async function checkOpportunitySlug(slug: string): Promise<{ available: boolean }> {
  await requireAdmin();
  const result = await catalog.getBySlug(slug);
  return { available: !result.ok };
}
