'use client'

type DownloadPdfButtonProps = {
  className?: string
}

export default function DownloadPdfButton({ className }: DownloadPdfButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className ?? 'rounded border px-3 py-2 text-sm hover:bg-gray-50'}
    >
      Download as PDF
    </button>
  )
}


