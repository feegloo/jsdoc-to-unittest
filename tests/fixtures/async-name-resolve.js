/**
 * Get Promise as value from window using waitFor.
 * It means we are waiting for some time to value appear in window.
 *
 * Exceptionally written as _window to avoid collision with window variable (implicit global)
 *
 * @example
 *
 * frosmo.site.utils.window('foo.bar')
 * .then(function(result) {
     *     console.log(result);    // 123
     * });
 *
 * var foo = {bar : 123 };
 *
 * @example
 *
 * frosmo.site.utils.window('someUndefinedVariable')
 * .catch(function(err) {
     *     console.log(err);  // 'timeout'
     * });
 *
 * @async
 * @memberof site.utils
 * @param {String} property path like 'foo.bar.baz'
 * @param {Object} options like {retryInterval: 500}
 * @return {Promise}
 */
function _window(property, options) {
  options = easy.utils.extend({
    retryInterval: 250,
    endTime: 5000
  }, options);

  options.global = options.global || window;

  // .catch and log error with proper code when you use it
  return new easy.Promise(function (resolve, reject) {
    easy.utils.waitFor(options.retryInterval, options.endTime, function () {
      var result = site.utils.getValueByDotString(options.global, property);

      if (result !== undefined) {
        resolve(result);

        return true;
      }

      return undefined;
    })
      .catch(function (err) {
        reject(err);
      });
  });
}
