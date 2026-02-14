'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface TrendDataPoint {
  date: string;
  count: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface SecurityData {
  range: string;
  count: number;
}

interface ChartsProps {
  uploadTrend: TrendDataPoint[];
  downloadTrend: TrendDataPoint[];
  categoryDistribution: CategoryData[];
  securityDistribution: SecurityData[];
}

export function Charts({
  uploadTrend,
  downloadTrend,
  categoryDistribution,
  securityDistribution,
}: ChartsProps) {
  return (
    <>
      {/* Trend Charts */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Upload Trend (30 Days)</h3>
          <p className="text-sm text-gray-500 mb-4">New skill versions uploaded</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={uploadTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => value.slice(5)}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Download Trend (30 Days)</h3>
          <p className="text-sm text-gray-500 mb-4">Daily download activity</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={downloadTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => value.slice(5)}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category and Security Distribution */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Skills by Category</h3>
          <p className="text-sm text-gray-500 mb-4">Distribution of skills across categories</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Security Score Distribution</h3>
          <p className="text-sm text-gray-500 mb-4">Distribution of security scan scores</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={securityDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
