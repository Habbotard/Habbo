/*
 Copyright (c) 2012 rhoot <https://github.com/rhoot>
 This software is provided 'as-is', without any express or implied
 warranty. In no event will the authors be held liable for any damages
 arising from the use of this software.
 Permission is granted to anyone to use this software for any purpose,
 including commercial applications, and to alter it and redistribute it
 freely, subject to the following restrictions:
    1. The origin of this software must not be misrepresented; you must not
    claim that you wrote the original software. If you use this software
    in a product, an acknowledgment in the product documentation would be
    appreciated but is not required.
    2. Altered source versions must be plainly marked as such, and must not be
    misrepresented as being the original software.
    3. This notice may not be removed or altered from any source
    distribution.
 */

/*
 Sample usage:
 rc4 = require 'rc4'
 engine = new rc4.Engine()
  * Encrypt 'Plaintext' with key 'Key'.
  * 'encrypted' contains a node.js Buffer with the results
 engine.init 'Key'
 encrypted = engine.encrypt 'Plaintext'
  * Encryption also works on byte arrays and node.js Buffer objects
  * This would give the same results as the above
 engine.init [ 0x4b, 0x65, 0x79 ]
 encrypted = engine.encrypt new Buffer([ 0x50, 0x6c, 0x61, 0x69, 0x6e, 0x74, 0x65, 0x78, 0x74 ])
  * Decrypting is just as easy 'Attack at dawn' with key 'Secret'
 engine.init 'Secret'
 message   = [ 0x45, 0xA0, 0x1F, 0x64, 0x5F, 0xC3, 0x5B, 0x38, 0x35, 0x52, 0x54, 0x4B, 0x9B, 0xF5 ]
 decrypted = engine.decrypt(message).toString()
  * Some encrypted messages require dropping the first x bytes of the keystream.
 engine.init 'Key'
 engine.drop 3072
 decrypted = engine.decrypt [ 0x36, 0x49, 0xbe, 0xa0, 0xdf, 0xb1, 0xd3, 0xcd, 0x3f ]
 */
var Rc4Engine, isArrayIsh, stringToArray;

isArrayIsh = function (obj) {
    return Array.isArray(obj) || Buffer.isBuffer(obj) || ((obj != null) && typeof obj === 'object' && typeof obj.length === 'number');
};

stringToArray = function (str) {
    var i, k, ref, results;
    results = [];
    for (i = k = 0, ref = str.length; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
        results.push(str.charCodeAt(i));
    }
    return results;
};

Rc4Engine = (function () {
    var step, swap;

    function Rc4Engine(key) {
        this.state = new Array(256);
        this.i1 = 0;
        this.i2 = 0;
        if (key != null) {
            this.init(key);
        }
    }

    swap = function (state, i1, i2) {
        var temp;
        temp = state[i1];
        state[i1] = state[i2];
        return state[i2] = temp;
    };

    step = function (e) {
        e.i1 = (e.i1 + 1) & 255;
        e.i2 = (e.i2 + e.state[e.i1]) & 255;
        return swap(e.state, e.i1, e.i2);
    };

    Rc4Engine.prototype.init = function (key) {
        var i, j, k, l, results, results1;
        if (typeof key === 'string') {
            key = stringToArray(key);
        }
        if (!isArrayIsh(key)) {
            throw new TypeError('Invalid key type');
        }
        this.state = (function () {
            results = [];
            for (k = 0; k < 256; k++) { results.push(k); }
            return results;
        }).apply(this);
        this.i1 = 0;
        this.i2 = 0;
        j = 0;
        results1 = [];
        for (i = l = 0; l < 256; i = ++l) {
            j = (j + this.state[i] + key[i % key.length]) & 255;
            results1.push(swap(this.state, i, j));
        }
        return results1;
    };

    Rc4Engine.prototype.drop = function (num) {
        var i, k, ref, results;
        if (typeof num !== 'number') {
            throw new TypeError('Invalid num argument.');
        }
        results = [];
        for (i = k = 0, ref = num; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
            results.push(step(this));
        }
        return results;
    };

    Rc4Engine.prototype.encrypt = function (bytes) {
        var encrypted, i, k, key, ref;
        if (typeof bytes === 'string') {
            bytes = stringToArray(bytes);
        }
        if (!isArrayIsh(bytes)) {
            throw new TypeError('Invalid data type.');
        }
        encrypted = new Buffer(bytes.length);
        for (i = k = 0, ref = bytes.length; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
            step(this);
            key = this.state[(this.state[this.i1] + this.state[this.i2]) & 0xff];
            encrypted[i] = bytes[i] ^ key;
        }
        return encrypted;
    };

    Rc4Engine.prototype.decrypt = function (bytes) {
        return this.encrypt(bytes);
    };

    return Rc4Engine;

})();

module.exports = {
    Engine: Rc4Engine
};