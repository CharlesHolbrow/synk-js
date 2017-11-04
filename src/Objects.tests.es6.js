import { assert } from 'chai';
import Objects from './Objects';

// Note that Connection depends on WebSocket which is only available in the
// browser by default. Meaningful testing of Connection would require stubbing
// WebSocket. Looks like the mock-socket module would do the job
//
// https://github.com/thoov/mock-socket

/**
 * TObj is a test synk object used for these tests
 */
class TObj {
  /**
   * @param {string} key - the new object's key
   * @param {object} state - the objects initial state
   * @param {synk.Objects} synkObjects - where this i
   */
  constructor(key, state, synkObjects) {
    this.key = key;
    this.state = {};
    this.synkObjects = synkObjects;
    this.update(state);
  }
  /**
   * @param {object} state - updates object state
   */
  update(state) {
    Object.assign(this.state, state);
  }
  /**
   * Called when we unsubscribe or object is removed
   */
  teardown() {
    this.removed = true;
  }
}

describe('Objects', function() {
  it('should exist', function() {
    assert.exists(Objects, 'Connection exists');
  });

  // Example addObj message
  const addObjMsg = {
    method: 'addObj',
    state: { x: 100, y: -100, name: 'bob' },
    key: 't:0000',
    sKey: 'sk1',
    v: 0,
  };

  const objs = new Objects();

  // Standard initialization. Specify which class we want to use for objects
  // who's key begins with 't:'
  objs.byKey.createBranch('t').class = TObj;

  describe('Objects.updateKeys', function() {
    objs.updateKeys({ add: ['sk1', 'sk2'], remove: [] });

    it('should add keys to .bySKey', function() {
      assert.exists(objs.bySKey.branches.sk1);
      assert.exists(objs.bySKey.branches.sk2);
    });
  });

  describe('Objects.addObj', function() {
    objs.addObj(addObjMsg);

    it('should create a new TObj in the .byKey branch', function() {
      const obj = objs.get(addObjMsg.key);

      assert.exists(obj);
      assert.deepEqual(obj.state, addObjMsg.state);
      assert.instanceOf(obj, TObj);
    });
  });
});
