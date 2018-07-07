// @flow
import get, { PAGE_SIZE_DEFAULT } from '../../../API.config';

export default {
  tokens(_: any, { page, size }: { page?: number, size?: number }) {
    return get(`/actions?requiredata=true&type=create&page=${page || 0}&size=${size || PAGE_SIZE_DEFAULT}`).then(
      ({ content, page: { number, size: pageSize, totalPages, totalElements } }) => ({
        tokens: content.map(({ createdAt, data }) => ({ createdAt, ...data })),
        pageInfo: { totalPages, totalElements, page: number, size: pageSize },
      }),
    );
  },
};
