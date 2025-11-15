
import React, { useState } from 'react';
import { Product } from '../types';
import { PlusIcon, TrashIcon, SaveIcon, CubeIcon, SearchIcon } from './Icons';

interface ProductListProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const EmptyProduct: Omit<Product, 'id'> = {
  partNo: '',
  description: '',
  rate: 0,
  image: '',
};

export default function ProductList({ products, setProducts }: ProductListProps) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(EmptyProduct);
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'rate') {
        setFormData(prev => ({...prev, rate: parseFloat(value) || 0 }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const processFile = (file: File) => {
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) { // 1MB limit
      alert("File is too large. Please select an image under 1MB.");
      return;
    }
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      alert("Invalid file type. Please select a PNG or JPEG image.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = () => {
      setFormData(prev => ({...prev, image: ''}));
  }
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleAddNew = () => {
    setFormData(EmptyProduct);
    setEditingProduct(null);
    setIsFormVisible(true);
  };

  const handleEdit = (product: Product) => {
    setFormData(product);
    setEditingProduct(product);
    setIsFormVisible(true);
  };
  
  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingProduct(null);
    setFormData(EmptyProduct);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSave = () => {
    if (!formData.partNo || !formData.description) {
      alert('Part No and Description are required.');
      return;
    }
    
    if (editingProduct) { // Editing existing
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...formData, id: editingProduct.id } : p));
    } else { // Adding new
      const newProduct = { ...formData, id: `prod-${Date.now()}` };
      setProducts(prev => [...prev, newProduct]);
    }
    handleCancel();
  };

  const filteredProducts = products.filter(product =>
    product.partNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const FormComponent = () => (
    <div className="bg-gray-50 p-6 rounded-lg mt-4 border">
        <h3 className="text-xl font-semibold mb-6">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Product Image</label>
                 <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className={`mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors h-48
                        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`
                    }
                >
                    <div className="space-y-1 text-center">
                        {formData.image ? (
                             <img src={formData.image} alt="Product Preview" className="mx-auto h-24 w-24 rounded-md object-cover shadow-sm" />
                        ) : (
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                       
                        <div className="flex text-sm text-gray-600 justify-center">
                            <p className="pl-1">
                                {isDragging ? 'Drop image here...' : 'Click to upload or drag & drop'}
                            </p>
                            <input id="image-upload" name="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg"/>
                        </div>
                        <p className="text-xs text-gray-500">PNG or JPG up to 1MB</p>
                         {formData.image && (
                            <button 
                                type="button" 
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent triggering the file picker
                                    handleRemoveImage();
                                }} 
                                className="mt-2 text-xs text-red-600 hover:text-red-800 font-semibold"
                            >
                                Remove Image
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="md:col-span-2 space-y-4">
                <div>
                    <label htmlFor="partNo" className="block text-sm font-medium text-gray-700">Part No</label>
                    <input name="partNo" id="partNo" value={formData.partNo} onChange={handleInputChange} placeholder="e.g., AT-001" className="mt-1 w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <input name="description" id="description" value={formData.description} onChange={handleInputChange} placeholder="e.g., Spark Plugs (4-pack)" className="mt-1 w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label htmlFor="rate" className="block text-sm font-medium text-gray-700">Rate (₹)</label>
                    <input name="rate" id="rate" value={formData.rate} onChange={handleInputChange} placeholder="e.g., 15.00" type="number" step="0.01" className="mt-1 w-full p-2 border rounded-md" />
                </div>
            </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button onClick={handleCancel} className="text-gray-600 font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition">Cancel</button>
            <button onClick={handleSave} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                <SaveIcon className="w-5 h-5" /> Save Product
            </button>
        </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Products</h1>
        {!isFormVisible && (
          <button onClick={handleAddNew} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2">
            <PlusIcon className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        )}
      </div>
      
      {isFormVisible && <FormComponent />}

      {!isFormVisible && (
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Search by Part No or Description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            aria-label="Search products"
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
              <th className="relative px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
                <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                        {searchTerm ? `No products found matching "${searchTerm}".` : 'No products available. Add one to get started!'}
                    </td>
                </tr>
            ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-4">
                        {product.image ? (
                            <img src={product.image} alt={product.partNo} className="h-12 w-12 rounded-md object-cover bg-gray-100" />
                        ) : (
                            <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center">
                                <CubeIcon className="w-6 h-6 text-gray-400" />
                            </div>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.partNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-sm truncate" title={product.description}>{product.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{product.rate.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-4 justify-end items-center">
                      <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5" /></button>
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
