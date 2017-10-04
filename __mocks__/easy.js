export default {
  'easy.ready()': (func, ...args) => func(...args),
  'easy.console.log(...args)': () => {}, // push to array and then toEqual
};
