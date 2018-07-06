import { RESTDataSource } from 'apollo-datasource-rest';
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
    const { data } = await this.get('tables/bp/rows');
    return data;
  }
}
