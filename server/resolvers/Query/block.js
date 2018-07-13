// @flow
import { take, drop, head } from 'lodash';
import get, { PAGE_SIZE_DEFAULT } from '../../../API.config';

export function getFirstBlockIdFromBlockListResponse(data: Object) {
  if (data?.content?.length >= 1 && typeof data.content[0].blockNum === 'number') {
    return { blockNum: data.content[0].blockNum, blockId: data.content[0].blockId };
  }
  return null;
}

const formatBlockData = ({ blockId, prevBlockId, producerAccountId, transactionId, ...rest }) => ({
  blockID: blockId,
  prevBlockID: prevBlockId,
  producerAccountID: producerAccountId,
  transactionID: transactionId,
  ...rest,
});

export function getBlockByBlockNum(blockNum: number) {
  return get(`/blocks?block_num=${blockNum}`).then(formatBlockData);
}
export async function getBlockByBlockID(blockID: string) {
  const { searchKeyWord } = await import('./search');
  return searchKeyWord({ keyWord: blockID, type: 'block' });
}

export const Block = {
  transactions: {
    description: async () => '交易列表 | Transactions',
    resolve: async (
      { transactions = [] },
      { page = 0, size = PAGE_SIZE_DEFAULT }: { page?: number, size?: number },
    ) => {
      const totalElements = transactions.length;
      const totalPages = Math.ceil(totalElements / size);
      const pagedTransactions = take(drop(transactions, page * size), size);
      if (typeof head(transactions) === 'string') {
        const { getTransactionByID } = await import('./transaction');
        return {
          transactions: pagedTransactions.map(getTransactionByID),
          pageInfo: { totalPages, totalElements, page, size },
        };
      }
      return {
        transactions: pagedTransactions,
        pageInfo: { totalPages, totalElements, page, size },
      };
    },
  },
  transactionIDs: ({ transactions = [] }) => {
    if (typeof head(transactions) === 'string') return transactions;
    if (typeof head(transactions) === 'object') return transactions.map(({ transactionID }) => transactionID);
    return [];
  },
  transactionNum: ({ transactions: transactionIDs = [] }) => transactionIDs.length,
};
export default {
  blocks(_: any, { page, size }: { page?: number, size?: number }) {
    return get(`/blocks?page=${page || 0}&size=${size || PAGE_SIZE_DEFAULT}`).then(
      ({ content, page: { number, size: pageSize, totalPages, totalElements } }) => ({
        blocks: content.map(formatBlockData),
        pageInfo: { totalPages, totalElements, page: number, size: pageSize },
      }),
    );
  },
  block(_: any, { blockNum, id, blockNumOrID }: { blockNum?: number, id?: string, blockNumOrID?: number | string }) {
    if (typeof blockNum === 'number') return getBlockByBlockNum(blockNum).then(formatBlockData);
    if (typeof blockNumOrID === 'number' || Number.isFinite(Number(blockNumOrID)))
      return get(`/blocks?block_num=${String(blockNumOrID)}`).then(formatBlockData);
    // 尝试把 blockID 转换成「区块高度 blockNum」
    return getBlockByBlockID(id || String(blockNumOrID))
      .then(result => getBlockByBlockNum(result.blockNum))
      .then(formatBlockData);
  },
};
