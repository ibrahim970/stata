import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut, isAdmin } = useAuth();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Events', href: '/events' },
    { name: 'People', href: '/people' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <nav className="bg-[#1F2A44] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-[#2F5BEA] rounded-full flex items-center justify-center">
                <span className="text-xl font-bold">S</span>
              </div>
              <span className="text-xl font-bold">STATA</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive(item.href)
                    ? 'text-[#F39C12] border-b-2 border-[#F39C12]'
                    : 'text-white hover:text-[#F39C12]'
                } px-3 py-2 text-sm font-medium transition-colors`}
              >
                {item.name}
              </Link>
            ))}

            {user ? (
              <>
                {isAdmin && (
                  <div className="relative group">
                    <button className="px-3 py-2 text-sm font-medium text-white hover:text-[#F39C12] transition-colors flex items-center space-x-1">
                      <span>Admin</span>
                    </button>
                    <div className="absolute left-0 mt-0 w-48 bg-white text-gray-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm hover:bg-[#F5F7FA] first:rounded-t-md"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/admin/posts"
                        className="block px-4 py-2 text-sm hover:bg-[#F5F7FA]"
                      >
                        Manage Posts
                      </Link>
                      <Link
                        to="/admin/events"
                        className="block px-4 py-2 text-sm hover:bg-[#F5F7FA]"
                      >
                        Manage Events
                      </Link>
                      <Link
                        to="/admin/people"
                        className="block px-4 py-2 text-sm hover:bg-[#F5F7FA]"
                      >
                        Manage People
                      </Link>
                      <Link
                        to="/admin/settings"
                        className="block px-4 py-2 text-sm hover:bg-[#F5F7FA] last:rounded-b-md flex items-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                    </div>
                  </div>
                )}
                <Link
                  to="/profile"
                  className="flex items-center space-x-1 text-white hover:text-[#F39C12] transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">{profile?.full_name || 'Profile'}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-1 text-white hover:text-[#E74C3C] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-[#F39C12] px-3 py-2 text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-[#F39C12] transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-[#1F2A44] border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`${
                  isActive(item.href)
                    ? 'text-[#F39C12] bg-gray-800'
                    : 'text-white hover:text-[#F39C12] hover:bg-gray-800'
                } block px-3 py-2 rounded-md text-base font-medium transition-colors`}
              >
                {item.name}
              </Link>
            ))}

            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:text-[#F39C12] hover:bg-gray-800 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-[#F39C12] hover:bg-gray-800 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }}
                  className="w-full text-left text-white hover:text-[#E74C3C] hover:bg-gray-800 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-[#F39C12] hover:bg-gray-800 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-[#F39C12] hover:bg-gray-800 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
