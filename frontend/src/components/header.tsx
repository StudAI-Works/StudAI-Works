"use client"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Code, User, CreditCard, LogOut, Rocket, Database, Cloud } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

// --- 1. MODIFY THE INTERFACE TO ACCEPT onLogout ---
interface HeaderProps {
  user?: {
    name: string
    email: string
    avatar?: string
  } | null; // Allow user to be null
  onLogout?: () => void; // Add onLogout as an optional function prop
}

// --- 2. ACCEPT onLogout AS A PROP ---
export function Header({ user, onLogout }: HeaderProps) {
  const location = useLocation()
  const pathname = location.pathname
  const isAuthenticated = !!user

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2">
            <Code className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">StudAI Builder</span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/generate"
                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/generate" ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                Generate
              </Link>
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                Projects
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <>
              {/* Deploy Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* <Button variant="outline" size="sm">
                    <Rocket className="mr-2 h-4 w-4" />
                    Deploy
                  </Button> */}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="z-[99999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg min-w-[200px]"
                  sideOffset={5}
                  style={{
                    pointerEvents: 'auto',
                    position: 'fixed',
                    zIndex: 99999,
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '4px 0',
                    minWidth: '200px'
                  }}
                >
                  <DropdownMenuItem
                    className="cursor-pointer px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Cloud className="mr-2 h-4 w-4" />
                    Deploy to Vercel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Cloud className="mr-2 h-4 w-4" />
                    Deploy to Netlify
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Deploy to Railway
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Connect Database */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* <Button variant="outline" size="sm">
                    <Database className="mr-2 h-4 w-4" />
                    Connect
                  </Button> */}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="z-[99999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg min-w-[200px]"
                  sideOffset={5}
                  style={{
                    pointerEvents: 'auto',
                    position: 'fixed',
                    zIndex: 99999,
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '4px 0',
                    minWidth: '200px'
                  }}
                >
                  <DropdownMenuItem
                    className="cursor-pointer px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                      Connect to Supabase
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
                      Connect to Firebase
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                      Connect to Neon
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                      Connect to Upstash
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <ModeToggle />

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56  bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
                align="end"
                sideOffset={8}
                side="bottom"
                style={{
                  pointerEvents: 'auto',
                  position: 'absolute',
                  top: '70px',
                  left: '1300px',   
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '4px 0',
                  minWidth: '200px' 
                }}
              >
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Link to="/account">
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  style={{ pointerEvents: 'auto' }}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="cursor-pointer px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  style={{ pointerEvents: 'auto' }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button>Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}