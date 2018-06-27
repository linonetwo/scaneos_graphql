import searches from './search';
import block from './block';
import action from './action';
import account from './account';

export default {
  ...searches,
  ...block,
  ...action,
  ...account,
};
