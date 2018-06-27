// @flow
import get, { PAGE_SIZE_DEFAULT } from '../../../API.config';
import { searchKeyWord } from './search';

export function getFirstBlockIdFromBlockListResponse(data: Object) {
  if (data?.content?.length >= 1 && typeof data.content[0].blockNum === 'number') {
    return { blockNum: data.content[0].blockNum, blockId: data.content[0].blockId };
  }
  return null;
}

const formatBlockData = ({ blockId, prevBlockId, producerAccountId, ...rest }) => ({
  blockID: blockId,
  prevBlockID: prevBlockId,
  producerAccountID: producerAccountId,
  ...rest,
});

export function getBlockByBlockNum(blockNum: number) {
  return get(`/blocks?block_num=${blockNum}`).then(formatBlockData);
}

export const Block = {
  blockNum: {
    description: async () => '区块高度',
    resolve: a => a,
  },
};
export default {
  blocks(_: any, { page, size }: { page?: number, size?: number }) {
    return get(`/blocks?page=${page || 0}&size=${size || PAGE_SIZE_DEFAULT}`).then(
      ({ content, page: { totalPages } }) => ({
        blocks: content.map(formatBlockData),
        pageInfo: { totalPages },
      }),
    );
  },
  block(_: any, { blockNum, id, blockNumOrID }: { blockNum?: number, id?: string, blockNumOrID?: number | string }) {
    if (typeof blockNum === 'number') return getBlockByBlockNum(blockNum);
    if (typeof blockNumOrID === 'number' || Number.isFinite(Number(blockNumOrID)))
      return get(`/blocks?block_num=${String(blockNumOrID)}`).then(formatBlockData);
    // 尝试把 blockID 转换成「区块高度 blockNum」
    return searchKeyWord({ keyWord: id || String(blockNumOrID), type: 'block' })
      .then(getFirstBlockIdFromBlockListResponse)
      .then(firstBlockInResult => {
        if (firstBlockInResult) {
          return get(`/blocks?block_num=${firstBlockInResult.blockNum}`).then(formatBlockData);
        }
        return Promise.reject(
          new Error(
            `${String(blockNumOrID)} is not a block Number nor a block ID.\nAnd blockNum === ${String(
              blockNum,
            )}\nid === ${String(id)}`,
          ),
        );
      });
  },
};
