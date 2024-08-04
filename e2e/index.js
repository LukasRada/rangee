require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rangee = void 0;
const constants_1 = require("./constants");
const compress_1 = require("./utils/compress");
const decode_1 = require("./utils/decode");
const decompress_1 = require("./utils/decompress");
const deserialize_1 = require("./utils/deserialize");
const encode_1 = require("./utils/encode");
const serialize_1 = require("./utils/serialize");
// TODO: Implement debug mode with nice debug line log
class Rangee {
    constructor(options) {
        this.onSerialization = (callback) => (this.serializationCallback = callback);
        this.onCompression = (callback) => (this.compressionCallback = callback);
        this.serializeAtomic = (range) => {
            var _a, _b;
            const atomicRanges = this.createAtomicRanges(range);
            const serialized = atomicRanges
                .map(range => (0, serialize_1.serialize)(range.cloneRange(), this.options.document.body))
                .map(serializedRange => JSON.stringify(serializedRange))
                .join('|');
            (_a = this.serializationCallback) === null || _a === void 0 ? void 0 : _a.call(this, serialized);
            const compressed = (0, compress_1.compress)(serialized);
            (_b = this.compressionCallback) === null || _b === void 0 ? void 0 : _b.call(this, compressed);
            const encoded = (0, encode_1.encode)(compressed);
            return encoded;
        };
        this.deserializeAtomic = (representation) => {
            const decoded = (0, decode_1.decode)(representation);
            const decompressed = (0, decompress_1.decompress)(decoded);
            const serializedRanges = decompressed
                .split('|')
                .map(decompressedRangeRepresentation => JSON.parse(decompressedRangeRepresentation))
                .map(serializedRange => (0, deserialize_1.deserialize)(serializedRange, this.options.document));
            return serializedRanges;
        };
        this.serialize = (range) => {
            var _a, _b;
            const serialized = (0, serialize_1.serialize)(range.cloneRange(), this.options.document.body);
            const serializedStringified = JSON.stringify(serialized);
            (_a = this.serializationCallback) === null || _a === void 0 ? void 0 : _a.call(this, serializedStringified);
            const compressed = (0, compress_1.compress)(serializedStringified);
            (_b = this.compressionCallback) === null || _b === void 0 ? void 0 : _b.call(this, compressed);
            const encoded = (0, encode_1.encode)(compressed);
            return encoded;
        };
        this.deserialize = (serialized) => {
            const decoded = (0, decode_1.decode)(serialized);
            const decompressed = (0, decompress_1.decompress)(decoded);
            const decompressedParsed = JSON.parse(decompressed);
            const deserialized = (0, deserialize_1.deserialize)(decompressedParsed, this.options.document);
            return deserialized;
        };
        this.createAtomicRanges = (range) => {
            if (range.startContainer === range.endContainer) {
                // text
                if (range.startContainer.nodeType === constants_1.DOM_NODE_TEXT_NODE) {
                    return [range];
                }
                // exact element
                const atomicRange = this.options.document.createRange();
                const first = range.startContainer.firstChild;
                const last = range.startContainer.lastChild;
                if (first === last) {
                    atomicRange.setStart(first, 0);
                    atomicRange.setEnd(last, last.length);
                    return [atomicRange];
                }
            }
            const documentAsAny = this.options.document; // IE does not know the right spec signature for createTreeWalker
            // element texts
            const treeWalker = documentAsAny.createTreeWalker(range.commonAncestorContainer, constants_1.DOM_NODE_FILTER_SHOW_ALL, () => constants_1.DOM_NODE_FILTER_ACCEPT, false);
            const atomicRanges = [];
            let startFound = false;
            let endFound = false;
            let node = treeWalker.root;
            do {
                if (range.startContainer === node) {
                    startFound = true;
                }
                if (startFound && !endFound && node.nodeType === constants_1.DOM_NODE_TEXT_NODE && node.textContent && node.textContent.trim().length > 0) {
                    const atomicRange = this.options.document.createRange();
                    atomicRange.setStart(node, node === range.startContainer ? range.startOffset : 0);
                    atomicRange.setEnd(node, node === range.endContainer ? range.endOffset : node.length);
                    atomicRanges.push(atomicRange);
                }
                if (range.endContainer === node) {
                    endFound = true;
                }
                node = treeWalker.nextNode();
            } while (node);
            return atomicRanges;
        };
        this.options = options;
        this.serializationCallback = null;
        this.compressionCallback = null;
    }
}
exports.Rangee = Rangee;

},{"./constants":2,"./utils/compress":3,"./utils/decode":4,"./utils/decompress":5,"./utils/deserialize":6,"./utils/encode":7,"./utils/serialize":10}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOM_NODE_FILTER_SHOW_ALL = exports.DOM_NODE_FILTER_ACCEPT = exports.DOM_NODE_TEXT_NODE = void 0;
// Node.TEXT_NODE
exports.DOM_NODE_TEXT_NODE = 3;
// NodeFilter.FILTER_ACCEPT
exports.DOM_NODE_FILTER_ACCEPT = 1;
// NodeFilter.SHOW_ALL
exports.DOM_NODE_FILTER_SHOW_ALL = 4294967295;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compress = void 0;
const lz_string_1 = require("lz-string");
const compress = (decompressed) => (0, lz_string_1.compressToUint8Array)(decompressed);
exports.compress = compress;

},{"lz-string":11}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = void 0;
const decode = (base64) => new Uint8Array([...atob(base64)].map(c => c.charCodeAt(0)));
exports.decode = decode;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decompress = void 0;
const lz_string_1 = require("lz-string");
const decompress = (compressed) => (0, lz_string_1.decompressFromUint8Array)(compressed);
exports.decompress = decompress;

},{"lz-string":11}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserialize = void 0;
const constants_1 = require("../constants");
const findNodeBySelector_1 = require("./findNodeBySelector");
const deserialize = (result, document) => {
    const range = document.createRange();
    let startNode = (0, findNodeBySelector_1.findNodeBySelector)(result.s, document);
    let endNode = (0, findNodeBySelector_1.findNodeBySelector)(result.e, document);
    if (startNode.nodeType !== constants_1.DOM_NODE_TEXT_NODE && startNode.firstChild) {
        startNode = startNode.firstChild;
    }
    if (endNode.nodeType !== constants_1.DOM_NODE_TEXT_NODE && endNode.firstChild) {
        endNode = endNode.firstChild;
    }
    if (startNode) {
        range.setStart(startNode, result.s.o);
    }
    if (endNode) {
        range.setEnd(endNode, result.e.o);
    }
    return range;
};
exports.deserialize = deserialize;

},{"../constants":2,"./findNodeBySelector":8}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encode = void 0;
const encode = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
exports.encode = encode;

},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNodeBySelector = void 0;
const findNodeBySelector = (result, document) => {
    const element = document.querySelector(result.s);
    if (!element) {
        // TODO: Create RangeeError and throw here
        throw new Error(`Unable to find element with selector: ${result.s}`);
    }
    if (result.c !== undefined && result.c !== null) {
        return element.childNodes[result.c];
    }
    return element;
};
exports.findNodeBySelector = findNodeBySelector;

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSelector = void 0;
const childNodeIndexOf = (parentNode, childNode) => {
    const childNodes = Array.from(parentNode.childNodes);
    let result = 0;
    for (let i = 0; i < childNodes.length; i++) {
        if (childNodes[i] === childNode) {
            result = i;
            break;
        }
    }
    return result;
};
const computedNthIndex = (childElement) => {
    let elementsWithSameTag = 0;
    const parent = childElement.parentElement;
    if (parent) {
        for (let i = 0, l = parent.childNodes.length; i < l; i++) {
            const currentHtmlElement = parent.childNodes[i];
            if (currentHtmlElement === childElement) {
                elementsWithSameTag++;
                break;
            }
            if (currentHtmlElement.tagName === childElement.tagName) {
                elementsWithSameTag++;
            }
        }
    }
    return elementsWithSameTag;
};
const generateSelector = (node, relativeTo) => {
    let currentNode = node;
    const tagNames = [];
    let textNodeIndex = 0;
    if (node.parentNode) {
        textNodeIndex = childNodeIndexOf(node.parentNode, node);
        while (currentNode) {
            const tagName = currentNode.tagName;
            if (tagName) {
                const nthIndex = computedNthIndex(currentNode);
                let selector = tagName;
                if (nthIndex > 1) {
                    selector += `:nth-of-type(${nthIndex})`;
                }
                tagNames.push(selector);
            }
            currentNode = currentNode.parentElement;
            if (currentNode === relativeTo.parentElement) {
                break;
            }
        }
    }
    return {
        s: tagNames.reverse().join('>').toLowerCase(),
        c: textNodeIndex,
        o: 0,
    };
};
exports.generateSelector = generateSelector;

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialize = void 0;
const generateSelector_1 = require("./generateSelector");
const serialize = (range, relativeTo) => {
    const start = (0, generateSelector_1.generateSelector)(range.startContainer, relativeTo);
    start.o = range.startOffset;
    const end = (0, generateSelector_1.generateSelector)(range.endContainer, relativeTo);
    end.o = range.endOffset;
    return { s: start, e: end };
};
exports.serialize = serialize;

},{"./generateSelector":9}],11:[function(require,module,exports){
// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/lz-string/testing.html
//
// LZ-based compression algorithm, version 1.4.5
var LZString = (function() {

// private property
var f = String.fromCharCode;
var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
var baseReverseDic = {};

function getBaseValue(alphabet, character) {
  if (!baseReverseDic[alphabet]) {
    baseReverseDic[alphabet] = {};
    for (var i=0 ; i<alphabet.length ; i++) {
      baseReverseDic[alphabet][alphabet.charAt(i)] = i;
    }
  }
  return baseReverseDic[alphabet][character];
}

var LZString = {
  compressToBase64 : function (input) {
    if (input == null) return "";
    var res = LZString._compress(input, 6, function(a){return keyStrBase64.charAt(a);});
    switch (res.length % 4) { // To produce valid Base64
    default: // When could this happen ?
    case 0 : return res;
    case 1 : return res+"===";
    case 2 : return res+"==";
    case 3 : return res+"=";
    }
  },

  decompressFromBase64 : function (input) {
    if (input == null) return "";
    if (input == "") return null;
    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
  },

  compressToUTF16 : function (input) {
    if (input == null) return "";
    return LZString._compress(input, 15, function(a){return f(a+32);}) + " ";
  },

  decompressFromUTF16: function (compressed) {
    if (compressed == null) return "";
    if (compressed == "") return null;
    return LZString._decompress(compressed.length, 16384, function(index) { return compressed.charCodeAt(index) - 32; });
  },

  //compress into uint8array (UCS-2 big endian format)
  compressToUint8Array: function (uncompressed) {
    var compressed = LZString.compress(uncompressed);
    var buf=new Uint8Array(compressed.length*2); // 2 bytes per character

    for (var i=0, TotalLen=compressed.length; i<TotalLen; i++) {
      var current_value = compressed.charCodeAt(i);
      buf[i*2] = current_value >>> 8;
      buf[i*2+1] = current_value % 256;
    }
    return buf;
  },

  //decompress from uint8array (UCS-2 big endian format)
  decompressFromUint8Array:function (compressed) {
    if (compressed===null || compressed===undefined){
        return LZString.decompress(compressed);
    } else {
        var buf=new Array(compressed.length/2); // 2 bytes per character
        for (var i=0, TotalLen=buf.length; i<TotalLen; i++) {
          buf[i]=compressed[i*2]*256+compressed[i*2+1];
        }

        var result = [];
        buf.forEach(function (c) {
          result.push(f(c));
        });
        return LZString.decompress(result.join(''));

    }

  },


  //compress into a string that is already URI encoded
  compressToEncodedURIComponent: function (input) {
    if (input == null) return "";
    return LZString._compress(input, 6, function(a){return keyStrUriSafe.charAt(a);});
  },

  //decompress from an output of compressToEncodedURIComponent
  decompressFromEncodedURIComponent:function (input) {
    if (input == null) return "";
    if (input == "") return null;
    input = input.replace(/ /g, "+");
    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
  },

  compress: function (uncompressed) {
    return LZString._compress(uncompressed, 16, function(a){return f(a);});
  },
  _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
    if (uncompressed == null) return "";
    var i, value,
        context_dictionary= {},
        context_dictionaryToCreate= {},
        context_c="",
        context_wc="",
        context_w="",
        context_enlargeIn= 2, // Compensate for the first entry which should not count
        context_dictSize= 3,
        context_numBits= 2,
        context_data=[],
        context_data_val=0,
        context_data_position=0,
        ii;

    for (ii = 0; ii < uncompressed.length; ii += 1) {
      context_c = uncompressed.charAt(ii);
      if (!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }

      context_wc = context_w + context_c;
      if (Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)) {
        context_w = context_wc;
      } else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
          if (context_w.charCodeAt(0)<256) {
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<8 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position ==bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<16 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }


        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        // Add wc to the dictionary.
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }

    // Output the code for w.
    if (context_w !== "") {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
        if (context_w.charCodeAt(0)<256) {
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<8 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | value;
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<16 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i=0 ; i<context_numBits ; i++) {
          context_data_val = (context_data_val << 1) | (value&1);
          if (context_data_position == bitsPerChar-1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }


      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
    }

    // Mark the end of the stream
    value = 2;
    for (i=0 ; i<context_numBits ; i++) {
      context_data_val = (context_data_val << 1) | (value&1);
      if (context_data_position == bitsPerChar-1) {
        context_data_position = 0;
        context_data.push(getCharFromInt(context_data_val));
        context_data_val = 0;
      } else {
        context_data_position++;
      }
      value = value >> 1;
    }

    // Flush the last char
    while (true) {
      context_data_val = (context_data_val << 1);
      if (context_data_position == bitsPerChar-1) {
        context_data.push(getCharFromInt(context_data_val));
        break;
      }
      else context_data_position++;
    }
    return context_data.join('');
  },

  decompress: function (compressed) {
    if (compressed == null) return "";
    if (compressed == "") return null;
    return LZString._decompress(compressed.length, 32768, function(index) { return compressed.charCodeAt(index); });
  },

  _decompress: function (length, resetValue, getNextValue) {
    var dictionary = [],
        next,
        enlargeIn = 4,
        dictSize = 4,
        numBits = 3,
        entry = "",
        result = [],
        i,
        w,
        bits, resb, maxpower, power,
        c,
        data = {val:getNextValue(0), position:resetValue, index:1};

    for (i = 0; i < 3; i += 1) {
      dictionary[i] = i;
    }

    bits = 0;
    maxpower = Math.pow(2,2);
    power=1;
    while (power!=maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position == 0) {
        data.position = resetValue;
        data.val = getNextValue(data.index++);
      }
      bits |= (resb>0 ? 1 : 0) * power;
      power <<= 1;
    }

    switch (next = bits) {
      case 0:
          bits = 0;
          maxpower = Math.pow(2,8);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = f(bits);
        break;
      case 1:
          bits = 0;
          maxpower = Math.pow(2,16);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = f(bits);
        break;
      case 2:
        return "";
    }
    dictionary[3] = c;
    w = c;
    result.push(c);
    while (true) {
      if (data.index > length) {
        return "";
      }

      bits = 0;
      maxpower = Math.pow(2,numBits);
      power=1;
      while (power!=maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position == 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb>0 ? 1 : 0) * power;
        power <<= 1;
      }

      switch (c = bits) {
        case 0:
          bits = 0;
          maxpower = Math.pow(2,8);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }

          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 1:
          bits = 0;
          maxpower = Math.pow(2,16);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 2:
          return result.join('');
      }

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

      if (dictionary[c]) {
        entry = dictionary[c];
      } else {
        if (c === dictSize) {
          entry = w + w.charAt(0);
        } else {
          return null;
        }
      }
      result.push(entry);

      // Add w+entry[0] to the dictionary.
      dictionary[dictSize++] = w + entry.charAt(0);
      enlargeIn--;

      w = entry;

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

    }
  }
};
  return LZString;
})();

if (typeof define === 'function' && define.amd) {
  define(function () { return LZString; });
} else if( typeof module !== 'undefined' && module != null ) {
  module.exports = LZString
} else if( typeof angular !== 'undefined' && angular != null ) {
  angular.module('LZString', [])
  .factory('LZString', function () {
    return LZString;
  });
}

},{}],"rangee":[function(require,module,exports){
"use strict";
const Rangee_1 = require("./Rangee");
module.exports = Rangee_1.Rangee;

},{"./Rangee":1}]},{},[]);
