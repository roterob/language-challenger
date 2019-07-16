export default (value, res) => {
  if (typeof value == 'undefined' || value == null) {
    return res;
  } else {
    return value;
  }
};
