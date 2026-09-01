import { connectDb, OpportunityModel, type OpportunityDoc } from "@san/db";
import { ok, err, type Result } from "@san/core/result";
import { getPublishChecklist, type OpportunityInputType } from "@san/core/schemas/opportunity";

/**
 * Public interface — PRD §4.3. Owns: opportunities, opportunity_media.
 * Allocation adjustment happens inside the investment confirmation
 * transaction (PRD §8.4 atomicity guarantee), not here — a cross-package
 * call couldn't join that transaction anyway.
 */

export async function create(
  input: OpportunityInputType,
  createdBy: string
): Promise<Result<OpportunityDoc>> {
  await connectDb();
  try {
    const doc = await OpportunityModel.create({
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      description: input.description,
      type: input.type,
      location: input.location,
      media: input.media,
      documents: input.documents,
      pricing: { ...input.pricing, unitsSold: 0 },
      returns: input.returns,
      commission: input.commission,
      status: "draft",
      featured: input.featured,
      createdBy,
    });
    return ok(doc.toObject());
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      return err("CONFLICT", "This slug is already in use", { slug: "Taken" });
    }
    throw e;
  }
}

export async function update(id: string, input: OpportunityInputType): Promise<Result<OpportunityDoc>> {
  await connectDb();
  try {
    const updated = await OpportunityModel.findByIdAndUpdate(
      id,
      {
        $set: {
          title: input.title,
          slug: input.slug,
          summary: input.summary,
          description: input.description,
          type: input.type,
          location: input.location,
          media: input.media,
          documents: input.documents,
          "pricing.unitPriceMinor": input.pricing.unitPriceMinor,
          "pricing.minUnits": input.pricing.minUnits,
          "pricing.maxUnits": input.pricing.maxUnits,
          "pricing.totalUnits": input.pricing.totalUnits,
          returns: input.returns,
          commission: input.commission,
          featured: input.featured,
        },
      },
      { new: true }
    ).lean();
    if (!updated) return err("NOT_FOUND", "Opportunity not found");
    return ok(updated);
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      return err("CONFLICT", "This slug is already in use", { slug: "Taken" });
    }
    throw e;
  }
}

export async function publish(id: string): Promise<Result<OpportunityDoc>> {
  await connectDb();
  const doc = await OpportunityModel.findById(id).lean();
  if (!doc) return err("NOT_FOUND", "Opportunity not found");
  if (!doc.commission || !doc.pricing) {
    return err("VALIDATION_FAILED", "Cannot publish — incomplete: pricing, commission terms");
  }

  const checklist = getPublishChecklist({
    media: doc.media,
    commission: doc.commission,
    pricing: doc.pricing,
    summary: doc.summary,
  });
  const unmet = checklist.filter((c) => !c.met);
  if (unmet.length > 0) {
    return err(
      "VALIDATION_FAILED",
      `Cannot publish — incomplete: ${unmet.map((c) => c.label).join(", ")}`
    );
  }

  const updated = await OpportunityModel.findByIdAndUpdate(
    id,
    { $set: { status: "published", publishedAt: new Date() } },
    { new: true }
  ).lean();
  return ok(updated!);
}

export async function unpublish(id: string): Promise<Result<OpportunityDoc>> {
  await connectDb();
  const updated = await OpportunityModel.findByIdAndUpdate(
    id,
    { $set: { status: "paused" } },
    { new: true }
  ).lean();
  if (!updated) return err("NOT_FOUND", "Opportunity not found");
  return ok(updated);
}

export interface ListFilter {
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function list(filter: ListFilter = {}): Promise<Result<{ rows: OpportunityDoc[]; total: number }>> {
  await connectDb();
  const { status, page = 1, pageSize = 25 } = filter;
  const query = { deletedAt: null, ...(status ? { status } : {}) };

  const [rows, total] = await Promise.all([
    OpportunityModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    OpportunityModel.countDocuments(query),
  ]);
  return ok({ rows, total });
}

export async function listPublished(): Promise<Result<OpportunityDoc[]>> {
  await connectDb();
  const rows = await OpportunityModel.find({ status: "published", deletedAt: null })
    .sort({ featured: -1, publishedAt: -1 })
    .lean();
  return ok(rows);
}

export async function getById(id: string): Promise<Result<OpportunityDoc>> {
  await connectDb();
  const doc = await OpportunityModel.findById(id).lean();
  if (!doc) return err("NOT_FOUND", "Opportunity not found");
  return ok(doc);
}

export async function getBySlug(slug: string): Promise<Result<OpportunityDoc>> {
  await connectDb();
  const doc = await OpportunityModel.findOne({ slug, deletedAt: null }).lean();
  if (!doc) return err("NOT_FOUND", "Opportunity not found");
  return ok(doc);
}

function isDuplicateKeyError(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: unknown }).code === 11000;
}
