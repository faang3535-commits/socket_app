'use client';

import { useState, useEffect } from 'react';
import { MenuIcon, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { DrawerContent, HeaderDrawer } from '@/UI/navbarUI/navbarUI';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/login', label: 'Login' },
  { href: '/register', label: 'Register' },
  { href: '/chat', label: 'Chat' },
];

const HERO_ITEMS = [
  { id: 1, classname: 'bg-gradient-to-br from-red-400 to-orange-500', title: 'Real-time' },
  { id: 2, classname: 'bg-gradient-to-br from-blue-400 to-indigo-600', title: 'Scalable' },
  { id: 3, classname: 'bg-gradient-to-br from-emerald-400 to-teal-500', title: 'Secure' },
];

export default function Navbar() {
  const [headerOpen, setHeaderOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setHeaderOpen(false);
  }, [location]);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-neutral-200 dark:border-neutral-800 py-3' 
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 z-50 relative group">
          {/* <div className="bg-blue-600 text-white p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
          </div> */}
          <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            <span className="text-blue-600">Chat</span>
          </span>
        </Link>. 

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">  
          <ul className="flex gap-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                    location.pathname === item.href 
                      ? 'text-blue-600' 
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link 
            to="/register" 
            className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            Get Started
          </Link>
        </nav>

        {/* Mobile Menu Trigger */}
        <div className="md:hidden">
          <HeaderDrawer 
            open={headerOpen} 
            setOpen={setHeaderOpen} 
            trigger={
              <button className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors">
                <MenuIcon />
              </button>
            }
          >
            <DrawerContent>
              <div className="container mx-auto">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-lg font-bold">Menu</h2>
                   <button 
                     onClick={() => setHeaderOpen(false)}
                     className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                   >
                     <X size={20} />
                   </button>
                </div>

                <nav className="flex flex-col gap-2 mb-8">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`text-2xl font-bold py-3 border-b border-neutral-100 dark:border-neutral-800 ${
                        location.pathname === item.href ? 'text-blue-600' : 'text-neutral-900 dark:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {HERO_ITEMS.map((item) => (
                    <div
                      key={item.id}
                      className={`${item.classname} aspect-square rounded-2xl flex items-center justify-center p-2 text-center`}
                    >
                      <span className="text-white font-semibold text-xs">{item.title}</span>
                    </div>
                  ))}
                </div>

                <Link 
                  to="/register" 
                  className="w-full block text-center py-4 bg-blue-600 text-white rounded-xl font-bold text-lg mt-4 active:scale-95 transition-transform"
                >
                  Get Started Now
                </Link>
              </div>
            </DrawerContent>
          </HeaderDrawer>
        </div>
      </div>
    </header>
  );
}
