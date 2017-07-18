import Kefir from 'kefir';

/**
* Base for classes that respond to a stream.
*
* Extending Endpoint give us the ability make remote proceedure calls on class
* instances by sending msg objects to a Kefir.stream. Extension classes define
* methods that can be called by sending messages to the stream.
*
* An endpoint instance may only listen to one class at a time
*/
export default class Endpoint {
  /**
  * Create an Endpoint. Usually this will be called via super()
  */
  constructor() {
    this._subsciption = null;
    this._inputStream = null;
    this._unhandledStream = null;
    this.unhandled = new Kefir.Pool();
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
  subscribe(stream) {
    if (this._subsciption)
      this._subsciption.unsubscribe();

    if (this._unhandledStream)
      this.output.unplug(this._unhandledStream);

    stream = stream || null;
    this._inputStream = stream;

    if (!stream)
      return;

    // We now create two derivative streams. The first handles messages if this
    // class has an appropriate handler given the message's '.method' parameter.
    // We observe this stream, and leave a reference to the subscription so we
    // can unsubscribe if we are passed different stream to monitor.
    this._subsciption = stream
      .filter((msg) => typeof this[msg.method] === 'function')
      .observe({
        value: (msg) => {
          this[msg.method](msg);
        },
        error: (msg) => {
          console.error(msg);
        },
        end: (msg) => {
          console.warn(msg);
        },
      });

    // The second derivative stream passes unhandled messages to the endpoint's
    // .output stream. Keep a reference to the unhandled stream so we can unplug
    // it from the output pool when we subscribe to a new stream.
    this._unhandledStream = stream
      .filter((msg) => typeof this[msg.method] !== 'function');
    this.unhandled.plug(this._unhandledStream);
  }

  /**
  * Get the stream of our current subscription.
  * @readonly
  * @returns {Kefir.stream} - current subscription. null if not subscribed.
  */
  get stream() {
    return this._inputStream;
  }
}
