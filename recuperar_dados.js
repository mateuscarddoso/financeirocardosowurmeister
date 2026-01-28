// 📊 SCRIPT PARA RECUPERAR DADOS DO LOCALSTORAGE
// Execute no console do navegador (F12 > Console)

console.log('=== RECUPERANDO SEUS DADOS DO CONTROLE FINANCEIRO ===\n');

// 1. Dados Recorrentes
const recurrentItems = localStorage.getItem('fin_rec_nubank');
console.log('📌 ITENS RECORRENTES:');
console.log(JSON.parse(recurrentItems || '[]'));

// 2. Dados Mensais
const monthlyData = localStorage.getItem('fin_mon_nubank');
console.log('\n📅 DADOS MENSAIS:');
console.log(JSON.parse(monthlyData || '{}'));

// 3. Metas
const goals = localStorage.getItem('fin_goals_nubank');
console.log('\n🎯 METAS:');
console.log(JSON.parse(goals || '[]'));

// 4. Parcelamentos
const installments = localStorage.getItem('fin_installments_nubank');
console.log('\n📦 PARCELAMENTOS:');
console.log(JSON.parse(installments || '[]'));

// 5. Exportar TODOS os dados em JSON
const allData = {
  recurrentItems: JSON.parse(recurrentItems || '[]'),
  monthlyData: JSON.parse(monthlyData || '{}'),
  goals: JSON.parse(goals || '[]'),
  installments: JSON.parse(installments || '[]'),
  exportedAt: new Date().toISOString()
};

console.log('\n💾 TODOS OS DADOS (para salvar):');
console.log(JSON.stringify(allData, null, 2));

// Copiar para clipboard
copy(JSON.stringify(allData, null, 2));
console.log('\n✅ Dados copiados para o clipboard!');
