const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const CMC_API_KEY = process.env.CMC_API_KEY;

app.use(express.json());

// Middleware para permitir CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Rota para CoinMarketCap
app.get('/cmc/listings', async (req, res) => {
  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY },
      params: { limit: 5000, convert: 'BRL' }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Erro na API CoinMarketCap:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Rota para CoinGecko
app.get('/cg/markets', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&per_page=250&page=${page}`);
    res.json(response.data);
  } catch (error) {
    console.error('Erro na API CoinGecko:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Rota para CoinMarketCap (detalhes de moedas)
app.get('/cmc/info', async (req, res) => {
  try {
    const cmcId = req.query.id;
    const response = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?id=${cmcId}`, {
      headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Erro na API CoinMarketCap (info):', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
