// @flow
import get, { PAGE_SIZE_DEFAULT } from '../../../API.config';

export const formatActionData = ({ actionId, transactionId, data, ...rest }) => ({
  actionID: actionId,
  transactionID: transactionId,
  data: JSON.stringify(data, null, '  '),
  ...rest,
});
export function getActionByID(id: string) {
  return get(`/actions?id=${id}`).then(formatActionData);
}

export const Action = {
  async transaction({ transactionID }) {
    const { getTransactionByID } = await import('./transaction');
    return getTransactionByID(transactionID);
  },
};
export default {
  actions(_: any, { page, size }: { page?: number, size?: number }) {
    return get(`/actions?page=${page || 0}&size=${size || PAGE_SIZE_DEFAULT}`).then(
      ({ content, page: { totalPages } }) => ({
        actions: content.map(formatActionData),
        pageInfo: { totalPages },
      }),
    );
  },
  action(_: any, { id }: { id: string }) {
    return getActionByID(id);
  },
};
