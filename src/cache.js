import { parse } from 'acorn';
import { isPrimitive } from './utils';

const acornDefaults = {
  ecmaVersion: 8,
};

const generic = (cache = new WeakMap()) => (target, onMiss) => {
  if (isPrimitive(target)) {
    return onMiss(target);
  }

  if (cache.has(target)) {
    return cache.get(target);
  }

  const value = onMiss(target);
  cache.set(target, value);
  return value;
};

export const acorn = (() => {
  const cache = generic();
  return {
    parse(target, setup = {}) {
      return cache(target, () => {
        try {
          return parse(target, { ...acornDefaults, ...setup });
        } catch (ex) {
          return parse(`(${target})`, { ...acornDefaults, ...setup });
        }
      });
    },
  };
})();

export default generic();
