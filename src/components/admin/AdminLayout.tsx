import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Building2, 
  Briefcase,
  Info,
  BarChart3,
  Menu,
  LogOut,
  Download,
  Bell, 
  Settings,
  User,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AdminLayout = () => {
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Главная страница' },
    { to: '/admin/events', icon: Calendar, label: 'Мероприятия' },
    { to: '/admin/speakers', icon: Users, label: 'Спикеры' },
    { to: '/admin/rent', icon: Building2, label: 'Аренда' },
    { to: '/admin/coworking', icon: Briefcase, label: 'Коворкинг' },
    { to: '/admin/about', icon: Info, label: 'О нас' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Статистика' },
    { to: '/admin/navigation', icon: Menu, label: 'Навигация' },
   // { to: '/admin/export', icon: Download, label: 'Экспорт данных' },
    { to: '/admin/calendar', icon: Calendar, label: 'Календарь' }
  ];

  const topBarLinks = [
    { to: '/', label: 'Главная' },
    { to: '/events', label: 'Мероприятия' },
    { to: '/speakers', label: 'Спикеры' },
    { to: '/coworking', label: 'Коворкинг' },
    { to: '/about', label: 'О нас' }
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Вы успешно вышли');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Ошибка при выходе');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 z-50 shadow-sm">
        <div className="flex items-center justify-between h-full px-6">
          {/* Left side - empty for balance */}
          <div className="w-64"></div>
          
          {/* Centered content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center space-x-6">
              {topBarLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {link.label}
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 shadow-sm">
        <div className="p-6 h-full flex flex-col">
          <div className="mb-6">
            <img 
              src="https://wummwcsqsznyyaajcxww.supabase.co/storage/v1/object/public/images/logo/logo_science_hub%20no_title.png"
              alt="Logo"
              className="h-8 w-auto dark:hidden"
            />
            <img 
              src="https://wummwcsqsznyyaajcxww.supabase.co/storage/v1/object/public/images/logo/logo%20science_hub_white_no_title.png"
              alt="Logo"
              className="h-8 w-auto hidden dark:block"
            />
          </div>
          
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-md transition-colors
                    ${isActive 
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 pt-16 p-8">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
