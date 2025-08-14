'use client'

import Link from 'next/link'
import HeaderAuth from '@/components/HeaderAuth'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export default function AppHeader() {
  const pathname = usePathname()
  if (pathname?.startsWith('/share')) return null
  return (
    <header className="border-b">
      <div className="mx-auto max-w-5xl p-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center" aria-label="ParkBunny Home">
          <Image src="/logo.png" alt="ParkBunny" width={240} height={56} priority className="h-12 sm:h-14 w-auto" />
        </Link>
        <nav className="flex items-center gap-6">
          <Link 
            href="/dashboard" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            href="/reports" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === '/reports' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Reports
          </Link>
          <Link 
            href="/outreach" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname?.startsWith('/outreach') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Outreach
          </Link>
          <Link href="/dashboard/help" className="text-sm underline">Help & Guide</Link>
          <HeaderAuth />
        </nav>
      </div>
    </header>
  )
}


