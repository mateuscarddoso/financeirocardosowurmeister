# Controle Financeiro

Aplicativo React para controle financeiro pessoal com gestão avançada de receitas, despesas e parcelamentos.

## 🚀 Como executar

1. Instale as dependências:
```bash
npm install
```

2. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

3. Abra o navegador em `http://localhost:5173`

## 📦 Tecnologias

- React 18
- Vite
- Tailwind CSS
- Lucide React (ícones)

## ✨ Funcionalidades

- **Gestão de Receitas e Despesas**
  - Adicionar, editar e deletar movimentações
  - Categorização automática
  - Busca e filtros

- **Itens Recorrentes (Fixos)**
  - Gastos que se repetem mensalmente
  - Dia de vencimento customizável
  - Controle individual por mês

- **Sistema Avançado de Parcelamentos**
  - 🎯 Criar compras parceladas (3x, 6x, 10x, 12x ou customizado)
  - 📊 Rastrear progresso automaticamente
  - 💡 Cálculo inteligente de parcelas pagas
  - 📈 Barra de progresso visual
  - 🔄 Integração automática com fluxo de caixa
  - 📅 Visualização de próximos 12 meses

- **Metas Financeiras**
  - Criar e acompanhar metas
  - Calcular progresso em tempo real
  - Visualizar valor restante

- **Dashboard Inteligente**
  - Resumo mensal (previsão, entradas, gastos)
  - Balanço visual entrada vs. saída
  - Gastos por categoria
  - Entradas por categoria
  - Pendências do mês anterior

- **Segurança**
  - Acesso protegido por senha
  - Logout com um clique
  - Dados salvos em LocalStorage

- **Customização**
  - Título personalizável
  - Logo próprio (upload de imagem)
  - Tema claro e moderno

## 📚 Documentação

### Guias Disponíveis

- **[INSTALLMENTS_GUIDE.md](./INSTALLMENTS_GUIDE.md)** - Guia completo do sistema de parcelamentos (leia primeiro!)
- **[TECHNICAL_INSTALLMENTS.md](./TECHNICAL_INSTALLMENTS.md)** - Referência técnica para desenvolvedores
- **[FEATURES.md](./FEATURES.md)** - Lista de funcionalidades gerais
- **[README.md](./README.md)** - Este arquivo

## 🎯 Como Usar o Sistema de Parcelamentos

### Criar um Parcelamento

1. Clique na aba **"Parcelado"**
2. Clique no botão **"Novo Parcelamento"**
3. Preencha os dados:
   - **Descrição**: Nome do produto (ex: "Geladeira")
   - **Tipo**: Selecione "Parcelado"
   - **Data Início**: Quando começa a primeira parcela
   - **Valor da Parcela**: Quanto pagar por mês
   - **Atalhos Rápidos**: Clique em "3x", "6x", "10x" ou "12x" para calcular automaticamente

4. Veja o **Preview** com o valor total
5. Clique em **"Criar Parcelamento"**

### Acompanhar Progresso

- Na aba **"Parcelado"**: Veja o card de cada compra com barra de progresso
- Na aba **"Gastos"**: As parcelas aparecem como despesas mensais automáticas
- Seção **"Parcelas nos Próximos Meses"**: Visualize todas as parcelas dos próximos 12 meses

### Editar ou Deletar

- Clique no ícone **✏️ editar** para modificar dados
- Clique no ícone **🗑️ deletar** para remover o parcelamento

## 🔑 Funcionalidades Técnicas do Parcelamento

### Cálculo Automático de Progresso

O sistema calcula automaticamente:
- **Quantas parcelas foram pagas** (baseado na data atual)
- **Percentual de conclusão** (0-100%)
- **Valor já pago** (parcelas × valor mensal)
- **Valor restante** (total - já pago)

### Exemplo Prático

```
Compra: Geladeira
Parcelamento: 10x de R$ 100
Período: Janeiro - Outubro/2026
Data atual: Março/2026

Sistema calcula:
- Parcelas pagas: 3 (jan, fev, mar)
- Progresso: 30%
- Valor pago: R$ 300
- Valor restante: R$ 700
```

## 🌍 Interface

### Abas Principais

1. **Gastos** - Dashboard com receitas, despesas e pendências
2. **Fixos** - Despesas que se repetem todo mês
3. **Metas** - Acompanhe suas metas financeiras
4. **Parcelado** - 📍 **Novo!** Sistema avançado de parcelamentos

### Cards de Informação

- **Previsão**: Balanço total do mês
- **Entrada**: Total de receitas
- **Gasto**: Total de despesas
- **No Bolso**: Valor líquido (entradas - gastos já confirmados)

## 💾 Dados

Todos os dados são salvos localmente no navegador:
- `fin_logged_in` - Status de autenticação
- `fin_rec_nubank` - Itens recorrentes
- `fin_mon_nubank` - Movimentações mensais
- `fin_goals_nubank` - Metas financeiras
- `fin_installments_nubank` - Parcelamentos ativos
- `fin_title_nubank` - Título customizado
- `fin_logo_nubank` - Logo em Base64

## 🔒 Segurança

- Acesso protegido por senha (padrão: `417102a`)
- Dados criptografados no LocalStorage
- Botão de logout na canto inferior direito

## 📱 Responsividade

- ✅ Desktop (100% funcional)
- ✅ Tablet (100% funcional)
- ✅ Mobile (100% funcional com scroll)

## 🚧 Próximos Passos

- [ ] Exportar dados em PDF
- [ ] Sincronizar com Google Sheets
- [ ] Relatórios avançados
- [ ] Análise preditiva
- [ ] App PWA (offline)

## 📝 Notas

- Clique em **"+"** em qualquer listagem para adicionar novo item
- Clique no **ícone de status** para marcar como pago/pendente
- Use **search** para filtrar movimentações
- Navegue entre meses com **< >**
- Pendências do mês anterior
- Personalização de título e logo
- Persistência de dados no localStorage
