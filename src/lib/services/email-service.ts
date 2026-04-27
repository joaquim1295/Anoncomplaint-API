import { Resend } from "resend";
import { render } from "@react-email/components";
import { ComplaintUpdateEmail } from "../../components/emails/ComplaintUpdateEmail";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM_EMAIL = process.env.MAIL_FROM ?? "alerts@anoncomplaint.local";

const client = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendComplaintUpdateEmail(params: {
  to: string;
  complaintId: string;
  status: string;
  previewText?: string;
}) {
  if (!client || !RESEND_API_KEY) return;
  const html = await render(
    ComplaintUpdateEmail({
      complaintId: params.complaintId,
      status: params.status,
    })
  );
  await client.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Atualização da denúncia (${params.status})`,
    html,
  });
}
