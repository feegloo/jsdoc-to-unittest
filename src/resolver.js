import { parseKey } from './analyzer';

function buildPath([path, ...rest], calls) {
  rest.forEach((part) => {
    if (isNaN(part)) {
      path += `.${part}`;
    } else {
      path += `[${part}]`;
    }
  });
  if (calls) {
    path += '()';
  }

  return path;
}

export function listMissingDependencies(code, scope = {}) {
  return parseKey(code).map(({ access, path, calls }) => {
    const currentPath = [];
    try {
      (function resolve(part) {
        currentPath.push(part);
        const ref = Function('s', `with(s){return(${buildPath(currentPath, false)});}`)(scope);
        if (path.length) {
          resolve(path.shift());
        } else if (calls && typeof ref === 'function') {
          let stripped = ref.toString().replace(ref.name, '(') + ')()';
          console.log(listMissingDependencies(stripped), scope);
        }
      })(path.shift());
    } catch (ex) {
      console.log(ex)
      return {
        kind: ex.constructor.name,
        path: currentPath,
      };
    }

    return {
      kind: '',
      path: [],
    };
  }).filter(obj => obj.kind !== '');
}
