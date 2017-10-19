export default ([base, ...parts], isFunction) => {
  let path = base;
  parts.forEach((part) => {
    if (Number.isNaN(+part) || typeof part !== 'string') {
      path += `.${part}`;
    } else {
      path += `[${part}]`;
    }
  });
  if (isFunction) {
    path += '()';
  }

  return path;
};
