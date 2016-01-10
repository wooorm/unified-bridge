# unified-bridge [![Build Status][travis-badge]][travis] [![Coverage Status][codecov-badge]][codecov]

[Unified][unified] bridges transform the syntax tree from one
processor to that of another processor.  Then, they apply the
destination processors plug-ins on said tree, before mutating
the original origin tree based on the modified destination tree
and continuing on running the origin plug-ins.

The exit step can be ignored.

```txt
         origin:run              destination:run               origin:run

        origin tree ---- \  / -- destination tree -- \  / ---- origin tree
          /               \/                          \/              \
         /                                                             \
        /             enter bridge                exit bridge           \
       /                                                                 \
     doc                                                                 doc

origin:parse                                                          origin:compile
```

## Installation

[npm][npm-install]:

```bash
npm install unified-bridge
```

**unified-bridge** is also available for [duo][duo-install], and as an
AMD, CommonJS, and globals module, [uncompressed and compressed][releases].

## Usage

In `remark-retext/index.js`:

```js
var bridge = require('unified-bridge');
var mdast2nlcst = require('mdast-util-to-nlcst');

function enter(origin, destination, file) {
    return mdast2nlcst(file, destination.Parser);
}

module.exports = bridge({
    'name': 'retext',
    'enter': enter
});
```

In `example.js`:

```js
var remark = require('remark');
var retext = require('retext');
var report = require('vfile-reporter');
var lint = require('remark-lint');
var html = require('remark-html');
var equality = require('retext-equality');
var remark2retext = require('remark-retext');

remark()
    .use(lint)
    .use(remark2retext, retext().use(equality))
    .use(html)
    .process('## Hey guys\n', function (err, file, doc) {
        if (err) {
            throw err;
        } else {
            process.stderr.write(report(file) + '\n');
            process.stdout.write(doc);
        }
    });
```

Yields:

```txt
<stdin>
   1:1-1:12  warning  First heading level should be `1`                                    first-heading-level
   1:8-1:12  warning  `guys` may be insensitive, use `people`, `persons`, `folks` instead

⚠ 2 warnings
<h2>Hey guys</h2>
```

## API

### `bridge(options)`

Transform between two unified processors.

**Parameters**:

*   `options` (`Object`):

    *   `name` (`string`)
        — Name of destination syntax tree;

    *   `enter` ([`Function`][doc-enter])
        — Function invoked to transform the syntax tree of the
        origin processor into the syntax tree of the destination
        processor.

    *   `exit` ([`Function?`][doc-exit],
        optional)
        — Function invoked to transform the syntax tree after processing by
        the destination processor back into a syntax tree suitable for
        the origin processor.

**Returns**: `Bridge` — A bridge, which can be used as a plug-in
for the origin parser you expect, accepting the expected destination
processor as its options.

**Throws**: `Error` — When `name` or `enter` is not `function`.

### `function enter(origin, destination, file, node)`

Transform `node`, which is a syntax tree produced by the `origin`
processor, into a tree as if it was produced by the `destination`
processor.

**Parameters**:

*   `origin` ([`Processor`][doc-processor])
    — Origin processor;

*   `destination` ([`Processor`][doc-processor])
    — Destination processor;

*   `file` ([`VFile`][doc-vfile])
    — Processed file;

*   `node` ([`Node`][doc-node])
    — Syntax tree for `file` suitable for `origin`.

**Returns**: [`Node`][doc-node] — Syntax tree of the given document
but mutated into a tree suitable for `destination`.

### `function exit(destination, origin, file, tree, node)`

Transform `node`, which is a syntax tree produced by the `origin`
processor, into a tree as if it was produced by the `destination`
processor.

**Parameters**:

*   `origin` ([`Processor`][doc-processor])
    — Origin processor;

*   `destination` ([`Processor`][doc-processor])
    — Destination processor;

*   `file` ([`VFile`][doc-vfile])
    — Processed file;

*   `tree` ([`Node`][doc-node])
    — Syntax tree for `file` suitable for `destination`,
    previously produced by `enter`;

*   `node` ([`Node`][doc-node])
    — Syntax tree for `file` suitable for `origin`, originally given
    to `enter`, which should be manipulated based on changes in `tree`.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[unified]: https://github.com/wooorm/unified

[travis-badge]: https://img.shields.io/travis/wooorm/unified-bridge.svg?style=flat

[travis]: https://travis-ci.org/wooorm/unified-bridge

[codecov-badge]: https://img.shields.io/codecov/c/github/wooorm/remark.svg

[codecov]: https://codecov.io/github/wooorm/remark

[npm-install]: https://docs.npmjs.com/cli/install

[duo-install]: http://duojs.org/#getting-started

[releases]: https://github.com/wooorm/unified-bridge/releases

[license]: LICENSE

[author]: http://wooorm.com

[doc-enter]: #function-enterorigin-destination-file-node

[doc-exit]: #function-exitdestination-origin-file-tree-node

[doc-processor]: https://github.com/wooorm/unified#processorprocessor

[doc-vfile]: https://github.com/wooorm/vfile#vfile

[doc-node]: https://github.com/wooorm/unist#unist-nodes
