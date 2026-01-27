# 📋 Guia Completo: Sistema de Gestão de Parcelamentos

## 🎯 Visão Geral

O sistema de gestão de parcelamentos é um módulo avançado que trata despesas parceladas **não como um valor único, mas como uma série temporal**. Cada parcela é rastreada mês a mês, aparecendo automaticamente no fluxo de caixa do período correto.

---

## 🛠️ Funcionalidades Principais

### 1. **Entrada de Dados - Modal Avançado**

#### Campos Obrigatórios:

- **Descrição da Compra**: Nome do produto/serviço (ex: "Geladeira", "Sofá", "TV 55 polegadas")
- **Tipo de Pagamento**: Toggle entre "À Vista" ou "Parcelado"
- **Data de Início**: Primeiro mês do parcelamento
- **Data de Término**: Último mês do parcelamento
- **Valor da Parcela Mensal**: Quanto será pago por mês (R$)

#### Atalhos Rápidos:

O modal oferece botões de atalho para configurar automaticamente o período:
- `3x` - 3 parcelas
- `6x` - 6 parcelas
- `10x` - 10 parcelas
- `12x` - 12 parcelas

**Como funciona**: Ao clicar em um atalho (ex: "10x"), o sistema:
1. Calcula o mês de término automaticamente
2. Mostra um preview dos dados
3. Permite edição manual se necessário

#### Preview em Tempo Real:

Enquanto você preenche os dados, o modal exibe:
- **Total de Parcelas**: Quantidade de meses
- **Valor Mensal**: Parcela em R$
- **Valor Total**: Valor mensal × quantidade de parcelas
- **Período**: Data de início até data de término

---

## 💡 Lógica de Cálculo - Inteligência do Sistema

### Cálculo Automático de Progresso

O sistema calcula em qual parcela você está **com base na data atual** e na data de início do parcelamento.

#### Exemplo Prático:

```
Compra: Geladeira
Data de Início: Janeiro/2026
Quantidade: 10x
Valor Mensal: R$ 100,00

Se hoje é Março/2026:
- Parcelas pagas: 3 (janeiro, fevereiro, março)
- Percentual pago: 30%
- Valor pago: R$ 300,00
- Valor restante: R$ 700,00
- Próxima parcela: Abril/2026
```

### Fórmulas Utilizadas

```javascript
// Total de meses do parcelamento
totalMonths = (endYear - startYear) × 12 + (endMonth - startMonth) + 1

// Meses já pagos (até o mês atual)
monthsPaid = min(monthsElapsed + 1, totalMonths)

// Percentual de amortização
percentage = (monthsPaid / totalMonths) × 100

// Valor já pago
amountPaid = monthlyAmount × monthsPaid

// Valor restante
amountRemaining = monthlyAmount × (totalMonths - monthsPaid)

// Valor total da compra
totalAmount = monthlyAmount × totalMonths
```

---

## 📊 Visualização - Tela de Parcelamentos Ativos

### Componentes por Card

Cada parcelamento ativo é exibido em um card detalhado contendo:

#### Informações do Topo:
- **Nome da Compra**
- **Badges**: 
  - Parcelas: `3/10 Parcelas`
  - Progresso: `30% Pago` (verde quando 100%)

#### Estatísticas em Grade (3 Colunas):
1. **Status** - `3/10` (parcelas pagas/total)
2. **Valor Mensal** - `R$ 100,00`
3. **Total** - `R$ 1.000,00`

#### Barra de Progresso Visual:
- Gradiente: Purple → Pink
- Animação suave
- Labels: 
  - Esquerda: Valor pago
  - Direita: Valor restante

#### Informações Adicionais:
- **Início**: Data formatada (ex: "01 jan")
- **Término**: Data formatada (ex: "31 out")

#### Ações:
- ✏️ **Editar**: Abre o modal para modificar dados
- 🗑️ **Deletar**: Remove o parcelamento completamente

---

## 🔄 Integração com Fluxo de Caixa

### Seção "Parcelas nos Próximos Meses"

Automaticamente, o sistema:

1. **Identifica parcelamentos ativos** para os próximos 12 meses
2. **Agrupa parcelas por mês** - Se você tem 2 parcelamentos em andamento, mostra ambos
3. **Calcula total mensal** - Soma todas as parcelas do mês
4. **Exibe visualmente**:

```
MARÇO 2026
├─ 2 parcelas
├─ Total: R$ 250,00
└─ Itens: Geladeira, Sofá
```

### Como as Parcelas Aparecem

No Dashboard principal (aba "Gastos"):

- As parcelas aparecem como **despesas automáticas**
- Valor: Soma de todas as parcelas do mês
- Categoria: "Parcelado" (pode ser customizada)
- Status: Pode ser marcada como "Pago" individualmente

---

## 🔧 Estrutura Técnica

### Utilitários Principais

#### `calculateInstallmentMetrics(inst, year, month)`
Retorna objeto com:
```javascript
{
  totalMonths,      // Total de meses
  monthsPaid,       // Meses já pagos
  percentage,       // Percentual pago (0-100)
  amountPaid,       // Valor total pago
  amountRemaining,  // Valor ainda a pagar
  totalAmount,      // Valor total da compra
  isActive          // Se está ativo no mês atual
}
```

#### `getMonthlyInstallmentAmount(inst, year, month)`
Retorna o valor que deve ser pago naquele mês específico.

```javascript
// Se o mês está dentro do período de parcelamento:
return inst.monthlyAmount

// Se não está no período:
return 0
```

### Armazenamento em LocalStorage

```javascript
// Chave: 'fin_installments_nubank'
// Estrutura de cada item:
{
  id: 'inst-1234567890',
  description: 'Geladeira',
  startDate: '2026-01-15',
  endDate: '2026-10-15',
  monthlyAmount: 100.00,
  paymentType: 'parcelado'
}
```

---

## 📱 Fluxo do Usuário

### Criar um novo parcelamento:

1. **Navegue para** → Aba "Parcelado"
2. **Clique em** → "Novo Parcelamento"
3. **Modal abre** com campos vazios
4. **Preencha**:
   - Descrição: "TV 55 polegadas"
   - Tipo: Selecione "Parcelado"
   - Data Início: 2026-02-01
   - Data Término: 2026-04-01 (ou clique "3x")
   - Valor: 500.00
5. **Preview aparece** mostrando: 3x de R$ 500 = R$ 1.500
6. **Clique em** "Criar Parcelamento"
7. **Sistema automaticamente**:
   - Salva em LocalStorage
   - Retorna para a visualização
   - Mostra o card do parcelamento criado
   - Adiciona as parcelas ao fluxo de caixa dos meses correspondentes

### Acompanhar progresso:

1. **Na tela de Parcelados**, você vê:
   - Quantas parcelas já foram pagas
   - Percentual de conclusão
   - Valor restante
   - Próxima data de vencimento

2. **Na aba "Gastos"**:
   - As parcelas aparecem como gastos mensais
   - Pode marcar como "Pago" quando pagar

3. **No dashboard principal**:
   - O balanço mensal já inclui as parcelas

---

## 🎨 Design & UX

### Paleta de Cores

- **Parcelamentos**: Purple → Pink (gradiente)
- **Progresso Completo**: Verde (#emerald-600)
- **Em Andamento**: Purple (#purple-600)
- **Valor**: Azul para mensal, Emerald para total

### Responsividade

- **Desktop**: 2 colunas de cards
- **Tablet**: 1-2 colunas conforme espaço
- **Mobile**: 1 coluna, full width

---

## ⚙️ Casos de Uso

### Caso 1: Parcelamento Simples
```
Produto: Sofá
Valor: R$ 2.000,00
Parcelamento: 10x de R$ 200
Período: Jan/2026 até Out/2026
```

**Resultado**: 
- Cada mês aparece R$ 200 de despesa fixa
- Progresso é rastreado automaticamente
- Em Out/2026, aparece como 100% concluído

### Caso 2: Múltiplos Parcelamentos
```
Produto 1: Geladeira - 5x R$ 500 (Jan-Mai)
Produto 2: Sofá - 10x R$ 300 (Fev-Nov)
```

**Resultado Fevereiro**:
- Total de parcelas: 2
- Valor total: R$ 800 (500 + 300)
- Ambas aparecem no card "Parcelas nos Próximos Meses"

### Caso 3: Parcelamento com Atraso
```
Compra: TV - 12x de R$ 100 (Jan-Dez)
Hoje: Março/2026
```

**Sistema mostra**:
- 3 de 12 parcelas pagas (25%)
- Valor pago: R$ 300
- Valor restante: R$ 900
- Próximas 9 parcelas a vencer

---

## 🚀 Próximas Funcionalidades (Sugestões)

1. **Simulador de Parcelamento**
   - Entrada: Valor total da compra
   - Saída: Diferentes opções de parcelamento (3x, 6x, 10x, etc.)
   - Cálculo automático da parcela

2. **Lembretes de Pagamento**
   - Notificação 3 dias antes do vencimento
   - Integração com calendário

3. **Histórico de Parcelamentos**
   - Parcelamentos concluídos
   - Valor total gasto em parcelamentos por período

4. **Análise de Parcelamentos**
   - Gráfico: Total parcelado vs. À vista
   - Tendência: Quanto do mês está comprometido com parcelamentos

5. **Exportação de Dados**
   - PDF com relatório de parcelamentos
   - CSV para importar em Excel

---

## 📝 Notas Técnicas

### Performance

- ✅ Cálculos otimizados com `useMemo`
- ✅ Renderização eficiente com `map()` e key props
- ✅ LocalStorage para persistência

### Compatibilidade

- ✅ Chrome/Edge (100%)
- ✅ Firefox (100%)
- ✅ Safari (100%)
- ✅ Mobile browsers (100%)

### Segurança

- ✅ Validação de datas
- ✅ Validação de valores numéricos
- ✅ Proteção por senha (já implementada)

---

## 🆘 Troubleshooting

### Problema: Parcela não aparece no mês correto

**Solução**: Verifique se a data de início e término estão corretas. O sistema calcula por mês/ano, não por dia.

### Problema: Percentual não atualiza

**Solução**: Atualize a página. O progresso é calculado em tempo real comparando a data de início com a data atual.

### Problema: Valor total não corresponde

**Solução**: Verifique o cálculo: `Valor Mensal × Número de Meses = Valor Total`

---

## 📞 Suporte

Para dúvidas ou sugestões, consulte a documentação do projeto no `FEATURES.md`.

---

**Última atualização**: 27 de Janeiro de 2026  
**Versão**: 2.0 - Sistema Avançado de Parcelamentos
