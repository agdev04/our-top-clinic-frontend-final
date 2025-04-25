import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  DollarSign, 
  CalendarDays, 
  LogOut, 
  Settings, 
  MessageSquare, 
  LayoutDashboard, 
  ChevronRight, 
  Briefcase, 
} from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

// Sidebar navigation items (keeping existing structure)
const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, route: '/admin-dashboard' },
  { name: 'Patients', icon: Users, route: '/admin-dashboard/patients' },
  { name: 'Providers', icon: Briefcase, route: '/admin-dashboard/providers' },
  { name: 'Services', icon: DollarSign, route: '/admin-dashboard/services' },
  { name: 'Appointments', icon: CalendarDays, route: '/admin-dashboard/appointments' },
  { name: 'Commission Rating', icon: DollarSign, route: '/admin-dashboard/commission-rating' },
  { name: 'Messages', icon: MessageSquare, route: '/admin-dashboard/messages' },
  { name: 'Settings', icon: Settings, route: '/admin-dashboard/settings' },
];

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`transition-all duration-300 ease-in-out bg-white text-gray-700 flex flex-col border-r border-gray-200 ${sidebarCollapsed ? 'w-20 items-center' : 'w-64'}`}> 
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center h-16' : 'justify-between h-16 px-4'}`}> 
          {!sidebarCollapsed && (
            <div className="flex items-center">
              <span className="font-semibold text-lg text-teal-600">OurTopClinic</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-gray-500 hover:text-gray-700">
            <ChevronRight className={`transform transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} size={20} />
          </Button>
        </div>
        <nav className="flex-1 mt-4 px-2 space-y-1">
          {navItems.map((item) => (
            <Link to={item.route} key={item.name}>
              <Button
                variant={location.pathname === item.route ? 'secondary' : 'ghost'}
                className={`w-full flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${location.pathname === item.route ? 'bg-teal-100 text-teal-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                title={item.name}
              >
                <item.icon className="h-5 w-5" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className={`w-full flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}