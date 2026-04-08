import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface CompletionCelebrationProps {
  open: boolean;
  taskTitle?: string;
  onClose: () => void;
}

export function CompletionCelebration({ open, taskTitle, onClose }: CompletionCelebrationProps) {
  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(onClose, 1800);
    return () => window.clearTimeout(timeout);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center overflow-hidden"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.03, opacity: 0 }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_top,#79f2ad_0%,#1D9E75_42%,#0f6d4f_100%)]"
          />
          <motion.div
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ delay: 0.08 }}
            className="relative mx-6 flex max-w-lg flex-col items-center rounded-[28px] border border-white/20 bg-white/12 px-8 py-10 text-center text-white shadow-2xl backdrop-blur-md"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">Tarefa concluída</p>
            <h3 className="mt-3 text-2xl font-semibold leading-tight">Você avançou mais um passo.</h3>
            <p className="mt-3 max-w-md text-sm text-white/82">
              {taskTitle ? `"${taskTitle}" foi concluída com sucesso.` : 'Mais uma entrega finalizada com sucesso.'}
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm font-medium text-white/85">
              <Sparkles className="h-4 w-4" />
              Progresso desbloqueado
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
