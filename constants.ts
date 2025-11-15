import { ShopSettings, Supplier, Order, Product } from './types';

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Prince Auto Parts',
  slogan: 'Seller in Electrical Auto Parts',
  mobile1: '9922115982',
  mobile2: '9921226321',
  address: 'Shop No. 4, Naaz Complex, Jai Shankar Colony, Behind Lokmanya Hospital, 80 Feet Road, Dhule, Maharashtra 424001',
  logo: '',
};

export const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', supplierName: 'AutoTech Inc.', mobile: '123-456-7890', address: '123 Tech Road, Silicon Valley', notes: 'Primary supplier for electronics.' },
  { id: 'sup-2', supplierName: 'Mechanic\'s Choice', mobile: '098-765-4321', address: '456 Garage Ave, Motor City', notes: 'Best for mechanical parts.' },
];

export const DEFAULT_ORDERS: Order[] = [
  {
    orderId: `ORD-${Date.now() - 10000}`,
    orderTo: 'AutoTech Inc.',
    orderDate: '2024-07-28',
    items: [
      { partNo: 'AT-001', description: 'Spark Plugs (4-pack)', quantity: 10, rate: 15, purchasedFrom: 'AutoTech Inc.', notes: 'For Toyota Corolla' },
      { partNo: 'AT-002', description: 'Oil Filter', quantity: 5, rate: 8.5, purchasedFrom: 'AutoTech Inc.', notes: '' },
    ],
    footerNote: 'Urgent delivery requested.',
    status: 'Pending',
    customColumns: [],
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  { 
    id: 'prod-1', 
    partNo: 'AT-001', 
    description: 'Spark Plugs (4-pack)', 
    rate: 15, 
    image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2QxZDVlYSI+PHBhdGggZD0iTTE5IDNoLTQuMThhMyAzIDAgMCAwLTUuNjQgMGgtNC4xOGMtMS4xIDAtMiAuOS0yIDJ2MTJjMCAxLjEuOSAyIDIgMmgxNGMxLjEgMCAyLS45IDItMlY1YzAtMS4xLS45LTItMi0yem0tNy0xYTMSAxIDAgMCAxIDEgMWgtMmExIDEgMCAwIDEgMS0xem03IDE1SDVWNWg0djFoNmEwIDAgMCAwIDAgMCBWNWg0djEzek0xMiAxMGEyIDIgMCAxIDAtMi0yYzAgMS4xMS44OSAyIDIgMnoiLz48L3N2Zz4=' 
  },
  { id: 'prod-2', partNo: 'AT-002', description: 'Oil Filter', rate: 8.50 },
  { id: 'prod-3', partNo: 'MC-101', description: 'Brake Pads (Set of 2)', rate: 45 },
  { id: 'prod-4', partNo: 'MC-102', description: 'Air Filter', rate: 12.75 },
];