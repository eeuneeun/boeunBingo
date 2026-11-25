import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "무료 빙고 - 완전 무료, 과금 없는 안전한 빙고 게임",
  description:
    "친구와 1:1로 즐길 수 있는 완전 무료 빙고 게임. 안전한 암호화 연결. 과금이 없는 게임 환경. 간단한 숫자 선택으로 즐기는 빙고 게임.",
  alternates: {
    canonical: "https://bingo.io.kr",
  },
  verification: {
    google: "google9a97612b157e37d5",
  },
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
