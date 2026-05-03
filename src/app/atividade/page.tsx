import { redirect } from "next/navigation";

/** Alias histórico — usar `/activities`. */
export default function AtividadePage() {
  redirect("/activities");
}
