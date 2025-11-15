
import React from 'react';
import { View } from '../types';
import { HomeIcon, ClipboardListIcon, CubeIcon, UsersIcon, CogIcon, PlusIcon } from './Icons';

interface BottomNavProps {
  currentView: View;
  onNavigate: (view: View) => void;
  onAddNewOrder: () => void;
}

const navItems: { view: View; label: string; icon: React.ComponentType<{className: string}> }[] = [
  { view: 'dashboard', label: 'Home', icon: HomeIcon },
  { view: 'orders', label: 'Orders', icon: ClipboardListIcon },
  { view: 'products', label: 'Products', icon: CubeIcon },
  { view: 'suppliers', label: 'Suppliers', icon: UsersIcon },
  { view: 'settings', label: 'Settings', icon: CogIcon },
];

// FIX: Extracted props to a dedicated interface to solve typing issue with the 'key' prop.
interface BottomNavItemProps {
  view: View;
  label: string;
  icon: React.ComponentType<{ className: string }>;
  isActive: boolean;
  onNavigate: (view: View) => void;
}

// FIX: Explicitly type BottomNavItem as a React.FC to ensure special props like 'key' are handled correctly by TypeScript.
const BottomNavItem: React.FC<BottomNavItemProps> = ({ view, label, icon: Icon, isActive, onNavigate }) => (
    <button
      onClick={() => onNavigate(view)}
      aria-label={label}
      className={`flex flex-col items-center justify-center w-full h-full transition-colors pt-2 pb-1 ${
        isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
      }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </button>
);


export default function BottomNav({ currentView, onNavigate, onAddNewOrder }: BottomNavProps) {
  return (
    <div className="md:hidden">
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-t-lg z-40">
        <div className="flex justify-around h-16">
          {navItems.map(item => (
            <BottomNavItem 
              key={item.view}
              view={item.view}
              label={item.label}
              icon={item.icon}
              isActive={currentView === item.view}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>
      
      <button
        onClick={onAddNewOrder}
        className="fixed bottom-20 right-5 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-all transform hover:scale-105 active:scale-95 z-50"
        aria-label="Add New Order"
      >
        <PlusIcon className="w-6 h-6" />
      </button>
    </div>
  );
}
