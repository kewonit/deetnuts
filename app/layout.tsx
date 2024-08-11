import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from '@/components/footer'
import { GoogleAnalytics } from '@next/third-parties/google'
import GrainEffect from '@/components/graineffect';
import { Suspense } from "react";
import Loading from "./loading";
import BlurFade from "@/components/magicui/blur-fade";
import { Toaster } from "@/components/ui/toaster"
import NextTopLoader from 'nextjs-toploader';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DEETNUTS",
  description: "mildly important data related to colleges simplified",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#E4DFF2]">
      <meta property="og:image" content="https://res.cloudinary.com/dfyrk32ua/image/upload/v1722186653/deetnuts/preview_o5ykn7.png" />
      <meta property="og:image:webp" content="https://res.cloudinary.com/dfyrk32ua/image/upload/v1722186653/deetnuts/preview_o5ykn7.png" />
      <link rel="icon" href="/favicon.ico" />
      <body className={inter.className}>
        <Navbar />
            <Suspense fallback={<Loading />}>
              <BlurFade delay={0.25} inView>
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
              </BlurFade>
            </Suspense>
            <Toaster />
            <GrainEffect />
            <GoogleAnalytics gaId="G-PF9S037SJQ" />
        <Footer />
      </body>
    </html>
  );
}
