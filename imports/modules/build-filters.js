export default ({ type, tags }) => {
  const res = {};

  if (type) {
    res.type = type;
  }

  if (tags && tags.length > 0) {
    res.tags = { $all: tags };
  }

  return res;
};
