import Link from "next/link";
import { ArrowLeft, Calendar, Eye, Globe, MapPin, MessageSquare, User2 } from "lucide-react";
import Image from "next/image";
import type { ComplaintDisplay } from "../../../types/complaint";
import type { UserDocument } from "../../../models/User";
import { ComplaintItem } from "../../../components/ComplaintItem";
import { ProfileStartConversationButton } from "../../../components/profile/ProfileStartConversationButton";

type Tr = (key: string) => string;

export function PublicUserBody({
  tr,
  user,
  publicFeed,
  displayName,
  memberSince,
  profileImageSrc,
  showProfileChat,
  viewerUserId,
  viewerRole,
  subscribedComplaintIds,
}: {
  tr: Tr;
  user: UserDocument;
  publicFeed: ComplaintDisplay[];
  displayName: string;
  memberSince: string;
  profileImageSrc: string | null | undefined;
  showProfileChat?: boolean;
  viewerUserId?: string | null;
  viewerRole?: string | null;
  subscribedComplaintIds?: string[];
}) {
  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl space-y-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium tracking-tight text-zinc-700 ring-cyber transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-900/45 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
          {tr("publicProfile.back")}
        </Link>

        <header className="rounded-2xl border border-zinc-200/90 bg-white/85 p-5 ring-1 ring-inset ring-zinc-200/70 dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:ring-zinc-800/70">
          <div className="flex flex-wrap items-start gap-4">
            {profileImageSrc ? (
              <Image
                src={profileImageSrc}
                alt={displayName}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover ring-1 ring-zinc-300/80 dark:ring-zinc-700/80"
                unoptimized
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 ring-1 ring-zinc-300/80 dark:bg-zinc-900/60 dark:ring-zinc-700/80">
                <User2 className="h-7 w-7 text-emerald-600 dark:text-emerald-300/90" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                <User2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300/90" />
                {tr("publicProfile.heading").replace("{{name}}", displayName)}
              </h1>
              {user.username ? (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">@{user.username}</p>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{tr("publicProfile.subtitle")}</p>
              {user.bio ? <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-700 dark:text-zinc-300">{user.bio}</p> : null}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                {user.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300/90" />
                    {user.location}
                  </span>
                ) : null}
                {user.website ? (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {tr("publicProfile.website")}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-zinc-100/90 p-3 ring-1 ring-zinc-200/90 text-sm text-zinc-700 dark:bg-zinc-950/40 dark:ring-zinc-800/70 dark:text-zinc-300">
              <MessageSquare className="mb-1 h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden />{" "}
              {tr("publicProfile.statPublicComplaints")} {publicFeed.length}
            </div>
            <div className="rounded-xl bg-zinc-100/90 p-3 ring-1 ring-zinc-200/90 text-sm text-zinc-700 dark:bg-zinc-950/40 dark:ring-zinc-800/70 dark:text-zinc-300">
              <Eye className="mb-1 h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden /> {tr("publicProfile.statVisible")}
            </div>
            <div className="rounded-xl bg-zinc-100/90 p-3 ring-1 ring-zinc-200/90 text-sm text-zinc-700 dark:bg-zinc-950/40 dark:ring-zinc-800/70 dark:text-zinc-300">
              <Calendar className="mb-1 h-4 w-4 text-emerald-600 dark:text-emerald-300/90" aria-hidden /> {tr("publicProfile.memberSince")}{" "}
              {memberSince}
            </div>
          </div>
        </header>

        <section className="space-y-4">
          {publicFeed.map((complaint) => (
            <ComplaintItem
              key={complaint.id}
              complaint={complaint}
              currentUserId={viewerUserId ?? null}
              currentUserRole={viewerRole ?? null}
              isSubscribed={Boolean(subscribedComplaintIds?.includes(complaint.id))}
            />
          ))}
          {publicFeed.length === 0 && (
            <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/85 p-6 text-sm text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-950/25 dark:text-zinc-400">
              {tr("publicProfile.emptyFeed")}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
