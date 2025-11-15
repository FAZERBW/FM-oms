
import React, { useState } from 'react';
import { Supplier } from '../types';
import { PlusIcon, TrashIcon, SaveIcon, SearchIcon } from './Icons';

interface SupplierListProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  onDeleteRequest: (supplierId: string) => void;
}

const EmptySupplier: Omit<Supplier, 'id'> = {
  supplierName: '',
  mobile: '',
  address: '',
  notes: '',
};

export default function SupplierList({ suppliers, setSuppliers, onDeleteRequest }: SupplierListProps) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Omit<Supplier, 'id'>>(EmptySupplier);
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNew = () => {
    setFormData(EmptySupplier);
    setEditingSupplier(null);
    setIsFormVisible(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData(supplier);
    setEditingSupplier(supplier);
    setIsFormVisible(true);
  };
  
  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingSupplier(null);
    setFormData(EmptySupplier);
  };

  const handleSave = () => {
    if (!formData.supplierName) {
      alert('Supplier Name is required.');
      return;
    }
    
    if (editingSupplier) { // Editing existing
      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? { ...formData, id: editingSupplier.id } : s));
    } else { // Adding new
      const newSupplier = { ...formData, id: `sup-${Date.now()}` };
      setSuppliers(prev => [...prev, newSupplier]);
    }
    handleCancel();
  };
  
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const FormComponent = () => (
    <div className="bg-gray-50 p-4 rounded-lg mt-4 border">
        <h3 className="text-xl font-semibold mb-4">{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="supplierName" value={formData.supplierName} onChange={handleInputChange} placeholder="Supplier Name" className="p-2 border rounded-md" />
            <input name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="Mobile" className="p-2 border rounded-md" />
        </div>
        <textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Address" className="w-full p-2 border rounded-md mt-4" rows={2}></textarea>
        <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Notes" className="w-full p-2 border rounded-md mt-4" rows={2}></textarea>
        <div className="flex justify-end gap-3 mt-4">
            <button onClick={handleCancel} className="text-gray-600 font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition">Cancel</button>
            <button onClick={handleSave} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                <SaveIcon className="w-5 h-5" /> Save Supplier
            </button>
        </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Suppliers</h1>
        {!isFormVisible && (
          <button onClick={handleAddNew} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2">
            <PlusIcon className="w-5 h-5" />
            <span>Add Supplier</span>
          </button>
        )}
      </div>
      
      {isFormVisible && <FormComponent />}

      {!isFormVisible && (
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Search by Name, Mobile, or Address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            aria-label="Search suppliers"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      )}


      <div className="overflow-x-auto mt-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="relative px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSuppliers.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">
                        {searchTerm
                            ? `No suppliers found matching "${searchTerm}".`
                            : 'No suppliers available. Add one to get started!'}
                    </td>
                </tr>
            ) : (
                filteredSuppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.supplierName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.mobile}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={supplier.address}>{supplier.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-4 justify-end">
                      <button onClick={() => handleEdit(supplier)} className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button onClick={() => onDeleteRequest(supplier.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5" /></button>
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
