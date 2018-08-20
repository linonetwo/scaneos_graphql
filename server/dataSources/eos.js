import { RESTDataSource } from 'apollo-datasource-rest';
import cache from 'memory-cache';
import camelize from 'camelize';

import { EOS_API } from '../../API.config';

export default class EOS extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = EOS_API;
  }

  willSendRequest(request) {
    request.headers.set('Content-Type', 'application/json');
  }

  async getStatsInfo() {
    const route = 'chain/get_table_rows';
    const key = `${route}/global`;
    let response = cache.get(key);
    if (!response) {
      response = await this.post(route, {
        json: true,
        code: 'eosio',
        scope: 'eosio',
        table: 'global',
        limit: 1,
      }).then(camelize);
      if (typeof response === 'string') throw new Error(`${key} error: ${response}`);
      cache.put(key, response, 1000 * 200);
    }
    return response;
  }

  async getRamMarketInfo() {
    const route = 'chain/get_table_rows';
    const key = `${route}/rammarket`;
    let response = cache.get(key);
    if (!response) {
      response = await this.post(route, {
        json: true,
        code: 'eosio',
        scope: 'eosio',
        table: 'rammarket',
        limit: 1,
      }).then(camelize);
      if (typeof response === 'string') throw new Error(`${key} error: ${response}`);
      cache.put(key, response, 1000 * 300);
    }
    return response;
  }

  async getAccountInfo(accountName) {
    const route = 'chain/get_account';
    const key = `${route}/${accountName}`;
    let response = cache.get(key);
    if (!response) {
      response = await this.post(route, { account_name: 'eoshuobipool' }).then(camelize);
      if (typeof response === 'string') throw new Error(`${key} error: ${response}`);
      cache.put(key, response, 1000 * 500);
    }
    return response;
  }
}
