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
  Layers
} from 'lucide-react';


// --- SISTEMA TOTALMENTE ZERADO ---
const DEFAULT_RECURRENT = [];
const INITIAL_MONTHLY_DATA = {};


const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];


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

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('fin_logged_in') === 'true');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginPassword === '417102a') {
      localStorage.setItem('fin_logged_in', 'true');
      setIsLoggedIn(true);
      setLoginPassword('');
      setLoginError('');
    } else {
      setLoginError('Senha incorreta!');
      setLoginPassword('');
    }
  };

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
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Senha</label>
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
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
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
  const [month, setMonth] = useState(1);
  const [view, setView] = useState('mensal'); 
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


  // Personalização
  const [appTitle, setAppTitle] = useState(() => localStorage.getItem('fin_title_nubank') || 'Meu Controle');
  const [appLogo, setAppLogo] = useState(() => localStorage.getItem('fin_logo_nubank') || null);


  // Armazenamento
  const [recurrentItems, setRecurrentItems] = useState(() => {
    const saved = localStorage.getItem('fin_rec_nubank');
    return saved ? JSON.parse(saved) : DEFAULT_RECURRENT;
  });


  const [monthlyData, setMonthlyData] = useState(() => {
    const saved = localStorage.getItem('fin_mon_nubank');
    return saved ? JSON.parse(saved) : INITIAL_MONTHLY_DATA;
  });

  // Metas e Parcelamentos
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('fin_goals_nubank');
    return saved ? JSON.parse(saved) : [];
  });

  const [installments, setInstallments] = useState(() => {
    const saved = localStorage.getItem('fin_installments_nubank');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('fin_rec_nubank', JSON.stringify(recurrentItems));
    localStorage.setItem('fin_mon_nubank', JSON.stringify(monthlyData));
    localStorage.setItem('fin_title_nubank', appTitle);
    localStorage.setItem('fin_goals_nubank', JSON.stringify(goals));
    localStorage.setItem('fin_installments_nubank', JSON.stringify(installments));
    if (appLogo) localStorage.setItem('fin_logo_nubank', appLogo);
  }, [recurrentItems, monthlyData, appTitle, appLogo, goals, installments]);


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


    const all = [...combined, ...specifics];
    if (!searchTerm) return all;
    return all.filter(i => i.desc.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [recurrentItems, monthlyData, periodKey, searchTerm, year, month]);


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
    if (year === 2026 && month === 1) return [];
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
    setMonth(nMonth);
    setYear(nYear);
    setSelectedIds([]); 
  };


  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };


  const handleSave = (item) => {
    const formattedItem = { ...item, desc: item.desc.toUpperCase() };
    if (view === 'fixos') {
      if (editingItem) setRecurrentItems(recurrentItems.map(r => r.id === editingItem.id ? { ...formattedItem, id: editingItem.id } : r));
      else setRecurrentItems([...recurrentItems, { ...formattedItem, id: `r-${Date.now()}` }]);
    } else {
      const specifics = monthlyData[periodKey] || [];
      if (editingItem) setMonthlyData({ ...monthlyData, [periodKey]: specifics.map(t => t.id === editingItem.id ? { ...formattedItem, id: editingItem.id } : t) });
      else setMonthlyData({ ...monthlyData, [periodKey]: [{ ...formattedItem, id: `s-${Date.now()}` }, ...specifics] });
    }
    closeModal();
  };


  const toggleStatus = (id, isRecurrent, tY = year, tM = month) => {
    const key = `${tY}-${tM}`;
    if (isRecurrent) {
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
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-medium mt-0.5">2026</span>
            </div>
          </div>


          <div className="flex items-center bg-[#1F2937] p-1 rounded-lg border border-slate-700">
            <button onClick={() => setView('mensal')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wide ${view === 'mensal' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Gastos</button>
            <button onClick={() => setView('fixos')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wide ${view === 'fixos' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Fixos</button>
            <button onClick={() => setView('metas')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wide ${view === 'metas' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Metas</button>
            <button onClick={() => setView('parcelado')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all uppercase tracking-wide ${view === 'parcelado' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Parcelado</button>
          </div>


          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#1F2937] rounded-xl border border-slate-700 px-3 py-1.5">
              <button onClick={() => handleMonthChange(-1)} disabled={year === 2026 && month === 1} className={`p-0.5 ${year === 2026 && month === 1 ? 'text-slate-600' : 'text-slate-300 hover:text-blue-400'}`}><ChevronLeft size={16}/></button>
              <span className="text-[10px] font-medium w-24 text-center uppercase tracking-wider">{MONTHS[month-1]} {year}</span>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-medium">
              <SummaryCard title="Previsão" value={stats.totalIn - stats.totalOut} subtitle="Total" theme="neutral" location="bolso" />
              <SummaryCard title="Entrada" value={stats.totalIn} subtitle="Receitas" theme="income" location="bolso" />
              <SummaryCard title="Gasto" value={stats.totalOut} subtitle="Despesas" theme="expense" location="bolso" />
              <SummaryCard title="Parcelas" value={stats.installmentAmount} subtitle="Parcelado" theme="expense" location="bolso" />
              <div className="bg-[#111827] p-4 rounded-2xl shadow-md flex flex-col justify-between border border-slate-800 transition-transform hover:scale-[1.01]">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider leading-none">No Bolso</span>
                <p className="text-2xl font-bold text-white tracking-tight mt-2">{formatCurrency(stats.realIn - stats.realOut - stats.installmentAmount)}</p>
                <div className="flex items-center gap-2 mt-3"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /><span className="text-[9px] text-blue-400 uppercase font-bold">Líquido</span></div>
              </div>
            </div>


            {/* PENDÊNCIAS */}
            {lastMonthPendencies.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-500">
                <button onClick={() => setShowPendencies(!showPendencies)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-slate-600">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-slate-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wide">Pendências ({lastMonthPendencies.length})</h3>
                  </div>
                  {showPendencies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <div className="px-5 pb-3 space-y-2 border-t border-slate-50 pt-3 bg-slate-50/30 font-medium">
                    {lastMonthPendencies.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-100 shadow-sm">
                         <div className="flex items-center gap-3">
                           <button onClick={() => toggleStatus(p.id, p.isRecurrent || false, p.prevY, p.prevM)} className="text-slate-300 hover:text-blue-500 transition-all active:scale-90"><Clock size={16} /></button>
                           <span className="text-xs font-bold uppercase text-slate-700 tracking-wide">{p.desc}</span>
                         </div>
                         <span className="text-xs font-bold text-rose-500">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* LISTAGEM PRINCIPAL */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col font-medium">
              <div className="px-5 py-4 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Movimentações</h2>
                  <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all active:scale-95 shadow-sm"><Plus size={16} /></button>
                </div>
                
                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-4 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100 animate-in slide-in-from-right duration-300">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">{selectedIds.length} selecionados</span>
                    <button onClick={() => bulkTogglePaid(true)} className="text-emerald-600 text-xs font-bold uppercase hover:underline">Pago</button>
                    <button onClick={() => bulkTogglePaid(false)} className="text-blue-600 text-xs font-bold uppercase hover:underline">Pendente</button>
                  </div>
                )}


                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input type="text" placeholder="Procurar" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>


              <div className="overflow-x-auto font-medium">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-5 py-3 border-b text-center w-8">
                         <button onClick={() => { if(selectedIds.length === currentEntries.length && currentEntries.length > 0) setSelectedIds([]); else setSelectedIds(currentEntries.map(e=>e.id)); }} className="text-slate-300 transition-colors hover:text-blue-500"><CheckSquare size={16}/></button>
                      </th>
                      <th className="px-2 py-3 border-b">Status</th>
                      <th className="px-2 py-3 border-b">Item</th>
                      <th className="px-2 py-3 border-b text-right">Valor</th>
                      <th className="px-5 py-3 border-b text-center w-20">...</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {currentEntries.length === 0 ? (
                      <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-300 text-sm font-medium italic">Sem movimentações. Clique em "+" para adicionar.</td></tr>
                    ) : (
                      currentEntries.map((t) => (
                        <tr key={t.id} className={`hover:bg-slate-50 transition-colors group ${t.isPaid ? 'opacity-40' : ''} ${selectedIds.includes(t.id) ? 'bg-blue-50/40' : ''}`}>
                          <td className="px-5 py-3.5 text-center">
                             <button onClick={() => { if(selectedIds.includes(t.id)) setSelectedIds(selectedIds.filter(i=>i!==t.id)); else setSelectedIds([...selectedIds, t.id]); }} className={`${selectedIds.includes(t.id) ? 'text-blue-600' : 'text-slate-200 group-hover:text-slate-300'}`}><CheckSquare size={18}/></button>
                          </td>
                          <td className="px-2 py-3.5">
                            <button onClick={() => toggleStatus(t.id, t.isRecurrent)} className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all border ${t.isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-white border-slate-200 text-slate-500'}`}>
                              {t.isPaid ? 'OK' : 'Pendente'}
                            </button>
                          </td>
                          <td className="px-2 py-3.5">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                 <span className={`text-sm font-bold leading-none ${t.isPaid ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.desc}</span>
                                 {t.isRecurrent && <span className="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold uppercase tracking-tighter">Fixo</span>}
                              </div>
                              <span className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wide">{t.category} • {t.date ? new Date(t.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) : '--/--'}</span>
                            </div>
                          </td>
                          <td className="px-2 py-3.5 text-right font-bold">
                            <span className={t.type === 'ENTRADA' ? 'text-emerald-600 text-sm' : 'text-rose-500 text-sm'}>
                              {t.type === 'ENTRADA' ? '+' : '-'} {formatCurrency(t.amount)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                             <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => { setEditingItem(t); setShowModal(true); }} className="p-1 text-slate-300 hover:text-blue-600"><Pencil size={14}/></button>
                                <button onClick={() => deleteItem(t.id, t.isRecurrent)} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>


              {/* BARRA DE BALANÇO */}
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Balanço</div>
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
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gastos por Categoria</h3>
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
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entradas por Categoria</h3>
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

            {/* RELATÓRIO ENTRADAS E SAÍDAS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <TrendingUp size={16} className="text-slate-600" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Relatório - Entradas e Saídas</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {/* ENTRADAS */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowUp className="text-emerald-500" size={18} />
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Entradas</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Total Entradas</div>
                      <div className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(stats.totalIn)}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Entradas Pagas</div>
                      <div className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(stats.realIn)}</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Pendente</div>
                      <div className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(stats.totalIn - stats.realIn)}</div>
                    </div>
                  </div>
                </div>

                {/* SAÍDAS */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowDown className="text-rose-500" size={18} />
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Saídas</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-rose-50 rounded-lg p-4 border border-rose-100">
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Total Saídas</div>
                      <div className="text-2xl font-bold text-rose-600 mt-2">{formatCurrency(stats.totalOut)}</div>
                    </div>
                    <div className="bg-rose-50 rounded-lg p-4 border border-rose-100">
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Saídas Pagas</div>
                      <div className="text-2xl font-bold text-rose-600 mt-2">{formatCurrency(stats.realOut)}</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Pendente</div>
                      <div className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(stats.totalOut - stats.realOut)}</div>
                    </div>
                  </div>
                </div>

                {/* PARCELAMENTOS DO MÊS */}
                {stats.installmentAmount > 0 && (
                  <div className="p-6 bg-purple-50">
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="text-purple-500" size={18} />
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Parcelamentos - {MONTHS[month-1]}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-purple-100">
                        <div className="text-[10px] text-slate-600 uppercase font-bold">Parcelas Este Mês</div>
                        <div className="text-2xl font-bold text-purple-600 mt-2">{formatCurrency(stats.installmentAmount)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-purple-100">
                        <div className="text-[10px] text-slate-600 uppercase font-bold">Total com Parcelamentos</div>
                        <div className="text-2xl font-bold text-purple-600 mt-2">{formatCurrency(stats.totalOut + stats.installmentAmount)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-purple-100">
                        <div className="text-[10px] text-slate-600 uppercase font-bold">Saldo Líquido (c/ Parcelas)</div>
                        <div className={`text-2xl font-bold mt-2 ${stats.totalIn - (stats.totalOut + stats.installmentAmount) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(stats.totalIn - (stats.totalOut + stats.installmentAmount))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-white rounded-lg border border-purple-100 text-xs text-slate-600">
                      <span className="font-bold">Parcelamentos ativos:</span> {activeInstallments.length > 0 ? activeInstallments.map(i => i.description).join(', ') : 'Nenhum'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : view === 'metas' ? (
          <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-4 font-medium">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl border border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold mb-1 uppercase tracking-wider">Minhas Metas</h2>
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
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{goal.name}</h3>
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
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Acumulado</div>
                            <div className="text-lg font-bold text-blue-600 mt-1">{progress.toFixed(0)}%</div>
                          </div>
                          <div className="bg-cyan-50 rounded-lg p-3">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Gasto</div>
                            <div className="text-lg font-bold text-cyan-600 mt-1">{formatCurrency(goal.spent || 0)}</div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Falta</div>
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
                          <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-bold uppercase">
                            <span>{formatCurrency(goal.spent || 0)}</span>
                            <span>{formatCurrency(remaining)} faltam</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                          <div className="text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Meta Total</div>
                            <div className="text-sm font-bold text-slate-800 mt-1">{formatCurrency(goal.target)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Restante</div>
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
                  <h2 className="text-lg font-bold mb-1 uppercase tracking-wider">Parcelamentos Ativos</h2>
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
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{inst.description}</h3>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="text-[9px] bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-tight">
                              {metrics.monthsPaid}/{metrics.totalMonths} Parcelas
                            </span>
                            <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-tight ${metrics.percentage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                              {metrics.percentage.toFixed(0)}% Pago
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingItem({...inst, isInstallment: true}); setShowInstallments(true); }} className="p-1.5 text-slate-300 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => setInstallments(installments.filter(i => i.id !== inst.id))} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>

                      {/* ESTATÍSTICAS */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                          <div className="text-[9px] text-slate-500 uppercase font-bold">Status</div>
                          <div className="text-lg font-bold text-purple-600 mt-1">{metrics.monthsPaid}/{metrics.totalMonths}</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <div className="text-[9px] text-slate-500 uppercase font-bold">Valor Mensal</div>
                          <div className="text-sm font-bold text-blue-600 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(inst.monthlyAmount) || 0)}</div>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                          <div className="text-[9px] text-slate-500 uppercase font-bold">Total</div>
                          <div className="text-sm font-bold text-emerald-600 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalAmount)}</div>
                        </div>
                      </div>

                      {/* BARRA DE PROGRESSO */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Progresso de Pagamento</span>
                          <span className="text-xs font-bold text-purple-600">{metrics.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out shadow-lg" 
                            style={{ width: `${Math.min(metrics.percentage, 100)}%` }} 
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.amountPaid)} pago</span>
                          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.amountRemaining)} restam</span>
                        </div>
                      </div>

                      {/* INFORMAÇÕES ADICIONAIS */}
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-[10px] text-slate-500 uppercase font-bold">Início</div>
                          <div className="text-sm font-bold text-slate-800 mt-1">{new Date(inst.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-[10px] text-slate-500 uppercase font-bold">Término</div>
                          <div className="text-sm font-bold text-slate-800 mt-1">{new Date(inst.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</div>
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
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Parcelas nos Próximos Meses</h3>
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
                            <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
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
                  <h2 className="text-lg font-bold mb-1 uppercase tracking-wider leading-none">Gastos Fixos</h2>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm uppercase mt-2">Salários, contas e despesas que se repetem todo mês.</p>
                </div>
                <ListTodo className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5" />
             </div>
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50 text-slate-400 uppercase text-xs tracking-wider font-bold">
                   <span>Lista</span>
                   <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="flex items-center gap-1.5 text-blue-600 font-bold text-xs hover:bg-white px-3 py-2 rounded-lg transition-all border border-blue-100 bg-white shadow-sm active:scale-95 uppercase tracking-wide">
                     <PlusCircle size={14} /> Novo
                   </button>
                </div>
                <div className="divide-y divide-slate-50 font-medium">
                  {recurrentItems.length === 0 ? <div className="p-12 text-center text-slate-400 text-sm italic font-medium">Nenhum item adicionado.</div> : recurrentItems.map(r => (
                    <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3">
                         <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-sm ${r.type === 'ENTRADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                           {r.type === 'ENTRADA' ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}
                         </div>
                         <div>
                           <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{r.desc}</h4>
                           <p className="text-xs text-slate-500 font-medium uppercase mt-1 tracking-wide">Dia {r.dueDay || '01'} • {r.category}</p>
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


      {/* MODAL CONFIGURAÇÕES */}
      {showSettings && (
        <div className="fixed inset-0 bg-[#111827]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl border border-white/10 font-medium animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider leading-none">Configurações</h2>
                <button onClick={() => setShowSettings(false)} className="text-slate-300 hover:text-slate-500"><X size={24}/></button>
             </div>
             <div className="space-y-5">
                <div className="space-y-2">
                   <label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Título</label>
                   <input type="text" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={appTitle} onChange={(e) => setAppTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                   <label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Logo</label>
                   <div className="flex items-center gap-3 bg-[#F8FAFC] p-3 rounded-lg border border-slate-100 shadow-inner">
                      <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                        {appLogo ? <img src={appLogo} className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-slate-400" />}
                      </div>
                      <label className="flex-1 cursor-pointer">
                        <span className="bg-blue-600 text-white text-xs font-bold uppercase py-2 px-3 rounded-md flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all tracking-wide">
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
                   </div>
                   {appLogo && <button onClick={() => setAppLogo(null)} className="text-xs text-rose-500 font-bold uppercase mt-2 ml-1 hover:underline tracking-wide">Remover</button>}
                </div>
                <button onClick={() => setShowSettings(false)} className="w-full bg-[#111827] text-white py-3 rounded-lg font-bold text-sm uppercase tracking-wider shadow-xl active:scale-95 transition-all mt-3">Pronto</button>
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
            <div className="flex justify-between items-center mb-6"><h2 className="text-base font-bold text-slate-800 tracking-wider uppercase leading-none">{editingGoal ? 'Editar Meta' : 'Nova Meta'}</h2><button onClick={() => setEditingGoal(null)} className="text-slate-300 hover:text-slate-500"><X size={24}/></button></div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveGoal(editingGoal || {}); }} className="space-y-4">
              <div className="space-y-2"><label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Nome da Meta</label><input type="text" placeholder="Ex: Viagem, Carro" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={editingGoal?.name || ''} onChange={e => setEditingGoal({...editingGoal, name: e.target.value})} required /></div>
              <div className="space-y-2"><label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Descrição</label><input type="text" placeholder="Detalhes da meta" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={editingGoal?.description || ''} onChange={e => setEditingGoal({...editingGoal, description: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Valor da Meta</label><input type="number" step="0.01" placeholder="0.00" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={editingGoal?.target || ''} onChange={e => setEditingGoal({...editingGoal, target: parseFloat(e.target.value)})} required /></div>
              <div className="space-y-2"><label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Valor Acumulado</label><input type="number" step="0.01" placeholder="0.00" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={editingGoal?.spent || ''} onChange={e => setEditingGoal({...editingGoal, spent: parseFloat(e.target.value)})} /></div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm uppercase tracking-wider shadow-xl hover:bg-blue-700 active:scale-95 transition-all">Salvar Meta</button>
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
      <div className="flex justify-between items-center mb-6"><h2 className="text-base font-bold text-slate-800 tracking-wider uppercase leading-none">{item ? 'Editar' : 'Novo'}</h2><button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={24}/></button></div>
      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-5">
        <div className="flex gap-2 bg-[#F1F5F9] p-1.5 rounded-lg border border-slate-200">
           <button type="button" onClick={() => setFormData({...formData, type: 'ENTRADA', isPaid: true})} className={`flex-1 py-2.5 rounded-md text-xs font-bold uppercase transition-all tracking-wide ${formData.type === 'ENTRADA' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Receita</button>
           <button type="button" onClick={() => setFormData({...formData, type: 'SAIDA', isPaid: false})} className={`flex-1 py-2.5 rounded-md text-xs font-bold uppercase transition-all tracking-wide ${formData.type === 'SAIDA' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>Despesa</button>
        </div>
        <div className="space-y-2"><label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Descrição</label><input required type="text" placeholder="Ex: Almoço, Salário" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value.toUpperCase()})} /></div>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Valor</label><input required type="number" step="0.01" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div><div className="space-y-2"><label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Categoria</label><select className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none appearance-none shadow-inner" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}><option value="Fixo">Fixo</option><option value="Contas">Contas</option><option value="Extra">Extra</option><option value="Cartão">Cartão</option><option value="Outros">Outros</option></select></div></div>
        {isRecurrentView ? <div className="space-y-2"><label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Dia do Mês</label><input required type="number" min="1" max="31" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={formData.dueDay} onChange={e => setFormData({...formData, dueDay: Number(e.target.value)})} /></div> : <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Data</label><input type="date" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div><div className="flex flex-col justify-end pb-2"><label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" className="w-4 h-4 rounded-md text-blue-600 focus:ring-0 border-slate-300 shadow-sm" checked={formData.isPaid} onChange={e => setFormData({...formData, isPaid: e.target.checked})} /><span className="text-xs uppercase text-slate-400 tracking-wider group-hover:text-blue-500 font-bold transition-colors">Pago</span></label></div></div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm uppercase tracking-wider shadow-xl hover:bg-blue-700 active:scale-95 transition-all mt-2">Salvar</button>
      </form>
    </div>
  );
};


const SummaryCard = ({ title, value, subtitle, theme, location }) => {
  const styles = { neutral: "bg-white border-slate-200", income: "bg-white border-emerald-100 border-l-[3px] border-l-emerald-500", expense: "bg-white border-rose-100 border-l-[3px] border-l-rose-400" };
  const textColors = { neutral: "text-slate-800", income: "text-emerald-700", expense: "text-rose-700" };
  return (
    <div className={`p-4 rounded-2xl border ${styles[theme]} shadow-sm transition-all hover:shadow-md font-medium leading-none`}>
      <span className="text-xs font-bold uppercase text-slate-400 tracking-wider leading-none">{title}</span>
      <p className={`text-lg font-bold ${textColors[theme]} mt-2 tracking-tight leading-none`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}</p>
      <p className="text-xs text-slate-500 mt-2 font-medium leading-none uppercase tracking-wide">{subtitle}</p>
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
    paymentDay: '01'
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
        <h2 className="text-base font-bold text-slate-800 tracking-wider uppercase leading-none">
          {item ? 'Editar Parcelamento' : 'Novo Parcelamento'}
        </h2>
        <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={24}/></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DESCRIÇÃO */}
        <div className="space-y-2">
          <label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Descrição da Compra</label>
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
          <label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Tipo de Pagamento</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={() => setFormData({...formData, paymentType: 'avista'})}
              className={`py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border-2 ${
                formData.paymentType === 'avista' 
                  ? 'bg-green-100 border-green-500 text-green-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              À Vista
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, paymentType: 'parcelado'})}
              className={`py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border-2 ${
                formData.paymentType === 'parcelado' 
                  ? 'bg-purple-100 border-purple-500 text-purple-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Parcelado
            </button>
          </div>
        </div>

        {formData.paymentType === 'parcelado' && (
          <>
            {/* DATAS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Data de Início</label>
                <input 
                  type="date" 
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-purple-500 outline-none shadow-inner" 
                  value={formData.startDate} 
                  onChange={e => handleDateChange('start', e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Data de Término</label>
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
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Valor da Parcela Mensal</label>
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

            {/* ATALHOS DE PARCELAMENTO */}
            <div className="space-y-3">
              <label className="text-xs uppercase text-slate-400 ml-1 tracking-wider font-bold">Atalhos Rápidos</label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 6, 10, 12].map(months => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => handleInstallmentChange(months)}
                    className="py-2 px-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 font-bold text-xs uppercase hover:bg-purple-100 transition-all active:scale-95"
                  >
                    {months}x
                  </button>
                ))}
              </div>
            </div>

            {/* PREVIEW DOS DADOS */}
            {previewData && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">📊 Resumo do Parcelamento</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Total de Parcelas</div>
                    <div className="text-lg font-bold text-purple-600 mt-1">{previewData.totalMonths}x</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Valor Mensal</div>
                    <div className="text-lg font-bold text-purple-600 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(previewData.monthlyAmount) || 0)}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-100">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Valor Total</div>
                    <div className="text-lg font-bold text-purple-600 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(previewData.totalValue)}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-100 text-[11px] text-slate-600 font-medium">
                  <span>Período: <strong>{new Date(previewData.startDate).toLocaleDateString('pt-BR')}</strong> até <strong>{new Date(previewData.endDate).toLocaleDateString('pt-BR')}</strong></span>
                </div>
              </div>
            )}
          </>
        )}

        <button 
          type="submit" 
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold text-sm uppercase tracking-wider shadow-xl hover:bg-purple-700 active:scale-95 transition-all mt-2"
        >
          {item ? 'Atualizar Parcelamento' : 'Criar Parcelamento'}
        </button>
      </form>
    </div>
  );
};

export default App;