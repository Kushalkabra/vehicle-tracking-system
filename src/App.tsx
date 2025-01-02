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
    <div className="flex min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'glass',
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.9)',
            color: '#1f2937',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)',
          },
        }}
      />
      
      <Sidebar onNavigate={setCurrentPage} currentPage={currentPage} />
      
      <div className={`
        flex-1 transition-all duration-300
        lg:ml-64 
        ${isSidebarCollapsed ? 'lg:ml-16' : ''}
      `}>
        <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <span className="text-xl font-bold text-gray-800 ml-8 lg:ml-0">FleetTracker</span>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;