import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Search, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { Product } from '../types';

const Inventory: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, settings, skuPrefixes } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    skuPrefix: '',
    skuCode: '',
    buyingPrice: '',
    sellingPrice: '',
    stock: ''
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const parts = product.sku.split('-');
      const prefix = parts.length > 1 ? parts[0] : '';
      const code = parts.length > 1 ? parts.slice(1).join('-') : product.sku;

      setFormData({
        name: product.name,
        skuPrefix: prefix,
        skuCode: code,
        buyingPrice: product.buyingPrice.toString(),
        sellingPrice: product.sellingPrice.toString(),
        stock: product.stock.toString()
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
        name: '', 
        skuPrefix: skuPrefixes.length > 0 ? skuPrefixes[0].prefix : '', 
        skuCode: '', 
        buyingPrice: '', 
        sellingPrice: '', 
        stock: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalSku = formData.skuCode;
    if (formData.skuPrefix) {
      finalSku = `${formData.skuPrefix}-${formData.skuCode}`;
    }

    const payload = {
      name: formData.name,
      sku: finalSku,
      buyingPrice: parseFloat(formData.buyingPrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      stock: parseInt(formData.stock),
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete);
      setProductToDelete(null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 min-h-full relative">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <button 
          type="button"
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white p-2 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={24} className="pointer-events-none" />
        </button>
      </header>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search products or SKU..."
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Product List */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>No products found.</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:border-indigo-100">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-1">SKU: {product.sku}</p>
                <div className="flex gap-3 text-sm mt-2">
                  <span className="text-gray-600">Stock: <span className={`font-bold ${product.stock < settings.lowStockThreshold ? 'text-red-500' : 'text-gray-900'}`}>{product.stock}</span></span>
                  <span className="text-gray-600">Price: <span className="font-bold">{settings.currencySymbol}{product.sellingPrice}</span></span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button 
                  type="button"
                  onClick={() => handleOpenModal(product)}
                  className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 bg-gray-50 rounded-xl transition-colors"
                  aria-label="Edit product"
                >
                  <Edit2 size={20} className="pointer-events-none" />
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProductToDelete(product.id);
                  }}
                  className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-gray-50 rounded-xl transition-colors"
                  aria-label="Delete product"
                >
                  <Trash2 size={20} className="pointer-events-none" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 p-1">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label>
                <input required type="text" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <label className="block text-xs font-medium text-gray-700 mb-2">SKU Code Construction</label>
                <div className="flex gap-2">
                  <select 
                     className="w-1/3 p-2 border border-gray-300 rounded-lg bg-white"
                     value={formData.skuPrefix}
                     onChange={e => setFormData({...formData, skuPrefix: e.target.value})}
                  >
                    <option value="">None</option>
                    {skuPrefixes.map(p => <option key={p.id} value={p.prefix}>{p.prefix}</option>)}
                  </select>
                  <input 
                    placeholder="Code (e.g. 001)"
                    required type="text" 
                    className="flex-1 p-2 border border-gray-300 rounded-lg" 
                    value={formData.skuCode} 
                    onChange={e => setFormData({...formData, skuCode: e.target.value})} 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Final SKU: <span className="font-mono font-bold">{formData.skuPrefix ? `${formData.skuPrefix}-` : ''}{formData.skuCode}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stock Qty</label>
                  <input required type="number" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Buy Price</label>
                  <input required type="number" step="0.01" min="0" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.buyingPrice} onChange={e => setFormData({...formData, buyingPrice: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sell Price</label>
                  <input required type="number" step="0.01" min="0" className="w-full p-2 border border-gray-300 rounded-lg" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-2xl mt-2 hover:bg-indigo-700 transition-colors shadow-lg active:scale-[0.98]">
                {editingProduct ? 'Update Product' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in fade-in duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
              <p className="text-sm text-gray-500 mt-2">Are you sure you want to delete this product? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setProductToDelete(null)} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;