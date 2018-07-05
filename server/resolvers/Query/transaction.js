// @flow
import { take, drop } from 'lodash';
import get, { PAGE_SIZE_DEFAULT } from '../../../API.config';
import { getActionByID } from './action';

const formatTransactionData = ({ blockId, transactionId, ...rest }) => ({
  blockID: blockId,
  transactionID: transactionId,
  ...rest,
});

export function getTransactionByID(id: string) {
  return get(`/transactions?transaction_id=${id}`).then(formatTransactionData);
}

export const Transaction = {
  actions: {
    description: async () => '消息列表 | Actions',
    resolve: async (
      { actions: actionsOrIDs },
      { page = 0, size = PAGE_SIZE_DEFAULT }: { page?: number, size?: number },
    ) => {
      let actions = [];
      if (actionsOrIDs && actionsOrIDs.length > 0 && typeof actionsOrIDs[0] === 'object') {
        actions = actionsOrIDs.map(({ account, ...rest }) => ({ handlerAccountName: account, ...rest }));
      } else {
        actions = actionsOrIDs ? await actionsOrIDs.map(getActionByID) : [];
      }
      const totalPages = Math.ceil(actions.length / size);
      return { actions: take(drop(actions, page * size), size), pageInfo: { totalPages } };
    },
  },
  actionNum: ({ actions: actionsOrIDs }) => (actionsOrIDs ? actionsOrIDs.length : 0),
  async block({ blockID }: { blockID: string }) {
    const { getBlockByBlockID } = await import('./block');
    return getBlockByBlockID(blockID);
  },
};
export default {
  transactions(_: any, { page, size }: { page?: number, size?: number }) {
    return get(`/transactions?page=${page || 0}&size=${size || PAGE_SIZE_DEFAULT}`).then(
      ({ content, page: { number, size: pageSize, totalPages, totalElements } }) => ({
        transactions: content.map(formatTransactionData),
        pageInfo: { totalPages, totalElements, page: number, size: pageSize },
      }),
    );
  },
  transaction(_: any, { id }: { id: string }) {
    return getTransactionByID(id);
  },
};
