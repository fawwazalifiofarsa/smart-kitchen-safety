import type { Metadata } from "next";

import "./globals.css";
import { PageTransition } from "@/components/layout/page-transition";

export const metadata: Metadata = {
  title: "Smart Kitchen Safety Dashboard",
  description: "IoT-based gas leak and fire monitoring dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  );
}
