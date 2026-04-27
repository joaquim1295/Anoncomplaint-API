import * as complaintRepository from "../repositories/complaintRepository";
import type { ComplaintDocument } from "../../models/Complaint";
import type { ComplaintDisplay } from "../../types/complaint";

const ANON_LABEL = "Anónimo" as const;
const REGISTERED_LABEL = "Autor registado" as const;

function toDisplay(doc: ComplaintDocument): ComplaintDisplay {
  const created = new Date(doc.created_at);
  const created_at_label = created.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const officialResponse = doc.officialResponse
    ? {
        companyId: doc.officialResponse.companyId,
        content: doc.officialResponse.content,
        createdAt: doc.officialResponse.createdAt,
        createdAt_label: new Date(doc.officialResponse.createdAt).toLocaleDateString("pt-PT", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }),
      }
    : undefined;
  return {
    id: String(doc._id),
    content: doc.content,
    tags: doc.tags ?? [],
    status: doc.status,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    created_at_label,
    author_label: doc.author_id == null ? ANON_LABEL : REGISTERED_LABEL,
    endorsedBy: doc.endorsedBy ?? [],
    officialResponse: officialResponse ?? null,
  };
}

export async function getComplaintById(complaintId: string): Promise<ComplaintDocument | null> {
  return complaintRepository.findById(complaintId);
}

export async function getRelatedComplaints(
  company: string,
  tags: string[],
  options: { excludeId?: string; limit?: number } = {}
): Promise<ComplaintDisplay[]> {
  const docs = await complaintRepository.findRelated({
    company,
    tags,
    excludeId: options.excludeId,
    limit: options.limit ?? 5,
  });
  return docs.map(toDisplay);
}

