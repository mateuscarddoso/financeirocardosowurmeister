# 📊 GUIA PARA RECUPERAR SEUS DADOS DO CONTROLE FINANCEIRO

## ✅ Seus dados estão aqui:

Os dados do seu controle financeiro estão armazenados no **localStorage** do navegador com as seguintes informações:

| Chave | Conteúdo |
|-------|----------|
| `fin_rec_nubank` | Itens recorrentes (despesas/receitas que se repetem) |
| `fin_mon_nubank` | Dados mensais (todas as transações do mês) |
| `fin_goals_nubank` | Suas metas financeiras |
| `fin_installments_nubank` | Parcelamentos em andamento |

---

## 🔧 Como recuperar seus dados:

### **Opção 1: Via Console do Navegador (Mais Fácil)**

1. **Abra seu navegador** onde você usa o controle financeiro
2. Pressione **`F12`** para abrir as ferramentas de desenvolvedor
3. Vá para a aba **"Console"**
4. Cole o seguinte código:

```javascript
const data = {
  recurrentItems: JSON.parse(localStorage.getItem('fin_rec_nubank') || '[]'),
  monthlyData: JSON.parse(localStorage.getItem('fin_mon_nubank') || '{}'),
  goals: JSON.parse(localStorage.getItem('fin_goals_nubank') || '[]'),
  installments: JSON.parse(localStorage.getItem('fin_installments_nubank') || '[]')
};
console.log(data);
copy(JSON.stringify(data, null, 2));
alert('✅ Dados copiados! Abra um editor de texto e cole (Ctrl+V)');
```

5. Pressione **Enter**
6. Seus dados serão **copiados automaticamente** para o clipboard
7. Abra um **bloco de notas ou editor** e cole (**Ctrl+V**)
8. Salve o arquivo como `meus_dados_financeiros.json`

---

### **Opção 2: Exportar como CSV**

Dentro do app, procure por:
- ⚙️ Botão **"Configurações"** ou **"Opções"**
- 📥 Opção **"Exportar Dados"** ou **"Download de Dados"**
- Será gerado um arquivo `extrato_financeiro_YYYY-MM-DD.csv`

---

### **Opção 3: Ver dados manualmente no Console**

Se quiser ver cada categoria separadamente:

```javascript
// Recorrentes
console.log('RECORRENTES:', JSON.parse(localStorage.getItem('fin_rec_nubank') || '[]'));

// Mensais
console.log('MENSAIS:', JSON.parse(localStorage.getItem('fin_mon_nubank') || '{}'));

// Metas
console.log('METAS:', JSON.parse(localStorage.getItem('fin_goals_nubank') || '[]'));

// Parcelamentos
console.log('PARCELAMENTOS:', JSON.parse(localStorage.getItem('fin_installments_nubank') || '[]'));
```

---

## 📋 Estrutura dos seus dados

```json
{
  "recurrentItems": [
    {
      "id": "r-1234567890",
      "type": "Despesa|Receita",
      "desc": "DESCRIÇÃO",
      "category": "Categoria",
      "amount": 100.00,
      "dueDay": 15
    }
  ],
  "monthlyData": {
    "2026-01": [
      {
        "id": "s-1234567890",
        "type": "Despesa|Receita",
        "date": "2026-01-15",
        "desc": "DESCRIÇÃO",
        "category": "Categoria",
        "amount": 50.00,
        "isPaid": true
      }
    ]
  },
  "goals": [
    {
      "id": "g-1234567890",
      "title": "Meta",
      "target": 1000,
      "current": 500,
      "category": "Categoria",
      "icon": "🎯"
    }
  ],
  "installments": [
    {
      "id": "inst-1234567890",
      "description": "Produto",
      "monthlyAmount": 100,
      "totalAmount": 1000,
      "startDate": "2026-01-01",
      "endDate": "2026-10-01",
      "installmentsPaid": 3
    }
  ]
}
```

---

## 💡 Dicas importantes:

✅ Faça **backup regular** dos seus dados
✅ Guarde o arquivo `JSON` em local seguro
✅ Se trocar de navegador, importe os dados novamente
✅ Dados no localStorage **desaparecem** se limpar cache/cookies

---

## 🚀 Como restaurar os dados em outro computador/navegador:

Você poderá usar a funcionalidade de **importação** do app para restaurar todos os seus dados do arquivo `JSON` que salvou.

**Precisa de ajuda?** Abra o console e execute os comandos acima! 🎯
