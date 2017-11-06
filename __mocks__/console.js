const mockedConsole = (logged = []) => new Proxy(console, {
  get(target, key) {
    if (key === 'clearLog') {
      return () => {
        while (logged.length) logged.pop();
        return logged;
      };
    }

    if (key === 'getLog') {
      return () => logged;
    }

    if (key === 'restore' || key === 'revoke') {
      return () => {
        global.console = target;
        return true;
      };
    }

    if (Reflect.has(target, key)) {
      return (...args) => {
        try {
          logged.push(...args);
          target[key](...args);
        } catch (ex) {}
        return args[args.length - 1];
      };
    }
  },
});

export default mockedConsole();
mockedConsole.revokable = mockedConsole;
