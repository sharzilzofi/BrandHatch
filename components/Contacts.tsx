
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Supplier, Customer, SaleStatus } from '../types';
import { Plus, X, Search, Phone, MapPin, User, Briefcase, Trash2, Edit2, ShoppingBag } from 'lucide-react';

const Contacts: React.FC = () => {
  const { suppliers, customers, sales, settings, addSupplier, updateSupplier, deleteSupplier, addCustomer, updateCustomer, deleteCustomer } = useData();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'customers'>('suppliers');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<Supplier | Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contact: '', // Used for supplier contact or customer phone
    category: '', // Used for supplier category
    address: '', // Used for customer address
    notes: ''
  });

  const handleOpenModal = (item?: Supplier | Customer) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        contact: 'contact' in item ? item.contact : (item as Customer).phone,
        category: 'category' in item ? item.category : '',
        address: 'address' in item ? item.address : '',
        notes: item.notes
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', contact: '', category: '', address: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'suppliers') {
      const payload = { 
        name: formData.name, 
        contact: formData.contact, 
        category: formData.category || 'General', 
        notes: formData.notes 
      };
      if (editingItem) updateSupplier(editingItem.id, payload);
      else addSupplier(payload);
    } else {
      const payload = { 
        name: formData.name, 
        phone: formData.contact, 
        address: formData.address, 
        notes: formData.notes 
      };
      if (editingItem) updateCustomer(editingItem.id, payload);
      else addCustomer(payload);
    }
    setIsModalOpen(false);
  };

  const getCustomerStats = (phone: string) => {
    if (!phone) return { orders: 0, total: 0, refunds: 0 };
    const customerSales = sales.filter(s => s.customerPhone === phone);
    const orders = customerSales.length;
    const total = customerSales.reduce((sum, s) => sum + s.revenue, 0);
    const refunds = customerSales.filter(s => s.status === SaleStatus.REFUNDED).length;
    return { orders, total, refunds };
  };

  const filteredItems = activeTab === 'suppliers' 
    ? suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 min-h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-xs text-gray-500">Suppliers & Customers</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white p-2 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* Search & Tabs */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => { setActiveTab('suppliers'); setSearchTerm(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'suppliers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
          >
            Suppliers ({suppliers.length})
          </button>
          <button 
            onClick={() => { setActiveTab('customers'); setSearchTerm(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'customers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
          >
            Customers ({customers.length})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">No {activeTab} found.</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const isCustomer = 'phone' in item;
            const stats = isCustomer ? getCustomerStats((item as Customer).phone) : null;
            
            return (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      {activeTab === 'suppliers' ? <Briefcase size={14} className="text-indigo-500" /> : <User size={14} className="text-emerald-500" />}
                      {item.name}
                    </h3>
                    {'category' in item && <p className="text-[10px] text-indigo-600 font-bold uppercase mt-0.5">{item.category}</p>}
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => handleOpenModal(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 rounded-lg"><Edit2 size={14}/></button>
                     <button onClick={() => activeTab === 'suppliers' ? deleteSupplier(item.id) : deleteCustomer(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg"><Trash2 size={14}/></button>
                  </div>
                </div>
                
                <div className="space-y-1.5 mt-3">
                  <div className="flex items-center text-xs text-gray-600 gap-2">
                    <Phone size={12} className="text-gray-400" />
                    <span>{'contact' in item ? item.contact : (item as Customer).phone || 'No phone'}</span>
                  </div>
                  {'address' in item && item.address && (
                    <div className="flex items-start text-xs text-gray-600 gap-2">
                      <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                      <span className="leading-tight">{item.address}</span>
                    </div>
                  )}
                </div>

                {isCustomer && stats && (
                  <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-3 gap-2">
                     <div className="text-center">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold">Orders</span>
                        <span className="text-xs font-bold text-gray-800">{stats.orders}</span>
                     </div>
                     <div className="text-center border-l border-gray-100">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold">Spent</span>
                        <span className="text-xs font-bold text-indigo-600">{settings.currencySymbol}{stats.total.toFixed(0)}</span>
                     </div>
                     <div className="text-center border-l border-gray-100">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold">Refunds</span>
                        <span className="text-xs font-bold text-red-500">{stats.refunds}</span>
                     </div>
                  </div>
                )}

                {item.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded-lg text-[10px] text-gray-500 border-l-2 border-indigo-200 italic">
                    "{item.notes}"
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">{editingItem ? 'Edit' : 'Add'} {activeTab === 'suppliers' ? 'Supplier' : 'Customer'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input required type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contact / Phone</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
              </div>

              {activeTab === 'suppliers' ? (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <input placeholder="e.g. Wholesaler, Manufacturer" type="text" className="w-full p-2 border border-gray-300 rounded-lg text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Address</label>
                  <textarea rows={2} className="w-full p-2 border border-gray-300 rounded-lg text-sm" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} className="w-full p-2 border border-gray-300 rounded-lg text-sm" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-md transition-all">
                {editingItem ? 'Update' : 'Save'} Contact
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
