# 📖 Exemplos de Uso - Sistema de Parcelamentos

## 🎓 Cenários Reais e Tutoriais

### Cenário 1: Primeira Compra Parcelada - Sofá

#### Situação
Você comprou um sofá por R$ 3.000 em 5 parcelas e quer rastrear no app.

#### Passo a Passo

1. **Abra a aba "Parcelado"**
   - Clique no botão roxo "Novo Parcelamento"

2. **Preencha o formulário**
   ```
   Descrição: Sofá Retrátil 3 Lugares
   Tipo: Parcelado
   Data Início: 01/02/2026 (quando você paga a 1ª parcela)
   Valor Mensal: R$ 600,00 (3000 ÷ 5)
   ```

3. **Use o atalho "5x"**
   - Sistema calcula automaticamente: 5 parcelas
   - Preview mostra: 5x de R$ 600 = R$ 3.000

4. **Clique "Criar Parcelamento"**
   - Card aparece na tela de parcelados
   - Status mostra: 0/5 parcelas (0% pago)

#### Resultado Automático

**No Mês 1 (Fevereiro)**
- Aparece como despesa de R$ 600
- No dashboard: "-R$ 600" (gasto)

**No Mês 3 (Abril)**
- Você vê: 3/5 parcelas (60% pago)
- Barra de progresso: 60% preenchida
- Valor pago: R$ 1.800
- Valor restante: R$ 1.200

**Nos Próximos Meses**
- Seção "Parcelas nos Próximos Meses" mostra:
  ```
  FEVEREIRO: R$ 600 (Sofá)
  MARÇO: R$ 600 (Sofá)
  ABRIL: R$ 600 (Sofá)
  MAIO: R$ 600 (Sofá)
  JUNHO: R$ 600 (Sofá)
  ```

---

### Cenário 2: Múltiplas Compras Parceladas

#### Situação
Você financiou uma TV (6x) E uma geladeira (8x). Quanto de compromisso financeiro tem?

#### Dados
```
TV 55": R$ 1.800 = 6x de R$ 300 (Fev-Jul)
Geladeira: R$ 2.400 = 8x de R$ 300 (Mar-Out)
```

#### Criando os Parcelamentos

**Parcelamento 1: TV**
```
Descrição: TV 55" Samsung
Data Início: 2026-02-01
Clique em: "6x"
Valor Mensal: R$ 300
→ Preview: 6x de R$ 300 = R$ 1.800 ✅
```

**Parcelamento 2: Geladeira**
```
Descrição: Geladeira Electrolux
Data Início: 2026-03-01
Clique em: "8x"
Valor Mensal: R$ 300
→ Preview: 8x de R$ 300 = R$ 2.400 ✅
```

#### Visualizando o Impacto

**Março (quando ambas estão em progresso)**
- Seção "Parcelas nos Próximos Meses":
  ```
  MARÇO 2026
  ├─ 2 parcelas
  ├─ Total: R$ 600,00
  └─ Itens: TV 55" Samsung, Geladeira Electrolux
  ```

**No Dashboard de Gastos (Março)**
- Total de despesas incluirá R$ 600 de parcelamentos
- Mostra como gasto do mês

**Cálculo de Compromisso**
```
Fevereiro: R$ 300 (TV)
Março: R$ 600 (TV + Geladeira)
Abril: R$ 600 (TV + Geladeira)
Maio: R$ 600 (TV + Geladeira)
Junho: R$ 300 (TV)
Julho: R$ 300 (TV)
Agosto: R$ 300 (Geladeira)
Setembro: R$ 300 (Geladeira)
Outubro: R$ 300 (Geladeira)

Mês mais caro: Março a Junho (R$ 600/mês)
```

---

### Cenário 3: Acompanhando Progresso - Parcelamento em Andamento

#### Situação
Você criou um parcelamento em Janeiro. Estamos em Abril. Como saber onde está?

#### Parcelamento Original
```
Produto: Notebook
Valor: R$ 2.400
Parcelas: 12x de R$ 200
Período: Janeiro - Dezembro 2026
```

#### Visualização em Abril

**No Card do Parcelamento**
```
📊 Resumo do Parcelamento

NOTEBOOK

Parcelas: 4/12 ✅
Progresso: 33% Pago

Status:        Valor Mensal:    Total:
4/12           R$ 200,00        R$ 2.400,00

Barra de Progresso: ████░░░░░░░░░░░░░░ (33%)

Pago: R$ 800,00 (4 parcelas)
Restam: R$ 1.600,00 (8 parcelas)

Início: 01 jan | Término: 31 dez
```

#### Insights Disponíveis

1. **Quanto já foi pago?** R$ 800
2. **Quanto falta?** R$ 1.600
3. **Quantas parcelas restam?** 8
4. **Quando termina?** Dezembro 2026
5. **Está em dia?** Sim (4 de 4 esperadas até Abril)

---

### Cenário 4: Editando um Parcelamento

#### Situação
Você criou um parcelamento, mas quer aumentar o valor mensal para terminar mais rápido.

#### Antes
```
Parcelamento: 12x de R$ 200 (Total: R$ 2.400)
Período: Jan - Dez
```

#### Editar

1. **Clique no ícone ✏️ editar**
   - Modal abre com dados preenchidos
   - Preview mostra dados atuais

2. **Altere o Valor Mensal**
   ```
   Antes: R$ 200
   Depois: R$ 300
   ```

3. **Ajuste a Data de Término**
   - Clique em: "6x" (em vez de "12x")
   - Sistema recalcula: Junho 2026

4. **Veja o Preview**
   ```
   6x de R$ 300 = R$ 1.800
   (economiza R$ 600 em comparação ao original)
   ```

5. **Clique "Atualizar Parcelamento"**
   - Card atualizado
   - Novo cálculo de progresso

#### Resultado
```
Antes: 12 meses de compromisso
Depois: 6 meses (pagamento mais rápido)

Economia: R$ 600 em juros/acréscimos (conceitual)
```

---

### Cenário 5: Planejamento Mensal com Parcelamentos

#### Situação
Você quer ver quanto está comprometido nos próximos meses com parcelamentos.

#### Sua Situação Financeira (Abril 2026)
```
Salário: R$ 3.000/mês (fixo)
Aluguel: R$ 1.000/mês (fixo)
Comida: R$ 500/mês (variável)
```

#### Parcelamentos Ativos
```
1. Sofá: 3x de R$ 400 (Abr-Jun)
2. TV: 6x de R$ 300 (Abr-Set)
3. Notebook: 12x de R$ 200 (Jan-Dez)
```

#### Visualização de 12 Meses

**Abril 2026**
- Parcelamentos: 3 (Sofá, TV, Notebook)
- Total: R$ 900
- Comprometido: 30% do salário

**Maio 2026**
- Parcelamentos: 3 (Sofá, TV, Notebook)
- Total: R$ 900
- Comprometido: 30% do salário

**Junho 2026**
- Parcelamentos: 2 (TV, Notebook - Sofá termina)
- Total: R$ 500
- Comprometido: 16,7% do salário

**Julho 2026**
- Parcelamentos: 2 (TV, Notebook)
- Total: R$ 500
- Comprometido: 16,7% do salário

#### Análise

```
Mês Crítico: Abril-Maio (R$ 900)
- Orçamento: R$ 3.000 - R$ 1.000 (aluguel) - R$ 500 (comida) = R$ 500
- Depois de parcelamentos: R$ 500 - R$ 900 = -R$ 400 ❌
- AÇÃO: Precisar cortar gastos outros ou aumentar a renda

Mês Alívio: Junho (R$ 500)
- Orçamento disponível: R$ 500
- Depois de parcelamentos: R$ 500 - R$ 500 = R$ 0 ✅
- AÇÃO: Está equilibrado
```

---

### Cenário 6: Deletando um Parcelamento

#### Situação
Você não quer mais pagar um parcelamento (ex: devolução do produto).

#### Processo

1. **Na tela de Parcelados**
   - Encontre o card do parcelamento

2. **Clique no ícone 🗑️ deletar**
   - Confirmação: "Deseja deletar?"
   - Clique "Sim"

3. **Resultado**
   - Card desaparece
   - Parcelas não aparecem mais no fluxo de caixa
   - LocalStorage atualizado

#### Impacto

```
Antes:
- Junho: Sofá (R$ 400) + TV (R$ 300) = R$ 700

Depois de deletar o Sofá:
- Junho: TV (R$ 300) = R$ 300

Economia: R$ 400/mês
```

---

## 🎯 Dicas Práticas

### Dica 1: Use Atalhos
- Não precisa calcular na mão
- Clique "3x", "6x", "10x" ou "12x"
- Sistema faz o cálculo automaticamente

### Dica 2: Verifique o Preview
- Antes de criar, sempre veja o preview
- Confirme que o total está correto
- Intervalo de datas faz sentido?

### Dica 3: Planeje com Antecedência
- Veja "Parcelas nos Próximos Meses"
- Identifique meses críticos
- Planeje seu orçamento considerando parcelamentos

### Dica 4: Revise Regularmente
- Todo mês, veja o progresso
- Confira se as parcelas estão sendo pagas
- Acompanhe o percentual de conclusão

### Dica 5: Organize por Categoria
- Use descrições claras
- Agrupe parcelamentos relacionados (ex: "Móveis - Sofá")
- Facilita a busca e organização

---

## ⚠️ Casos Especiais

### E se eu tiver atraso em uma parcela?

**Problema**: Não consegui pagar uma parcela em abril.

**Solução (Manual)**:
1. No Dashboard (aba "Gastos")
2. Abril: Encontre a parcela
3. Não marque como "Pago"
4. Em maio, quando conseguir, marque a de abril como pago
5. O sistema recalcula automaticamente

**Resultado**: O percentual de conclusão reflete o atraso até você normalizar.

### E se o valor da parcela for diferente cada mês?

**Limitação Atual**: O sistema assume valor fixo mensal.

**Workaround**: Crie parcelamentos separados por períodos:
- Parcelas 1-3: Valor X
- Parcelas 4-6: Valor Y
- Parcelas 7-10: Valor Z

### E se quiser modificar o valor total?

**Opção 1**: Editar e ajustar o valor mensal e a quantidade de parcelas

**Opção 2**: Deletar e criar um novo parcelamento com os dados corretos

---

## 📊 Relatório Exemplo - Simulação Completa

### Cenário Total de Abril 2026

```
RESUMO DO MÊS: ABRIL 2026
========================

📊 RECEITAS
Salário Fixo:        R$ 3.000,00
Bônus:               R$ 500,00
TOTAL ENTRADA:       R$ 3.500,00

📈 DESPESAS FIXAS
Aluguel:             R$ 1.200,00
Internet:            R$ 100,00
Seguro:              R$ 150,00
SUBTOTAL FIXO:       R$ 1.450,00

📦 DESPESAS VARIÁVEIS
Supermercado:        R$ 450,00
Combustível:         R$ 300,00
Lazer:               R$ 200,00
SUBTOTAL VARIÁVEL:   R$ 950,00

💳 PARCELAMENTOS ESTE MÊS
Sofá (1/3):          R$ 400,00
TV (1/6):            R$ 300,00
Notebook (4/12):     R$ 200,00
SUBTOTAL PARCELADO:  R$ 900,00

================================================
TOTAL DESPESAS:      R$ 3.300,00
SALDO PREVISTO:      R$ 200,00 ✅

================================================
🎯 PROGRESSO DOS PARCELAMENTOS
Sofá:     ████░░░░░░░░░░░░░░ 33%
TV:       ██░░░░░░░░░░░░░░░░ 17%
Notebook: ████████░░░░░░░░░░ 33%

Total Comprometido: R$ 900,00 (26% do salário)
```

---

**Última atualização**: 27 de Janeiro de 2026
