export interface OrderItem {
  partNo: string;
  description: string;
  quantity: number;
  rate: number;
  purchasedFrom: string;
  notes: string;
  customFields?: { [key: string]: string | number };
}

export interface CustomColumn {
  name: string;
  type: 'text' | 'number' | 'currency' | 'formula';
  formula?: string; // e.g., "{quantity} * {rate}"
}

export interface Order {
  orderId: string;
  orderTo: string;
  orderDate: string;
  items: OrderItem[];
  footerNote: string;
  status: 'Pending' | 'Packed' | 'Shipped' | 'Completed' | 'Cancelled';
  customColumns?: CustomColumn[];
}

export interface Supplier {
  id: string;
  supplierName: string;
  mobile: string;
  address: string;
  notes: string;
}

export interface Product {
  id: string;
  partNo: string;
  description: string;
  rate: number;
  image?: string; // base64 encoded image
}

export interface ShopSettings {
  shopName: string;
  slogan: string;
  mobile1: string;
  mobile2: string;
  address: string;
  logo: string; // base64 encoded image
}

export type View = 'dashboard' | 'orders' | 'order-detail' | 'products' | 'suppliers' | 'settings';