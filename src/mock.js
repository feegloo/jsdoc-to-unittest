import { listAccesses, parseKey, fallToGlobal } from './analyzer';

export default function mock(func, mocks, _eval) {
  const obj = {};

  for (const [path, value] of Object.entries(mocks)) {
    const accesses = listAccesses(`(${func.toString()})()`, path, _eval);
    let cur = obj;
    const { fullPath, path: accessPath, ...rest } = parseKey(path);
    fullPath.forEach((key, i, arr) => {
      if (arr.length === i + 1) {
        const values = new Array(accesses.length).fill({});
        Reflect.defineProperty(cur, key, {
          configurable: false,
          set(_value) {
            const toCompare = [..._value.path.slice(1)];
            if (_value.isCalled) {
              toCompare.push(_value.args);
            }

            const index = accesses.findIndex(path => path.join() === toCompare.join());
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

        cur[key] = { path: accessPath, value, ...rest };
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
