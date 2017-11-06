import { transform } from 'babel-core';
import { stripSemicolons } from './utils';

export default (code, { proxy, constructor = Function, ...args }) => {
  code = code.replace(/`/g, '\\`');
  ({ code } = transform(code, {
    plugins: ['transform-es2015-constants'],
  }));

  code = stripSemicolons(code);

  return constructor(
    ['s', ...Object.keys(args)].join(','),
    `with(s){ ${code} }`,
  ).call(null, proxy, ...Object.values(args));
};
