/**
 * @namespace
 */
site.utils = (function () {
  /**
   * Add custom renderers from object key:value pairs.
   * TODO: @example
   *
   * @memberof site.utils
   * @param {object} renderers key : renderer name, value: renderer function
   */
  function addCustomRenderers(renderers) {
    easy.utils.each(renderers, function (fn, name) {
      easy.message.addCustomRenderer(name, fn);
    });
  }

  /**
   *
   * @param {String} protocol
   * @param {String} url
   * @return {String} url with the protocol
   */
  function addProtocol(protocol, url) {
    if (/^https?/.test(url)) {
      return url;
    }

    return protocol + '//' + url;
  }

  /**
   * @name arrayComplement
   * Return new array without element(s) at index of original array.
   * It's mathematical 'complement' of set.
   *
   * @example
   *
   *  var arr = [10, 5, 3];
   *  frosmo.site.utils.arrayComplement(arr, 1);       // [10, 3];
   *
   * @example
   *
   *  var arr = ['a', 'b', 'c'];
   *  frosmo.site.utils.arrayComplement(arr, 0, 2);   // ['b'];
   *
   * @memberof site.utils
   * @param  {Array} array original array
   * @param  {number...} indexes to exclude, multiple arguments
   *
   * TODO: what if index is negative/greater than length - throw error ?
   */
  function arrayComplement(array /* , arg0, arg1, argN... */) {
    var indexes = Array.prototype.slice.call(arguments, 1);

    return easy.utils.filter(array, function (value, arrIndex) {
      return !easy.utils.inArray(indexes, arrIndex);
    });
  }


  /**
   * @name contains
   *
   * @example
   * contains('foo', 'fooo'); // false
   *
   * @example
   * contains('hey', 'ey'); // true;
   *
   * @param str1
   * @param str2
   * @returns {*|boolean}
   */
  function contains(str1, str2) {
    return str1 && str1.indexOf(str2) !== -1;
  }

  /**
   * @name extendFn
   * @summary Extend function with another function.
   *
   * @desc
   * When you invoke baseFn after extending, it will invoke baseFn, then invoke extFn.
   * If baseFn is undefined/null, baseFn after extending is equal to extFn.
   *
   * Always wrap extFn with error handling.
   * Otherwise, when uncatched error occures if:
   * a) extFn is invoked after baseFn  - baseFn won't exit (it will break execution chain - code after baseFn won't execute)
   * b) extFn is invoked before baseFn - baseFn won't invoke at all
   *
   * IMPORTANT: be careful when you extend customer function. Use it only when necessary.
   *
   * @example
   * window.baseFn = function() {console.log('baseFn')};
   * extendFn(window, 'baseFn', function(){console.log('extFn')});
   * baseFn();   // 'baseFn'
   *             // 'extFn'
   * @example
   * // before : true
   * window.baseFn = function() { console.log('baseFn') };
   * extendFn(window, 'baseFn', function(){ console.log('extFn')}, {before : true});
   * baseFn();   // 'extFn'
   *             // 'baseFn'
   *
   * @example
   * // error handling with try/catch
   * // you can also use easy.addExceptionHandling
   * window.baseFn = function() { console.log('baseFn') };
   * extendFn(window, 'baseFn', function(){
     *      try {
     *          var foo;
     *          foo.toString();
     *      } catch (e) {
     *          console.log('extFn: error catched');
     *      }
     * });
   * baseFn();   // 'baseFn'
   *             // 'extFn: error catched'
   *
   * @example
   * // baseFn is undefined, but can be extended
   * extendFn(window, 'undefinedBaseFn', function(){ console.log('extFn')});
   * undefinedBaseFn();   // 'extFn'
   *                      // now undefinedBaseFn === extFn
   *
   * @param {Object} baseFnContext function extecution context
   * @param {Function} baseFn base function to extend
   * @param {Function} extFn function which extends base function
   * @param {Object} options
   * @param {Object} options.before true : extFn will be executed before baseFn
   * @return {Function}
   */
  function extendFn(baseFn, extFn, options) {
    options = easy.utils.extend({
      before: false,
      context: window
    }, options);

    var context = options.context;

    if (context[baseFn]) {
      context[baseFn] = (function () {
        var original = context[baseFn];

        return function () {
          if (options.before) {
            extFn();
          }

          original.apply(context, arguments);

          if (!options.before) {
            extFn();
          }
        };
      }());
    } else {
      context[baseFn] = extFn;
    }
  }

  /**
   * @name extractFloat
   * @summary Extracts float from number or string.
   *
   * @example
   * extractFloat('rating : 4.5')  // 4.5
   *
   * @example
   * extractFloat('.2') // 2
   *
   * @example
   * extractFloat('123foo456.78')  // undefined
   *
   * @memberof site.utils
   * @param {string|number} value
   * @return {number|undefined} undefined if value can't be transformed to float
   */
  function extractFloat(value) {
    var result;

    if (easy.utils.isNil(value)) {
      throw Error('site.utils.extractFloat:: nil value');
    }

    if (easy.utils.isNumeric(value) && !startsWith(value.toString(), '.')) {
      result = parseFloat(value);
    } else if (easy.utils.isString(value)) {
      var match = value.match(/[+-]?\d+(\.\d+)?/g);

      // if string is valid to extract float
      if (match && match.length === 1) {
        return parseFloat(match[0]);
      }
    }

    return result;
  }

  /**
   * @name extractPrice
   * @summary Extracts price from string or number.
   * TODO: should return array of found prices ?
   *
   * @example
   *
   * extractPrice(1)                  // 1
   * @example
   * extractPrice('cena 1,5 zł')      // 1.5
   * @example
   * extractPrice('price : 1 234.5$') // 1234.5
   *
   * @memberof site.utils
   * @param {string|number} value
   * @return {number|undefined} undefined if value can't be transformed to float
   */
  function extractPrice(value) {
    if (easy.utils.isString(value)) {
      value = value.replace(/\s/g, '').replace(/,/g, '.');
    }

    return extractFloat(value);
  }

  /**
   * @summary Filter stringified HTML tags by CSS/jQuery selector.
   *
   * @desc Use to get message.content for specific page, when your message contains code making modifications on many pages.
   * First, in admin panel, add data-f-filter="module-name" to <style>, <script> and top-level inline/block tags,
   * like <div>, <span>, etc. Next, in renderer, use _filter with selector matching tags to be filtered.
   *
   * @example
   *
   *  // MESSAGE IN ADMIN PANEL
   *
   *  // <style data-f-filter="page-1">
   *  //    body {color:red}
   *  // </style>
   *
   *  // <script data-f-filter="page-1">
   *  //    var foo = 1;
   *  // </script>
   *
   *  // <p data-f-filter="page-2">
   *  //    I love Frosmo
   *  // </p>
   *
   *  // RENDERER
   *
   *  var filteredHTML = _filter(message.content, '[data-f-filter="page-2"]') // '<p data-f-filter="page-2">I love Frosmo</p>'
   *  _insert(message, el, filteredHTML);
   *
   * @todo:
   * 1) validate HTML
   * 2) use easy as implementation instead of jQuery
   *
   * @memberof site.renderers
   * @param {string} html Valid HTML string tags
   * @param {string} selector jQuery-style selector which filter html
   */
  function filter(html, selector) {
    return new easy.Promise(function (resolve, reject) {
      // you have to wait for jQuery to make it work!
      site.$(function ($) {
        try {
          var $filtered = $(html).filter(selector);

          // var filteredHtml = $('<div/>').append($filtered).html();
          // TODO: why this is not working, seems like jQuery is evalutating script after appending it to div!!

          var filteredHtml = easy.utils.map($filtered, function (el) {
            return el.outerHTML;
          }).join('');

          if (!filteredHtml) {
            throw site.error('site.utils.filter:: empty HTML for selector = ' + selector);
          }

          resolve(filteredHtml);
        } catch (err) {
          reject(err);
        }
      }, function (errObj) {
        reject(errObj);
      });
    });
  }


  function findParentWithClass(elem, classNames) {
    if (elem === null) {
      return undefined;
    }

    return easy.utils.hasClassName(elem, classNames) ? elem : findParentWithClass(elem.parentElement, classNames);
  }

  /**
   * Get customer target.
   * // on conversion page it's always B2B - dont use it there
   *
   * TODO: move to site.pages.getCustomerTarget, merge with other method using JS, return promise
   * TODO: @example
   * TODO: move to site.pages / site.products
   *
   * @memberof site.utils
   *
   * @return {String} ('b2b'|'b2c')
   */
  function getCustomerTarget(url) {
    if (site.pages.isB2B(url)) {
      return site.constants.customerTarget.B2B;
    }

    if (site.pages.isB2C(url)) {
      return site.constants.customerTarget.B2C;
    }
    // TODO: throw error or return undefined ?
    return undefined;
  }

  /**
   * TODO: move to site.products
   * TODO: rename to getProductGridClass
   */
  // function getProductClassName(productFormat) {
  //     if (productFormat) {
  //         return productFormat === site.constants.productFormat.PHONE ? 'small-6' : 'small-12';
  //     }
  //     // TEMPORARY : for unknown product format, return phone. remove after products refresh
  //     return 'small-6';
  // }

  function getProductClassName(productFormat) {
    if (productFormat) {
      return productFormat === site.constants.productFormat.PHONE ? '' : 'small-12';
    }
    // TEMPORARY : for unknown product format, return phone. remove after products refresh
    return '';
  }

  /**
   * @summary Field (object) for productParser config witout using jQuery (just plain value and validator fn)
   *
   * @desc
   *
   *   Wrapper around commonly copy-pasted object passed to productParser.
   *   General idea is like this : prepare value you want to pass to productParser OUTSIDE product parser.
   *   It means value can be DOM Element attribute, javascript variable, etc. - doesnt matter, it's transparent.
   *   Then, pass function which validates a value. Generally, it should be common function which checks
   *   if value is one of base JavaScript types (is string, is array, etc.). Of course, you can pass as validator
   *   custom function with any logic you want.
   *
   * @example
   *
   *   // generally, instead of doing this:
   *
   *   id: {
    *       getAttributeData: function () {
    *           return '123-456-789';
    *       },
    *       validate: function () {
    *           return site.utils.isWord(this.getAttributeData());
    *       }
    *   }
   *
   *   // do this:
   *
   *   id : site.utils.getProductParserField('123-456-789', site.utils.isWord)
   *
   * @example
   *
   *   // without validator
   *
   *   var foo = 'optional value, can be undefined as well';
   *
   *   bar : site.utils.getProductParserField(foo) // ok
   *
   * @example
   *
   *   // with validator as custom function
   *
   *   var foo = 'enum2';
   *
   *   bar : site.utils.getProductParserField(foo, function(value) {   // ok
    *       return value === 'enum1' || value === 'enum2';
    *   })
   *
   * @example
   *
   *   // validate array
   *
   *   var foo = null;
   *   var bar = [];
   *
   *   baz : site.utils.getProductParserField(foo, frosmo.easy.utils.isArray)  // productParser error
   *   baz : site.utils.getProductParserField(bar, frosmo.easy.utils.isArray)  // ok
   *
   * @example
   *
   *   // validate non-empty string
   *
   *   var foo = '  ';
   *   var bar = 'abcd';
   *
   *   baz : site.utils.getProductParserField(foo, frosmo.site.utils.isWord)   // productParser error
   *   baz : site.utils.getProductParserField(bar, frosmo.site.utils.isWord)   // ok
   *
   * @example
   *
   *   // validate non-negative number
   *
   *   var foo = -1;
   *   var bar = 0;
   *
   *   baz : site.utils.getProductParserField(foo, frosmo.site.utils.isNonNegativeNumber)  // productParser error
   *   baz : site.utils.getProductParserField(bar, frosmo.site.utils.isNonNegativeNumber)  // ok
   *
   * @example
   *
   *   // validate bit (1 or 0, use when you need to send true/false, because false will be send as "false" by productParser)
   *
   *   var foo = -1;
   *   var bar = 1;
   *
   *   baz : site.utils.getProductParserField(foo, frosmo.site.utils.isBit)  // productParser error
   *   baz : site.utils.getProductParserField(bar, frosmo.site.utils.isBit)  // ok
   *
   * @memberof site.utils
   * @param {Object} value value originally returned from product parser getAttributeData()
   * @param {Function} [validator] value validation
   */
  function getProductParserField(value, validator) {
    return {
      validate: validator,
      getAttributeData: function () {
        // TODO: when value is false, return undefined ?
        return value;
      }
    };
  }

  /**
   * Get modification template by name.
   *
   * @example
   * frosmo.site.utils.getTemplate('foo EXPORT'); // '<div>foo</div>'
   *
   * @memberof site.utils
   * @param {string} name
   * @return {boolean}
   */
  function getTemplate(name) {
    var templateContent = easy.config.templates[name];

    if (templateContent === undefined) {
      throw site.error('site.utils.getTemplate:: undefined modification template "' + name + '"');
    }

    return templateContent;
  }

  /**
   * @name getUniqueId
   * @summary Generate pseudo-unique Base36 string (containing numbers and small letters)
   *
   * @desc
   *
   * Uses sequence of chars randomly selected from 36 possibilities (Base36 : 10 numbers + 26 letters)
   *
   *      '0123456789abcdefghijklmnoprstwuxyz'
   *
   * If you want to calculate probability of retriving the same id:
   *
   *      p = 1/36^length
   *
   * where length is uniqueId.length, passes as parameter to function.
   *
   * @example
   *
   * frosmo.site.utils.getUniqueId()  // 'yd4rcjmmc0'
   *
   * @memberof site.utils
   * @param {number} [length=10] id length
   * @return {string} unique id
   */
  function getUniqueId(length) {
    if (length !== undefined && (!easy.utils.isNumber(length) || length < 1)) {
      throw Error('site.utils.getUniqueId:: wrong length = ' + length);
    }

    length = length || 10;

    var BASE36 = '0123456789abcdefghijklmnopqrstuvwxyz';
    var text = '';

    for (var i = 0; i < length; i++) {
      text += BASE36.charAt(Math.floor(Math.random() * BASE36.length));
    }

    return text;
  }

  /**
   * @name getUniqueHtmlIdentifier
   * @summary Generate unique id which is valid html identier (can be used as id, class, etc).
   *
   * @desc
   *
   * https://www.w3.org/TR/REC-html40/types.html#type-cdata
   *
   * "must begin with a letter ([A-Za-z]) and may be followed by any number of letters,
   * digits ([0-9]), hyphens ("-"), underscores ("_"), colons (":"), and periods (".")."
   *
   * @example
   *
   * frosmo.site.utils.getUniqueHtmlIdentifier()  // 'f-yd4rcjmmc0'
   *
   * @memberof site.utils
   * @return {string} unique id which is valid html id
   */
  function getUniqueHtmlIdentifier() {
    return 'f-' + getUniqueId();
  }

  function getValueByDotString(obj, key) {
    return easy.utils.reduce(key.split('.'), function (obj, key) {
      return (typeof obj === 'undefined' || obj === null) ? obj : obj[key];
    }, obj);
  }

  /**
   * wrapper of easy.utils.getIEVersion
   * @return {Boolean} is IE browser or not
   */
  function isIE() {
    return easy.utils.getIEVersion(navigator.userAgent) !== -1;
  }

  /**
   * @name isNonNegativeNumber
   * Check if param isn't negative number (positive or neutral)
   *
   * @example
   * frosmo.site.utils.isNonNegativeNumber(0);    // true
   *
   * @example
   * frosmo.site.utils.isNonNegativeNumber(1);    // true
   *
   * @memberof site.utils
   * @param {number} number
   * @return {boolean}
   */
  function isNonNegativeNumber(number) {
    return easy.utils.isNumber(number) && number >= 0;
  }

  /**
   * @name isWord
   * Check if value is a word (non-empty string)
   *
   * @example
   * frosmo.site.utils.isWord('number');  // true
   *
   * @example
   * frosmo.site.utils.isWord(undefined); // false
   *
   * @example
   * frosmo.site.utils.isWord('      ');  // false
   *
   * @memberof site.utils
   * @param {string} string
   * @return {boolean}
   */
  function isWord(string) {
    return easy.utils.isString(string) && !easy.utils.isEmpty(easy.utils.trim(string));
  }

  /**
   * Get the current time in milliseconds, which is the number of milliseconds that have elapsed since 1 January 1970 00:00:00 UT
   *
   * @return {number} Current time in milliseconds. Note: This is not an epoch timestamp
   */
  function now() {
    return easy.utils.isFunction(Date.now) ? Date.now() : new Date().getTime();
  }

  /**
   * @desc Render template with params.
   *
   * @memberof site.utils
   *
   * @param {string} template name of template declared in admin panel, or html with mustache expressions
   * @param {Object} params object passed to template
   * @param {boolean} [isTemplateHtml] true - template is html, falsy - template is name, used to get html from easy.config
   * @return {string} rendered HTML
   */
  function render(template, params, isTemplateHtml) {
    var templateHtml;

    params = params || {};
    // TODO: find best pattern to check optional boolean parameters (maybe precise type, without truthy/falsy)
    if (isTemplateHtml) {
      templateHtml = template;
    } else {
      templateHtml = easy.config.templates[template];
    }
    return easy.template.render(templateHtml, params);
  }

  /**
   * @author https://remysharp.com/2010/07/21/throttling-function-calls
   *
   * @param {Function} fn
   * @param {Number} threshhold
   * @param {Object} scope
   * @return {Function} throttledFunction
   */
  function throttle(fn, threshhold, scope) {
    threshhold = threshhold || 250;
    var last;
    var deferTimer;

    return function () {
      var context = scope || this;
      var now = +new Date();
      var args = arguments;

      if (last && now < last + threshhold) {
        // hold on to it
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  }

  /**
   * Factory function which returns api for "touch points" (events sent as "fake" revisions to FCP)
   *
   * TODO: make more universal
   * config "name" : revisionId
   */
  function touchPoint(config) {
    var sent = [];

    return function (name, messageId) {
      var revisionId = config[name];

      if (!revisionId) {
        throw Error('site.utils.touchPoint::undefined revisionId for ' + name);
      }

      messageId = messageId || config.messageId;

      if (!messageId) {
        throw Error('site.utils.touchPoint:: invalid messageId = ' + messageId);
      }

      if (easy.utils.inArray(sent, name)) {
        // TODO: f.debug ? f.log with custom color ?
        easy.console.log(name + ' already sent');
        return;
      }

      easy.domEvents.ready(function () {
        easy.console.log(name + ' / ' + messageId + ' / ' + revisionId);

        // TODO: call queue to guarantee api will showMessage if request would be canceled
        easy.api.showMessage(null, messageId, revisionId);

        // now we assume once api call was executed, it counts as 'success'
        // (it will be sent by easy because it has requestQueue)
        // TODO: Success API call:
        var success = true;

        if (success) {
          sent.push(name);
        }
      });
    };
  }

  /**
   * Check if string starts with other string.
   *
   * @example
   *
   * startsWith('foobar', 'fo')  // true
   *
   * @memberof site.utils
   * @return {boolean}
   */
  function startsWith(base, start) {
    if (easy.utils.isString(base) && easy.utils.isString(start)) {
      return base.substring(0, start.length) === start;
    }

    return false;
  }

  /**
   * TODO: do similar wrapper for GA / FBQ , to show log / debug for user when requst is sent.
   *
   * @summary Track event to adobe _satellite. (only on prod).
   *
   * @desc
   *
   * We assume this library is included above frosmo.
   * <script src="//assets.adobedtm.com/9160300ece01eee738ad35e3e0b4be65399a1f9e/satelliteLib-74f1d3a2f1dd27f7788469180342a55abd482a8c.js"></script>
   *
   * @example
   *
   *  frosmo.site.utils.getProductParserField('eventName');           // _satellite.track('eventName') on PROD, log on DEVEL
   *
   * @example
   *
   *  frosmo.site.utils.trackSatellite('undefined event');    // easy.console.error with proper message, but will try to send request anyway
   *
   * @param {String} name modificationAlias, ex. 'basketReminder.click'
   */
  // Because of customer's request we disable every `_satellite.track()` call
  function trackSatellite(/* name */) {
    // var contains;

    // if (!name) {
    //     throw site.error('site.utils.trackSatellite:: invalid value of "name" = ' + name);
    // }

    // contains = easy.utils.some(window._satellite.directCallRules, function (rule) {
    //     return rule.name === name;
    // });

    // if (!contains) {
    //     easy.console.error('_satellite.track("' + name + '") event "' + name + '" not defined');
    // }

    // if (easy.DEVEL) {
    //     easy.console.log('site.utils.trackSatellite:: "' + name + '" event exist, request will be sent on PROD');
    // } else {
    //     window._satellite.track(name);
    //     easy.console.debug('_satellite.track("' + name + '") request sent, search for "omtrdc" in Network tab');
    // }
  }

  /**
   * TODO: copy paste of trackSatellite, but trackSatellite is disabled and should stay that way.
   *
   * @param {String} name event name
   */
  function satelliteTrack(name) {
    var contains;

    if (!name) {
      throw site.error('site.utils.trackSatellite:: invalid value of "name" = ' + name);
    }

    contains = easy.utils.some(window._satellite.directCallRules, function (rule) {
      return rule.name === name;
    });

    if (!contains) {
      easy.console.error('_satellite.track("' + name + '") event "' + name + '" not defined');
    }

    if (easy.DEVEL) {
      easy.console.log('site.utils.trackSatellite:: "' + name + '" request will be sent on PROD');
    } else {
      window._satellite.track(name);
      easy.console.debug('_satellite.track("' + name + '") search for "omtrdc" in Network tab to see request');
    }
  }

  /**
   * @name window
   * Get Promise as value from window using waitFor.
   * It means we are waiting for some time to value appear in window.
   *
   * Exceptionally written as _window to avoid collision with window variable (implicit global)
   *
   * @example
   *
   * frosmo.site.utils.window('foo.bar')
   * .then(function(result) {
     *     console.log(result);    // 123
     * });
   *
   * var foo = {bar : 123 };
   *
   * @example
   *
   * frosmo.site.utils.window('someUndefinedVariable')
   * .catch(function(err) {
     *     console.log(err);  // 'timeout'
     * });
   *
   * @memberof site.utils
   * @param {String} property path like 'foo.bar.baz'
   * @param {Object} options like {retryInterval: 500}
   * @return {Promise}
   */
  function _window(property, options) {
    options = easy.utils.extend({
      retryInterval: 250,
      endTime: 5000
    }, options);

    options.global = options.global || window;

    // .catch and log error with proper code when you use it
    return new easy.Promise(function (resolve, reject) {
      easy.utils.waitFor(options.retryInterval, options.endTime, function () {
        var result = site.utils.getValueByDotString(options.global, property);

        if (result !== undefined) {
          resolve(result);

          return true;
        }

        return undefined;
      })
        .catch(function (err) {
          reject(err);
        });
    });
  }

  /**
   * Log showMessage and trigger event
   *
   * TODO: showMessage, trueDisplay, clickMessage should share same code base.
   *
   * @memberof site.renderers
   * @private
   * @param {object} message Easy message
   */
  var showMessage = (function () {
    var triggered = {};

    return function (message) {
      if (!message || !message.id || !message.revision) {
        throw Error('site.utils.showMessage::message must be like {id: 123, revision : 456 }');
      }

      if (!easy.utils.inArray(triggered[message.id], message.revision)) {
        easy.ready(function () {
          easy.api.showMessage(null, message.id, message.revision);
          easy.events.trigger(easy.EVENT_MESSAGE_SHOW, message);
        });

        triggered[message.id] = triggered[message.id] || [];
        triggered[message.id].push(message.revision);
      }
      // TODO: log when already triggered?
    };
  }());

  /**
   * Log trueDisplay and trigger event
   *
   * @memberof site.renderers
   * @private
   * @param {object} message Easy message
   */
  var trueDisplay = (function () {
    var triggered = [];

    return function (message) {
      if (!message || !message.id || !message.revision) {
        throw Error('site.utils.trueDisplay::message must be like {id: 123, revision : 456 }');
      }

      if (!easy.utils.inArray(triggered[message.id], message.revision)) {
        easy.ready(function () {
          easy.api.trueDisplay(null, message.id, message.revision);
          easy.events.trigger(easy.EVENT_MESSAGE_TRUE_DISPLAY, message);
        });

        triggered[message.id] = triggered[message.id] || [];
        triggered[message.id].push(message.revision);
      }
    };
  }());

  /**
   * Log clickMessage and trigger event
   *
   * @memberof site.renderers
   * @private
   * @param {object} message Easy message
   */
  var clickMessage = (function () {
    var triggered = [];

    return function (message) {
      if (!message || !message.id || !message.revision) {
        throw Error('site.utils.clickMessage::message must be like {id: 123, revision : 456 }');
      }

      if (!easy.utils.inArray(triggered[message.id], message.revision)) {
        easy.ready(function () {
          easy.api.clickMessage(null, message.id, message.revision);
          easy.events.trigger(easy.EVENT_MESSAGE_CLICK, message);
        });

        triggered[message.id] = triggered[message.id] || [];
        triggered[message.id].push(message.revision);
      }
    };
  }());

  return {
    addCustomRenderers: addCustomRenderers,
    addProtocol: addProtocol,
    arrayComplement: arrayComplement,
    contains: contains,
    clickMessage: clickMessage,
    extendFn: extendFn,
    extractFloat: extractFloat,
    extractPrice: extractPrice,
    filter: filter,
    findParentWithClass: findParentWithClass,
    getCustomerTarget: getCustomerTarget,
    getProductClassName: getProductClassName,
    getProductParserField: getProductParserField,
    getTemplate: getTemplate,
    getUniqueId: getUniqueId,
    getUniqueHtmlIdentifier: getUniqueHtmlIdentifier,
    getValueByDotString: getValueByDotString,
    isIE: isIE,
    isNonNegativeNumber: isNonNegativeNumber,
    isWord: isWord,
    now: now,
    render: render,
    startsWith: startsWith,
    satelliteTrack: satelliteTrack,
    showMessage: showMessage,
    throttle: throttle,
    touchPoint: touchPoint,
    trackSatellite: trackSatellite,
    trueDisplay: trueDisplay,
    window: _window
  };
}());
