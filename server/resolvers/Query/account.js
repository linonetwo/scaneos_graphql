// @flow
import { find, size, flatten, values, intersection } from 'lodash';
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
const getBPList = () =>
  postEOS('/chain/get_table_rows', {
    json: true,
    code: 'eosio',
    scope: 'eosio',
    table: 'producers',
    limit: 100000,
  }).then(({ rows }) => rows);
const mixBPDataWithCMSData = (bpData, cmsData) => {
  const { url, producerKey, ...rest } = bpData;
  return { account: rest.owner, homepage: url, ...rest, ...cmsData, key: cmsData.key || producerKey };
};

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
  async producers(root: any, args: any, context: any, { cacheControl }: Object) {
    cacheControl.setCacheHint({ maxAge: 60 });

    const bpListPromise = getBPList().then(bpList =>
      bpList.sort((a, b) => Number(b.totalVotes) - Number(a.totalVotes)),
    );
    const cmsListPromise = getCMS('tables/bp/rows').then(({ data }) => data);

    const producerList = await Promise.all([bpListPromise, cmsListPromise]).then(([bpList, cmsList]) =>
      bpList.map(bpData => {
        const cmsData = find(cmsList, { account: bpData.owner }) || {};
        return mixBPDataWithCMSData(bpData, cmsData);
      }),
    );
    return producerList;
  },
};
export const Account = {
  tokenBalance({ accountName }: { accountName: string }) {
    return postEOS('/chain/get_currency_balance', { account: accountName, code: 'eosio.token' }).then(balanceData =>
      balanceData.join(', '),
    );
  },
  producerInfo({ accountName }: { accountName: string }, _: any, __: any, { cacheControl }: Object) {
    cacheControl.setCacheHint({ maxAge: 60 });
    return Promise.all([
      getBPList().then(bpList => find(bpList, { owner: accountName })),
      getBPDetailFromCMS(accountName),
    ]).then(([bpData, cmsData]) => mixBPDataWithCMSData(bpData, cmsData));
  },
};
