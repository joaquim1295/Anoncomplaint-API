import type { Metadata } from "next";
import { notFound } from "next/navigation";
import * as userRepository from "../../../lib/repositories/userRepository";
import * as complaintService from "../../../lib/complaintService";
import { getCurrentUser } from "../../../lib/getUser";
import { getResolvedAccountMode } from "../../../lib/accountMode";
import { UserRole } from "../../../types/user";
import { getI18n } from "../../../lib/i18n/request";
import { getMessage } from "../../../lib/i18n/dict";
import type { AppLocale } from "../../../lib/i18n/constants";
import { PublicUserBody } from "./PublicUserBody";

export const revalidate = 60;

function dateLocaleTag(locale: AppLocale): string {
  if (locale === "en") return "en-GB";
  if (locale === "es") return "es";
  return "pt-PT";
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const { byId, value } = resolveHandle(handle);
  const [{ messages }, user] = await Promise.all([getI18n(), byId ? userRepository.findUserById(value) : userRepository.findByUsername(value)]);
  const tr = (key: string) => getMessage(messages, key);
  if (!user || user.banned_at || user.deleted_at || !user.public_profile_enabled) {
    return { title: tr("publicProfile.metaTitle") };
  }
  const displayName = user.username || user.email.split("@")[0] || tr("publicProfile.userFallback");
  return {
    title: `@${user.username ?? value}`,
    description: tr("publicProfile.metaDescription").replace("{{name}}", displayName),
  };
}

function resolveHandle(raw: string): { byId: boolean; value: string } {
  const h = raw.trim();
  const idLike = /^[a-f0-9]{24}$/i.test(h);
  return { byId: idLike, value: h.startsWith("@") ? h.slice(1) : h };
}

export default async function PublicUserPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const { byId, value } = resolveHandle(handle);
  const viewerPromise = getCurrentUser();

  if (byId) {
    const [{ locale, messages }, user, viewer, feed, accountCtx] = await Promise.all([
      getI18n(),
      userRepository.findUserById(value),
      viewerPromise,
      complaintService.getFeedByUserId(value, { limit: 100 }),
      getResolvedAccountMode(),
    ]);
    const tr = (key: string) => getMessage(messages, key);
    const dTag = dateLocaleTag(locale);

    if (!user || user.banned_at || user.deleted_at) notFound();
    const userId = String(user._id);
    const isOwner = viewer?.userId === userId;
    const isAdmin = viewer?.role === "admin";
    const isPublicEnabled = Boolean(user.public_profile_enabled);
    if (!isPublicEnabled && !isOwner && !isAdmin) notFound();

    const publicFeed = feed.filter((c) => !c.ghost_mode && c.author_id === userId);
    const displayName = user.username || user.email.split("@")[0] || tr("publicProfile.userFallback");
    const memberSince = new Date(user.created_at).toLocaleDateString(dTag);
    const showProfileChat =
      Boolean(viewer?.userId) &&
      viewer!.userId !== userId &&
      accountCtx.user != null &&
      accountCtx.mode === "company" &&
      (viewer!.role === UserRole.COMPANY || viewer!.role === UserRole.ADMIN);

    return (
      <PublicUserBody
        tr={tr}
        user={user}
        publicFeed={publicFeed}
        displayName={displayName}
        memberSince={memberSince}
        profileImageSrc={user.profile_image}
        showProfileChat={showProfileChat}
        viewerUserId={viewer?.userId ?? null}
        viewerRole={viewer?.role ?? null}
        subscribedComplaintIds={viewer?.subscribedComplaints ?? []}
      />
    );
  }

  const [{ locale, messages }, user, viewer, accountCtx] = await Promise.all([
    getI18n(),
    userRepository.findByUsername(value),
    viewerPromise,
    getResolvedAccountMode(),
  ]);
  const tr = (key: string) => getMessage(messages, key);
  const dTag = dateLocaleTag(locale);

  if (!user || user.banned_at || user.deleted_at) notFound();
  const userId = String(user._id);
  const isOwner = viewer?.userId === userId;
  const isAdmin = viewer?.role === "admin";
  const isPublicEnabled = Boolean(user.public_profile_enabled);
  if (!isPublicEnabled && !isOwner && !isAdmin) notFound();

  const feed = await complaintService.getFeedByUserId(userId, { limit: 100 });
  const publicFeed = feed.filter((c) => !c.ghost_mode && c.author_id === userId);
  const displayName = user.username || user.email.split("@")[0] || tr("publicProfile.userFallback");
  const memberSince = new Date(user.created_at).toLocaleDateString(dTag);
  const showProfileChat =
    Boolean(viewer?.userId) &&
    viewer!.userId !== userId &&
    accountCtx.user != null &&
    accountCtx.mode === "company" &&
    (viewer!.role === UserRole.COMPANY || viewer!.role === UserRole.ADMIN);

  return (
    <PublicUserBody
      tr={tr}
      user={user}
      publicFeed={publicFeed}
      displayName={displayName}
      memberSince={memberSince}
      profileImageSrc={user.profile_image}
      showProfileChat={showProfileChat}
      viewerUserId={viewer?.userId ?? null}
      viewerRole={viewer?.role ?? null}
      subscribedComplaintIds={viewer?.subscribedComplaints ?? []}
    />
  );
}
