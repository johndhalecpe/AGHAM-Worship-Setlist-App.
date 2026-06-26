import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agham Setlist",
  description: "Worship team setlist manager",
  icons: {
    icon: "/logo.jpg",
  },
};

const themeScript = `
  (function(){
    var t = localStorage.getItem('theme');
    if (t === 'light') return;
    document.documentElement.classList.add('dark');
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={geist.className}>{children}</body>
    </html>
  );
}
