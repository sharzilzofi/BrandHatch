
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
// Removed unused and non-existent SalesPlatform import
import { SaleStatus } from '../types';
import { Calendar, TrendingUp, Wallet, RefreshCcw, Download, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Reports: React.FC = () => {
  const { sales, expenses, settings } = useData();

  // Date Range State (Default to current month)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  // Filtered Data
  const filteredData = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const rangeSales = sales.filter(s => {
      const d = new Date(s.date);
      return d >= start && d <= end;
    });

    const rangeExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    return { sales: rangeSales, expenses: rangeExpenses };
  }, [sales, expenses, startDate, endDate]);

  // Calculated Metrics for Range
  const metrics = useMemo(() => {
    const activeSales = filteredData.sales.filter(s => s.status === SaleStatus.COMPLETED);
    const refundedSales = filteredData.sales.filter(s => s.status === SaleStatus.REFUNDED);

    const revenue = activeSales.reduce((sum, s) => sum + s.revenue, 0);
    const profit = activeSales.reduce((sum, s) => sum + s.profit, 0);
    const refunds = refundedSales.reduce((sum, s) => sum + s.revenue, 0);
    const totalExpenses = filteredData.expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = profit - totalExpenses;

    // Platform Breakdown
    const platformTally: Record<string, number> = {};
    activeSales.forEach(s => {
      platformTally[s.platform] = (platformTally[s.platform] || 0) + s.revenue;
    });
    const platformData = Object.entries(platformTally).map(([name, value]) => ({ name, value }));

    // Product Performance
    const productTally: Record<string, { qty: number; revenue: number }> = {};
    activeSales.forEach(s => {
      if (!productTally[s.productName]) productTally[s.productName] = { qty: 0, revenue: 0 };
      productTally[s.productName].qty += s.quantity;
      productTally[s.productName].revenue += s.revenue;
    });
    const topProducts = Object.entries(productTally)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return { revenue, profit, refunds, totalExpenses, netProfit, platformData, topProducts };
  }, [filteredData]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      .format(val)
      .replace('$', settings.currencySymbol);

  return (
    <div className="p-5 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Sales & Profit Analysis</p>
        </div>
        <button className="p-2 text-indigo-600 bg-indigo-50 rounded-lg">
          <Download size={20} />
        </button>
      </header>

      {/* Date Range Picker */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-center">
        <div className="flex-1">
          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">From</label>
          <input 
            type="date" 
            className="w-full text-sm border-none p-0 focus:ring-0 text-gray-700 font-medium"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="h-8 w-px bg-gray-100"></div>
        <div className="flex-1">
          <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">To</label>
          <input 
            type="date" 
            className="w-full text-sm border-none p-0 focus:ring-0 text-gray-700 font-medium"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Revenue</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(metrics.revenue)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Expenses</p>
          <p className="text-lg font-bold text-red-500">-{formatCurrency(metrics.totalExpenses)}</p>
        </div>
        <div className="bg-indigo-600 p-4 rounded-xl shadow-md col-span-2">
          <p className="text-[10px] uppercase font-bold text-indigo-200 mb-1">Net Profit</p>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-bold text-white">{formatCurrency(metrics.netProfit)}</p>
            <TrendingUp size={24} className="text-indigo-300 mb-1" />
          </div>
        </div>
      </div>

      {/* Platform Performance Chart */}
      {metrics.platformData.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <PieIcon size={16} className="text-indigo-500" /> Platform Breakdown
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {metrics.platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Products Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-800">Top Performing Products</h3>
          <TrendingUp size={16} className="text-green-500" />
        </div>
        <div className="divide-y divide-gray-50">
          {metrics.topProducts.length > 0 ? (
            metrics.topProducts.map((p, i) => (
              <div key={p.name} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.qty} units sold</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(p.revenue)}</p>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400 text-sm">
              No sales data for this range
            </div>
          )}
        </div>
      </div>

      <div className="h-4"></div>
    </div>
  );
};

export default Reports;
