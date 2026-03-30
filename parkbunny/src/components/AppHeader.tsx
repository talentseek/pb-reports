'use client'

import Link from 'next/link'
import HeaderAuth from '@/components/HeaderAuth'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export default function AppHeader() {
  const pathname = usePathname()
  if (pathname?.startsWith('/share') || pathname?.startsWith('/investordeck') || pathname?.startsWith('/jollysailor') || pathname?.startsWith('/demo')) return null
  return (
    <header className="border-b">
      <div className="mx-auto max-w-5xl p-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center" aria-label="ParkBunny Home">
          <Image src="/logo.png" alt="ParkBunny" width={240} height={56} priority className="h-12 sm:h-14 w-auto" />
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            Dashboard
          </Link>
          <Link
            href="/reports"
            className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/reports' ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            Reports
          </Link>
          <Link
            href="/outreach"
            className={`text-sm font-medium transition-colors hover:text-primary ${pathname?.startsWith('/outreach') ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            Outreach
          </Link>
          <Link
            href="/bespoke"
            className={`text-sm font-medium transition-colors hover:text-primary ${pathname?.startsWith('/bespoke') ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            Bespoke Reports
          </Link>
          <Link
            href="/demos"
            className={`text-sm font-medium transition-colors hover:text-primary ${pathname?.startsWith('/demos') ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            App Demos
          </Link>
          <Link
            href="/dashboard/support"
            className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/dashboard/support' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            📞 Support
          </Link>
          <Link
            href="/outreach/analytics"
            className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/outreach/analytics' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            📊 Voice Analytics
          </Link>
          <Link href="/dashboard/help" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">Help</Link>
          <HeaderAuth />
        </nav>
      </div>
    </header>
  )
}


