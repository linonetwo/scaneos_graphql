import searches from './search';
import aggregation from './aggregation';
import block from './block';
import transaction from './transaction';
import action from './action';
import account from './account';
import price from './price';

export default {
  ...searches,
  ...aggregation,
  ...block,
  ...transaction,
  ...action,
  ...account,
  ...price,
};
