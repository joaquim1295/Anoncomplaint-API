import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "../../../lib/getUser";
import * as complaintService from "../../../lib/complaintService";
import * as topicService from "../../../lib/topicService";
import { ComplaintFeed } from "../../../components/complaints/ComplaintFeed";
import { TopicFollowButton } from "../../../components/topics/TopicFollowButton";
import { TopicNewComplaintDialog } from "../../../components/topics/TopicNewComplaintDialog";
import { getI18n } from "../../../lib/i18n/request";
import { getMessage } from "../../../lib/i18n/dict";
export const revalidate = 60;

const PAGE_SIZE = 10;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ messages }, { slug: raw }] = await Promise.all([getI18n(), params]);
  const tr = (key: string) => getMessage(messages, key);
  const slug = String(raw ?? "").trim().toLowerCase();
  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { title: tr("topicPage.metaTopicFallback") };
  }
  const topicMeta = await topicService.getTopicBySlug(slug);
  const title = topicMeta?.title ?? topicService.titleFromSlug(slug);
  const desc = topicMeta?.description?.trim();
  const template = tr("topicPage.metaDescriptionTemplate");
  return {
    title: `/${slug}`,
    description: desc || template.replace("{{title}}", title),
  };
}

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ openComments?: string }>;
}) {
  const [p, sp] = await Promise.all([params, searchParams]);
  const slug = String(p.slug ?? "").trim().toLowerCase();
  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) notFound();
  const rawOpen = typeof sp?.openComments === "string" ? sp.openComments.trim() : "";
  const openCommentsComplaintId = /^[a-f0-9]{24}$/i.test(rawOpen) ? rawOpen : null;

  const [{ messages }, user, topicMeta, feed] = await Promise.all([
    getI18n(),
    getCurrentUser(),
    topicService.getTopicBySlug(slug),
    complaintService.getPublicFeedPaginated(1, PAGE_SIZE, { topicSlug: slug }),
  ]);
  const tr = (key: string) => getMessage(messages, key);

  const title = topicMeta?.title ?? topicService.titleFromSlug(slug);
  const following = Boolean(user?.followedTopics?.includes(slug));

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/45 dark:shadow-none">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/topicos" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">
              {tr("topicPage.backToTopics")}
            </Link>
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300">
              {tr("topicPage.home")}
            </Link>
          </div>
        </header>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              <span className="text-emerald-600 dark:text-emerald-400">/</span>
              {slug}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{title}</p>
            {topicMeta?.description ? (
              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-500">{topicMeta.description}</p>
            ) : null}
          </div>
          <TopicFollowButton slug={slug} initialFollowing={following} isLoggedIn={Boolean(user?.userId)} />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-xl text-xs leading-relaxed text-zinc-600 dark:text-zinc-500">
            {tr("topicPage.feedHintBefore")}{" "}
            <Link href="/" className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400/90">
              {tr("topicPage.feedHintMainFeed")}
            </Link>{" "}
            {tr("topicPage.feedHintAfter")}{" "}
            <span className="font-mono text-zinc-700 dark:text-zinc-400">/{slug}</span>
            {tr("topicPage.feedHintEnd")}
          </p>
          <TopicNewComplaintDialog slug={slug} isLoggedIn={Boolean(user?.userId)} />
        </div>

        <ComplaintFeed
          initialComplaints={feed.complaints}
          initialHasMore={feed.hasMore}
          currentUserId={user?.userId ?? null}
          currentUserRole={user?.role ?? null}
          subscribedComplaintIds={user?.subscribedComplaints ?? []}
          pageSize={PAGE_SIZE}
          companyFilterId={null}
          topicSlug={slug}
          openCommentsComplaintId={openCommentsComplaintId}
        />
      </div>
    </div>
  );
}
