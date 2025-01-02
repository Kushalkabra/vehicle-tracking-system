import React from 'react';
import { LayoutDashboard, Car, Menu, Map, Navigation } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentPage }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`bg-white shadow-lg min-h-screen fixed left-0 top-0 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && <h1 className="text-xl font-semibold">Navigation</h1>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <button 
              onClick={() => onNavigate('dashboard')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                currentPage === 'dashboard' ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <LayoutDashboard size={20} />
              {!isCollapsed && <span>Dashboard</span>}
            </button>
          </li>
          <li>
            <button 
              onClick={() => onNavigate('driver-controls')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                currentPage === 'driver-controls' ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <Car size={20} />
              {!isCollapsed && <span>Driver Controls</span>}
            </button>
          </li>
          <li>
            <button 
              onClick={() => onNavigate('route-planning')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                currentPage === 'route-planning' ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <Map size={20} />
              {!isCollapsed && <span>Route Planning</span>}
            </button>
          </li>
          <li>
            <button 
              onClick={() => onNavigate('live-tracking')}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                currentPage === 'live-tracking' ? 'bg-blue-50 text-blue-600' : ''
              }`}
            >
              <Navigation size={20} />
              {!isCollapsed && <span>Live Tracking</span>}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 