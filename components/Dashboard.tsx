
import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { 
  TrendingUp, AlertTriangle, ArrowDownRight, DollarSign, 
  Package, ListChecks, Zap, Lightbulb, AlertCircle, Info,
  BarChart3, Truck
} from 'lucide-react';
import { SaleStatus, ExpenseCategory } from '../types';

const Dashboard: React.FC = () => {
  const { metrics, products, sales, expenses, settings } = useData();

  const lowStockItems = useMemo(() => 
    products.filter(p => p.stock < settings.lowStockThreshold && p.stock > 0), 
  [products, settings.lowStockThreshold]);

  const outOfStockItems = useMemo(() => 
    products.filter(p => p.stock <= 0), 
  [products]);

  const platformData = useMemo(() => {
    const activeSales = sales.filter(s => s.status === SaleStatus.COMPLETED);
    const tally: Record<string, number> = {};
    activeSales.forEach(s => {
      tally[s.platform] = (tally[s.platform] || 0) + s.revenue;
    });
    return Object.entries(tally).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const totalDeliveryLosses = useMemo(() => {
    return expenses
      .filter(e => e.category === ExpenseCategory.REFUND_LOSS)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const productPerformance = useMemo(() => {
    const activeSales = sales.filter(s => s.status === SaleStatus.COMPLETED);
    const performance: Record<string, { id: string; name: string; qty: number; revenue: number; profit: number }> = {};
    
    products.forEach(p => {
      performance[p.id] = { id: p.id, name: p.name, qty: 0, revenue: 0, profit: 0 };
    });

    activeSales.forEach(s => {
      if (performance[s.productId]) {
        performance[s.productId].qty += s.quantity;
        performance[s.productId].revenue += s.revenue;
        performance[s.productId].profit += s.profit;
      }
    });

    return Object.values(performance).sort((a, b) => b.revenue - a.revenue);
  }, [sales, products]);

  const recommendations = useMemo(() => {
    const now = new Date();
    const suggestions = [];
    const activeSales = sales.filter(s => s.status === SaleStatus.COMPLETED);

    const platformStats: Record<string, { revenue: number; profit: number }> = {};
    activeSales.forEach(s => {
      if (!platformStats[s.platform]) platformStats[s.platform] = { revenue: 0, profit: 0 };
      platformStats[s.platform].revenue += s.revenue;
      platformStats[s.platform].profit += s.profit;
    });

    const bestPlatform = Object.entries(platformStats)
      .map(([name, data]) => ({ name, margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0 }))
      .sort((a, b) => b.margin - a.margin)[0];

    if (bestPlatform) {
      suggestions.push({
        icon: <TrendingUp className="text-emerald-500" size={18} />,
        title: `Focus on ${bestPlatform.name}`,
        desc: `This platform has your best profit margin (${bestPlatform.margin.toFixed(1)}%). Consider increasing your presence there.`
      });
    }

    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    productPerformance.forEach(p => {
      const recentSales = activeSales.filter(s => s.productId === p.id && new Date(s.date) >= sixtyDaysAgo);
      const totalQty = recentSales.reduce((sum, s) => sum + s.quantity, 0);
      const velocity = totalQty / 60;

      if (velocity > 0) {
        const product = products.find(prod => prod.id === p.id);
        if (product) {
          const daysRemaining = product.stock / velocity;
          if (daysRemaining < 10 && product.stock > 0) {
            suggestions.push({
              icon: <Zap className="text-orange-500" size={18} />,
              title: `Restock Soon: ${product.name}`,
              desc: `High demand detected (${velocity.toFixed(1)} units/day). Current stock will last only ~${Math.round(daysRemaining)} days.`
            });
          }
        }
      }
    });

    productPerformance.forEach(p => {
      const product = products.find(prod => prod.id === p.id);
      if (product && product.stock > 10) {
        const lastSale = activeSales.filter(s => s.productId === p.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const daysSinceLastSale = lastSale ? (now.getTime() - new Date(lastSale.date).getTime()) / (1000 * 60 * 60 * 24) : 999;
        
        if (daysSinceLastSale > 25) {
          suggestions.push({
            icon: <Lightbulb className="text-indigo-500" size={18} />,
            title: `Boost Sales: ${product.name}`,
            desc: `Stock is high but haven't sold in ${Math.round(daysSinceLastSale)} days. Try a small discount or limited-time offer.`
          });
        }
      }
    });

    const expenseRatio = metrics.totalSales > 0 ? ((metrics.totalExpenses + metrics.totalPlatformFees) / metrics.totalSales) * 100 : 0;
    if (expenseRatio > 35) {
      suggestions.push({
        icon: <AlertCircle className="text-red-500" size={18} />,
        title: 'Reduce Operational Costs',
        desc: `Your expenses (including fees) are ${expenseRatio.toFixed(0)}% of revenue. Check for high delivery fees or advertising costs that aren't converting.`
      });
    }

    return suggestions.slice(0, 4);
  }, [sales, products, metrics, productPerformance]);

  const chartData = useMemo(() => {
    const days = 7;
    const data = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dailySales = sales.filter(s => s.date.startsWith(dateStr) && s.status === SaleStatus.COMPLETED);
      const dailyRevenue = dailySales.reduce((sum, s) => sum + s.revenue, 0);
      data.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dailyRevenue,
      });
    }
    return data;
  }, [sales]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      .format(val)
      .replace('$', settings.currencySymbol);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="p-5 space-y-6 pb-24">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Business Overview</p>
        </div>
        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
           {settings.currencySymbol}
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg shadow-emerald-100 col-span-2">
          <div className="flex items-center space-x-2 opacity-90 mb-1">
            <Package size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Total Inventory Value</span>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(metrics.stockValue)}</div>
        </div>

        <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg shadow-indigo-100 col-span-2">
          <div className="flex items-center space-x-2 opacity-90 mb-1">
            <DollarSign size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Net Profit</span>
          </div>
          <div className="text-3xl font-bold">{formatCurrency(metrics.netProfit)}</div>
        </div>

        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2 text-gray-500 mb-1">
            <TrendingUp size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Revenue</span>
          </div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(metrics.totalSales)}</div>
        </div>

        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
           <div className="flex items-center space-x-2 text-gray-500 mb-1">
            <ArrowDownRight size={16} className="text-red-500" />
            <span className="text-xs font-medium uppercase tracking-wider">Expenses</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(metrics.totalExpenses + metrics.totalPlatformFees)}</div>
          <p className="text-[9px] text-gray-400 mt-0.5">Includes {formatCurrency(metrics.totalPlatformFees)} in fees</p>
        </div>
      </div>

      {/* Refund Delivery Losses (Requested Component) */}
      {totalDeliveryLosses > 0 && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex justify-between items-center shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <Truck className="text-red-500" size={22} />
            <span className="text-sm font-bold text-red-900">Refund Delivery Losses</span>
          </div>
          <span className="text-lg font-bold text-red-600">
            {settings.currencySymbol}{totalDeliveryLosses.toFixed(2)}
          </span>
        </div>
      )}

      {/* Product Performance Table (Moved Above the Chart) */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-500" /> Top Products
          </h3>
          <span className="text-[10px] text-gray-400 font-medium">Ranked by Revenue</span>
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="py-2 text-[10px] font-bold text-gray-400 uppercase">Product</th>
                <th className="py-2 text-[10px] font-bold text-gray-400 uppercase text-center">Qty</th>
                <th className="py-2 text-[10px] font-bold text-gray-400 uppercase text-right">Revenue</th>
                <th className="py-2 text-[10px] font-bold text-gray-400 uppercase text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productPerformance.slice(0, 5).map((p) => (
                <tr key={p.id}>
                  <td className="py-3 text-xs font-medium text-gray-700 truncate max-w-[80px]">{p.name}</td>
                  <td className="py-3 text-xs font-bold text-gray-900 text-center">{p.qty}</td>
                  <td className="py-3 text-xs font-bold text-gray-900 text-right">{formatCurrency(p.revenue)}</td>
                  <td className="py-3 text-xs font-bold text-emerald-600 text-right">{formatCurrency(p.profit)}</td>
                </tr>
              ))}
              {productPerformance.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs text-gray-400 italic">No sales recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Sales Trend Chart (Now Below Performance) */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-emerald-500" /> 7-Day Sales Track
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                formatter={(val: number) => [formatCurrency(val), 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Platform Breakdown */}
      {platformData.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ListChecks size={16} className="text-indigo-500" /> Platform Breakdown
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Smart Recommendations Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Zap size={16} className="text-orange-500" /> Smart Recommendations
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {recommendations.length > 0 ? (
            recommendations.map((rec, i) => (
              <div key={i} className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="shrink-0 mt-0.5">{rec.icon}</div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">{rec.title}</h4>
                  <p className="text-[10px] text-indigo-700 mt-0.5 leading-tight">{rec.desc}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Info size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-400 italic">No urgent suggestions. Add more sales data to unlock insights!</p>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Alerts */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
             <AlertTriangle className="text-red-500" size={18} />
             <h3 className="font-semibold text-red-700 text-sm">Inventory Alerts</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {outOfStockItems.map(item => (
              <div key={item.id} className="p-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded-full">Out of Stock</span>
              </div>
            ))}
            {lowStockItems.map(item => (
              <div key={item.id} className="p-3 flex justify-between items-center">
                 <span className="text-sm font-medium text-gray-700">{item.name}</span>
                 <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">{item.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="h-4"></div>
    </div>
  );
};

export default Dashboard;
