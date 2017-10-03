function toResult(str) {
  return str.replace(/^[;]*|[;]*$/g, '');
}

exports.toResult = toResult;

function isFunction(str) {
  try {
    return typeof Function(`return (${str})`)() === 'function';
  } catch (ex) {}

  return false;
}

const reg = /[\n;]/;

function stripComments(str) {
  return str
    .replace(/\/{2,}.*(?:\n|$)/, '')
    .replace(/\/\*[^*]+\*\//, '');
}

exports.stripComments = stripComments;

exports.wrap = function wrap(src) {
  if (isFunction(src)) return src;

  try {
    if (reg.test(src)) {
      const lines = src.split(reg)
        .map(stripComments)
        .filter(item => item.trim().length);
      if (lines.length > 1) {
        return `() => { ${lines.slice(0, lines.length - 1).join(';\n')};\nreturn (${toResult(lines[lines.length - 1])}); }`;
      }

      return lines.join('').replace(/;*$|\/{2,}.*$/g, '').trim();
    }

    return src.replace(/;*$|\/{2,}.*$/g, '').trim();
  } catch (ex) {
    return '';
  }
};
