
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Sale, SaleStatus } from '../types';
import { Plus, X, Calendar, RefreshCcw, Edit2, MapPin, Truck, Check, Trash2, AlertTriangle, User } from 'lucide-react';

const Sales: React.FC = () => {
  const { products, sales, addSale, updateSale, deleteSale, refundSale, settings, deliveryCharges } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [saleToRefund, setSaleToRefund] = useState<Sale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '1',
    unitPrice: '',
    platform: settings.platforms.length > 0 ? settings.platforms[0].name : 'Offline',
    location: '',
    deliveryCharge: '0',
    paidByCustomer: true,
    date: new Date().toISOString().split('T')[0],
    customerPhone: ''
  });

  const handleOpenModal = (sale?: Sale) => {
    if (sale) {
      setEditingSale(sale);
      setFormData({
        productId: sale.productId,
        quantity: sale.quantity.toString(),
        unitPrice: sale.sellingPriceSnapshot.toString(),
        platform: sale.platform,
        location: sale.location || '',
        deliveryCharge: (sale.deliveryCharge || 0).toString(),
        paidByCustomer: sale.paidByCustomer ?? true,
        date: new Date(sale.date).toISOString().split('T')[0],
        customerPhone: sale.customerPhone || ''
      });
    } else {
      setEditingSale(null);
      setFormData({
        productId: products.length > 0 ? products[0].id : '',
        quantity: '1',
        unitPrice: products.length > 0 ? products[0].sellingPrice.toString() : '',
        platform: settings.platforms.length > 0 ? settings.platforms[0].name : 'Offline',
        location: '',
        deliveryCharge: '0',
        paidByCustomer: true,
        date: new Date().toISOString().split('T')[0],
        customerPhone: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setFormData(prev => ({
      ...prev,
      productId,
      unitPrice: product ? product.sellingPrice.toString() : prev.unitPrice
    }));
  };

  const handleLocationChange = (locationName: string) => {
    const loc = deliveryCharges.find(l => l.location === locationName);
    setFormData(prev => ({
      ...prev,
      location: locationName,
      deliveryCharge: loc ? loc.charge.toString() : '0'
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        productId: formData.productId,
        quantity: parseInt(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
        platform: formData.platform,
        location: formData.location,
        deliveryCharge: parseFloat(formData.deliveryCharge) || 0,
        paidByCustomer: formData.paidByCustomer,
        date: new Date(formData.date).toISOString(),
        customerPhone: formData.customerPhone
      };

      if (editingSale) {
        updateSale(editingSale.id, payload as any);
      } else {
        addSale(payload as any);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Error saving sale. Check console for details.");
    }
  };

  const handleInitiateRefund = (sale: Sale) => {
    if (sale.paidByCustomer) {
      refundSale(sale.id, true);
    } else {
      setSaleToRefund(sale);
      setIsRefundModalOpen(true);
    }
  };

  const confirmRefund = (deliveryPaid: boolean) => {
    if (saleToRefund) {
      refundSale(saleToRefund.id, deliveryPaid);
      setIsRefundModalOpen(false);
      setSaleToRefund(null);
    }
  };

  const confirmDelete = () => {
    if (saleToDelete) {
      deleteSale(saleToDelete);
      setSaleToDelete(null);
    }
  };

  const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-4 min-h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
           <p className="text-xs text-gray-500">{sales.length} transactions total</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          disabled={products.length === 0}
          className="bg-indigo-600 text-white p-2 rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
        >
          <Plus size={24} />
        </button>
      </header>

      <div className="space-y-4">
         {sortedSales.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>No sales recorded yet.</p>
          </div>
        ) : (
          sortedSales.map(sale => (
            <div key={sale.id} className={`bg-white p-4 rounded-xl shadow-sm border ${sale.status === SaleStatus.REFUNDED ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                    {sale.productName}
                    {sale.status === SaleStatus.REFUNDED && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">Refunded</span>
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center text-[10px] text-gray-500 mt-1 gap-2">
                    <span className="flex items-center"><Calendar size={10} className="mr-1"/> {new Date(sale.date).toLocaleDateString()}</span>
                    <span className="flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold">{sale.platform}</span>
                    {sale.location && (
                      <span className="flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
                        <MapPin size={8} className="mr-1"/> {sale.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <span className={`block text-lg font-bold ${sale.status === SaleStatus.REFUNDED ? 'text-gray-400 line-through' : 'text-indigo-600'}`}>
                    {settings.currencySymbol}{sale.revenue.toFixed(2)}
                  </span>
                  {sale.customerPhone && (
                     <span className="text-[9px] text-gray-400 block font-medium flex items-center justify-end gap-1">
                       <User size={8} /> {sale.customerPhone}
                     </span>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between items-center text-xs text-gray-600">
                 <div>
                    <span className="mr-3">Qty: {sale.quantity}</span>
                    <span>Profit: <span className={sale.profit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{settings.currencySymbol}{sale.profit.toFixed(2)}</span></span>
                 </div>
                 <div className="flex gap-3">
                   {sale.status !== SaleStatus.REFUNDED && (
                     <>
                      <button 
                        onClick={() => handleOpenModal(sale)}
                        className="text-[10px] flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold uppercase"
                      >
                        <Edit2 size={10} /> Edit
                      </button>
                      <button 
                        onClick={() => handleInitiateRefund(sale)}
                        className="text-[10px] flex items-center gap-1 text-orange-500 hover:text-orange-700 font-bold uppercase"
                      >
                        <RefreshCcw size={10} /> Refund
                      </button>
                     </>
                   )}
                   <button 
                      onClick={() => setSaleToDelete(sale.id)}
                      className="text-[10px] flex items-center gap-1 text-red-500 hover:text-red-700 font-bold uppercase"
                    >
                      <Trash2 size={10} /> Delete
                   </button>
                 </div>
              </div>
              {sale.status === SaleStatus.REFUNDED && !sale.deliveryPaidOnRefund && (
                <div className="mt-2 text-[9px] text-red-500 font-bold uppercase tracking-tight">
                  Loss: delivery charge ({settings.currencySymbol}{sale.deliveryCharge.toFixed(2)}) not recovered.
                </div>
              )}
            </div>
          ))
        )}
      </div>

       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">{editingSale ? 'Edit Sale' : 'Record Sale'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                  value={formData.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.stock} in stock)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" className="w-full p-2 border border-gray-300 rounded-lg text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Platform</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                    value={formData.platform}
                    onChange={(e) => setFormData({...formData, platform: e.target.value})}
                  >
                    {settings.platforms.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  Customer Phone <span className="text-[10px] text-indigo-500 font-bold uppercase">(Auto-Link)</span>
                </label>
                <input 
                  type="tel" 
                  placeholder="e.g. 01700000000"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  value={formData.customerPhone} 
                  onChange={e => setFormData({...formData, customerPhone: e.target.value})} 
                />
                <p className="text-[9px] text-gray-400 mt-1">If number doesn't exist, a new contact will be created.</p>
              </div>

              {/* Delivery Details Card */}
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                  <Truck size={14} />
                  <span>Delivery Details</span>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Location Zone</label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                  >
                    <option value="">Select Location</option>
                    {deliveryCharges.map(l => (
                      <option key={l.id} value={l.location}>{l.location}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Charge</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={formData.deliveryCharge} 
                      onChange={e => setFormData({...formData, deliveryCharge: e.target.value})} 
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2.5 select-none cursor-pointer" onClick={() => setFormData({...formData, paidByCustomer: !formData.paidByCustomer})}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${formData.paidByCustomer ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                      {formData.paidByCustomer && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-xs font-bold text-gray-600">Paid by Customer?</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
                  <input required type="number" min="1" className="w-full p-2 border border-gray-300 rounded-lg text-sm" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                  <input required type="number" step="0.01" min="0" className="w-full p-2 border border-gray-300 rounded-lg text-sm" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} />
                </div>
              </div>
              
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl mt-2 hover:bg-indigo-700 shadow-lg active:scale-[0.98] transition-all">
                {editingSale ? 'Update Sale' : 'Confirm Sale'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isRefundModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 animate-in zoom-in fade-in duration-200">
             <h2 className="text-lg font-bold text-gray-900 mb-2">Process Refund</h2>
             <p className="text-sm text-gray-600 mb-6">Did the customer pay for the delivery charge ({settings.currencySymbol}{saleToRefund?.deliveryCharge.toFixed(2)})?</p>
             
             <div className="space-y-3">
               <button 
                onClick={() => confirmRefund(true)}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-all"
               >
                 Yes, Paid (No Loss)
               </button>
               <button 
                onClick={() => confirmRefund(false)}
                className="w-full py-3 bg-red-500 text-white font-bold rounded-xl shadow-md hover:bg-red-600 transition-all"
               >
                 No, Deduct from Refund (Loss)
               </button>
               <button 
                onClick={() => setIsRefundModalOpen(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
               >
                 Cancel
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {saleToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in fade-in duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
              <p className="text-sm text-gray-500 mt-2">
                Are you sure you want to delete this sale? 
                <br/>
                <span className="text-xs text-indigo-600 font-medium mt-1 block">
                   Stock will be returned to inventory.
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setSaleToDelete(null)} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-md"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
