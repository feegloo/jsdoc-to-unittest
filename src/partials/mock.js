function mock(func) {
  const instance = new Proxy({}, {
    has: () => true,
    get(target, prop) {
      if (prop === Symbol.unscopables) return [];
      if (__imports__[prop] !== undefined) {
        return __imports__[prop];
      }

      try {
        return eval(prop);
      } catch (ex) {
        if (ex instanceof ReferenceError) {
          return instance;
        }
      }
    },
  });

  return Function('s', `with(s){return(${func.toString()})();}`)(instance);
}
