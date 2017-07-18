import { expect } from 'chai';
import Branch from './Branch';

describe('Branch', function() {
  describe('createBranch', function() {
    it('should add branches', function() {
      const b = new Branch();

      b.createBranch('a', 'b', 'c');
      const a = b.getBranch('a');
      const c = a.getBranch('b', 'c');

      expect(c).to.be.an.instanceOf(Branch);
    });
  });
});
