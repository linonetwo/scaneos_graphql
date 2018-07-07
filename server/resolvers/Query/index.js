import searches from './search';
import aggregation from './aggregation';
import block from './block';
import transaction from './transaction';
import action from './action';
import token from './token';
import account from './account';
import price from './price';
import article from './article';

export default {
  ...searches,
  ...aggregation,
  ...block,
  ...transaction,
  ...action,
  ...token,
  ...account,
  ...price,
  ...article,
};
