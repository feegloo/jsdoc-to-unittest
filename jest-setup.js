import expect from 'expect';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

expect.extend({
  toBeOneInstanceOf(objs, instances) {
    let canBeAny = false;
    const lowerCased = instances.map((instance) => {
      if (instance === '*') {
        canBeAny = true;
        return instance;
      }

      return instance.toLowerCase();
    });

    if (canBeAny) {
      return {
        message: 'Pass',
        pass: true,
      };
    }

    const ret = {
      message: 'None of given objects match any instance',
      pass: false,
    };


    try {
      ret.pass = objs.some(obj => lowerCased.includes(Object.prototype.toString(obj)));
      if (ret.pass === true) {
        ret.message = 'Pass';
      }
    } catch (ex) {
      ret.message = ex.toString();
    }

    return ret;
  },
});
