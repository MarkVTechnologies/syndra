"use server";

import { revalidatePath } from "next/cache";
import {
  getIntegrationStatus,
  updateIntegrationSettings,
  type IntegrationStatus,
  type IntegrationUpdateInput,
} from "@san/service-settings";
import type { Result } from "@san/core/result";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}

export async function getIntegrationStatusAction(): Promise<Result<IntegrationStatus>> {
  await requireAdmin();
  return getIntegrationStatus();
}

export async function updateIntegrationSettingsAction(
  input: IntegrationUpdateInput
): Promise<Result<{ updatedFields: string[] }>> {
  const admin = await requireAdmin();
  const result = await updateIntegrationSettings(input, admin.id);
  revalidatePath("/admin/settings");
  return result;
}
