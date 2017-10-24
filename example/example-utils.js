/**
 * Return new array without element(s) at index of original array.
 * It's mathematical 'complement' of set.
 *
 * @example
 *
 *  var arr = [10, 5, 3];
 *  frosmo.site.utils.arrayComplement(arr, 1);       // [10, 3];
 *
 * @example
 *
 *  var arr = ['a', 'b', 'c'];
 *  frosmo.site.utils.arrayComplement(arr, 0, 2);   // ['b'];
 *
 * @memberof site.utils
 * @param  {Array} array original array
 * @param  {number...} indexes to exclude, multiple arguments
 *
 * TODO: what if index is negative/greater than length - throw error ?
 */
function arrayComplement(array /* , arg0, arg1, argN... */) {
  var indexes = Array.prototype.slice.call(arguments, 1);

  return easy.utils.filter(array, function (value, arrIndex) {
    return !easy.utils.inArray(indexes, arrIndex);
  });
}
