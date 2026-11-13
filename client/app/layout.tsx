import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "빙고",
  description: "실시간 2인 빙고",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
