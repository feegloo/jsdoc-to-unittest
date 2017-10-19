import * as acorn from 'acorn';
import { isPrimitive } from './utils';

export default {
  ast: new class extends WeakMap { // eslint-disable-line new-parens
    get(target) {
      if (isPrimitive(target)) {
        return acorn.parse(target);
      }

      let ast = super.get(target); // eslint-disable-line no-shadow
      if (ast !== undefined) {
        return ast;
      }

      ast = acorn.parse(target);
      this.set(target, ast);
      return ast;
    }
  },

  analyzer: new class extends Map {
    cache(key, result) {

    }
  },
};
