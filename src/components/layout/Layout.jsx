import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react'; // Make sure this import is here
import { useAuth } from '../../context/AuthContext.jsx';
import Sidebar from '../Sidebar.jsx';

const Layout = ({ children }) => {
  const { preferences } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = preferences.theme === 'dark';
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', preferences.theme);
  }, [preferences.theme]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800 transition-colors duration-300 overflow-hidden">
      <Sidebar 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header - This should be visible on small screens */}
        <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Segese Medical</h1>
          <div className="w-10"></div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;