import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { Footer } from './footer';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onToggleSidebar={() => setSidebarCollapsed((c) => !c)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main
        className={cn(
          'flex-1 mt-14 transition-all duration-300 p-6',
          sidebarCollapsed ? 'ml-16' : 'ml-56',
        )}
      >
        <Outlet />
      </main>
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-56')}>
        <Footer />
      </div>
    </div>
  );
}
