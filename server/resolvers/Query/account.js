// @flow
import { find, size as objSize, fromPairs, take, drop, mapValues, last } from 'lodash';
import camelize from 'camelize';
import { compareDesc } from 'date-fns';
import qs from 'query-string';
import get, { postEOS, getCMS, CMS_BASE, PAGE_SIZE_DEFAULT } from '../../../API.config';
import { formatActionData } from './action';

function getAccountDetailFromEOS(name: string) {
  return postEOS('/chain/get_account', { account_name: name }).then(({ error, ...rest }) => (error ? null : rest));
}
export async function getAccountByName(accountName: string) {
  const [data, balanceData] = await Promise.all([
    getAccountDetailFromEOS(accountName),
    postEOS('/chain/get_currency_balance', { account: accountName, code: 'eosio.token' }),
  ]);

  if (!data) throw new Error('No data.');

  // 查无此人就返回 null
  if (data.code === 500) return null;

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
  nodes: producerInfo.nodes ? JSON.parse(camelize(producerInfo.nodes)) : [],
});
function locationBelongsToArea(location: string, area: string) {
  if (area === 'Asia') {
    if (location.indexOf('Asia') !== -1) return true;
    if (location.indexOf('China') !== -1) return true;
    if (location.indexOf('Hong Kong') !== -1) return true;
    if (location.indexOf('Beijing') !== -1) return true;
    if (location.indexOf('Shanghai') !== -1) return true;
    if (location.indexOf('Korea') !== -1) return true;
    if (location.indexOf('Singapore') !== -1) return true;
    if (location.indexOf('Japan') !== -1) return true;
    if (location.indexOf('Thailand') !== -1) return true;
    if (location.indexOf('India') !== -1) return true;
    if (location.indexOf('Bangkok') !== -1) return true;
  }
  if (area === 'America') {
    if (location.indexOf('America') !== -1) return true;
    if (location.indexOf('USA') !== -1) return true;
    if (location.indexOf('Argentina') !== -1) return true;
    if (location.indexOf('Canada') !== -1) return true;
    if (location.indexOf('Virgin') !== -1) return true;
    if (location.indexOf('BVI') !== -1) return true;
    if (location.indexOf('Wyoming') !== -1) return true;
    if (location.indexOf('California') !== -1) return true;
    if (location.indexOf('Detroit') !== -1) return true;
    if (location.indexOf('Dominican') !== -1) return true;
    if (location.indexOf('Seattle') !== -1) return true;
    if (location.indexOf('Anguilla') !== -1) return true;
    if (location.indexOf('Mexico') !== -1) return true;
    if (location.indexOf('Brazil') !== -1) return true;
    if (location.indexOf('Puerto') !== -1) return true;
  }
  if (area === 'Europe') {
    if (location.indexOf('Europe') !== -1) return true;
    if (location.indexOf('England') !== -1) return true;
    if (location.indexOf('Netherlands') !== -1) return true;
    if (location.indexOf('Poland') !== -1) return true;
    if (location.indexOf('Amsterdam') !== -1) return true;
    if (location.indexOf('EU') !== -1) return true;
    if (location.indexOf('Ukraine') !== -1) return true;
    if (location.indexOf('Sweden') !== -1) return true;
    if (location.indexOf('Iceland') !== -1) return true;
    if (location.indexOf('Ireland') !== -1) return true;
    if (location.indexOf('Norway') !== -1) return true;
  }
  if (area === 'Oceania') {
    if (location.indexOf('Oceania') !== -1) return true;
    if (location.indexOf('Australia') !== -1) return true;
    if (location.indexOf('Zealand') !== -1) return true;
  }
  if (area === 'Africa') {
    if (location.indexOf('Africa') !== -1) return true;
    if (location.indexOf('Kenya') !== -1) return true;
  }
  return false;
}

async function getBPDetailFromCMS(accountName: string) {
  // 看看它是不是个 bp
  const { data: blockProducersList } = await getCMS(`tables/bp/rows?filters[account][eq]=${accountName}`);
  const producerInfo = find(blockProducersList, { account: accountName });
  if (objSize(producerInfo) > 0) {
    return formatProducerInfo(producerInfo);
  }
  return null;
}

const formatEOSUnit = (eosBalanceString?: string) =>
  eosBalanceString ? Math.max(Number(eosBalanceString.replace(' EOS', '')), 0) : 0;
const formatEOSNumber = (eosNumber?: number | string) => (eosNumber ? Math.max(Number(eosNumber), 0) / 10000 : 0);

export const Account = {
  eosBalance: ({ accountName, eosBalance, coreLiquidBalance }) => {
    if (typeof eosBalance === 'number') return eosBalance;
    if (typeof coreLiquidBalance === 'string') return formatEOSUnit(coreLiquidBalance);
    return postEOS('/chain/get_currency_balance', { account: accountName, code: 'eosio.token' }).then(balanceData => {
      const eosBalanceData = balanceData.filter(str => str.endsWith(' EOS'));
      if (eosBalanceData.length > 0) {
        return formatEOSUnit(eosBalanceData[0]);
      }
      return 0;
    });
  },
  eosStaked: ({ eosStaked, voterInfo }) =>
    typeof eosStaked === 'number' ? eosStaked : formatEOSNumber(voterInfo?.staked),
  net: ({ netWeight, netLimit, selfDelegatedBandwidth, refundRequest }) => ({
    weight: formatEOSNumber(netWeight),
    selfDelegatedWeight: formatEOSUnit(selfDelegatedBandwidth?.netWeight),
    refund: formatEOSUnit(refundRequest?.netAmount),
    ...mapValues(netLimit, value => Math.max(value, 0)),
  }),
  cpu: ({ cpuWeight, cpuLimit, selfDelegatedBandwidth, refundRequest }) => ({
    weight: formatEOSNumber(cpuWeight),
    selfDelegatedWeight: formatEOSUnit(selfDelegatedBandwidth?.cpuWeight),
    refund: formatEOSUnit(refundRequest?.cpuAmount),
    ...mapValues(cpuLimit, value => Math.max(value, 0)),
  }),
  ram: ({ ramQuota, ramUsage }) => ({
    max: Math.max(Number(ramQuota), 0),
    used: Math.max(Number(ramUsage), 0),
    available: Math.max(Number(ramQuota - ramUsage), 0),
  }),

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
  actions(
    { accountName }: { accountName: string },
    { filterBy, page, size }: { filterBy?: { name: string[] }, page?: number, size?: number },
  ) {
    const matchList = [
      'transfer',
      'setabi',
      'newaccount',
      'updateauth',
      'buyram',
      'buyrambytes',
      'sellram',
      'delegatebw',
      'undelegatebw',
      'refund',
      'regproducer',
      'bidname',
      'voteproducer',
      'claimrewards',
      'create',
      'issue',
    ];
    const nomatch = filterBy?.name?.length > 0 ? matchList.filter(filter => !filterBy.name.includes(filter)) : [];
    const query = qs.stringify({
      page,
      size,
      match: accountName,
      nomatch,
      matchasphrase: false,
      nomatchasphrase: false,
    });
    return get(`/actions/text?${query}`).then(
      ({ content, page: { number, size: pageSize, totalPages, totalElements } }) => ({
        actions: content.map(formatActionData).sort((a, b) => compareDesc(a.createdAt, b.createdAt)),
        pageInfo: {
          totalPages,
          totalElements,
          page: number,
          size: pageSize,
          filterBy: filterBy?.name ? filterBy : { name: matchList },
          filters: { name: matchList },
        },
      }),
    );
  },
  createdAt: ({ created }) => new Date(created),
};

export const AccountTrend = {
  async ramTopAccountsDetail({ ramTopAccounts }: { ramTopAccounts?: string[] }) {
    if (!ramTopAccounts) return null;
    return ramTopAccounts.map(name => getAccountDetailFromEOS(name));
  },
};
export default {
  accounts(
    _: any,
    { sortBy = 'eos', page, size }: { sortBy?: 'eos' | 'ram' | 'cpu' | 'net' | 'staked', page?: number, size?: number },
  ) {
    return get(`/accounts?sortby=${sortBy}&page=${page || 0}&size=${size || PAGE_SIZE_DEFAULT}`).then(
      ({ content, page: { number, size: pageSize, totalPages, totalElements } }) => ({
        accounts: content.map(({ name, stakedBalance, eosBalance, ...rest }) => ({
          accountName: name,
          eosStaked: Number(stakedBalance),
          eosBalance: Number(eosBalance),
          ...rest,
        })),
        pageInfo: { totalPages, totalElements, page: number, size: pageSize, sortBy },
      }),
    );
  },
  account(_: any, { name }: { name: string }) {
    return getAccountDetailFromEOS(name);
  },
  async producers(
    root: any,
    {
      page = 0,
      size = PAGE_SIZE_DEFAULT,
      filterBy,
    }: { page?: number, size?: number, filterBy?: { location?: string[] } },
    { dataSources },
    { cacheControl }: Object,
  ) {
    cacheControl.setCacheHint({ maxAge: 60 });

    const bpListPromise = getBPList().then(bpList =>
      bpList.sort((a, b) => Number(b.totalVotes) - Number(a.totalVotes)),
    );
    const cmsListPromise = dataSources.cms.getBPDescriptionList();

    const producerList = await Promise.all([bpListPromise, cmsListPromise]).then(([bpList, cmsList]) =>
      bpList.map((bpData, index) => {
        const cmsData = find(cmsList, { account: bpData.owner }) || {};
        return { rank: index + 1, ...mixBPDataWithCMSData(bpData, cmsData) };
      }),
    );
    // filter
    let filteredProducerList = producerList;
    if (filterBy?.location?.length > 0) {
      const { location: locationFilter } = filterBy;
      filteredProducerList = producerList.filter(
        ({ location }) =>
          (location && locationFilter.filter(name => String(location).indexOf(name) !== -1).length > 0) ||
          locationFilter.some(name => locationBelongsToArea(String(location), name)),
      );
    }
    // pagination
    const totalElements = filteredProducerList.length;
    const totalPages = Math.ceil(totalElements / size);
    return {
      producers: take(drop(filteredProducerList, page * size), size),
      pageInfo: { totalElements, totalPages, page, size, filterBy },
    };
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
  async accountTrend(
    _: any,
    { fields = 'eos', range = 0, sampleRate = 1 }: { fields?: string, range?: number, sampleRate?: number },
  ) {
    const data = await get(`/accounts/trend?view=${fields}&range=${range || 1}`);
    // range 意为取过去几天的数据
    const rangedData = range > 0 ? data : [last(data)];
    // sample 是为了减小数据量，每隔几个数据才取一次
    const sampleInterval = Math.min(Math.max(Math.floor(1 / sampleRate), 1), rangedData.length);
    return rangedData.filter((__, index) => index % sampleInterval === 0);
  },
};
