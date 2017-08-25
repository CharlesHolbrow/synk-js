import Objects from './Objects';
import Connection from './Connection';

/**
 * Synk represents a connection to the synk server. Its responsibilities:
 * - create a connection to the server
 * - track a set of subscriptions keys
 * - store objects retrieved from the server
 *
 * The objects stored in this.objects will stay up-to-date with the copies on
 * the server.
 */
export default class Synk {
  /**
   * @arg {string} url - the websocket url to connect to
   */
  constructor(url) {
    this.objects = new Objects();
    this.connection = new Connection(url);

    this.objects.subscribe(this.connection.stream);

    this.active = {}; // currently active subscriptions
    this.pendingAdd = {};
    this.pendingRemove = {};

    this.connection.on('close', () => {
      // Our connection is closed, Prepare for the connection to re-open. Cache
      // the subscription keys we are currently subscribed to, and teardown all
      // existing objects.
      const current = this.active;

      this.objects.updateKeys({
        remove: Object.keys(this.active),
        add: [],
      });
      this.active = {};

      // When we re-open, we want to re-subscribe to the correct collection of
      // keys. Resolve the .pendingAdd and .pendingRemove objects.
      for (const key of Object.keys(this.pendingRemove))
        if (current.hasOwnProperty(key)) delete current[key];

      for (const key of Object.keys(this.pendingAdd))
        current[key] = true;

      // We know the collection of keys that we would like to be subscribed to.
      this.pendingAdd = current;
      this.pendingRemove = {};
    });

    this.connection.on('open', () => {
      this.resolve();
    });
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
   * Try to resolve the subscription. If socket is not open, this will have no
   * effect. Note that resolve is always called when the connection opens or re-
   * opens.
   * 
   * @return {bool} - true if the message was sent or no change is needed
   */
  resolve() {
    const msg = {
      method: 'updateSubscription',
      add: Object.keys(this.pendingAdd),
      remove: Object.keys(this.pendingRemove),
    };

    // If msg.add and msg.remove are empty, our job is done.
    if (msg.add.length === 0 && msg.remove.length === 0) return true;

    // If the connection is not open, do nothing (wait for open event)
    if (this.connection.state !== 1) return false;
    // The connection is known to be open

    this.objects.updateKeys(msg);
    this.connection.send(msg);

    for (const key of msg.add)
      this.active[key] = true;

    for (const key of msg.remove)
      if (this.active.hasOwnProperty(key)) delete this.active[key];

    this.pendingAdd = {};
    this.pendingRemove = {};

    return true;
  }
}
