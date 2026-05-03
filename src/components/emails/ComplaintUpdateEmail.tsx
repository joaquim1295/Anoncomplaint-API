import * as React from "react";
import { Html, Head, Preview, Body, Container, Section, Text, Link } from "@react-email/components";

interface ComplaintUpdateEmailProps {
  complaintId: string;
  status: string;
}

export function ComplaintUpdateEmail(props: ComplaintUpdateEmailProps) {
  const url = (process.env.APP_URL ?? "https://smartcomplaint.local") + `/complaints/${props.complaintId}`;
  return (
    <Html>
      <Head />
      <Preview>Atualização de estado da sua denúncia</Preview>
      <Body
        style={{
          margin: 0,
          padding: "24px 0",
          backgroundColor: "#020617",
          color: "#e4e4e7",
          fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <Container
          style={{
            width: "100%",
            maxWidth: "480px",
            margin: "0 auto",
            padding: "24px 20px",
            borderRadius: "16px",
            background: "radial-gradient(circle at top, rgba(248,113,113,0.25), transparent 55%) #020617",
            boxShadow: "0 24px 70px rgba(0,0,0,0.85)",
            border: "1px solid rgba(39,39,42,0.9)",
          }}
        >
          <Section style={{ marginBottom: "16px" }}>
            <Text
              style={{
                fontSize: "14px",
                lineHeight: "20px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#e4e4e7",
              }}
            >
              <span style={{ color: "#ef4444" }}>Smart</span>
              <span>Complaint</span>
            </Text>
            <Text
              style={{
                fontSize: "20px",
                lineHeight: "26px",
                fontWeight: 600,
                marginTop: "4px",
                color: "#f9fafb",
              }}
            >
              A sua denúncia foi atualizada
            </Text>
          </Section>

          <Section style={{ marginBottom: "18px" }}>
            <Text
              style={{
                fontSize: "14px",
                lineHeight: "22px",
                color: "#d4d4d8",
                margin: 0,
              }}
            >
              O estado da denúncia que está a seguir foi alterado para:
            </Text>
            <Text
              style={{
                display: "inline-block",
                marginTop: "10px",
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                backgroundColor: "rgba(248,113,113,0.16)",
                color: "#fecaca",
                border: "1px solid rgba(248,113,113,0.6)",
              }}
            >
              {props.status}
            </Text>
          </Section>

          <Section style={{ marginBottom: "22px" }}>
            <Text
              style={{
                fontSize: "13px",
                lineHeight: "20px",
                color: "#a1a1aa",
                margin: 0,
              }}
            >
              Para ver os detalhes completos da denúncia e acompanhar novas atualizações, abra o painel:
            </Text>
            <Link
              href={url}
              style={{
                display: "inline-block",
                marginTop: "14px",
                padding: "10px 16px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
                backgroundImage:
                  "linear-gradient(135deg, rgba(248,113,113,0.8), rgba(239,68,68,0.95))",
                color: "#020617",
                boxShadow: "0 0 0 1px rgba(248,113,113,0.85), 0 18px 45px rgba(0,0,0,0.9)",
              }}
            >
              Abrir denúncia
            </Link>
          </Section>

          <Section style={{ borderTop: "1px solid rgba(39,39,42,0.9)", paddingTop: "14px" }}>
            <Text
              style={{
                fontSize: "11px",
                lineHeight: "18px",
                color: "#71717a",
                margin: 0,
              }}
            >
              Recebeu este alerta porque decidiu seguir esta denúncia. Pode deixar de seguir a qualquer
              momento diretamente na plataforma.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ComplaintUpdateEmail;
