import { assert } from 'chai';
import Connection from './Connection';

const c = new Connection();

describe('Connection', function() {
  it('should exist', function() {
    assert.exists(Connection, 'Connection exists');
  });
});
