import { calculateRevenuePotential, defaultSettings } from "@/lib/calculations";
import CopyLinkButton from "@/components/CopyLinkButton";

export default function ReportView({ report }: { report: any }) {
  const safeSettings = (report.settings && typeof report.settings === 'object') ? (report.settings as any) : {};
  const revenue = calculateRevenuePotential(
    (report.businesses ?? []).map((b: any) => ({ category: b.category as any })),
    { ...defaultSettings, ...safeSettings },
  );

  return (
    <>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{report.name}</h1>
          <p className="text-sm text-gray-600">Postcodes: {report.postcodes}</p>
        </div>
        {report.shareEnabled && report.shareCode ? (
          <div className="flex items-center gap-2">
            <a
              href={`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/share/${report.shareCode}`}
              target="_blank"
              className="text-sm underline"
            >
              Public link
            </a>
            <CopyLinkButton url={`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/share/${report.shareCode}`} label="Copy" />
          </div>
        ) : null}
      </header>
      <section>
        <h2 className="text-xl font-medium mb-2">Executive Overview</h2>
        <p className="text-gray-700">Estimated revenue potential: £{revenue}</p>
        <p>
          <a href={`/reports/${report.id}/settings`} className="text-sm underline">Edit settings</a>
        </p>
        {safeSettings?.estimatedRevenuePerPostcode && (
          <p className="text-sm text-gray-600">Assumptions: £{safeSettings.estimatedRevenuePerPostcode} per postcode × {safeSettings.postcodesCount ?? 1} postcode(s)</p>
        )}
      </section>
      <section>
        <h2 className="text-xl font-medium mb-2">Businesses</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Address</th>
              </tr>
            </thead>
            <tbody>
              {(report.businesses ?? []).map((b: any) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{b.name}</td>
                  <td className="py-2 pr-4 capitalize">{b.category}</td>
                  <td className="py-2 pr-4">{b.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}


