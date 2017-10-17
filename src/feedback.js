export default (value) => {
  const obj = {
    value,
    type: typeof value,
  };
  if (process.env.NODE_ENV !== 'test') { // quite risky
    Object.defineProperty(obj, Symbol.toPrimitive, {
      enumerable: false,
      value(hint) {
        switch (hint) {
          case 'number':
            return Number(value);
          case 'string':
            return String(value);
          default:
            return value;
        }
      },
    });
  }

  return obj;
};
