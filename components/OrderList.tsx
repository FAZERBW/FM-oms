
import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import { PlusIcon, SearchIcon } from './Icons';

interface OrderListProps {
  orders: Order[];
  onSelectOrder: (orderId: string) => void;
  onAddNewOrder: () => void;
}

const statusColorMap = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Packed: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-indigo-100 text-indigo-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

const filterStatuses: Array<'All' | Order['status']> = ['All', 'Pending', 'Packed', 'Shipped', 'Completed', 'Cancelled'];
type SortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'supplier-asc' | 'supplier-desc';

export default function OrderList({ orders, onSelectOrder, onAddNewOrder }: OrderListProps) {
  const [activeStatus, setActiveStatus] = useState<'All' | Order['status']>('All');
  const [sortKey, setSortKey] = useState<SortKey>('date-desc');
  const [searchTerm, setSearchTerm] = useState('');

  const ordersWithTotals = useMemo(() => {
    return orders.map(order => ({
      ...order,
      totalAmount: order.items.reduce((sum, item) => sum + item.quantity * item.rate, 0),
    }));
  }, [orders]);

  const sortedAndFilteredOrders = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();

    const filtered = ordersWithTotals.filter(order => {
      // Status filter
      const statusMatch = activeStatus === 'All' || order.status === activeStatus;
      if (!statusMatch) {
        return false;
      }

      // Search filter (if search term exists)
      if (lowercasedSearchTerm) {
        const searchMatch =
          order.orderId.toLowerCase().includes(lowercasedSearchTerm) ||
          order.orderTo.toLowerCase().includes(lowercasedSearchTerm) ||
          (order.footerNote && order.footerNote.toLowerCase().includes(lowercasedSearchTerm)) ||
          order.items.some(item =>
            item.partNo.toLowerCase().includes(lowercasedSearchTerm) ||
            item.description.toLowerCase().includes(lowercasedSearchTerm) ||
            (item.notes && item.notes.toLowerCase().includes(lowercasedSearchTerm)) ||
            (item.purchasedFrom && item.purchasedFrom.toLowerCase().includes(lowercasedSearchTerm)) ||
            (item.customFields && Object.values(item.customFields).some(val =>
              String(val).toLowerCase().includes(lowercasedSearchTerm)
            ))
          );
        if (!searchMatch) {
          return false;
        }
      }

      return true; // Pass if all filters match
    });

    return filtered.sort((a, b) => {
      switch (sortKey) {
        case 'date-asc':
          return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
        case 'date-desc':
          return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
        case 'amount-asc':
          return a.totalAmount - b.totalAmount;
        case 'amount-desc':
          return b.totalAmount - a.totalAmount;
        case 'supplier-asc':
          return a.orderTo.localeCompare(b.orderTo);
        case 'supplier-desc':
          return b.orderTo.localeCompare(a.orderTo);
        default:
          return 0;
      }
    });
  }, [ordersWithTotals, activeStatus, sortKey, searchTerm]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
        <button
          onClick={onAddNewOrder}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Order</span>
        </button>
      </div>
      
      <div className="flex flex-col gap-4 mb-6 border-b border-gray-200 pb-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Order ID, Supplier, Item details, Notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            aria-label="Search orders"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-600 mr-2">Filter by status:</span>
                {filterStatuses.map(status => (
                <button
                    key={status}
                    onClick={() => setActiveStatus(status)}
                    className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                    activeStatus === status
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    {status}
                </button>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <label htmlFor="sort-orders" className="text-sm font-medium text-gray-600">Sort by:</label>
                <select
                    id="sort-orders"
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="bg-white p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="date-desc">Order Date (Newest First)</option>
                    <option value="date-asc">Order Date (Oldest First)</option>
                    <option value="amount-desc">Total Amount (High to Low)</option>
                    <option value="amount-asc">Total Amount (Low to High)</option>
                    <option value="supplier-asc">Supplier (A-Z)</option>
                    <option value="supplier-desc">Supplier (Z-A)</option>
                </select>
            </div>
        </div>
      </div>


      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order To</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-500">
                  {searchTerm
                    ? `No orders found matching "${searchTerm}".`
                    : activeStatus === 'All'
                      ? "No orders found. Create one!"
                      : `No ${activeStatus.toLowerCase()} orders found.`
                  }
                </td>
              </tr>
            ) : (
                sortedAndFilteredOrders.map((order) => (
                <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.orderTo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.orderDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.items.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => onSelectOrder(order.orderId)} className="text-blue-600 hover:text-blue-900">View / Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
