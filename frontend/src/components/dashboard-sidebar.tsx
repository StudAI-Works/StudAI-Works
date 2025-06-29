"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, FolderOpen, Building, Settings, HelpCircle, Plus, Sparkles } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Generate", href: "/generate", icon: Sparkles },
  { name: "Projects", href: "/dashboard", icon: FolderOpen },
  { name: "Organization", href: "/organization", icon: Building },
  { name: "Account Settings", href: "/account", icon: Settings },
  { name: "Help & Support", href: "/help", icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-muted/30 border-r min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-2">
        <Link href="/editor">
          <Button className="w-full justify-start mb-4">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>

        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn("w-full justify-start", isActive && "bg-secondary")}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
