import React from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  BarChart3, 
  FileText, 
  Users,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activeView, onViewChange, isOpen, onClose }: SidebarProps) {
  const { profile, signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'registration', label: 'Patient Registration', icon: UserPlus },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'patients', label: 'Patient Records', icon: FileText },
    ...(profile?.role === 'admin' ? [
      { id: 'user-management', label: 'User Management', icon: Users },
    ] : []),
  ];

  const handleItemClick = (view: string) => {
    onViewChange(view);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:w-64
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-bold text-gray-800">BARMM CASDT</h2>
              <p className="text-sm text-gray-600">{profile?.role === 'admin' ? 'Regional Admin' : 'Barangay User'}</p>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 bg-blue-50 border-b">
            <p className="font-medium text-gray-800">{profile?.full_name}</p>
            <p className="text-sm text-gray-600">{profile?.email}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item.id)}
                    className={`
                      w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors
                      ${activeView === item.id 
                        ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <item.icon size={20} className="mr-3" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t">
            <button
              onClick={signOut}
              className="w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} className="mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}