import { parseKey } from './analyzer';
import { evaluate } from './utils';

function buildPath([path, ...rest], calls) {
  rest.forEach((part) => {
    if (isNaN(+part)) {
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
  return parseKey(code).map(({ path, calls }) => {
    const currentPath = [];
    try {
      (function resolve(part) {
        currentPath.push(part);
        const ref = evaluate(`return(${buildPath(currentPath, calls && !path.length)})`, scope);
        if (path.length) {
          resolve(path.shift());
        } else if (calls && typeof ref === 'function') {
          return listMissingDependencies(`${ref.name}()`, { [ref.name]: ref });
        }
      })(path.shift());
    } catch (ex) {
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
