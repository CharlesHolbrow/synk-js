/**
 * EarlyMessages is for storing messages that target an object that we have
 * not yet received.
 *
 * As of November 5, 2017, Early Messages is unused. It is more compilcated than
 * I originally imagined. Here's why:
 *
 * I was planning on putting an EarlyMessages instance on Every bySKey branch of
 * synk-js.Objects. Then I could be sure that early messages would be cleaned up
 * when the subscription changes. When we get an addObj message, we play back
 * all the relevant early messages on the object's subscription key. Here's
 * where it breaks down. If the object moves to a new subscription key between
 * the time that we start getting early messages and  when the first addObj
 * message arrives, some of the messages will be on a different EarlyMessages
 * instance, and we will have no way of finding the most recent messages.
 */
export default class EarlyMessages {
  /**
   * Create a Collection of early messages.
   */
  constructor() {
    this.queuedMessages = {}; // indexed by is object key
  }

  /**
   * Synk Objects does not assume that messages will arrive in the correct
   * order. When we recieve a message, it is possible that we have not yet
   * received the associated addObj message. It is also possible that we do
   *
   * Append a message to the queue for a given object. Whenever an object is
   * added OR a modification is applied. We will check to see if there are
   * queued messages that should be replayed.
   *
   * This function should probably never be called except by methods of the
   * Objects class.
   *
   * @param {Object} msg - modObj message. In the future we may also support
   *        remObj messages.
   */
  queueMessage(msg) {
    let queue;

    if (this.queuedMessages.hasOwnProperty(msg.key))
      queue = this.queuedMessages[msg.key];
    else {
      queue = [];
      this.queuedMessages[msg.key] = queue;
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
    if (!this.queuedMessages.hasOwnProperty(obj.key)) return;

    const queue = this.queuedMessages[obj.key]
      .filter((m) => m.v > obj.v)
      .sort((a, b) => a.v - b.v);

    this.queuedMessages[obj.key] = queue;

    for (const [i, msg] of queue.entries()) {
      const target = obj.v + 1;

      if (msg.v === target) {
        // This is actually pretty sneaky. Normally we cannot modify an array
        // while iterating over it. However, in this case we only remove the
        // FIRST match, and then break out of the loop -- so it should be okay.
        this.modObj(msg);
      } else if (msg.v >= target) {
        queue.splice(0, i); // leave only unapplied messages.
        console.error('DANGER: failed to replay all modObj messages:', queue);
        break;
      }
    }

    delete this.queuedMessages[obj.key];
  }
}
