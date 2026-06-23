import type { Metadata, Viewport } from "next";
import { Public_Sans, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { PwaRegistry } from "@/components/PwaRegistry";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0A1128",
};

export const metadata: Metadata = {
  title: "Aula Virtual - Instituto Gamaliel",
  description: "Sistema interno del Instituto Gamaliel",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aula Virtual - Instituto Gamaliel",
  },
  icons: {
    apple: "/img/logo_seminario.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${publicSans.variable} ${inter.variable} h-full antialiased`}>
      <body className="h-full font-body" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PwaRegistry />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
