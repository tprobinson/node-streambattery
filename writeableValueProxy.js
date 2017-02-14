'use strict';

const EventEmitter = require('events');

/**
 * A Writeable-like interface to concatenate a stream into a parent's object.
 * @implements stream.Writeable
 * @extends EventEmitter
 */
class WriteableValueProxy extends EventEmitter {
  constructor(parent, key, callback) {
    super();
    Object.assign(this, {parent, key, callback, hasBeenEnded: false, hasClosed: false});
  }

  /**
   * write interface. Typical method.
   * @param {Buffer} data
   * @throws {Error} If written to after end()
   */
  write(data) {
    if( this.hasBeenEnded ) { throw new Error('Stream written to after end'); }

    if( !(this.key in this.parent) ) { this.parent[this.key] = Buffer.from([]); }
    this.parent[this.key] = Buffer.concat([this.parent[this.key], data]);
  }

  /**
   * end interface. Typical method. Calls close().
   * @param {Buffer} data A final chunk
   * @param {function} [cb] Called when finish is emitted.
   * @throws {Error} If called twice
   */
  end(data, cb) {
    if( this.hasBeenEnded ) { throw new Error('Stream ended more than once'); }

    if( data != null ) {
      this.write(data);
    }

    this.callback(this.key);
    if( typeof cb === 'function' ) {
      this.once('finish', cb);
    }

    this.close();
    this.hasBeenEnded = true;
  }

  /**
   * Invoked when the stream is ended. Can be manually invoked to emit a finish.
   * @emits {finish}
   */
  close() {
    if( this.hasClosed ) { return; }
    this.emit('finish');
    this.hasClosed = true;
  }
}
module.exports = WriteableValueProxy;
