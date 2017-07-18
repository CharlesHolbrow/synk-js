import { assert } from 'chai';
import Connection from './Connection.js';

const c = new Connection();

console.log('describe:', describe);

describe('Connection', function() {
  it('should exist', function() {
    assert.exists(Connection, 'Connection exists');
  });
});
