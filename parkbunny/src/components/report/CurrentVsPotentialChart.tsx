'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts'

export function SingleLocationChart({ current, uplift }: { current: number; uplift: number }) {
  const data = [
    { name: 'Current', Current: current },
    { name: 'Potential', Current: current, Uplift: uplift },
  ]
  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(v) => `£${Math.round(v/1000)}k`} />
          <Tooltip formatter={(v: any) => [`£${Math.round(Number(v)).toLocaleString('en-GB')}`, '']} />
          <Legend />
          <Bar dataKey="Current" stackId="a" fill="#64748b" />
          <Bar dataKey="Uplift" stackId="a" fill="#16a34a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MultiLocationChart({ rows }: { rows: { postcode: string; current: number; uplift: number }[] }) {
  const data = rows.map((r) => ({ name: r.postcode, Current: r.current, Potential: r.current + r.uplift }))
  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(v) => `£${Math.round(v/1000)}k`} />
          <Tooltip formatter={(v: any) => [`£${Math.round(Number(v)).toLocaleString('en-GB')}`, '']} />
          <Legend />
          <Bar dataKey="Current" fill="#64748b" />
          <Bar dataKey="Potential" fill="#16a34a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryContributionChart({ rows }: { rows: { category: string; value: number }[] }) {
  const data = rows
  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v) => `£${Math.round(v/1000)}k`} />
          <YAxis type="category" dataKey="category" width={160} />
          <Tooltip formatter={(v: any) => [`£${Math.round(Number(v)).toLocaleString('en-GB')}`, '']} />
          <Bar dataKey="value" fill="#16a34a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}


