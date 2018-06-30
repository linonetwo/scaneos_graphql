// @flow
import { size as objSize } from 'lodash';
import { getCMS, PAGE_SIZE_DEFAULT } from '../../../API.config';

export const News = {
  async producerInfo({ bp: bpIDInDB }: { bp?: number }) {
    const { data } = await getCMS(`tables/bp/rows/${bpIDInDB}`);
    if (objSize(data) > 0) {
      const { formatProducerInfo } = await import('./account');
      return formatProducerInfo(data);
    }
  },
};
export default {
  async news(_: any, { page, size }: { page?: number, size?: number }) {
    let offset = 0;
    let limit = PAGE_SIZE_DEFAULT;
    if (typeof size === 'number') {
      limit = size;
    }
    if (typeof page === 'number') {
      offset = page * limit;
    }
    const {
      data: news,
      meta: { Published },
    } = await getCMS(`tables/bp_news/rows?depth=0&offset=${offset}&limit=${limit}`);
    return {
      news,
      pageInfo: { totalPages: Math.ceil(Published / limit) },
    };
  },
};
