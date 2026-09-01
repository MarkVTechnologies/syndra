"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface FunnelPoint {
  date: string;
  views: number;
  clicks: number;
  leads: number;
}

export function FunnelChart({ data }: { data: FunnelPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Views → clicks → referrals</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="views" name="Views" stroke="var(--color-info)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="clicks" name="WhatsApp clicks" stroke="var(--color-emerald-600)" strokeWidth={2} dot={false} />
            {/* Distinct from "WhatsApp clicks" below — --color-brass-500 and
                --color-emerald-600 both alias to the same estate-amber-600
                hex post-redesign, which made these two lines indistinguishable. */}
            <Line type="monotone" dataKey="leads" name="Referrals" stroke="var(--color-success)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
