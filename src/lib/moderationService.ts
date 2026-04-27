const BAD_WORDS = new Set(
  [
    "cabrão", "caralho", "foda", "fodido", "fodida", "merda", "porra", "puta", "puto",
    "buceta", "cona", "caralho", "cacete", "bosta", "cu", "cú", "viado", "viada",
    "idiota", "imbecil", "estúpido", "estupido", "retardado", "mongoloide",
    "negro", "preto", "preta", "cigano", "cigana", "judeu", "judeus",
    "gordo", "gorda", "gordos", "gordas", "feio", "feia", "anormal",
    "morte", "matar", "morrer", "suicídio", "suicidio", "bomba", "explosão",
    "ódio", "odio", "raiva", "vítima", "vitima", "assassino", "terrorista",
  ]
    .map((w) => w.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, ""))
);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

export function isContentToxic(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const normalized = normalize(text);
  const words = normalized.split(/\s+/).filter(Boolean);
  for (const word of words) {
    const clean = word.replace(/[^\p{L}\p{N}]/gu, "");
    if (clean.length < 3) continue;
    if (BAD_WORDS.has(clean)) return true;
    for (const bad of BAD_WORDS) {
      if (clean.includes(bad) || bad.includes(clean)) return true;
    }
  }
  return false;
}
