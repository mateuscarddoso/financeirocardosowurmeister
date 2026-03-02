import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Wallet, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  X, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Database, 
  Search, 
  Layout, 
  Pencil, 
  Settings2, 
  ListTodo,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  CheckSquare,
  Square,
  Upload,
  Image as ImageIcon,
  Target,
  Zap,
  TrendingUp,
  TrendingDown,
  Layers,
  Download,
  FileUp,
  HardDrive
} from 'lucide-react';
import { initIndexedDB, saveToIndexedDB, getFromIndexedDB, getStorageSize, STORES } from './src/indexedDBService';
import initialUserData from './seus_dados_janeiro.json';

// --- SISTEMA TOTALMENTE ZERADO ---
const DEFAULT_RECURRENT = [];
const INITIAL_MONTHLY_DATA = {};


const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// 🛠️ FUNÇÃO PARA FORMATAR DATAS CORRETAMENTE (evita off-by-one)
const formatDateCorrectly = (dateString, options = {}) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', { 
    day: options.day || '2-digit', 
    month: options.month || 'short',
    ...options 
  });
};

// 🛠️ FUNÇÃO PARA EXPORTAR DADOS PARA CSV
const exportToCSV = (monthlyData, recurrentItems, installments, goals) => {
  let csv = 'TIPO,DATA,DESCRIÇÃO,CATEGORIA,VALOR,STATUS\n';
  
  // Exportar transações mensais
  Object.entries(monthlyData).forEach(([key, entries]) => {
    if (Array.isArray(entries)) {
      entries.forEach(entry => {
        csv += `${entry.type},${entry.date},${entry.desc},"${entry.category}",${entry.amount},${entry.isPaid ? 'Pago' : 'Pendente'}\n`;
      });
    }
  });
  
  // Exportar itens recorrentes
  recurrentItems.forEach(item => {
    csv += `${item.type},Recorrente (Dia ${item.dueDay}),${item.desc},"${item.category}",${item.amount},Ativo\n`;
  });
  
  // Exportar parcelamentos
  installments.forEach(inst => {
    csv += `PARCELAMENTO,${inst.startDate} até ${inst.endDate},${inst.description},"Parcelado",${inst.monthlyAmount},Ativo\n`;
  });
  
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
  element.setAttribute('download', `extrato_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

// Exportar todo o estado em JSON estruturado
const exportToJSON = (monthlyData, recurrentItems, installments, goals, appTitle, appLogo) => {
  const payload = {
    exportedAt: new Date().toISOString(),
    appTitle,
    appLogo,
    monthlyData,
    recurrentItems,
    installments,
    goals
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fin_data_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 🛠️ FUNÇÃO PARA IMPORTAR DADOS DO CSV
const parseCSVData = (csvContent) => {
  const lines = csvContent.trim().split('\n');
  const newMonthlyData = {};
  const newRecurrentItems = [];
  let importedCount = 0;
  
  // Pular header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parser simples de CSV (pode falhar com conteúdo complexo)
    const parts = line.split(',');
    if (parts.length < 5) continue;
    
    const type = parts[0].trim();
    const dateOrFreq = parts[1].trim();
    const desc = parts[2].trim().replace(/^"|"$/g, '');
    const category = parts[3].trim().replace(/^"|"$/g, '');
    const value = parseFloat(parts[4]) || 0;
    
    if (type === 'ENTRADA' || type === 'SAIDA') {
      if (dateOrFreq.includes('Recorrente')) {
        newRecurrentItems.push({
          id: `r-${Date.now()}-${Math.random()}`,
          type,
          desc,
          category,
          amount: value,
          dueDay: parseInt(dateOrFreq.match(/\d+/)?.[0]) || 1
        });
      } else if (dateOrFreq.match(/^\d{4}-\d{2}-\d{2}$/)) {
        if (!newMonthlyData[dateOrFreq]) {
          newMonthlyData[dateOrFreq] = [];
        }
        newMonthlyData[dateOrFreq].push({
          id: `s-${Date.now()}-${Math.random()}`,
          type,
          desc,
          category,
          amount: value,
          date: dateOrFreq,
          isPaid: parts[5]?.includes('Pago') || false
        });
      }
    }
    importedCount++;
  }
  
  return { newMonthlyData, newRecurrentItems, importedCount };
};

// 🛠️ UTILITÁRIOS PARA PARCELAMENTOS
const calculateInstallmentProgress = (startDate, currentYear, currentMonth) => {
  const [startYear, startMonth] = startDate.split('-').map(Number);
  const monthsElapsed = (currentYear - startYear) * 12 + (currentMonth - startMonth);
  return Math.max(0, monthsElapsed);
};

const calculateInstallmentMetrics = (inst, year, month) => {
  const monthlyAmt = parseFloat(inst.monthlyAmount) || 0;
  const [startYear, startMonth] = inst.startDate.split('-').map(Number);
  const [endYear, endMonth] = inst.endDate.split('-').map(Number);
  
  const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  const monthsElapsed = (year - startYear) * 12 + (month - startMonth);
  const monthsPaid = Math.max(0, Math.min(monthsElapsed + 1, totalMonths));
  const percentage = (monthsPaid / totalMonths) * 100;
  const amountPaid = monthlyAmt * monthsPaid;
  const amountRemaining = monthlyAmt * (totalMonths - monthsPaid);
  const totalAmount = monthlyAmt * totalMonths;
  
  return {
    totalMonths,
    monthsPaid,
    percentage,
    amountPaid,
    amountRemaining,
    totalAmount,
    isActive: month >= startMonth && year >= startYear && month <= endMonth && year <= endYear
  };
};

// Função para obter todas as parcelas mensais de um parcelamento
const getMonthlyInstallmentAmount = (inst, year, month) => {
  const monthlyAmt = parseFloat(inst.monthlyAmount) || 0;
  const [startYear, startMonth] = inst.startDate.split('-').map(Number);
  const [endYear, endMonth] = inst.endDate.split('-').map(Number);
  
  const currentMonthDate = year * 12 + month;
  const startDate = startYear * 12 + startMonth;
  const endDate = endYear * 12 + endMonth;
  
  if (currentMonthDate >= startDate && currentMonthDate <= endDate) {
    return monthlyAmt;
  }
  return 0;
};

// 🔄 FUNÇÃO PARA RESTAURAR DADOS A PARTIR DE JSON
const restoreDataFromJSON = (jsonString, setters) => {
  try {
    const data = JSON.parse(jsonString);
    
    if (data.recurrentItems && Array.isArray(data.recurrentItems)) {
      setters.setRecurrentItems(data.recurrentItems);
    }
    if (data.monthlyData && typeof data.monthlyData === 'object') {
      setters.setMonthlyData(data.monthlyData);
    }
    if (data.goals && Array.isArray(data.goals)) {
      setters.setGoals(data.goals);
    }
    if (data.installments && Array.isArray(data.installments)) {
      setters.setInstallments(data.installments);
    }
    if (data.appTitle) {
      setters.setAppTitle(data.appTitle);
    }
    if (data.appLogo) {
      setters.setAppLogo(data.appLogo);
    }
    
    // Salvar no localStorage
    localStorage.setItem('fin_rec_nubank', JSON.stringify(data.recurrentItems || []));
    localStorage.setItem('fin_mon_nubank', JSON.stringify(data.monthlyData || {}));
    localStorage.setItem('fin_goals_nubank', JSON.stringify(data.goals || []));
    localStorage.setItem('fin_installments_nubank', JSON.stringify(data.installments || []));
    
    return { success: true, message: `✅ ${Object.keys(data).length} seções restauradas com sucesso!` };
  } catch (err) {
    return { success: false, message: `❌ Erro ao restaurar dados: ${err.message}` };
  }
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('fin_logged_in') === 'true');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projections, setProjections] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fin_projections') || '{}');
    } catch {
      return {};
    }
  });

  const saveProjections = (obj) => {
    setProjections(obj);
    localStorage.setItem('fin_projections', JSON.stringify(obj));
  };

  const updateProjection = (year, month, income, expense) => {
    const key = `${year}-${String(month).padStart(2,'0')}`;
    const newProjs = { ...projections, [key]: { income: parseFloat(income)||0, expense: parseFloat(expense)||0 } };
    saveProjections(newProjs);
  };
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginPassword === '417102a') {
      localStorage.setItem('fin_logged_in', 'true');
      setIsLoggedIn(true);
      setLoginPassword('');
      setLoginError('');
      setIsLoading(true);
      setView('mensal');
      // fake loading for 1s
      setTimeout(() => setIsLoading(false), 1000);
    } else {
      setLoginError('Senha incorreta!');
      setLoginPassword('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="space-y-4 text-center animate-pulse">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin duration-1000"></div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#111827] to-[#0F172A] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-white/10">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600 p-4 rounded-2xl"><Wallet size={32} className="text-white" /></div>
            </div>
            <h1 className="text-center text-2xl font-bold text-slate-800 mb-2">Controle Financeiro</h1>
            <p className="text-center text-sm text-slate-500 mb-8">Acesse sua carteira digital</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 capitalize tracking-widest mb-2 block">Senha</label>
                <input 
                  type="password" 
                  placeholder="Digite sua senha" 
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              
              {loginError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-600 text-xs font-medium">
                  {loginError}
                </div>
              )}
              
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm capitalize tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
              >
                Acessar
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3); // iniciar em março
  const [view, setView] = useState('mensal'); // view inicial: fluxo de caixa (mensal)
  const [selectedMonth, setSelectedMonth] = useState(3);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showPendencies, setShowPendencies] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showGoals, setShowGoals] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showInstallments, setShowInstallments] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState(null);
  const [sortByStatus, setSortByStatus] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryData, setRecoveryData] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true); // Estado de carregamento
  const [storageInfo, setStorageInfo] = useState(null); // Informações de armazenamento


  // Personalização
  const [appTitle, setAppTitle] = useState(() => localStorage.getItem('fin_title_nubank') || 'Meu Controle');
  const [appLogo, setAppLogo] = useState(() => localStorage.getItem('fin_logo_nubank') || null);

  // BACKUP AUTOMÁTICO
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(() => {
    const v = localStorage.getItem('fin_auto_backup_enabled');
    return v ? v === 'true' : true; // ✅ PADRÃO: true (backup automático ATIVADO)
  });
  const [autoBackupDownload, setAutoBackupDownload] = useState(() => {
    const v = localStorage.getItem('fin_auto_backup_download');
    return v ? v === 'true' : false;
  });
  const [autoBackupIntervalMins, setAutoBackupIntervalMins] = useState(() => {
    const v = parseInt(localStorage.getItem('fin_auto_backup_interval') || '30', 10);
    return isNaN(v) ? 30 : v;
  });

  // Armazenamento - Valores iniciais vazios, serão carregados do IndexedDB
  const [recurrentItems, setRecurrentItems] = useState(DEFAULT_RECURRENT);
  const [monthlyData, setMonthlyData] = useState(INITIAL_MONTHLY_DATA);

  // Metas e Parcelamentos
  const [goals, setGoals] = useState([]);
  const [installments, setInstallments] = useState([]);

  // 🔄 Inicializar IndexedDB e carregar dados na montagem
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📦 Inicializando IndexedDB...');
        await initIndexedDB();

        // 1. VERIFICAR SE A CARGA INICIAL JÁ FOI FEITA
        const initialLoadDone = await getFromIndexedDB(STORES.appSettings, 'initial_load_done');

        if (initialLoadDone) {
          console.log('✅ Carga inicial já realizada. Carregando dados do usuário do DB...');
          // Se já foi feito, apenas carrega os dados existentes
          const loadedMonthlyData = await getFromIndexedDB(STORES.monthlyData, 'fin_mon_nubank') || INITIAL_MONTHLY_DATA;
          const loadedRecurrentItems = await getFromIndexedDB(STORES.recurrentItems, 'fin_rec_nubank') || DEFAULT_RECURRENT;
          const loadedGoals = await getFromIndexedDB(STORES.goals, 'fin_goals_nubank') || [];
          const loadedInstallments = await getFromIndexedDB(STORES.installments, 'fin_installments_nubank') || [];
          
          setMonthlyData(loadedMonthlyData);
          setRecurrentItems(loadedRecurrentItems);
          setGoals(loadedGoals);
          setInstallments(loadedInstallments);
          
        } else {
          // 2. PRIMEIRA VEZ: CARREGAR DADOS DO ARQUIVO E SALVAR NO DB
          console.log('📥 Primeira vez acessando! Carregando e salvando seus dados iniciais...');
          
          const { monthlyData: initialMonthly, recurrentItems: initialRecurrent, goals: initialGoals, installments: initialInstallments } = initialUserData;

          setMonthlyData(initialMonthly);
          setRecurrentItems(initialRecurrent);
          setGoals(initialGoals);
          setInstallments(initialInstallments);

          // Salva os dados no IndexedDB
          await saveToIndexedDB(STORES.monthlyData, 'fin_mon_nubank', initialMonthly);
          await saveToIndexedDB(STORES.recurrentItems, 'fin_rec_nubank', initialRecurrent);
          await saveToIndexedDB(STORES.goals, 'fin_goals_nubank', initialGoals);
          await saveToIndexedDB(STORES.installments, 'fin_installments_nubank', initialInstallments);

          // 3. MARCAR QUE A CARGA INICIAL FOI FEITA
          await saveToIndexedDB(STORES.appSettings, 'initial_load_done', true);
          console.log('🚩 Carga inicial marcada como concluída. Não será executada novamente.');
        }

        // Obter informações de armazenamento
        const storage = await getStorageSize();
        if (storage) {
          setStorageInfo(storage);
          console.log(`💾 Armazenamento: ${storage.percentUsed}% utilizado`);
        }

        setIsLoadingData(false);
        console.log('✅ Dados carregados e prontos para uso.');

      } catch (err) {
        console.error('❌ Erro crítico ao carregar dados:', err);
        setIsLoadingData(false); // Libera a tela mesmo em caso de erro
      }
    };

    loadData();
  }, []); // Executar apenas uma vez na montagem

  // 🔄 Sincronização robusta com localStorage E IndexedDB
  useEffect(() => {
    if (isLoadingData) return; // Não salvar enquanto carregando
    
    const saveData = async () => {
      try {
        // Salvar em ambos os locais
        localStorage.setItem('fin_rec_nubank', JSON.stringify(recurrentItems));
        localStorage.setItem('fin_mon_nubank', JSON.stringify(monthlyData));
        localStorage.setItem('fin_title_nubank', appTitle);
        localStorage.setItem('fin_goals_nubank', JSON.stringify(goals));
        localStorage.setItem('fin_installments_nubank', JSON.stringify(installments));
        if (appLogo) localStorage.setItem('fin_logo_nubank', appLogo);
        localStorage.setItem('fin_auto_backup_enabled', autoBackupEnabled ? 'true' : 'false');
        localStorage.setItem('fin_auto_backup_download', autoBackupDownload ? 'true' : 'false');
        localStorage.setItem('fin_auto_backup_interval', String(autoBackupIntervalMins));
        localStorage.setItem('fin_last_save', new Date().toISOString());

        // Salvar em IndexedDB também (persistência superior)
        await saveToIndexedDB(STORES.monthlyData, 'fin_mon_nubank', monthlyData);
        await saveToIndexedDB(STORES.recurrentItems, 'fin_rec_nubank', recurrentItems);
        await saveToIndexedDB(STORES.goals, 'fin_goals_nubank', goals);
        await saveToIndexedDB(STORES.installments, 'fin_installments_nubank', installments);
        
        console.log('💾 Dados sincronizados com IndexedDB e localStorage');
      } catch (err) {
        console.error('Erro ao salvar dados:', err);
      }
    };

    saveData();
  }, [recurrentItems, monthlyData, appTitle, appLogo, goals, installments, autoBackupEnabled, autoBackupDownload, autoBackupIntervalMins, isLoadingData]);

  // 🔒 Salva dados quando o usuário sai da página (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem('fin_rec_nubank', JSON.stringify(recurrentItems));
        localStorage.setItem('fin_mon_nubank', JSON.stringify(monthlyData));
        localStorage.setItem('fin_goals_nubank', JSON.stringify(goals));
        localStorage.setItem('fin_installments_nubank', JSON.stringify(installments));
        localStorage.setItem('fin_last_save', new Date().toISOString());
      } catch (err) {
        console.error('Erro ao salvar dados na saída:', err);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [recurrentItems, monthlyData, goals, installments]);

  // 🔄 Sincronização entre abas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'fin_mon_nubank' && e.newValue) {
        try {
          setMonthlyData(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Erro ao carregar monthlyData de outra aba:', err);
        }
      }
      if (e.key === 'fin_rec_nubank' && e.newValue) {
        try {
          setRecurrentItems(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Erro ao carregar recurrentItems de outra aba:', err);
        }
      }
      if (e.key === 'fin_goals_nubank' && e.newValue) {
        try {
          setGoals(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Erro ao carregar goals de outra aba:', err);
        }
      }
      if (e.key === 'fin_installments_nubank' && e.newValue) {
        try {
          setInstallments(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Erro ao carregar installments de outra aba:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 💾 Salvar título e logo no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem('fin_title_nubank', appTitle);
  }, [appTitle]);

  useEffect(() => {
    if (appLogo) {
      localStorage.setItem('fin_logo_nubank', appLogo);
    }
  }, [appLogo]);

  const periodKey = `${year}-${month}`;


  const currentEntries = useMemo(() => {
    const specifics = monthlyData[periodKey] || [];
    const statusKey = `status-${periodKey}`;
    const paymentStatus = monthlyData[statusKey] || {};

    const combined = recurrentItems.map(r => ({
      ...r,
      isPaid: paymentStatus[r.id] || false,
      isRecurrent: true,
      date: `${year}-${String(month).padStart(2, '0')}-${String(r.dueDay || '01').padStart(2, '0')}`
    }));

    // Adicionar parcelas como transações
    const installmentEntries = installments
      .filter(inst => {
        const monthlyAmt = getMonthlyInstallmentAmount(inst, year, month);
        return monthlyAmt > 0;
      })
      .map(inst => {
        const instStatusKey = `inst-status-${inst.id}`;
        const instPaymentStatus = monthlyData[instStatusKey] || {};
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        
        return {
          id: `inst-${inst.id}`,
          desc: inst.description,
          amount: getMonthlyInstallmentAmount(inst, year, month),
          type: 'SAIDA',
          category: 'Parcelado',
          isPaid: instPaymentStatus[monthKey] || false,
          isInstallment: true,
          date: `${year}-${String(month).padStart(2, '0')}-01`,
          installmentId: inst.id,
          monthKey: monthKey
        };
      });

    const all = [...combined, ...specifics, ...installmentEntries];
    if (!searchTerm) return all;
    return all.filter(i => i.desc.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [recurrentItems, monthlyData, periodKey, searchTerm, year, month, installments]);


  const stats = useMemo(() => {
    let installmentAmount = 0;
    installments.forEach(inst => {
      installmentAmount += getMonthlyInstallmentAmount(inst, year, month);
    });

    return currentEntries.reduce((acc, t) => {
      const val = parseFloat(t.amount) || 0;
      if (t.type === 'ENTRADA') {
        acc.totalIn += val;
        if (t.isPaid) acc.realIn += val;
      } else {
        acc.totalOut += val;
        if (t.isPaid) acc.realOut += val;
      }
      return acc;
    }, { totalIn: 0, totalOut: 0, realIn: 0, realOut: 0, installmentAmount });
  }, [currentEntries, installments, year, month]);

  // Gastos por categoria
  const expensesByCategory = useMemo(() => {
    const categoriesMap = {};
    currentEntries
      .filter(e => e.type === 'SAIDA')
      .forEach(e => {
        if (!categoriesMap[e.category]) {
          categoriesMap[e.category] = 0;
        }
        categoriesMap[e.category] += parseFloat(e.amount) || 0;
      });
    return Object.entries(categoriesMap)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentEntries]);

  // Cria um snapshot de backup e salva em localStorage (mantém últimas 12) e opcionalmente baixa como .json
  const createBackupSnapshot = () => {
    try {
      const snapshot = {
        timestamp: new Date().toISOString(),
        monthlyData,
        recurrentItems,
        goals,
        installments,
        appTitle,
        appLogo
      };

      const raw = localStorage.getItem('fin_auto_backups');
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(snapshot);
      // manter apenas últimas 12 cópias
      const trimmed = arr.slice(0, 12);
      localStorage.setItem('fin_auto_backups', JSON.stringify(trimmed));

      if (autoBackupDownload) {
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fin_backup_${snapshot.timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      return true;
    } catch (err) {
      console.error('Erro ao criar backup automático:', err);
      return false;
    }
  };

  // Agendamento do backup automático
  useEffect(() => {
    if (!autoBackupEnabled) return;
    const intervalMs = Math.max(1, autoBackupIntervalMins) * 60 * 1000;
    const id = setInterval(() => {
      createBackupSnapshot();
    }, intervalMs);
    // criar um backup imediato ao ativar
    createBackupSnapshot();
    return () => clearInterval(id);
  }, [autoBackupEnabled, autoBackupIntervalMins, autoBackupDownload, monthlyData, recurrentItems, goals, installments, appTitle, appLogo]);

  // 🔄 Recuperação automática de dados se estiverem vazios
  useEffect(() => {
    // Se os dados principais estão vazios, tentar recuperar de um backup
    if (
      Object.keys(monthlyData).length === 0 && 
      recurrentItems.length === 0 && 
      goals.length === 0 && 
      installments.length === 0
    ) {
      try {
        const backupsRaw = localStorage.getItem('fin_auto_backups');
        if (backupsRaw) {
          const backups = JSON.parse(backupsRaw);
          if (backups.length > 0) {
            const latestBackup = backups[0];
            console.log('📦 Recuperando dados do backup automático...');
            if (latestBackup.monthlyData) setMonthlyData(latestBackup.monthlyData);
            if (latestBackup.recurrentItems) setRecurrentItems(latestBackup.recurrentItems);
            if (latestBackup.goals) setGoals(latestBackup.goals);
            if (latestBackup.installments) setInstallments(latestBackup.installments);
            if (latestBackup.appTitle) setAppTitle(latestBackup.appTitle);
            if (latestBackup.appLogo) setAppLogo(latestBackup.appLogo);
          }
        }
      } catch (err) {
        console.error('Erro ao recuperar backup automático:', err);
      }
    }
  }, []); // Executar apenas uma vez na montagem

  // Entradas por categoria
  const incomeByCategory = useMemo(() => {
    const categoriesMap = {};
    currentEntries
      .filter(e => e.type === 'ENTRADA')
      .forEach(e => {
        if (!categoriesMap[e.category]) {
          categoriesMap[e.category] = 0;
        }
        categoriesMap[e.category] += parseFloat(e.amount) || 0;
      });
    return Object.entries(categoriesMap)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentEntries]);

  // Parcelamentos ativos
  const activeInstallments = useMemo(() => {
    return installments.filter(inst => inst.endDate >= `${year}-${String(month).padStart(2, '0')}-01`);
  }, [installments, year, month]);


  const lastMonthPendencies = useMemo(() => {
    if (year === 2026 && month <= 3) return [];
    const prevM = month === 1 ? 12 : month - 1;
    const prevY = month === 1 ? year - 1 : year;
    const prevKey = `${prevY}-${prevM}`;
    const prevStatusKey = `status-${prevKey}`;
    const prevStatus = monthlyData[prevStatusKey] || {};
    const prevRec = recurrentItems.filter(r => r.type === 'SAIDA' && !prevStatus[r.id]);
    const prevSpec = (monthlyData[prevKey] || []).filter(i => i.type === 'SAIDA' && !i.isPaid);
    return [...prevRec, ...prevSpec].map(p => ({ ...p, prevY, prevM }));
  }, [monthlyData, month, year, recurrentItems]);


  const handleMonthChange = (delta) => {
    let nMonth = month + delta;
    let nYear = year;
    if (nMonth < 1) { nMonth = 12; nYear--; }
    if (nMonth > 12) { nMonth = 1; nYear++; }
    if (nYear < 2026) return;
    if (nYear === 2026 && nMonth < 3) return; // bloquear janeiro/fevereiro
    setMonth(nMonth);
    setYear(nYear);
    setSelectedIds([]); 
  };


  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };


  const handleSave = (item) => {
    const formattedItem = { ...item, desc: item.desc };
    if (view === 'fixos') {
      if (editingItem) setRecurrentItems(recurrentItems.map(r => r.id === editingItem.id ? { ...r, ...formattedItem, id: editingItem.id } : r));
      else setRecurrentItems([...recurrentItems, { ...formattedItem, id: `r-${Date.now()}` }]);
    } else {
      const specifics = monthlyData[periodKey] || [];
      if (editingItem) setMonthlyData({ ...monthlyData, [periodKey]: specifics.map(t => t.id === editingItem.id ? { ...t, ...formattedItem, id: editingItem.id } : t) });
      else setMonthlyData({ ...monthlyData, [periodKey]: [{ ...formattedItem, id: `s-${Date.now()}` }, ...specifics] });
    }
    closeModal();
  };


  const toggleStatus = (id, isRecurrent, tY = year, tM = month, isInstallment = false, monthKey = null) => {
    const key = `${tY}-${tM}`;
    
    // Tratamento especial para parcelas
    if (isInstallment && monthKey) {
      const instIdMatch = id.match(/inst-(.+)/);
      if (instIdMatch) {
        const instId = instIdMatch[1];
        const instStatusKey = `inst-status-${instId}`;
        const instStatus = monthlyData[instStatusKey] || {};
        const wasPaid = instStatus[monthKey] || false;
        const willBePaid = !wasPaid;
        
        // Atualizar status do mês
        setMonthlyData({ 
          ...monthlyData, 
          [instStatusKey]: { 
            ...instStatus, 
            [monthKey]: willBePaid
          } 
        });
        
        // Atualizar installmentsPaid no objeto installment
        setInstallments(installments.map(inst => {
          if (inst.id === instId) {
            const change = willBePaid ? 1 : -1;
            const newPaidCount = Math.max(0, (inst.installmentsPaid || 0) + change);
            return { ...inst, installmentsPaid: newPaidCount };
          }
          return inst;
        }));
      }
    } else if (isRecurrent) {
      const statusKey = `status-${key}`;
      const cStatus = monthlyData[statusKey] || {};
      setMonthlyData({ ...monthlyData, [statusKey]: { ...cStatus, [id]: !cStatus[id] } });
    } else {
      setMonthlyData({ ...monthlyData, [key]: (monthlyData[key] || []).map(t => t.id === id ? { ...t, isPaid: !t.isPaid } : t) });
    }
  };


  const deleteItem = (id, isRec) => {
    if (isRec) setRecurrentItems(recurrentItems.filter(r => r.id !== id));
    else setMonthlyData({ ...monthlyData, [periodKey]: (monthlyData[periodKey] || []).filter(t => t.id !== id) });
  };

  const handleSaveGoal = (goal) => {
    if (editingGoal) {
      setGoals(goals.map(g => g.id === editingGoal.id ? { ...goal, id: editingGoal.id } : g));
    } else {
      setGoals([...goals, { ...goal, id: `g-${Date.now()}` }]);
    }
    setEditingGoal(null);
  };

  const handleDeleteGoal = (id) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleSaveInstallment = (installment) => {
    if (editingItem?.isInstallment) {
      setInstallments(installments.map(inst => inst.id === editingItem.id ? { ...installment, id: editingItem.id } : inst));
    } else if (!editingItem) {
      setInstallments([...installments, { ...installment, id: `inst-${Date.now()}` }]);
    }
  };


  const bulkTogglePaid = (paid) => {
    const sKey = `status-${periodKey}`;
    const cStatus = { ...(monthlyData[sKey] || {}) };
    let nList = [...(monthlyData[periodKey] || [])];
    selectedIds.forEach(id => {
      const ent = currentEntries.find(e => e.id === id);
      if (ent?.isRecurrent) cStatus[id] = paid;
      else nList = nList.map(t => t.id === id ? { ...t, isPaid: paid } : t);
    });
    setMonthlyData({ ...monthlyData, [sKey]: cStatus, [periodKey]: nList });
    setSelectedIds([]);
  };


  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Componente simples de gráfico circular (donut) sem dependência externa
  const CircularChart = ({ incoming = 0, outgoing = 0 }) => {
    const total = incoming + outgoing;
    if (total === 0) {
      return (
        <div className="flex items-center justify-center">
          <div className="w-36 h-36 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">Sem dados</div>
        </div>
      );
    }
    const inPct = Math.round((incoming / total) * 100);
    const outPct = 100 - inPct;
    return (
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 36 36" className="w-36 h-36">
          <path d={`M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831`} fill="#e6eef6" />
          <circle r="15.9155" cx="18" cy="18" fill="transparent" stroke="#10b981" strokeWidth="6" strokeDasharray={`${inPct} ${outPct}`} strokeDashoffset="25" transform="rotate(-90 18 18)" />
          <circle r="10" cx="18" cy="18" fill="#fff" />
        </svg>
        <div className="mt-3 text-center">
          <div className="text-sm font-bold text-slate-700">Entradas {inPct}%</div>
          <div className="text-sm font-medium text-slate-500">Saídas {outPct}%</div>
        </div>
      </div>
    );
  };

  // Tela de carregamento enquanto dados estão sendo recuperados
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#111827] to-[#0F172A] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-2xl animate-pulse">
              <HardDrive size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Carregando seus dados...</h1>
          <p className="text-slate-400 text-sm">Restaurando informações do armazenamento permanente</p>
          <div className="mt-8 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7] text-[#1A1D21] font-sans antialiased pb-10 tracking-tight">
      {/* HEADER COMPACTO */}
      <header className="bg-[#111827] text-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            {appLogo ? (
              <img src={appLogo} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="bg-blue-600 p-1.5 rounded-lg"><Wallet size={18} className="text-white" /></div>
            )}
            <div>
              <h1 className="text-base font-bold leading-none">{appTitle}</h1>
              <span className="text-[9px] text-slate-400 capitalize tracking-wider block font-medium mt-0.5">2026</span>
            </div>
          </div>


          <div className="flex items-center bg-[#1F2937] p-1 rounded-lg border border-slate-700">
            <button onClick={() => setView('mensal')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all capitalize tracking-wide ${view === 'mensal' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Fluxo de caixa</button>
            <button onClick={() => setView('fixos')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all capitalize tracking-wide ${view === 'fixos' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Fixos</button>
            <button onClick={() => setView('metas')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all capitalize tracking-wide ${view === 'metas' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Metas</button>
            <button onClick={() => setView('parcelado')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all capitalize tracking-wide ${view === 'parcelado' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Parcelado</button>
          </div>


          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#1F2937] rounded-xl border border-slate-700 px-3 py-1.5">
              <button onClick={() => handleMonthChange(-1)} disabled={year === 2026 && month <= 3} className={`p-0.5 ${year === 2026 && month <= 3 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-blue-400'}`}><ChevronLeft size={16}/></button>
              <span className="text-[10px] font-medium w-24 text-center capitalize tracking-wider">{MONTHS[month-1]} {year}</span>
              <button onClick={() => handleMonthChange(1)} className="p-0.5 text-slate-300 hover:text-blue-400"><ChevronRight size={16}/></button>
            </div>
            <button onClick={() => setShowSettings(true)} className="p-1.5 bg-[#1F2937] rounded-xl border border-slate-700 hover:bg-slate-700"><Settings2 size={16} className="text-slate-400" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-4 font-medium">
        {view === 'mensal' ? (
          <>
            {/* SUMÁRIO */}
            {/* Arena incorporada à área de fluxo */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="flex items-center justify-center p-4">
                  <CircularChart incoming={(() => {
                    const key = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}`;
                    const entries = monthlyData[key] || [];
                    const eSum = entries.reduce((s,e) => e.type === 'ENTRADA' ? s + (parseFloat(e.amount)||0) : s, 0);
                    const rSum = recurrentItems.filter(r=>r.type==='ENTRADA').reduce((s,r)=>s+(parseFloat(r.amount)||0),0);
                    return eSum + rSum;
                  })()} outgoing={(() => {
                    const key = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}`;
                    const entries = monthlyData[key] || [];
                    let sum = entries.reduce((s,e) => e.type === 'SAIDA' ? s + (parseFloat(e.amount)||0) : s, 0);
                    sum += recurrentItems.filter(r=>r.type==='SAIDA').reduce((s,r)=>s+(parseFloat(r.amount)||0),0);
                    sum += installments.reduce((s,inst)=>s+getMonthlyInstallmentAmount(inst, selectedYear, selectedMonth),0);
                    return sum;
                  })()} />
                </div>
                <div className="lg:col-span-2 p-4">
                  <div className="text-sm font-bold text-slate-700 capitalize">Arena financeira</div>
                  <div className="text-xs text-slate-500">Visão rápida de entradas, saídas e ranking do período</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
                <span className="text-xs font-bold capitalize text-emerald-700 tracking-wider">Entrada</span>
                <p className="text-2xl font-bold text-emerald-700 mt-2">{formatCurrency(stats.realIn)}</p>
              </div>
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-sm">
                <span className="text-xs font-bold capitalize text-rose-700 tracking-wider">Despesa</span>
                <p className="text-2xl font-bold text-rose-700 mt-2">{formatCurrency(stats.realOut)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                <span className="text-xs font-bold capitalize text-blue-700 tracking-wider">Saldo</span>
                <p className={`text-2xl font-bold mt-2 ${stats.realIn - stats.realOut >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>{formatCurrency(stats.realIn - stats.realOut)}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold capitalize text-slate-700 tracking-wider">Faltam pagar</span>
                <p className="text-2xl font-bold text-slate-700 mt-2">{formatCurrency(stats.totalOut)}</p>
              </div>
            </div>


            {/* PENDÊNCIAS */}
            {lastMonthPendencies.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-500">
                <button onClick={() => setShowPendencies(!showPendencies)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-slate-600">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-slate-400" />
                    <h3 className="text-sm font-bold capitalize tracking-wide">Pendências ({lastMonthPendencies.length})</h3>
                  </div>
                  {showPendencies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showPendencies && (
                  <div className="px-5 pb-3 space-y-2 border-t border-slate-50 pt-3 bg-slate-50/30 font-medium">
                    {lastMonthPendencies.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-100 shadow-sm">
                         <div className="flex items-center gap-3">
                           <button onClick={() => toggleStatus(p.id, p.isRecurrent || false, p.prevY, p.prevM)} className="text-slate-300 hover:text-blue-500 transition-all active:scale-90"><Clock size={16} /></button>
                           <span className="text-xs font-bold capitalize text-slate-700 tracking-wide">{p.desc}</span>
                         </div>
                         <span className="text-xs font-bold text-rose-500">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* SELETOR DE MESES */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 capitalize tracking-wider">Mês / ano</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setYear(year - 1)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">◄</button>
                  <span className="text-xs font-bold text-slate-600 w-8 text-center">{year}</span>
                  <button onClick={() => setYear(year + 1)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">►</button>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setMonth(i + 1)}
                    className={`py-2 rounded font-bold text-xs capitalize tracking-wider transition-all ${
                      month === i + 1
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* LISTAGEM PRINCIPAL */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col font-medium">
              <div className="px-5 py-4 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xs font-bold text-slate-400 capitalize tracking-wider leading-none">Fluxo de caixa</h2>
                  <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all active:scale-95 shadow-sm"><Plus size={16} /></button>
                </div>
                
                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-4 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100 animate-in slide-in-from-right duration-300">
                    <span className="text-xs font-bold text-blue-600 capitalize tracking-wide">{selectedIds.length} selecionados</span>
                    <button onClick={() => bulkTogglePaid(true)} className="text-emerald-600 text-xs font-bold capitalize hover:underline">Pago</button>
                    <button onClick={() => bulkTogglePaid(false)} className="text-blue-600 text-xs font-bold capitalize hover:underline">Pendente</button>
                  </div>
                )}


                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input type="text" placeholder="Procurar" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>


              <div className="overflow-x-auto font-medium">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-bold text-slate-400 capitalize tracking-wider bg-slate-50/50">
                      <th className="px-5 py-3 border-b text-center w-8">
                         <button onClick={() => { if(selectedIds.length === currentEntries.length && currentEntries.length > 0) setSelectedIds([]); else setSelectedIds(currentEntries.map(e=>e.id)); }} className="text-slate-300 transition-colors hover:text-blue-500"><CheckSquare size={16}/></button>
                      </th>
                      <th className="px-2 py-3 border-b cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setSortByStatus(!sortByStatus)}>Status {sortByStatus ? '↑' : '↓'}</th>
                      <th className="px-2 py-3 border-b">Item</th>
                      <th className="px-2 py-3 border-b text-right">Valor</th>
                      <th className="px-5 py-3 border-b text-center w-20">...</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {currentEntries.length === 0 ? (
                      <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-300 text-sm font-medium italic">Sem movimentações. Clique em "+" para adicionar.</td></tr>
                    ) : (
                      sortByStatus 
                        ? [...currentEntries].sort((a, b) => a.isPaid === b.isPaid ? 0 : a.isPaid ? 1 : -1).map((t) => (
                        <tr key={t.id} className={`hover:bg-slate-50 transition-colors group ${t.isPaid ? 'opacity-40' : ''} ${selectedIds.includes(t.id) ? 'bg-blue-50/40' : ''}`}>
                          <td className="px-5 py-3.5 text-center">
                             <button onClick={() => { if(selectedIds.includes(t.id)) setSelectedIds(selectedIds.filter(i=>i!==t.id)); else setSelectedIds([...selectedIds, t.id]); }} className={`${selectedIds.includes(t.id) ? 'text-blue-600' : 'text-slate-200 group-hover:text-slate-300'}`}><CheckSquare size={18}/></button>
                          </td>
                          <td className="px-2 py-3.5">
                            <button onClick={() => toggleStatus(t.id, t.isRecurrent, year, month, t.isInstallment, t.monthKey)} className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-all border ${t.isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-white border-slate-200 text-slate-500'}`}>
                              {t.isPaid ? 'OK' : 'Pendente'}
                            </button>
                          </td>
                          <td className="px-2 py-3.5">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                 <span className={`text-sm font-bold leading-none ${t.isPaid ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.desc}</span>
                                 {t.isRecurrent && <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold capitalize tracking-tighter">Fixo</span>}
                                 {t.isInstallment && <span className="text-[8px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 font-bold capitalize tracking-tighter">Parcelado</span>}
                              </div>
                              <span className="text-xs text-slate-500 font-medium mt-1 capitalize tracking-wide">{t.isInstallment ? t.category : (t.date ? `${t.category} • ${formatDateCorrectly(t.date, {month: '2-digit'})}` : `${t.category} • --/--`)}</span>
                            </div>
                          </td>
                          <td className="px-2 py-3.5 text-right font-bold">
                            <span className={t.type === 'ENTRADA' ? 'text-emerald-600 text-sm' : 'text-rose-500 text-sm'}>
                              {t.type === 'ENTRADA' ? '+' : '-'} {formatCurrency(t.amount)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                             {!t.isInstallment && (
                               <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={() => { setEditingItem(t); setShowModal(true); }} className="p-1 text-slate-300 hover:text-blue-600"><Pencil size={14}/></button>
                                  <button onClick={() => deleteItem(t.id, t.isRecurrent)} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                               </div>
                             )}
                          </td>
                        </tr>
                      ))
                        : currentEntries.map((t) => (
                        <tr key={t.id} className={`hover:bg-slate-50 transition-colors group ${t.isPaid ? 'opacity-40' : ''} ${selectedIds.includes(t.id) ? 'bg-blue-50/40' : ''}`}>
                          <td className="px-5 py-3.5 text-center">
                             <button onClick={() => { if(selectedIds.includes(t.id)) setSelectedIds(selectedIds.filter(i=>i!==t.id)); else setSelectedIds([...selectedIds, t.id]); }} className={`${selectedIds.includes(t.id) ? 'text-blue-600' : 'text-slate-200 group-hover:text-slate-300'}`}><CheckSquare size={18}/></button>
                          </td>
                          <td className="px-2 py-3.5">
                            <button onClick={() => toggleStatus(t.id, t.isRecurrent, year, month, t.isInstallment, t.monthKey)} className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-all border ${t.isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-white border-slate-200 text-slate-500'}`}>
                              {t.isPaid ? 'OK' : 'Pendente'}
                            </button>
                          </td>
                          <td className="px-2 py-3.5">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                 <span className={`text-sm font-bold leading-none ${t.isPaid ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.desc}</span>
                                 {t.isRecurrent && <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold capitalize tracking-tighter">Fixo</span>}
                                 {t.isInstallment && <span className="text-[8px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100 font-bold capitalize tracking-tighter">Parcelado</span>}
                              </div>
                              <span className="text-xs text-slate-500 font-medium mt-1 capitalize tracking-wide">{t.isInstallment ? t.category : (t.date ? `${t.category} • ${formatDateCorrectly(t.date, {month: '2-digit'})}` : `${t.category} • --/--`)}</span>
                            </div>
                          </td>
                          <td className="px-2 py-3.5 text-right font-bold">
                            <span className={t.type === 'ENTRADA' ? 'text-emerald-600 text-sm' : 'text-rose-500 text-sm'}>
                              {t.type === 'ENTRADA' ? '+' : '-'} {formatCurrency(t.amount)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                             {!t.isInstallment && (
                               <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={() => { setEditingItem(t); setShowModal(true); }} className="p-1 text-slate-300 hover:text-blue-600"><Pencil size={14}/></button>
                                  <button onClick={() => deleteItem(t.id, t.isRecurrent)} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                               </div>
                             )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>


              {/* BARRA DE BALANÇO */}
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                 <div className="text-xs font-bold text-slate-400 capitalize tracking-wider leading-none">Balanço</div>
                 <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                    <div className="bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${stats.totalIn + stats.totalOut === 0 ? 50 : (stats.totalIn / (stats.totalIn + stats.totalOut)) * 100}%` }} />
                    <div className="bg-rose-500 transition-all duration-1000 ease-out" style={{ width: `${stats.totalIn + stats.totalOut === 0 ? 50 : (stats.totalOut / (stats.totalIn + stats.totalOut)) * 100}%` }} />
                 </div>
              </div>
            </div>

            {/* ANALYTICS: GASTOS E ENTRADAS POR CATEGORIA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gastos por Categoria */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
                  <TrendingDown size={16} className="text-rose-500" />
                  <h3 className="text-xs font-bold text-slate-400 capitalize tracking-wider">Gastos por categoria</h3>
                </div>
                <div className="p-4 space-y-3">
                  {expensesByCategory.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Sem gastos registrados</p>
                  ) : (
                    expensesByCategory.map((cat, idx) => {
                      const total = stats.totalOut || 1;
                      const percentage = (cat.value / total) * 100;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">{cat.category}</span>
                            <span className="text-xs font-bold text-rose-500">{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 transition-all" style={{ width: `${percentage}%` }} />
                          </div>
                          <div className="text-[10px] text-slate-500">{formatCurrency(cat.value)}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Entradas por Categoria */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <h3 className="text-xs font-bold text-slate-400 capitalize tracking-wider">Entradas por categoria</h3>
                </div>
                <div className="p-4 space-y-3">
                  {incomeByCategory.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Sem entradas registradas</p>
                  ) : (
                    incomeByCategory.map((cat, idx) => {
                      const total = stats.totalIn || 1;
                      const percentage = (cat.value / total) * 100;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">{cat.category}</span>
                            <span className="text-xs font-bold text-emerald-600">{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${percentage}%` }} />
                          </div>
                          <div className="text-[10px] text-slate-500">{formatCurrency(cat.value)}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        ) : view === 'metas' ? (
          <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-4 font-medium">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl border border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold mb-1 capitalize tracking-wider">Minhas metas</h2>
                  <p className="text-blue-100 text-sm">Defina metas e acompanhe seu progresso</p>
                </div>
                <button onClick={() => { setEditingGoal(null); setShowGoals(true); }} className="bg-white text-blue-600 font-bold px-4 py-2 rounded-lg hover:bg-blue-50 transition-all active:scale-95 flex items-center gap-2">
                  <Plus size={16} /> Nova Meta
                </button>
              </div>
            </div>

            {goals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Target size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 font-medium">Nenhuma meta criada. Clique em "Nova Meta" para começar!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map(goal => {
                  const progress = (goal.spent || 0) / goal.target * 100;
                  const remaining = Math.max(0, goal.target - (goal.spent || 0));
                  return (
                    <div key={goal.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-slate-800 capitalize tracking-wide">{goal.name}</h3>
                          <p className="text-[10px] text-slate-500 mt-1">{goal.description || 'Sem descrição'}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingGoal(goal); setShowGoals(true); }} className="p-1.5 text-slate-300 hover:text-blue-600"><Pencil size={14} /></button>
                          <button onClick={() => handleDeleteGoal(goal.id)} className="p-1.5 text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-[10px] text-slate-500 capitalize font-bold">Acumulado</div>
                            <div className="text-lg font-bold text-blue-600 mt-1">{progress.toFixed(0)}%</div>
                          </div>
                          <div className="bg-cyan-50 rounded-lg p-3">
                            <div className="text-[10px] text-slate-500 capitalize font-bold">Gasto</div>
                            <div className="text-lg font-bold text-cyan-600 mt-1">{formatCurrency(goal.spent || 0)}</div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="text-[10px] text-slate-500 capitalize font-bold">Falta</div>
                            <div className="text-lg font-bold text-orange-600 mt-1">{(100 - progress).toFixed(0)}%</div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-xs font-bold text-slate-600">Progresso da Meta</span>
                            <span className="text-xs font-bold text-blue-600">{progress.toFixed(1)}% de {formatCurrency(goal.target)}</span>
                          </div>
                          <div className="w-full h-3.5 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all shadow-lg" style={{ width: `${Math.min(progress, 100)}%` }} />
                          </div>
                          <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-bold capitalize">
                            <span>{formatCurrency(goal.spent || 0)}</span>
                            <span>{formatCurrency(remaining)} faltam</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                          <div className="text-center">
                            <div className="text-[10px] text-slate-500 capitalize font-bold">Meta total</div>
                            <div className="text-sm font-bold text-slate-800 mt-1">{formatCurrency(goal.target)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-slate-500 capitalize font-bold">Restante</div>
                            <div className="text-sm font-bold text-slate-800 mt-1">{formatCurrency(remaining)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : view === 'parcelado' ? (
          <div className="animate-in fade-in duration-500 max-w-6xl mx-auto space-y-4 font-medium">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl border border-purple-500">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold mb-1 capitalize tracking-wider">Parcelamentos ativos</h2>
                  <p className="text-purple-100 text-sm">Acompanhe suas despesas parceladas e o progresso de cada uma</p>
                </div>
                <button onClick={() => { setEditingItem(null); setShowInstallments(true); }} className="bg-white text-purple-600 font-bold px-4 py-2 rounded-lg hover:bg-purple-50 transition-all active:scale-95 flex items-center gap-2">
                  <Plus size={16} /> Novo Parcelamento
                </button>
              </div>
            </div>

            {activeInstallments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Layers size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-400 font-medium">Nenhum parcelamento ativo. Clique em "Novo Parcelamento" para começar!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeInstallments.map(inst => {
                  const metrics = calculateInstallmentMetrics(inst, year, month);

                  return (
                    <div key={inst.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all">
                      {/* HEADER */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-slate-800 capitalize tracking-wide">{inst.description}</h3>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="text-[9px] bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-bold capitalize tracking-tight">
                              {metrics.monthsPaid}/{metrics.totalMonths} Parcelas
                            </span>
                            <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold capitalize tracking-tight ${metrics.percentage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                              {metrics.percentage.toFixed(0)}% Pago
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingInstallment(inst); setShowInstallments(true); }} className="p-1.5 text-slate-300 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => setInstallments(installments.filter(i => i.id !== inst.id))} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>

                      {/* ESTATÍSTICAS */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                          <div className="text-[9px] text-slate-500 capitalize font-bold">Status</div>
                          <div className="text-lg font-bold text-purple-600 mt-1">{metrics.monthsPaid}/{metrics.totalMonths}</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <div className="text-[9px] text-slate-500 capitalize font-bold">Valor mensal</div>
                          <div className="text-sm font-bold text-blue-600 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(inst.monthlyAmount) || 0)}</div>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                          <div className="text-[9px] text-slate-500 capitalize font-bold">Total</div>
                          <div className="text-sm font-bold text-emerald-600 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalAmount)}</div>
                        </div>
                      </div>

                      {/* BARRA DE PROGRESSO */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-slate-600 capitalize tracking-wide">Progresso de pagamento</span>
                          <span className="text-xs font-bold text-purple-600">{metrics.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out shadow-lg" 
                            style={{ width: `${Math.min(metrics.percentage, 100)}%` }} 
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold capitalize">
                          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.amountPaid)} pago</span>
                          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.amountRemaining)} restam</span>
                        </div>
                      </div>

                      {/* INFORMAÇÕES ADICIONAIS */}
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-[10px] text-slate-500 capitalize font-bold">Início</div>
                          <div className="text-sm font-bold text-slate-800 mt-1">{formatDateCorrectly(inst.startDate)}</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-[10px] text-slate-500 capitalize font-bold">Término</div>
                          <div className="text-sm font-bold text-slate-800 mt-1">{formatDateCorrectly(inst.endDate)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* INTEGRAÇÃO COM FLUXO DE CAIXA */}
            {activeInstallments.length > 0 && (
              <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <TrendingDown size={16} className="text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-700 capitalize tracking-wider">Parcelas nos próximos meses</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const checkMonth = month + i;
                    let checkYear = year;
                    let displayMonth = checkMonth;
                    
                    if (checkMonth > 12) {
                      displayMonth = ((checkMonth - 1) % 12) + 1;
                      checkYear = year + Math.floor((checkMonth - 1) / 12);
                    }
                    
                    const monthInstallments = activeInstallments.filter(inst => {
                      const monthAmount = getMonthlyInstallmentAmount(inst, checkYear, displayMonth);
                      return monthAmount > 0;
                    });
                    
                    if (monthInstallments.length === 0) return null;
                    
                    const totalMonthlyInstallment = monthInstallments.reduce((sum, inst) => 
                      sum + getMonthlyInstallmentAmount(inst, checkYear, displayMonth), 0
                    );

                    return (
                      <div key={`${checkYear}-${displayMonth}`} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-700 capitalize tracking-wide">
                              {MONTHS[displayMonth - 1]} {checkYear}
                            </span>
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold">
                              {monthInstallments.length} {monthInstallments.length === 1 ? 'parcela' : 'parcelas'}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-blue-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMonthlyInstallment)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {monthInstallments.map(inst => (
                            <span key={inst.id} className="text-[10px] bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium border border-purple-100">
                              {inst.description}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 max-w-2xl mx-auto space-y-4 font-medium">
             <div className="bg-[#111827] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
                <div className="relative z-10">
                  <h2 className="text-lg font-bold mb-1 capitalize tracking-wider leading-none">Gastos fixos</h2>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm capitalize mt-2">Salários, contas e despesas que se repetem todo mês.</p>
                </div>
                <ListTodo className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5" />
             </div>
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50 text-slate-400 capitalize text-xs tracking-wider font-bold">
                   <span>Lista</span>
                   <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="flex items-center gap-1.5 text-blue-600 font-bold text-xs hover:bg-white px-3 py-2 rounded-lg transition-all border border-blue-100 bg-white shadow-sm active:scale-95 capitalize tracking-wide">
                     <PlusCircle size={14} /> Novo
                   </button>
                </div>
                <div className="divide-y divide-slate-50 font-medium">
                  {recurrentItems.length === 0 ? <div className="p-12 text-center text-slate-400 text-sm italic">Nenhum item adicionado.</div> : recurrentItems.map(r => (
                    <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3">
                         <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm ${r.type === 'ENTRADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                           {r.type === 'ENTRADA' ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                         </div>
                         <div>
                           <h4 className="text-sm font-bold text-slate-700 capitalize tracking-wide">{r.desc}</h4>
                           <p className="text-xs text-slate-500 font-medium capitalize mt-1 tracking-wide">Dia {r.dueDay || '01'} • {r.category}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className={`text-sm font-bold ${r.type === 'ENTRADA' ? 'text-emerald-600' : 'text-slate-700'}`}>{formatCurrency(r.amount)}</span>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                           <button onClick={() => { setEditingItem({...r, isRecurrent: true}); setShowModal(true); }} className="p-1.5 text-slate-300 hover:text-blue-600"><Pencil size={14}/></button>
                           <button onClick={() => deleteItem(r.id, true)} className="p-1.5 text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
      </main>


      {/* MODAL CONFIGURAÇÕES MELHORADO */}
      {showSettings && (
        <div className="fixed inset-0 bg-[#111827]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-white/10 font-medium animate-in zoom-in-95 my-8">
            {/* HEADER */}
            <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-3xl">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">⚙️ Configurações</h2>
                <p className="text-xs text-blue-100">Personalize sua carteira digital</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"><X size={24}/></button>
            </div>

            {/* CONTEÚDO */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* SEÇÃO 1: APARÊNCIA */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                  <span className="text-2xl">🎨</span>
                  <h3 className="text-lg font-bold text-slate-800">Aparência</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1">📝 Título da App</label>
                    <input type="text" className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" value={appTitle} onChange={(e) => setAppTitle(e.target.value)} placeholder="Ex: Meu Controle" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1">🖼️ Logo</label>
                    <div className="flex items-center gap-3 bg-[#F8FAFC] p-3 rounded-lg border border-slate-300 shadow-sm">
                      <div className="w-12 h-12 rounded-md bg-white flex items-center justify-center overflow-hidden border border-slate-300 shadow-sm flex-shrink-0">
                        {appLogo ? <img src={appLogo} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-400" />}
                      </div>
                      <label className="flex-1 cursor-pointer">
                        <span className="bg-blue-600 text-white text-xs font-bold py-2 px-3 rounded-md flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all hover:bg-blue-700">
                           <Upload size={13} /> Upload
                        </span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setAppLogo(reader.result);
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                      {appLogo && <button onClick={() => setAppLogo(null)} className="text-xs text-rose-600 font-bold px-2 py-1 hover:bg-rose-50 rounded transition-colors">✕</button>}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: DADOS E BACKUP */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                  <span className="text-2xl">💾</span>
                  <h3 className="text-lg font-bold text-slate-800">Dados e Backup</h3>
                </div>

                {/* Backup Automático */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <input type="checkbox" checked={autoBackupEnabled} onChange={(e) => setAutoBackupEnabled(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                      ✅ Ativar Backup Automático
                    </label>
                  </div>
                  {autoBackupEnabled && (
                    <div className="space-y-3 ml-6">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={autoBackupDownload} onChange={(e) => setAutoBackupDownload(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                        <span className="text-slate-700 font-medium">📥 Fazer download automático</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-700 font-medium">⏱️ Intervalo (minutos):</span>
                        <input type="number" min="1" className="w-20 bg-white border border-slate-300 rounded-lg p-2 text-sm font-medium" value={autoBackupIntervalMins} onChange={(e) => setAutoBackupIntervalMins(Number(e.target.value) || 1)} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões de Export/Import */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button 
                    onClick={() => exportToCSV(monthlyData, recurrentItems, installments, goals)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold text-sm capitalize tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    📊 Exportar CSV
                  </button>
                  <button 
                    onClick={() => exportToJSON(monthlyData, recurrentItems, installments, goals, appTitle, appLogo)}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-lg font-bold text-sm capitalize tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    📄 Exportar JSON
                  </button>
                </div>

                <label className="block cursor-pointer">
                  <span className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold text-sm capitalize tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
                    📂 Importar (CSV / JSON)
                  </span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv,.json"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        try {
                          const text = reader.result;
                          if (file.name.toLowerCase().endsWith('.json') || (typeof text === 'string' && text.trim().startsWith('{'))) {
                            const result = restoreDataFromJSON(text, {
                              setRecurrentItems,
                              setMonthlyData,
                              setGoals,
                              setInstallments,
                              setAppTitle,
                              setAppLogo
                            });
                            if (result.success) alert('✅ JSON importado com sucesso!');
                            else alert(`❌ Erro ao importar JSON: ${result.message}`);
                          } else {
                            const { newMonthlyData, newRecurrentItems, importedCount } = parseCSVData(text);
                            setMonthlyData({ ...monthlyData, ...newMonthlyData });
                            setRecurrentItems([...recurrentItems, ...newRecurrentItems]);
                            alert(`✅ Importados ${importedCount} registros com sucesso!`);
                          }
                        } catch (err) {
                          alert(`❌ Erro ao importar: ${err.message}`);
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                </label>

                <button 
                  onClick={() => { setShowSettings(false); setShowRecoveryModal(true); }} 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold text-sm capitalize tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  🔄 Recuperar Dados Antigos
                </button>
              </div>

              {/* SEÇÃO 3: PROJEÇÃO vs REALIZADO */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                  <span className="text-2xl">📈</span>
                  <h3 className="text-lg font-bold text-slate-800">Projeção vs Realizado</h3>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-amber-50 p-4 rounded-lg border border-amber-200 space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    📊 Compare suas projeções de receita e despesa com os valores realmente ocorridos. Ajuste suas estratégias financeiras com base no desempenho atual.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700">📅 Mês</label>
                      <select className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700">📍 Ano</label>
                      <input type="number" className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700">💰 Projeção</label>
                      <input type="number" placeholder="Ex: 5000" className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                        defaultValue={projections[`${selectedYear}-${String(selectedMonth).padStart(2,'0')}`]?.income || ''}
                        onChange={(e) => updateProjection(selectedYear, selectedMonth, e.target.value, projections[`${selectedYear}-${String(selectedMonth).padStart(2,'0')}`]?.expense || 0)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700">📉 Despesa Projetada</label>
                      <input type="number" placeholder="Ex: 2000" className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                        defaultValue={projections[`${selectedYear}-${String(selectedMonth).padStart(2,'0')}`]?.expense || ''}
                        onChange={(e) => updateProjection(selectedYear, selectedMonth, projections[`${selectedYear}-${String(selectedMonth).padStart(2,'0')}`]?.income || 0, e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="h-full flex flex-col justify-end">
                        <button onClick={() => {
                          const key = `${selectedYear}-${String(selectedMonth).padStart(2,'0')}`;
                          const proj = projections[key];
                          const monthData = monthlyData[`${selectedYear}-${String(selectedMonth).padStart(2,'0')}`] || [];
                          const realized = {
                            income: monthData.filter(m => m.type === 'receita').reduce((a, b) => a + (b.value || 0), 0),
                            expense: monthData.filter(m => m.type === 'despesa').reduce((a, b) => a + (b.value || 0), 0)
                          };

                          const incomeMatch = proj && Math.abs(proj.income - realized.income) < 1;
                          const expenseMatch = proj && Math.abs(proj.expense - realized.expense) < 1;

                          let msg = `📊 Comparativo de ${MONTHS[selectedMonth - 1]}/${selectedYear}:\n\n`;
                          msg += `💰 Receita:\n`;
                          msg += `  Projetado: R$ ${proj?.income.toFixed(2) || 'Não definido'}\n`;
                          msg += `  Realizado: R$ ${realized.income.toFixed(2)}\n`;
                          msg += `  ${incomeMatch ? '✅ BATEU!' : `❌ Diferença: R$ ${Math.abs((proj?.income || 0) - realized.income).toFixed(2)}`}\n\n`;
                          msg += `📉 Despesa:\n`;
                          msg += `  Projetado: R$ ${proj?.expense.toFixed(2) || 'Não definido'}\n`;
                          msg += `  Realizado: R$ ${realized.expense.toFixed(2)}\n`;
                          msg += `  ${expenseMatch ? '✅ BATEU!' : `❌ Diferença: R$ ${Math.abs((proj?.expense || 0) - realized.expense).toFixed(2)}`}`;

                          alert(msg);
                        }} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-3 rounded-lg font-bold text-sm capitalize tracking-wider shadow-md active:scale-95 transition-all">
                          🔍 Comparar com Realizado
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* FOOTER */}
            <div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-200 rounded-b-3xl">
              <button onClick={() => setShowSettings(false)} className="flex-1 bg-[#111827] text-white py-3 rounded-lg font-bold text-sm capitalize tracking-wider shadow-md active:scale-95 transition-all hover:bg-slate-900">
                ✅ Pronto
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL REGISTRO */}
      {showModal && (
        <div className="fixed inset-0 bg-[#111827]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <ModalContent item={editingItem} isRecurrentView={view === 'fixos'} onSave={handleSave} onClose={closeModal} />
        </div>
      )}

      {/* MODAL METAS */}
      {showGoals && (
        <div className="fixed inset-0 bg-[#111827]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl border border-white/10 font-sans font-medium animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6"><h2 className="text-base font-bold text-slate-800 tracking-wider capitalize leading-none">{editingGoal ? 'Editar meta' : 'Nova meta'}</h2><button onClick={() => setEditingGoal(null)} className="text-slate-300 hover:text-slate-500"><X size={24}/></button></div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveGoal(editingGoal || {}); }} className="space-y-4">
              <div className="space-y-2"><label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Nome da meta</label><input type="text" placeholder="Ex: Viagem, Carro" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={editingGoal?.name || ''} onChange={e => setEditingGoal({...editingGoal, name: e.target.value})} required /></div>
              <div className="space-y-2"><label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Descrição</label><input type="text" placeholder="Detalhes da meta" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={editingGoal?.description || ''} onChange={e => setEditingGoal({...editingGoal, description: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Valor da meta</label><input type="number" step="0.01" placeholder="0.00" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={editingGoal?.target || ''} onChange={e => setEditingGoal({...editingGoal, target: parseFloat(e.target.value)})} required /></div>
              <div className="space-y-2"><label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Valor acumulado</label><input type="number" step="0.01" placeholder="0.00" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={editingGoal?.spent || ''} onChange={e => setEditingGoal({...editingGoal, spent: parseFloat(e.target.value)})} /></div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm capitalize tracking-wider shadow-xl hover:bg-blue-700 active:scale-95 transition-all">Salvar meta</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARCELADO */}
      {showInstallments && (
        <div className="fixed inset-0 bg-[#111827]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <AdvancedInstallmentModal 
            item={editingInstallment} 
            onSave={handleSaveInstallment} 
            onClose={() => { setEditingInstallment(null); setShowInstallments(false); }} 
          />
        </div>
      )}
      
      {/* MODAL DE RECUPERAÇÃO DE DADOS */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-[#111827]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">🔄 Recuperar Meus Dados</h2>
              <button onClick={() => { setShowRecoveryModal(false); setRecoveryData(''); setRecoveryMessage(''); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <p className="text-sm text-slate-600">
              Cole o JSON dos seus dados salvos abaixo para recuperá-los. Se não tem os dados, verifique os backups automáticos.
            </p>

            {/* Mostrar últimos backups */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-bold text-blue-700 capitalize">📦 Backups automáticos salvos:</p>
              {(() => {
                try {
                  const backups = JSON.parse(localStorage.getItem('fin_auto_backups') || '[]');
                  return (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {backups.length === 0 ? (
                        <p className="text-xs text-blue-600">Nenhum backup encontrado ainda</p>
                      ) : (
                        backups.slice(0, 5).map((backup, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setRecoveryData(JSON.stringify(backup, null, 2));
                              setRecoveryMessage('');
                            }}
                            className="w-full text-left text-xs bg-white border border-blue-100 p-2 rounded hover:bg-blue-50 transition-colors text-blue-600 font-medium truncate"
                            title={new Date(backup.timestamp).toLocaleString('pt-BR')}
                          >
                            📅 {new Date(backup.timestamp).toLocaleString('pt-BR')}
                          </button>
                        ))
                      )}
                    </div>
                  );
                } catch (err) {
                  return <p className="text-xs text-red-600">Erro ao carregar backups</p>;
                }
              })()}
            </div>

            <textarea
              value={recoveryData}
              onChange={(e) => setRecoveryData(e.target.value)}
              placeholder="Cole seus dados em formato JSON aqui..."
              className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />

            {recoveryMessage && (
              <div className={`p-3 rounded-lg text-xs font-medium ${
                recoveryMessage.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {recoveryMessage}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const result = restoreDataFromJSON(recoveryData, {
                    setRecurrentItems,
                    setMonthlyData,
                    setGoals,
                    setInstallments,
                    setAppTitle,
                    setAppLogo
                  });
                  setRecoveryMessage(result.message);
                  if (result.success) {
                    setTimeout(() => {
                      setShowRecoveryModal(false);
                      setRecoveryData('');
                      setRecoveryMessage('');
                    }, 1500);
                  }
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-sm capitalize hover:bg-blue-700 active:scale-95 transition-all"
              >
                ✅ Restaurar Dados
              </button>
              <button
                onClick={() => { setShowRecoveryModal(false); setRecoveryData(''); setRecoveryMessage(''); }}
                className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-bold text-sm capitalize hover:bg-slate-300 active:scale-95 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* BOTÃO LOGOUT */}
      <div className="fixed bottom-6 right-6">
        <button onClick={() => { localStorage.removeItem('fin_logged_in'); setIsLoggedIn(false); }} className="p-3 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-lg active:scale-95 transition-all" title="Sair">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};


const ModalContent = ({ item, isRecurrentView, onSave, onClose }) => {
  const [formData, setFormData] = useState(item ? { ...item } : { desc: '', amount: '', type: 'SAIDA', category: 'Fixo', date: '', isPaid: false, dueDay: 5 });
  return (
    <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl border border-white/10 font-sans font-medium animate-in zoom-in-95">
      <div className="flex justify-between items-center mb-6"><h2 className="text-base font-bold text-slate-800 tracking-wider capitalize leading-none">{item ? 'Editar' : 'Novo'}</h2><button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={24}/></button></div>
      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-5">
        <div className="flex gap-2 bg-[#F1F5F9] p-1.5 rounded-lg border border-slate-200">
           <button type="button" onClick={() => setFormData({...formData, type: 'ENTRADA', isPaid: true})} className={`flex-1 py-2.5 rounded-md text-xs font-bold capitalize transition-all tracking-wide ${formData.type === 'ENTRADA' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Receita</button>
           <button type="button" onClick={() => setFormData({...formData, type: 'SAIDA', isPaid: false})} className={`flex-1 py-2.5 rounded-md text-xs font-bold capitalize transition-all tracking-wide ${formData.type === 'SAIDA' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>Despesa</button>
        </div>
        <div className="space-y-2"><label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Descrição</label><input required type="text" placeholder="Ex: Almoço, Salário" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Valor</label><input required type="number" step="0.01" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div><div className="space-y-2"><label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Categoria</label><select className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none appearance-none shadow-inner" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}><option value="Fixo">Fixo</option><option value="Contas">Contas</option><option value="Alimentação">Alimentação</option><option value="Transporte">Transporte</option><option value="Saúde">Saúde</option><option value="Educação">Educação</option><option value="Lazer">Lazer</option><option value="Cartão">Cartão</option><option value="Extra">Extra</option><option value="Outros">Outros</option></select></div></div>
        {isRecurrentView ? <div className="space-y-2"><label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Dia do mês</label><input required type="number" min="1" max="31" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={formData.dueDay} onChange={e => setFormData({...formData, dueDay: Number(e.target.value)})} /></div> : <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Data</label><input type="date" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div><div className="flex flex-col justify-end pb-2"><label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" className="w-4 h-4 rounded-md text-blue-600 focus:ring-0 border-slate-300 shadow-sm" checked={formData.isPaid} onChange={e => setFormData({...formData, isPaid: e.target.checked})} /><span className="text-xs capitalize text-slate-400 tracking-wider group-hover:text-blue-500 font-bold transition-colors">Pago</span></label></div></div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm capitalize tracking-wider shadow-xl hover:bg-blue-700 active:scale-95 transition-all mt-2">Salvar</button>
      </form>
    </div>
  );
};


const SummaryCard = ({ title, value, subtitle, theme, location }) => {
  const styles = { neutral: "bg-white border-slate-200", income: "bg-white border-emerald-100 border-l-[3px] border-l-emerald-500", expense: "bg-white border-rose-100 border-l-[3px] border-l-rose-400" };
  const textColors = { neutral: "text-slate-800", income: "text-emerald-700", expense: "text-rose-700" };
  return (
    <div className={`p-4 rounded-2xl border ${styles[theme]} shadow-sm transition-all hover:shadow-md font-medium leading-none`}>
      <span className="text-xs font-bold capitalize text-slate-400 tracking-wider leading-none">{title}</span>
      <p className={`text-lg font-bold ${textColors[theme]} mt-2 tracking-tight leading-none`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}</p>
      <p className="text-xs text-slate-500 mt-2 font-medium leading-none capitalize tracking-wide">{subtitle}</p>
    </div>
  );
};

// 🛠️ COMPONENTE MODAL AVANÇADO DE PARCELAMENTO
const AdvancedInstallmentModal = ({ item, onSave, onClose }) => {
  const [formData, setFormData] = useState(item ? { ...item } : { 
    description: '', 
    startDate: '', 
    endDate: '', 
    monthlyAmount: '',
    paymentType: 'parcelado',
    totalInstallments: '',
    paymentDay: '01',
    customInstallments: [],
    installmentsPaid: 0 // Número de parcelas já pagas
  });
  
  const [previewData, setPreviewData] = useState(null);

  // Calcular preview quando o usuário muda os dados
  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.monthlyAmount) {
      const [startYear, startMonth] = formData.startDate.split('-').map(Number);
      const [endYear, endMonth] = formData.endDate.split('-').map(Number);
      const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
      const totalValue = formData.monthlyAmount * totalMonths;
      
      setPreviewData({
        totalMonths,
        totalValue,
        startDate: formData.startDate,
        endDate: formData.endDate,
        monthlyAmount: formData.monthlyAmount
      });
    } else {
      setPreviewData(null);
    }
  }, [formData.startDate, formData.endDate, formData.monthlyAmount]);

  const handleDateChange = (type, value) => {
    if (type === 'start') {
      setFormData({ ...formData, startDate: value });
    } else {
      setFormData({ ...formData, endDate: value });
    }
  };

  const handleInstallmentChange = (numInstallments) => {
    const monthlyAmt = parseFloat(formData.monthlyAmount) || 0;
    if (monthlyAmt > 0) {
      const [startYear, startMonth, startDay] = formData.startDate.split('-');
      let endMonth = parseInt(startMonth) + (numInstallments - 1);
      let endYear = parseInt(startYear);
      
      while (endMonth > 12) {
        endMonth -= 12;
        endYear += 1;
      }
      
      setFormData({
        ...formData,
        totalInstallments: numInstallments,
        endDate: `${endYear}-${String(endMonth).padStart(2, '0')}-${startDay}`
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-white/10 font-sans font-medium animate-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base font-bold text-slate-800 tracking-wider capitalize leading-none">
          {item ? 'Editar Parcelamento' : 'Novo Parcelamento'}
        </h2>
        <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={24}/></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DESCRIÇÃO */}
        <div className="space-y-2">
          <label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Descrição da compra</label>
          <input 
            type="text" 
            placeholder="Ex: Geladeira, Sofá, TV 55 polegadas" 
            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-purple-500 outline-none shadow-inner" 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
            required 
          />
        </div>

        {/* TIPO DE PAGAMENTO */}
        <div className="space-y-3">
          <label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Tipo de parcelamento</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={() => setFormData({...formData, paymentType: 'parcelado'})}
              className={`py-3 px-4 rounded-lg font-bold text-xs capitalize tracking-wider transition-all border-2 ${
                formData.paymentType === 'parcelado' 
                  ? 'bg-purple-100 border-purple-500 text-purple-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Valores Iguais
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, paymentType: 'parcelado-outros'})}
              className={`py-3 px-4 rounded-lg font-bold text-xs capitalize tracking-wider transition-all border-2 ${
                formData.paymentType === 'parcelado-outros' 
                  ? 'bg-indigo-100 border-indigo-500 text-indigo-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Valores Outros
            </button>
          </div>
        </div>

        {(formData.paymentType === 'parcelado' || formData.paymentType === 'parcelado-outros') && (
          <>
            {/* DATAS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Data de início</label>
                <input 
                  type="date" 
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-purple-500 outline-none shadow-inner" 
                  value={formData.startDate} 
                  onChange={e => handleDateChange('start', e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Data de término</label>
                <input 
                  type="date" 
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-purple-500 outline-none shadow-inner" 
                  value={formData.endDate} 
                  onChange={e => handleDateChange('end', e.target.value)} 
                  required 
                />
              </div>
            </div>

            {/* VALOR MENSAL */}
            {formData.paymentType === 'parcelado' && (
              <div className="space-y-2">
                <label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Valor da parcela mensal</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 pl-9 text-sm font-medium focus:ring-1 focus:ring-purple-500 outline-none shadow-inner" 
                    value={formData.monthlyAmount} 
                    onChange={e => setFormData({...formData, monthlyAmount: e.target.value})} 
                    required 
                  />
                </div>
              </div>
            )}

            {/* PARCELAS JÁ PAGAS */}
            {(formData.paymentType === 'parcelado' || formData.paymentType === 'parcelado-outros') && (
              <div className="space-y-2">
                <label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Parcelas já pagas</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="0" 
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-purple-500 outline-none shadow-inner" 
                  value={formData.installmentsPaid || 0} 
                  onChange={e => setFormData({...formData, installmentsPaid: parseInt(e.target.value) || 0})} 
                />
              </div>
            )}

            {/* VALORES CUSTOMIZADOS (OUTROS) */}
            {formData.paymentType === 'parcelado-outros' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs capitalize text-slate-400 tracking-wider font-bold">Valores customizados por parcela</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newCustom = [...(formData.customInstallments || [])];
                      newCustom.push('');
                      setFormData({...formData, customInstallments: newCustom});
                    }}
                    className="text-indigo-600 text-xs font-bold capitalize hover:text-indigo-700"
                  >
                    + Adicionar
                  </button>
                </div>
                <div className="space-y-2 bg-indigo-50 p-4 rounded-lg border border-indigo-100 max-h-56 overflow-y-auto">
                  {formData.customInstallments && formData.customInstallments.length > 0 ? (
                    formData.customInstallments.map((value, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">Parc {idx + 1}:</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full bg-white border border-slate-200 rounded-md p-2 pl-16 text-sm font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                            value={value}
                            onChange={(e) => {
                              const newCustom = [...formData.customInstallments];
                              newCustom[idx] = e.target.value;
                              setFormData({...formData, customInstallments: newCustom});
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newCustom = formData.customInstallments.filter((_, i) => i !== idx);
                            setFormData({...formData, customInstallments: newCustom});
                          }}
                          className="p-2 text-slate-300 hover:text-rose-500"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic text-center py-4">Clique em "+ Adicionar" para começar</p>
                  )}
                </div>
              </div>
            )}

            {/* ATALHOS DE PARCELAMENTO */}
            {formData.paymentType === 'parcelado' && (
              <div className="space-y-3">
                <label className="text-xs capitalize text-slate-400 ml-1 tracking-wider font-bold">Atalhos rápidos</label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 6, 10, 12].map(months => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => handleInstallmentChange(months)}
                      className="py-2 px-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 font-bold text-xs capitalize hover:bg-purple-100 transition-all active:scale-95"
                    >
                      {months}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PREVIEW DOS DADOS */}
            {previewData && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 capitalize tracking-wider">📊 Resumo do parcelamento</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="text-[10px] text-slate-500 capitalize font-bold">Total de parcelas</div>
                    <div className="text-lg font-bold text-purple-600 mt-1">{previewData.totalMonths}x</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="text-[10px] text-slate-500 capitalize font-bold">Valor mensal</div>
                    <div className="text-lg font-bold text-purple-600 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(previewData.monthlyAmount) || 0)}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="text-[10px] text-slate-500 capitalize font-bold">Valor total</div>
                    <div className="text-lg font-bold text-purple-600 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(previewData.totalValue)}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-100 text-[11px] text-slate-600 font-medium">
                  <span>Período: <strong>{formatDateCorrectly(previewData.startDate)}</strong> até <strong>{formatDateCorrectly(previewData.endDate)}</strong></span>
                </div>
              </div>
            )}
          </>
        )}

        <button 
          type="submit" 
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold text-sm capitalize tracking-wider shadow-xl hover:bg-purple-700 active:scale-95 transition-all mt-2"
        >
          {item ? 'Atualizar Parcelamento' : 'Criar Parcelamento'}
        </button>
      </form>
    </div>
  );
};

export default App;