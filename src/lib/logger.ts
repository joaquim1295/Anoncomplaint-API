type LogLevel = "info" | "warn" | "error";

function redactUserId(id: string | undefined): string | undefined {
  if (!id || id.length < 8) return id ? "[redacted]" : undefined;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

export function logAudit(
  level: LogLevel,
  event: string,
  payload: Record<string, unknown> & { adminUserId?: string; userId?: string }
): void {
  const safe = { ...payload };
  if (typeof safe.adminUserId === "string") safe.adminUserId = redactUserId(safe.adminUserId) ?? safe.adminUserId;
  if (typeof safe.userId === "string") safe.userId = redactUserId(safe.userId) ?? safe.userId;
  const line = JSON.stringify({ audit: event, at: new Date().toISOString(), ...safe });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
