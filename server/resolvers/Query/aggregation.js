// @flow
import get, { postEOS } from '../../../API.config';

export default {
  status() {
    return Promise.all([
      get('/stats'),
      postEOS('/chain/get_table_rows', {
        json: true,
        code: 'eosio',
        scope: 'eosio',
        table: 'global',
        limit: 1,
      }).then(({ rows: [data] }) => data),
    ]).then(([BlockChainStatus, EOSGlobalStats]) => ({ ...BlockChainStatus, ...EOSGlobalStats }));
  },
};
