import Link from "next/link";

type ReportListProps = {
  reports: { id: string; name: string; postcodes: string; createdAt: string | Date; shareEnabled?: boolean; shareCode?: string | null }[];
};

export default function ReportList({ reports }: ReportListProps) {
  if (!reports || reports.length === 0) {
    return <p className="text-sm text-gray-600">No reports yet. Create your first report.</p>;
  }
  return (
    <ul className="divide-y rounded border">
      {reports.map((r) => (
        <li key={r.id} className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">{r.name}</p>
            <p className="text-xs text-gray-600">Postcodes: {r.postcodes}</p>
          </div>
          <div className="flex items-center gap-3">
            {r.shareEnabled && r.shareCode ? (
              <button
                className="text-xs rounded border px-2 py-1 hover:bg-gray-50"
                onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/share/${r.shareCode}`)}
                title="Copy public link"
              >
                Copy link
              </button>
            ) : null}
            <Link href={`/reports/${r.id}`} className="text-sm underline">
              View
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}


