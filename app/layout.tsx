import type { ReactNode } from "react";
import { Figtree } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export const metadata = { title: "StrideWise" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={figtree.variable}>
      <body className="font-sans antialiased">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
