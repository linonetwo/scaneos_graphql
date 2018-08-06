// @flow
import { size as objSize } from 'lodash';
import utf8 from 'utf8';
import qs from 'query-string';
import { compareDesc } from 'date-fns';
import get, { PAGE_SIZE_DEFAULT } from '../../../API.config';

export const formatActionData = ({ actionId, transactionId, data, ...rest }) => ({
  actionID: actionId,
  transactionID: transactionId,
  data: objSize(data) > 0 ? JSON.parse(utf8.decode(JSON.stringify(data))) : {},
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
  actions(_: any, { filterBy, page = 0, size = PAGE_SIZE_DEFAULT }: { filterBy?: { match: string }, page?: number, size?: number }) {
    // search specific text
    if (filterBy.match) {
      const query = qs.stringify({
        page,
        size,
        match: filterBy.match,
        matchasphrase: false,
      });
      return get(`/actions/text?${query}`).then(
        ({ content, page: { number, size: pageSize, totalPages, totalElements } }) => ({
          actions: content.map(formatActionData).sort((a, b) => compareDesc(a.createdAt, b.createdAt)),
          pageInfo: {
            totalPages,
            totalElements,
            page: number,
            size: pageSize,
            filterBy,
          },
        }),
      );
    }
    // return all kinds of actions
    const query = qs.stringify({
      page,
      size,
    });
    return get(`/actions?${query}`).then(
      ({ content, page: { number, size: pageSize, totalPages, totalElements } }) => ({
        actions: content.map(formatActionData),
        pageInfo: { totalPages, totalElements, page: number, size: pageSize },
      }),
    );
  },
  action(_: any, { id }: { id: string }) {
    return getActionByID(id);
  },
};
