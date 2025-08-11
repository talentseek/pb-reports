'use client'

import { useEffect, useState } from 'react'
import CategoryPlacesDrawer from '@/components/report/CategoryPlacesDrawer'

export function CategoryTileClient({ reportId, postcode, category, count, total }: { reportId: string; postcode: string; category: string; count: number; total?: number }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = original
    }
  }, [open])
  return (
    <div className="rounded border p-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => setOpen(true)}>
      <span className="text-sm capitalize">{category}</span>
      <span className="text-sm font-medium">{typeof total === 'number' ? `${count}/${total}` : count}</span>
      {open && (
        <CategoryPlacesDrawer reportId={reportId} category={category} postcode={postcode} onClose={() => setOpen(false)} />
      )}
    </div>
  )
}


