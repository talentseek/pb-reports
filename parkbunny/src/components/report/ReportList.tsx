import Link from "next/link";
import CopyLinkButton from "@/components/CopyLinkButton";
import ArchiveButton from "@/components/ArchiveButton";

type ReportListProps = {
  reports: { 
    id: string; 
    name: string; 
    postcodes: string; 
    createdAt: string | Date; 
    shareEnabled?: boolean; 
    shareCode?: string | null; 
    settings?: any;
    locations?: { id: string; status: 'PENDING' | 'LIVE' }[];
  }[];
  isArchived?: boolean;
};

export default function ReportList({ reports, isArchived = false }: ReportListProps) {
  if (!reports || reports.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        {isArchived ? "No archived reports." : "No reports yet. Create your first report."}
      </p>
    );
  }
  return (
    <ul className="divide-y rounded border">
      {reports.map((r) => (
        <li key={r.id} className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">{r.name}</p>
            <p className="text-xs text-gray-600">Postcodes: {r.postcodes}</p>
            {r.shareEnabled && r.shareCode && (r.settings as any)?.sharePasswordPlain && (
              <p className="text-xs text-gray-500 mt-1">
                Password: <span className="font-mono bg-gray-100 px-1 rounded">{((r.settings as any).sharePasswordPlain as string)}</span>
              </p>
            )}
            {r.locations && r.locations.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">Location Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  r.locations.filter(loc => loc.status === 'LIVE').length > 0 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                  {r.locations.filter(loc => loc.status === 'LIVE').length} Live / {r.locations.length} Total
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {r.shareEnabled && r.shareCode ? (
              <CopyLinkButton url={`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/share/${r.shareCode}`} />
            ) : null}
            <Link href={`/reports/${r.id}`} className="text-sm underline">
              View
            </Link>
            <ArchiveButton reportId={r.id} isArchived={isArchived} />
          </div>
        </li>
      ))}
    </ul>
  );
}


