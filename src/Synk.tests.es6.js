import Emitter from 'eventemitter3';
import { expect } from 'chai';
import Synk from './Synk';
import Objects from './Objects';

describe('Synk', function() {
  describe('updateSubscription', function() {
    const s = new Synk('ws://127.0.0.1:3000/ws');

    it('should add new subscription to the .pendingAdd member', function() {
      s.setSubscription(['a', 'b']);
      expect(s.pendingAdd).to.deep.equal({ a: true, b: true });

      // Simulate resolution
      s.active = s.pendingAdd;
      s.pendingAdd = {};

      // Try another option
      s.setSubscription(['a', 'c']);
      expect(s.pendingAdd).to.deep.equal({ c: true });
      expect(s.pendingRemove).to.deep.equal({ b: true });
    });
  });

  describe('.active .pendingAdd and .pendingRemove objects', function() {
    const s = new Synk('ws://127.0.0.1:3000/ws');

    it('resolve() should should update the pendingAdd and pendingRemove when the connection is open', function() {
      s.connection.sock.open();
      s.setSubscription(['a', 'b']);
      s.resolve();
      expect(s.active).to.deep.equal({ a: true, b: true });
    });

    it('closing the connection should update the objects', function() {
      s.connection.sock.close();
      expect(s.pendingAdd).to.deep.equal({ a: true, b: true });
      expect(s.active).to.deep.equal({});

      s.setSubscription(['a', 'c']);
      expect(s.active).to.deep.equal({});
      expect(s.pendingAdd).to.deep.equal({ a: true, c: true });
      expect(s.pendingRemove).to.deep.equal({});
    });

    it('opening the connection should apply the pendingAdd', function() {
      s.connection.sock.open();
      expect(s.active).to.deep.equal({ a: true, c: true });
      expect(s.pendingAdd).to.deep.equal({});
    });
  });
});
