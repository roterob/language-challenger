import { NavLink } from 'react-router-dom';
import { BookOpen, ListChecks, PlayCircle, Upload, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/resources', label: 'Recursos', icon: BookOpen },
  { to: '/lists', label: 'Listas', icon: ListChecks },
  { to: '/executions', label: 'Ejecuciones', icon: PlayCircle },
  { to: '/imports', label: 'Importar', icon: Upload },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] border-r bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                collapsed && 'justify-center px-2',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
