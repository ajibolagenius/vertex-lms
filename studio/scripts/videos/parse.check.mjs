/** Self-check for the ingestion parsers: `node studio/scripts/videos/parse.check.mjs`. */
import assert from 'node:assert/strict'

import {chunk, parseChapters, parseVtt, videoDocId, watchUrl} from './parse.mjs'

assert.equal(videoDocId('9602Yzvd7ik'), 'video.9602Yzvd7ik')
assert.equal(videoDocId('a_b-c.d'), 'video.a_b-c.d')
// §9: strip whatever the datastore rejects in an id.
assert.equal(videoDocId('a/b?c d'), 'video.abcd')
// Sanity rejects an id element starting with `-` or `.`, and YouTube ids do start with `-`.
assert.equal(videoDocId('-QVoIxEpFkM'), 'video.v-QVoIxEpFkM')
assert.equal(videoDocId('.hidden'), 'video.v.hidden')
assert.equal(videoDocId('_underscore'), 'video._underscore')
assert.equal(watchUrl('9602Yzvd7ik'), 'https://www.youtube.com/watch?v=9602Yzvd7ik')

assert.deepEqual(
  parseChapters({
    chapters: [
      {start_time: 0, title: 'Introduction '},
      {start_time: 16.4, title: 'Setting Up'},
      {start_time: 43, title: '   '},
      {start_time: null, title: 'No start'},
    ],
  }),
  [
    {_key: 'ch0', _type: 'videoChapter', startSeconds: 0, label: 'Introduction'},
    {_key: 'ch1', _type: 'videoChapter', startSeconds: 16, label: 'Setting Up'},
  ],
)
// No chapters is a valid outcome — the transcript is the backstop (§7).
assert.deepEqual(parseChapters({}), [])
assert.deepEqual(parseChapters(null), [])

// The real auto-caption shape: rolling repeats plus inline word timings.
const vtt = `WEBVTT
Kind: captions
Language: en

00:00:00.000 --> 00:00:02.270 align:start position:0%
 
Let's<00:00:00.440><c> dive</c><00:00:00.680><c> into</c>

00:00:02.270 --> 00:00:02.280 align:start position:0%
Let's dive into
 

00:00:02.280 --> 00:00:05.270 align:start position:0%
Let's dive into
routing.<00:00:03.080><c> NextJS</c>

01:02:03.500 --> 01:02:05.000
much&nbsp;later
`

assert.deepEqual(parseVtt(vtt), [
  {startSeconds: 0, text: "Let's dive into"},
  {startSeconds: 2.28, text: 'routing. NextJS'},
  {startSeconds: 3723.5, text: 'much later'},
])
assert.deepEqual(parseVtt(''), [])
// A cue-less block (the WEBVTT header) contributes nothing.
assert.deepEqual(parseVtt('WEBVTT\n\nnot a cue\n'), [])
// `MM:SS.mmm` timestamps, which some caption tracks use.
assert.deepEqual(parseVtt('00:05.000 --> 00:07.000\nhello\n'), [
  {startSeconds: 5, text: 'hello'},
])

const lines = [
  {startSeconds: 0, text: 'aaa'},
  {startSeconds: 5, text: 'bbb'},
  // 30s past the chunk start: flushes on span.
  {startSeconds: 30, text: 'ccc'},
  {startSeconds: 31, text: 'ddd'},
]
assert.deepEqual(chunk(lines), [
  {_key: 'ck0', _type: 'videoChunk', startSeconds: 0, text: 'aaa bbb'},
  {_key: 'ck1', _type: 'videoChunk', startSeconds: 30, text: 'ccc ddd'},
])

// Flushes on characters too, so no chunk grows into something a projection cannot afford.
const long = chunk(
  [
    {startSeconds: 0, text: 'x'.repeat(8)},
    {startSeconds: 1, text: 'y'.repeat(8)},
    {startSeconds: 2, text: 'z'.repeat(8)},
  ],
  {maxChars: 20},
)
assert.deepEqual(long.map((piece) => piece.text), ['x'.repeat(8) + ' ' + 'y'.repeat(8), 'z'.repeat(8)])
assert.deepEqual(long.map((piece) => piece.startSeconds), [0, 2])

assert.deepEqual(chunk([]), [])

console.log('studio/scripts/videos/parse.mjs ok')
