import Emitter from 'eventemitter3';
import { expect } from 'chai';
import Synk from './Synk';
import Objects from './Objects';

describe('Synk', function() {
  describe('updateSubscription', function() {
    const s = new Synk();

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
});
