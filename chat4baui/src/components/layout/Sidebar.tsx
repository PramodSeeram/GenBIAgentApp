
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Database, 
  MessageSquare, 
  LayoutDashboard, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const toggleSidebar = () => setCollapsed(!collapsed);
  
  const handleLogout = () => {
    toast.success("Logged out successfully");
    setTimeout(() => navigate('/login'), 1000);
  };
  
  return (
    <aside 
      className={cn(
        "bg-sidebar h-screen border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-border">
        {!collapsed && (
          <h1 className="text-xl font-bold text-chat4ba-700">Chat4BA</h1>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          <NavItem to="/" icon={<Home />} label="Home" collapsed={collapsed} />
          <NavItem to="/data-sources" icon={<Database />} label="Data Sources" collapsed={collapsed} />
          <NavItem to="/chat" icon={<MessageSquare />} label="Chat" collapsed={collapsed} />
          <NavItem to="/dashboard" icon={<LayoutDashboard />} label="Dashboard" collapsed={collapsed} />
          <NavItem to="/settings" icon={<Settings />} label="Settings" collapsed={collapsed} />
        </ul>
      </nav>
      
      <div className="p-4 border-t border-border">
        <button 
          onClick={handleLogout}
          className={cn(
            "flex items-center w-full p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground hover:text-destructive transition-colors",
            collapsed ? "justify-center" : "justify-start"
          )}
        >
          <LogOut size={18} />
          {!collapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, collapsed }) => {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            "flex items-center p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors",
            isActive ? "bg-sidebar-accent text-primary font-medium" : "",
            collapsed ? "justify-center" : "justify-start"
          )
        }
      >
        <span className="flex items-center justify-center">{icon}</span>
        {!collapsed && <span className="ml-3">{label}</span>}
      </NavLink>
    </li>
  );
};
