// Sistema de XP isolado — sem acoplamento com UI

import { XP_LEVELS } from './theme';

// EDITAR AQUI: Valores de XP por ação
export const XP_VALUES = {
  TASK_COMPLETED: 50,
  SUBTASK_COMPLETED: 20,
  MONTH_CLEAN: 100,
} as const;

// EDITAR AQUI: Conquistas (badges)
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGES: Badge[] = [
  { id: 'first_step', name: 'Primeiro passo', description: '1ª tarefa concluída', icon: '🚀' },
  { id: 'five_done', name: '5 em campo', description: '5 tarefas concluídas', icon: '⭐' },
  { id: 'ten_done', name: '10 realizados', description: '10 tarefas concluídas', icon: '🏅' },
  { id: 'perfect_week', name: 'Semana perfeita', description: '5 dias úteis seguidos com pelo menos 1 tarefa concluída', icon: '🔥' },
  { id: 'clean_month', name: 'Mês limpo', description: 'Todas as tarefas do mês concluídas', icon: '🏆' },
  { id: 'first_note', name: 'Nota nova', description: 'Primeira nota criada', icon: '📝' },
];

export function getLevelFromXP(xp: number) {
  const level = XP_LEVELS.find(l => xp >= l.min && xp <= l.max);
  return level || XP_LEVELS[0];
}

export function getXPProgress(xp: number) {
  const level = getLevelFromXP(xp);
  if (level.max === Infinity) return 100;
  const range = level.max - level.min;
  const progress = xp - level.min;
  return Math.round((progress / range) * 100);
}

export function checkNewBadges(
  currentBadges: string[],
  stats: {
    totalCompleted: number;
    consecutiveWorkdays: number;
    monthClean: boolean;
    notesCreated: number;
  }
): string[] {
  const newBadges: string[] = [];

  if (stats.totalCompleted >= 1 && !currentBadges.includes('first_step')) {
    newBadges.push('first_step');
  }
  if (stats.totalCompleted >= 5 && !currentBadges.includes('five_done')) {
    newBadges.push('five_done');
  }
  if (stats.totalCompleted >= 10 && !currentBadges.includes('ten_done')) {
    newBadges.push('ten_done');
  }
  if (stats.consecutiveWorkdays >= 5 && !currentBadges.includes('perfect_week')) {
    newBadges.push('perfect_week');
  }
  if (stats.monthClean && !currentBadges.includes('clean_month')) {
    newBadges.push('clean_month');
  }
  if (stats.notesCreated >= 1 && !currentBadges.includes('first_note')) {
    newBadges.push('first_note');
  }

  return newBadges;
}
