// @flow
import { find, size } from 'lodash';
import camelize from 'camelize';
import get, { postEOS, getCMS, CMS_BASE } from '../../../API.config';

export async function getAccountByName(accountName: string) {
  const [data, balanceData] = await Promise.all([
    postEOS('/chain/get_account', { account_name: accountName }),
    postEOS('/chain/get_currency_balance', { account: accountName, code: 'eosio.token' }),
  ]);

  if (!data) throw new Error('No data.');

  this.initAccountData({ ...data, tokenBalance: balanceData.join(', ') });
}

async function getBPDetailFromCMS(accountName: string) {
  // 看看它是不是个 bp
  const { data: blockProducersList } = await getCMS(`tables/bp/rows?filters[account][eq]=${accountName}`);
  const producerInfo = find(blockProducersList, { account: accountName });
  if (size(producerInfo) > 0) {
    const blockProducerInfo = {
      ...producerInfo,
      latitude: producerInfo.latitude && Number(producerInfo.latitude),
      longitude: producerInfo.longitude && Number(producerInfo.longitude),
      image: producerInfo.image && `${CMS_BASE}${producerInfo.image.data.url}`,
      logo: producerInfo.logo && `${CMS_BASE}${producerInfo.logo.data.url}`,
      nodes: producerInfo.nodes && JSON.parse(camelize(producerInfo.nodes)),
    };
    return blockProducerInfo;
  }
  return null;
}


export default {
  account(_: any, { name }: { name: string }) {
    return postEOS('/chain/get_account', { account_name: name });
  },
};
export const Account = {
  tokenBalance({ name }: { name: string }) {
    return postEOS('/chain/get_currency_balance', { account: name, code: 'eosio.token' }).then(balanceData =>
      balanceData.join(', '),
    );
  },
  bp({ name }: { name: string }) {
    return getBPDetailFromCMS(name);
  },
};
