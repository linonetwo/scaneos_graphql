import GraphQLJSON from 'graphql-type-json';
import DateTime from './Scalars/DateTime';

import Query from './Query';
import { SearchResult } from './Query/search';
import { Block } from './Query/block';
import { Transaction } from './Query/transaction';
import { Action } from './Query/action';
import { Account } from './Query/account';
import { GlobalStatus } from './Query/aggregation';
import { Article, DictionaryEntry } from './Query/article';
// import Mutation from './Mutation';

export default {
  JSON: GraphQLJSON,
  DateTime,

  Query,
  SearchResult,
  Block,
  Transaction,
  Action,
  Account,
  GlobalStatus,
  Article,
  DictionaryEntry,
  // Mutation,
};
