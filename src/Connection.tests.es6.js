import { assert } from 'chai';
import Connection from './Connection';

// Note that Connection depends on WebSocket which is only available in the
// browser by default. Meaningful testing of Connection would require stubbing
// WebSocket. Looks like the mock-socket module would do the job
//
// https://github.com/thoov/mock-socket

describe('Connection', function() {
  it('should exist', function() {
    assert.exists(Connection, 'Connection exists');
  });
  it('should have a .send method', function() {
    assert.typeOf(Connection.prototype.send, 'function');
  });
});
