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
    this.state = {};
    this.synkObjects = synkObjects;
    this.update(state);
  }
  /**
   * @param {object} state - updates object state
   */
  update(state) {
    // console.log('oldState:', this.state);
    // console.log('msg state:', state);
    Object.assign(this.state, state);
    // console.log('newState:', this.state);
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

  const modObjMsg = {
    method: 'modObj',
    key: 't:0000',
    sKey: 'sk1',
    v: 1,
    diff: { x: 99 },
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

    const obj = objs.get(addObjMsg.key);

    it('should create a new TObj in the .byKey branch', function() {
      assert.exists(obj);
      assert.deepEqual(obj.state, addObjMsg.state);
      assert.instanceOf(obj, TObj);
    });

    it('should be initialized with a .key', function() {
      assert.equal(obj.key, addObjMsg.key);
    });

    it('should initialize the Object\'s ".v" member', function() {
      assert.equal(obj.v, addObjMsg.v);
    });
  });

  describe('Objects.modObj', function() {

    const addMsg = {
      method: 'addObj',
      key: 't:0001',
      sKey: 'sk1',
      v: 0,
      state: { x: 0, y: 0 },
    };

    const modObjMsg = {
      method: 'modObj',
      key: 't:0001',
      sKey: 'sk1',
      v: 1,
      diff: { x: 99 },
    };

    objs.addObj(addMsg);

    it('Newly added object should be accessible via .get', function() {
      const obj = objs.get(addMsg.key);

      assert.deepEqual(obj.state, addMsg.state);
    });

    it('Its contents should be updated by modObj', function() {
      const obj = objs.get(addMsg.key);

      objs.modObj(modObjMsg);
      assert.equal(obj.state.x, modObjMsg.diff.x);
    });

    it('Should update the object\'s version', function() {
      const obj = objs.get(addMsg.key);

      assert.equal(obj.v, modObjMsg.v);
    });

    it('Should que messages when the object has not yet been received', function() {
      objs.modObj({ method: 'modObj', key: 't:0002', sKey: 'sk1', v: 2, diff: { x: 97 } }); // second
      objs.modObj({ method: 'modObj', key: 't:0002', sKey: 'sk1', v: 1, diff: { x: 98, y: 1 } }); // first
      assert.exists(objs.queuedMessages['t:0002']);
      assert.equal(objs.queuedMessages['t:0002'].length, 2);
    });

    it('Should replay the queued messages on receiveing addObj', function() {
      objs.addObj({ method: 'addObj', key: 't:0002', sKey: 'sk1', v: 0, state: { z: 100 } });
      const obj = objs.get('t:0002');

      assert.deepEqual(obj.state, { x: 97, y: 1, z: 100 });
      assert.equal(obj.v, 2);
    });

    it('Should remove the queued messages on successful removal', function() {
      assert.notExists(objs.queuedMessages['t:0002']);
    });
  });
});
