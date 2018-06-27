import Query from './Query';
import { SearchResult } from './Query/search';
import { BlockChainStatus, EOSGlobalStats } from './Query/aggregation';
import { Block } from './Query/block';
import { Transaction } from './Query/transaction';
import { Account } from './Query/account';
// import Mutation from './Mutation';

export default {
  Query,
  SearchResult,
  BlockChainStatus,
  EOSGlobalStats,
  Account,
  Block,
  Transaction,
  // Mutation,
};
