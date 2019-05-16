export default (objectKey, array) => {
  let res = {};
  array.forEach(element => {
    res = Object.assign(res, { [element[objectKey]]: element });
  });
  return res;
};
