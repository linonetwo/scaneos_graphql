// @flow
import { size as objSize } from 'lodash';
import { getCMS, PAGE_SIZE_DEFAULT } from '../../../API.config';

export function formatWiki(wiki) {
  return {
    field: wiki.field,
    title: wiki.en,
    titleZh: wiki.zh,
    content: wiki.enMeaning,
    contentZh: wiki.zhMeaning,
  };
}
export const Article = {
  async producerInfo({ bp: bpIDInDB }: { bp?: number }) {
    const { data } = await getCMS(`tables/bp/rows/${bpIDInDB}`);
    if (objSize(data) > 0) {
      const { formatProducerInfo } = await import('./account');
      return formatProducerInfo(data);
    }
  },
};
export default {
  async articles(_: any, { page, size }: { page?: number, size?: number }) {
    let offset = 0;
    let limit = PAGE_SIZE_DEFAULT;
    if (typeof size === 'number') {
      limit = size;
    }
    if (typeof page === 'number') {
      offset = page * limit;
    }
    const {
      data: articles,
      meta: { Published },
    } = await getCMS(`tables/bp_news/rows?depth=0&offset=${offset}&limit=${limit}`);
    return {
      articles,
      pageInfo: { totalPages: Math.ceil(Published / limit) },
    };
  },
  async wiki(_: any, { field }: { field: string }) {
    const {
      data: [wiki],
    } = await getCMS(`tables/translation/rows?filters[field][eq]=${field}`);
    return formatWiki(wiki);
  },
  async wikis(_: any, { keyWord, page, size }: { keyWord?: string, page?: number, size?: number }) {
    let offset = 0;
    let limit = PAGE_SIZE_DEFAULT;
    if (typeof size === 'number') {
      limit = size;
    }
    if (typeof page === 'number') {
      offset = page * limit;
    }
    const searchQuery = keyWord
      ? `&filters[content][contains]=${keyWord}&filters[title][logical]=or&filters[title][contains]=${keyWord}`
      : '';
    const {
      data,
      meta: { Published },
    } = await getCMS(`tables/translation/rows?columns=field,zh,en&offset=${offset}&limit=${limit}${searchQuery}`);

    return {
      wikis: data.map(formatWiki),
      pageInfo: { totalPages: Math.ceil(Published / limit), totalElements: Published, page, size },
    };
  },
};
