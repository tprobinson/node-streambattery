# StreamBattery
Creates an array of writeable streams, then calls a callback when they're all done with a keyed object of the streams' results.

A class to make working with multiple readable streams not such a horrendous pain.

Originally created to work with [Dockerode](https://www.npmjs.com/package/dockerode)'s demuxer modem, but could be applied elsewhere.

<!-- MDTOC maxdepth:6 firsth1:0 numbering:0 flatten:0 bullets:1 updateOnSave:1 -->

- [Usage](#usage)   
- [Properties and Methods](#properties-and-methods)   
   - [`streams`](#streams)   
   - [`exit()`, `close()`, or `end()`](#exit-close-or-end)   

<!-- /MDTOC -->

## Usage

Create a `StreamBattery` and give it an array of keys, then a callback. It will create a writeable stream for each key you specified, and expose them in an array via the `.streams` property. When all streams have finished writing, callback will be called. Alternately if you decide you want to stop, you can call `.exit()`.

```javascript
const StreamBattery = require('streambattery');

const battery = new StreamBattery(['streamOne', 'streamTwo'], (err, results) => { ... });

// Now you can use battery.streams to expose Writeables to anything.

fetch('https://jsonplaceholder.typicode.com/posts/1').then(r => r.body.pipe(battery.streams[0]));
fetch('https://jsonplaceholder.typicode.com/posts/2').then(r => r.body.pipe(battery.streams[1]));

// When they're all finished, callback will be called with an object that has keys of the original names you passed in.

// {
//   streamOne: '<a string of JSON data>',
//   streamTwo: '<a string of JSON data>'
// }
```

## Properties and Methods

### `streams`
An Array of objects that act like writeable streams. Specifically, `WriteableValueProxy` objects. They are in the order that you originally specified your keys.

### `exit()`, `close()`, or `end()`
Call this to trigger the callback early if you want to for some reason. It won't complain if it's called multiple times, but it won't do anything on subsequent calls.
Triggering this method will also emit `close` on all of the streams.
