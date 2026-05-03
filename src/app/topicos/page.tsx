import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "../../components/layout/PageHeader";
import { getCurrentUser } from "../../lib/getUser";
import * as topicService from "../../lib/topicService";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { TopicHubCreateForm } from "./topic-hub-create-form";
import { getI18n } from "../../lib/i18n/request";
import { getMessage } from "../../lib/i18n/dict";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getI18n();
  return {
    title: getMessage(messages, "topicos.title"),
    description: getMessage(messages, "topicos.metaDescription"),
  };
}

export default async function TopicosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [params, { messages }, user] = await Promise.all([searchParams, getI18n(), getCurrentUser()]);
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const tr = (key: string) => getMessage(messages, key);
  const topics = q ? await topicService.searchTopics(q, 60) : await topicService.listTopicsForHub(60);

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <PageHeader title={tr("topicos.title")} iconName="hash" variant="sticky" />

        <div>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{tr("topicos.intro")}</p>
        </div>

        <form method="GET" className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-3 dark:border-zinc-800/80 dark:bg-zinc-950/35">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{tr("topicos.searchLabel")}</span>
            <Input type="text" name="q" defaultValue={q} placeholder={tr("topicos.searchPlaceholder")} className="h-10" />
          </label>
          <div className="mt-2">
            <Button type="submit" variant="secondary" size="sm" className="rounded-xl">
              {tr("common.search")}
            </Button>
          </div>
        </form>

        {user ? (
          <TopicHubCreateForm />
        ) : (
          <p className="rounded-xl border border-zinc-200/90 bg-zinc-50/90 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800/80 dark:bg-zinc-950/40 dark:text-zinc-400">
            <Link href="/login" className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400">
              {tr("topicos.loginLink")}
            </Link>
            {tr("topicos.loginSuffix")}
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{tr("topicos.activeTopics")}</CardTitle>
          </CardHeader>
          <CardContent>
            {topics.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-500">
                {tr("topicos.emptyBefore")}
                <code className="text-emerald-800 dark:text-emerald-300">telecom</code>
                {tr("topicos.emptyAfter")}
              </p>
            ) : (
              <ul className="divide-y divide-zinc-200/90 dark:divide-zinc-800/80">
                {topics.map((topic) => (
                  <li key={topic.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                    <div>
                      <Link href={`/t/${topic.slug}`} className="font-medium text-emerald-700 hover:underline dark:text-emerald-300">
                        /{topic.slug}
                      </Link>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{topic.title}</p>
                    </div>
                    <span className="tabular-nums text-xs text-zinc-500 dark:text-zinc-500">
                      {topic.complaint_count} {tr("topicos.complaintsLabel")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
