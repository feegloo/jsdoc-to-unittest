/* global mock */
// Valid tests: 100.00%
import __imports__, { getFromURL } from './async.test.exports.js';

global.__imports__ = __imports__;
Object.assign(global, __imports__);

describe('getFromURL', () => {
  test('example 1', async () => {
    expect(
      await mock(
        () =>
          getFromURL('https://mail.google.com/mail/').then(response => response.slice(5).trim()),
        { 'fetch(Types.String)': () => Promise.resolve('hello world  ') },
        func => eval(func),
      ),
    ).toBe('world');
  });
});
