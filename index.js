/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module unified:bridge
 * @fileoverview Transform between two unified processors.
 */

'use strict';

/* eslint-env commonjs */

/**
 * Create a bridge between two unified processors.
 *
 * @param {Object} options - Configuration.
 * @param {Function} options.enter - Enter mutator.
 * @param {Function} [options.exit] - Exit mutator.
 * @param {string} [options.name] - Name of destination
 *   syntax tree.
 * @return {Bridge} - A bridge usable as a plug-in.
 */
function bridge(options) {
    var name = options.name;
    var enter = options.enter;
    var exit = options.exit;

    if (typeof name !== 'string') {
        throw new Error(
            'Expected string for name, got ' +
            '`' + name + '`'
        );
    }

    if (!enter) {
        throw new Error(
            'Expected `enter`, got `' + enter + '`'
        );
    }

    return function (origin, destination) {
        if (!destination) {
            throw new Error(
                'Expected destination processor, got ' +
                '`' + destination + '`'
            );
        }

        return function (node, file, next) {
            var tree = enter(origin, destination, file, node);

            file.namespace(name).tree = tree;

            destination.run(tree, file, function (err) {
                if (err) {
                    next(err);
                    return;
                }

                if (exit) {
                    exit(destination, origin, file, tree, node);
                }

                next();
            });
        };
    };
}

/*
 * Expose.
 */

module.exports = bridge;
