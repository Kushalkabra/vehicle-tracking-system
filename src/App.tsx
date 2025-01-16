import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import { Toaster } from 'react-hot-toast';
import { VehicleProvider } from './context/VehicleContext';
import ConnectionStatus from './components/ConnectionStatus';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import BatteryStatus from './components/BatteryStatus';
import NetworkStatus from './components/NetworkStatus';
import ErrorBoundary from './components/ErrorBoundary';
import QueueMonitor from './components/QueueMonitor';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <ErrorBoundary>
      <VehicleProvider>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          <Sidebar 
            onNavigate={setCurrentPage}
            currentPage={currentPage}
          />
          <div className="flex-1 lg:ml-64">
            <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl font-bold text-gray-800">FleetTracker</span>
                  </div>
                </div>
              </div>
            </nav>

            <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
              <DashboardPage />
            </main>
          </div>
          <ConnectionStatus />
          <PWAInstallPrompt />
          <OfflineIndicator />
          <BatteryStatus />
          <NetworkStatus />
          <QueueMonitor />
        </div>
      </VehicleProvider>
    </ErrorBoundary>
  );
}

export default App;