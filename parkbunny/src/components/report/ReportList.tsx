import Link from "next/link";

type ReportListProps = {
  reports: { id: string; name: string; postcodes: string; createdAt: string | Date }[];
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
          <Link href={`/reports/${r.id}`} className="text-sm underline">
            View
          </Link>
        </li>
      ))}
    </ul>
  );
}


