import * as complaintService from "../lib/complaintService";
import type { ComplaintDocument } from "../models/Complaint";
import { ComplaintStatus } from "../types/complaint";

jest.mock("../lib/repositories/complaintRepository", () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  redact: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock("../lib/services/notification-service", () => ({
  notifyComplaintUpdate: jest.fn().mockResolvedValue(undefined),
  notifyTopicNewComplaint: jest.fn().mockResolvedValue(undefined),
}));

const complaintRepository = require("../lib/repositories/complaintRepository");

const mockDoc = {
  _id: "507f1f77bcf86cd799439011",
  author_id: "user123",
  ghost_mode: true,
  title: "Test title",
  content: "Test complaint content here",
  tags: ["tag1", "tag2"],
  status: ComplaintStatus.PENDING,
  created_at: new Date("2025-01-15T12:00:00Z"),
  updated_at: new Date("2025-01-15T12:00:00Z"),
  endorsedBy: [] as string[],
} as unknown as ComplaintDocument;

describe("createComplaint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps author_id when ghost_mode true (label masked in UI)", async () => {
    complaintRepository.create.mockResolvedValue(mockDoc);
    const result = await complaintService.createComplaint(
      { title: "Test title", content: "A".repeat(10), tags: [], ghost_mode: true },
      "user123"
    );
    expect(result.success).toBe(true);
    expect(complaintRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        author_id: "user123",
        ghost_mode: true,
        title: "Test title",
        content: "A".repeat(10),
        tags: [],
        topic_slug: null,
        topic_title: null,
      })
    );
  });

  it("sets author_id to userId when ghost_mode false", async () => {
    complaintRepository.create.mockResolvedValue(mockDoc);
    const result = await complaintService.createComplaint(
      { title: "Test title", content: "A".repeat(10), tags: [], ghost_mode: false },
      "user123"
    );
    expect(result.success).toBe(true);
    expect(complaintRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ author_id: "user123" })
    );
  });

  it("rejects invalid input", async () => {
    const result = await complaintService.createComplaint(
      { content: "short", tags: [], ghost_mode: true, title: "T" },
      null
    );
    expect(result.success).toBe(false);
    expect(complaintRepository.create).not.toHaveBeenCalled();
  });
});

describe("formatFeed and toDisplay", () => {
  it("formats documents with created_at_label and author_label", () => {
    const docs = [mockDoc];
    const displayed = complaintService.formatFeed(docs);
    expect(displayed).toHaveLength(1);
    expect(displayed[0].id).toBe(String(mockDoc._id));
    expect(displayed[0].content).toBe(mockDoc.content);
    expect(displayed[0].tags).toEqual(mockDoc.tags);
    expect(displayed[0].status).toBe(mockDoc.status);
    expect(displayed[0].created_at_label).toBeDefined();
    expect(typeof displayed[0].created_at_label).toBe("string");
    expect(displayed[0].author_label).toBe("Anónimo");
  });

  it("author_label is Anónimo even when author_id is set", () => {
    const withAuthor = { ...mockDoc, author_id: "user123" } as unknown as ComplaintDocument;
    const displayed = complaintService.formatFeed([withAuthor]);
    expect(displayed[0].author_label).toBe("Anónimo");
  });

  it("handles doc with null tags", () => {
    const noTags = { ...mockDoc, tags: undefined } as unknown as ComplaintDocument;
    const displayed = complaintService.formatFeed([noTags]);
    expect(displayed[0].tags).toEqual([]);
  });
});

describe("getRageMeter", () => {
  it("returns by_tag from aggregate with limit", async () => {
    complaintRepository.aggregate.mockResolvedValue({
      total: 10,
      by_status: [],
      by_tag: [{ tag: "a", count: 5 }, { tag: "b", count: 3 }],
    });
    const result = await complaintService.getRageMeter(20);
    expect(complaintRepository.aggregate).toHaveBeenCalledWith({ tagLimit: 20 });
    expect(result).toEqual([{ tag: "a", count: 5 }, { tag: "b", count: 3 }]);
  });
});

describe("resolveComplaint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns error when complaint not found", async () => {
    complaintRepository.findById.mockResolvedValue(null);
    const result = await complaintService.resolveComplaint("507f1f77bcf86cd799439011", "user123");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("não encontrada");
  });

  it("returns error when author_id is null (anonymous)", async () => {
    complaintRepository.findById.mockResolvedValue({ ...mockDoc, author_id: null });
    const result = await complaintService.resolveComplaint("507f1f77bcf86cd799439011", "user123");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("anónima");
  });

  it("returns error when userId does not match author_id", async () => {
    complaintRepository.findById.mockResolvedValue(mockDoc);
    const result = await complaintService.resolveComplaint("507f1f77bcf86cd799439011", "otherUser");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("permissão");
  });

  it("returns success when author matches and update succeeds", async () => {
    complaintRepository.findById.mockResolvedValue(mockDoc);
    complaintRepository.update.mockResolvedValue({ ...mockDoc, status: ComplaintStatus.RESOLVED });
    const result = await complaintService.resolveComplaint("507f1f77bcf86cd799439011", "user123");
    expect(result.success).toBe(true);
    expect(complaintRepository.update).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      expect.objectContaining({ status: ComplaintStatus.RESOLVED })
    );
  });
});
