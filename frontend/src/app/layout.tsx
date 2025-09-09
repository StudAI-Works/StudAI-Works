import React from "react"
// import type { Metadata } from "next"
// import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

// Since we're using Vite, not Next.js, we don't need Inter font setup
// const inter = Inter({ subsets: ["latin"] })

// Since we're using Vite, not Next.js, we don't need Metadata export
// export const metadata: Metadata = {
//   title: "StudAI Builder  - Your Intelligent Code Companion",
//   description: "Build Projects at Lightning Speed with AI-powered development tools",
//     generator: 'v0.dev'
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
