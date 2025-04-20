
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

const cgApiBaseUrl = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 60 * 1000; // 1 minuto

let cachedGlobalData = null;
let cachedCoinsData = null;
let lastFetchTime = 0;

async function fetchApiData() {
  try {
    console.log('Buscando dados da API CoinGecko...');
    const [globalRes, coinsRes] = await Promise.all([
      axios.get(`${cgApiBaseUrl}/global`),
      axios.get(`${cgApiBaseUrl}/coins/markets`, {
        params: {
          vs_currency: 'brl',
          order: 'market_cap_desc',
          per_page: 20,
          page: 1,
          sparkline: false
        }
      })
    ]);

    cachedGlobalData = {
      total_market_cap: { brl: Number(globalRes.data.data.total_market_cap.brl) || 0 },
      total_volume: { brl: Number(globalRes.data.data.total_volume.brl) || 0 },
      market_cap_percentage: { btc: Number(globalRes.data.data.market_cap_percentage.btc) || 0 }
    };

    cachedCoinsData = coinsRes.data.map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      slug: coin.id,
      cmc_rank: coin.market_cap_rank || Infinity,
      quote: {
        BRL: {
          price: coin.current_price || 0,
          percent_change_24h: coin.price_change_percentage_24h || 0,
          market_cap: coin.market_cap || 0,
          market_cap_dominance: cachedGlobalData.total_market_cap.brl ? (coin.market_cap / cachedGlobalData.total_market_cap.brl) * 100 : 0
        }
      },
      category: coin.categories?.some(cat => cat?.toLowerCase().includes('defi')) ? 'defi' :
                coin.categories?.some(cat => cat?.toLowerCase().includes('meme')) ? 'meme' :
                coin.categories?.some(cat => cat?.toLowerCase().includes('stablecoin')) ? 'stablecoin' :
                coin.categories?.some(cat => cat?.toLowerCase().includes('layer-1')) ? 'layer-1' :
                coin.categories?.some(cat => cat?.toLowerCase().includes('layer-2')) ? 'layer-2' : '',
      image: coin.image || 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
    }));

    lastFetchTime = Date.now();
    console.log(`Dados atualizados: total_market_cap=${cachedGlobalData.total_market_cap.brl}, ${cachedCoinsData.length} moedas`);
  } catch (err) {
    console.error('Erro ao buscar API:', err.message);
  }
}

// Atualizar cache a cada 1 minuto
setInterval(fetchApiData, CACHE_DURATION);

// Buscar dados na inicialização
fetchApiData();

app.use(express.static('public')); // Servir HTML/JS

app.get('/api/crypto', (req, res) => {
  if (cachedGlobalData && cachedCoinsData) {
    res.json({
      globalData: cachedGlobalData,
      coinsData: cachedCoinsData,
      cached: Date.now() - lastFetchTime < CACHE_DURATION
    });
  } else {
    res.status(503).json({ error: 'Dados ainda não disponíveis, tente novamente' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
