import searches from './search';
import block from './block';
import transaction from './transaction';
import action from './action';
import account from './account';

export default {
  ...searches,
  ...block,
  ...transaction,
  ...action,
  ...account,
};
