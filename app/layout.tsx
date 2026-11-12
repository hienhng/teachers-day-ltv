import type { Metadata } from "next";
import "./fonts.css";
import "./globals.css";
import "./maker.css";

import "./scrollbar.css";
import "./teachers-day.css";
import "./doodle.css";

export const metadata: Metadata = {
  title: "Trạm phát sóng yêu thương — Gửi người gieo chữ · 20/11",
  description: "Cùng đồng nghiệp và học trò gửi lời chúc, lời cảm ơn đến thầy cô THCS&THPT Lương Thế Vinh nhân ngày 20/11. Viết một tờ note, góp một lời tri ân lên chiếc bảng chung.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
