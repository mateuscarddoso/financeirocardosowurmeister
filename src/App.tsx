import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import LoginPage from '@/pages/LoginPage';
import PendingPage from '@/pages/PendingPage';
import ProjectsPage from '@/pages/ProjectsPage';
import NotesPage from '@/pages/NotesPage';
import ProgressPage from '@/pages/ProgressPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  if (loading || (user && profileLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (profile?.role === 'pending') return <PendingPage />;

  const personalLabel = profile?.name
    ? `Área de ${profile.name.split(' ')[0]}`
    : 'Minha área';
  const areaName = profile?.role === 'leader'
    ? (selectedArea ? 'Área filtrada' : 'Todas as áreas')
    : personalLabel;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar selectedArea={selectedArea} onSelectArea={setSelectedArea} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={areaName}
          subtitle={profile?.role === 'leader'
            ? 'Visão geral por área e por pessoa'
            : 'Suas tarefas e prioridades'}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(!darkMode)}
        />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<ProjectsPage areaId={selectedArea} viewMode={viewMode} />} />
            <Route path="/notes" element={<NotesPage areaId={selectedArea} />} />
            <Route path="/progress" element={<ProgressPage areaId={selectedArea} />} />
            <Route path="/settings" element={
              profile?.role === 'leader' ? <SettingsPage /> : <Navigate to="/" />
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
