import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://bingo.io.kr",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    // 추가 공개 페이지가 있다면 여기에 객체 추가
  ];
}
