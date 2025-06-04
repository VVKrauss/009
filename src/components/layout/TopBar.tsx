import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from '../ui/Logo';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type NavItem = {
  id: string;
  label: string;
  path: string;
  visible: boolean;
};

const TopBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    fetchNavItems();
  }, []);

  const fetchNavItems = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('navigation_items')
        .single();

      if (error) throw error;

      if (data?.navigation_items) {
        setNavItems(data.navigation_items);
      }
    } catch (error) {
      console.error('Error fetching navigation items:', error);
    }
  };

  const visibleNavItems = navItems.filter(item => item.visible);

  return (
    <header className="topbar">
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
          <Logo className="h-10 w-auto" inverted={theme === 'dark'} />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center flex-1 space-x-8">
          {visibleNavItems.map(item => (
            <Link 
              key={item.id}
              to={item.path} 
              className={`font-medium relative py-4 ${
                location.pathname === item.path 
                  ? 'text-primary dark:text-primary-400 after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary-600 dark:after:bg-primary-400' 
                  : 'hover:text-primary dark:hover:text-primary-400'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="flex md:flex-none items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-dark-100 dark:hover:bg-dark-800"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 md:hidden rounded-md text-dark-900 dark:text-white hover:bg-dark-100 dark:hover:bg-dark-800"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-dark-900 shadow-lg z-50 animate-fade-in">
            <nav className="container py-5 flex flex-col space-y-4">
              {visibleNavItems.map(item => (
                <Link 
                  key={item.id}
                  to={item.path} 
                  className={`py-2 font-medium ${
                    location.pathname === item.path 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar