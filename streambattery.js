'use strict';

const WriteableValueProxy = require('./writeableValueProxy');

/**
 * Convenience method to create an object with array's keys, each with value.
 * @param  {Array<string>}   array The keys to use
 * @param  {function|string} value If a function, invoked each time to get the new value. Otherwise, used as is.
 * @return {Object}                The resulting composition
 */
function objFromArray(array, value) {
  if( typeof value === 'function' ) {
    return array.reduce((acc, key) => Object.assign(acc, {[key]: value()}), {});
  }
  return array.reduce((acc, key) => Object.assign(acc, {[key]: value}), {});
}

/**
 * Creates an array of writeable streams, then calls its callback when all are complete-- or when the user calls .exit
 * @example
 * let battery = new StreamBattery(['stdout', 'stderr'], cb);
 * docker.modem.demuxStream(stream, ...battery,streams);
 * stream.on('end', battery.end);
 */
class StreamBattery {
  /**
   * Creates a StreamBattery
   * @param {Array<string>} keys A stream is created under each of these keys
   * @param {function} callback  When all streams are complete, this is called with results
   */
  constructor(keys, callback) {
    this.callback = callback;

    /**
     * Internal value to keep all in-progress Buffers.
     * @type {Object}
     */
    this.storage = objFromArray(keys, () => Buffer.from([]));

    /**
     * Tracks whether all streams are complete.
     * @type {Object}
     */
    this.endedStreams = objFromArray(keys, false);

    /**
     * An array of writeable streams, which can be passed into things like docker.modem.demuxStreams
     * @type {Array<WriteableValueProxy>}
     */
    this.streams = keys.map(key => { return new WriteableValueProxy(this.storage, key, this.checkAllEnded); });

    this.exitCalled = false;
  }

  /**
   * Called when any stream ends
   * @param {string} key The key of the checking stream.
   */
  checkAllEnded(key) {
    this.endedStreams[key] = true;
    if( this.endedStreams.every(k => k) ) {
      this.exit();
    }
  }

  /**
   * Reads this.storage to produce a new object of stringified Buffers
   * @return {Object}
   */
  getAllResults() {
    return Object.keys(this.storage).reduce((acc, key) => Object.assign(acc, {[key]: this.storage[key].toString()}), {});
  }

  /**
   * Called either externally ot internally, will close all streams, then call the callback with results.
   */
  exit() {
    if( this.exitCalled ) { return; }

    // Clean up by telling all the streams they're closed.
    this.streams.forEach(x => x.close());

    this.callback(null, this.getAllResults());
    this.exitCalled = true;
  }

  /**
   * Alias of {@link exit}
   */
  end(...args) {
    return this.exit(...args);
  }

  /**
   * Alias of {@link exit}
   */
  close(...args) {
    return this.exit(...args);
  }
}
module.exports = StreamBattery;
