import fetch from 'node-fetch';
import camelize from 'camelize';

export default {
  price() {
    return fetch('https://widgets.coinmarketcap.com/v2/ticker/1765/?ref=widget&convert=USD')
      .then(res => res.json())
      .then(camelize)
      .then(({ data }) => ({
        updatedAt: String(data.lastUpdated),
        ...data.quotes.USD,
        marketCapUsd: data.quotes.USD.marketCap,
        priceUsd: data.quotes.USD.price,
        volume24hUsd: data.quotes.USD.volume24h,
        ...data,
      }));
  },
  priceChart() {
    // from https://coinmarketcap.com/currencies/eos/ look at network
    return fetch('https://graphs2.coinmarketcap.com/currencies/eos/1527440357000/1530118757000/')
      .then(res => res.json())
      .then(camelize);
  },
};
