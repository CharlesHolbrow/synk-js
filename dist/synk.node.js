(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("eventemitter3"), require("kefir"), require("ws"));
	else if(typeof define === 'function' && define.amd)
		define([, , "ws"], factory);
	else if(typeof exports === 'object')
		exports["synk"] = factory(require("eventemitter3"), require("kefir"), require("ws"));
	else
		root["synk"] = factory(root[undefined], root[undefined], root[undefined]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_7__) {
return /******/ (function(modules) { // webpackBootstrap
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
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
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
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(WebSocket) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventemitter = __webpack_require__(1);

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _kefir = __webpack_require__(2);

var _kefir2 = _interopRequireDefault(_kefir);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// How long do we wait before retrying a connection
var TIMEOUT = 500;

/**
* Wrap a websocket connection to the server
*/

var Connection = function (_Emitter) {
  _inherits(Connection, _Emitter);

  /**
  * Create a new instance of a connection.
  *
  * Events
  * - 'connect' - fired the first time a connection opens successfullly
  * - 'reconnect' - fired when subsequenct connections open
  * - 'open' - fired when any connection opens
  * - 'close' - fired when any connection closes
  * - 'sendError' (message) - we tried to send, but the connection is closed
  *
  * @arg {string} url - websocket url to connect to
  */
  function Connection(url) {
    _classCallCheck(this, Connection);

    /**
    * @member {url} string - the url we connect to on the next connection
    */
    var _this = _possibleConstructorReturn(this, (Connection.__proto__ || Object.getPrototypeOf(Connection)).call(this));

    _this.url = url;

    /**
    * @member {Kefir.stream} - stream of messages received from the server
    * @readonly
    */
    _this.stream = _kefir2.default.fromEvents(_this, 'message');

    /**
    * @member {WebSocket} - The current socket object
    * @readonly
    */
    _this.sock = null;

    /**
     * @member {Kefir.stream} - event each time the connection is opened
     * @readonly
     */
    _this.openStream = _kefir2.default.fromEvents(_this, 'open');

    _this._connectionCount = 0;
    _this._log = [];
    _this._messageQue = [];
    _this._connect();
    return _this;
  }

  /**
  * Connect and stay connected. This is called once by the constructor. It
  * should not be called again manually.
  */


  _createClass(Connection, [{
    key: '_connect',
    value: function _connect() {
      var _this2 = this;

      this.log('connecting...');
      this.sock = new WebSocket(this.url);

      var reconnect = function reconnect() {
        _this2.log('Waiting to reconnect...');
        setTimeout(function () {
          _this2._connect();
        }, TIMEOUT);
      };

      this.sock.onerror = function (error) {
        _this2.log(['socket error', error]);
      };

      this.sock.onopen = function () {
        _this2.log('connection opened');
        _this2.sock.onmessage = function (m) {
          _this2.emit('message', JSON.parse(m.data));
        };

        _this2._connectionCount += 1;
        if (_this2._connectionCount === 1) {
          // If this is our first time connecting, send qued messages
          while (_this2._messageQue.length) {
            _this2.send(_this2._messageQue[0]);
            _this2._messageQue.shift();
          }
          _this2.emit('connect');
        } else _this2.emit('reconnect');

        _this2.emit('open');
      };

      // This fires if even if the connection was never opened. For example, if
      // the server is down when we first connect, onclose will still fire.
      this.sock.onclose = function () {
        _this2.log('close');
        _this2.emit('close');
        reconnect();
      };
    }

    /**
    * @arg {anything} value - Add any value to this connection's internal log
    */

  }, {
    key: 'log',
    value: function log(value) {
      this._log.push(value);
      this.emit('log', value);
      if (this._log.length > 200) this._log.shift();
    }

    /**
    * Get the Ready State Constant of the current socket. One of the following ints:
    * 0 - CONNECTING The connection is not yet open.
    * 1 - OPEN The connection is open and ready to communicate.
    * 2 - CLOSING The connection is in the process of closing.
    * 3 - CLOSED The connection is closed or couldn't be opened.
    *
    * @returns {number} - Ready State Constant
    */

  }, {
    key: 'send',


    /**
    * Send a message to the server. If the connection is not yet open, que the
    * message to be sent once the connection does open.
    *
    * @arg {Object|String} message - JSON object or string to send to the server.
    * @returns {bool|null} - true if the message was sent successfully. null if the
    *          message was qued to be sent later. False if send failed.
    */
    value: function send(message) {
      if (typeof message !== 'string') message = JSON.stringify(message);

      if (this.state === 1) {
        // We are connected
        this.sock.send(message);

        return true;
      }

      // we are not connected
      if (this._connectionCount === 0) {
        // We have never been connected
        this._messageQue.push(message);
        this.log(['message qued', message]);

        return null;
      }

      // We tried to send, but the connection was broken
      this.log({ reason: 'send failed because the connection was broken:', msg: message });
      this.log(message);
      this.emit('sendError', message);

      return false;
    }
  }, {
    key: 'state',
    get: function get() {
      if (!this.sock) return 3;

      return this.sock.readyState;
    }
  }]);

  return Connection;
}(_eventemitter2.default);

exports.default = Connection;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(7)))

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventemitter = __webpack_require__(1);

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _kefir = __webpack_require__(2);

var _kefir2 = _interopRequireDefault(_kefir);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
* Base for classes that respond to a stream.
*
* Extending Endpoint give us the ability make remote proceedure calls on class
* instances by sending msg objects to a Kefir.stream. Extension classes define
* methods that can be called by sending messages to the stream.
*
* An endpoint instance may only listen to one class at a time
*/
var Endpoint = function (_Emitter) {
  _inherits(Endpoint, _Emitter);

  /**
  * Create an Endpoint. Usually this will be called via super()
  */
  function Endpoint() {
    _classCallCheck(this, Endpoint);

    var _this = _possibleConstructorReturn(this, (Endpoint.__proto__ || Object.getPrototypeOf(Endpoint)).call(this));

    _this._subsciption = null;
    _this._inputStream = null;
    _this._unhandledStream = null;
    _this.unhandled = new _kefir2.default.Pool();
    return _this;
  }

  /**
  * Listen for incoming rpc calls on a stream. A class instance may only listen
  * to one stream at a time. To unsubscribe from the current stream call
  * subscribe() with no argument
  *
  * @arg {[Kefir.stream]} stream - the stream to subscribe to. If we are
  *      subscribed to another stream, unsubscribe from it. Messages on the
  *      stream are expected to include a {method: 'methodName'} parameter. The
  *      methodName should match a method on the class. It will be called with
  *      the entire message as the only argument.
  */


  _createClass(Endpoint, [{
    key: 'subscribe',
    value: function subscribe(stream) {
      var _this2 = this;

      if (this._subsciption) this._subsciption.unsubscribe();

      if (this._unhandledStream) this.output.unplug(this._unhandledStream);

      stream = stream || null;
      this._inputStream = stream;

      if (!stream) return;

      // We now create two derivative streams. The first handles messages if this
      // class has an appropriate handler given the message's '.method' parameter.
      // We observe this stream, and leave a reference to the subscription so we
      // can unsubscribe if we are passed different stream to monitor.
      this._subsciption = stream.filter(function (msg) {
        return typeof _this2[msg.method] === 'function';
      }).observe({
        value: function value(msg) {
          _this2[msg.method](msg);
        },
        error: function error(msg) {
          console.error(msg);
        },
        end: function end(msg) {
          console.warn(msg);
        }
      });

      // The second derivative stream passes unhandled messages to the endpoint's
      // .output stream. Keep a reference to the unhandled stream so we can unplug
      // it from the output pool when we subscribe to a new stream.
      this._unhandledStream = stream.filter(function (msg) {
        return typeof _this2[msg.method] !== 'function';
      });
      this.unhandled.plug(this._unhandledStream);
    }

    /**
    * Get the stream of our current subscription.
    * @readonly
    * @returns {Kefir.stream} - current subscription. null if not subscribed.
    */

  }, {
    key: 'stream',
    get: function get() {
      return this._inputStream;
    }
  }]);

  return Endpoint;
}(_eventemitter2.default);

exports.default = Endpoint;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Default Leaf object. If an object is created on 
 */
var Leaf = function () {
  /**
   * @param {string} key - The objects key
   * @param {object} state - the objects initial state
   * @param {synk-js.Objects} synkObjects - the parent synk-js Objects container
   */
  function Leaf(key, state) {
    _classCallCheck(this, Leaf);

    this.state = {};
    this.update(state);
  }
  /**
   * Update is called when the server changes the object
   * @param {object} diff - changes to be applied to the object
   */


  _createClass(Leaf, [{
    key: 'update',
    value: function update(diff) {
      Object.assign(this.state, diff);
    }

    /**
     * Called when the object will be destroyed or removes from the current
     * subscription. Your implementation of this function must remove references
     * to the object from your project so that the object will be garbage
     * collected correctly.
     */

  }, {
    key: 'teardown',
    value: function teardown() {
      console.log('teardown:', this);
    }
  }]);

  return Leaf;
}();

/**
 * Branch is part of a tree-like Data structure. Each branch contains any number
 * of children. Each child is either a Branch or a Leaf. Each child is
 * identified by a name string. In this implementation, Leaves are any
 * javascript Object that satisfy the Leaf interface above.
 *
 * Each Branch has a special property called 'class'. This is the recommended
 * class for Leaf objects. Leaf objects may or may not be created with the
 * recommended class. When we create new Branches with `b.create(...)`, child
 * branches inherit the parent's 'class' property.
 */


var Branch = function () {
  /**
   * @param {Class} [cls] - Optional class. Default is Object.
   */
  function Branch(cls) {
    _classCallCheck(this, Branch);

    this.branches = {};
    this.leaves = {};
    this._class = cls || Leaf;
  }

  /**
   * Retrieve the recommended class for child leaves attached to this object.
   */


  _createClass(Branch, [{
    key: 'createBranch',


    /**
     * Returns the Branch or identified by a name. The example below returns
     * the child identified by the name 'alice'. If 'alice' does not exist on the
     * Branch, a new child Branch called 'alice' will be created.
     *
     * `b.get('alice') \\ returns the branch or child named alice`
     *
     * A longer address can be specified in the format below. This will create new
     * Branches and sub-Branches if needed:
     *
     * `b.get('alice', 'ice cream' 'other')`
     *
     * In any format, the last name specified may be the name of an existing Leaf.
     * All preceeding names must be Branch names.
     *
     * @param {String} n1 - the name we are trying to get.
     * @param {...String} n2 - remaining sub branch names.
     * @returns {Branch} - the Branch or Leaf we requested.
     */
    value: function createBranch(n1) {
      var _branches$n;

      for (var _len = arguments.length, n2 = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        n2[_key - 1] = arguments[_key];
      }

      if (n1 === undefined) return this;

      if (!this.branches.hasOwnProperty(n1)) {
        // We now know that the value at this[n1] is not our 'own' property.
        // It is either not present, or n1 is not a valid name.
        if (this.branches[n1] === undefined) this.branches[n1] = new Branch(this.class);else throw new Error('Illegal branch name: ' + n1);
      }

      // We know n1 exists, and is a valid name.
      if (!n2 || !n2.length) return this.branches[n1];

      return (_branches$n = this.branches[n1]).createBranch.apply(_branches$n, n2);
    }

    /**
     * Recursively step through the tree. If any Branch is found that has no
     * leaves, remove that branch.
     * @returns {Number} - the number of objects that were removed.
     */

  }, {
    key: 'trim',
    value: function trim() {
      var count = 0;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(this.branches)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var name = _step.value;

          count = count + this.branches[name].trim();
          if (!Object.keys(this.branches[name].leaves).length) {
            delete this.branches[name];
            count++;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return count;
    }

    /**
     * Recursively iterate over this branch, and call a function on each leaf. The
     * function will be called in the format:
     *
     * `f(leaf, ...args)`
     *
     * @param {function} f - predicate function will be called with each leaf
     * @param {...any} args - additional arguments to the predicate function
     */

  }, {
    key: 'forEach',
    value: function forEach(f) {
      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = Object.keys(this.branches)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _branches$name;

          var name = _step2.value;

          (_branches$name = this.branches[name]).forEach.apply(_branches$name, [f].concat(args));
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = Object.keys(this.leaves)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _name = _step3.value;

          f.apply(undefined, [this.leaves[_name]].concat(args));
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }

    /**
     * Retrieve a branch by its address. Example:
     *
     * `b.get('alice', 'bob', 'cat'); // Get this.alice.bob.cat`
     *
     * @param {...String} all - the address of Branch to get.
     * @returns {Branch|Object|null} - A Branch or Leaf. Null if not found
     */

  }, {
    key: 'getBranch',
    value: function getBranch() {
      for (var _len3 = arguments.length, all = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        all[_key3] = arguments[_key3];
      }

      if (!all || all.length === 0) return this;else if (all.length === 1) {
        if (this.branches.hasOwnProperty(all[0])) return this.branches[all[0]];

        return null;
      }

      var first = this.branches[all[0]];

      if (first instanceof Branch) return first.getBranch.apply(first, _toConsumableArray(all.slice(1)));

      return null;
    }

    /**
     * Remove a child Branch from this branch. If we specify a longer address,
     * only the tip of the address specified will be removed. The example below
     * removes 'cat' from 'bob', but does not remove 'bob' from 'alice'.
     *
     * `b.remove('alice', 'bob', 'cat')`
     *
     * @param {...String} all - the address of the Branch or Leaf we want to
     *        remove. The parent of this object must be a Branch.
     * @returns {Branch|null} - The Branch that was removed. Null if not found.
     */

  }, {
    key: 'removeBranch',
    value: function removeBranch() {
      var parent = void 0;

      for (var _len4 = arguments.length, all = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        all[_key4] = arguments[_key4];
      }

      if (all.length === 1) parent = this;else parent = this.getBranch.apply(this, _toConsumableArray(all.slice(0, -1)));

      if (!parent) return null;

      var name = all[all.length - 1];

      if (!parent.branches.hasOwnProperty(name)) return null;

      var obj = parent.branches[name];

      delete parent.branches[name];

      return obj;
    }

    /**
     * Non recursive leaf retrevial. Returns null if the branch has no children
     * with the given name, OR if the name points to another branch
     * @param {String|null} name - the name of the leaf we are looking for;
     * @returns {Object|null} - null if this does not have a branch
     */

  }, {
    key: 'getLeaf',
    value: function getLeaf(name) {
      if (this.leaves.hasOwnProperty(name)) return this.leaves[name];

      return null;
    }

    /**
     * Set a Leaf in this branch.
     * @param {String} name - Name of the object we are interested in
     * @param {Object} obj - Object we are setting.
     */

  }, {
    key: 'setLeaf',
    value: function setLeaf(name, obj) {
      if (obj === null || obj === undefined) this.removeLeaf(name);else this.leaves[name] = obj;
    }

    /**
     * @param {String} name - key name of the leaf to remove
     */

  }, {
    key: 'removeLeaf',
    value: function removeLeaf(name) {
      delete this.leaves[name];
    }
  }, {
    key: 'class',
    get: function get() {
      return this._class;
    }

    /**
     * Update the Branches class. Throw if v is not a function.
     * @param {function} v - the constructable function
     */
    ,
    set: function set(v) {
      if (typeof v !== 'function') throw new Error('Class must be a function');
      this._class = v;
    }
  }]);

  return Branch;
}();

exports.default = Branch;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Endpoint2 = __webpack_require__(3);

var _Endpoint3 = _interopRequireDefault(_Endpoint2);

var _Branch = __webpack_require__(4);

var _Branch2 = _interopRequireDefault(_Branch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Store a collection of objects that will be synchronized with the server.
 * The lifecycle of an object is
 * 1. receive addObj message from server
 *     - create `new constructor(key, state, this)`
 *     - add to objects .byKey an .bySKey branches
 *     - emit('add', obj, addObjMessage)
 * 2. receive modObj message from server (0 or more times)
 *   If the object is not moving hunks
 *     - call objects .update(state) method
 *     - emit('mod', obj, msg)
 *   Or if the object is moving to a hunk we are subscribed to
 *     - move the object to a different subscription key
 *     - call objects .update(state) method
 *     - emit('mod', obj, msg)
 *   Or if the object is moving to a area we are not subscribed to
 *     - remove the object
 *     - emit('rem', obj, msg)
 *     - obj.teardown() method
 * 3. receive remObj message from server OR unsubscribe from hunk
 *    - remove object
 *    - emit('rem', obj, msg) // msg will be null if we unsubscribed
 *    - obj.teardown()
 *
 * NOTE:
 * - When adding an object first we create it, then we emit it
 * - When removing an object first we emit it, then we .teardown()
 *
 *  @event add
 *  @event mod
 *  @event rem
 */
var Objects = function (_Endpoint) {
  _inherits(Objects, _Endpoint);

  /**
   * Create an Objects instance
   */
  function Objects() {
    _classCallCheck(this, Objects);

    var _this = _possibleConstructorReturn(this, (Objects.__proto__ || Object.getPrototypeOf(Objects)).call(this));

    _this.bySKey = new _Branch2.default();
    _this.byKey = new _Branch2.default();
    _this.byId = {};

    // queuedMessages is for storing messages that target an object that we have
    // not yet received. Messages that arrive out of order after addObj has been
    // received should be stored on the object itself, so they can be garbage
    // collected correctly.
    // As of November 5, 2017, unordered mod messages that arrive after addObj
    // are not supported. However, support may be added in the future.
    _this.queuedMessages = {};
    return _this;
  }

  /**
   * Update the set of keys that we are subscribed to.
   *
   * Note that this is usually called from client via the synk.resolve() method.
   * We should be able to call this from the server, but this behavior is
   * untested. I have not thought through the logic of how this could be called
   * from the server.
   *
   * @param {Object} updateSubscriptionMsg - Object containing subscription
   *        change. The object must have two arrays of strings: .add and .remove
   */


  _createClass(Objects, [{
    key: 'updateKeys',
    value: function updateKeys(updateSubscriptionMsg) {
      var _this2 = this;

      var msg = updateSubscriptionMsg;

      if (!Array.isArray(msg.remove) || !Array.isArray(msg.add)) console.error('Objects.updateKeys received invalid message:', msg);

      // When we unsubscribe from a chunk, we need to remove and teardown all the
      // objects in that chunk.
      msg.remove.forEach(function (p) {
        // Remove the enture chunk
        _this2.bySKey.removeBranch(p).forEach(function (leaf) {
          var _byKey;

          // Remove each object from its collection
          var parts = leaf.t.split(':');
          var collection = (_byKey = _this2.byKey).getBranch.apply(_byKey, _toConsumableArray(parts)); // The group of objects in that type

          // If the collection doesn't exist, we have bug
          if (!collection) console.error('Unsubscribed from chunk, but collection not found: ' + leaf.t);

          _this2.removeObject(leaf, collection, null, null);
        });
      });

      msg.add.forEach(function (p) {
        _this2.bySKey.createBranch(p);
      });
    }

    /**
     * Get an object from this synk collection. This may return null if the object
     * was not found.
     *
     * @param {string} key - the full key of the object we want 'type:key:id'
     * @returns {Object|null} - the object if it exists, or null
     */

  }, {
    key: 'get',
    value: function get(key) {
      var _byKey2;

      var obj = this.byId[key];

      if (obj) return obj;

      var parts = key.split(':');
      var id = parts.pop();
      var collection = (_byKey2 = this.byKey).getBranch.apply(_byKey2, _toConsumableArray(parts));

      if (!collection) return null;

      return collection.getLeaf(id) || null;
    }

    /**
     * Synk Objects does not assume that messages will arrive in the correct
     * order. When we recieve a message, it is possible that we have not yet
     * received the ssociated addObj message. It is also possible that we do
     *
     * Append a message to the queue for a given object. Whenever an object is
     * added OR a modification is applied. We will check to see if there are
     * queued messages that should be replayed.
     *
     * This function should probably never be called except by methods of the
     * Objects class.
     *
     * @param {Object} msg - mod message. In the future we may also support
     *        rem messages.
     */

  }, {
    key: 'queueMessage',
    value: function queueMessage(msg) {
      var queue = void 0;
      var id = msg.key || msg.id;

      if (this.queuedMessages.hasOwnProperty(id)) queue = this.queuedMessages[id];else {
        queue = [];
        this.queuedMessages[id] = queue;
      }

      queue.push(msg);
    }

    /**
     * Apply all possible messages from the queue.
     *
     * If any messages are found to be obsolete before reading a applicable
     * message, discard those messages.
     *
     * Once any messages are applied, IF the queue is empty delete it's list from
     * this.queuedMessages
     *
     * @param {Object} obj - this is a synk object with update(state) and
     *        teardown() methods.
     */

  }, {
    key: 'applyQueuedMessages',
    value: function applyQueuedMessages(obj) {
      var id = obj.key || obj.id;

      if (!this.queuedMessages.hasOwnProperty(id)) return;
      var queue = this.queuedMessages[id].filter(function (m) {
        return m.v > obj.v;
      }).sort(function (a, b) {
        return a.v - b.v;
      });

      this.queuedMessages[id] = queue;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = queue.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = _slicedToArray(_step.value, 2),
              i = _step$value[0],
              msg = _step$value[1];

          var target = obj.v + 1;

          if (msg.v === target) {
            // This is actually pretty sneaky. Normally we cannot modify an array
            // while iterating over it. However, in this case we only remove the
            // FIRST match, and then break out of the loop -- so it should be okay.
            if (msg.method === 'mod') this.mod(msg);else this.modObj(msg);
          } else if (msg.v >= target) {
            queue.splice(0, i); // leave only unapplied messages.
            console.error('DANGER: failed to replay all modObj messages:', queue);
            break;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      delete this.queuedMessages[id];
    }

    /**
     * Create a new object. Typically called from the server.
     *
     * Note that when we add an object, the .id .t and .v properties are
     * automatically set. The Objects class depends on these being available
     * when removing the object, so they should not be changed by client code.
     *
     * @param {Object} msg - contains .v .id, .state, .sKey. The presence of
     *        .psKey indicates this object moved here from another chunk.
     */

  }, {
    key: 'add',
    value: function add(msg) {
      var _byKey3;

      if (typeof msg.sKey !== 'string' || typeof msg.id !== 'string') {
        console.error('Received invalid add message', msg);

        return;
      }

      var chunk = this.bySKey.getBranch(msg.sKey);
      var collection = (_byKey3 = this.byKey).createBranch.apply(_byKey3, _toConsumableArray(msg.t.split(':')));

      // Check if we are subscribed
      if (!chunk) {
        console.warn('Received "add" message from the server, while not ' + 'subscribed to the object\'s subscription key');

        return;
      }

      // Check if we already have this object
      var obj = collection.getLeaf(msg.id);

      if (obj) {
        console.error('The server sent us an add message, but we alredy had ' + ('the object locally: ' + msg.id));
        // TODO: Should we remove and teardown c intead of throwing an error??
        throw new Error('TODO: remove and teardown c');
      }

      obj = new collection.class(msg.id, msg.state, this, msg.t);
      obj.id = msg.id;
      obj.t = msg.t;
      obj.v = msg.v;

      chunk.setLeaf(msg.id, obj);
      collection.setLeaf(msg.id, obj);
      this.byId[obj.id] = obj;

      this.emit('add', obj, msg);
      this.applyQueuedMessages(obj);
    }

    /**
     * Remove an object. Usually called by the server.
     * @param {Object} msg - obj containing .id .t and .sKey
     */

  }, {
    key: 'rem',
    value: function rem(msg) {
      var _byKey4;

      if (typeof msg.sKey !== 'string' || typeof msg.id !== 'string') {
        console.error('Received invalid remObj message', msg);

        return;
      }

      var parts = msg.t.split(':');
      var id = msg.id;
      var chunk = this.bySKey.getBranch(msg.sKey); // current chunk
      var collection = (_byKey4 = this.byKey).getBranch.apply(_byKey4, _toConsumableArray(parts));
      var obj = collection.getLeaf(id);

      if (!chunk) console.error('Tried to remove ' + msg.sKey + ', but could not find objects at ' + parts);

      if (!collection) console.error('Tried to remove ' + id + ' but could not find ' + parts + ' in .byKey');

      if (obj) this.removeObject(obj, chunk, collection, msg);else console.error('DANGER: Tried to remove ' + msg.id + ', but could not find object');
    }

    /**
     * Modify an object. Usually called from the server.
     * @param {Object} msg containing .id .sKey .t .v and .diff. the presense of
     *        .nsKey indicates that the object is moving to a new subscription key
     */

  }, {
    key: 'mod',
    value: function mod(msg) {
      var _byKey5;

      if (typeof msg.sKey !== 'string' || typeof msg.id !== 'string') {
        console.error('Received invalid mod message', msg);

        return;
      }

      var id = msg.id;
      var obj = this.get(id);
      var chunk = this.bySKey.getBranch(msg.sKey); // current chunk

      // Do some sanity checks...

      if (!obj) {
        if (chunk) this.queueMessage(msg);else {
          // this is just a warning, because it will just happen occasionally.
          console.warn('We received a modObj request. We could not find the ' + ('object locally: ' + id + '. And the message targets an SKey we ') + 'are not subscribed to');
        }

        return;
      }

      var parts = obj.t.split(':');
      var collection = (_byKey5 = this.byKey).createBranch.apply(_byKey5, _toConsumableArray(parts));

      if (chunk.getLeaf(msg.id) !== obj) {
        console.error('Received modObj. The object was found on the ' + parts + ' ' + ('collection, but not the ' + msg.sKey + ' chunk.'));
        // Keep trying to move the object...
      }

      if (typeof msg.v !== 'number') {
        console.error('Received modObj message with a bad version: ' + msg.v);

        return;
      }

      // First check if the message is arriving at the right time. If our message
      // is obsolete, discard it.
      if (msg.v <= obj.v) {
        console.warn('Discarded obsolete message:', msg);

        return;
      }

      if (msg.v > obj.v + 1) {
        console.error('DANGER: Out of order messages are not supported after receieveing addObj', msg);

        return;
      }

      // We are definitely going to modify the object. We know that the msg's
      // version is exactly one more than the object's version.
      obj.v++;

      // At this point, There are 3 possiblities
      // - we are moving within a chunk. Easy -- just update
      // - we are moving to a new chunk. Remove this one chunk, add to another
      // - we are moving to a chunk, and are not subscribed to that chunk

      // Are we modifying within a chunk?
      if (!msg.nsKey) {
        obj.update(msg.diff);
        this.emit('mod', obj, msg);

        return;
      }

      // The object must be moved out of the current chunk. If we are subscribed
      // to the new chunk, move the object there. If we are not subscribed,
      // remove and teardown() the object.
      var newChunk = this.bySKey.getBranch(msg.nsKey);

      if (newChunk) {
        chunk.removeLeaf(id);
        newChunk.setLeaf(id, obj);
        obj.update(msg.diff);
        this.emit('mod', obj, msg);
      } else this.removeObject(obj, collection, chunk, msg);

      return;
    }

    /**
     * Remove object from up to two branches
     * - Causes teardown()
     * - emits 'rem', obj, msg
     *
     * @param {Object} obj - object to remove with .id
     * @param {[Branch]} branch1 - Optional first branch
     * @param {[Branch]} branch2 - Optional second branch
     * @param {[Object]} msg - The msg that triggered the removal. If provided
     *        this will emit along with the object
     */

  }, {
    key: 'removeObject',
    value: function removeObject(obj, branch1, branch2, msg) {
      if (branch1) branch1.removeLeaf(obj.id);
      if (branch2) branch2.removeLeaf(obj.id);

      delete this.byId[obj.id];

      this.emit('rem', obj, msg);

      obj.teardown();
    }
  }]);

  return Objects;
}(_Endpoint3.default);

exports.default = Objects;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Synk = exports.Objects = exports.Branch = exports.Endpoint = exports.Connection = undefined;

var _Connection = __webpack_require__(0);

var _Connection2 = _interopRequireDefault(_Connection);

var _Endpoint = __webpack_require__(3);

var _Endpoint2 = _interopRequireDefault(_Endpoint);

var _Branch = __webpack_require__(4);

var _Branch2 = _interopRequireDefault(_Branch);

var _Objects = __webpack_require__(5);

var _Objects2 = _interopRequireDefault(_Objects);

var _Synk = __webpack_require__(8);

var _Synk2 = _interopRequireDefault(_Synk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.Connection = _Connection2.default;
exports.Endpoint = _Endpoint2.default;
exports.Branch = _Branch2.default;
exports.Objects = _Objects2.default;
exports.Synk = _Synk2.default;

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_7__;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Objects = __webpack_require__(5);

var _Objects2 = _interopRequireDefault(_Objects);

var _Connection = __webpack_require__(0);

var _Connection2 = _interopRequireDefault(_Connection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Synk represents a connection to the synk server. Its responsibilities:
 * - create a connection to the server
 * - track a set of subscriptions keys
 * - store objects retrieved from the server
 *
 * The objects stored in this.objects will stay up-to-date with the copies on
 * the server.
 */
var Synk = function () {
  /**
   * @arg {string} url - the websocket url to connect to
   */
  function Synk(url) {
    var _this = this;

    _classCallCheck(this, Synk);

    this.objects = new _Objects2.default();
    this.connection = new _Connection2.default(url);

    this.objects.subscribe(this.connection.stream);

    this.active = {}; // currently active subscriptions
    this.pendingAdd = {};
    this.pendingRemove = {};

    this.connection.on('close', function () {
      // Our connection is closed, Prepare for the connection to re-open. Cache
      // the subscription keys we are currently subscribed to, and teardown all
      // existing objects.
      var current = _this.active;

      _this.objects.updateKeys({
        remove: Object.keys(_this.active),
        add: []
      });
      _this.active = {};

      // When we re-open, we want to re-subscribe to the correct collection of
      // keys. Resolve the .pendingAdd and .pendingRemove objects.
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(_this.pendingRemove)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var key = _step.value;

          if (current.hasOwnProperty(key)) delete current[key];
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = Object.keys(_this.pendingAdd)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _key = _step2.value;

          current[_key] = true;
        } // We know the collection of keys that we would like to be subscribed to.
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      _this.pendingAdd = current;
      _this.pendingRemove = {};
    });

    this.connection.on('open', function () {
      _this.resolve();
    });
  }

  /**
   * Given a set of keys that we want to subscribe to, calculate the difference
   * between the currently active subscription and the new desired subscription.
   * Store the result in this.pendingAdd and this.pendingRemove.
   *
   * @param {string[]} keys - all the keys that we want to subscribe to.
   */


  _createClass(Synk, [{
    key: 'setSubscription',
    value: function setSubscription(keys) {
      this.pendingAdd = {};
      this.pendingRemove = {};

      var newKeys = {};

      // convert keys array to object
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = keys[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var key = _step3.value;
          newKeys[key] = true;
        } // for each current key, check if we want to unsubscribe
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = Object.keys(this.active)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var activeKey = _step4.value;

          if (!newKeys.hasOwnProperty(activeKey)) {
            // we have a key that we do not want.
            this.pendingRemove[activeKey] = true;
          }
        }

        // For each new key, check if we have to add it
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = keys[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var newKey = _step5.value;

          if (!this.active.hasOwnProperty(newKey)) {
            // a key needs to be added
            this.pendingAdd[newKey] = true;
          }
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
    }

    /**
     * Try to resolve the subscription. If socket is not open, this will have no
     * effect. Note that resolve is always called when the connection opens or re-
     * opens.
     * 
     * @return {bool} - true if the message was sent or no change is needed
     */

  }, {
    key: 'resolve',
    value: function resolve() {
      var msg = {
        method: 'updateSubscription',
        add: Object.keys(this.pendingAdd),
        remove: Object.keys(this.pendingRemove)
      };

      // If msg.add and msg.remove are empty, our job is done.
      if (msg.add.length === 0 && msg.remove.length === 0) return true;

      // If the connection is not open, do nothing (wait for open event)
      if (this.connection.state !== 1) return false;
      // The connection is known to be open

      this.objects.updateKeys(msg);
      this.connection.send(msg);

      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = msg.add[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var key = _step6.value;

          this.active[key] = true;
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }

      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = msg.remove[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var _key2 = _step7.value;

          if (this.active.hasOwnProperty(_key2)) delete this.active[_key2];
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }

      this.pendingAdd = {};
      this.pendingRemove = {};

      return true;
    }
  }]);

  return Synk;
}();

exports.default = Synk;

/***/ })
/******/ ]);
});