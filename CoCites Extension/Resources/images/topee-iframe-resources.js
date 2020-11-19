/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 64);
/******/ })
/************************************************************************/
/******/ ({

/***/ 37:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// create / get tab id


var tabInfo = {
    Event: {
        GET_TAB_ID: 'topee.tabInfo.getTabId',
        TAB_ID: 'topee.tabInfo.tabId'
    },

    init: init,
    sayHello: sayHello,
    sayAlive: sayAlive,
    sayBye: sayBye,
    isForThisFrame: isForThisFrame
};

var BACKGROUND_GETURL = 'extension-path:/';

var setTabId;
tabInfo.tabId = new Promise(function (resolve) {
    setTabId = resolve;
});


if (window === window.top) {
    tabInfo.frameId = 0;
}
else {
    tabInfo.frameId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

// this will break when navigating somewhere and then back here, because referrer is not what it should be in this case
// sessionStorage forks, so further writes to it don't affect the original (that called window.open) document's sessionStorage
var storedTabId = window.opener ? NaN : parseInt(sessionStorage.getItem('topee_tabId'));
var helloWithNullTabIdSent = false;
var topeeDebug = loadDebug();
publishDebug();

function init() {
    if (window === window.top) {
        // tabId responder
        window.addEventListener('message', function (msg) {
            if (msg.data && msg.data.type === tabInfo.Event.GET_TAB_ID) {
                tabInfo.tabId.then(id => msg.source && msg.source.postMessage({ type: tabInfo.Event.TAB_ID, detail: id, debug: topeeDebug }, msg.origin));
            }
        });

        safari.self.addEventListener("message", function (event) {
            if (event.name === 'tabUpdate' && event.message && event.message.url) {
                var url = event.message.url;
                if (event.message.url.startsWith(BACKGROUND_GETURL)) {
                    url = chrome.runtime.getURL(url.substr(BACKGROUND_GETURL.length));
                }
                window.location = url;
            }        
        });
    }

    if (!isNaN(storedTabId)) {
        setTabId(storedTabId);
        return;
    }

    if (window === window.top) {
        // should arrive as a response to sayHello
        safari.self.addEventListener("message", function (event) {
            if (event.name === 'forceTabId' && event.message && typeof event.message.tabId === 'number') {
                storedTabId = event.message.tabId;
                sessionStorage.setItem('topee_tabId', storedTabId);

                publishDebug(event.message.debug);
                storeDebug(event.message.debug);

                setTabId(event.message.tabId);
            }
        });
        return;
    }


    if (window !== window.top) {
        var poller;
        window.addEventListener('message', function (msg) {
            if (msg.data && msg.data.type === tabInfo.Event.TAB_ID && typeof msg.data.detail === 'number') {
                storedTabId = msg.data.detail;

                publishDebug(msg.data.debug);
                storeDebug(msg.data.debug);

                setTabId(msg.data.detail);
                clearInterval(poller);
            }
        });
        poller = setInterval(function () {
            window.top.postMessage({ type: tabInfo.Event.GET_TAB_ID }, '*');
        }, 200);
        window.top.postMessage({ type: tabInfo.Event.GET_TAB_ID }, '*');
        return;
    }
}

// True if hello has been sent and bye wasn't yet. This prevents multiple
// hellos/byes being sent from same page (as we listen on multiple load/unload
// events).
window.isTabRegistered = false;

function sayHello() {
    var tabId = isNaN(storedTabId) ? null : storedTabId;
    if (tabId === null) {
        if (helloWithNullTabIdSent)
            return;
        helloWithNullTabIdSent = true;
    }

    if (window.isTabRegistered) {
        return;
    }

    tabInfo.tabId.then(
        assignedTabId => window.topee_log && console.debug(`topee.hello(tabId: ${tabId}, referrer: "${document.referrer}", historyLength: ${history.length}) @ ${window.location.href} -> ${assignedTabId}`));

    safari.extension.dispatchMessage('hello', {
        // Info processed by Swift layer only
        tabId: tabId,
        referrer: document.referrer,
        historyLength: history.length,
        userAgent: navigator.userAgent,
        // Payload is passed to background page (and processed by tabs.js for example)
        payload: Object.assign(
            {
                eventName: 'hello',
                tabId: tabId
            },
            getTabState()
        )
    });

    window.isTabRegistered = true;
}

function sayAlive() {
    safari.extension.dispatchMessage('alive', {
        // Info processed by Swift layer only
        tabId: storedTabId,
        // Payload is passed to background page (and processed by tabs.js for example)
        payload: Object.assign(
            {
                eventName: 'alive',
                tabId: storedTabId
            },
            getTabState()
        )
    });
}

function getTabState () {
    return {
        frameId: tabInfo.frameId,
        isVisible: !document.hidden,
        hasFocus: document.hasFocus(),
        status: document.readyState === "complete" ? "complete" : "loading",
        url: window.location.href
    };
}

function sayBye(event) {
    var tabId = isNaN(storedTabId) ? null : storedTabId;

    if (!window.isTabRegistered) {
        return;
    }

    window.topee_log && console.debug(`topee.bye(tabId: ${tabId}, url: ${window.location.href})`);

    safari.extension.dispatchMessage('bye', {
        tabId: tabId,
        referrer: document.referrer,
        historyLength: history.length,
        payload: {
            tabId: tabId,
            eventName: 'bye',
            reason: event ? event.type : 'unknown',
            url: window.location.href
        }
    });

    window.isTabRegistered = false;
}

function isForThisFrame(targetFrameId) {
    // Frame not specified, so it's broadcast
    if (targetFrameId === null || targetFrameId === undefined) {
        return true;
    }

    return targetFrameId === tabInfo.frameId;
}

function loadDebug() {
    var debugStr = sessionStorage.getItem('topee_debug');
    if (!debugStr) {
        return {};
    }
    try {
        var debugObj = JSON.parse(debugStr);
        if (debugObj === null || typeof debugObj !== 'object') {
            return {};
        }

        return debugObj;
    }
    catch (ex) {
        return {};
    }
}

function storeDebug(debugObj) {
    if (typeof debugObj !== 'object' || debugObj === null) {
        return;
    }
    sessionStorage.setItem('topee_debug', JSON.stringify(debugObj));
}

function publishDebug(debugObj) {
    if (arguments.length > 0) {
        if (typeof debugObj !== 'object' || debugObj === null) {
            return;
        }
        topeeDebug = debugObj;
    }

    if (topeeDebug.log) {
        window.topee_log = topeeDebug.log;
    }
    else {
        delete window.topee_log;
    }
}

module.exports = tabInfo;


/***/ }),

/***/ 38:
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
	extension: __webpack_require__(39),
	i18n: __webpack_require__(47),
	runtime: __webpack_require__(40),
	tabs: __webpack_require__(48)
};


/***/ }),

/***/ 39:
/***/ (function(module, exports, __webpack_require__) {

// https://developer.chrome.com/extensions/extension
var runtime = __webpack_require__(40);

var extension = {};

extension.getURL = function (path) {
    return runtime.getURL(path);
};

module.exports = extension;


/***/ }),

/***/ 40:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var EventEmitter = __webpack_require__(41);
var tabInfo = __webpack_require__(37);
var iframesParent = __webpack_require__(42);
var background = __webpack_require__(46);

var runtime = {};

var eventEmitter = new EventEmitter();

// We are adding quite a few listeners so let's increase listeners limit. Otherwise we get following warning:
// (node) warning: possible EventEmitter memory leak detected. 11 listeners added. Use emitter.setMaxListeners() to increase limit.
eventEmitter.setMaxListeners(1024);

runtime.sendMessage = function(message, callback) {
    background.dispatchRequest({
        eventName: 'sendMessage',
        message: message
    }, callback);
};

runtime.onMessage = {
    addListener: function(callback) {
        eventEmitter.addListener('message', callback);
    },
    removeListener: function(callback) {
        eventEmitter.removeListener('message', callback);
    }
};

safari.self.addEventListener("message", function (event) {
    // message from the background script and a response
    if (event.name === 'request' && tabInfo.isForThisFrame(event.message.frameId)) {
        eventEmitter.emit('message', event.message.payload, {id: 'topee'}, function (message) {
            background.dispatchRequest({
                eventName: 'messageResponse',
                messageId: event.message.messageId,
                message: message
            });
        });

        // It's a broadcast message so let's pass it to all children IFRAMEs
        if (typeof event.message.frameId === 'undefined') {
            iframesParent.broadcast(event.message);
        }
        return;
    }
    if (event.name === 'request' && iframesParent.hasChild(event.message.frameId)) {
        iframesParent.forward(event.message.frameId, event.message);
        return;
    }
});

runtime.getURL = function (path) {
    if (!safari.extension.baseURI) {
        // Sometimes this happens (on first page load after XCode build & run)
        throw new Error('safari.extension.baseURI didn\'t return usable value');
    }

    return safari.extension.baseURI + path;
};

runtime.getPlatformInfo = function (fn) {
    fn({
        os: 'mac',
        arch: 'x86-64',
        nacl_arch: 'x86-64'
    });
};

module.exports = runtime;


/***/ }),

/***/ 41:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = $getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  var args = [];
  for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    ReflectApply(this.listener, this.target, args);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function') {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}


/***/ }),

/***/ 42:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var TextCrypto = __webpack_require__(43);
var txtCrypto = new TextCrypto();

var childFrames = {
    _frames: {},
    add: function (frameId, frameWindow) {
        this.garbageCollect();
        this._frames[frameId] = frameWindow;
    },
    get: function (frameId) {
        this.garbageCollect();
        return this._frames[frameId];
    },
    getAll: function () {
        this.garbageCollect();
        return Object.values(this._frames);
    },
    garbageCollect: function() {
        for (var frameId in this._frames) {
            if (this._frames[frameId].closed) {
                delete this._frames[frameId];
            }
        }
    }
};

function install() {
    window.addEventListener('message', function (event) {
        if (!safari.extension.baseURI.toLowerCase().startsWith(event.origin.toLowerCase())) {
            return;
        }

        if (event.data && event.data.type === 'topee_get_iframe_key') {
            childFrames.add(event.data.frameId, event.source);

            txtCrypto.readyPromise
                .then(() => txtCrypto.getKey())
                .then(function (key) {
                    if (event.source) {
                        event.source.postMessage({ type: 'topee_iframe_key', value: key}, event.origin);
                    }
                });
        }

        if (event.data && event.data.type === 'topee_iframe_request') {
            txtCrypto.decrypt(event.data.value)
                .then(function (str) {
                    var message = JSON.parse(str);

                    var messageId = event.data.messageId;
                    if (typeof messageId !== 'undefined') {
                        safari.self.addEventListener("message", listener);
                    }

                    // the correct tabId should already be there
                    safari.extension.dispatchMessage(message.name, message.value);

                    function listener(responseEvent) {
                        if (responseEvent.name === 'response' && responseEvent.message.messageId === messageId) {
                            txtCrypto.encrypt(JSON.stringify(responseEvent.message))
                                .then(function (e) {
                                    if (event.source) {
                                        event.source.postMessage({ type: 'topee_iframe_response', value: e}, event.origin);
                                    }
                                });
                            safari.self.removeEventListener("message", listener);
                        }
                    }
            });
        }
    });
}

function sendMessage(frameId, message) {
    var win = childFrames.get(frameId);
    if (!win) {
        window.topee_log && console.log('frame', frameId, 'not found');
        return;
    }
    txtCrypto.readyPromise
        .then(() => txtCrypto.encrypt(JSON.stringify(message)))
        .then(m => win.postMessage({ type: 'topee_iframe_request', value: m }, '*'));  // '*' is ok, it's encrypted
}

function broadcastMessage(message) {
    var children = childFrames.getAll();
    if (children.length == 0) {
        return;  // no recipients
    }
    txtCrypto.readyPromise
        .then(() => txtCrypto.encrypt(JSON.stringify(message)))
        .then(m => children.forEach(win => win.postMessage({ type: 'topee_iframe_request', value: m }, '*')));  // '*' is ok, it's encrypted
}


module.exports = {
    install: install,
    hasChild: function (frameId) { return !!frameId && !!childFrames.get(frameId); },
    forward: sendMessage,
    broadcast: broadcastMessage
};


/***/ }),

/***/ 43:
/***/ (function(module, exports, __webpack_require__) {

var bin = __webpack_require__(44);
var bc = __webpack_require__(45);

module.exports = class TextCrypto {
    constructor(key) {
        if (!key) {
            this.readyPromise = bin.createKey().then(function (key) { return this.key = key; }.bind(this));
        }
        else {
            this.readyPromise = bin.importKey(key).then(function (key) { return this.key = key; }.bind(this));
        }
    }

    ready() {
        return !!this.key;
    }


    getKey() {
        return bin.exportKey(this.key);
    }

    /// @return { data: base64, salt: base64 }
    encrypt(str) {
        var salt = bin.createSalt();
        return bin.encrypt(bc.str2arrayBuffer(encodeURI(str)), salt, this.key)
            .then(function (ab) {
                return {
                    data: bc.arrayBuffer2base64(ab),
                    salt: bc.uint8array2base64(salt)
                };
            });
    }

    /// dataObj: { data: base64, salt: base64 }
    decrypt(dataObj) {
        return bin.decrypt(bc.base642arrayBuffer(dataObj.data), bc.base642uint8array(dataObj.salt), this.key)
            .then(function (ab) { return decodeURI(bc.arrayBuffer2str(ab)); });
    }
};


/***/ }),

/***/ 44:
/***/ (function(module, exports) {

// see https://github.com/diafygi/webcrypto-examples#aes-cbc---generatekey

function createSalt() {
  return crypto.getRandomValues(new Uint8Array(16));  // direct value, not a promise
}

function createKey() {
  return crypto.subtle.generateKey(
    {
      name: 'AES-CBC',
      length: 256
    },
    true,
    [ 'encrypt', 'decrypt' ]);
}

function importKey(jwkKey) {
  return crypto.subtle.importKey(
    "jwk",
    {
        kty: "oct",
        k: jwkKey,
        alg: "A256CBC",
        ext: true,
    },
    {
        name: "AES-CBC",
    },
    true,
    ["encrypt", "decrypt"]);
}

function exportKey(key) {
  return crypto.subtle.exportKey(
    "jwk",
    key
  ).then(function (jwkKey) { return jwkKey.k; });
}

function encrypt(arrayBufferata, ui8aSalt, key) {
  return crypto.subtle.encrypt(
    {
      name: 'AES-CBC',
      iv: ui8aSalt
    },
    key,
    arrayBufferata);
}

function decrypt(arrayBufferData, ui8aSalt, key) {
  return crypto.subtle.decrypt(
    {
      name: 'AES-CBC',
      iv: ui8aSalt
    },
    key,
    arrayBufferData);
}

module.exports = {
  createSalt: createSalt,
  createKey: createKey,
  importKey: importKey,
  exportKey: exportKey,
  encrypt: encrypt,
  decrypt: decrypt
};


/***/ }),

/***/ 45:
/***/ (function(module, exports) {

function uint8array2str(ua) {
  var chars = [];
  ua.forEach(function (byte) { chars.push(String.fromCharCode(byte)); });
  return chars.join('');
}

function arrayBuffer2str(ab) {
  return uint8array2str(new Uint8Array(ab));
}

function str2uint8array(s) {
  return new Uint8Array([].map.call(s,function(x){var c = x.charCodeAt(0); if (c > 0xFF) throw s + ': cannot convert non-ASCII character'; return c; }));
}

function str2arrayBuffer(s) {
  return str2uint8array(s).buffer;
}


function uint8array2base64(ua) {
  return btoa(uint8array2str(ua));
}

function arrayBuffer2base64(ab) {
  return btoa(arrayBuffer2str(ab));
}

function base642uint8array(b64) {
  return str2uint8array(atob(b64));
}

function base642arrayBuffer(b64) {
  return str2arrayBuffer(atob(b64));
}

module.exports = {
  uint8array2str: uint8array2str,
  arrayBuffer2str: arrayBuffer2str,

  str2uint8array: str2uint8array,
  str2arrayBuffer: str2arrayBuffer,

  uint8array2base64: uint8array2base64,
  arrayBuffer2base64: arrayBuffer2base64,

  base642uint8array: base642uint8array,
  base642arrayBuffer: base642arrayBuffer
};


/***/ }),

/***/ 46:
/***/ (function(module, exports, __webpack_require__) {

// Low-level communication bridge with background script

var tabInfo = __webpack_require__(37);

var bridge = {};

function dispatchRequest(tabId, payload, callback) {
    var messageId = payload.messageId || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

    if (callback) {
        listener.messageId = messageId;  // this is needed for iframe-resources.js communication
        safari.self.addEventListener('message', listener);
    }

    payload.tabId = tabId;
    payload.messageId = messageId;
    payload.frameId = tabInfo.frameId;
    payload.url = window.location.href;

    safari.extension.dispatchMessage('request', {
        tabId: tabId,
        payload: payload
    });

    function listener(event) {
        if (event.name === 'response' && event.message.messageId === messageId) {
            callback(event.message.payload);
            safari.self.removeEventListener('message', listener);
        }
    }
}

bridge.dispatchRequest = function(payload, callback) {
    tabInfo.tabId.then(tabId => {
        dispatchRequest(tabId, payload, callback);
    });
};

tabInfo.tabId.then(tabId => {
    bridge.dispatchRequest = function (payload, callback) {
        dispatchRequest(tabId, payload, callback);
    };
});

module.exports = bridge;


/***/ }),

/***/ 47:
/***/ (function(module, exports) {

// https://developer.chrome.com/extensions/i18n

var i18n = {};

i18n.getUILanguage = function () {
    return navigator.language;
};

// TODO: Implementation
// this may be impossible to implement nicely:
// * either you have to include the language files in Info.plist for content scripts and reference them for resource iframes
// * or you cannot call getMessage before the translations are loaded
i18n.getMessage = function (messageName) {
    return messageName;
};

// TODO: Implementation
i18n.detectLanguage = function (text, callback) {
    callback({
        isReliable: true,
        languages: [
            {language: "en", percentage: 100}
        ]
    });
};

module.exports = i18n;


/***/ }),

/***/ 48:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const background = __webpack_require__(46);

var tabs = {};

tabs.query = function(queryInfo, callback) {
    background.dispatchRequest({
        eventName: 'tabs.query',
        queryInfo: queryInfo
    }, callback);
};

module.exports = tabs;


/***/ }),

/***/ 64:
/***/ (function(module, exports, __webpack_require__) {

(function () {
'use strict';

var TextCrypto = __webpack_require__(43);

var txtCrypto = null;
var buffer = [];
var freshListeners = {};
var pendingResponseListeners = [];

if (typeof window.ApplePayError === 'undefined' && typeof window.WebKitNamespace === 'undefined') {
    return;  // not safari
}

if (typeof safari === 'undefined')
    window.safari = {};

if (typeof safari.extension === 'undefined')
    safari.extension = {};

if (typeof safari.self === 'undefined')
    safari.self = {};

if (typeof safari.extension.dispatchMessage === 'undefined') {
    safari.extension.dispatchMessage = txtCrypto ? dispatchMessage : bufferMessage;
}

if (typeof safari.self.addEventListener === 'undefined') {
    safari.self.addEventListener = function (type, callback) {
        if (type !== 'message') {
            console.error('Unexpected message listener:', type);
            return;
        }

        if (callback && callback.messageId) {
            freshListeners[callback.messageId] = true;
            setTimeout(function () {
                delete freshListeners[callback.messageId];
            }, 1000);  // to prevent leaks
        }

        pendingResponseListeners.push({ type: type, safariCallback: callback, decryptingCallback: decryptingCallback });
        window.addEventListener('message', decryptingCallback);

        function decryptingCallback(event) {
            if (event.data && event.data.type === 'topee_iframe_response') {
                txtCrypto.decrypt(event.data.value)
                    .then(function (str) {
                        var payload = JSON.parse(str);

                        if (payload.messageId === callback.messageId)  {
                            window.removeEventListener('message', callback);
                            callback({ name: payload.eventName, message: { messageId: payload.messageId, payload: payload.payload } });
                        }
                });
            }
            else if (event.data && event.data.type === 'topee_iframe_request') {
                txtCrypto.decrypt(event.data.value)
                    .then(function (str) {
                        var payload = JSON.parse(str);

                        callback({ name: payload.eventName, message: { messageId: payload.messageId, payload: payload.payload } });
                });
            }
        }
    };

    safari.self.removeEventListener = function(type, callback) {
        var i = pendingResponseListeners.findIndex(function (p) {
            return p.type === type && p.safariCallback === callback;
        });
        if (i != -1) {
            window.removeEventListener('message', pendingResponseListeners[i].decryptingCallback);
            pendingResponseListeners.splice(i, 1);
        }
        else {
            window.topee_log && console.log('listener for', type, 'not found');
        }
    };
}

window.addEventListener('message', function (event) {
    if (event.data.type === 'topee_iframe_key' && event.data.value) {
        if (txtCrypto) {
            console.error('cannot overwrite encryption key');
            return;
        }

        txtCrypto = new TextCrypto(event.data.value);
        txtCrypto.readyPromise
            .then(function () {
                safari.extension.dispatchMessage = dispatchMessage;
                while (buffer.length > 0) {
                    dispatchMessage.apply(window, buffer.shift());
                }
            })
            .catch(function (ex) {
                console.error(ex);
                txtCrypto = null;
            });
    }
});

var tabInfo = __webpack_require__(37);
tabInfo.init();

window.parent.postMessage({ type: 'topee_get_iframe_key', frameId: tabInfo.frameId }, '*');

window.chrome = __webpack_require__(38);


function bufferMessage(name, value) {
    buffer.push([ name, value ]);
}

function dispatchMessage(name, value) {
    var messageId = null;

    if (value && value.payload) {
        messageId = value.payload.messageId;

        if (typeof messageId === 'undefined' || !freshListeners[messageId]) {
            messageId = null;
        }

        delete freshListeners[messageId];
    }

    txtCrypto.encrypt(JSON.stringify({ name: name, value: value }))
        .then(function (e) {
            var msg = { type: 'topee_iframe_request', value: e };
            if (messageId !== null) {
                msg.messageId = messageId;  // to indicate that a response is awaited
            }
            window.topee_log && console.log('sending', msg);
            window.parent.postMessage(msg, '*');
        });
}

})();


/***/ })

/******/ });