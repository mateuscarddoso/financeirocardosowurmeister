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
  Image as ImageIcon
} from 'lucide-react';


// --- SISTEMA TOTALMENTE ZERADO ---
const DEFAULT_RECURRENT = [];
const INITIAL_MONTHLY_DATA = {};


const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];


const App = () => {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(1);
  const [view, setView] = useState('mensal'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showPendencies, setShowPendencies] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);


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


  useEffect(() => {
    localStorage.setItem('fin_rec_nubank', JSON.stringify(recurrentItems));
    localStorage.setItem('fin_mon_nubank', JSON.stringify(monthlyData));
    localStorage.setItem('fin_title_nubank', appTitle);
    if (appLogo) localStorage.setItem('fin_logo_nubank', appLogo);
  }, [recurrentItems, monthlyData, appTitle, appLogo]);


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
    }, { totalIn: 0, totalOut: 0, realIn: 0, realOut: 0 });
  }, [currentEntries]);


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
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            {appLogo ? (
              <img src={appLogo} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="bg-blue-600 p-1.5 rounded-lg"><Database size={18} className="text-white" /></div>
            )}
            <div>
              <h1 className="text-md font-medium leading-none">{appTitle}</h1>
              <span className="text-[8px] text-slate-400 uppercase tracking-widest mt-0.5 block font-medium">Gestão 2026</span>
            </div>
          </div>


          <div className="flex items-center bg-[#1F2937] p-1 rounded-xl border border-slate-700">
            <button onClick={() => setView('mensal')} className={`px-5 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'mensal' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Mensal</button>
            <button onClick={() => setView('fixos')} className={`px-5 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'fixos' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Fixos</button>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-medium">
              <SummaryCard title="Previsão" value={stats.totalIn - stats.totalOut} subtitle="Balanço Final" theme="neutral" />
              <SummaryCard title="Entradas" value={stats.totalIn} subtitle="Soma Mensal" theme="income" />
              <SummaryCard title="Saídas" value={stats.totalOut} subtitle="Soma Mensal" theme="expense" />
              <div className="bg-[#111827] p-4 rounded-2xl shadow-md flex flex-col justify-between border border-slate-800 transition-transform hover:scale-[1.01]">
                <span className="text-[9px] font-medium uppercase text-slate-500 tracking-wider leading-none">Saldo Real na Conta</span>
                <p className="text-xl font-medium text-white tracking-tight mt-2">{formatCurrency(stats.realIn - stats.realOut)}</p>
                <div className="flex items-center gap-1 mt-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /><span className="text-[8px] text-blue-400 uppercase font-medium">Líquido</span></div>
              </div>
            </div>


            {/* PENDÊNCIAS */}
            {lastMonthPendencies.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-500">
                <button onClick={() => setShowPendencies(!showPendencies)} className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-slate-600">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-slate-400" />
                    <h3 className="text-xs font-medium uppercase tracking-widest">Pendências de {month === 1 ? MONTHS[11] : MONTHS[month-2]} ({lastMonthPendencies.length})</h3>
                  </div>
                  {showPendencies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showPendencies && (
                  <div className="px-5 pb-4 space-y-2 border-t border-slate-50 pt-3 bg-slate-50/30 font-medium">
                    {lastMonthPendencies.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                         <div className="flex items-center gap-3">
                           <button onClick={() => toggleStatus(p.id, p.isRecurrent || false, p.prevY, p.prevM)} className="text-slate-300 hover:text-blue-500 transition-all active:scale-90"><Clock size={18} /></button>
                           <span className="text-xs font-medium uppercase text-slate-700 tracking-tight">{p.desc}</span>
                         </div>
                         <span className="text-xs font-medium text-rose-500/80">{formatCurrency(p.amount)}</span>
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
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Movimentações</h2>
                  <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-all active:scale-95 shadow-sm"><Plus size={16} /></button>
                </div>
                
                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-4 px-4 py-1.5 bg-blue-50 rounded-xl border border-blue-100 animate-in slide-in-from-right duration-300">
                    <span className="text-[9px] font-medium text-blue-600 uppercase tracking-tight">{selectedIds.length} selecionados</span>
                    <button onClick={() => bulkTogglePaid(true)} className="text-emerald-600 text-[9px] font-bold uppercase hover:underline">Confirmar</button>
                    <button onClick={() => bulkTogglePaid(false)} className="text-blue-600 text-[9px] font-bold uppercase hover:underline">Pendente</button>
                  </div>
                )}


                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input type="text" placeholder="Procurar..." className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-[10px] font-medium focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>


              <div className="overflow-x-auto font-medium">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                      <th className="px-5 py-3 border-b text-center w-8">
                         <button onClick={() => { if(selectedIds.length === currentEntries.length && currentEntries.length > 0) setSelectedIds([]); else setSelectedIds(currentEntries.map(e=>e.id)); }} className="text-slate-300 transition-colors hover:text-blue-500"><CheckSquare size={16}/></button>
                      </th>
                      <th className="px-2 py-3 border-b">Status</th>
                      <th className="px-2 py-3 border-b">Descrição</th>
                      <th className="px-2 py-3 border-b text-right">Valor</th>
                      <th className="px-5 py-3 border-b text-center w-20">...</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {currentEntries.length === 0 ? (
                      <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-300 text-xs font-medium italic">Vazio. Adicione seu primeiro gasto no "+".</td></tr>
                    ) : (
                      currentEntries.map((t) => (
                        <tr key={t.id} className={`hover:bg-slate-50 transition-colors group ${t.isPaid ? 'opacity-40' : ''} ${selectedIds.includes(t.id) ? 'bg-blue-50/40' : ''}`}>
                          <td className="px-5 py-3.5 text-center">
                             <button onClick={() => { if(selectedIds.includes(t.id)) setSelectedIds(selectedIds.filter(i=>i!==t.id)); else setSelectedIds([...selectedIds, t.id]); }} className={`${selectedIds.includes(t.id) ? 'text-blue-600' : 'text-slate-200 group-hover:text-slate-300'}`}><CheckSquare size={18}/></button>
                          </td>
                          <td className="px-2 py-3.5">
                            <button onClick={() => toggleStatus(t.id, t.isRecurrent)} className={`px-2.5 py-1 rounded-lg text-[8px] font-medium uppercase transition-all border ${t.isPaid ? 'bg-emerald-50 border-emerald-100 text-emerald-600 font-semibold' : 'bg-white border-slate-200 text-slate-400'}`}>
                              {t.isPaid ? 'Pago' : 'Pendente'}
                            </button>
                          </td>
                          <td className="px-2 py-3.5">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                 <span className={`text-xs font-medium leading-none ${t.isPaid ? 'line-through text-slate-400' : 'text-slate-700'}`}>{t.desc}</span>
                                 {t.isRecurrent && <span className="text-[7px] bg-blue-50 text-blue-500 px-1 py-0.5 rounded border border-blue-100 font-medium uppercase tracking-tighter shadow-inner">Fixo</span>}
                              </div>
                              <span className="text-[9px] text-slate-400 font-medium mt-1 uppercase tracking-tighter">{t.category} • {t.date ? new Date(t.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) : '--/--'}</span>
                            </div>
                          </td>
                          <td className="px-2 py-3.5 text-right font-medium">
                            <span className={t.type === 'ENTRADA' ? 'text-emerald-600 text-xs' : 'text-rose-500/80 text-xs'}>
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


              {/* BARRA DE EQUILÍBRIO SUTIL */}
              <div className="px-5 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-6">
                 <div className="text-[7px] font-bold text-slate-300 uppercase tracking-widest leading-none">Balanço de Forças</div>
                 <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                    <div className="bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${stats.totalIn + stats.totalOut === 0 ? 50 : (stats.totalIn / (stats.totalIn + stats.totalOut)) * 100}%` }} />
                    <div className="bg-rose-500/60 transition-all duration-1000 ease-out" style={{ width: `${stats.totalIn + stats.totalOut === 0 ? 50 : (stats.totalOut / (stats.totalIn + stats.totalOut)) * 100}%` }} />
                 </div>
              </div>
            </div>
          </>
        ) : (
          <div className="animate-in fade-in duration-500 max-w-2xl mx-auto space-y-4 font-medium">
             <div className="bg-[#111827] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
                <div className="relative z-10">
                  <h2 className="text-xl font-medium mb-1 uppercase tracking-widest leading-none">Base Recorrente</h2>
                  <p className="text-slate-400 text-[10px] font-medium leading-relaxed max-w-xs uppercase mt-2">Cadastre aqui os salários e contas que se repetem todo mês.</p>
                </div>
                <ListTodo className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5" />
             </div>
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">
                <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50/50 text-slate-400 uppercase text-[9px] tracking-widest font-bold">
                   <span>Itens Fixos</span>
                   <button onClick={() => { setEditingItem(null); setShowModal(true); }} className="flex items-center gap-1.5 text-blue-600 font-bold text-[9px] hover:bg-white px-4 py-2 rounded-xl transition-all border border-blue-100 bg-white shadow-sm active:scale-95">
                     <PlusCircle size={14} /> Novo Item Fixo
                   </button>
                </div>
                <div className="divide-y divide-slate-50 font-medium">
                  {recurrentItems.length === 0 ? <div className="p-14 text-center text-slate-300 text-xs italic font-medium">Nenhum item cadastrado.</div> : recurrentItems.map(r => (
                    <div key={r.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-4">
                         <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${r.type === 'ENTRADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                           {r.type === 'ENTRADA' ? <ArrowUp size={18}/> : <ArrowDown size={18}/>}
                         </div>
                         <div>
                           <h4 className="text-sm font-medium text-slate-700 uppercase tracking-tight">{r.desc}</h4>
                           <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5 tracking-tighter">Vence Dia {r.dueDay || '01'} • {r.category}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-5">
                         <span className={`text-sm font-medium ${r.type === 'ENTRADA' ? 'text-emerald-600' : 'text-slate-700'}`}>{formatCurrency(r.amount)}</span>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                           <button onClick={() => { setEditingItem({...r, isRecurrent: true}); setShowModal(true); }} className="p-1.5 text-slate-300 hover:text-blue-600"><Pencil size={16}/></button>
                           <button onClick={() => deleteItem(r.id, true)} className="p-1.5 text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
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
          <div className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl border border-white/10 font-medium animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest leading-none">Ajustes do App</h2>
                <button onClick={() => setShowSettings(false)} className="text-slate-300 hover:text-slate-500"><X size={24}/></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[9px] uppercase text-slate-400 ml-1 tracking-widest font-bold">Título do App</label>
                   <input type="text" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={appTitle} onChange={(e) => setAppTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] uppercase text-slate-400 ml-1 tracking-widest font-bold">Logotipo Personalizado</label>
                   <div className="flex items-center gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-slate-100 shadow-inner">
                      <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                        {appLogo ? <img src={appLogo} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300" />}
                      </div>
                      <label className="flex-1 cursor-pointer">
                        <span className="bg-blue-600 text-white text-[9px] font-bold uppercase py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all">
                           <Upload size={14} /> Subir Logo
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
                   {appLogo && <button onClick={() => setAppLogo(null)} className="text-[9px] text-rose-400 font-bold uppercase mt-2 ml-1 hover:underline">Remover Logo</button>}
                </div>
                <button onClick={() => setShowSettings(false)} className="w-full bg-[#111827] text-white py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4">Salvar e Fechar</button>
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
    </div>
  );
};


const ModalContent = ({ item, isRecurrentView, onSave, onClose }) => {
  const [formData, setFormData] = useState(item ? { ...item } : { desc: '', amount: '', type: 'SAIDA', category: 'Fixo', date: '', isPaid: false, dueDay: 5 });
  return (
    <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl border border-white/10 font-sans font-medium animate-in zoom-in-95">
      <div className="flex justify-between items-center mb-8"><h2 className="text-sm font-bold text-slate-800 tracking-widest uppercase leading-none">{item ? 'Editar' : 'Novo'}</h2><button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={24}/></button></div>
      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
        <div className="flex bg-[#F1F5F9] p-1 rounded-xl border border-slate-200">
           <button type="button" onClick={() => setFormData({...formData, type: 'ENTRADA', isPaid: true})} className={`flex-1 py-3 rounded-lg text-[9px] font-bold uppercase transition-all ${formData.type === 'ENTRADA' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Entrada</button>
           <button type="button" onClick={() => setFormData({...formData, type: 'SAIDA', isPaid: false})} className={`flex-1 py-3 rounded-lg text-[9px] font-bold uppercase transition-all ${formData.type === 'SAIDA' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>Saída</button>
        </div>
        <div className="space-y-1.5"><label className="text-[8px] uppercase text-slate-400 ml-1 tracking-widest font-bold">O que é?</label><input required type="text" placeholder="NOME DO ITEM" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value.toUpperCase()})} /></div>
        <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[8px] uppercase text-slate-400 ml-1 tracking-widest font-bold">Valor</label><input required type="number" step="0.01" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none shadow-inner" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div><div className="space-y-1.5"><label className="text-[8px] uppercase text-slate-400 ml-1 tracking-widest font-bold">Tag</label><select className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 text-[10px] font-medium focus:ring-1 focus:ring-blue-500 outline-none appearance-none shadow-inner" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}><option value="Fixo">Fixo</option><option value="Contas">Contas</option><option value="Extra">Extra</option><option value="Cartão">Cartão</option><option value="Outros">Outros</option></select></div></div>
        {isRecurrentView ? <div className="space-y-1.5"><label className="text-[8px] uppercase text-slate-400 ml-1 tracking-widest font-bold">Dia de Vencimento</label><input required type="number" min="1" max="31" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 text-xs font-medium shadow-inner" value={formData.dueDay} onChange={e => setFormData({...formData, dueDay: Number(e.target.value)})} /></div> : <div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-[8px] uppercase text-slate-400 ml-1 tracking-widest font-bold">Data</label><input type="date" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 text-[10px] font-medium shadow-inner" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div><div className="flex flex-col justify-end pb-3"><label className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" className="w-4 h-4 rounded-md text-blue-600 focus:ring-0 border-slate-300 shadow-sm" checked={formData.isPaid} onChange={e => setFormData({...formData, isPaid: e.target.checked})} /><span className="text-[8px] uppercase text-slate-400 tracking-widest group-hover:text-blue-500 font-bold transition-colors">Pago</span></label></div></div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all mt-2">Salvar Registro</button>
      </form>
    </div>
  );
};


const SummaryCard = ({ title, value, subtitle, theme }) => {
  const styles = { neutral: "bg-white border-slate-200", income: "bg-white border-emerald-100 border-l-[3px] border-l-emerald-500", expense: "bg-white border-rose-100 border-l-[3px] border-l-rose-400" };
  const textColors = { neutral: "text-slate-800", income: "text-emerald-700", expense: "text-rose-700" };
  return (
    <div className={`p-4 rounded-2xl border ${styles[theme]} shadow-sm transition-all hover:shadow-md font-medium leading-none`}>
      <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest leading-none font-medium">{title}</span>
      <p className={`text-md font-semibold ${textColors[theme]} mt-3 tracking-tight leading-none`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}</p>
      <p className="text-[8px] text-slate-300 mt-2 font-medium leading-none uppercase tracking-tighter">{subtitle}</p>
    </div>
  );
};


export default App;