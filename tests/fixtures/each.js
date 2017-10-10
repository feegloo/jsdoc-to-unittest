/**
 * Iterate over either an array or object.
 * Polyfill for {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach|forEach}
 *
 * @summary jQuery.each, Array.prototype.forEach, _.forEach
 *
 * @example
 * easy.utils.each([1, 2, 3], function (value, index) {
   *     easy.console.log(index, value);
     * });
 *
 * @example
 * easy.utils.each({foo: 'bar', baz: 'bar'}, function (value, key) {
     *     easy.console.log(key, value);
     * });
 *
 * @example
 * var utils = {
     *     power: function (base, exponent) {
     *         return Math.pow(base, exponent);
     *     }
     * };
 *
 * easy.utils.each([1, 2, 3], function (value, index) {
     *     // "this" references the utils object where the function "power" is available
     *     easy.console.log(index, value, this.power(value));
     * }, utils);
 *
 * @example
 * easy.utils.each({foo: 'bar', baz: 'bar'}, function (value, key) {
     *     // "this" references the global object where the built-in String object is available
     *     easy.console.log(key, value, this.String.prototype.toUpperCase.call(value));
     * });
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach|forEach} for more details
 * @memberof easy.utils
 * @param {(Array|Object)} obj Array or object to iterate over
 * @param {Function} iterator Iterator function. Passes the arguments value, index/key and array/object reference
 * @param {Object} [context] Optional context to use as "this" when invoking the iterator function
 * @returns {void}
 */
function each(obj, iterator, context) {
  _forEach(obj, iterator, context);
}
