// @flow
import get from '../../../API.config';
import { searchKeyWord } from './search';

import type { ListResponse, Block } from './types.flow';

export function getFirstBlockIdFromBlockListResponse(data: Object) {
  if (data?.content?.length >= 1 && typeof data.content[0].blockNum === 'number') {
    return { blockNum: data.content[0].blockNum, blockId: data.content[0].blockId };
  }
  return null;
}
export function getBlockByBlockNum(blockNum: number) {
  return get(`/blocks?block_num=${blockNum}`);
}

async function block(
  _: any,
  { blockNum, id, blockNumOrID }: { blockNum?: number, id?: string, blockNumOrID: number | string },
) {
  if (typeof blockNum === 'number') return getBlockByBlockNum(blockNum);
  if (typeof blockNumOrID === 'number' || Number.isFinite(Number(blockNumOrID)))
    return get(`/blocks?block_num=${blockNumOrID}`);
  // 尝试把 blockID 转换成「区块高度 blockNum」
  const blockIDSearchResults = await searchKeyWord({ keyWord: id || blockNumOrID, type: 'block' });

  const firstBlockInResult = getFirstBlockIdFromBlockListResponse(blockIDSearchResults);
  if (firstBlockInResult) {
    return get(`/blocks?block_num=${firstBlockInResult.blockNum}`);
  }

  throw new Error(
    `${blockNumOrID} is not a block Number nor a block ID.\nAnd blockNum === ${String(blockNum)}\nid === ${String(id)}`,
  );
}

async function blocks(_: any, { page, pageSize }: { page?: number, pageSize?: number }) {
  const gotoPage = page ? page - 1 : 0;
  const data: ListResponse<Block> = await get(`/blocks?page=${gotoPage}&size=${pageSize || 60}`);
  const {
    content,
    page: { totalElements },
  } = data;
  return content;
  // this.setPage({ current: gotoPage || 0, total: totalElements });
}

export default {
  block,
  blocks,
};
