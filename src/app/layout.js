import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";
import { Suspense } from "react";
import Loading from "@/components/Loading";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "POS",
  description: "SENFENG POS",
};

export default function RootLayout({ children }) {
  return (
    <html suppressContentEditableWarning={true} suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

        <Providers>
          <Suspense fallback={<Loading />}>
            {children}
          </Suspense>
        </Providers>

      </body>
    </html>
  );
}


