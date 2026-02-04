
export enum ExpenseCategory {
  MARKETING = 'Marketing',
  DELIVERY = 'Delivery',
  PACKAGING = 'Packaging',
  PLATFORM_FEE = 'Platform Fee',
  SALES_LOSS = 'Sales Loss',
  REFUND_LOSS = 'Refund Loss',
  OTHER = 'Other'
}

export enum SaleStatus {
  COMPLETED = 'Completed',
  REFUNDED = 'Refunded'
}

export type CurrencyType = 'BDT' | 'USD';
export type FeeType = 'PERCENTAGE' | 'FIXED';

export interface Platform {
  id: string;
  name: string;
  feeValue: number;
  feeType: FeeType;
}

export interface AppSettings {
  currency: CurrencyType;
  currencySymbol: string;
  lowStockThreshold: number;
  allowNegativeStock: boolean;
  platforms: Platform[];
}

export interface LocationCharge {
  id: string;
  location: string;
  charge: number;
}

export interface SkuPrefix {
  id: string;
  prefix: string; // e.g., "FRU"
  label: string;  // e.g., "Fruits"
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  buyingPrice: number;
  sellingPrice: number;
  stock: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string; 
  quantity: number;
  sellingPriceSnapshot: number; 
  buyingCostSnapshot: number; 
  revenue: number;
  totalCost: number;
  profit: number;
  platformFee: number;
  deliveryCharge: number;
  location: string;
  platform: string;
  date: string; 
  status: SaleStatus;
  refundDate?: string;
  deliveryPaidOnRefund?: boolean;
  paidByCustomer?: boolean;
  customerPhone?: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  category: string;
  notes: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
}

export interface DashboardMetrics {
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  totalPlatformFees: number;
  netProfit: number;
  stockValue: number;
  totalRefunds: number;
}

export interface AIAnalysisResult {
  topFocusProducts: { productName: string; reason: string }[];
  pricingAdjustments: { productName: string; suggestedAction: string; reason: string }[];
  marketingStrategy: string[];
  expenseOptimization: string[];
  inventoryActions: string[];
  generalAnalysis: string;
}
