const yargs = jest.genMockFromModule('yargs');

yargs.argv = {
  prettify: true,
  target: 'jest',
};

Object.getOwnPropertyNames(yargs).forEach((key) => {
  if (typeof Object.getOwnPropertyDescriptor(yargs, key).value === 'function') {
    const fn = yargs[key];
    yargs[key] = function (...args) {
      fn.apply(this, args);
      return this;
    };
  }
});

yargs.__setArgv = argv => Object.assign(yargs.argv, argv);

export default yargs;
