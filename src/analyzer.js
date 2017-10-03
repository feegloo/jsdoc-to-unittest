function chainableProxy(handlers) {
  const traps = {};
  let instance;
  for (const [trap, func] of Object.entries(handlers)) {
    traps[trap] = (...args) => {
      try {
        const ret = func(...args);
        if (ret !== undefined) return ret;
      } catch (ex) {}
      return instance;
    };
  }

  instance = new Proxy(chainableProxy, traps);
  return instance;
}

function intercept(path, called = [], firstKey = '') {
  const localPath = firstKey !== '' ? [firstKey] : [];
  let included = false;
  return chainableProxy({
    apply(target, thisArg, argumentsList) {
      called.push(localPath);
      return target.apply(thisArg, argumentsList);
    },
    get(target, prop) {
      if (!included) {
        included = true;
        path.push(localPath);
      }

      localPath.push(prop);
    },
  });
}

function withProxy(found, called) {
  return chainableProxy({
    has: () => true,
    get(target, key) {
      if (key === Symbol.unscopables) return [];
      return intercept(found, called, key);
    },
  });
}

function getPath(func, args = ['easy', 'frosmo']) {
  const path = [];
  Function(args.join(','), func)(...args.map(() => intercept(path)));
  return path;
}

function isCallable(func, toObserve, all = false) {
  const _found = [];
  const _called = [];
  Function(
    's',
    `with(s){return(()=>{${func}})()}`,
  )(withProxy(_found, _called));

  const found = _found.filter(item => toObserve.includes(item.join('.')));
  const called = _called.filter(item => toObserve.includes(item.join('.')));

  return called.length > 0 && (!all || found.length === called.length);
}

exports.getPath = getPath;
exports.isCallable = isCallable;
