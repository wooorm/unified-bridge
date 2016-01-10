/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module unified:bridge
 * @fileoverview Test suite for `unified-bridge`.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var test = require('tape');
var mdast2nlcst = require('mdast-util-to-nlcst');
var remark = require('remark');
var retext = require('retext');
var VFile = require('vfile');
var bridge = require('./');

/*
 * Methods.
 */

var noop = Function.prototype;

/*
 * Tests.
 */

test('bridge(url)', function (t) {
    t.throws(
        function () {
            bridge();
        },
        /TypeError: Cannot read property 'name' of undefined/,
        'should fail when not given a string name'
    );

    t.throws(
        function () {
            bridge({});
        },
        /Error: Expected string for name, got `undefined`/,
        'should fail when not given a `name`'
    );

    t.throws(
        function () {
            bridge({
                'name': true
            });
        },
        /Error: Expected string for name, got `true`/,
        'should fail when not given a string `name`'
    );

    t.throws(
        function () {
            bridge({
                'name': 'test'
            });
        },
        /Error: Expected `enter`, got `undefined`/,
        'should fail when not given a `enter`'
    );

    t.test('mutator', function (st) {
        var isNextDestinationInvoked;
        var isFollowingOriginInvoked;
        var isNextOriginInvoked;
        var isEnterInvoked;
        var isExitInvoked;
        var processor1;
        var vfile;

        st.throws(
            function () {
                bridge({
                    'name': 'test',
                    'enter': noop
                })();
            },
            /Error: Expected destination processor, got `undefined`/,
            'should throw when not given a destination'
        );

        /**
         * Example `enter` implementation.
         *
         * @param {Processor} origin - Origin processor.
         * @param {Processor} destination - Destination
         *   processor.
         * @param {VFile} file - Virtual file.
         * @param {Node} node - Unist node.
         */
        function enter(origin, destination, file, node) {
            st.equal(
                typeof origin.use,
                'function',
                'should pass an origin'
            );

            st.equal(
                typeof destination.use,
                'function',
                'should pass a destination'
            );

            st.equal(
                typeof file.filePath,
                'function',
                'should pass a vfile'
            );

            st.equal(
                typeof node.type,
                'string',
                'should pass a node'
            );

            isEnterInvoked = true;

            return mdast2nlcst(file, destination.Parser);
        }

        st.throws(
            function () {
                remark().use(bridge({
                    'name': 'retext',
                    'enter': enter
                }));
            },
            /Error: Expected destination processor, got `undefined`/,
            'should throw when not given a destination (#2)'
        );

        processor1 = remark()
            .use(bridge({
                'name': 'retext',
                'enter': enter
            }), retext().use(function () {
                isNextDestinationInvoked = true;
            }))
            .use(function () {
                isNextOriginInvoked = true;
            });

        processor1.process('');

        st.equal(
            isEnterInvoked,
            true,
            'should invoke the bridge'
        );

        st.equal(
            isNextDestinationInvoked,
            true,
            'should invoke the next destination plug-in'
        );

        st.equal(
            isNextOriginInvoked,
            true,
            'should invoke the next origin plug-in'
        );

        vfile = VFile();
        vfile.quiet = true;

        remark()
            .use(bridge({
                'name': 'retext',
                'enter': enter
            }), retext().use(function () {
                return function () {
                    throw new Error('Whoops');
                };
            }))
            .use(function () {
                /* istanbul ignore next - should not be invoked */
                return function () {
                    isFollowingOriginInvoked = true;
                };
            })
            .process(vfile, function (err) {
                st.equal(err.message, 'Whoops');
            });

        st.equal(
            isFollowingOriginInvoked,
            undefined,
            'should break the pipeline when an error occurs ' +
            'in `destination`'
        );

        /**
         * Example `exit` implementation.
         *
         * @param {Processor} destination - Destination
         *   processor.
         * @param {Processor} origin - Origin processor.
         * @param {VFile} file - Virtual file.
         * @param {Node} tree - Unist node.
         * @param {Node} node - Unist node.
         */
        function exit(destination, origin, file, tree, node) {
            st.equal(
                typeof origin.use,
                'function',
                'should pass an origin'
            );

            st.equal(
                typeof destination.use,
                'function',
                'should pass a destination'
            );

            st.equal(
                typeof file.filePath,
                'function',
                'should pass a vfile'
            );

            st.equal(
                typeof tree.type,
                'string',
                'should pass a tree'
            );

            st.equal(
                typeof node.type,
                'string',
                'should pass a node'
            );

            isExitInvoked = true;

            node.data = {
                'test': true
            };
        }

        remark()
            .use(bridge({
                'name': 'retext',
                'enter': enter,
                'exit': exit
            }), retext())
            .use(function () {
                return function (tree) {
                    st.equal(
                        tree.data.test,
                        true,
                        'should expose the modified tree'
                    );
                };
            })
            .process(VFile());

        st.equal(isExitInvoked, true, 'should invoke exit');

        st.end();
    });

    t.end();
});
