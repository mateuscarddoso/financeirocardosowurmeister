import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function PendingPage() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center animate-fade-in max-w-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
          <Loader2 className="h-8 w-8 text-warning animate-spin" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Aguardando liberação</h1>
        <p className="text-sm text-muted-foreground">
          Seu acesso será liberado pelo administrador. Você será notificado quando estiver pronto.
        </p>
        <button
          onClick={signOut}
          className="text-sm text-muted-foreground underline hover:text-foreground transition"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
