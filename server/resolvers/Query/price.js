// @flow
import { mapValues, chunk, minBy, maxBy } from 'lodash';
import fetch from 'node-fetch';
import camelize from 'camelize';
import it from 'param.macro';

import { postEOS } from '../../../API.config';

/** sample 是为了减小数据量，每隔几个数据才取一次 */
function sampleChartValues(sampleRate: number, data: any[]) {
  const sampleInterval = Math.min(Math.max(Math.floor(1 / sampleRate), 1), data.length);
  const sampledData = data.filter((__, index) => index % sampleInterval === 0);
  return sampledData;
}

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
  priceChart(_: any, { sampleRate = 1 }: { sampleRate?: number }) {
    // from https://coinmarketcap.com/currencies/eos/ look at network
    return fetch(
      `https://graphs2.coinmarketcap.com/currencies/eos/${Date.now() + -5 * 24 * 3600 * 1000}/${Date.now()}/`,
    )
      .then(res => res.json())
      .then(camelize)
      .then(chartFields =>
        mapValues(
          mapValues(chartFields, data => sampleChartValues(sampleRate, data)),
          it.map(([time, value]) => ({ time, value })),
        ),
      );
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
            cpuPrice: (cpuStaked / cpuAvailable) * 1000, // use second as unit
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
  async resourcePriceChart(_: any, { range = '5d' }: { range?: string }) {
    let startTimeDiff = 5 * 3600 * 1000;
    if (range === '5d') {
      startTimeDiff = 5 * 24 * 3600 * 1000;
    }
    if (range === '1d') {
      startTimeDiff = 1 * 24 * 3600 * 1000;
    }
    if (range === '5h') {
      startTimeDiff = 5 * 3600 * 1000;
    }

    const ramPrice = await fetch(
      `https://www.feexplorer.io/json/EOSramPrice.php?start=${Date.now() - startTimeDiff}&end=${Date.now()}`,
    )
      .then(res => res.text())
      .then(text => JSON.parse(text.substring(1, text.length - 1)))
      .then(data => data.map(([time, value]) => ({ time, value })))
      .catch(console.error);

    return { ramPrice };
  },
};
export const ResourcePriceChart = {
  sampledRamPrice({ ramPrice = [] }, { sampleRate = 1 }: { sampleRate?: number }) {
    return sampleChartValues(sampleRate, ramPrice);
  },
  ramKChart({ ramPrice = [] }, { kChartChunkSize = 10 }: { kChartChunkSize?: number }) {
    const ramKChart =
      kChartChunkSize > 1
        ? chunk(ramPrice, kChartChunkSize).map(valuesInAChunk => ({
            time: valuesInAChunk[0].time,
            open: valuesInAChunk[0].value,
            close: valuesInAChunk[valuesInAChunk.length - 1].value,
            lowest: minBy(valuesInAChunk, 'value').value,
            highest: maxBy(valuesInAChunk, 'value').value,
          }))
        : [];

    return ramKChart;
  },
};
