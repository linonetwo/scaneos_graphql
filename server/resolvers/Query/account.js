// @flow
import { find, size as objSize } from 'lodash';
import camelize from 'camelize';
import get, { postEOS, getCMS, CMS_BASE, PAGE_SIZE_DEFAULT } from '../../../API.config';

export async function getAccountByName(accountName: string) {
  const [data, balanceData] = await Promise.all([
    postEOS('/chain/get_account', { account_name: accountName }),
    postEOS('/chain/get_currency_balance', { account: accountName, code: 'eosio.token' }),
  ]);

  if (!data) throw new Error('No data.');

  return { ...data, tokenBalance: balanceData.join(', ') };
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
  return { account: rest.owner, homepage: url, ...rest, ...cmsData, key: cmsData?.key || producerKey };
};

const formatAuctionData = ({ lastBidTime, highBid, ...rest }) => ({
  lastBidTime: Number(lastBidTime) / 1000 / 1000,
  highBid: highBid / 10000,
  ...rest,
  id: undefined,
});

async function getBPDetailFromCMS(accountName: string) {
  // 看看它是不是个 bp
  const { data: blockProducersList } = await getCMS(`tables/bp/rows?filters[account][eq]=${accountName}`);
  const producerInfo = find(blockProducersList, { account: accountName });
  if (objSize(producerInfo) > 0) {
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
  accounts(_: any, { page, size }: { page?: number, size?: number }) {
    return get(`/actions?type=newaccount&page=${page || 0}&size=${size || PAGE_SIZE_DEFAULT}`).then(
      ({ content, page: { totalPages } }) => ({
        accounts: content.map(data => ({ accountName: data.data.name, createdAt: data.createdAt })),
        pageInfo: { totalPages },
      }),
    );
  },
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

  nameAuctions(_: any, { page, size }: { page?: number, size?: number }) {
    return get(`/accounts/biddingaccounts?page=${page || 0}&size=${size || PAGE_SIZE_DEFAULT}`).then(
      ({ content, page: { totalPages } }) => ({
        nameAuctions: content.map(formatAuctionData),
        pageInfo: { totalPages },
      }),
    );
  },
  nameAuction(_: any, { name }: { name: string }) {
    return get(`/accounts/biddingaccount?name=${name}`)
      .then(formatAuctionData)
      .catch(() =>
        postEOS('/chain/get_table_rows', {
          json: true,
          scope: 'eosio',
          code: 'eosio',
          table: 'namebids',
          lower_bound: name,
          limit: 1,
        }).then(({ rows }) => {
          let searchResult = {};
          if (rows && rows.length > 0) {
            searchResult = formatAuctionData(rows[0]);
          }
          return {
            notInAuction: true,
            ...searchResult,
            newName: searchResult.newname,
          };
        }),
      );
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
