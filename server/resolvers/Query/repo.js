// @flow
import { getEOSRepoApi } from '../../../API.config';

const getStartOfTodaySec = () => {
  const day = new Date();
  return day.setHours(0, 0, 0, 0) / 1000;
};

// const getStartOfBeforeDaysSec = (n: number) => getStartOfTodaySec() - 86400 * n;

export default {
  async commit() {
    const commits = await getEOSRepoApi('stats/commit_activity');
    const timeStamp = getStartOfTodaySec();
    const initData = {
      days: [],
      total: 0,
      week: timeStamp,
    };
    return Array.isArray(commits)
      ? commits
        .splice(commits.length - 6, commits.length)
        .reduce((arr, current) => {
          arr.days = [
            ...arr.days,
            ...current.days,
          ];
          arr.total += current.total;
          arr.week = arr.week > current.week
            ? current.week
            : arr.week;
          return arr;
        }, initData)
    : initData;
  },
}