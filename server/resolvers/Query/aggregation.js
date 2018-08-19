// @flow
import get, { postEOS } from '../../../API.config';

export const GlobalStatus = {
  lastPervoteBucketFill: ({ lastPervoteBucketFill }) => Number(lastPervoteBucketFill) / 1000,
};
export default {
  status(_: any, __: any, ___: any, { cacheControl }: Object) {
    cacheControl.setCacheHint({ maxAge: 5 });

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
