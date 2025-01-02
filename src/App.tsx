import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import { MapPin } from 'lucide-react';
import { initializeWebSocket } from './services/websocket';
import DashboardPage from './pages/DashboardPage';
import DriverControls from './pages/DriverControls';
import RoutePlanningPage from './pages/RoutePlanningPage';
import LiveTrackingPage from './pages/LiveTrackingPage';
import { Toaster } from 'react-hot-toast';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    initializeWebSocket();
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'driver-controls':
        return <DriverControls />;
      case 'route-planning':
        return <RoutePlanningPage />;
      case 'live-tracking':
        return <LiveTrackingPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      <Sidebar onNavigate={setCurrentPage} currentPage={currentPage} />
      
      <div className={`flex-1 transition-all duration-300 ${
        isSidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <MapPin className="w-8 h-8 text-blue-500" />
                <span className="ml-2 text-xl font-semibold">Vehicle Tracker</span>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;