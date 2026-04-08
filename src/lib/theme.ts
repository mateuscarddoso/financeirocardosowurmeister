// EDITAR AQUI: Cores principais do TaskFlow IAM
export const colors = {
  primary: '#0034B8',       // Azul IAM médio — botões, destaques, XP
  dark: '#040C74',          // Azul IAM navy — sidebar, headers
  surface: '#FFFFFF',
  background: '#F4F6FB',    // Azul muito frio, quase branco
  textPrimary: '#0D0D0D',
  textSecondary: '#6B7280',
  border: '#E2E6F0',
  success: '#1D9E75',
  warning: '#EF9F27',
  error: '#E24B4A',

  // Dark mode overrides
  darkSidebar: '#020A5A',
  darkBackground: '#0D1117',
  darkSurface: '#161B22',
} as const;

// EDITAR AQUI: Limites de XP por nível
export const XP_LEVELS = [
  { level: 1, title: 'Iniciante', min: 0, max: 200 },
  { level: 2, title: 'Em ritmo', min: 201, max: 500 },
  { level: 3, title: 'Consistente', min: 501, max: 1000 },
  { level: 4, title: 'Executor', min: 1001, max: 1800 },
  { level: 5, title: 'Referência', min: 1801, max: 3000 },
  { level: 6, title: 'Lenda', min: 3001, max: Infinity },
] as const;

// EDITAR AQUI: Prioridades
export const PRIORITIES = {
  high: { label: 'Alta', color: '#E24B4A' },
  mid: { label: 'Média', color: '#EF9F27' },
  low: { label: 'Baixa', color: '#1D9E75' },
} as const;
