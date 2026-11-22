import type { ReactNode } from "react";
import { Figtree } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export const metadata = { title: "StrideWise" };
export const viewport = { themeColor: "#f4f4f6" }; // matches --color-bg, so the browser bar blends with the page

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={figtree.variable}>
      <body className="font-sans antialiased">
        {/* Hidden until reached with Tab: lets keyboard users jump past the navbar. */}
        <a href="#main" className="sr-only rounded-full bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]">
          Skip to Content
        </a>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
