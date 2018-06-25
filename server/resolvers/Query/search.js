// @flow
import get, { postEOS } from '../../../API.config';

export async function searchKeyWord(param: { keyWord: string, type: string }) {
  const { keyWord, type } = param;
  if (type === 'account') {
    return get(`/search?type=${type}&name=${keyWord}`);
  }
  return get(`/search?type=${type}&id=${keyWord}`);
}

export async function search(_: any, { keyWord }: { keyWord: string }) {
  const { getBlockByBlockNum, getFirstBlockIdFromBlockListResponse } = await import('./block');

  if (Number.isFinite(Number(keyWord))) {
    return { __typename: 'Block', ...(await getBlockByBlockNum(Number(keyWord))) };
  }

  // 搜索黏贴的时候可能带上了空格
  keyWord = keyWord.replace(/\s/g, '');
  if (keyWord.replace(/\s/g, '').length === 64) {
    // 长度为 64 的可能是 blockId，或者 transactionId
    // 尝试把 blockID 转换成「区块高度 blockNum」
    const blockIDSearchResults = await searchKeyWord({ keyWord, type: 'block' });
    const firstBlockInResult = getFirstBlockIdFromBlockListResponse(blockIDSearchResults);
    if (
      firstBlockInResult &&
      firstBlockInResult.blockId === keyWord &&
      typeof firstBlockInResult.blockNum === 'number'
    ) {
      return { __typename: 'Block', ...(await getBlockByBlockNum(firstBlockInResult.blockNum)) };
    }
    const { getTransactionByID } = await import('./transaction');
    return { __typename: 'Transaction', ...(await getTransactionByID(keyWord)) };
  }
  if (keyWord.length === 53) {
    // 还可能是账号公钥
    const data = await postEOS('/history/get_key_accounts', { key: keyWord });
    if (data.accountNames.length > 0) {
      const { getAccountByName } = await import('./account');
      // 目前先取这个公钥下的第一个账号，如果真的会有多个账号我们可以返回列表？
      return { __typename: 'Account', ...getAccountByName(data.accountNames[0]) };
    }
  }
  // 其他目前默认是账户名
}

export default {
  search,
};
