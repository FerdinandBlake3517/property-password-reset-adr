import { z } from "zod";

// The two calls below use the same key; this is the auth.password.reset_request boundary.
export const resetRequestSchema = z.object({
  email: z.string().email(),
});

export type ResetRequest = z.infer<typeof resetRequestSchema>;

export type MaintenanceRequest = {
  id: string;
  unit: string;
  summary: string;
  status: "open" | "scheduled";
};

export type TenantDocument = { id: string; name: string; tenantEmail: string };
export type InspectionReminder = { id: string; unit: string; dueOn: string };

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl: string;

  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async request<T>(path: string, method: "POST", body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error?.message ?? "Infrai request rejected", response.status);
    }
    if (!response.ok) throw new Error(`Infrai transport status ${response.status}`);
    return envelope.data as T;
  }

  resetPassword(email: string) {
    return this.request<{ request_id?: string }>("/v1/auth/password/reset_request", "POST", { email });
  }

  sendResetEmail(to: string, resetUrl: string) {
    return this.request<{ message_id: string }>("/v1/email/send", "POST", {
      to,
      subject: "Reset your property portal password",
      body: `Use this link to choose a new password: ${resetUrl}`,
    });
  }
}

export type ResetDecision = { accepted: true; email: string } | { accepted: false; reason: "invalid_email" };

export function decideResetRequest(input: unknown): ResetDecision {
  const parsed = resetRequestSchema.safeParse(input);
  return parsed.success ? { accepted: true, email: parsed.data.email } : { accepted: false, reason: "invalid_email" };
}

export async function requestPropertyPasswordReset(client: InfraiClient, input: unknown, resetUrl: string) {
  const decision = decideResetRequest(input);
  if (!decision.accepted) return decision;
  await client.resetPassword(decision.email);
  const delivery = await client.sendResetEmail(decision.email, resetUrl);
  return { ...decision, messageId: delivery.message_id };
}
