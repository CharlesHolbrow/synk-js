import Emitter from 'eventemitter3';

export default class WebSocket extends Emitter {
  constructor(url) {
    super();
    console.log('sub websocket to', url);
    this._url = url;
    this._state = 0;
  }
  send(msg) {
    console.log('sending:', msg);
  }
}
