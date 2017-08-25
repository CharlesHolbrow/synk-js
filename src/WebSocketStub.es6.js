import Emitter from 'eventemitter3';

/**
 * This is a very minimal WebSocket stub. It it probably worth refactoring this
 * so it more accurately refelcts the actual WebSocket interface.
 */
export default class WebSocket extends Emitter {
  constructor(url) {
    super();
    console.log('sub websocket to', url);
    this._url = url;
    this._state = 0;

    // These functions can be replaced by our client code.
    this.onerror = () => console.log('error');
    this.onopen = () => console.log('open');
    this.onmessage = (m) => console.log('message', m);
    this.onclose = () => console.log('close');
  }
  send(msg) {
  }

  set readyState(v) {
    this._state = v;
  }

  get readyState() {
    return this._state;
  }

  open() {
    this.readyState = 1;
    this.onopen();
  }

  close() {
    this.readyState = 3;
    this.onclose();
  }
}
