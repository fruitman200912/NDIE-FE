import "@/lib/polyfill-localstorage";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: "NDIE",
    template: "%s | NDIE", // 각 페이지 제목 뒤에 붙는 기본 이름
  },
  description:
    "사단법인 디지털과포용성네트워크(NDIE)는 디지털 전환 속 소외된 이들을 위한 포용적 디지털 사회 구현을 목표로 연구, 교육, 정책 제안, 네트워킹 등 다양한 활동을 수행합니다.",
  keywords: [
    "디지털 포용",
    "디지털 리터러시",
    "사단법인",
    "사회참여",
    "디지털 접근성",
    "NDIE",
    "디지털과포용성네트워크",
  ],
  authors: [
    {
      name: "사단법인 디지털과포용성네트워크",
      url: "https://ndie-fe-985895714915.asia-northeast1.run.app/", // 실제 도메인으로 바꿔주세요
    },
  ],
  openGraph: {
    title: "디지털과포용성네트워크",
    description:
      "디지털 포용성과 다양성을 추구하는 비영리 법인 NDIE. 디지털 접근성 향상과 인간 중심의 기술 환경 조성을 위한 연구와 활동을 수행합니다.",
    url: "https://ndie-fe-985895714915.asia-northeast1.run.app/", // 실제 도메인으로 바꿔주세요
    siteName: "디지털과포용성네트워크",
    images: [
      {
        url: "https://storage.googleapis.com/focus-pathfinder/e675f822-6cdb-4e11-9d02-d94b102cb7ce", // 사이트 og 이미지 URL
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "디지털과포용성네트워크",
    description:
      "포용적 디지털 사회를 위한 연구·교육·정책 활동. 디지털 소외 해소와 사회 참여 기회 확대를 위해 노력합니다.",
    images: ["https://storage.googleapis.com/focus-pathfinder/e675f822-6cdb-4e11-9d02-d94b102cb7ce"],
  },
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: new URL("https://ndie-fe-985895714915.asia-northeast1.run.app/"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FirebaseAnalytics />
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
