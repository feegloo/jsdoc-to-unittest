export function getFromURL(str) {
  return fetch(str);
}

global.getFromURL = getFromURL;
// Valid tests: 100.00%

describe('getFromURL', () => {
  test('example 1', async () => {
    expect(
      await mock.async(
        () =>
          getFromURL('https://mail.google.com/mail/').then(response => response.slice(5).trim()),
        { "fetch('string')": 'hello world  ' },
        func => eval(func),
      ),
    ).toBe('world');
  });
});
