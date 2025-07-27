import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/Navbar";
import DiscordHeader from "@/components/DiscordHeader";
import Footer from '@/components/footer'
import { GoogleAnalytics } from '@next/third-parties/google'
import GrainEffect from '@/components/graineffect';
import { Suspense } from "react";
import Loading from "./loading";
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import NextTopLoader from 'nextjs-toploader';
import MotionWrapper from '@/components/MotionWrapper';


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DEETNUTS",
  description: "mildly important data related to colleges simplified",
  metadataBase: new URL('https://deetnuts.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#E4DFF2]">
      <meta property="og:image" content="https://res.cloudinary.com/dfyrk32ua/image/upload/v1722186653/deetnuts/preview_o5ykn7.png" />
      <meta property="og:image:png" content="https://res.cloudinary.com/dfyrk32ua/image/upload/v1722186653/deetnuts/preview_o5ykn7.png" />
      <link rel="icon" href="/favicon.ico" />
      <body className={`${inter.className} relative min-h-screen overflow-x-hidden`}>
        <Navbar>
          <DiscordHeader />
        </Navbar>
        <Suspense fallback={<Loading />}>
          <MotionWrapper>
            <NextTopLoader
              color="#C7A1FE"
              initialPosition={0.08}
              crawlSpeed={200}
              height={5}
              crawl={true}
              showSpinner={false}
              easing="ease"
              speed={200}
              shadow="0 0 20px #C7A1FE,0 0 15px #C7A1FE"
            />
            {children}
          </MotionWrapper>
        </Suspense>
        <Toaster />
        <SonnerToaster
          position="top-right"
          richColors
          closeButton
        />
        <GrainEffect />
        <GoogleAnalytics gaId="G-PF9S037SJQ" />
        <Footer />
        <div className="fixed bottom-0 left-0 right-0 z-50">

        </div>
      </body>
    </html>
  );
}