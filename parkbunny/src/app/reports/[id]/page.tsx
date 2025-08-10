import { calculateRevenuePotential, defaultSettings } from "@/lib/calculations";

async function getReport(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/reports/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function ReportViewPage({ params }: { params: { id: string } }) {
  const report = await getReport(params.id);
  if (!report) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-semibold">Report not found</h1>
      </main>
    );
  }

  const revenue = calculateRevenuePotential(report.businesses ?? [], defaultSettings);

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{report.name}</h1>
          <p className="text-sm text-gray-600">Postcodes: {report.postcodes}</p>
        </div>
      </header>
      <section>
        <h2 className="text-xl font-medium mb-2">Executive Overview</h2>
        <p className="text-gray-700">Estimated revenue potential: £{revenue}</p>
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
    </main>
  );
}


