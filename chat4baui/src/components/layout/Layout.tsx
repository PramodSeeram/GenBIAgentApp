import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  
  useEffect(() => {
    console.log("Layout mounted, path:", location.pathname);
  }, [location.pathname]);
  
  // Don't show sidebar on login page
  if (isLoginPage) {
    return <div className="min-h-screen">{children}</div>;
  }
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
    </div>
  );
};
