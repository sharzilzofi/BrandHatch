
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Sale, Expense, DashboardMetrics, AppSettings, SkuPrefix, SaleStatus, CurrencyType, Supplier, Customer, LocationCharge, ExpenseCategory, Platform, FeeType } from '../types';

interface DataContextType {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  suppliers: Supplier[];
  customers: Customer[];
  settings: AppSettings;
  skuPrefixes: SkuPrefix[];
  deliveryCharges: LocationCharge[];
  metrics: DashboardMetrics;
  
  // Settings Actions
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addSkuPrefix: (prefix: string, label: string) => void;
  removeSkuPrefix: (id: string) => void;
  addPlatform: (name: string, feeValue: number, feeType: FeeType) => void;
  removePlatform: (id: string) => void;
  addLocationCharge: (location: string, charge: number) => void;
  removeLocationCharge: (id: string) => void;

  // Data Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addSale: (sale: Omit<Sale, 'id' | 'productName' | 'sellingPriceSnapshot' | 'buyingCostSnapshot' | 'revenue' | 'totalCost' | 'profit' | 'platformFee' | 'status' | 'deliveryPaidOnRefund'> & { unitPrice?: number }) => void;
  updateSale: (saleId: string, updates: { productId: string, quantity: number, unitPrice: number, platform: string, date: string, location: string, deliveryCharge: number, paidByCustomer: boolean, customerPhone?: string }) => void;
  deleteSale: (saleId: string) => void;
  refundSale: (saleId: string, deliveryPaid: boolean) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, updates: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  
  // Contacts Actions
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Omit<Supplier, 'id'>) => void;
  deleteSupplier: (id: string) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: string, updates: Omit<Customer, 'id'>) => void;
  deleteCustomer: (id: string) => void;
  
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substr(2, 9);

const DEFAULT_PLATFORMS: Platform[] = [
  { id: '1', name: 'Facebook', feeValue: 0, feeType: 'FIXED' },
  { id: '2', name: 'Website', feeValue: 0, feeType: 'FIXED' },
  { id: '3', name: 'Offline', feeValue: 0, feeType: 'FIXED' }
];

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'BDT',
  currencySymbol: '৳',
  lowStockThreshold: 5,
  allowNegativeStock: false,
  platforms: DEFAULT_PLATFORMS
};

const DEFAULT_PREFIXES: SkuPrefix[] = [
  { id: '1', prefix: 'GEN', label: 'General' },
  { id: '2', prefix: 'ELEC', label: 'Electronics' },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('biztrack_settings');
    let parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;

    // Migration: Convert legacy string[] platforms to Platform[]
    if (parsed.platforms && parsed.platforms.length > 0 && typeof parsed.platforms[0] === 'string') {
      parsed.platforms = parsed.platforms.map((p: string) => ({
        id: generateId(),
        name: p,
        feeValue: 0,
        feeType: 'FIXED'
      }));
    }
    
    return parsed;
  });

  const [skuPrefixes, setSkuPrefixes] = useState<SkuPrefix[]>(() => {
    const saved = localStorage.getItem('biztrack_prefixes');
    return saved ? JSON.parse(saved) : DEFAULT_PREFIXES;
  });

  const [deliveryCharges, setDeliveryCharges] = useState<LocationCharge[]>(() => {
    const saved = localStorage.getItem('biztrack_delivery_charges');
    return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('biztrack_products');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('biztrack_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('biztrack_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('biztrack_suppliers');
    return saved ? JSON.parse(saved) : [];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('biztrack_customers');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => localStorage.setItem('biztrack_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('biztrack_prefixes', JSON.stringify(skuPrefixes)), [skuPrefixes]);
  useEffect(() => localStorage.setItem('biztrack_delivery_charges', JSON.stringify(deliveryCharges)), [deliveryCharges]);
  useEffect(() => localStorage.setItem('biztrack_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('biztrack_sales', JSON.stringify(sales)), [sales]);
  useEffect(() => localStorage.setItem('biztrack_expenses', JSON.stringify(expenses)), [expenses]);
  useEffect(() => localStorage.setItem('biztrack_suppliers', JSON.stringify(suppliers)), [suppliers]);
  useEffect(() => localStorage.setItem('biztrack_customers', JSON.stringify(customers)), [customers]);

  const metrics: DashboardMetrics = React.useMemo(() => {
    const activeSales = sales.filter(s => s.status === SaleStatus.COMPLETED);
    const refundedSales = sales.filter(s => s.status === SaleStatus.REFUNDED);

    const totalSales = activeSales.reduce((sum, sale) => sum + sale.revenue, 0);
    // Note: totalProfit here is (Revenue - Cost - Fees)
    const totalProfit = activeSales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalPlatformFees = activeSales.reduce((sum, sale) => sum + (sale.platformFee || 0), 0);
    
    const totalRefunds = refundedSales.reduce((sum, sale) => sum + sale.revenue, 0); 
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Net Profit = (Sale Profit) - (Operational Expenses)
    // Since Sale Profit already accounts for Platform Fees, we just subtract Operational Expenses.
    const netProfit = totalProfit - totalExpenses;
    
    const stockValue = products.reduce((sum, product) => sum + (product.buyingPrice * product.stock), 0);

    return { totalSales, totalProfit, totalExpenses, totalPlatformFees, netProfit, stockValue, totalRefunds };
  }, [products, sales, expenses]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.currency === 'BDT') updated.currencySymbol = '৳';
      if (newSettings.currency === 'USD') updated.currencySymbol = '$';
      return updated;
    });
  };

  const addSkuPrefix = (prefix: string, label: string) => {
    setSkuPrefixes(prev => [...prev, { id: generateId(), prefix: prefix.toUpperCase(), label }]);
  };

  const removeSkuPrefix = (id: string) => {
    setSkuPrefixes(prev => prev.filter(p => p.id !== id));
  };

  const addPlatform = (name: string, feeValue: number = 0, feeType: FeeType = 'FIXED') => {
    setSettings(prev => ({ 
      ...prev, 
      platforms: [...prev.platforms, { id: generateId(), name, feeValue, feeType }] 
    }));
  };

  const removePlatform = (id: string) => {
    setSettings(prev => ({ ...prev, platforms: prev.platforms.filter(p => p.id !== id) }));
  };

  const addLocationCharge = (location: string, charge: number) => {
    setDeliveryCharges(prev => [...prev, { id: generateId(), location, charge }]);
  };

  const removeLocationCharge = (id: string) => {
    setDeliveryCharges(prev => prev.filter(l => l.id !== id));
  };

  const addProduct = (data: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const calculatePlatformFee = (platformName: string, revenue: number) => {
    const platform = settings.platforms.find(p => p.name === platformName);
    if (!platform) return 0;
    
    if (platform.feeType === 'PERCENTAGE') {
      return (revenue * platform.feeValue) / 100;
    } else {
      return platform.feeValue; // Fixed amount per sale
    }
  };

  const addSale = (saleData: Omit<Sale, 'id' | 'productName' | 'sellingPriceSnapshot' | 'buyingCostSnapshot' | 'revenue' | 'totalCost' | 'profit' | 'platformFee' | 'status' | 'deliveryPaidOnRefund'> & { unitPrice?: number }) => {
    const product = products.find(p => p.id === saleData.productId);
    if (!product) throw new Error("Product not found");
    
    if (!settings.allowNegativeStock && product.stock < saleData.quantity) {
      alert("Insufficient stock!");
      return;
    }

    // Auto-create customer if phone number exists
    if (saleData.customerPhone) {
      const phone = saleData.customerPhone.trim();
      if (phone) {
        const existingCustomer = customers.find(c => c.phone === phone);
        if (!existingCustomer) {
          setCustomers(prev => [{
            id: generateId(),
            name: `Customer ${phone}`, // Default name using phone
            phone: phone,
            address: '',
            notes: 'Auto-created from sale'
          }, ...prev]);
        }
      }
    }

    const unitPrice = saleData.unitPrice !== undefined ? saleData.unitPrice : product.sellingPrice;
    const revenue = unitPrice * saleData.quantity;
    const totalCost = product.buyingPrice * saleData.quantity;
    
    const platformFee = calculatePlatformFee(saleData.platform, revenue);
    const profit = revenue - totalCost - platformFee;

    const newSale: Sale = {
      id: generateId(),
      productId: saleData.productId,
      productName: product.name,
      quantity: saleData.quantity,
      sellingPriceSnapshot: unitPrice,
      buyingCostSnapshot: product.buyingPrice,
      revenue: revenue,
      totalCost: totalCost,
      profit: profit,
      platformFee: platformFee,
      deliveryCharge: saleData.deliveryCharge || 0,
      location: saleData.location || '',
      paidByCustomer: saleData.paidByCustomer,
      platform: saleData.platform,
      date: saleData.date,
      status: SaleStatus.COMPLETED,
      customerPhone: saleData.customerPhone
    };

    setSales(prev => [newSale, ...prev]);
    updateProduct(product.id, { stock: product.stock - saleData.quantity });
  };

  const updateSale = (saleId: string, updates: { productId: string, quantity: number, unitPrice: number, platform: string, date: string, location: string, deliveryCharge: number, paidByCustomer: boolean, customerPhone?: string }) => {
    const oldSale = sales.find(s => s.id === saleId);
    if (!oldSale) return;

    // Auto-create customer if phone number is new
    if (updates.customerPhone) {
      const phone = updates.customerPhone.trim();
      if (phone) {
        const existingCustomer = customers.find(c => c.phone === phone);
        if (!existingCustomer) {
          setCustomers(prev => [{
            id: generateId(),
            name: `Customer ${phone}`,
            phone: phone,
            address: '',
            notes: 'Auto-created from updated sale'
          }, ...prev]);
        }
      }
    }

    const newProduct = products.find(p => p.id === updates.productId);
    if (!newProduct) {
        alert("Selected product not found");
        return;
    }

    // Revert stock changes for old product, apply for new product
    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      const oldProdIdx = updatedProducts.findIndex(p => p.id === oldSale.productId);
      if (oldProdIdx !== -1 && oldSale.status === SaleStatus.COMPLETED) {
        updatedProducts[oldProdIdx] = { 
          ...updatedProducts[oldProdIdx], 
          stock: updatedProducts[oldProdIdx].stock + oldSale.quantity 
        };
      }
      const newProdIdx = updatedProducts.findIndex(p => p.id === updates.productId);
      if (newProdIdx !== -1) {
        updatedProducts[newProdIdx] = { 
          ...updatedProducts[newProdIdx], 
          stock: updatedProducts[newProdIdx].stock - updates.quantity 
        };
      }
      return updatedProducts;
    });

    const revenue = updates.unitPrice * updates.quantity;
    const totalCost = newProduct.buyingPrice * updates.quantity;
    const platformFee = calculatePlatformFee(updates.platform, revenue);
    const profit = revenue - totalCost - platformFee;

    setSales(prevSales => prevSales.map(s => s.id === saleId ? {
        ...s,
        productId: updates.productId,
        productName: newProduct.name,
        quantity: updates.quantity,
        sellingPriceSnapshot: updates.unitPrice,
        buyingCostSnapshot: newProduct.buyingPrice,
        revenue,
        totalCost,
        profit,
        platformFee,
        platform: updates.platform,
        date: updates.date,
        location: updates.location,
        deliveryCharge: updates.deliveryCharge,
        paidByCustomer: updates.paidByCustomer,
        customerPhone: updates.customerPhone
    } : s));
  };

  const deleteSale = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    // Restore stock if the sale was active (Completed)
    // If it was Refunded, stock was already restored during refund.
    if (sale.status === SaleStatus.COMPLETED) {
      setProducts(prevProducts => prevProducts.map(p => 
        p.id === sale.productId ? { ...p, stock: p.stock + sale.quantity } : p
      ));
    }

    setSales(prevSales => prevSales.filter(s => s.id !== saleId));
  };

  const refundSale = (saleId: string, deliveryPaid: boolean) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale || sale.status === SaleStatus.REFUNDED) return;

    setSales(prevSales => prevSales.map(s => 
      s.id === saleId ? { 
        ...s, 
        status: SaleStatus.REFUNDED, 
        refundDate: new Date().toISOString(),
        deliveryPaidOnRefund: deliveryPaid 
      } : s
    ));
    
    setProducts(prevProducts => prevProducts.map(p => 
      p.id === sale.productId ? { ...p, stock: p.stock + sale.quantity } : p
    ));

    if (!deliveryPaid && sale.deliveryCharge > 0) {
      addExpense({
        category: ExpenseCategory.REFUND_LOSS,
        description: `Unpaid Delivery for Refund: ${sale.productName} (${sale.location})`,
        amount: sale.deliveryCharge,
        date: new Date().toISOString()
      });
    }
  };

  const addExpense = (data: Omit<Expense, 'id'>) => {
    const newExpense: Expense = { ...data, id: generateId() };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const updateExpense = (id: string, updates: Omit<Expense, 'id'>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addSupplier = (data: Omit<Supplier, 'id'>) => {
    setSuppliers(prev => [{ ...data, id: generateId() }, ...prev]);
  };

  const updateSupplier = (id: string, updates: Omit<Supplier, 'id'>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const addCustomer = (data: Omit<Customer, 'id'>) => {
    setCustomers(prev => [{ ...data, id: generateId() }, ...prev]);
  };

  const updateCustomer = (id: string, updates: Omit<Customer, 'id'>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const resetData = () => {
    console.warn("Reset data triggered but functionality is restricted.");
  }

  return (
    <DataContext.Provider value={{
      products,
      sales,
      expenses,
      suppliers,
      customers,
      settings,
      skuPrefixes,
      deliveryCharges,
      metrics,
      updateSettings,
      addSkuPrefix,
      removeSkuPrefix,
      addPlatform,
      removePlatform,
      addLocationCharge,
      removeLocationCharge,
      addProduct,
      updateProduct,
      deleteProduct,
      addSale,
      updateSale,
      deleteSale,
      refundSale,
      addExpense,
      updateExpense,
      deleteExpense,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      resetData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
