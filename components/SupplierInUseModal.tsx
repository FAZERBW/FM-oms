
import React from 'react';
import { AlertTriangleIcon, TrashIcon, SwitchHorizontalIcon } from './Icons';

interface SupplierInUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReassign: () => void;
  onDeleteOrders: () => void;
  supplierName: string;
  orderCount: number;
}

export default function SupplierInUseModal({ isOpen, onClose, onReassign, onDeleteOrders, supplierName, orderCount }: SupplierInUseModalProps) {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300" 
        aria-modal="true" 
        role="dialog"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
              <AlertTriangleIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Supplier in Use</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Cannot delete <strong>{supplierName}</strong> because it is associated with <strong>{orderCount}</strong> order(s).
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  To proceed, you must first reassign these orders to another supplier or delete them completely.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse sm:space-x-3 sm:space-x-reverse gap-3">
          <button 
            type="button" 
            onClick={onReassign} 
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm items-center gap-2"
          >
            <SwitchHorizontalIcon className="w-5 h-5"/>
            Reassign Orders
          </button>
          <button 
            type="button" 
            onClick={onDeleteOrders} 
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm items-center gap-2"
          >
            <TrashIcon className="w-5 h-5"/>
            Delete Orders
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
          >
            Cancel
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
