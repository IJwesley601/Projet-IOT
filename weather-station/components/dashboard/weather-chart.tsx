"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface WeatherChartProps {
  data: any[]
  dataKey: string
  color: string
  unit: string
}

export default function WeatherChart({ data, dataKey, color, unit }: WeatherChartProps) {
  // Format timestamp for display
  const formattedData = data.map((item) => ({
    ...item,
    time: new Date(item.timestamp.seconds * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }))

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "0.375rem",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value: number) => [
              `${value.toFixed(1)} ${unit}`,
              dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
            ]}
            labelFormatter={(time) => `${time}`}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color, strokeWidth: 1 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

