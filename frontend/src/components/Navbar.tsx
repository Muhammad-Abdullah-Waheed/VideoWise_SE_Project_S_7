import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Video, LogOut, User, Settings, Moon, Sun } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="glass-card border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Video className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">VideoWise</span>
          </Link>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/collections"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors"
                >
                  Collections
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors flex items-center space-x-1"
                >
                  <User className="h-4 w-4" />
                  <span>{user?.name}</span>
                </Link>
                <Link
                  to="/settings"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors"
                >
                  <Settings className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

