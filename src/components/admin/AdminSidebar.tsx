import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FileText, 
  Palette, 
  Layers, 
  Package, 
  Clock, 
  Plus, 
  TrendingUp, 
  Settings, 
  LogOut,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/contexts/AdminContext';
import odohlogo from '@/assets/Odoh.jpg';

const AdminSidebar: React.FC = () => {
  const { logout } = useAdmin();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: Settings, end: true },
    { path: '/admin/paper-costs', label: 'Paper Costs', icon: FileText },
    { path: '/admin/toner-costs', label: 'Toner Costs', icon: Palette },
    { path: '/admin/cover-costs', label: 'Cover Costs', icon: Layers },
    { path: '/admin/finishing-costs', label: 'Finishing Costs', icon: Package },
    { path: '/admin/packaging-costs', label: 'Packaging Costs', icon: Package },
    { path: '/admin/bhr-settings', label: 'BHR Settings', icon: Clock },
    { path: '/admin/additional-services', label: 'Additional Services', icon: Plus },
    { path: '/admin/profit-margins', label: 'Profit Margins', icon: TrendingUp },
    { path: '/admin/reset-defaults', label: 'Reset to Default', icon: RotateCcw },
  ];

  return (
    <div className="bg-white w-64 min-h-screen border-r border-gray-200 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <img src={odohlogo} alt="The Odoh Publishers" className="w-12 h-12 object-contain" />
        <h1 className="text-xl font-bold text-blue-600">Admin</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Button
          onClick={logout}
          variant="outline"
          className="w-full flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;