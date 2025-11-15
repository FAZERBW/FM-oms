
import React, { useState, useMemo, useEffect } from 'react';
import { Order, Supplier } from '../types';
import { TrashIcon, SwitchHorizontalIcon } from './Icons';

interface BulkOrderActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: { orderIds: string[]; newSupplierName?: string }) => void;
  orders: Order[];
  suppliers: Supplier[];
  action: 'reassign' | 'delete';
  supplierName: string;
}

export default function BulkOrderActionModal({ isOpen, onClose, onConfirm, orders, suppliers, action, supplierName }: BulkOrderActionModalProps) {
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [targetSupplier, setTargetSupplier] = useState('');
  const [manualSupplier, setManualSupplier] = useState('');
  
  useEffect(() => {
    // Reset state when modal is opened
    if (isOpen) {
        setSelectedOrderIds([]);
        setTargetSupplier('');
        setManualSupplier('');
    }
  }, [isOpen])

  const handleSelect = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map(o => o.orderId));
    }
  };
  
  const handleSubmit = () => {
    if (action === 'reassign') {
        const newSupplierName = manualSupplier.trim() || targetSupplier.trim();
        if (!newSupplierName) {
            alert('Please select or enter a new supplier.');
            return;
        }
        onConfirm({ orderIds: selectedOrderIds, newSupplierName });
    } else {
        onConfirm({ orderIds: selectedOrderIds });
    }
  };

  const isReassign = action === 'reassign';
  const otherSuppliers = useMemo(() => suppliers.filter(s => s.supplierName.toLowerCase() !== supplierName.toLowerCase()), [suppliers, supplierName]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all animate-fade-in-scale flex flex-col" style={{maxHeight: '90vh'}} onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h3 className="text-xl leading-6 font-bold text-gray-900">
            {isReassign ? `Reassign Orders from ${supplierName}` : `Delete Orders from ${supplierName}`}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Select the orders you wish to {action}.</p>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="flex items-center justify-between pb-2 border-b mb-2">
            <label className="flex items-center text-sm font-medium">
              <input type="checkbox"
                onChange={handleSelectAll}
                checked={selectedOrderIds.length === orders.length && orders.length > 0}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
              />
              Select All ({selectedOrderIds.length} / {orders.length})
            </label>
          </div>
          <ul className="divide-y divide-gray-200">
            {orders.map(order => (
              <li key={order.orderId} className="py-3 flex items-center">
                <input 
                  type="checkbox"
                  checked={selectedOrderIds.includes(order.orderId)}
                  onChange={() => handleSelect(order.orderId)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-4"
                />
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800">{order.orderId}</p>
                  <p className="text-sm text-gray-500">{order.items.length} item(s) - {order.orderDate}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {isReassign && (
          <div className="p-6 bg-gray-50 border-t">
            <h4 className="font-semibold text-gray-800 mb-2">Reassign to:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <select 
                    value={targetSupplier} 
                    onChange={e => { setTargetSupplier(e.target.value); setManualSupplier(''); }}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white"
                >
                    <option value="">-- Select an existing supplier --</option>
                    {otherSuppliers.map(s => <option key={s.id} value={s.supplierName}>{s.supplierName}</option>)}
                </select>
                <div className="flex items-center gap-2">
                    <hr className="flex-grow border-gray-300"/>
                    <span className="text-sm text-gray-500">OR</span>
                    <hr className="flex-grow border-gray-300"/>
                </div>
                <input 
                    type="text" 
                    value={manualSupplier}
                    onChange={e => { setManualSupplier(e.target.value); setTargetSupplier(''); }}
                    placeholder="Enter a new supplier name"
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm sm:col-span-2"
                />
            </div>
          </div>
        )}

        <div className="bg-gray-100 px-6 py-4 flex justify-end space-x-3 rounded-b-lg border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50">Cancel</button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={selectedOrderIds.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors
            ${isReassign ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}
            disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {isReassign ? <><SwitchHorizontalIcon className="w-5 h-5"/> Reassign Selected</> : <><TrashIcon className="w-5 h-5"/> Delete Selected</>}
          </button>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-scale {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
    `}</style>
    </div>
  );
}
