import type { Metadata } from "next";
import "./fonts.css";
import "./globals.css";
import "./maker.css";

import "./scrollbar.css";
import "./teachers-day.css";
import "./doodle.css";

export const metadata: Metadata = {
  title: "Trạm phát sóng yêu thương — Gửi người gieo chữ · 20/11",
  description: "Gửi lời cảm ơn đến thầy cô THCS&THPT Lương Thế Vinh nhân ngày Nhà giáo Việt Nam 20/11. Viết một tờ note, góp một lời tri ân lên chiếc bảng chung.",
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
