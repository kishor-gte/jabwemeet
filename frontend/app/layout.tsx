import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "JabWeMeet",
  description: "Curated Dating & Matchmaking Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
