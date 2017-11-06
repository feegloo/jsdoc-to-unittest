/**
 * Get device price (current offer price or visible price for product without offer).
 * Price is after discount if discount exists.
 *
 * @example
 *
 * location.href = 'http://www.play.pl/telefony/glosniki/glosnik-jabra-speak-410/?oid=4000963609';
 *
 * frosmo.site.products.getDevicePrice()
 * .then(function(devicePrice){
 *      console.log(devicePrice);  // 123
 * });
 *
 * @memberof site.products
 *
 * @param {Window} [global] window
 * @return {easy.Promise}
 */
function getDevicePrice() {
    return easy.domElements.waitFor({
        selector: '.device-price'
    })
      .then(function (els) {
          return site.utils.extractPrice(els[0].textContent);
      });
}
