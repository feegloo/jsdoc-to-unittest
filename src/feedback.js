export default (value) => {
  const obj = {
    value,
    type: typeof value,
  };

  return obj;
};
