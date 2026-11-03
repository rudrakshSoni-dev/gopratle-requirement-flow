import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoPratle — Post a requirement",
  description: "Find event planners, performers and crew for your event.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
              Go<span className="text-violet-600">Pratle</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/requirements" className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100">
                Browse
              </Link>
              <Link
                href="/post"
                className="rounded-md bg-violet-600 px-3 py-1.5 font-medium text-white hover:bg-violet-700"
              >
                Post requirement
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-12">{children}</main>
      </body>
    </html>
  );
}
