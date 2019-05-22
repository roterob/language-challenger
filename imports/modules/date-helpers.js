import moment from 'moment';
import chrono from 'chrono-node';

export const stringToMoment = value => {
  let res = null;
  if (typeof value === 'string') {
    const result = chrono.parseDate(value);
    if (result) {
      res = moment(result, 'DD/MM/YY');
    }
  } else if (value) {
    res = moment(value);
  }
  return res;
};

export const stringToDate = value => {
  return stringToMoment(value)
    .startOf('day')
    .toDate();
};

export const dateToString = value => {
  if (typeof v !== 'string') {
    return value.format('DD/MM/YY');
  } else {
    return value;
  }
};

export const stringIsDate = value => {
  return /\d{2}\/\d{2}\/\d{2}/.test(value);
};
