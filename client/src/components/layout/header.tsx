import { Menu, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from './user-menu';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="fixed top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="mr-2">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Languages className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold hidden sm:inline">Language Challenger</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
