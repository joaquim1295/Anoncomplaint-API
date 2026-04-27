import { getUser } from "../../lib/getUser";
import { RelatorioView } from "./view";

export default async function RelatorioPage() {
  const user = await getUser();
  const now = new Date();
  return (
    <RelatorioView
      userId={user?.userId ?? null}
      generatedAt={now.toISOString()}
    />
  );
}

