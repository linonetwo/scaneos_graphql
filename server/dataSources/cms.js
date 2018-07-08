import { RESTDataSource } from 'apollo-datasource-rest';
import cache from 'memory-cache';

import { CMS_API } from '../../API.config';

export default class CMS extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = CMS_API;
  }

  willSendRequest(request) {
    request.headers.set('Authorization', `Bearer ${this.context.CMS_TOKEN}`);
    request.headers.set('Content-Type', 'application/json');
  }

  async getBPDescriptionList() {
    const route = 'tables/bp/rows';
    let response = cache.get(route)
    if (!response) {
      response = await this.get(route);
      cache.put(route, response, 1000 * 3600 * 3);
    }
    return response.data;
  }
}
