import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from '@/components/footer'
import { GoogleAnalytics } from '@next/third-parties/google'
import GrainEffect from '@/components/graineffect';

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
      <meta property="og:image" content="https://res.cloudinary.com/dfyrk32ua/image/upload/v1720885204/deetnuts/preview.png" />
      <meta property="og:image:webp" content="https://res.cloudinary.com/dfyrk32ua/image/upload/v1720885204/deetnuts/preview.png" />
      <link rel="icon" href="/favicon.ico" />
      <body className={inter.className}>
        <Navbar />
          {children}
          <GrainEffect />
          <GoogleAnalytics gaId="G-PF9S037SJQ" />
        <Footer />
      </body>
    </html>
  );
}
