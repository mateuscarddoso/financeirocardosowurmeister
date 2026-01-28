// 📦 Serviço de IndexedDB para Persistência Permanente de Dados
// IndexedDB é muito mais resistente que localStorage - persiste mesmo após limpeza de cache

const DB_NAME = 'FinanceiroDB';
const DB_VERSION = 1;
export const STORES = {
  monthlyData: 'monthlyData',
  recurrentItems: 'recurrentItems',
  goals: 'goals',
  installments: 'installments',
  appSettings: 'appSettings'
};

let db = null;

/**
 * Inicializa a conexão com IndexedDB
 */
export const initIndexedDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Erro ao abrir IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('✅ IndexedDB inicializado com sucesso');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Criar stores se não existirem
      Object.values(STORES).forEach(storeName => {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName);
          console.log(`📦 Store criado: ${storeName}`);
        }
      });
    };
  });
};

/**
 * Salva dados no IndexedDB
 */
export const saveToIndexedDB = async (storeName, key, data) => {
  try {
    await initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data, key);

      request.onsuccess = () => {
        console.log(`💾 Dados salvos em IndexedDB: ${storeName}/${key}`);
        resolve(true);
      };

      request.onerror = () => {
        console.error(`❌ Erro ao salvar em IndexedDB:`, request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Erro em saveToIndexedDB:', err);
    throw err;
  }
};

/**
 * Recupera dados do IndexedDB
 */
export const getFromIndexedDB = async (storeName, key) => {
  try {
    await initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          console.log(`📂 Dados carregados do IndexedDB: ${storeName}/${key}`);
        }
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error(`❌ Erro ao ler de IndexedDB:`, request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Erro em getFromIndexedDB:', err);
    return null;
  }
};

/**
 * Limpa um store completamente
 */
export const clearStore = async (storeName) => {
  try {
    await initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`🗑️ Store limpo: ${storeName}`);
        resolve(true);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Erro em clearStore:', err);
    throw err;
  }
};

/**
 * Exporta todos os dados do IndexedDB como JSON
 */
export const exportAllData = async () => {
  try {
    await initIndexedDB();
    
    const allData = {};

    for (const storeName of Object.values(STORES)) {
      allData[storeName] = await new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const items = request.result;
          const dataObj = {};
          
          // Se há apenas um item, retorna direto
          if (items.length === 1 && storeName === STORES.monthlyData) {
            resolve(items[0]);
            return;
          }
          
          items.forEach((item, idx) => {
            dataObj[`item_${idx}`] = item;
          });
          resolve(dataObj);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    }

    return allData;
  } catch (err) {
    console.error('Erro em exportAllData:', err);
    throw err;
  }
};

// ... (código anterior da função syncData)
// ...

/**
 * Verifica o tamanho dos dados em IndexedDB
 */
export const getStorageSize = async () => {
// ... (código seguinte)
  try {
    if (!navigator.storage || !navigator.storage.estimate) {
      return null;
    }

    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
    };
  } catch (err) {
    console.error('Erro ao verificar tamanho:', err);
    return null;
  }
};
