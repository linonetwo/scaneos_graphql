// @flow
import { find, size as objSize, flatten, fromPairs, take, drop } from 'lodash';
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
  lastBidTime: Number(lastBidTime) / 1000,
  highBid: highBid / 10000,
  ...rest,
  id: undefined,
});
export const formatProducerInfo = (producerInfo: Object) => ({
  ...producerInfo,
  latitude: producerInfo.latitude && Number(producerInfo.latitude),
  longitude: producerInfo.longitude && Number(producerInfo.longitude),
  image: producerInfo.image && `${CMS_BASE}${producerInfo.image.data.url}`,
  logo: producerInfo.logo && `${CMS_BASE}${producerInfo.logo.data.url}`,
  nodes: producerInfo.nodes && JSON.parse(camelize(producerInfo.nodes)),
});

async function getBPDetailFromCMS(accountName: string) {
  // 看看它是不是个 bp
  const { data: blockProducersList } = await getCMS(`tables/bp/rows?filters[account][eq]=${accountName}`);
  const producerInfo = find(blockProducersList, { account: accountName });
  if (objSize(producerInfo) > 0) {
    return formatProducerInfo(producerInfo);
  }
  return null;
}

const formatEOSUnit = (eosBalanceString?: string) => (eosBalanceString ? eosBalanceString.replace(' EOS', '') : 0);
const formatEOSNumber = (eosNumber?: number | string) => (eosNumber ? Number(eosNumber) / 10000 : 0);

export const Account = {
  eosBalance: ({ coreLiquidBalance }) => formatEOSUnit(coreLiquidBalance),
  eosStaked: ({ voterInfo }) => formatEOSNumber(voterInfo?.staked),
  net: ({ netWeight, netLimit, selfDelegatedBandwidth }) => ({
    weight: formatEOSNumber(netWeight),
    selfDelegatedWeight: formatEOSUnit(selfDelegatedBandwidth?.netWeight),
    ...netLimit,
  }),
  cpu: ({ cpuWeight, cpuLimit, selfDelegatedBandwidth }) => ({
    weight: formatEOSNumber(cpuWeight),
    selfDelegatedWeight: formatEOSUnit(selfDelegatedBandwidth?.cpuWeight),
    ...cpuLimit,
  }),
  ram: ({ ramQuota, ramUsage }) => ({ max: ramQuota, used: ramUsage, available: ramQuota - ramUsage }),

  tokenBalance({ accountName }: { accountName: string }, { token = 'eosio.token' }: { token?: string }) {
    // 返回值类似 ["23.9000 EOS"]，我们把它变成 { EOS: 23.9 }
    return postEOS('/chain/get_currency_balance', { account: accountName, code: token }).then(balanceData =>
      fromPairs(balanceData.map(valueString => valueString.split(' ').reverse())),
    );
  },
  producerInfo({ accountName }: { accountName: string }, _: any, __: any, { cacheControl }: Object) {
    cacheControl.setCacheHint({ maxAge: 60 });
    return Promise.all([
      getBPList().then(bpList => find(bpList, { owner: accountName })),
      getBPDetailFromCMS(accountName),
    ]).then(([bpData, cmsData]) => bpData && cmsData && mixBPDataWithCMSData(bpData, cmsData));
  },
  async actions(
    { accountName }: { accountName: string },
    { type, page, size }: { type?: string, page?: number, size?: number },
  ) {
    const { formatActionData } = await import('./action');
    if (type) {
      return get(`/actions/${type}?account=${accountName}&page=${page || 0}&size=${size || PAGE_SIZE_DEFAULT}`).then(
        ({ content, page: { number, size: pageSize, totalPages, totalElements } }) => ({
          actions: content.map(formatActionData),
          pageInfo: { totalPages, totalElements, page: number, size: pageSize },
        }),
      );
    }
    // TODO: 现在是尝试加载所有消息，但此处应该优化成带分页的
    return Promise.all([
      get(`/actions/transfer?account=${accountName}&page=0&size=9999`),
      get(`/actions/newtoken?issuer=${accountName}&page=0&size=9999`),
    ]).then(actionsTypes => {
      const actions = flatten(actionsTypes.map(({ content }) => content))
        .map(formatActionData)
        .filter(({ transactionID }) => transactionID);
      return {
        actions,
        pageInfo: {},
      };
    });
  },
  createdAt: ({ created }) => new Date(created),
};
export default {
  accounts(_: any, { page, size }: { page?: number, size?: number }) {
    return get(`/actions?type=newaccount&page=${page || 0}&size=${size || PAGE_SIZE_DEFAULT}`).then(
      ({ content, page: { number, size: pageSize, totalPages, totalElements } }) => ({
        accounts: content.map(data => ({ accountName: data.data.name, created: data.createdAt })),
        pageInfo: { totalPages, totalElements, page: number, size: pageSize },
      }),
    );
  },
  account(_: any, { name }: { name: string }) {
    return postEOS('/chain/get_account', { account_name: name }).then(({ error, ...rest }) => (error ? null : rest));
  },
  async producers(
    root: any,
    { page = 0, size = PAGE_SIZE_DEFAULT }: { page?: number, size?: number },
    context: any,
    { cacheControl }: Object,
  ) {
    cacheControl.setCacheHint({ maxAge: 60 });

    const bpListPromise = getBPList().then(bpList =>
      bpList.sort((a, b) => Number(b.totalVotes) - Number(a.totalVotes)),
    );
    const cmsListPromise = getCMS('tables/bp/rows').then(({ data }) => data);

    const producerList = await Promise.all([bpListPromise, cmsListPromise]).then(([bpList, cmsList]) =>
      bpList.map((bpData, index) => {
        const cmsData = find(cmsList, { account: bpData.owner }) || {};
        return { rank: index + 1, ...mixBPDataWithCMSData(bpData, cmsData) };
      }),
    );
    const totalElements = producerList.length
    const totalPages = Math.ceil(totalElements / size);
    return { producers: take(drop(producerList, page * size), size), pageInfo: { totalElements, totalPages, page, size } };
  },

  nameAuctions(_: any, { page, size }: { page?: number, size?: number }) {
    return get(`/accounts/biddingaccounts?page=${page || 0}&size=${size || PAGE_SIZE_DEFAULT}`).then(
      ({ content, page: { number, size: pageSize, totalPages, totalElements } }) => ({
        nameAuctions: content.map(formatAuctionData),
        pageInfo: { totalPages, totalElements, page: number, size: pageSize },
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
