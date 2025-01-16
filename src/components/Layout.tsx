import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      <div className={`sidebar bg-white shadow-lg fixed h-full ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4">
          <button 
            className="w-full p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? '←' : '→'}
          </button>
        </div>
        <nav className="mt-4">
          <Link 
            to="/" 
            className={`block px-4 py-2 mx-2 rounded-lg ${
              location.pathname === '/' 
                ? 'bg-primary-50 text-primary-600' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </Link>
        </nav>
      </div>

      <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
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
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout; 