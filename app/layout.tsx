import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ethics & Compliance Learning Portal",
  description:
    "Corporate training portal delivering xAPI compliant ethics and compliance courses with rich analytics."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-canvas">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <Navigation />
          <main className="flex-1 px-4 pb-16 pt-8 md:px-8 lg:px-16">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
