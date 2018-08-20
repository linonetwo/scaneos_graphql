// @flow
import get from '../../../API.config';

export const GlobalStatus = {
  lastPervoteBucketFill: ({ lastPervoteBucketFill }) => Number(lastPervoteBucketFill) / 1000,
};
export default {
  status(_: any, __: any, { dataSources }, { cacheControl }: Object) {
    cacheControl.setCacheHint({ maxAge: 5 });

    return Promise.all([get('/stats'), dataSources.eos.getStatsInfo().then(({ rows: [data] }) => data)]).then(
      ([BlockChainStatus, EOSGlobalStats]) => ({ ...BlockChainStatus, ...EOSGlobalStats }),
    );
  },
};
