# Funcionalidades Implementadas - Controle Financeiro

## 🔐 Autenticação
- Sistema de login com senha (padrão: `417102a`)
- Persistência de sessão via localStorage

## 📊 Dashboard Principal
- **Visão mensal de gastos e entradas**
- Balanço visual com barra de progresso
- Saldo disponível "No Bolso"
- Navegação entre meses com validação de período mínimo

## 💰 Movimentações
- **Gastos (Saída)** e **Entradas** categorizadas
- Transações recorrentes (fixas) e pontuais
- Status de pagamento (Pendente/Pago)
- Busca e filtro por descrição
- Seleção em lote com ações em massa
- Edição e exclusão de registros

## 🔄 Gastos Fixos (Fixos)
- Despesas e receitas recorrentes
- Dia do vencimento configurável
- Histórico de pendências do mês anterior
- Sincronização automática com visão mensal

## 📈 Análise de Gastos (Mensal)
- **Gastos por Categoria** com percentuais
- **Entradas por Categoria** com percentuais
- Visualização em barras de progresso coloridas
- Cálculo automático de proporções

## 🎯 Metas (Metas)
- Criar e gerenciar metas financeiras
- Definir valor-alvo e acompanhar acúmulo
- Barra de progresso visual com percentual
- Visualizar: Gasto | Meta | Falta
- Editar e deletar metas
- Modal dedicado para gerenciamento

## 📦 Parcelamentos (Parcelado)
- Rastrear despesas em parcelas
- Data de início e fim configuráveis
- Valor mensal da parcela
- Cálculo automático de progresso baseado na data atual
- Visualizar: Pago | Total | Falta | Período (em meses)
- Percentual de pagamento realizado
- Editar e deletar parcelamentos
- Modal dedicado para gerenciamento

## 🎨 Interface
- Design responsivo (mobile-first)
- Tailwind CSS com paleta de cores moderna
- Ícones Lucide React
- Animações suaves com transições CSS
- Componente modal reutilizável

## 💾 Persistência de Dados
- Armazenamento local via localStorage
- Chaves de dados estruturadas:
  - `fin_logged_in`: Status de autenticação
  - `fin_rec_nubank`: Transações recorrentes
  - `fin_mon_nubank`: Dados mensais
  - `fin_goals_nubank`: Metas
  - `fin_installments_nubank`: Parcelamentos
  - `fin_title_nubank`: Título da app
  - `fin_logo_nubank`: Logo customizado

## 🚀 Deploy
- Build com Vite
- Hospedado na Vercel
- URL: https://financeirocardosowurmeister.vercel.app/
- CI/CD automático via GitHub

## 📝 Estrutura de Dados

### Transação
```javascript
{
  id: string,           // Identificador único
  desc: string,         // Descrição
  amount: number,       // Valor
  type: 'ENTRADA'|'SAIDA',
  category: string,     // Categoria
  isPaid: boolean,      // Status de pagamento
  date?: string,        // Data (YYYY-MM-DD)
  isRecurrent: boolean, // É fixo?
  dueDay?: number       // Dia do vencimento (fixos)
}
```

### Meta
```javascript
{
  id: string,
  name: string,         // Nome da meta
  description?: string, // Descrição opcional
  target: number,       // Valor-alvo
  spent: number         // Valor acumulado
}
```

### Parcelamento
```javascript
{
  id: string,
  description: string,  // Descrição do item
  startDate: string,    // Data de início (YYYY-MM-DD)
  endDate: string,      // Data de término (YYYY-MM-DD)
  monthlyAmount: number // Valor mensal da parcela
}
```

## 📱 Vistas Disponíveis
1. **Mensal** - Transações do mês com análise por categoria
2. **Fixos** - Despesas recorrentes
3. **Metas** - Acompanhamento de objetivos financeiros
4. **Parcelado** - Rastreamento de pagamentos em parcelas

---

**Versão**: 1.0.0  
**Última atualização**: 2026
