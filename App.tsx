
import React, { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Order, Supplier, ShopSettings, View, Product } from './types';
import { DEFAULT_ORDERS, DEFAULT_SUPPLIERS, DEFAULT_SETTINGS, DEFAULT_PRODUCTS } from './constants';
import OrderList from './components/OrderList';
import OrderDetail from './components/OrderDetail';
import SupplierList from './components/SupplierList';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import BottomNav from './components/BottomNav';
import ConfirmationModal from './components/ConfirmationModal';
import SupplierInUseModal from './components/SupplierInUseModal';
import BulkOrderActionModal from './components/BulkOrderActionModal';
import { PlusIcon, ClipboardListIcon, CogIcon, UsersIcon, HomeIcon, CubeIcon } from './components/Icons';

export default function App() {
  const [orders, setOrders] = useLocalStorage<Order[]>('fm-oms-orders', DEFAULT_ORDERS);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('fm-oms-suppliers', DEFAULT_SUPPLIERS);
  const [settings, setSettings] = useLocalStorage<ShopSettings>('fm-oms-settings', DEFAULT_SETTINGS);
  const [products, setProducts] = useLocalStorage<Product[]>('fm-oms-products', DEFAULT_PRODUCTS);

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  
  // State for simple order deletion
  const [isOrderDeleteModalOpen, setIsOrderDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // State for the complex supplier deletion flow
  const [supplierActionState, setSupplierActionState] = useState<{
    target: Supplier | null;
    isSupplierInUseModalOpen: boolean;
    isBulkActionModalOpen: boolean;
    bulkActionType: 'reassign' | 'delete' | null;
    isConfirmModalOpen: boolean;
    confirmModalContent: { title: string; message: string; };
    confirmModalAction: (() => void) | null;
  }>({
    target: null,
    isSupplierInUseModalOpen: false,
    isBulkActionModalOpen: false,
    bulkActionType: null,
    isConfirmModalOpen: false,
    confirmModalContent: { title: '', message: '' },
    confirmModalAction: null,
  });

  const ordersForSupplierAction = useMemo(() => {
    if (!supplierActionState.target) return [];
    return orders.filter(o => o.orderTo.toLowerCase() === supplierActionState.target!.supplierName.toLowerCase());
  }, [orders, supplierActionState.target]);


  const handleNavigate = (view: View) => {
    setActiveOrderId(null);
    setCurrentView(view);
  };

  const handleSelectOrder = (orderId: string) => {
    setActiveOrderId(orderId);
    setCurrentView('order-detail');
  };

  const handleSaveOrder = useCallback((updatedOrder: Order) => {
    const supplierName = updatedOrder.orderTo.trim();
    if (supplierName && !suppliers.some(s => s.supplierName.toLowerCase() === supplierName.toLowerCase())) {
        const newSupplier: Supplier = {
            id: `sup-${Date.now()}`,
            supplierName: supplierName,
            mobile: '',
            address: '',
            notes: '',
        };
        setSuppliers(prev => [...prev, newSupplier]);
    }
    
    setOrders(prevOrders => {
      const exists = prevOrders.some(o => o.orderId === updatedOrder.orderId);
      if (exists) {
        return prevOrders.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o);
      }
      return [...prevOrders, updatedOrder];
    });
    setCurrentView('orders');
    setActiveOrderId(null);
  }, [setOrders, suppliers, setSuppliers]);

  const openOrderDeleteModal = (orderId: string) => {
    setOrderToDelete(orderId);
    setIsOrderDeleteModalOpen(true);
  };

  const closeOrderDeleteModal = useCallback(() => {
    setOrderToDelete(null);
    setIsOrderDeleteModalOpen(false);
  }, []);

  const confirmDeleteOrder = useCallback(() => {
    if (orderToDelete) {
      setOrders(prev => prev.filter(o => o.orderId !== orderToDelete));
      setCurrentView('orders');
      setActiveOrderId(null);
      closeOrderDeleteModal();
    }
  }, [orderToDelete, setOrders, closeOrderDeleteModal]);

  const handleAddNewOrder = () => {
    const firstSupplierName = suppliers.length > 0 ? suppliers[0].supplierName : '';
    const newOrder: Order = {
      orderId: `ORD-${Date.now()}`,
      orderTo: firstSupplierName,
      orderDate: new Date().toISOString().split('T')[0],
      items: [{ partNo: '', description: '', quantity: 1, rate: 0, notes: '', purchasedFrom: firstSupplierName }],
      footerNote: '',
      status: 'Pending',
      customColumns: [],
    };
    setActiveOrderId(newOrder.orderId);
    setOrders(prev => [...prev, newOrder]);
    setCurrentView('order-detail');
  };

  // --- SUPPLIER DELETION FLOW ---
  const resetSupplierActionState = () => {
    setSupplierActionState({
        target: null, isSupplierInUseModalOpen: false, isBulkActionModalOpen: false,
        bulkActionType: null, isConfirmModalOpen: false, confirmModalContent: { title: '', message: '' },
        confirmModalAction: null
    });
  };

  const handleDeleteSupplierRequest = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    const associatedOrders = orders.filter(o => o.orderTo.toLowerCase() === supplier.supplierName.toLowerCase());

    if (associatedOrders.length === 0) {
      setSupplierActionState(prev => ({
        ...prev,
        target: supplier,
        isConfirmModalOpen: true,
        confirmModalContent: {
          title: 'Delete Supplier',
          message: `Are you sure you want to permanently delete supplier "${supplier.supplierName}"? This action cannot be undone.`
        },
        confirmModalAction: () => () => { // Action needs to be a function returning a function for the callback prop
          setSuppliers(prev => prev.filter(s => s.id !== supplierId));
          resetSupplierActionState();
        }
      }));
    } else {
      setSupplierActionState(prev => ({ ...prev, target: supplier, isSupplierInUseModalOpen: true }));
    }
  };
  
  const handleOpenBulkAction = (type: 'reassign' | 'delete') => {
      setSupplierActionState(prev => ({ ...prev, isSupplierInUseModalOpen: false, bulkActionType: type, isBulkActionModalOpen: true }));
  };

  const handleConfirmBulkAction = ({ orderIds, newSupplierName }: { orderIds: string[], newSupplierName?: string }) => {
    if (supplierActionState.bulkActionType === 'reassign') {
      if (!newSupplierName || orderIds.length === 0) {
          alert("Please select orders and specify a new supplier.");
          return;
      }
      setSupplierActionState(prev => ({
        ...prev,
        isBulkActionModalOpen: false,
        isConfirmModalOpen: true,
        confirmModalContent: {
          title: 'Confirm Reassignment',
          message: `Are you sure you want to reassign ${orderIds.length} order(s) to "${newSupplierName}"?`
        },
        confirmModalAction: () => () => {
          // Add new supplier if they don't exist
          if (!suppliers.some(s => s.supplierName.toLowerCase() === newSupplierName.toLowerCase())) {
            const newSupplier: Supplier = { id: `sup-${Date.now()}`, supplierName: newSupplierName, mobile: '', address: '', notes: '' };
            setSuppliers(prevSuppliers => [...prevSuppliers, newSupplier]);
          }
          // Reassign orders
          setOrders(prevOrders => prevOrders.map(o => orderIds.includes(o.orderId) ? { ...o, orderTo: newSupplierName } : o));
          resetSupplierActionState();
        }
      }));
    } else if (supplierActionState.bulkActionType === 'delete') {
      if (orderIds.length === 0) {
          alert("Please select orders to delete.");
          return;
      }
      setSupplierActionState(prev => ({
        ...prev,
        isBulkActionModalOpen: false,
        isConfirmModalOpen: true,
        confirmModalContent: {
          title: 'Confirm Deletion',
          message: `Are you sure you want to permanently delete ${orderIds.length} selected order(s)? This action cannot be undone.`
        },
        confirmModalAction: () => () => {
          setOrders(prevOrders => prevOrders.filter(o => !orderIds.includes(o.orderId)));
          resetSupplierActionState();
        }
      }));
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard orders={orders} suppliers={suppliers} onSelectOrder={handleSelectOrder} />;
      case 'orders':
        return <OrderList orders={orders} onSelectOrder={handleSelectOrder} onAddNewOrder={handleAddNewOrder} />;
      case 'order-detail':
        const activeOrder = orders.find(o => o.orderId === activeOrderId);
        if (activeOrder) {
          return (
            <OrderDetail 
              order={activeOrder} 
              onSave={handleSaveOrder} 
              onDelete={openOrderDeleteModal}
              onBack={() => setCurrentView('orders')} 
              suppliers={suppliers} 
              shopSettings={settings}
              products={products}
            />
          );
        }
        return <div className="text-center p-8">Order not found.</div>;
      case 'products':
        return <ProductList products={products} setProducts={setProducts} />;
      case 'suppliers':
        return <SupplierList suppliers={suppliers} setSuppliers={setSuppliers} onDeleteRequest={handleDeleteSupplierRequest} />;
      case 'settings':
        return <Settings settings={settings} onSave={setSettings} />;
      default:
        return <Dashboard orders={orders} suppliers={suppliers} onSelectOrder={handleSelectOrder} />;
    }
  };

  const NavItem = ({ view, label, icon }: { view: View; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => handleNavigate(view)}
      className={`flex items-center space-x-3 p-3 w-full text-left rounded-lg transition-colors ${
        currentView === view ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="md:flex h-screen bg-gray-50 font-sans">
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 p-4 flex-col shrink-0">
        <div className="text-2xl font-bold text-gray-800 mb-8">
          FM <span className="text-blue-600">OMS</span>
        </div>
        <nav className="flex-1 space-y-2">
          <NavItem view="dashboard" label="Dashboard" icon={<HomeIcon className="w-6 h-6" />} />
          <NavItem view="orders" label="Orders" icon={<ClipboardListIcon className="w-6 h-6" />} />
          <NavItem view="products" label="Products" icon={<CubeIcon className="w-6 h-6" />} />
          <NavItem view="suppliers" label="Suppliers" icon={<UsersIcon className="w-6 h-6" />} />
          <NavItem view="settings" label="Shop Settings" icon={<CogIcon className="w-6 h-6" />} />
        </nav>
        <button
          onClick={handleAddNewOrder}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
        >
          <PlusIcon className="w-6 h-6" />
          <span>New Order</span>
        </button>
      </aside>
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto pb-24 md:pb-6">
        {renderView()}
      </main>
      <BottomNav 
        currentView={currentView}
        onNavigate={handleNavigate}
        onAddNewOrder={handleAddNewOrder}
      />
      {/* Modals */}
      <ConfirmationModal
        isOpen={isOrderDeleteModalOpen}
        onClose={closeOrderDeleteModal}
        onConfirm={confirmDeleteOrder}
        title="Confirm Order Deletion"
        message={`Are you sure you want to permanently delete order #${orderToDelete}? This action cannot be undone.`}
      />
      {supplierActionState.target && (
        <SupplierInUseModal
          isOpen={supplierActionState.isSupplierInUseModalOpen}
          onClose={resetSupplierActionState}
          supplierName={supplierActionState.target.supplierName}
          orderCount={ordersForSupplierAction.length}
          onReassign={() => handleOpenBulkAction('reassign')}
          onDeleteOrders={() => handleOpenBulkAction('delete')}
        />
      )}
      {supplierActionState.target && supplierActionState.bulkActionType && (
        <BulkOrderActionModal
            isOpen={supplierActionState.isBulkActionModalOpen}
            onClose={resetSupplierActionState}
            onConfirm={handleConfirmBulkAction}
            orders={ordersForSupplierAction}
            suppliers={suppliers}
            action={supplierActionState.bulkActionType}
            supplierName={supplierActionState.target.supplierName}
        />
      )}
      <ConfirmationModal
        isOpen={supplierActionState.isConfirmModalOpen}
        onClose={resetSupplierActionState}
        onConfirm={supplierActionState.confirmModalAction!}
        title={supplierActionState.confirmModalContent.title}
        message={supplierActionState.confirmModalContent.message}
      />
    </div>
  );
}
