'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts'

type SingleRow = { category: string; count: number; icon?: string }
export function SingleDistributionChart({ rows }: { rows: SingleRow[] }) {
  const data = rows
  return (
    <div className="w-full h-72">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="category" width={220} />
          <Tooltip formatter={(v: any, _n: any, p: any) => [String(v), p.payload.category]} />
          <Bar dataKey="count" fill="#16a34a">
            <LabelList dataKey="count" position="right" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

type MultiRow = { name: string } & Record<string, number>
export function MultiDistributionChart({ rows, categories, colors }: { rows: MultiRow[]; categories: string[]; colors: Record<string, string> }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
          <Tooltip formatter={(v: any, n: any) => [`${v}%`, n]} />
          <Legend />
          {categories.map((cat) => (
            <Bar key={cat} dataKey={cat} stackId="a" fill={colors[cat] || '#16a34a'} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}


