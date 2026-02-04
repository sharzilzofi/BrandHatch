
import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { SaleStatus, AIAnalysisResult } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  TrendingUp, TrendingDown, Zap, Lightbulb, ArrowUpRight, 
  ArrowDownRight, ShoppingBag, PieChart as PieIcon, 
  BarChart3, AlertCircle, Info, Sparkles, Brain, Loader2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

const Analytics: React.FC = () => {
  const { sales, products, expenses, settings } = useData();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      .format(val)
      .replace('$', settings.currencySymbol);

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const activeSales = sales.filter(s => s.status === SaleStatus.COMPLETED);
    
    // Period Sales
    const currentPeriodSales = activeSales.filter(s => new Date(s.date) >= thirtyDaysAgo);
    const lastPeriodSales = activeSales.filter(s => new Date(s.date) >= sixtyDaysAgo && new Date(s.date) < thirtyDaysAgo);

    const currentRevenue = currentPeriodSales.reduce((sum, s) => sum + s.revenue, 0);
    const lastRevenue = lastPeriodSales.reduce((sum, s) => sum + s.revenue, 0);
    const revenueGrowth = lastRevenue === 0 ? 100 : ((currentRevenue - lastRevenue) / lastRevenue) * 100;

    // Period Expenses
    const currentExpenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo)
                                    .reduce((sum, e) => sum + e.amount, 0);
    
    // Product Performance (All Time)
    const productStats: Record<string, { qty: number; revenue: number; profit: number; lastSold?: Date }> = {};
    activeSales.forEach(s => {
      if (!productStats[s.productId]) {
        productStats[s.productId] = { qty: 0, revenue: 0, profit: 0 };
      }
      productStats[s.productId].qty += s.quantity;
      productStats[s.productId].revenue += s.revenue;
      productStats[s.productId].profit += s.profit;
      const saleDate = new Date(s.date);
      if (!productStats[s.productId].lastSold || saleDate > productStats[s.productId].lastSold!) {
        productStats[s.productId].lastSold = saleDate;
      }
    });

    const performanceList = Object.entries(productStats).map(([id, data]) => {
      const p = products.find(prod => prod.id === id);
      return { id, name: p?.name || 'Deleted Product', ...data, currentStock: p?.stock || 0 };
    });

    const bestByQty = [...performanceList].sort((a, b) => b.qty - a.qty).slice(0, 5);
    const bestByProfit = [...performanceList].sort((a, b) => b.profit - a.profit).slice(0, 5);
    const worstSellers = performanceList.filter(p => p.currentStock > 0).sort((a, b) => a.qty - b.qty).slice(0, 5);

    // Platform Analysis
    const platformStats: Record<string, { revenue: number; profit: number }> = {};
    activeSales.forEach(s => {
      if (!platformStats[s.platform]) platformStats[s.platform] = { revenue: 0, profit: 0 };
      platformStats[s.platform].revenue += s.revenue;
      platformStats[s.platform].profit += s.profit;
    });
    const platformData = Object.entries(platformStats).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      margin: (data.profit / data.revenue) * 100
    }));

    // Daily Trend (Last 14 days)
    const trend = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const daySales = activeSales.filter(s => s.date.startsWith(d));
      trend.push({
        date: d.split('-').slice(1).join('/'),
        revenue: daySales.reduce((sum, s) => sum + s.revenue, 0),
        profit: daySales.reduce((sum, s) => sum + s.profit, 0)
      });
    }

    // Suggestions Logic
    const suggestions = [];

    // 1. High Velocity / Low Stock
    performanceList.forEach(p => {
      const velocity = p.qty / 60; // units per day over last 60 days
      if (velocity > 0) {
        const daysRemaining = p.currentStock / velocity;
        if (daysRemaining < 7 && p.currentStock > 0) {
          suggestions.push({
            type: 'warning',
            icon: <Zap className="text-orange-500" size={18} />,
            title: `Restock Soon: ${p.name}`,
            desc: `Selling ${velocity.toFixed(1)} units/day. You'll run out in ~${Math.round(daysRemaining)} days.`
          });
        }
      }
    });

    // 2. Dead Stock
    performanceList.forEach(p => {
      if (p.currentStock > 5) {
        const daysSinceLastSale = p.lastSold ? (now.getTime() - p.lastSold.getTime()) / (1000 * 60 * 60 * 24) : 999;
        if (daysSinceLastSale > 20) {
          suggestions.push({
            type: 'promo',
            icon: <Lightbulb className="text-indigo-500" size={18} />,
            title: `Slow Mover: ${p.name}`,
            desc: `No sales in ${Math.round(daysSinceLastSale)} days. Try a 10% discount to clear stock.`
          });
        }
      }
    });

    // 3. Efficiency
    const expenseRatio = currentRevenue > 0 ? (currentExpenses / currentRevenue) * 100 : 0;
    if (expenseRatio > 30) {
      suggestions.push({
        type: 'info',
        icon: <AlertCircle className="text-red-500" size={18} />,
        title: 'High Expense Ratio',
        desc: `Expenses are ${expenseRatio.toFixed(1)}% of your revenue. Check if delivery or ads are over-budget.`
      });
    }

    return { 
      currentRevenue, 
      revenueGrowth, 
      trend, 
      bestByQty, 
      bestByProfit, 
      worstSellers, 
      platformData, 
      suggestions 
    };
  }, [sales, products, expenses]);

  const generateAIInsights = async () => {
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Data Preparation
      const productData = products.map(p => ({
        name: p.name,
        cost: p.buyingPrice,
        price: p.sellingPrice,
        stock: p.stock
      }));

      const salesSummary = sales.filter(s => s.status === SaleStatus.COMPLETED).slice(0, 50).map(s => ({
        product: s.productName,
        platform: s.platform,
        qty: s.quantity,
        revenue: s.revenue,
        profit: s.profit,
        date: s.date
      }));

      const expenseSummary = expenses.slice(0, 30).map(e => ({
        category: e.category,
        amount: e.amount
      }));

      const promptData = JSON.stringify({
        currency: settings.currency,
        products: productData,
        recentSales: salesSummary,
        recentExpenses: expenseSummary
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a business analyst AI. Here is the business data: ${promptData}. 
        Analyze it and provide:
        1. Top 3 products to focus on.
        2. Pricing suggestions (Increase/Decrease/Correct).
        3. Marketing advice.
        4. Expense optimizations.
        5. Inventory guidance.
        6. A general analysis summary.
        Provide specific, actionable advice based on the numbers.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topFocusProducts: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { productName: {type: Type.STRING}, reason: {type: Type.STRING} } }
              },
              pricingAdjustments: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { productName: {type: Type.STRING}, suggestedAction: {type: Type.STRING}, reason: {type: Type.STRING} } }
              },
              marketingStrategy: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              expenseOptimization: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              inventoryActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              generalAnalysis: {
                type: Type.STRING
              }
            }
          }
        }
      });

      if (response.text) {
        setAiResult(JSON.parse(response.text));
      }
    } catch (error) {
      console.error("AI Generation Error", error);
      alert("Failed to generate insights. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-5 space-y-6 pb-24">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" /> Smart Insights
          </h1>
          <p className="text-xs text-gray-500">Analytics & Actionable Suggestions</p>
        </div>
        <button 
          onClick={generateAIInsights}
          disabled={aiLoading}
          className="bg-indigo-600 text-white px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
          {aiLoading ? 'Analyzing...' : 'AI Analyst'}
        </button>
      </header>

      {/* AI Results Section */}
      {aiResult && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-4 border-b border-indigo-100 pb-3">
            <Sparkles size={18} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">AI Strategic Report</h2>
          </div>
          
          <div className="space-y-6">
            {/* Top Focus */}
            <div>
               <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Top 3 Focus Products</h3>
               <div className="space-y-2">
                 {aiResult.topFocusProducts.map((p, i) => (
                   <div key={i} className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                     <div className="font-bold text-indigo-700 text-sm">{p.productName}</div>
                     <div className="text-[11px] text-gray-600 leading-snug mt-1">{p.reason}</div>
                   </div>
                 ))}
               </div>
            </div>

            {/* Pricing Actions */}
            {aiResult.pricingAdjustments.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Pricing Opportunities</h3>
                <div className="grid gap-2">
                  {aiResult.pricingAdjustments.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100">
                      <div>
                        <div className="font-bold text-gray-800 text-xs">{item.productName}</div>
                        <div className="text-[10px] text-gray-500">{item.reason}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                        item.suggestedAction.toLowerCase().includes('increase') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.suggestedAction}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategic Advice Grid */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100">
                <h3 className="text-xs font-bold text-orange-600 uppercase mb-2 flex items-center gap-1">
                  <TrendingUp size={14} /> Marketing
                </h3>
                <ul className="list-disc pl-4 space-y-1">
                  {aiResult.marketingStrategy.map((str, i) => (
                    <li key={i} className="text-[11px] text-gray-600">{str}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-gray-100">
                <h3 className="text-xs font-bold text-emerald-600 uppercase mb-2 flex items-center gap-1">
                  <ArrowDownRight size={14} /> Cost Saving
                </h3>
                <ul className="list-disc pl-4 space-y-1">
                  {aiResult.expenseOptimization.map((str, i) => (
                    <li key={i} className="text-[11px] text-gray-600">{str}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* General Analysis */}
            <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-md">
              <h3 className="text-xs font-bold text-indigo-200 uppercase mb-2">Executive Summary</h3>
              <p className="text-xs leading-relaxed opacity-90">{aiResult.generalAnalysis}</p>
            </div>
          </div>
        </div>
      )}

      {/* Growth Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">30D Revenue</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">{formatCurrency(stats.currentRevenue)}</span>
            <div className={`flex items-center text-xs font-bold ${stats.revenueGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {stats.revenueGrowth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(stats.revenueGrowth).toFixed(0)}%
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Top Platform</p>
          <div className="text-sm font-bold text-indigo-600 truncate">
            {stats.platformData.sort((a,b) => b.revenue - a.revenue)[0]?.name || 'N/A'}
          </div>
          <p className="text-[10px] text-gray-400">By Sales Volume</p>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-500" /> 14-Day Sales Trend
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.trend}>
              <XAxis dataKey="date" tick={{fontSize: 9}} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                formatter={(val: number) => [formatCurrency(val), 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Smart Suggestions (Legacy/Static) */}
      {!aiResult && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Zap size={16} className="text-orange-500" /> Recommendations
          </h3>
          {stats.suggestions.length > 0 ? (
            stats.suggestions.map((s, i) => (
              <div key={i} className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl flex gap-3">
                <div className="shrink-0 mt-0.5">{s.icon}</div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">{s.title}</h4>
                  <p className="text-[10px] text-indigo-700 mt-0.5 leading-tight">{s.desc}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Info size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-400 italic">No urgent suggestions. Keep it up!</p>
            </div>
          )}
        </div>
      )}

      {/* Best Sellers */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag size={16} className="text-indigo-500" /> Best Sellers
          </h3>
          <span className="text-[10px] text-gray-400 font-medium">By Quantity</span>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.bestByQty.map((p, i) => (
            <div key={p.id} className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 w-4">#{i+1}</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{p.name}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Profit: {formatCurrency(p.profit)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900">{p.qty} sold</p>
                <p className="text-[9px] text-gray-400">{p.currentStock} in stock</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Margin Analysis */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <PieIcon size={16} className="text-indigo-500" /> Platform Profitability
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.platformData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{fontSize: 10}} width={60} axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={(val: number) => [val.toFixed(1) + '%', 'Profit Margin']}
                cursor={{fill: 'transparent'}}
              />
              <Bar dataKey="margin" radius={[0, 4, 4, 0]}>
                {stats.platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.margin > 30 ? '#10b981' : '#4f46e5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2 italic">Bars show profit margin % per platform</p>
      </div>

      {/* Underperforming Assets */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-red-50/30 border-b border-red-100">
          <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
             <TrendingDown size={16} /> Attention Needed
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.worstSellers.map(p => (
            <div key={p.id} className="p-3 flex justify-between items-center bg-white">
              <span className="text-xs font-medium text-gray-700">{p.name}</span>
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">Only {p.qty} sold</span>
            </div>
          ))}
          {stats.worstSellers.length === 0 && (
            <div className="p-4 text-center text-[10px] text-gray-400">All inventory is moving well.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
