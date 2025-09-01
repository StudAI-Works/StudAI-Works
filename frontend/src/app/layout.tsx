import type React from "react"
// import type { Metadata } from "next" // Not using Next.js
// import { Inter } from "next/font/google" // Not using Next.js fonts
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

// const inter = Inter({ subsets: ["latin"] }) // Not using Next.js fonts

// export const metadata: Metadata = { // Not using Next.js metadata
//   title: "StudAI Builder  - Your Intelligent Code Companion",
//   description: "Build Projects at Lightning Speed with AI-powered development tools",
//   generator: 'v0.dev'
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans"> {/* Using default font-sans instead of Next.js Inter */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
