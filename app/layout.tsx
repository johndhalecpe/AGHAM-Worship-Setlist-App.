import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import ClientAuthSetup from "@/components/ClientAuthSetup";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agham Setlist",
  description: "Worship team setlist manager",
  metadataBase: new URL("https://agham-worship-setlist-app.vercel.app"),
  icons: {
    icon: "/transparent-logo.svg",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AGHAM Worship Setlist",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#252320",
};

const themeScript = `
  (function(){
    var t = localStorage.getItem('theme');
    var p = localStorage.getItem('palette');
    if (t === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    if (p && p !== 'default') {
      document.documentElement.setAttribute('data-palette', p);
    }
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
      <body className={geist.className}>
        {children}
        <ClientAuthSetup />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--color-surface-card)",
              color: "var(--color-text)",
              border: "1px solid var(--color-border)",
            },
          }}
        />
      </body>
    </html>
  );
}
