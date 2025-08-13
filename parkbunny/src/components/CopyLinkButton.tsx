'use client'

type CopyLinkButtonProps = {
  url: string
  label?: string
  title?: string
  className?: string
}

export default function CopyLinkButton({ url, label = 'Copy link', title, className }: CopyLinkButtonProps) {
  return (
    <button
      type="button"
      className={className ?? 'text-xs rounded border px-2 py-1 hover:bg-gray-50'}
      title={title ?? 'Copy public link'}
      onClick={() => {
        const full = url.startsWith('http') || url.startsWith('https')
          ? url
          : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`
        navigator.clipboard.writeText(full)
      }}
    >
      {label}
    </button>
  )
}


