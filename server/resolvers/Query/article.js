// @flow
import { size as objSize, truncate } from 'lodash';
import stripTags from 'striptags';
import { getCMS, PAGE_SIZE_DEFAULT } from '../../../API.config';

export function formatDictionaryEntry(wiki) {
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
export const DictionaryEntry = {
  brief({ content }) {
    if (!content) return null;
    return truncate(stripTags(content), { length: 100, separator: '...' });
  },
  briefZh({ contentZh }) {
    if (!contentZh) return null;
    return truncate(stripTags(contentZh), { length: 100, separator: '...' });
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
  async dictionaryEntry(_: any, { field }: { field: string }) {
    const {
      data: [dictionaryEntry],
    } = await getCMS(`tables/translation/rows?filters[field][eq]=${field}`);
    return formatDictionaryEntry(dictionaryEntry);
  },
  async dictionaryEntries(_: any, { keyWord, page, size }: { keyWord?: string, page?: number, size?: number }) {
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
      dictionaryEntries: data.map(formatDictionaryEntry),
      pageInfo: { totalPages: Math.ceil(Published / limit), totalElements: Published, page, size },
    };
  },
};
