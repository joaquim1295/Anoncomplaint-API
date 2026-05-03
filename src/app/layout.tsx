import type { Metadata } from "next";
import { headers } from "next/headers";
import { SideBar } from "../components/SideBar";
import { AppProviders } from "../components/providers/AppProviders";
import { AppToaster } from "../components/layout/AppToaster";
import { MobileNav } from "../components/layout/MobileNav";
import { SiteHeader } from "../components/layout/SiteHeader";
import { SiteFooter } from "../components/layout/SiteFooter";
import { getI18n } from "../lib/i18n/request";
import { getMessage } from "../lib/i18n/dict";
import "./globals.css";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon", sizes: "any" }],
    shortcut: "/favicon.ico",
  },
  title: {
    default: "SmartComplaint",
    template: "%s · SmartComplaint",
  },
  description: "Plataforma de denúncias e reclamações com transparência.",
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: "SmartComplaint",
    title: "SmartComplaint",
    description: "Plataforma de denúncias e reclamações com transparência.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartComplaint",
    description: "Plataforma de denúncias e reclamações com transparência.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const hideNav = requestHeaders.get("x-ui-hide-nav") === "1";
  const { locale, messages } = await getI18n();
  const skipLabel = getMessage(messages, "a11y.skipToContent");
  const navRegionLabel = getMessage(messages, "nav.section");
  const htmlLang = locale === "pt" ? "pt-PT" : locale === "es" ? "es" : "en";

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProviders locale={locale} messages={messages}>
          <a
            href="#conteudo"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-zinc-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:focus:bg-zinc-950 dark:focus:text-zinc-100"
          >
            {skipLabel}
          </a>
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute inset-0 app-bg-light dark:hidden" />
            <div className="absolute inset-0 hidden dark:block cyber-bg opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-200/50 dark:to-zinc-950/65" />
          </div>
          <div className="relative flex min-h-screen w-full min-w-0 max-w-[100vw] flex-col md:flex-row md:max-w-none">
            {!hideNav && (
              <div className="hidden shrink-0 md:block md:pl-4 md:pr-3 md:pt-4" suppressHydrationWarning>
                <nav className="sticky top-4 z-20" aria-label={navRegionLabel}>
                  <SideBar />
                </nav>
              </div>
            )}
            <main id="conteudo" className="min-w-0 w-full flex-1">
              <div className="p-3 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:p-4 md:pb-5 lg:p-5">
                <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full min-w-0 max-w-[1280px] flex-col rounded-3xl border border-zinc-200/80 bg-white/75 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-shadow duration-300 dark:border-zinc-800/70 dark:bg-zinc-950/35 dark:shadow-2xl dark:shadow-black/40">
                  {!hideNav && <SiteHeader />}
                  <div className="min-h-0 flex-1">{children}</div>
                  {!hideNav && <SiteFooter />}
                </div>
              </div>
            </main>
          </div>
          {!hideNav && <MobileNav />}
          <AppToaster />
        </AppProviders>
      </body>
    </html>
  );
}
