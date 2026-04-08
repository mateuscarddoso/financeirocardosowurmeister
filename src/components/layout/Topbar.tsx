import { Moon, Sun, List, LayoutGrid } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { AvatarCircle } from '@/components/shared/AvatarCircle';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

interface TopbarProps {
  title: string;
  subtitle?: string;
  viewMode: 'list' | 'kanban';
  onViewModeChange: (mode: 'list' | 'kanban') => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

export function Topbar({ title, subtitle, viewMode, onViewModeChange, darkMode, onToggleDark }: TopbarProps) {
  const location = useLocation();
  const { data: profile } = useProfile();
  const { signOut } = useAuth();
  const isProjects = location.pathname === '/';

  return (
    <header className="flex min-h-14 items-center justify-between gap-3 border-b border-border bg-card px-4 py-2 md:px-6">
      <div className="min-w-0 ml-10 md:ml-0">
        <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {isProjects && (
          <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
            <button
              onClick={() => onViewModeChange('list')}
              className={`rounded-md p-1.5 transition ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="Visualizar em lista"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('kanban')}
              className={`rounded-md p-1.5 transition ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="Visualizar em kanban"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <button
          onClick={onToggleDark}
          className="rounded-lg p-2 text-muted-foreground hover:text-foreground transition"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full">
              <AvatarCircle src={profile?.avatar_url} name={profile?.name} size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {profile?.role === 'leader' && (
              <DropdownMenuItem asChild>
                <Link to="/settings">Configurações</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={signOut}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
