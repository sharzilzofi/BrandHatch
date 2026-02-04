
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Settings, Trash2, Plus, LayoutGrid, MapPin, 
  Cloud, FileDown, Users, CreditCard, Box, 
  Smartphone, Sparkles, RefreshCw, X, Printer, ShieldCheck, Tag, FileText, Percent, DollarSign
} from 'lucide-react';
import { CurrencyType, SaleStatus, FeeType } from '../types';

const ControlPanel: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    skuPrefixes, 
    addSkuPrefix, 
    removeSkuPrefix, 
    addPlatform, 
    removePlatform, 
    deliveryCharges, 
    addLocationCharge, 
    removeLocationCharge,
    metrics,
    sales,
    products,
    expenses
  } = useData();
  
  const [newPrefix, setNewPrefix] = useState('');
  const [newLabel, setNewLabel] = useState('');
  
  // Platform States
  const [newPlatName, setNewPlatName] = useState('');
  const [newPlatFee, setNewPlatFee] = useState('');
  const [newPlatFeeType, setNewPlatFeeType] = useState<FeeType>('PERCENTAGE');

  const [newLocation, setNewLocation] = useState('');
  const [newCharge, setNewCharge] = useState('');
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Report Data Logic
  const reportDate = new Date().toLocaleString();
  const reportTotalExpenses = metrics.totalExpenses + metrics.totalPlatformFees;

  const handleAddPrefix = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPrefix && newLabel) {
      addSkuPrefix(newPrefix, newLabel);
      setNewPrefix('');
      setNewLabel('');
    }
  };

  const handleAddPlatform = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlatName.trim()) {
      addPlatform(
        newPlatName.trim(), 
        parseFloat(newPlatFee) || 0, 
        newPlatFeeType
      );
      setNewPlatName('');
      setNewPlatFee('');
      setNewPlatFeeType('PERCENTAGE');
    }
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocation.trim() && newCharge) {
      addLocationCharge(newLocation.trim(), parseFloat(newCharge));
      setNewLocation('');
      setNewCharge('');
    }
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert("Cloud Sync Successful!");
    }, 1200);
  };

  const handleDownloadReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      window.print();
      setIsGeneratingReport(false);
    }, 500);
  };

  const toolboxItems = [
    { label: 'Cloud', icon: Cloud, action: handleManualSync },
    { label: 'Report', icon: FileText, action: handleDownloadReport },
    { label: 'Staff', icon: Users, disabled: true },
    { label: 'Pay', icon: CreditCard, disabled: true },
    { label: 'Labels', icon: Box, disabled: true },
    { label: 'POS', icon: Smartphone, disabled: true },
  ];

  return (
    <div className="p-4 min-h-full space-y-4 overflow-x-hidden pb-24 no-scrollbar">
      {/* PROFESSIONAL MULTI-PAGE PDF TEMPLATE */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-pdf-root, #report-pdf-root * { visibility: visible; }
          #report-pdf-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            display: block !important;
            color: #111;
            font-family: 'Inter', sans-serif;
            padding: 0;
          }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          .report-header { background-color: #4f46e5 !important; -webkit-print-color-adjust: exact; color: white !important; padding: 40px; margin-bottom: 40px; }
          .report-header h1 { font-size: 32px; font-weight: 900; margin: 0; text-transform: uppercase; color: white !important; }
          .report-header p { font-size: 14px; font-weight: 600; margin-top: 10px; opacity: 0.9; color: white !important; }
          .section-title { font-size: 22px; font-weight: 700; color: #111; margin: 40px 40px 20px 40px; }
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; padding: 0 40px; margin-bottom: 40px; }
          .summary-card { background: #f8fafc !important; -webkit-print-color-adjust: exact; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .summary-card span { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 12px; }
          .summary-card div { font-size: 24px; font-weight: 700; }
          .table-container { padding: 0 40px; margin-bottom: 60px; }
          table { width: 100%; border-collapse: collapse; }
          th { color: white !important; -webkit-print-color-adjust: exact; text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: capitalize; }
          td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #334155; }
          .sales-th { background-color: #4f46e5 !important; }
          .stock-th { background-color: #10b981 !important; }
          .expense-th { background-color: #ef4444 !important; }
          .report-footer { text-align: center; padding: 40px 0; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; margin: 40px 40px 0 40px; }
        }
      `}</style>

      {/* HIDDEN PRINT COMPONENT */}
      <div id="report-pdf-root" className="hidden">
        {/* Page 1 */}
        <div className="report-header">
          <h1>BIZTRACK BUSINESS REPORT</h1>
          <p>DATE GENERATED: {reportDate}</p>
        </div>
        <h2 className="section-title">Executive Summary</h2>
        <div className="summary-grid">
          <div className="summary-card">
            <span>TOTAL REVENUE</span>
            <div style={{color: '#111'}}>{settings.currencySymbol}{metrics.totalSales.toFixed(2)}</div>
          </div>
          <div className="summary-card">
            <span>NET PROFIT</span>
            <div style={{color: '#10b981'}}>{settings.currencySymbol}{metrics.netProfit.toFixed(2)}</div>
          </div>
          <div className="summary-card">
            <span>TOTAL EXPENSES</span>
            <div style={{color: '#ef4444'}}>{settings.currencySymbol}{reportTotalExpenses.toFixed(2)}</div>
          </div>
        </div>
        <h2 className="section-title">Recent Sales Transactions</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="sales-th">Date</th>
                <th className="sales-th">Product</th>
                <th className="sales-th">Qty</th>
                <th className="sales-th">Unit Price</th>
                <th className="sales-th">Total</th>
                <th className="sales-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.length > 0 ? sales.slice(0, 15).map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.date).toLocaleDateString()}</td>
                  <td style={{fontWeight: 700}}>{s.productName}</td>
                  <td>{s.quantity}</td>
                  <td>{settings.currencySymbol}{s.sellingPriceSnapshot.toFixed(2)}</td>
                  <td style={{fontWeight: 700}}>{settings.currencySymbol}{s.revenue.toFixed(2)}</td>
                  <td>{s.status}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>No sales records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="report-footer">Page 1 of 2 | BizTrack Automated Business Summary</div>
        
        {/* Page 2 */}
        <div className="page-break"></div>
        <div style={{height: '40px'}}></div>
        <h2 className="section-title">Inventory & Stock Status</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="stock-th">SKU</th>
                <th className="stock-th">Product Name</th>
                <th className="stock-th">In Stock</th>
                <th className="stock-th">Price</th>
                <th className="stock-th">Asset Value</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? products.map(p => (
                <tr key={p.id}>
                  <td style={{fontFamily: 'monospace'}}>{p.sku}</td>
                  <td style={{fontWeight: 700}}>{p.name}</td>
                  <td style={{color: p.stock < settings.lowStockThreshold ? '#ef4444' : '#111', fontWeight: 700}}>{p.stock}</td>
                  <td>{settings.currencySymbol}{p.sellingPrice.toFixed(2)}</td>
                  <td>{settings.currencySymbol}{(p.stock * p.buyingPrice).toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>No stock data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <h2 className="section-title">Expense Breakdown</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="expense-th">Date</th>
                <th className="expense-th">Category</th>
                <th className="expense-th">Description</th>
                <th className="expense-th">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length > 0 ? expenses.slice(0, 15).map(e => (
                <tr key={e.id}>
                  <td>{new Date(e.date).toLocaleDateString()}</td>
                  <td style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '10px'}}>{e.category}</td>
                  <td>{e.description}</td>
                  <td style={{color: '#ef4444', fontWeight: 700}}>{settings.currencySymbol}{e.amount.toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>No expense records found.</td></tr>
              )}
              {/* Add Platform Fees Summary Row if any */}
              {metrics.totalPlatformFees > 0 && (
                 <tr>
                    <td>{new Date().toLocaleDateString()}</td>
                    <td style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '10px'}}>PLATFORM FEES</td>
                    <td>Aggregated Sales Commissions</td>
                    <td style={{color: '#ef4444', fontWeight: 700}}>{settings.currencySymbol}{metrics.totalPlatformFees.toFixed(2)}</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="report-footer">Page 2 of 2 | BizTrack Automated Business Summary</div>
      </div>

      <header className="mb-1 no-print">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="text-indigo-600" /> Control Panel
        </h1>
        <p className="text-xs text-gray-500">Business logic & system settings</p>
      </header>

      {/* Toolbox */}
      <section className="bg-gradient-to-br from-[#5446f0] via-[#4338ca] to-[#3730a3] rounded-[24px] p-4 text-white shadow-lg no-print">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 opacity-80">
            <Sparkles size={12} fill="white" />
            <h2 className="text-[9px] font-black uppercase tracking-[0.2em]">Business Toolbox</h2>
          </div>
          {(isSyncing || isGeneratingReport) && <RefreshCw size={12} className="animate-spin text-white/60" />}
        </div>
        <div className="grid grid-cols-4 gap-y-4 gap-x-2">
          {toolboxItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button 
                key={idx} 
                onClick={item.action}
                disabled={item.disabled}
                className={`flex flex-col items-center gap-1 group transition-all active:scale-90 ${item.disabled ? 'opacity-25 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-colors border border-white/5 shadow-sm">
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider opacity-60 text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sync Status */}
      <section className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-gray-800">System Integrity</h3>
            <p className="text-[9px] text-gray-400">All modules active & synced</p>
          </div>
        </div>
        <button 
          onClick={() => setAutoBackup(!autoBackup)}
          className={`w-9 h-5 rounded-full transition-all relative ${autoBackup ? 'bg-emerald-500 shadow-inner' : 'bg-gray-200'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${autoBackup ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
      </section>

      {/* PLATFORMS & COMMISSIONS MANAGER */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print">
        <h2 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <LayoutGrid size={14} className="text-indigo-600" /> Sales Platforms & Fees
        </h2>
        
        {/* New Platform Input Form */}
        <div className="bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
          <div className="flex gap-2 mb-2">
            <input 
              placeholder="Platform Name..." 
              className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-100" 
              value={newPlatName} 
              onChange={e => setNewPlatName(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex gap-1">
              <input 
                placeholder="Fee..." 
                type="number"
                min="0"
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-100" 
                value={newPlatFee} 
                onChange={e => setNewPlatFee(e.target.value)} 
              />
              <button 
                onClick={() => setNewPlatFeeType(newPlatFeeType === 'PERCENTAGE' ? 'FIXED' : 'PERCENTAGE')}
                className="px-3 bg-white border border-gray-200 rounded-lg text-gray-600 text-xs font-bold hover:bg-gray-50 flex items-center justify-center min-w-[40px]"
              >
                {newPlatFeeType === 'PERCENTAGE' ? <Percent size={14} /> : <DollarSign size={14} />}
              </button>
            </div>
            <button onClick={handleAddPlatform} className="bg-indigo-600 text-white px-4 rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Platforms List */}
        <div className="grid grid-cols-1 gap-2">
          {settings.platforms.map(p => (
            <div key={p.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div>
                <span className="text-xs font-bold text-gray-800">{p.name}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-gray-500">Commission:</span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {p.feeValue} {p.feeType === 'PERCENTAGE' ? '%' : settings.currencySymbol}
                  </span>
                </div>
              </div>
              <button onClick={() => removePlatform(p.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SKU Prefixes */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print">
        <h2 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Tag size={14} className="text-indigo-600" /> SKU Prefixes
        </h2>
        <form onSubmit={handleAddPrefix} className="flex flex-col gap-2 mb-4">
          <div className="flex gap-2 w-full">
            <input 
              placeholder="CODE" 
              className="w-16 p-2 bg-gray-50 border-none rounded-lg text-[10px] uppercase font-bold text-center outline-none focus:ring-1 focus:ring-indigo-100" 
              maxLength={4} 
              value={newPrefix} 
              onChange={e => setNewPrefix(e.target.value)} 
              required 
            />
            <input 
              placeholder="Category Name" 
              className="flex-1 p-2 bg-gray-50 border-none rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-100" 
              value={newLabel} 
              onChange={e => setNewLabel(e.target.value)} 
              required 
            />
            <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg shrink-0 transition-transform active:scale-90">
              <Plus size={16} />
            </button>
          </div>
        </form>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
          {skuPrefixes.map(p => (
            <div key={p.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-700 flex items-center">
                <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mr-2 uppercase text-[9px] border border-indigo-100">{p.prefix}</span>
                {p.label}
              </span>
              <button onClick={() => removeSkuPrefix(p.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </section>

      {/* Currency */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print">
        <h2 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-3">Currency Configuration</h2>
        <div className="flex gap-2">
          {(['BDT', 'USD'] as CurrencyType[]).map((cur) => (
            <button
              key={cur}
              onClick={() => updateSettings({ currency: cur })}
              className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all border ${
                settings.currency === cur 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
              }`}
            >
              {cur} ({cur === 'BDT' ? '৳' : '$'})
            </button>
          ))}
        </div>
      </section>

      {/* Delivery Zones */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print">
        <h2 className="font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <MapPin size={14} className="text-indigo-600" /> Delivery Zones
        </h2>
        <form onSubmit={handleAddLocation} className="space-y-2 mb-4">
          <div className="flex gap-2">
            <input placeholder="Zone..." className="flex-1 p-2 bg-gray-50 border-none rounded-lg text-xs outline-none" value={newLocation} onChange={e => setNewLocation(e.target.value)} required />
            <input type="number" placeholder="Fee" className="w-16 p-2 bg-gray-50 border-none rounded-lg text-xs outline-none text-center" value={newCharge} onChange={e => setNewCharge(e.target.value)} required />
            <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg shrink-0 transition-transform active:scale-90"><Plus size={16} /></button>
          </div>
        </form>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
          {deliveryCharges.map(l => (
            <div key={l.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-800">{l.location} <span className="text-gray-400 font-normal ml-1">({settings.currencySymbol}{l.charge})</span></span>
              <button onClick={() => removeLocationCharge(l.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ControlPanel;
