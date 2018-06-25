// @flow
export type { Block, Query } from '../../generated/types.flow';
export type ListResponse<T> = {
  content: T[],
  page: {
    size: number,
    totalElements: number,
    totalPages: number,
    number: number,
  },
};