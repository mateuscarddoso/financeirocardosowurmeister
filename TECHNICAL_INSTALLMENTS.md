# 🔧 Referência Técnica - Sistema de Parcelamentos

## Estrutura de Dados

### Objeto Parcelamento

```javascript
{
  id: string,                    // Identificador único (gerado em tempo real)
  description: string,           // Nome do produto/serviço
  startDate: string,             // Formato: "YYYY-MM-DD"
  endDate: string,               // Formato: "YYYY-MM-DD"
  monthlyAmount: number,         // Valor em reais
  paymentType: string            // "parcelado" ou "avista"
}
```

### Exemplo de Instância

```javascript
{
  id: "inst-1705816273456",
  description: "Geladeira Electrolux",
  startDate: "2026-01-15",
  endDate: "2026-10-15",
  monthlyAmount: 450.50,
  paymentType: "parcelado"
}
```

---

## Utilitários - Função por Função

### 1. `calculateInstallmentProgress(startDate, currentYear, currentMonth)`

**Objetivo**: Calcula quantos meses se passaram desde o início do parcelamento.

**Parâmetros**:
- `startDate`: string no formato "YYYY-MM-DD"
- `currentYear`: number (ex: 2026)
- `currentMonth`: number (ex: 3 para março)

**Retorno**: number (meses decorridos)

**Exemplo**:
```javascript
// Se começou em janeiro/2026 e estamos em março/2026
calculateInstallmentProgress("2026-01-15", 2026, 3)
// Retorna: 2 (fevereiro e março se passaram)
```

---

### 2. `calculateInstallmentMetrics(inst, year, month)`

**Objetivo**: Calcula todas as métricas de um parcelamento para um mês específico.

**Parâmetros**:
- `inst`: object (parcelamento)
- `year`: number
- `month`: number

**Retorno**: object
```javascript
{
  totalMonths,      // Total de meses do parcelamento
  monthsPaid,       // Quantas parcelas foram pagas até agora
  percentage,       // Percentual pago (0-100)
  amountPaid,       // Valor total pago
  amountRemaining,  // Valor ainda a pagar
  totalAmount,      // Valor total da compra
  isActive          // Booleano: está ativo neste mês?
}
```

**Lógica Interna**:
```javascript
const [startYear, startMonth] = inst.startDate.split('-').map(Number);
const [endYear, endMonth] = inst.endDate.split('-').map(Number);

// Calcula quantos meses de duração tem o parcelamento
const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

// Calcula quantos meses já se passaram até o mês atual
const monthsElapsed = (year - startYear) * 12 + (month - startMonth);

// Quantidade de parcelas que já foram pagas
const monthsPaid = Math.max(0, Math.min(monthsElapsed + 1, totalMonths));

// Percentual (0-100)
const percentage = (monthsPaid / totalMonths) * 100;

// Valor monetário
const amountPaid = inst.monthlyAmount * monthsPaid;
const amountRemaining = inst.monthlyAmount * (totalMonths - monthsPaid);
const totalAmount = inst.monthlyAmount * totalMonths;
```

**Exemplo Prático**:
```javascript
const geladeira = {
  id: "inst-001",
  description: "Geladeira",
  startDate: "2026-01-15",
  endDate: "2026-10-15",
  monthlyAmount: 100.00,
  paymentType: "parcelado"
};

// Se estamos em março de 2026
const metricas = calculateInstallmentMetrics(geladeira, 2026, 3);

console.log(metricas);
// {
//   totalMonths: 10,
//   monthsPaid: 3,
//   percentage: 30,
//   amountPaid: 300.00,
//   amountRemaining: 700.00,
//   totalAmount: 1000.00,
//   isActive: true
// }
```

---

### 3. `getMonthlyInstallmentAmount(inst, year, month)`

**Objetivo**: Retorna quanto deve ser pago naquele mês específico.

**Parâmetros**:
- `inst`: object (parcelamento)
- `year`: number
- `month`: number

**Retorno**: number (valor da parcela ou 0)

**Lógica**:
```javascript
const [startYear, startMonth] = inst.startDate.split('-').map(Number);
const [endYear, endMonth] = inst.endDate.split('-').map(Number);

// Converte data em número único (para comparação fácil)
const currentMonthDate = year * 12 + month;
const startDate = startYear * 12 + startMonth;
const endDate = endYear * 12 + endMonth;

// Se o mês está dentro do período de parcelamento, retorna a parcela
if (currentMonthDate >= startDate && currentMonthDate <= endDate) {
  return inst.monthlyAmount;
}

// Senão, retorna 0
return 0;
```

**Exemplo**:
```javascript
// Janeiro (1) de 2026
getMonthlyInstallmentAmount(geladeira, 2026, 1);  // Retorna: 100.00

// Dezembro (12) de 2026
getMonthlyInstallmentAmount(geladeira, 2026, 12); // Retorna: 0 (fora do período)

// Março (3) de 2026
getMonthlyInstallmentAmount(geladeira, 2026, 3);  // Retorna: 100.00
```

---

## Componente: AdvancedInstallmentModal

### Props

```javascript
{
  item: object|null,           // Parcelamento para editar (null = criar novo)
  onSave: function,            // Callback quando salvar
  onClose: function            // Callback para fechar modal
}
```

### State Interno

```javascript
const [formData, setFormData] = useState({
  description: string,         // Nome do produto
  startDate: string,          // YYYY-MM-DD
  endDate: string,            // YYYY-MM-DD
  monthlyAmount: number|string,// Valor da parcela
  paymentType: string,        // "parcelado" ou "avista"
  totalInstallments: number,  // Quantidade de parcelas
  paymentDay: string          // Dia do mês (para referência)
});

const [previewData, setPreviewData] = useState({
  totalMonths: number,
  totalValue: number,
  startDate: string,
  endDate: string,
  monthlyAmount: number
});
```

### Estados do Modal

#### 1. Novo Parcelamento
- Todos os campos vazios
- Preview desabilitado (mostra "preencha os dados")
- Botão: "Criar Parcelamento"

#### 2. Editando Parcelamento
- Campos preenchidos com dados existentes
- Preview mostra dados atualizados em tempo real
- Botão: "Atualizar Parcelamento"

#### 3. Preview Ativo
- Quando user preenche startDate, endDate e monthlyAmount:
  - Calcula totalMonths
  - Calcula totalValue
  - Exibe em cards coloridos

### Handlers Principais

#### `handleDateChange(type, value)`
```javascript
if (type === 'start') {
  setFormData({ ...formData, startDate: value });
} else {
  setFormData({ ...formData, endDate: value });
}
```

#### `handleInstallmentChange(numInstallments)`
Quando user clica em um botão de atalho (3x, 6x, 10x, 12x):

```javascript
const monthlyAmt = parseFloat(formData.monthlyAmount) || 0;
if (monthlyAmt > 0) {
  const [startYear, startMonth, startDay] = formData.startDate.split('-');
  
  // Calcula o mês final
  let endMonth = parseInt(startMonth) + (numInstallments - 1);
  let endYear = parseInt(startYear);
  
  // Se ultrapassar dezembro, avança o ano
  while (endMonth > 12) {
    endMonth -= 12;
    endYear += 1;
  }
  
  // Atualiza o formulário
  setFormData({
    ...formData,
    totalInstallments: numInstallments,
    endDate: `${endYear}-${String(endMonth).padStart(2, '0')}-${startDay}`
  });
}
```

#### `handleSubmit(e)`
```javascript
e.preventDefault();
onSave(formData);      // Envia dados para o callback
onClose();             // Fecha o modal
```

---

## Integração com Fluxo de Caixa

### Como as Parcelas Aparecem

1. **No estado `stats`** (resumo do mês):
   - Calcula soma de todas as parcelas ativas
   - Adiciona ao total de saídas

2. **No loop de meses futuros** (visualização de 12 meses):
   - Para cada mês, filtra parcelamentos ativos
   - Agrupa por mês
   - Exibe em card interativo

### Código de Integração

```javascript
// Dentro de useMemo que calcula as estatísticas
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
```

---

## LocalStorage

### Chave

```javascript
'fin_installments_nubank'
```

### Persistência

```javascript
useEffect(() => {
  localStorage.setItem(
    'fin_installments_nubank',
    JSON.stringify(installments)
  );
}, [installments]);
```

### Carregamento Inicial

```javascript
const [installments, setInstallments] = useState(() => {
  const saved = localStorage.getItem('fin_installments_nubank');
  return saved ? JSON.parse(saved) : [];
});
```

---

## Operações CRUD

### CREATE (Criar)

```javascript
const handleSaveInstallment = (installment) => {
  if (!editingItem) {  // Se não está editando, é novo
    setInstallments([
      ...installments,
      {
        ...installment,
        id: `inst-${Date.now()}`  // ID único baseado em timestamp
      }
    ]);
  }
};
```

### READ (Ler)

```javascript
// Todos os parcelamentos ativos no mês atual
const activeInstallments = useMemo(() => {
  return installments.filter(inst => 
    inst.endDate >= `${year}-${String(month).padStart(2, '0')}-01`
  );
}, [installments, year, month]);
```

### UPDATE (Atualizar)

```javascript
const handleSaveInstallment = (installment) => {
  if (editingItem?.isInstallment) {
    setInstallments(
      installments.map(inst =>
        inst.id === editingItem.id
          ? { ...installment, id: editingItem.id }  // Mantém o ID original
          : inst
      )
    );
  }
};
```

### DELETE (Deletar)

```javascript
const handleDeleteInstallment = (id) => {
  setInstallments(installments.filter(i => i.id !== id));
};
```

---

## Validações

### Front-End

```javascript
// Campos obrigatórios
- description: required
- startDate: required
- endDate: required
- monthlyAmount: required, type="number", step="0.01"

// Validações adicionais (recomendadas)
if (!formData.description) {
  alert('Descrição é obrigatória');
  return;
}

if (new Date(formData.startDate) > new Date(formData.endDate)) {
  alert('Data de início não pode ser após a data de fim');
  return;
}

if (parseFloat(formData.monthlyAmount) <= 0) {
  alert('Valor da parcela deve ser maior que zero');
  return;
}

if (formData.paymentType === 'parcelado' && 
    (new Date(formData.endDate) - new Date(formData.startDate)) < 0) {
  alert('Período inválido');
  return;
}
```

---

## Performance

### Otimizações Implementadas

1. **useMemo para cálculos pesados**
   ```javascript
   const activeInstallments = useMemo(() => {
     // Filtra e calcula apenas quando dependências mudam
   }, [installments, year, month]);
   ```

2. **Renderização condicional**
   - Preview só renderiza quando há dados válidos
   - Cards não são renderizados se lista vazia

3. **Event handlers otimizados**
   - Uso de arrow functions para evitar rebinds
   - Callbacks memorizados quando necessário

---

## Testes - Cenários Recomendados

### Teste 1: Criar Parcelamento Simples
```
Input:
- Descrição: "Sofá"
- Início: 2026-02-01
- Fim: 2026-04-01 (ou clicar "3x")
- Valor: 500.00

Esperado:
- Card criado com 3 parcelas
- Período correto
- Valor total: R$ 1.500,00
```

### Teste 2: Editar Parcelamento
```
Input:
- Clica no card existente
- Altera valor de 500 para 600
- Salva

Esperado:
- Card atualizado
- Novo total: R$ 1.800,00
- Preview refletiu mudança
```

### Teste 3: Verificar Integração Fluxo de Caixa
```
Input:
- Cria parcelamento de 3x
- Navega para "Gastos" do mês
- Verifica próximos meses

Esperado:
- Parcelas aparecem automaticamente
- Valores corretos por mês
- Desaparece após último mês
```

### Teste 4: Persistência em LocalStorage
```
Input:
- Cria parcelamento
- Recarrega a página (F5)

Esperado:
- Parcelamento continua lá
- Dados intactos
- Todos os cálculos funcionam
```

---

## Integração com Outras Features

### Com Metas (Goals)

Possível extensão: Rastrear quanto de uma meta será pago via parcelamentos.

```javascript
// Exemplo (não implementado)
goal.monthlyCommitment = installments
  .filter(i => /* intersecção de datas */)
  .reduce((sum, i) => sum + i.monthlyAmount, 0);
```

### Com Dashboard

O dashboard principal já mostra:
- Percentual comprometido com parcelamentos
- Valor total em parcelamentos ativos
- Próximas parcelas a vencer

---

**Documentação técnica criada em**: 27 de Janeiro de 2026
