/**
 * Odmiana polskich liczebników
 *
 * @param {Number} value
 * @param {Array<String>} numerals
 * @param {Boolean} skipValue
 * @return {String} vo
 *
 * @example numeralConjugation(3, ['osób', 'osoba', 'osoby']); // '3 osoby'
 * @example numeralConjugation(11, ['osób', 'osoba', 'osoby']); // '11 osób'
 */
function numeralConjugation(value, numerals, skipValue) {
  var t0 = value % 10;
  var t1 = value % 100;
  var vo = [];

  if (skipValue !== true) {
    vo.push(value);
  }
  if (value === 1 && numerals[1]) {
    vo.push(numerals[1]);
  } else if ((value === 0 || (t0 >= 0 && t0 <= 1) || (t0 >= 5 && t0 <= 9) || (t1 > 10 && t1 < 20)) && numerals[0]) {
    vo.push(numerals[0]);
  } else if (((t1 < 10 || t1 > 20) && t0 >= 2 && t0 <= 4) && numerals[2]) {
    vo.push(numerals[2]);
  }
  return vo.join(' ');
}
