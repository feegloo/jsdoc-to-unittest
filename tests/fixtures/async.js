/**
 * @name getFromURL
 *
 * @async
 * @example
 * getFromURL('https://mail.google.com/mail/')
 *   .then(response => response.slice(5).trim()); // "world"
 *
 * @mock
 * { 'fetch(\'string\')': 'hello world  ' }
 *
 *
 * @param str1
 * @param str2
 * @returns {*|boolean}
 */
function getFromURL(str) {
  return fetch(str);
}
