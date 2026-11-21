import type { ReactNode } from "react";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

export const metadata = { title: "CodeJam Running Form" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
