import React from 'react';
import moment from 'moment';

const ONE_HOUR = 60;
const ONE_DAY = 1440;
const TWO_DAYS = 2880;
const SEVEN_DAYS = 10080;

export default ({ time, now = new Date().getTime() }) => {
  const diffMinutes = (dt1, dt2) => {
    const diff = Math.abs(dt2 - dt1);

    return Math.round(diff / 1000 / 60);
  };
  const format = (dt1, dt2) => {
    const diff = diffMinutes(dt1, dt2);
    const m = moment(dt1);

    let res = 'now';
    if (diff > SEVEN_DAYS) {
      res = m.format('DD/MM');
    } else if (diff > TWO_DAYS) {
      res = m.format('dddd');
    } else if (diff > ONE_DAY) {
      res = 'Yesterday';
    } else if (diff > ONE_HOUR) {
      res = `${Math.round(diff / ONE_HOUR)}h`;
    } else if (diff > 1) {
      res = `${diff}'`;
    }

    return res;
  };
  return <span>{format(time, now)}</span>;
};
