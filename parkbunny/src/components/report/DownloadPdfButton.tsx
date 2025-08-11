'use client'

import { Button } from "@/components/ui/button"

type DownloadPdfButtonProps = {
  className?: string
}

export default function DownloadPdfButton({ className }: DownloadPdfButtonProps) {
  return (
    <Button type="button" onClick={() => window.print()} className={className}>
      Download as PDF
    </Button>
  )
}


