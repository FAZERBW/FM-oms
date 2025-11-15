
import React, { useState, useMemo, useRef } from 'react';
import { Order, OrderItem, Supplier, ShopSettings, Product, CustomColumn } from '../types';
import { TrashIcon, PlusIcon, DocumentDuplicateIcon, PhotographIcon, ArrowLeftIcon, SaveIcon, CubeIcon, GripVerticalIcon } from './Icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const calculateFormulaValue = (formula: string, item: OrderItem): number => {
    if (!formula) return 0;

    let expression = formula;
    const placeholders = formula.match(/{([^}]+)}/g) || [];

    for (const placeholder of placeholders) {
        const key = placeholder.slice(1, -1).trim();
        let value: string | number | undefined;

        // Check standard OrderItem fields first
        if (Object.prototype.hasOwnProperty.call(item, key) && typeof item[key as keyof OrderItem] === 'number') {
            value = item[key as keyof OrderItem] as number;
        } else if (item.customFields && Object.prototype.hasOwnProperty.call(item.customFields, key)) {
            value = item.customFields[key];
        }

        const numericValue = parseFloat(String(value)) || 0;
        expression = expression.replace(new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), String(numericValue));
    }

    try {
        // Basic sanitization to allow only numbers, operators, dots, and parentheses.
        if (/^[-0-9+\-*/().\s]+$/.test(expression)) {
            const result = new Function(`return ${expression}`)();
            return typeof result === 'number' && isFinite(result) ? result : 0;
        }
        return 0; // Return 0 if expression contains disallowed characters
    } catch (error) {
        console.error('Formula evaluation error:', error);
        return 0; // Return 0 or NaN on error
    }
};


// A hidden component for PDF/Image generation to ensure consistent styling
const OrderPDFLayout = React.forwardRef<HTMLDivElement, { order: Order, settings: ShopSettings, visibleFields: any }>(({ order, settings, visibleFields }, ref) => {
    const { subtotal, totalAmount } = useMemo(() => {
        const sub = order.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
        return { subtotal: sub, totalAmount: sub };
    }, [order.items]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    return (
        <div ref={ref} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'sans-serif' }}>
            <header className="bg-blue-600 text-white p-6 text-center rounded-t-lg">
                <h1 className="text-4xl font-bold">{settings.shopName}</h1>
                <p className="text-lg">{settings.slogan}</p>
                <div className="flex justify-center space-x-4 mt-2 text-sm">
                    <span>{settings.mobile1}</span>
                    {settings.mobile2 && <span>| {settings.mobile2}</span>}
                </div>
                <p className="text-xs mt-1">{settings.address}</p>
            </header>
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="font-bold text-gray-700">Order To:</h2>
                        <p>{order.orderTo}</p>
                    </div>
                    <div className="text-right">
                        <p><strong>Order ID:</strong> {order.orderId}</p>
                        <p><strong>Date:</strong> {order.orderDate}</p>
                    </div>
                </div>

                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            {visibleFields.partNo && <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Part No</th>}
                            {visibleFields.description && <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Description</th>}
                            {visibleFields.quantity && <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Qty</th>}
                            {visibleFields.rate && <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Rate</th>}
                            {visibleFields.amount && <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Amount</th>}
                            {visibleFields.purchasedFrom && <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Purchased From</th>}
                            {visibleFields.notes && <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Notes</th>}
                             {order.customColumns?.map(col => (
                                visibleFields[col.name] && <th key={col.name} className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">{col.name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {order.items.map((item, index) => {
                            const amount = item.quantity * item.rate;
                            return (
                                <tr key={index}>
                                    {visibleFields.partNo && <td className="px-4 py-2 whitespace-nowrap text-sm">{item.partNo}</td>}
                                    {visibleFields.description && <td className="px-4 py-2 whitespace-nowrap text-sm">{item.description}</td>}
                                    {visibleFields.quantity && <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{item.quantity}</td>}
                                    {visibleFields.rate && <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{formatCurrency(item.rate)}</td>}
                                    {visibleFields.amount && <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{formatCurrency(amount)}</td>}
                                    {visibleFields.purchasedFrom && <td className="px-4 py-2 whitespace-nowrap text-sm">{item.purchasedFrom}</td>}
                                    {visibleFields.notes && <td className="px-4 py-2 whitespace-nowrap text-sm">{item.notes}</td>}
                                    {order.customColumns?.map(col => {
                                        if (!visibleFields[col.name]) return null;
                                        let cellValue: string | number = '';
                                        if (col.type === 'formula') {
                                            cellValue = formatCurrency(calculateFormulaValue(col.formula || '', item));
                                        } else if (col.type === 'currency') {
                                            cellValue = formatCurrency(Number(item.customFields?.[col.name] || 0));
                                        } else {
                                            cellValue = item.customFields?.[col.name] || '';
                                        }
                                        return <td key={col.name} className="px-4 py-2 whitespace-nowrap text-sm">{cellValue}</td>
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                
                <div className="flex justify-end mt-6">
                    <div className="w-1/3">
                        {visibleFields.subtotal && <div className="flex justify-between py-1 border-b"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>}
                        {visibleFields.totalAmount && <div className="flex justify-between font-bold text-lg py-2"><span>Total</span><span>{formatCurrency(totalAmount)}</span></div>}
                    </div>
                </div>

                {order.footerNote && (
                    <div className="mt-8 border-t pt-4">
                        <h3 className="font-bold text-gray-700">Notes:</h3>
                        <p className="text-sm text-gray-600">{order.footerNote}</p>
                    </div>
                )}
            </div>
        </div>
    );
});


interface OrderDetailProps {
  order: Order;
  onSave: (order: Order) => void;
  onDelete: (orderId: string) => void;
  onBack: () => void;
  suppliers: Supplier[];
  shopSettings: ShopSettings;
  products: Product[];
}

const OrderStatusOptions: Order['status'][] = ['Pending', 'Packed', 'Shipped', 'Completed', 'Cancelled'];

export default function OrderDetail({ order, onSave, onDelete, onBack, suppliers, shopSettings, products }: OrderDetailProps) {
  const [editedOrder, setEditedOrder] = useState<Order>(order);
  const [visibleFields, setVisibleFields] = useState(() => {
    const initialFields: { [key: string]: boolean } = {
        partNo: true,
        description: true,
        quantity: true,
        rate: true,
        amount: true,
        purchasedFrom: true,
        notes: true,
        subtotal: true,
        totalAmount: true,
    };
    order.customColumns?.forEach(col => {
        initialFields[col.name] = true;
    });
    return initialFields;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [newColumn, setNewColumn] = useState({ name: '', type: 'text' as CustomColumn['type'], formula: '' });

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);


  const handleFieldChange = (field: keyof Order, value: any) => {
    setEditedOrder(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSupplierName = e.target.value;
    setEditedOrder(prev => ({
        ...prev,
        orderTo: selectedSupplierName,
    }));
  };
  
  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...editedOrder.items];
    const item = { ...newItems[index] };
    
    if(field === 'quantity' || field === 'rate') {
      item[field] = parseFloat(value) || 0;
    } else {
      // @ts-ignore
      item[field] = value;
    }

    if (field === 'partNo') {
      if (value) {
        const filteredProducts = products.filter(p => 
            p.partNo.toLowerCase().includes(String(value).toLowerCase()) ||
            p.description.toLowerCase().includes(String(value).toLowerCase())
        );
        setSuggestions(filteredProducts);
      } else {
        setSuggestions([]);
      }
    }
  
    newItems[index] = item;
    setEditedOrder(prev => ({ ...prev, items: newItems }));
  };
  
  const handleCustomItemFieldChange = (index: number, fieldName: string, value: string | number) => {
    const newItems = [...editedOrder.items];
    const item = { ...newItems[index] };
    if (!item.customFields) {
        item.customFields = {};
    }
    item.customFields[fieldName] = value;
    newItems[index] = item;
    setEditedOrder(prev => ({ ...prev, items: newItems }));
  };

  const handleProductSelect = (index: number, product: Product) => {
    const newItems = [...editedOrder.items];
    const item = { ...newItems[index] };

    item.partNo = product.partNo;
    item.description = product.description;
    item.rate = product.rate;
    
    newItems[index] = item;
    setEditedOrder(prev => ({ ...prev, items: newItems }));

    setSuggestions([]);
    setActiveItemIndex(null);
  };

  const handleAddItem = () => {
    const customFields: { [key: string]: string | number } = {};
    if (editedOrder.customColumns) {
        editedOrder.customColumns.forEach(col => {
            customFields[col.name] = '';
        });
    }
    const newItem: OrderItem = { partNo: '', description: '', quantity: 1, rate: 0, purchasedFrom: editedOrder.orderTo, notes: '', customFields };
    setEditedOrder(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleDeleteItem = (index: number) => {
    if (editedOrder.items.length <= 1) {
      alert("An order must have at least one item.");
      return;
    }
    const newItems = editedOrder.items.filter((_, i) => i !== index);
    setEditedOrder(prev => ({ ...prev, items: newItems }));
  };
  
  const handleAddCustomColumn = () => {
    const name = newColumn.name.trim();
    if (!name) {
        alert('Column name cannot be empty.');
        return;
    }
    if (editedOrder.customColumns?.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        alert('A column with this name already exists.');
        return;
    }

    const newCustomColumn: CustomColumn = {
        name: name,
        type: newColumn.type,
        ...(newColumn.type === 'formula' && { formula: newColumn.formula }),
    };

    const updatedColumns = [...(editedOrder.customColumns || []), newCustomColumn];
    const updatedItems = editedOrder.items.map(item => ({
        ...item,
        customFields: {
            ...item.customFields,
            [name]: '', // Initialize with empty string
        }
    }));

    setEditedOrder(prev => ({
        ...prev,
        customColumns: updatedColumns,
        items: updatedItems,
    }));
    setVisibleFields(prev => ({ ...prev, [name]: true }));
    setNewColumn({ name: '', type: 'text', formula: '' });
  };

  const handleDeleteCustomColumn = (columnNameToDelete: string) => {
    const updatedColumns = editedOrder.customColumns?.filter(c => c.name !== columnNameToDelete);
    const updatedItems = editedOrder.items.map(item => {
        const newCustomFields = { ...item.customFields };
        if (newCustomFields) {
            delete newCustomFields[columnNameToDelete];
        }
        return { ...item, customFields: newCustomFields };
    });
    setEditedOrder(prev => ({
        ...prev,
        customColumns: updatedColumns,
        items: updatedItems,
    }));
    setVisibleFields(prev => {
        const newFields = { ...prev };
        delete newFields[columnNameToDelete];
        return newFields;
    });
  };


  const toggleFieldVisibility = (field: string) => {
    setVisibleFields(prev => ({ ...prev, [field]: !prev[field] }));
  };
  
  const { subtotal, totalAmount } = useMemo(() => {
    const sub = editedOrder.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    return { subtotal: sub, totalAmount: sub };
  }, [editedOrder.items]);
  
  const generateDocument = async (format: 'pdf' | 'png') => {
    if (!pdfRef.current) return;
    setIsGenerating(true);
    
    const pdfLayoutElement = pdfRef.current;
    
    document.body.appendChild(pdfLayoutElement);
    
    try {
      const canvas = await html2canvas(pdfLayoutElement, { scale: 3 });
      
      if (format === 'png') {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${editedOrder.orderId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const ratio = imgProps.height / imgProps.width;
        const imgHeight = pdfWidth * ratio;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        
        pdf.save(`${editedOrder.orderId}.pdf`);
      }
    } catch(err) {
      console.error("Error generating document:", err);
      alert("Sorry, there was an error generating the document.");
    } finally {
      document.body.removeChild(pdfLayoutElement);
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onSave(editedOrder);
  }

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;
  
    // Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (index !== draggedItemIndex) {
        setDragOverIndex(index);
    }
  };
  
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) {
        setDraggedItemIndex(null);
        setDragOverIndex(null);
        return;
    }

    const newItems = [...editedOrder.items];
    const [draggedItem] = newItems.splice(draggedItemIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    setEditedOrder(prev => ({ ...prev, items: newItems }));
    setDraggedItemIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setDragOverIndex(null);
  };

  const standardColumns = ['partNo', 'description', 'quantity', 'rate', 'amount', 'purchasedFrom', 'notes'];
  const financialFields = ['subtotal', 'totalAmount'];
  const formatFieldName = (name: string) => name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());


  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <button onClick={onBack} className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeftIcon className="w-4 h-4 mr-1"/>
            Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Order #{order.orderId}</h1>
        </div>
        <div className="flex flex-col items-end">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
                id="status"
                value={editedOrder.status}
                onChange={e => handleFieldChange('status', e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
                {OrderStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
      </div>

      {/* Order Header Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b">
        <div>
          <label htmlFor="orderTo" className="block text-sm font-medium text-gray-700">Order To</label>
          <input type="text" id="orderTo" value={editedOrder.orderTo} onChange={e => handleFieldChange('orderTo', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">Select Supplier</label>
          <select 
            id="supplier" 
            value={suppliers.some(s => s.supplierName === editedOrder.orderTo) ? editedOrder.orderTo : ""}
            onChange={handleSupplierChange} 
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
            <option value="">Select a supplier to fill 'Order To'</option>
            {suppliers.map(s => <option key={s.id} value={s.supplierName}>{s.supplierName}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700">Order Date</label>
          <input type="date" id="orderDate" value={editedOrder.orderDate} onChange={e => handleFieldChange('orderDate', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
      </div>

      {/* Custom Column Management */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Add Custom Column</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Column Name</label>
                    <input 
                        type="text" 
                        value={newColumn.name}
                        onChange={(e) => setNewColumn(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Color, Size"
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Column Type</label>
                    <select 
                        value={newColumn.type}
                        onChange={(e) => setNewColumn(prev => ({ ...prev, type: e.target.value as CustomColumn['type'] }))}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white"
                    >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="currency">Currency</option>
                        <option value="formula">Formula</option>
                    </select>
                </div>
                 <div className="md:col-span-1">
                    <button onClick={handleAddCustomColumn} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2">
                        <PlusIcon className="w-5 h-5" />
                        <span>Add Column</span>
                    </button>
                </div>
                {newColumn.type === 'formula' && (
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Formula</label>
                         <input 
                            type="text" 
                            value={newColumn.formula}
                            onChange={(e) => setNewColumn(prev => ({ ...prev, formula: e.target.value }))}
                            placeholder="e.g., {quantity} * {rate}"
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Use curly braces for column names, e.g., `{'{quantity}'}` * `{'{custom column name}'}`.</p>
                    </div>
                )}
            </div>
        </div>


      {/* Items Table */}
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 w-12"><span className="sr-only">Drag Handle</span></th>
              {visibleFields.partNo && <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part No</th>}
              {visibleFields.description && <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>}
              {visibleFields.quantity && <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>}
              {visibleFields.rate && <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>}
              {visibleFields.amount && <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>}
              {visibleFields.purchasedFrom && <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchased From</th>}
              {visibleFields.notes && <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>}
              {editedOrder.customColumns?.map(col => (
                  visibleFields[col.name] &&
                  <th key={col.name} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      <div className="flex items-center justify-between gap-2">
                        <span>{col.name}</span>
                        <button onClick={() => handleDeleteCustomColumn(col.name)} className="text-red-400 hover:text-red-600">
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                      </div>
                  </th>
              ))}
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {editedOrder.items.map((item, index) => {
              const amount = item.quantity * item.rate;
              return (
                <tr 
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={handleDragLeave}
                    className={`
                        ${draggedItemIndex === index ? 'opacity-40 bg-blue-50' : ''}
                        ${dragOverIndex === index && draggedItemIndex !== null && draggedItemIndex !== index ? 'border-t-2 border-blue-500' : ''}
                        transition-colors
                    `}
                >
                  <td className="p-2 text-center align-middle cursor-grab text-gray-400 hover:text-gray-600">
                    <GripVerticalIcon className="w-5 h-5 inline-block" />
                  </td>
                  {visibleFields.partNo && <td className="relative">
                    <input 
                      type="text" 
                      value={item.partNo} 
                      onChange={e => handleItemChange(index, 'partNo', e.target.value)} 
                      onFocus={() => setActiveItemIndex(index)}
                      onBlur={() => setTimeout(() => setActiveItemIndex(null), 200)}
                      className="w-full p-1 border-gray-300 rounded" 
                      autoComplete="off"
                    />
                    {activeItemIndex === index && suggestions.length > 0 && (
                      <div className="absolute z-10 w-full min-w-[400px] bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-80 overflow-y-auto">
                        {suggestions.map(p => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-100 cursor-pointer border-b"
                            onMouseDown={() => handleProductSelect(index, p)}
                          >
                            <div className="flex items-center gap-4">
                               {p.image ? (
                                    <img src={p.image} alt={p.partNo} className="w-16 h-16 object-cover rounded-md bg-gray-100" />
                               ) : (
                                    <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center">
                                       <CubeIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                               )}
                               <div>
                                  <p className="font-bold text-gray-800">{p.partNo}</p>
                                  <p className="text-sm text-gray-600">{p.description}</p>
                                  <p className="text-sm font-semibold text-blue-600">{formatCurrency(p.rate)}</p>
                               </div>
                            </div>
                             <button
                               onClick={() => handleProductSelect(index, p)}
                               className="bg-blue-600 text-white text-sm font-bold py-1 px-3 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Select
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>}
                  {visibleFields.description && <td><input type="text" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className="w-full p-1 border-gray-300 rounded" /></td>}
                  {visibleFields.quantity && <td><input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-20 p-1 border-gray-300 rounded" /></td>}
                  {visibleFields.rate && <td><input type="number" value={item.rate} onChange={e => handleItemChange(index, 'rate', e.target.value)} className="w-24 p-1 border-gray-300 rounded" /></td>}
                  {visibleFields.amount && <td className="p-2 whitespace-nowrap text-sm text-gray-600">{formatCurrency(amount)}</td>}
                  {visibleFields.purchasedFrom && <td><input type="text" value={item.purchasedFrom} onChange={e => handleItemChange(index, 'purchasedFrom', e.target.value)} className="w-full p-1 border-gray-300 rounded" /></td>}
                  {visibleFields.notes && <td><input type="text" value={item.notes} onChange={e => handleItemChange(index, 'notes', e.target.value)} className="w-full p-1 border-gray-300 rounded" /></td>}
                  {editedOrder.customColumns?.map(col => {
                    if (!visibleFields[col.name]) return null;
                    if (col.type === 'formula') {
                        const calculatedValue = calculateFormulaValue(col.formula || '', item);
                        return (
                            <td key={col.name} className="p-2 whitespace-nowrap text-sm text-gray-600 text-right bg-gray-50">
                                {isNaN(calculatedValue) ? 'Error' : calculatedValue.toFixed(2)}
                            </td>
                        );
                    }
                    return (
                        <td key={col.name}>
                            <input 
                                type={col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
                                value={item.customFields?.[col.name] || ''} 
                                onChange={e => handleCustomItemFieldChange(index, col.name, e.target.value)} 
                                className="w-full p-1 border-gray-300 rounded" 
                            />
                        </td>
                    );
                  })}
                  <td className="p-2 text-center">
                    <button onClick={() => handleDeleteItem(index)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5" /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <button onClick={handleAddItem} className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 font-semibold py-2">
        <PlusIcon className="w-5 h-5" />
        <span>Add Item</span>
      </button>

      {/* Totals Section */}
      <div className="flex justify-between items-start mt-6 pt-6 border-t">
        <div className="w-1/2">
            <label htmlFor="footerNote" className="block text-sm font-medium text-gray-700">Footer Note</label>
            <textarea id="footerNote" value={editedOrder.footerNote} onChange={e => handleFieldChange('footerNote', e.target.value)} rows={3} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea>
        </div>
        <div className="w-1/3">
            {visibleFields.subtotal && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Subtotal</span>
                    <span className="text-sm text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
            )}
             {visibleFields.totalAmount && (
                <div className="flex justify-between items-center mt-4 pt-2 border-t">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
                </div>
            )}
        </div>
      </div>
      
      {/* Field Visibility Toggles */}
      <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Toggle Column Visibility</h3>
          <div className="space-y-3">
              <div>
                  <h4 className="font-semibold text-gray-700 mb-2 text-sm">Standard Columns</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {standardColumns.map((field) => (
                          <label key={field} className="inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={!!visibleFields[field]} onChange={() => toggleFieldVisibility(field)} className="rounded text-blue-600 focus:ring-blue-500" />
                              <span className="ml-2 text-sm text-gray-700">{formatFieldName(field)}</span>
                          </label>
                      ))}
                  </div>
              </div>
              {editedOrder.customColumns && editedOrder.customColumns.length > 0 && (
                  <div>
                      <h4 className="font-semibold text-gray-700 mb-2 text-sm">Custom Columns</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                          {editedOrder.customColumns.map((col) => (
                              <label key={col.name} className="inline-flex items-center cursor-pointer">
                                  <input type="checkbox" checked={!!visibleFields[col.name]} onChange={() => toggleFieldVisibility(col.name)} className="rounded text-blue-600 focus:ring-blue-500" />
                                  <span className="ml-2 text-sm text-gray-700">{col.name}</span>
                              </label>
                          ))}
                      </div>
                  </div>
              )}
               <div>
                  <h4 className="font-semibold text-gray-700 mb-2 text-sm">Financial Totals</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {financialFields.map((field) => (
                          <label key={field} className="inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={!!visibleFields[field]} onChange={() => toggleFieldVisibility(field)} className="rounded text-blue-600 focus:ring-blue-500" />
                              <span className="ml-2 text-sm text-gray-700">{formatFieldName(field)}</span>
                          </label>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 pt-6 border-t flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-3">
            <button onClick={() => generateDocument('pdf')} disabled={isGenerating} className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50">
              <DocumentDuplicateIcon className="w-5 h-5"/> {isGenerating ? 'Generating...' : 'Generate PDF'}
            </button>
            <button onClick={() => generateDocument('png')} disabled={isGenerating} className="flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition disabled:opacity-50">
              <PhotographIcon className="w-5 h-5"/> {isGenerating ? 'Generating...' : 'Generate Image'}
            </button>
        </div>
        <div className="flex gap-3">
             <button onClick={() => onDelete(order.orderId)} className="flex items-center justify-center gap-2 text-red-600 font-bold py-2 px-4 rounded-lg hover:bg-red-50 transition">
              <TrashIcon className="w-5 h-5"/> Delete Order
            </button>
            <button onClick={handleSave} className="flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition shadow-md">
              <SaveIcon className="w-5 h-5"/> Save Order
            </button>
        </div>
      </div>
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
          <OrderPDFLayout ref={pdfRef} order={editedOrder} settings={shopSettings} visibleFields={visibleFields} />
      </div>
    </div>
  );
}
