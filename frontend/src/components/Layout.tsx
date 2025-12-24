import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Book, Keyboard, User, Home as HomeIcon, Coffee, Layers, LogOut, Settings as SettingsIcon } from 'lucide-react';
import clsx from 'clsx';
import { useUserStore } from '../store/useStore';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useUserStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { path: '/', label: '咖啡厅首页', icon: HomeIcon },
    { path: '/typing', label: '点单练习', icon: Coffee },
    { path: '/grammar', label: '研读时光', icon: Book },
    { path: '/vocabulary', label: '每日单词', icon: Layers },
    { path: '/profile', label: '会员中心', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold">
                  <Coffee className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-gray-900">아아咖啡厅</span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 transition-colors',
                      location.pathname === item.path
                        ? 'border-amber-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-amber-300 hover:text-gray-700'
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="relative" ref={dropdownRef}>
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-semibold border border-amber-200">
                      {profile.avatar.includes('http') ? (
                        <img src={profile.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-lg">{profile.avatar}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden md:block">{profile.username}</span>
                  </div>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-sm font-medium text-gray-900 truncate">{profile.username}</p>
                        <p className="text-xs text-gray-500 truncate">{profile.bio}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        个人中心
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Open settings modal or navigate to settings tab
                          navigate('/profile');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 flex items-center gap-2"
                      >
                        <SettingsIcon className="w-4 h-4" />
                        偏好设置
                      </button>
                      <div className="border-t border-gray-50 my-1"></div>
                      <button
                        onClick={() => {
                          // Mock logout
                          setIsDropdownOpen(false);
                          alert('退出功能暂未接入后端');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; 2025 Korean Learning Tool. Designed for Students. Developed by 羊驼.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
