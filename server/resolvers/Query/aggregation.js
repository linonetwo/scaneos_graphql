// @flow
import get, { postEOS } from '../../../API.config';

export const EOSGlobalStats = new Proxy(
  {},
  {
    get: (target, property) => {
      console.log('bbb');
      if (property === '__isTypeOf') {
        return true;
      }
      if (
        [
          'maxBlockNetUsage',
          'targetBlockNetUsagePct',
          'maxTransactionNetUsage',
          'basePerTransactionNetUsage',
          'netUsageLeeway',
          'contextFreeDiscountNetUsageNum',
          'contextFreeDiscountNetUsageDen',
          'maxBlockCpuUsage',
          'targetBlockCpuUsagePct',
          'maxTransactionCpuUsage',
          'minTransactionCpuUsage',
          'maxTransactionLifetime',
          'deferredTrxExpirationWindow',
          'maxTransactionDelay',
          'maxInlineActionSize',
          'maxInlineActionDepth',
          'maxAuthorityDepth',
          'maxRamSize',
          'totalRamBytesReserved',
          'totalRamStake',
          'lastProducerScheduleUpdate',
          'lastPervoteBucketFill',
          'pervoteBucket',
          'perblockBucket',
          'totalUnpaidBlocks',
          'totalActivatedStake',
          'threshActivatedStakeTime',
          'lastProducerScheduleSize',
          'totalProducerVoteWeight',
          'lastNameClose',
        ].includes(property)
      ) {
        return ({ loadEOSGlobalStats }) => loadEOSGlobalStats();
      }
      return null;
    },
  },
);
export const BlockChainStatus = new Proxy(
  {},
  {
    get: (target, property) => {
      console.log(property);
      if (property === '__isTypeOf') {
        return true;
      }
      if (['blockNumber', 'transactionNumber', 'accountNumber', 'actionNumber'].includes(property)) {
        return ({ loadBlockChainStatus }) => loadBlockChainStatus();
      }
      return null;
    },
  },
);
export default {
  status() {
    let EOSGlobalStatsLoading = false;
    let BlockChainStatusLoading = false;
    let EOSGlobalStatsData = null;
    let BlockChainStatusData = null;
    return {
      loadEOSGlobalStats: async () => {
        if (!EOSGlobalStatsLoading) {
          EOSGlobalStatsLoading = true;
          EOSGlobalStatsData = await get('/stats');
        }
        return EOSGlobalStatsData;
      },
      loadBlockChainStatus: async () => {
        if (!BlockChainStatusLoading) {
          BlockChainStatusLoading = true;
          ({
            rows: [BlockChainStatusData],
          } = await postEOS('/chain/get_table_rows', {
            json: true,
            code: 'eosio',
            scope: 'eosio',
            table: 'global',
            limit: 1,
          }));
        }
        return BlockChainStatusData;
      },
    };
  },
};
