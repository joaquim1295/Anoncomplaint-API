import type { Metadata } from "next";
import { Toaster } from "sonner";
import { HydrationSafe } from "../components/HydrationSafe";
import { SideBar } from "../components/SideBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnonComplaint",
  description: "Plataforma de denúncias anónimas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen bg-anon-ghost text-zinc-100 cyber-bg">
        <HydrationSafe>
          <div className="relative flex min-h-screen">
            <nav className="fixed left-4 top-4 z-20 hidden md:block">
              <SideBar />
            </nav>
            <main className="flex-1 pl-0 md:pl-28">
              <div className="pointer-events-none fixed inset-0 -z-10 opacity-70">
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/0 via-zinc-950/0 to-zinc-950/60" />
              </div>
              {children}
            </main>
          </div>
        </HydrationSafe>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "group relative overflow-hidden rounded-xl bg-zinc-950/60 text-zinc-100 ring-1 ring-inset ring-zinc-800/80 shadow-xl backdrop-blur data-[expanded=true]:shadow-2xl",
              description: "text-zinc-400",
              actionButton:
                "bg-emerald-500/14 text-emerald-100 ring-1 ring-inset ring-emerald-500/30 hover:bg-emerald-500/18",
              cancelButton:
                "bg-zinc-900/50 text-zinc-200 ring-1 ring-inset ring-zinc-800/70 hover:bg-zinc-900/70",
              success: "ring-emerald-500/30",
              error: "ring-red-500/30",
            },
          }}
        />
      </body>
    </html>
  );
}
