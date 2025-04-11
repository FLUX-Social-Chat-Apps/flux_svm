import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WalletContextProvider from "@/config/WalletContextProvider";
import { ThemeProvider } from "@/config/theme-provider";
import { Toaster } from "@/components/ui/sonner";
// import Header from "@/components/header";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flux",
  description:
    "FLUX is a Web3-based chat platform integrated with the Solana blockchain, enabling users to interact in real-time while leveraging the power of AI Agents to perform various blockchain operations and data analysis. ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <WalletContextProvider>{children}</WalletContextProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
