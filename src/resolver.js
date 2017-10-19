import { parseKey } from './analyzer';
import { evaluate } from './utils';
import joinPath from './path';

export default function listMissingDependencies(code, scope = {}) {
  return parseKey(code).map(({ path, calls }) => {
    const currentPath = [];
    try {
      while (path.length) {
        currentPath.push(path.shift());
        evaluate(`return(${joinPath(currentPath, calls && !path.length)})`, scope);
      }
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
