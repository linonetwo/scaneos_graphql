import fetch from 'node-fetch';
import camelize from 'camelize';
import { postEOS } from '../../../API.config';

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
  resourcePrice() {
    return Promise.all([
      postEOS('/chain/get_table_rows', {
        json: true,
        code: 'eosio',
        scope: 'eosio',
        table: 'rammarket',
        limit: 1,
      }).then(({ rows: [{ supply, base, quote }] }) => {
        const totalSupply = Number(supply.substr(0, supply.indexOf(' ')));
        const ramVolumn = Number(base.balance.substr(0, base.balance.indexOf(' ')));
        const ramMarketcap = Number(quote.balance.substr(0, quote.balance.indexOf(' ')));
        return {
          supply: totalSupply,
          ramVolumn,
          ramMarketcap,
          ramPrice: (ramMarketcap / ramVolumn) * 1024, // price in kB
        };
      }),
      postEOS('/chain/get_account', { account_name: 'eoshuobipool' }).then(
        ({
          totalResources: { netWeight, cpuWeight },
          netLimit: { max: netMaxLimit },
          cpuLimit: { max: cpuMaxLimit },
        }) => {
          const netStaked = netWeight.replace(' EOS', '');
          const cpuStaked = cpuWeight.replace(' EOS', '');
          const netAvailable = netMaxLimit / 1024; // byte to kB
          const cpuAvailable = cpuMaxLimit / 1000; // microseconds to milliseconds
          return {
            netPrice: netStaked / netAvailable,
            cpuPrice: cpuStaked / cpuAvailable,
          };
        },
      ),
    ]).then(([{ supply, ramVolumn, ramMarketcap, ramPrice }, { netPrice, cpuPrice }]) => ({
      supply,
      ramVolumn,
      ramMarketcap,
      ramPrice,
      netPrice,
      cpuPrice,
    }));
  },
  async resourcePriceChart() {
    const ramPrice = await fetch('https://www.feexplorer.io/json/EOSramPrice.php?start=1529401320000&end=1530159002000')
      .then(res => res.text())
      .then(text => JSON.parse(text.substring(1, text.length - 1)));
    return { ramPrice };
  },
};
