import { listAccesses, parseKey, fallToGlobal } from './analyzer';

export default function mock(func, mocks, _eval) {
  const obj = {};

  for (const [path, value] of Object.entries(mocks)) {
    const accesses = listAccesses(`(${func.toString()})()`, [path]);
    let cur = obj;
    const [{ path: fullPath, access: accessPath, ...rest }] = parseKey(path);
    fullPath.forEach((key, i, arr) => {
      if (arr.length === i + 1) {
        const values = new Array(accesses.length).fill({});
        Reflect.defineProperty(cur, key, {
          configurable: false,
          set(_value) {
            const toCompare = [..._value.access].join('');

            const index = accesses.findIndex(item => item.join('') === toCompare);
            if (index === -1) {
              return false;
            }

            values[index] = _value;
            return true;
          },
          get() {
            const { value: _value } = values.shift();
            return _value;
          },
        });

        cur[key] = { access: accessPath, value, ...rest };
      } else if (key in cur) {
        cur = cur[key];
      } else {
        cur[key] = {};
        cur = cur[key];
      }
    });
  }

  return Function(
    's',
    `with(s){return(${func.toString()}).apply(this,arguments)}`,
  ).bind(null, fallToGlobal(obj, _eval));
}
