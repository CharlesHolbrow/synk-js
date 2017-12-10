import Endpoint from './Endpoint';
import Branch from './Branch';

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
export default class Objects extends Endpoint {
  /**
   * @param {App} app - the aether App this object is built on
   */
  constructor() {
    super();
    this.bySKey = new Branch();
    this.byKey = new Branch();
    this.byId = {};

    // queuedMessages is for storing messages that target an object that we have
    // not yet received. Messages that arrive out of order after addObj has been
    // received should be stored on the object itself, so they can be garbage
    // collected correctly.
    // As of November 5, 2017, unordered mod messages that arrive after addObj
    // are not supported. However, support may be added in the future.
    this.queuedMessages = {};
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
  updateKeys(updateSubscriptionMsg) {
    const msg = updateSubscriptionMsg;

    if (!Array.isArray(msg.remove) || !Array.isArray(msg.add))
      console.error('Objects.updateKeys received invalid message:', msg);

    // When we unsubscribe from a chunk, we need to remove and teardown all the
    // objects in that chunk.
    msg.remove.forEach((p) => {
      // Remove the enture chunk
      this.bySKey.removeBranch(p).forEach((leaf) => {
        // Remove each object from its collection
        const parts = leaf.t.split(':');
        const collection =  this.byKey.getBranch(...parts); // The group of objects in that type

        // If the collection doesn't exist, we have bug
        if (!collection) console.error(`Unsubscribed from chunk, but collection not found: ${leaf.t}`);

        this.removeObject(leaf, collection, null, null);
      });
    });

    msg.add.forEach((p) => {
      this.bySKey.createBranch(p);
    });
  }

  /**
   * Get an object from this synk collection. This may return null if the object
   * was not found.
   *
   * @param {string} key - the full key of the object we want 'type:key:id'
   * @returns {Object|null} - the object if it exists, or null
   */
  get(key) {
    const obj = this.byId[key];

    if (obj) return obj;

    const parts = key.split(':');
    const id = parts.pop();
    const collection = this.byKey.getBranch(...parts);

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
  queueMessage(msg) {
    let queue;
    const id = msg.key || msg.id;

    if (this.queuedMessages.hasOwnProperty(id))
      queue = this.queuedMessages[id];
    else {
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
  applyQueuedMessages(obj) {
    const id = obj.key || obj.id;

    if (!this.queuedMessages.hasOwnProperty(id)) return;
    const queue = this.queuedMessages[id]
      .filter((m) => m.v > obj.v)
      .sort((a, b) => a.v - b.v);

    this.queuedMessages[id] = queue;

    for (const [i, msg] of queue.entries()) {
      const target = obj.v + 1;

      if (msg.v === target) {
        // This is actually pretty sneaky. Normally we cannot modify an array
        // while iterating over it. However, in this case we only remove the
        // FIRST match, and then break out of the loop -- so it should be okay.
        if (msg.method === 'mod') this.mod(msg);
        else this.modObj(msg);
      } else if (msg.v >= target) {
        queue.splice(0, i); // leave only unapplied messages.
        console.error('DANGER: failed to replay all modObj messages:', queue);
        break;
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
  add(msg) {
    if (typeof msg.sKey !== 'string' || typeof msg.id !== 'string') {
      console.error('Received invalid add message', msg);

      return;
    }

    const chunk = this.bySKey.getBranch(msg.sKey);
    const collection = this.byKey.createBranch(...msg.t.split(':'));

    // Check if we are subscribed
    if (!chunk) {
      console.warn('Received "add" message from the server, while not '
      + 'subscribed to the object\'s subscription key');

      return;
    }

    // Check if we already have this object
    let obj = collection.getLeaf(msg.id);

    if (obj) {
      console.error('The server sent us an add message, but we alredy had '
      + `the object locally: ${msg.id}`);
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
  rem(msg) {
    if (typeof msg.sKey !== 'string' || typeof msg.id !== 'string') {
      console.error('Received invalid remObj message', msg);

      return;
    }

    const parts = msg.t.split(':');
    const id = msg.id;
    const chunk = this.bySKey.getBranch(msg.sKey); // current chunk
    const collection = this.byKey.getBranch(...parts);
    const obj = collection.getLeaf(id);

    if (!chunk) console.error(`Tried to remove ${msg.sKey}, but could not find objects at ${parts}`);

    if (!collection) console.error(`Tried to remove ${id} but could not find ${parts} in .byKey`);

    if (obj) this.removeObject(obj, chunk, collection, msg);
    else console.error(`DANGER: Tried to remove ${msg.id}, but could not find object`);
  }

  /**
   * Modify an object. Usually called from the server.
   * @param {Object} msg containing .id .sKey .t .v and .diff. the presense of
   *        .nsKey indicates that the object is moving to a new subscription key
   */
  mod(msg) {
    if (typeof msg.sKey !== 'string' || typeof msg.id !== 'string') {
      console.error('Received invalid mod message', msg);

      return;
    }

    const id = msg.id;
    const obj = this.get(id);
    const chunk = this.bySKey.getBranch(msg.sKey); // current chunk

    // Do some sanity checks...

    if (!obj) {
      if (chunk) this.queueMessage(msg);
      else {
        // this is just a warning, because it will just happen occasionally.
        console.warn('We received a modObj request. We could not find the '
          + `object locally: ${id}. And the message targets an SKey we `
          + 'are not subscribed to');
      }

      return;
    }

    const parts = obj.t.split(':');
    const collection = this.byKey.createBranch(...parts);

    if (chunk.getLeaf(msg.id) !== obj) {
      console.error(`Received modObj. The object was found on the ${parts} `
      + `collection, but not the ${msg.sKey} chunk.`);
      // Keep trying to move the object...
    }

    if (typeof msg.v !== 'number') {
      console.error(`Received modObj message with a bad version: ${msg.v}`);

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
    const newChunk = this.bySKey.getBranch(msg.nsKey);

    if (newChunk) {
      chunk.removeLeaf(id);
      newChunk.setLeaf(id, obj);
      obj.update(msg.diff);
      this.emit('mod', obj, msg);
    } else
      this.removeObject(obj, collection, chunk, msg);

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
  removeObject(obj, branch1, branch2, msg) {
    if (branch1) branch1.removeLeaf(obj.id);
    if (branch2) branch2.removeLeaf(obj.id);

    delete this.byId[obj.id];

    this.emit('rem', obj, msg);

    obj.teardown();
  }
}
