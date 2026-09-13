import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "50 AI Agents for Real Businesses | SonnetSkills",
  description: "A practical playbook of 50 AI agents for founders, business owners and operators. Instant digital access for ₹9.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
