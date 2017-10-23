export default new Proxy(console, {
  get(target, key) {
    if (Reflect.has(target, key)) {
      return (...args) => {
        try {
          console[key](...args);
        } catch (ex) {}
        return args[args.length - 1];
      };
    }
  },
});
