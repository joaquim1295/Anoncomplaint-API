import { Resend } from "resend";
import { render } from "@react-email/components";
import { ComplaintUpdateEmail } from "../../components/emails/ComplaintUpdateEmail";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM_EMAIL = process.env.MAIL_FROM ?? "alerts@smartcomplaint.local";

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

export async function sendCompanyVerificationEmail(params: {
  to: string;
  verificationUrl: string;
  companyName: string;
}) {
  if (!client || !RESEND_API_KEY) return;
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; background:#09090b; color:#e4e4e7; padding:24px;">
      <h2 style="color:#34d399; margin:0 0 12px;">Verificação de Empresa</h2>
      <p style="margin:0 0 12px;">Recebemos o pedido para verificar a empresa <strong>${params.companyName}</strong>.</p>
      <p style="margin:0 0 16px;">Confirme o email corporativo clicando no link:</p>
      <p><a href="${params.verificationUrl}" style="color:#34d399;">Confirmar email corporativo</a></p>
    </div>
  `;
  await client.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Confirme o email corporativo da sua empresa",
    html,
  });
}

export async function sendUserEmailVerification(params: { to: string; verifyUrl: string }) {
  if (!client || !RESEND_API_KEY) return;
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; background:#09090b; color:#e4e4e7; padding:24px;">
      <h2 style="color:#34d399; margin:0 0 12px;">Confirme o seu email</h2>
      <p style="margin:0 0 16px;">Clique para validar a sua conta SmartComplaint:</p>
      <p><a href="${params.verifyUrl}" style="color:#34d399;">Verificar email</a></p>
    </div>
  `;
  await client.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Confirme o seu endereço de email",
    html,
  });
}

export async function sendPasswordResetEmail(params: { to: string; resetUrl: string }) {
  if (!client || !RESEND_API_KEY) return;
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; background:#09090b; color:#e4e4e7; padding:24px;">
      <h2 style="color:#34d399; margin:0 0 12px;">Recuperação de password</h2>
      <p style="margin:0 0 16px;">Pediu redefinir a password. O link expira em 1 hora:</p>
      <p><a href="${params.resetUrl}" style="color:#34d399;">Redefinir password</a></p>
    </div>
  `;
  await client.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Redefinir password — SmartComplaint",
    html,
  });
}

export async function sendCompanyApprovedEmail(params: {
  to: string;
  companyName: string;
}) {
  if (!client || !RESEND_API_KEY) return;
  const html = `
    <div style="font-family: Inter, Arial, sans-serif; background:#09090b; color:#e4e4e7; padding:24px;">
      <h2 style="color:#34d399; margin:0 0 12px;">Conta de Empresa Aprovada</h2>
      <p style="margin:0;">A empresa <strong>${params.companyName}</strong> foi aprovada. Já pode responder oficialmente às reclamações.</p>
    </div>
  `;
  await client.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "A sua conta de empresa foi ativada",
    html,
  });
}
