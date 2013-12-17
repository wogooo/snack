'use strict';

// Core
var EventEmitter = require('events').EventEmitter;

// Contrib
var Schema = require('jugglingdb').Schema;

// User
var utils = require('../lib/utils');

module.exports = function (schema) {

    var Model = schema.define('Post', {
        title: {
            type: String,
            length: 255
        },
        content: {
            type: Schema.Text
        },
        date: {
            type: Date,
            default: function () {
                return new Date();
            }
        },
        timestamp: {
            type: Number,
            default: Date.now
        },
        published: {
            type: Boolean,
            default: false,
            index: true
        }
    });
    Model.prototype.events = new EventEmitter();

    Model.afterInitialize = function () {
        console.log('afterInitialize!');
        EventEmitter.call(this);

        var self = this;
        setTimeout(function () {
            self.events.emit('foo', 'bar');
        }, 2000);

    };



    return new Model;
};

