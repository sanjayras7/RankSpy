import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RankSpy",
  description: "Paste your URL. Know your SEO problem. Fix it in 60 seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
