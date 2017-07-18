import Emitter from 'eventemitter3';
import Kefir from 'kefir';

// How long do we wait before retrying a connection
const TIMEOUT = 500;

/**
* Wrap a websocket connection to the server
*/
export default class Connection extends Emitter {
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
  constructor(url) {
    super();

    /**
    * @member {url} string - the url we connect to on the next connection
    */
    this.url = url;

    /**
    * @member {Kefir.stream} - stream of messages received from the server
    * @readonly
    */
    this.stream = Kefir.fromEvents(this, 'message');

    /**
    * @member {WebSocket} - The current socket object
    * @readonly
    */
    this.sock = null;

    /**
     * @member {Kefir.stream} - event each time the connection is opened
     * @readonly
     */
    this.openStream = Kefir.fromEvents(this, 'open');

    this._connectionCount = 0;
    this._log = [];
    this._messageQue = [];
    this._connect();
  }

  /**
  * Connect and stay connected. This is called once by the constructor. It
  * should not be called again manually.
  */
  _connect() {
    this.log('connecting...');
    this.sock = new WebSocket(this.url);

    const reconnect = () => {
      this.log('Waiting to reconnect...');
      setTimeout(() => {
        this._connect();
      }, TIMEOUT);
    };

    this.sock.onerror = (error) => {
      this.log(['socket error', error]);
    };

    this.sock.onopen = () => {
      this.log('connection opened');
      this.sock.onmessage = (m) => {
        this.emit('message', JSON.parse(m.data));
      };

      this._connectionCount += 1;
      if (this._connectionCount === 1) {
        // If this is our first time connecting, play send qued messages
        while (this._messageQue.length) {
          this.send(this._messageQue[0]);
          this._messageQue.shift();
        }
        this.emit('connect');
      } else
        this.emit('reconnect');

      this.emit('open');
    };

    // This fires if even if the connection was never opened. For example, if
    // the server is down when we first connect, onclose will still fire.
    this.sock.onclose = () => {
      this.log('close');
      this.emit('close');
      reconnect();
    };
  }

  /**
  * @arg {anything} value - Add any value to this connection's internal log
  */
  log(value) {
    this._log.push(value);
    this.emit('log', value);
    if (this._log.length > 200)
      this._log.shift();
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
  get state() {
    if (!this.sock) return 3;

    return this.sock.readyState;
  }

  /**
  * Send a message to the server. If the connection is not yet open, que the
  * message to be sent once the connection does open.
  *
  * @arg {Object|String} message - JSON object or string to send to the server.
  * @returns {bool|null} - true if the message was sent successfully. null if the
  *          message was qued to be sent later. False if send failed.
  */
  send(message) {
    if (typeof message !== 'string')
      message = JSON.stringify(message);

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
}
