import Objects from './Objects';
import Connection from './Connection';

/**
 * Synk wraps a connection and an Objects subscription.
 */
export default class Synk {
  /**
   * @arg {string} url - the websocket url to connect to
   * @arg {[class]} webSocketStub - optional class to use instead of WebSocket.
   *      Useful for testing inside of Node.js. Probably not needed in an
   *      application.
   */
  constructor(url) {
    this.objects = new Objects();
    this.connection = new Connection(url);

    this.active = {}; // currently active subscriptions
    this.pendingAdd = {};
    this.pendingRemove = {};
  }

  /**
   * Given a set of keys that we want to subscribe to, calculate the difference
   * between the currently active subscription and the new desired subscription.
   * Store the result in this.pendingAdd and this.pendingRemove.
   *
   * @param {string[]} keys - all the keys that we want to subscribe to.
   */
  setSubscription(keys) {
    this.pendingAdd = {};
    this.pendingRemove = {};

    const newKeys = {};

    // convert keys array to object
    for (const key of keys) newKeys[key] = true;

    // for each current key, check if we want to unsubscribe
    for (const activeKey of Object.keys(this.active)) {
      if (!newKeys.hasOwnProperty(activeKey)) {
        // we have a key that we do not want.
        this.pendingRemove[activeKey] = true;
      }
    }

    // For each new key, check if we have to add it
    for (const newKey of keys) {
      if (!this.active.hasOwnProperty(newKey)) {
        // a key needs to be added
        this.pendingAdd[newKey] = true;
      }
    }
  }

  /**
   * Try to resolve the subscription. 
   * 
   * Resolve returns the result of the call to connection.send(). If the
   * subscription message is not sent successfully, it will be sent when the
   * connection re-opens.
   */
  resolve() {



  }
}
