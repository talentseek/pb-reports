export default function PublicShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* No global header/navigation on public share */}
      <main className="mx-auto max-w-7xl p-6 print:p-0">
        {children}
      </main>
    </>
  )
}


