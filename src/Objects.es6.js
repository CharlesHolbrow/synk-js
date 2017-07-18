import Endpoint from './Endpoint.js';
import Branch from './Branch.js';

/**
 * Create a subscription key for a given location on a map.
 * @param {string} mapID - map identification
 * @param {number} cx - chunk x coordinate
 * @param {number} cy - chunk y coordinate
 * @returns {string} - sKey for a map location
 */
function subKey(mapID, cx, cy) {
  return `objs:${mapID}:${cx.toString(36)}|${cy.toString(36)}`;
}

/**
 * Store a collection of objects that will be synchronized with the server
 */
export default class Objects extends Endpoint {
  /**
   * @param {App} app - the aether App this object is built on
   */
  constructor() {
    super();
    this.bySKey = new Branch();
    this.byKey = new Branch();
  }

  /**
   * Update the set of keys that we are subscribed to.
   *
   * Note that this is usually called from the client. We should be able to call
   * this from the server, but this behavior is untested. To get this working,
   * we would have to have this function mutate the mapSubscription (currently
   * the mapSubscription methods call this, not the other way around)
   *
   * @param {Object} updateSubscriptionMsg - The message returned by
   *        mapSubscription methods. Has .add and .remove arrays.
   */
  updateKeys(updateSubscriptionMsg) {
    const msg = updateSubscriptionMsg;

    // When we unsubscribe from a chunk, we need to remove and teardown all the
    // objects in that chunk.
    msg.remove.forEach((p) => {
      // Remove the enture chunk
      this.bySKey.removeBranch(subKey(msg.mapID, p.x, p.y)).forEach((leaf) => {
        // Remove each object from its collection
        const parts = leaf.key.split(':');
        const id = parts.pop();
        const collection =  this.byKey.getBranch(...parts);

        // If the collection doesn't exist, we have bug
        if (collection) collection.removeLeaf(id);
        else console.error(`Unsubscribed from chunk, but collection not found: ${parts.join(':')}`);

        leaf.teardown();
      });
    });

    msg.add.forEach((p) => {
      this.bySKey.createBranch(subKey(msg.mapID, p.x, p.y));
    });
  }

  /**
   * Create a new object. Typically called from the server.
   * @param {Object} msg - contains .key, .state, .sKey. Optional .psKey
   *        indicates object moved here from another chunk.
   */
  addObj(msg) {
    if (typeof msg.sKey !== 'string' || typeof msg.key !== 'string') {
      console.error('Received invalid addObj message', msg);

      return;
    }

    const parts = msg.key.split(':');
    const id = parts.pop();
    const chunk = this.bySKey.getBranch(msg.sKey);
    const collection = this.byKey.createBranch(...parts);

    // Check if we already have this object
    let obj = collection.getLeaf(id);

    if (obj) {
      console.error('The server sent us an addObj message, but we alredy had '
      + `the object locally: ${msg.key}`);
      throw new Error('TODO: remove and teardown c'); // TODO: remove and teardown c intead of throwing an error
    }

    obj = new collection.class(msg.key, msg.state);

    chunk.setLeaf(msg.key, obj);
    collection.setLeaf(id, obj);
  }

  /**
   * Mutate a local object. Designed to be called from the server.
   * @param {Object} msg - data from server. Includes .diff and .sKey. May also
   *        include .nsKey (if the object is moving between chunks.)
   */
  modObj(msg) {
    if (typeof msg.sKey !== 'string' || typeof msg.key !== 'string') {
      console.error('Received invalid modObj message', msg);

      return;
    }

    const parts = msg.key.split(':');
    const id = parts.pop();
    const chunk = this.bySKey.getBranch(msg.sKey); // current chunk
    const collection = this.byKey.createBranch(...parts);
    const obj = collection.getLeaf(id);

    // Do some sanity checks...

    if (!obj) {
      console.error('We received a modObj request, but could not find the '
      + `object locally: ${msg.key}`);

      return;
    }

    if (chunk.getLeaf(msg.key) !== obj) {
      console.error(`Received modObj. The object was found on the ${parts} `
      + `collection, but not the ${msg.sKey} chunk.`);
      // Keep trying to move the object...
    }

    // Are we modifying within a chunk?
    if (!msg.nsKey) {
      obj.update(msg.diff);

      return;
    }

    // The object must be moved out of the current chunk. If we are subscribed
    // to the new chunk, move the object there. If we are not subscribed,
    // remove and teardown() the object.
    chunk.removeLeaf(msg.key);

    const newChunk = this.bySKey.getBranch(msg.nsKey);

    if (newChunk) {
      newChunk.setLeaf(msg.key, obj);
      obj.update(msg.diff);
    } else {
      collection.removeLeaf(id);
      obj.teardown();
    }

    return;
  }

  /**
   * Remove and teardown an object.
   * @param {object} msg - has .key and .sKey strings
   */
  remObj(msg) {
    if (typeof msg.sKey !== 'string' || typeof msg.key !== 'string') {
      console.error('Received invalid remObj message', msg);

      return;
    }

    const parts = msg.key.split(':');
    const id = parts.pop();
    const chunk = this.bySKey.getBranch(msg.sKey); // current chunk
    const collection = this.byKey.getBranch(...parts);
    const obj = collection.getLeaf(id);

    if (chunk) chunk.removeLeaf(msg.key);
    else console.error(`Tried to remove ${msg.sKey}, but could not find objects at ${parts}`);

    if (collection) collection.removeLeaf(id);
    else console.error(`Tried to remove ${msg.key} but could not find ${parts} in .byKey`);

    if (obj) obj.teardown();
    else console.error(`DANGER: Tried to remove ${msg.key}, but could not find object`);
  }
}