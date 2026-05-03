// Extraímos o URL. Podes até colocar no teu .env.local como GROQ_API_URL se quiseres
const GROQ_API_URL = process.env.GROQ_API_URL ?? "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function isContentToxic(text: string): Promise<boolean> {
  if (!text || typeof text !== "string") return false;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return false; // Fail-open em dev

  // Segurança: Evitar que a app fique pendurada se a API falhar
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos limite

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.1, // Temperatura baixa para não haver alucinações na moderação
        messages: [
          {
            role: "system",
            content: "És um moderador de denúncias. Responde APENAS com um JSON: {\"toxic\": boolean}. Marca true apenas para insultos graves ou discurso de ódio. Reclamações exaltadas sobre serviços não são tóxicas."
          },
          // Segurança: Cortar o texto aos 3000 caracteres para evitar exaustão de tokens
          { role: "user", content: text.slice(0, 3000) } 
        ],
        response_format: { type: "json_object" }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn("Aviso: Groq API retornou status", res.status);
      return false; // Fail-open (deixa publicar se o moderador automático falhar)
    }

    const data = await res.json();
    const content = JSON.parse(data.choices[0].message.content);
    return content.toxic === true;

  } catch (e) {
    clearTimeout(timeoutId);
    console.error("Falha na moderação automática:", e);
    return false;
  }
}

export async function generatePrivateSummary(text: string): Promise<string | null> {
  if (!text || typeof text !== "string") return null;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
              "Resuma a seguinte reclamação em uma única frase curta e objetiva. Remova e censure automaticamente quaisquer nomes próprios, números de telefone, emails ou IBANs/Cartões de Crédito por questões de privacidade.",
          },
          { role: "user", content: text.slice(0, 4000) },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    const summary = data?.choices?.[0]?.message?.content;
    if (!summary || typeof summary !== "string") return null;
    return summary.trim().slice(0, 320);
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}