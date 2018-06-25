// @flow
import get, { postEOS } from '../../../API.config';

export async function searchKeyWord(param: { keyWord: string, type: string }) {
  const { keyWord, type } = param;
  if (type === 'account') {
    const data = await get(`/search?type=${type}&name=${keyWord}`);
    return data;
  }
  const data = await get(`/search?type=${type}&id=${keyWord}`);
  return data;
}

export async function search() {
  const {
    store: { getState, dispatch },
  } = await import('./');
  const { history } = await import('./');
  let {
    search: { keyWord },
  } = await getState();

  this.toggleLoading();
  try {
    if (Number.isFinite(Number(keyWord))) {
      return history.push(`/block/${keyWord}`);
    }

    // 搜索黏贴的时候可能带上了空格
    keyWord = keyWord.replace(/\s/g, '');
    if (keyWord.replace(/\s/g, '').length === 64) {
      // 长度为 64 的可能是 blockId，或者 transactionId
      const data = await this.searchKeyWord({ keyWord, type: 'block' }).then(res =>
        dispatch.block.getFirstBlockIdFromBlockListResponse(res),
      );
      if (data && data.blockId === keyWord && typeof data.blockNum === 'number') {
        return history.push(`/block/${data.blockNum}`);
      }
      return history.push(`/transaction/${keyWord}`);
    }
    if (keyWord.length === 53) {
      // 还可能是账号公钥
      const data: { accountNames: string[] } = await postEOS('/history/get_key_accounts', { key: keyWord });
      if (data.accountNames.length > 0) {
        // 目前先取这个公钥下的第一个账号，如果真的会有多个账号我们可以返回列表？
        return history.push(`/account/${data.accountNames[0]}`);
      }
    }
    // 其他目前默认是账户名
    // const data = await this.searchKeyWord(keyWord, 'account');
    return history.push(`/account/${keyWord}`);
  } finally {
    this.toggleLoading();
  }
}
