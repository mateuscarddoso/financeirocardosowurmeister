import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, FileText, TrendingUp, Settings, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import { useAreas } from '@/hooks/useAreas';
import { getXPProgress, getLevelFromXP } from '@/lib/xp';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const navItems = [
  { to: '/', label: 'Projetos', icon: LayoutGrid },
  { to: '/notes', label: 'Notas', icon: FileText },
  { to: '/progress', label: 'Progresso', icon: TrendingUp },
];

interface SidebarProps {
  selectedArea: string | null;
  onSelectArea: (id: string | null) => void;
}

export function Sidebar({ selectedArea, onSelectArea }: SidebarProps) {
  const location = useLocation();
  const { data: profile } = useProfile();
  const { data: areas } = useAreas();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLeader = profile?.role === 'leader';
  const xpProgress = profile ? getXPProgress(profile.xp || 0) : 0;
  const level = profile ? getLevelFromXP(profile.xp || 0) : { level: 1, title: 'Iniciante' };

  // Members only see their own area
  const visibleAreas = isLeader ? areas : areas?.filter(a => a.id === profile?.area_id);
  const firstName = profile?.name?.split(' ')[0] || 'Você';

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="px-5 py-5">
        <h1 className="text-lg font-bold text-white">TaskFlow</h1>
        <p className="text-[11px] font-medium text-white/50">IAM Treinamentos</p>
        {!isLeader && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Sua área</p>
            <p className="mt-1 text-sm font-semibold text-white">Área de {firstName}</p>
            <p className="mt-1 text-[11px] text-white/55">
              {visibleAreas?.[0]?.name ? `Equipe ${visibleAreas[0].name}` : 'Tarefas atribuídas a você'}
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(item => {
          const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                active ? 'bg-sidebar-accent text-white' : 'text-white/70 hover:bg-sidebar-accent/50 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {/* Areas filter */}
        {visibleAreas && visibleAreas.length > 0 && (
          <div className="pt-6">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">
              {isLeader ? 'Áreas funcionais' : 'Equipe'}
            </p>
            {isLeader && (
              <button
                onClick={() => { onSelectArea(null); setMobileOpen(false); }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition',
                  !selectedArea ? 'bg-sidebar-accent text-white' : 'text-white/60 hover:text-white'
                )}
              >
                Todas
              </button>
            )}
            {visibleAreas.map(area => {
              const isSelected = selectedArea === area.id;
              return (
                <button
                  key={area.id}
                  onClick={() => {
                    if (isLeader) {
                      onSelectArea(isSelected ? null : area.id);
                    }
                    setMobileOpen(false);
                  }}
                  disabled={!isLeader}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition',
                    isSelected ? 'bg-sidebar-accent text-white' : 'text-white/60 hover:text-white',
                    !isLeader && 'cursor-default'
                  )}
                >
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: area.color }} />
                  {area.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Settings (leader only) */}
        {isLeader && (
          <div className="pt-4">
            <Link
              to="/settings"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                location.pathname === '/settings' ? 'bg-sidebar-accent text-white' : 'text-white/70 hover:bg-sidebar-accent/50 hover:text-white'
              )}
            >
              <Settings className="h-4 w-4" />
              Configurações
            </Link>
          </div>
        )}
      </nav>

      {/* XP Bar */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-white/60">Nível {level.level}</span>
          <span className="text-[11px] text-white/40">{profile?.xp || 0} XP</span>
        </div>
        <Progress value={xpProgress} className="h-1.5 bg-sidebar-accent" />
        <p className="text-[11px] text-white/50 mt-1">{level.title}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 rounded-lg bg-accent p-2 text-accent-foreground md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[200px] flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 h-screen w-[260px] md:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
