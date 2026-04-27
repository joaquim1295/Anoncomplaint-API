import {
  createComplaintSchema,
  updateComplaintStatusSchema,
  complaintIdSchema,
} from "../lib/validations";
import { ComplaintStatus } from "../types/complaint";

describe("createComplaintSchema", () => {
  it("accepts valid input with content, tags, ghost_mode", () => {
    const result = createComplaintSchema.safeParse({
      content: "A".repeat(10),
      tags: ["tag1"],
      ghost_mode: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects content shorter than 10 characters", () => {
    const result = createComplaintSchema.safeParse({
      content: "short",
      tags: [],
      ghost_mode: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects content longer than 2000 characters", () => {
    const result = createComplaintSchema.safeParse({
      content: "A".repeat(2001),
      tags: [],
      ghost_mode: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 tags", () => {
    const result = createComplaintSchema.safeParse({
      content: "A".repeat(10),
      tags: Array(11).fill("x"),
      ghost_mode: true,
    });
    expect(result.success).toBe(false);
  });

  it("defaults ghost_mode to true", () => {
    const result = createComplaintSchema.safeParse({
      content: "A".repeat(10),
      tags: [],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.ghost_mode).toBe(true);
  });
});

describe("updateComplaintStatusSchema", () => {
  it("accepts valid 24-char hex complaint_id and status", () => {
    const result = updateComplaintStatusSchema.safeParse({
      complaint_id: "a".repeat(24).replace(/a/g, "f"),
      status: ComplaintStatus.RESOLVED,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-ObjectId complaint_id", () => {
    const result = updateComplaintStatusSchema.safeParse({
      complaint_id: "not-24-hex",
      status: ComplaintStatus.RESOLVED,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = updateComplaintStatusSchema.safeParse({
      complaint_id: "507f1f77bcf86cd799439011",
      status: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("complaintIdSchema", () => {
  it("accepts valid 24-char hex id", () => {
    const result = complaintIdSchema.safeParse({
      id: "507f1f77bcf86cd799439011",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty id", () => {
    const result = complaintIdSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });

  it("rejects id with wrong length", () => {
    const result = complaintIdSchema.safeParse({ id: "507f1f77bcf86cd79943901" });
    expect(result.success).toBe(false);
  });
});
