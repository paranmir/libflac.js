

// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module !== 'undefined' ? Module : {};



// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// libflac.js - port of libflac to JavaScript using emscripten


(function (root, factory) {

	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['module', 'require'], factory.bind(null, root));
	} else if (typeof module === 'object' && module.exports) {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.

		// use process.env (if available) for reading Flac environment settings:
		var env = typeof process !== 'undefined' && process && process.env? process.env : root;
		factory(env, module, module.require);
	} else {
		// Browser globals
		root.Flac = factory(root);
	}

}(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : this, function (global, expLib, require) {
'use strict';

var Module = Module || {};
var _flac_ready = false;
//in case resources are loaded asynchronously (e.g. *.mem file for minified version): setup "ready" handling
Module["onRuntimeInitialized"] = function(){
	_flac_ready = true;
	if(!_exported){
		//if _exported is not yet set (may happen, in case initialization was strictly synchronously),
		// do "pause" until sync initialization has run through
		setTimeout(function(){do_fire_event('ready', [{type: 'ready', target: _exported}], true);}, 0);
	} else {
		do_fire_event('ready', [{type: 'ready', target: _exported}], true);
	}
};

if(global && global.FLAC_SCRIPT_LOCATION){

	Module["locateFile"] = function(fileName){
		var path = global.FLAC_SCRIPT_LOCATION || '';
		if(path[fileName]){
			return path[fileName];
		}
		path += path && !/\/$/.test(path)? '/' : '';
		return path + fileName;
	};

	//NOTE will be overwritten if emscripten has env specific implementation for this
	var readBinary = function(filePath){

		//for Node: use default implementation (copied from generated code):
		if(ENVIRONMENT_IS_NODE){
			var ret = read_(filePath, true);
			if (!ret.buffer) {
				ret = new Uint8Array(ret);
			}
			assert(ret.buffer);
			return ret;
		}

		//otherwise: try "fallback" to AJAX
		return new Promise(function(resolve, reject){
			var xhr = new XMLHttpRequest();
			xhr.responseType = "arraybuffer";
			xhr.addEventListener("load", function(evt){
				resolve(xhr.response);
			});
			xhr.addEventListener("error", function(err){
				reject(err);
			});
			xhr.open("GET", filePath);
			xhr.send();
		});
	};
}

//fallback for fetch && support file://-protocol: try read as binary if fetch fails
if(global && typeof global.fetch === 'function'){
	var _fetch = global.fetch;
	global.fetch = function(url){
		return _fetch.apply(null, arguments).catch(function(err){
			try{
				var result = readBinary(url);
				if(result && result.catch){
					result.catch(function(_err){throw err});
				}
				return result;
			} catch(_err){
				throw err;
			}
		});
	};
}



// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = function(status, toThrow) {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string';
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;




// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_,
    readAsync,
    readBinary,
    setWindowTitle;

var nodeFS;
var nodePath;

if (ENVIRONMENT_IS_NODE) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = require('path').dirname(scriptDirectory) + '/';
  } else {
    scriptDirectory = __dirname + '/';
  }




  read_ = function shell_read(filename, binary) {
    var ret = tryParseAsDataURI(filename);
    if (ret) {
      return binary ? ret : ret.toString();
    }
    if (!nodeFS) nodeFS = require('fs');
    if (!nodePath) nodePath = require('path');
    filename = nodePath['normalize'](filename);
    return nodeFS['readFileSync'](filename, binary ? null : 'utf8');
  };

  readBinary = function readBinary(filename) {
    var ret = read_(filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };




  if (process['argv'].length > 1) {
    thisProgram = process['argv'][1].replace(/\\/g, '/');
  }

  arguments_ = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });

  process['on']('unhandledRejection', abort);

  quit_ = function(status) {
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };



} else
if (ENVIRONMENT_IS_SHELL) {


  if (typeof read != 'undefined') {
    read_ = function shell_read(f) {
      var data = tryParseAsDataURI(f);
      if (data) {
        return intArrayToString(data);
      }
      return read(f);
    };
  }

  readBinary = function readBinary(f) {
    var data;
    data = tryParseAsDataURI(f);
    if (data) {
      return data;
    }
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit === 'function') {
    quit_ = function(status) {
      quit(status);
    };
  }

  if (typeof print !== 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console === 'undefined') console = /** @type{!Console} */({});
    console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
    console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr !== 'undefined' ? printErr : print);
  }


} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
  } else {
    scriptDirectory = '';
  }


  // Differentiate the Web Worker from the Node Worker case, as reading must
  // be done differently.
  {




  read_ = function shell_read(url) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.responseText;
    } catch (err) {
      var data = tryParseAsDataURI(url);
      if (data) {
        return intArrayToString(data);
      }
      throw err;
    }
  };

  if (ENVIRONMENT_IS_WORKER) {
    readBinary = function readBinary(url) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'arraybuffer';
        xhr.send(null);
        return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
      } catch (err) {
        var data = tryParseAsDataURI(url);
        if (data) {
          return data;
        }
        throw err;
      }
    };
  }

  readAsync = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      var data = tryParseAsDataURI(url);
      if (data) {
        onload(data.buffer);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };




  }

  setWindowTitle = function(title) { document.title = title };
} else
{
}


// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.warn.bind(console);

// Merge back in the overrides
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.
if (Module['arguments']) arguments_ = Module['arguments'];
if (Module['thisProgram']) thisProgram = Module['thisProgram'];
if (Module['quit']) quit_ = Module['quit'];

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message





// {{PREAMBLE_ADDITIONS}}

var STACK_ALIGN = 16;

function dynamicAlloc(size) {
  var ret = HEAP32[DYNAMICTOP_PTR>>2];
  var end = (ret + size + 15) & -16;
  HEAP32[DYNAMICTOP_PTR>>2] = end;
  return ret;
}

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
  return Math.ceil(size / factor) * factor;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length-1] === '*') {
        return 4; // A pointer
      } else if (type[0] === 'i') {
        var bits = Number(type.substr(1));
        assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}








// Wraps a JS function as a wasm function with a given signature.
function convertJsFunctionToWasm(func, sig) {
  return func;
}

var freeTableIndexes = [];

// Weak map of functions in the table to their indexes, created on first use.
var functionsInTableMap;

// Add a wasm function to the table.
function addFunctionWasm(func, sig) {
  var table = wasmTable;

  // Check if the function is already in the table, to ensure each function
  // gets a unique index. First, create the map if this is the first use.
  if (!functionsInTableMap) {
    functionsInTableMap = new WeakMap();
    for (var i = 0; i < table.length; i++) {
      var item = table.get(i);
      // Ignore null values.
      if (item) {
        functionsInTableMap.set(item, i);
      }
    }
  }
  if (functionsInTableMap.has(func)) {
    return functionsInTableMap.get(func);
  }

  // It's not in the table, add it now.


  var ret;
  // Reuse a free index if there is one, otherwise grow.
  if (freeTableIndexes.length) {
    ret = freeTableIndexes.pop();
  } else {
    ret = table.length;
    // Grow the table
    try {
      table.grow(1);
    } catch (err) {
      if (!(err instanceof RangeError)) {
        throw err;
      }
      throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.';
    }
  }

  // Set the new value.
  try {
    // Attempting to call this with JS function will cause of table.set() to fail
    table.set(ret, func);
  } catch (err) {
    if (!(err instanceof TypeError)) {
      throw err;
    }
    var wrapped = convertJsFunctionToWasm(func, sig);
    table.set(ret, wrapped);
  }

  functionsInTableMap.set(func, ret);

  return ret;
}

function removeFunctionWasm(index) {
  functionsInTableMap.delete(wasmTable.get(index));
  freeTableIndexes.push(index);
}

// 'sig' parameter is required for the llvm backend but only when func is not
// already a WebAssembly function.
function addFunction(func, sig) {

  return addFunctionWasm(func, sig);
}

function removeFunction(index) {
  removeFunctionWasm(index);
}



var funcWrappers = {};

function getFuncWrapper(func, sig) {
  if (!func) return; // on null pointer, return undefined
  assert(sig);
  if (!funcWrappers[sig]) {
    funcWrappers[sig] = {};
  }
  var sigCache = funcWrappers[sig];
  if (!sigCache[func]) {
    // optimize away arguments usage in common cases
    if (sig.length === 1) {
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func);
      };
    } else if (sig.length === 2) {
      sigCache[func] = function dynCall_wrapper(arg) {
        return dynCall(sig, func, [arg]);
      };
    } else {
      // general case
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func, Array.prototype.slice.call(arguments));
      };
    }
  }
  return sigCache[func];
}







function makeBigInt(low, high, unsigned) {
  return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
}

/** @param {Array=} args */
function dynCall(sig, ptr, args) {
  if (args && args.length) {
    return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
  } else {
    return Module['dynCall_' + sig].call(null, ptr);
  }
}

var tempRet0 = 0;

var setTempRet0 = function(value) {
  tempRet0 = value;
};

var getTempRet0 = function() {
  return tempRet0;
};


// The address globals begin at. Very low in memory, for code size and optimization opportunities.
// Above 0 is static memory, starting with globals.
// Then the stack.
// Then 'dynamic' memory for sbrk.
var GLOBAL_BASE = 1024;





// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html


var wasmBinary;if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];
var noExitRuntime;if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime'];




// wasm2js.js - enough of a polyfill for the WebAssembly object so that we can load
// wasm2js code that way.

// Emit "var WebAssembly" if definitely using wasm2js. Otherwise, in MAYBE_WASM2JS
// mode, we can't use a "var" since it would prevent normal wasm from working.
/** @suppress{const} */
var
WebAssembly = {
  Memory: /** @constructor */ function(opts) {
    return {
      buffer: new ArrayBuffer(opts['initial'] * 65536),
      grow: function(amount) {
        var ret = __growWasmMemory(amount);
        return ret;
      }
    };
  },

  Table: function(opts) {
    var ret = new Array(opts['initial']);
    ret.grow = function(by) {
      if (ret.length >= 22 + 5) {
        abort('Unable to grow wasm table. Use a higher value for RESERVED_FUNCTION_POINTERS or set ALLOW_TABLE_GROWTH.')
      }
      ret.push(null);
    };
    ret.set = function(i, func) {
      ret[i] = func;
    };
    ret.get = function(i) {
      return ret[i];
    };
    return ret;
  },

  Module: function(binary) {
    // TODO: use the binary and info somehow - right now the wasm2js output is embedded in
    // the main JS
    return {};
  },

  Instance: function(module, info) {
    // TODO: use the module and info somehow - right now the wasm2js output is embedded in
    // the main JS
    // This will be replaced by the actual wasm2js code.
    var exports = (
function instantiate(asmLibraryArg, wasmMemory, wasmTable) {


  var scratchBuffer = new ArrayBuffer(8);
  var i32ScratchView = new Int32Array(scratchBuffer);
  var f32ScratchView = new Float32Array(scratchBuffer);
  var f64ScratchView = new Float64Array(scratchBuffer);
  
  function wasm2js_scratch_load_i32(index) {
    return i32ScratchView[index];
  }
      
  function wasm2js_scratch_store_i32(index, value) {
    i32ScratchView[index] = value;
  }
      
  function wasm2js_scratch_load_f64() {
    return f64ScratchView[0];
  }
      
  function wasm2js_scratch_store_f64(value) {
    f64ScratchView[0] = value;
  }
      
  function legalimport$wasm2js_scratch_load_i64() {
    if (typeof setTempRet0 === 'function') setTempRet0(i32ScratchView[1]);
    return i32ScratchView[0];
  }
      
  function legalimport$wasm2js_scratch_store_i64(low, high) {
    i32ScratchView[0] = low;
    i32ScratchView[1] = high;
  }
      
  function wasm2js_scratch_store_f32(value) {
    f32ScratchView[0] = value;
  }
      
function asmFunc(global, env, buffer) {
 var memory = env.memory;
 var FUNCTION_TABLE = wasmTable;
 var HEAP8 = new global.Int8Array(buffer);
 var HEAP16 = new global.Int16Array(buffer);
 var HEAP32 = new global.Int32Array(buffer);
 var HEAPU8 = new global.Uint8Array(buffer);
 var HEAPU16 = new global.Uint16Array(buffer);
 var HEAPU32 = new global.Uint32Array(buffer);
 var HEAPF32 = new global.Float32Array(buffer);
 var HEAPF64 = new global.Float64Array(buffer);
 var Math_imul = global.Math.imul;
 var Math_fround = global.Math.fround;
 var Math_abs = global.Math.abs;
 var Math_clz32 = global.Math.clz32;
 var Math_min = global.Math.min;
 var Math_max = global.Math.max;
 var Math_floor = global.Math.floor;
 var Math_ceil = global.Math.ceil;
 var Math_sqrt = global.Math.sqrt;
 var abort = env.abort;
 var nan = global.NaN;
 var infinity = global.Infinity;
 var emscripten_resize_heap = env.emscripten_resize_heap;
 var emscripten_memcpy_big = env.emscripten_memcpy_big;
 var __wasi_fd_close = env.fd_close;
 var __wasi_fd_read = env.fd_read;
 var round = env.round;
 var __wasi_fd_write = env.fd_write;
 var setTempRet0 = env.setTempRet0;
 var legalimport$__wasi_fd_seek = env.fd_seek;
 var getTempRet0 = env.getTempRet0;
 var global$0 = 5257200;
 var global$1 = 14152;
 var i64toi32_i32$HIGH_BITS = 0;
 // EMSCRIPTEN_START_FUNCS
;
 function __wasm_call_ctors() {
  
 }
 
 function __errno_location() {
  return 11568;
 }
 
 function sbrk($0) {
  var $1 = 0, $2 = 0;
  $1 = HEAP32[3540];
  $2 = $0 + 3 & -4;
  $0 = $1 + $2 | 0;
  label$1 : {
   if ($0 >>> 0 <= $1 >>> 0 ? ($2 | 0) >= 1 : 0) {
    break label$1
   }
   if ($0 >>> 0 > __wasm_memory_size() << 16 >>> 0) {
    if (!emscripten_resize_heap($0 | 0)) {
     break label$1
    }
   }
   HEAP32[3540] = $0;
   return $1;
  }
  HEAP32[2892] = 48;
  return -1;
 }
 
 function memset($0, $1) {
  var $2 = 0, $3 = 0;
  label$1 : {
   if (!$1) {
    break label$1
   }
   $2 = $0 + $1 | 0;
   HEAP8[$2 + -1 | 0] = 0;
   HEAP8[$0 | 0] = 0;
   if ($1 >>> 0 < 3) {
    break label$1
   }
   HEAP8[$2 + -2 | 0] = 0;
   HEAP8[$0 + 1 | 0] = 0;
   HEAP8[$2 + -3 | 0] = 0;
   HEAP8[$0 + 2 | 0] = 0;
   if ($1 >>> 0 < 7) {
    break label$1
   }
   HEAP8[$2 + -4 | 0] = 0;
   HEAP8[$0 + 3 | 0] = 0;
   if ($1 >>> 0 < 9) {
    break label$1
   }
   $3 = 0 - $0 & 3;
   $2 = $3 + $0 | 0;
   HEAP32[$2 >> 2] = 0;
   $3 = $1 - $3 & -4;
   $1 = $3 + $2 | 0;
   HEAP32[$1 + -4 >> 2] = 0;
   if ($3 >>> 0 < 9) {
    break label$1
   }
   HEAP32[$2 + 8 >> 2] = 0;
   HEAP32[$2 + 4 >> 2] = 0;
   HEAP32[$1 + -8 >> 2] = 0;
   HEAP32[$1 + -12 >> 2] = 0;
   if ($3 >>> 0 < 25) {
    break label$1
   }
   HEAP32[$2 + 24 >> 2] = 0;
   HEAP32[$2 + 20 >> 2] = 0;
   HEAP32[$2 + 16 >> 2] = 0;
   HEAP32[$2 + 12 >> 2] = 0;
   HEAP32[$1 + -16 >> 2] = 0;
   HEAP32[$1 + -20 >> 2] = 0;
   HEAP32[$1 + -24 >> 2] = 0;
   HEAP32[$1 + -28 >> 2] = 0;
   $1 = $3;
   $3 = $2 & 4 | 24;
   $1 = $1 - $3 | 0;
   if ($1 >>> 0 < 32) {
    break label$1
   }
   $2 = $2 + $3 | 0;
   while (1) {
    HEAP32[$2 + 24 >> 2] = 0;
    HEAP32[$2 + 28 >> 2] = 0;
    HEAP32[$2 + 16 >> 2] = 0;
    HEAP32[$2 + 20 >> 2] = 0;
    HEAP32[$2 + 8 >> 2] = 0;
    HEAP32[$2 + 12 >> 2] = 0;
    HEAP32[$2 >> 2] = 0;
    HEAP32[$2 + 4 >> 2] = 0;
    $2 = $2 + 32 | 0;
    $1 = $1 + -32 | 0;
    if ($1 >>> 0 > 31) {
     continue
    }
    break;
   };
  }
  return $0;
 }
 
 function memcpy($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0;
  if ($2 >>> 0 >= 512) {
   emscripten_memcpy_big($0 | 0, $1 | 0, $2 | 0) | 0;
   return $0;
  }
  $4 = $0 + $2 | 0;
  label$2 : {
   if (!(($0 ^ $1) & 3)) {
    label$4 : {
     if (($2 | 0) < 1) {
      $2 = $0;
      break label$4;
     }
     if (!($0 & 3)) {
      $2 = $0;
      break label$4;
     }
     $2 = $0;
     while (1) {
      HEAP8[$2 | 0] = HEAPU8[$1 | 0];
      $1 = $1 + 1 | 0;
      $2 = $2 + 1 | 0;
      if ($2 >>> 0 >= $4 >>> 0) {
       break label$4
      }
      if ($2 & 3) {
       continue
      }
      break;
     };
    }
    $3 = $4 & -4;
    label$8 : {
     if ($3 >>> 0 < 64) {
      break label$8
     }
     $5 = $3 + -64 | 0;
     if ($2 >>> 0 > $5 >>> 0) {
      break label$8
     }
     while (1) {
      HEAP32[$2 >> 2] = HEAP32[$1 >> 2];
      HEAP32[$2 + 4 >> 2] = HEAP32[$1 + 4 >> 2];
      HEAP32[$2 + 8 >> 2] = HEAP32[$1 + 8 >> 2];
      HEAP32[$2 + 12 >> 2] = HEAP32[$1 + 12 >> 2];
      HEAP32[$2 + 16 >> 2] = HEAP32[$1 + 16 >> 2];
      HEAP32[$2 + 20 >> 2] = HEAP32[$1 + 20 >> 2];
      HEAP32[$2 + 24 >> 2] = HEAP32[$1 + 24 >> 2];
      HEAP32[$2 + 28 >> 2] = HEAP32[$1 + 28 >> 2];
      HEAP32[$2 + 32 >> 2] = HEAP32[$1 + 32 >> 2];
      HEAP32[$2 + 36 >> 2] = HEAP32[$1 + 36 >> 2];
      HEAP32[$2 + 40 >> 2] = HEAP32[$1 + 40 >> 2];
      HEAP32[$2 + 44 >> 2] = HEAP32[$1 + 44 >> 2];
      HEAP32[$2 + 48 >> 2] = HEAP32[$1 + 48 >> 2];
      HEAP32[$2 + 52 >> 2] = HEAP32[$1 + 52 >> 2];
      HEAP32[$2 + 56 >> 2] = HEAP32[$1 + 56 >> 2];
      HEAP32[$2 + 60 >> 2] = HEAP32[$1 + 60 >> 2];
      $1 = $1 - -64 | 0;
      $2 = $2 - -64 | 0;
      if ($2 >>> 0 <= $5 >>> 0) {
       continue
      }
      break;
     };
    }
    if ($2 >>> 0 >= $3 >>> 0) {
     break label$2
    }
    while (1) {
     HEAP32[$2 >> 2] = HEAP32[$1 >> 2];
     $1 = $1 + 4 | 0;
     $2 = $2 + 4 | 0;
     if ($2 >>> 0 < $3 >>> 0) {
      continue
     }
     break;
    };
    break label$2;
   }
   if ($4 >>> 0 < 4) {
    $2 = $0;
    break label$2;
   }
   $3 = $4 + -4 | 0;
   if ($3 >>> 0 < $0 >>> 0) {
    $2 = $0;
    break label$2;
   }
   $2 = $0;
   while (1) {
    HEAP8[$2 | 0] = HEAPU8[$1 | 0];
    HEAP8[$2 + 1 | 0] = HEAPU8[$1 + 1 | 0];
    HEAP8[$2 + 2 | 0] = HEAPU8[$1 + 2 | 0];
    HEAP8[$2 + 3 | 0] = HEAPU8[$1 + 3 | 0];
    $1 = $1 + 4 | 0;
    $2 = $2 + 4 | 0;
    if ($2 >>> 0 <= $3 >>> 0) {
     continue
    }
    break;
   };
  }
  if ($2 >>> 0 < $4 >>> 0) {
   while (1) {
    HEAP8[$2 | 0] = HEAPU8[$1 | 0];
    $1 = $1 + 1 | 0;
    $2 = $2 + 1 | 0;
    if (($4 | 0) != ($2 | 0)) {
     continue
    }
    break;
   }
  }
  return $0;
 }
 
 function dlmalloc($0) {
  $0 = $0 | 0;
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, wasm2js_i32$0 = 0, wasm2js_i32$1 = 0;
  $11 = global$0 - 16 | 0;
  global$0 = $11;
  label$1 : {
   label$2 : {
    label$3 : {
     label$4 : {
      label$5 : {
       label$6 : {
        label$7 : {
         label$8 : {
          label$9 : {
           label$10 : {
            label$11 : {
             if ($0 >>> 0 <= 244) {
              $6 = HEAP32[2893];
              $5 = $0 >>> 0 < 11 ? 16 : $0 + 11 & -8;
              $0 = $5 >>> 3 | 0;
              $1 = $6 >>> $0 | 0;
              if ($1 & 3) {
               $2 = $0 + (($1 ^ -1) & 1) | 0;
               $5 = $2 << 3;
               $1 = HEAP32[$5 + 11620 >> 2];
               $0 = $1 + 8 | 0;
               $3 = HEAP32[$1 + 8 >> 2];
               $5 = $5 + 11612 | 0;
               label$14 : {
                if (($3 | 0) == ($5 | 0)) {
                 (wasm2js_i32$0 = 11572, wasm2js_i32$1 = __wasm_rotl_i32(-2, $2) & $6), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
                 break label$14;
                }
                HEAP32[$3 + 12 >> 2] = $5;
                HEAP32[$5 + 8 >> 2] = $3;
               }
               $2 = $2 << 3;
               HEAP32[$1 + 4 >> 2] = $2 | 3;
               $1 = $1 + $2 | 0;
               HEAP32[$1 + 4 >> 2] = HEAP32[$1 + 4 >> 2] | 1;
               break label$1;
              }
              $7 = HEAP32[2895];
              if ($5 >>> 0 <= $7 >>> 0) {
               break label$11
              }
              if ($1) {
               $2 = 2 << $0;
               $0 = (0 - $2 | $2) & $1 << $0;
               $0 = (0 - $0 & $0) + -1 | 0;
               $1 = $0 >>> 12 & 16;
               $2 = $1;
               $0 = $0 >>> $1 | 0;
               $1 = $0 >>> 5 & 8;
               $2 = $2 | $1;
               $0 = $0 >>> $1 | 0;
               $1 = $0 >>> 2 & 4;
               $2 = $2 | $1;
               $0 = $0 >>> $1 | 0;
               $1 = $0 >>> 1 & 2;
               $2 = $2 | $1;
               $0 = $0 >>> $1 | 0;
               $1 = $0 >>> 1 & 1;
               $2 = ($2 | $1) + ($0 >>> $1 | 0) | 0;
               $3 = $2 << 3;
               $1 = HEAP32[$3 + 11620 >> 2];
               $0 = HEAP32[$1 + 8 >> 2];
               $3 = $3 + 11612 | 0;
               label$17 : {
                if (($0 | 0) == ($3 | 0)) {
                 $6 = __wasm_rotl_i32(-2, $2) & $6;
                 HEAP32[2893] = $6;
                 break label$17;
                }
                HEAP32[$0 + 12 >> 2] = $3;
                HEAP32[$3 + 8 >> 2] = $0;
               }
               $0 = $1 + 8 | 0;
               HEAP32[$1 + 4 >> 2] = $5 | 3;
               $4 = $1 + $5 | 0;
               $2 = $2 << 3;
               $3 = $2 - $5 | 0;
               HEAP32[$4 + 4 >> 2] = $3 | 1;
               HEAP32[$1 + $2 >> 2] = $3;
               if ($7) {
                $5 = $7 >>> 3 | 0;
                $1 = ($5 << 3) + 11612 | 0;
                $2 = HEAP32[2898];
                $5 = 1 << $5;
                label$20 : {
                 if (!($5 & $6)) {
                  HEAP32[2893] = $5 | $6;
                  $5 = $1;
                  break label$20;
                 }
                 $5 = HEAP32[$1 + 8 >> 2];
                }
                HEAP32[$1 + 8 >> 2] = $2;
                HEAP32[$5 + 12 >> 2] = $2;
                HEAP32[$2 + 12 >> 2] = $1;
                HEAP32[$2 + 8 >> 2] = $5;
               }
               HEAP32[2898] = $4;
               HEAP32[2895] = $3;
               break label$1;
              }
              $10 = HEAP32[2894];
              if (!$10) {
               break label$11
              }
              $0 = ($10 & 0 - $10) + -1 | 0;
              $1 = $0 >>> 12 & 16;
              $2 = $1;
              $0 = $0 >>> $1 | 0;
              $1 = $0 >>> 5 & 8;
              $2 = $2 | $1;
              $0 = $0 >>> $1 | 0;
              $1 = $0 >>> 2 & 4;
              $2 = $2 | $1;
              $0 = $0 >>> $1 | 0;
              $1 = $0 >>> 1 & 2;
              $2 = $2 | $1;
              $0 = $0 >>> $1 | 0;
              $1 = $0 >>> 1 & 1;
              $1 = HEAP32[(($2 | $1) + ($0 >>> $1 | 0) << 2) + 11876 >> 2];
              $3 = (HEAP32[$1 + 4 >> 2] & -8) - $5 | 0;
              $2 = $1;
              while (1) {
               label$23 : {
                $0 = HEAP32[$2 + 16 >> 2];
                if (!$0) {
                 $0 = HEAP32[$2 + 20 >> 2];
                 if (!$0) {
                  break label$23
                 }
                }
                $4 = (HEAP32[$0 + 4 >> 2] & -8) - $5 | 0;
                $2 = $4 >>> 0 < $3 >>> 0;
                $3 = $2 ? $4 : $3;
                $1 = $2 ? $0 : $1;
                $2 = $0;
                continue;
               }
               break;
              };
              $9 = HEAP32[$1 + 24 >> 2];
              $4 = HEAP32[$1 + 12 >> 2];
              if (($4 | 0) != ($1 | 0)) {
               $0 = HEAP32[$1 + 8 >> 2];
               HEAP32[$0 + 12 >> 2] = $4;
               HEAP32[$4 + 8 >> 2] = $0;
               break label$2;
              }
              $2 = $1 + 20 | 0;
              $0 = HEAP32[$2 >> 2];
              if (!$0) {
               $0 = HEAP32[$1 + 16 >> 2];
               if (!$0) {
                break label$10
               }
               $2 = $1 + 16 | 0;
              }
              while (1) {
               $8 = $2;
               $4 = $0;
               $2 = $0 + 20 | 0;
               $0 = HEAP32[$2 >> 2];
               if ($0) {
                continue
               }
               $2 = $4 + 16 | 0;
               $0 = HEAP32[$4 + 16 >> 2];
               if ($0) {
                continue
               }
               break;
              };
              HEAP32[$8 >> 2] = 0;
              break label$2;
             }
             $5 = -1;
             if ($0 >>> 0 > 4294967231) {
              break label$11
             }
             $0 = $0 + 11 | 0;
             $5 = $0 & -8;
             $8 = HEAP32[2894];
             if (!$8) {
              break label$11
             }
             $2 = 0 - $5 | 0;
             $0 = $0 >>> 8 | 0;
             $7 = 0;
             label$29 : {
              if (!$0) {
               break label$29
              }
              $7 = 31;
              if ($5 >>> 0 > 16777215) {
               break label$29
              }
              $3 = $0 + 1048320 >>> 16 & 8;
              $1 = $0 << $3;
              $0 = $1 + 520192 >>> 16 & 4;
              $6 = $1 << $0;
              $1 = $6 + 245760 >>> 16 & 2;
              $0 = ($6 << $1 >>> 15 | 0) - ($1 | ($0 | $3)) | 0;
              $7 = ($0 << 1 | $5 >>> $0 + 21 & 1) + 28 | 0;
             }
             $3 = HEAP32[($7 << 2) + 11876 >> 2];
             label$30 : {
              label$31 : {
               label$32 : {
                if (!$3) {
                 $0 = 0;
                 break label$32;
                }
                $1 = $5 << (($7 | 0) == 31 ? 0 : 25 - ($7 >>> 1 | 0) | 0);
                $0 = 0;
                while (1) {
                 label$35 : {
                  $6 = (HEAP32[$3 + 4 >> 2] & -8) - $5 | 0;
                  if ($6 >>> 0 >= $2 >>> 0) {
                   break label$35
                  }
                  $4 = $3;
                  $2 = $6;
                  if ($2) {
                   break label$35
                  }
                  $2 = 0;
                  $0 = $3;
                  break label$31;
                 }
                 $6 = HEAP32[$3 + 20 >> 2];
                 $3 = HEAP32[(($1 >>> 29 & 4) + $3 | 0) + 16 >> 2];
                 $0 = $6 ? (($6 | 0) == ($3 | 0) ? $0 : $6) : $0;
                 $1 = $1 << (($3 | 0) != 0);
                 if ($3) {
                  continue
                 }
                 break;
                };
               }
               if (!($0 | $4)) {
                $0 = 2 << $7;
                $0 = (0 - $0 | $0) & $8;
                if (!$0) {
                 break label$11
                }
                $0 = ($0 & 0 - $0) + -1 | 0;
                $1 = $0 >>> 12 & 16;
                $3 = $1;
                $0 = $0 >>> $1 | 0;
                $1 = $0 >>> 5 & 8;
                $3 = $3 | $1;
                $0 = $0 >>> $1 | 0;
                $1 = $0 >>> 2 & 4;
                $3 = $3 | $1;
                $0 = $0 >>> $1 | 0;
                $1 = $0 >>> 1 & 2;
                $3 = $3 | $1;
                $0 = $0 >>> $1 | 0;
                $1 = $0 >>> 1 & 1;
                $0 = HEAP32[(($3 | $1) + ($0 >>> $1 | 0) << 2) + 11876 >> 2];
               }
               if (!$0) {
                break label$30
               }
              }
              while (1) {
               $3 = (HEAP32[$0 + 4 >> 2] & -8) - $5 | 0;
               $1 = $3 >>> 0 < $2 >>> 0;
               $2 = $1 ? $3 : $2;
               $4 = $1 ? $0 : $4;
               $1 = HEAP32[$0 + 16 >> 2];
               if ($1) {
                $0 = $1
               } else {
                $0 = HEAP32[$0 + 20 >> 2]
               }
               if ($0) {
                continue
               }
               break;
              };
             }
             if (!$4 | $2 >>> 0 >= HEAP32[2895] - $5 >>> 0) {
              break label$11
             }
             $7 = HEAP32[$4 + 24 >> 2];
             $1 = HEAP32[$4 + 12 >> 2];
             if (($4 | 0) != ($1 | 0)) {
              $0 = HEAP32[$4 + 8 >> 2];
              HEAP32[$0 + 12 >> 2] = $1;
              HEAP32[$1 + 8 >> 2] = $0;
              break label$3;
             }
             $3 = $4 + 20 | 0;
             $0 = HEAP32[$3 >> 2];
             if (!$0) {
              $0 = HEAP32[$4 + 16 >> 2];
              if (!$0) {
               break label$9
              }
              $3 = $4 + 16 | 0;
             }
             while (1) {
              $6 = $3;
              $1 = $0;
              $3 = $0 + 20 | 0;
              $0 = HEAP32[$3 >> 2];
              if ($0) {
               continue
              }
              $3 = $1 + 16 | 0;
              $0 = HEAP32[$1 + 16 >> 2];
              if ($0) {
               continue
              }
              break;
             };
             HEAP32[$6 >> 2] = 0;
             break label$3;
            }
            $1 = HEAP32[2895];
            if ($1 >>> 0 >= $5 >>> 0) {
             $0 = HEAP32[2898];
             $2 = $1 - $5 | 0;
             label$45 : {
              if ($2 >>> 0 >= 16) {
               HEAP32[2895] = $2;
               $3 = $0 + $5 | 0;
               HEAP32[2898] = $3;
               HEAP32[$3 + 4 >> 2] = $2 | 1;
               HEAP32[$0 + $1 >> 2] = $2;
               HEAP32[$0 + 4 >> 2] = $5 | 3;
               break label$45;
              }
              HEAP32[2898] = 0;
              HEAP32[2895] = 0;
              HEAP32[$0 + 4 >> 2] = $1 | 3;
              $1 = $0 + $1 | 0;
              HEAP32[$1 + 4 >> 2] = HEAP32[$1 + 4 >> 2] | 1;
             }
             $0 = $0 + 8 | 0;
             break label$1;
            }
            $1 = HEAP32[2896];
            if ($1 >>> 0 > $5 >>> 0) {
             $1 = $1 - $5 | 0;
             HEAP32[2896] = $1;
             $0 = HEAP32[2899];
             $2 = $0 + $5 | 0;
             HEAP32[2899] = $2;
             HEAP32[$2 + 4 >> 2] = $1 | 1;
             HEAP32[$0 + 4 >> 2] = $5 | 3;
             $0 = $0 + 8 | 0;
             break label$1;
            }
            $0 = 0;
            $4 = $5 + 47 | 0;
            $3 = $4;
            if (HEAP32[3011]) {
             $2 = HEAP32[3013]
            } else {
             HEAP32[3014] = -1;
             HEAP32[3015] = -1;
             HEAP32[3012] = 4096;
             HEAP32[3013] = 4096;
             HEAP32[3011] = $11 + 12 & -16 ^ 1431655768;
             HEAP32[3016] = 0;
             HEAP32[3004] = 0;
             $2 = 4096;
            }
            $6 = $3 + $2 | 0;
            $8 = 0 - $2 | 0;
            $2 = $6 & $8;
            if ($2 >>> 0 <= $5 >>> 0) {
             break label$1
            }
            $3 = HEAP32[3003];
            if ($3) {
             $7 = HEAP32[3001];
             $9 = $7 + $2 | 0;
             if ($9 >>> 0 <= $7 >>> 0 | $9 >>> 0 > $3 >>> 0) {
              break label$1
             }
            }
            if (HEAPU8[12016] & 4) {
             break label$6
            }
            label$51 : {
             label$52 : {
              $3 = HEAP32[2899];
              if ($3) {
               $0 = 12020;
               while (1) {
                $7 = HEAP32[$0 >> 2];
                if ($7 + HEAP32[$0 + 4 >> 2] >>> 0 > $3 >>> 0 ? $7 >>> 0 <= $3 >>> 0 : 0) {
                 break label$52
                }
                $0 = HEAP32[$0 + 8 >> 2];
                if ($0) {
                 continue
                }
                break;
               };
              }
              $1 = sbrk(0);
              if (($1 | 0) == -1) {
               break label$7
              }
              $6 = $2;
              $0 = HEAP32[3012];
              $3 = $0 + -1 | 0;
              if ($3 & $1) {
               $6 = ($2 - $1 | 0) + ($1 + $3 & 0 - $0) | 0
              }
              if ($6 >>> 0 <= $5 >>> 0 | $6 >>> 0 > 2147483646) {
               break label$7
              }
              $0 = HEAP32[3003];
              if ($0) {
               $3 = HEAP32[3001];
               $8 = $3 + $6 | 0;
               if ($8 >>> 0 <= $3 >>> 0 | $8 >>> 0 > $0 >>> 0) {
                break label$7
               }
              }
              $0 = sbrk($6);
              if (($1 | 0) != ($0 | 0)) {
               break label$51
              }
              break label$5;
             }
             $6 = $8 & $6 - $1;
             if ($6 >>> 0 > 2147483646) {
              break label$7
             }
             $1 = sbrk($6);
             if (($1 | 0) == (HEAP32[$0 >> 2] + HEAP32[$0 + 4 >> 2] | 0)) {
              break label$8
             }
             $0 = $1;
            }
            if (!(($0 | 0) == -1 | $5 + 48 >>> 0 <= $6 >>> 0)) {
             $1 = HEAP32[3013];
             $1 = $1 + ($4 - $6 | 0) & 0 - $1;
             if ($1 >>> 0 > 2147483646) {
              $1 = $0;
              break label$5;
             }
             if ((sbrk($1) | 0) != -1) {
              $6 = $1 + $6 | 0;
              $1 = $0;
              break label$5;
             }
             sbrk(0 - $6 | 0);
             break label$7;
            }
            $1 = $0;
            if (($0 | 0) != -1) {
             break label$5
            }
            break label$7;
           }
           $4 = 0;
           break label$2;
          }
          $1 = 0;
          break label$3;
         }
         if (($1 | 0) != -1) {
          break label$5
         }
        }
        HEAP32[3004] = HEAP32[3004] | 4;
       }
       if ($2 >>> 0 > 2147483646) {
        break label$4
       }
       $1 = sbrk($2);
       $0 = sbrk(0);
       if ($1 >>> 0 >= $0 >>> 0 | ($1 | 0) == -1 | ($0 | 0) == -1) {
        break label$4
       }
       $6 = $0 - $1 | 0;
       if ($6 >>> 0 <= $5 + 40 >>> 0) {
        break label$4
       }
      }
      $0 = HEAP32[3001] + $6 | 0;
      HEAP32[3001] = $0;
      if ($0 >>> 0 > HEAPU32[3002]) {
       HEAP32[3002] = $0
      }
      label$62 : {
       label$63 : {
        label$64 : {
         $3 = HEAP32[2899];
         if ($3) {
          $0 = 12020;
          while (1) {
           $2 = HEAP32[$0 >> 2];
           $4 = HEAP32[$0 + 4 >> 2];
           if (($2 + $4 | 0) == ($1 | 0)) {
            break label$64
           }
           $0 = HEAP32[$0 + 8 >> 2];
           if ($0) {
            continue
           }
           break;
          };
          break label$63;
         }
         $0 = HEAP32[2897];
         if (!($1 >>> 0 >= $0 >>> 0 ? $0 : 0)) {
          HEAP32[2897] = $1
         }
         $0 = 0;
         HEAP32[3006] = $6;
         HEAP32[3005] = $1;
         HEAP32[2901] = -1;
         HEAP32[2902] = HEAP32[3011];
         HEAP32[3008] = 0;
         while (1) {
          $2 = $0 << 3;
          $3 = $2 + 11612 | 0;
          HEAP32[$2 + 11620 >> 2] = $3;
          HEAP32[$2 + 11624 >> 2] = $3;
          $0 = $0 + 1 | 0;
          if (($0 | 0) != 32) {
           continue
          }
          break;
         };
         $0 = $6 + -40 | 0;
         $2 = $1 + 8 & 7 ? -8 - $1 & 7 : 0;
         $3 = $0 - $2 | 0;
         HEAP32[2896] = $3;
         $2 = $1 + $2 | 0;
         HEAP32[2899] = $2;
         HEAP32[$2 + 4 >> 2] = $3 | 1;
         HEAP32[($0 + $1 | 0) + 4 >> 2] = 40;
         HEAP32[2900] = HEAP32[3015];
         break label$62;
        }
        if (HEAPU8[$0 + 12 | 0] & 8 | $1 >>> 0 <= $3 >>> 0 | $2 >>> 0 > $3 >>> 0) {
         break label$63
        }
        HEAP32[$0 + 4 >> 2] = $4 + $6;
        $0 = $3 + 8 & 7 ? -8 - $3 & 7 : 0;
        $1 = $0 + $3 | 0;
        HEAP32[2899] = $1;
        $2 = HEAP32[2896] + $6 | 0;
        $0 = $2 - $0 | 0;
        HEAP32[2896] = $0;
        HEAP32[$1 + 4 >> 2] = $0 | 1;
        HEAP32[($2 + $3 | 0) + 4 >> 2] = 40;
        HEAP32[2900] = HEAP32[3015];
        break label$62;
       }
       $0 = HEAP32[2897];
       if ($1 >>> 0 < $0 >>> 0) {
        HEAP32[2897] = $1;
        $0 = 0;
       }
       $2 = $1 + $6 | 0;
       $0 = 12020;
       label$70 : {
        label$71 : {
         label$72 : {
          label$73 : {
           label$74 : {
            label$75 : {
             while (1) {
              if (($2 | 0) != HEAP32[$0 >> 2]) {
               $0 = HEAP32[$0 + 8 >> 2];
               if ($0) {
                continue
               }
               break label$75;
              }
              break;
             };
             if (!(HEAPU8[$0 + 12 | 0] & 8)) {
              break label$74
             }
            }
            $0 = 12020;
            while (1) {
             $2 = HEAP32[$0 >> 2];
             if ($2 >>> 0 <= $3 >>> 0) {
              $4 = $2 + HEAP32[$0 + 4 >> 2] | 0;
              if ($4 >>> 0 > $3 >>> 0) {
               break label$73
              }
             }
             $0 = HEAP32[$0 + 8 >> 2];
             continue;
            };
           }
           HEAP32[$0 >> 2] = $1;
           HEAP32[$0 + 4 >> 2] = HEAP32[$0 + 4 >> 2] + $6;
           $7 = ($1 + 8 & 7 ? -8 - $1 & 7 : 0) + $1 | 0;
           HEAP32[$7 + 4 >> 2] = $5 | 3;
           $1 = $2 + ($2 + 8 & 7 ? -8 - $2 & 7 : 0) | 0;
           $0 = ($1 - $7 | 0) - $5 | 0;
           $4 = $5 + $7 | 0;
           if (($1 | 0) == ($3 | 0)) {
            HEAP32[2899] = $4;
            $0 = HEAP32[2896] + $0 | 0;
            HEAP32[2896] = $0;
            HEAP32[$4 + 4 >> 2] = $0 | 1;
            break label$71;
           }
           if (HEAP32[2898] == ($1 | 0)) {
            HEAP32[2898] = $4;
            $0 = HEAP32[2895] + $0 | 0;
            HEAP32[2895] = $0;
            HEAP32[$4 + 4 >> 2] = $0 | 1;
            HEAP32[$0 + $4 >> 2] = $0;
            break label$71;
           }
           $2 = HEAP32[$1 + 4 >> 2];
           if (($2 & 3) == 1) {
            $9 = $2 & -8;
            label$83 : {
             if ($2 >>> 0 <= 255) {
              $3 = HEAP32[$1 + 8 >> 2];
              $5 = $2 >>> 3 | 0;
              $2 = HEAP32[$1 + 12 >> 2];
              if (($2 | 0) == ($3 | 0)) {
               (wasm2js_i32$0 = 11572, wasm2js_i32$1 = HEAP32[2893] & __wasm_rotl_i32(-2, $5)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
               break label$83;
              }
              HEAP32[$3 + 12 >> 2] = $2;
              HEAP32[$2 + 8 >> 2] = $3;
              break label$83;
             }
             $8 = HEAP32[$1 + 24 >> 2];
             $6 = HEAP32[$1 + 12 >> 2];
             label$86 : {
              if (($6 | 0) != ($1 | 0)) {
               $2 = HEAP32[$1 + 8 >> 2];
               HEAP32[$2 + 12 >> 2] = $6;
               HEAP32[$6 + 8 >> 2] = $2;
               break label$86;
              }
              label$89 : {
               $3 = $1 + 20 | 0;
               $5 = HEAP32[$3 >> 2];
               if ($5) {
                break label$89
               }
               $3 = $1 + 16 | 0;
               $5 = HEAP32[$3 >> 2];
               if ($5) {
                break label$89
               }
               $6 = 0;
               break label$86;
              }
              while (1) {
               $2 = $3;
               $6 = $5;
               $3 = $5 + 20 | 0;
               $5 = HEAP32[$3 >> 2];
               if ($5) {
                continue
               }
               $3 = $6 + 16 | 0;
               $5 = HEAP32[$6 + 16 >> 2];
               if ($5) {
                continue
               }
               break;
              };
              HEAP32[$2 >> 2] = 0;
             }
             if (!$8) {
              break label$83
             }
             $2 = HEAP32[$1 + 28 >> 2];
             $3 = ($2 << 2) + 11876 | 0;
             label$91 : {
              if (HEAP32[$3 >> 2] == ($1 | 0)) {
               HEAP32[$3 >> 2] = $6;
               if ($6) {
                break label$91
               }
               (wasm2js_i32$0 = 11576, wasm2js_i32$1 = HEAP32[2894] & __wasm_rotl_i32(-2, $2)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
               break label$83;
              }
              HEAP32[$8 + (HEAP32[$8 + 16 >> 2] == ($1 | 0) ? 16 : 20) >> 2] = $6;
              if (!$6) {
               break label$83
              }
             }
             HEAP32[$6 + 24 >> 2] = $8;
             $2 = HEAP32[$1 + 16 >> 2];
             if ($2) {
              HEAP32[$6 + 16 >> 2] = $2;
              HEAP32[$2 + 24 >> 2] = $6;
             }
             $2 = HEAP32[$1 + 20 >> 2];
             if (!$2) {
              break label$83
             }
             HEAP32[$6 + 20 >> 2] = $2;
             HEAP32[$2 + 24 >> 2] = $6;
            }
            $1 = $1 + $9 | 0;
            $0 = $0 + $9 | 0;
           }
           HEAP32[$1 + 4 >> 2] = HEAP32[$1 + 4 >> 2] & -2;
           HEAP32[$4 + 4 >> 2] = $0 | 1;
           HEAP32[$0 + $4 >> 2] = $0;
           if ($0 >>> 0 <= 255) {
            $1 = $0 >>> 3 | 0;
            $0 = ($1 << 3) + 11612 | 0;
            $2 = HEAP32[2893];
            $1 = 1 << $1;
            label$95 : {
             if (!($2 & $1)) {
              HEAP32[2893] = $1 | $2;
              $1 = $0;
              break label$95;
             }
             $1 = HEAP32[$0 + 8 >> 2];
            }
            HEAP32[$0 + 8 >> 2] = $4;
            HEAP32[$1 + 12 >> 2] = $4;
            HEAP32[$4 + 12 >> 2] = $0;
            HEAP32[$4 + 8 >> 2] = $1;
            break label$71;
           }
           $6 = $4;
           $1 = $0 >>> 8 | 0;
           $2 = 0;
           label$97 : {
            if (!$1) {
             break label$97
            }
            $2 = 31;
            if ($0 >>> 0 > 16777215) {
             break label$97
            }
            $3 = $1 + 1048320 >>> 16 & 8;
            $2 = $1 << $3;
            $1 = $2 + 520192 >>> 16 & 4;
            $5 = $2 << $1;
            $2 = $5 + 245760 >>> 16 & 2;
            $1 = ($5 << $2 >>> 15 | 0) - ($2 | ($1 | $3)) | 0;
            $2 = ($1 << 1 | $0 >>> $1 + 21 & 1) + 28 | 0;
           }
           $1 = $2;
           HEAP32[$6 + 28 >> 2] = $1;
           HEAP32[$4 + 16 >> 2] = 0;
           HEAP32[$4 + 20 >> 2] = 0;
           $2 = ($1 << 2) + 11876 | 0;
           $3 = HEAP32[2894];
           $5 = 1 << $1;
           label$98 : {
            if (!($3 & $5)) {
             HEAP32[2894] = $3 | $5;
             HEAP32[$2 >> 2] = $4;
             break label$98;
            }
            $3 = $0 << (($1 | 0) == 31 ? 0 : 25 - ($1 >>> 1 | 0) | 0);
            $1 = HEAP32[$2 >> 2];
            while (1) {
             $2 = $1;
             if ((HEAP32[$1 + 4 >> 2] & -8) == ($0 | 0)) {
              break label$72
             }
             $1 = $3 >>> 29 | 0;
             $3 = $3 << 1;
             $5 = ($2 + ($1 & 4) | 0) + 16 | 0;
             $1 = HEAP32[$5 >> 2];
             if ($1) {
              continue
             }
             break;
            };
            HEAP32[$5 >> 2] = $4;
           }
           HEAP32[$4 + 24 >> 2] = $2;
           HEAP32[$4 + 12 >> 2] = $4;
           HEAP32[$4 + 8 >> 2] = $4;
           break label$71;
          }
          $0 = $6 + -40 | 0;
          $2 = $1 + 8 & 7 ? -8 - $1 & 7 : 0;
          $8 = $0 - $2 | 0;
          HEAP32[2896] = $8;
          $2 = $1 + $2 | 0;
          HEAP32[2899] = $2;
          HEAP32[$2 + 4 >> 2] = $8 | 1;
          HEAP32[($0 + $1 | 0) + 4 >> 2] = 40;
          HEAP32[2900] = HEAP32[3015];
          $0 = ($4 + ($4 + -39 & 7 ? 39 - $4 & 7 : 0) | 0) + -47 | 0;
          $2 = $0 >>> 0 < $3 + 16 >>> 0 ? $3 : $0;
          HEAP32[$2 + 4 >> 2] = 27;
          $0 = HEAP32[3008];
          HEAP32[$2 + 16 >> 2] = HEAP32[3007];
          HEAP32[$2 + 20 >> 2] = $0;
          $0 = HEAP32[3006];
          HEAP32[$2 + 8 >> 2] = HEAP32[3005];
          HEAP32[$2 + 12 >> 2] = $0;
          HEAP32[3007] = $2 + 8;
          HEAP32[3006] = $6;
          HEAP32[3005] = $1;
          HEAP32[3008] = 0;
          $0 = $2 + 24 | 0;
          while (1) {
           HEAP32[$0 + 4 >> 2] = 7;
           $1 = $0 + 8 | 0;
           $0 = $0 + 4 | 0;
           if ($4 >>> 0 > $1 >>> 0) {
            continue
           }
           break;
          };
          if (($2 | 0) == ($3 | 0)) {
           break label$62
          }
          HEAP32[$2 + 4 >> 2] = HEAP32[$2 + 4 >> 2] & -2;
          $6 = $2 - $3 | 0;
          HEAP32[$3 + 4 >> 2] = $6 | 1;
          HEAP32[$2 >> 2] = $6;
          if ($6 >>> 0 <= 255) {
           $1 = $6 >>> 3 | 0;
           $0 = ($1 << 3) + 11612 | 0;
           $2 = HEAP32[2893];
           $1 = 1 << $1;
           label$103 : {
            if (!($2 & $1)) {
             HEAP32[2893] = $1 | $2;
             $1 = $0;
             break label$103;
            }
            $1 = HEAP32[$0 + 8 >> 2];
           }
           HEAP32[$0 + 8 >> 2] = $3;
           HEAP32[$1 + 12 >> 2] = $3;
           HEAP32[$3 + 12 >> 2] = $0;
           HEAP32[$3 + 8 >> 2] = $1;
           break label$62;
          }
          HEAP32[$3 + 16 >> 2] = 0;
          HEAP32[$3 + 20 >> 2] = 0;
          $7 = $3;
          $0 = $6 >>> 8 | 0;
          $1 = 0;
          label$105 : {
           if (!$0) {
            break label$105
           }
           $1 = 31;
           if ($6 >>> 0 > 16777215) {
            break label$105
           }
           $2 = $0 + 1048320 >>> 16 & 8;
           $1 = $0 << $2;
           $0 = $1 + 520192 >>> 16 & 4;
           $4 = $1 << $0;
           $1 = $4 + 245760 >>> 16 & 2;
           $0 = ($4 << $1 >>> 15 | 0) - ($1 | ($0 | $2)) | 0;
           $1 = ($0 << 1 | $6 >>> $0 + 21 & 1) + 28 | 0;
          }
          $0 = $1;
          HEAP32[$7 + 28 >> 2] = $0;
          $1 = ($0 << 2) + 11876 | 0;
          $2 = HEAP32[2894];
          $4 = 1 << $0;
          label$106 : {
           if (!($2 & $4)) {
            HEAP32[2894] = $2 | $4;
            HEAP32[$1 >> 2] = $3;
            HEAP32[$3 + 24 >> 2] = $1;
            break label$106;
           }
           $0 = $6 << (($0 | 0) == 31 ? 0 : 25 - ($0 >>> 1 | 0) | 0);
           $1 = HEAP32[$1 >> 2];
           while (1) {
            $2 = $1;
            if (($6 | 0) == (HEAP32[$1 + 4 >> 2] & -8)) {
             break label$70
            }
            $1 = $0 >>> 29 | 0;
            $0 = $0 << 1;
            $4 = ($2 + ($1 & 4) | 0) + 16 | 0;
            $1 = HEAP32[$4 >> 2];
            if ($1) {
             continue
            }
            break;
           };
           HEAP32[$4 >> 2] = $3;
           HEAP32[$3 + 24 >> 2] = $2;
          }
          HEAP32[$3 + 12 >> 2] = $3;
          HEAP32[$3 + 8 >> 2] = $3;
          break label$62;
         }
         $0 = HEAP32[$2 + 8 >> 2];
         HEAP32[$0 + 12 >> 2] = $4;
         HEAP32[$2 + 8 >> 2] = $4;
         HEAP32[$4 + 24 >> 2] = 0;
         HEAP32[$4 + 12 >> 2] = $2;
         HEAP32[$4 + 8 >> 2] = $0;
        }
        $0 = $7 + 8 | 0;
        break label$1;
       }
       $0 = HEAP32[$2 + 8 >> 2];
       HEAP32[$0 + 12 >> 2] = $3;
       HEAP32[$2 + 8 >> 2] = $3;
       HEAP32[$3 + 24 >> 2] = 0;
       HEAP32[$3 + 12 >> 2] = $2;
       HEAP32[$3 + 8 >> 2] = $0;
      }
      $0 = HEAP32[2896];
      if ($0 >>> 0 <= $5 >>> 0) {
       break label$4
      }
      $1 = $0 - $5 | 0;
      HEAP32[2896] = $1;
      $0 = HEAP32[2899];
      $2 = $0 + $5 | 0;
      HEAP32[2899] = $2;
      HEAP32[$2 + 4 >> 2] = $1 | 1;
      HEAP32[$0 + 4 >> 2] = $5 | 3;
      $0 = $0 + 8 | 0;
      break label$1;
     }
     HEAP32[2892] = 48;
     $0 = 0;
     break label$1;
    }
    label$109 : {
     if (!$7) {
      break label$109
     }
     $0 = HEAP32[$4 + 28 >> 2];
     $3 = ($0 << 2) + 11876 | 0;
     label$110 : {
      if (HEAP32[$3 >> 2] == ($4 | 0)) {
       HEAP32[$3 >> 2] = $1;
       if ($1) {
        break label$110
       }
       $8 = __wasm_rotl_i32(-2, $0) & $8;
       HEAP32[2894] = $8;
       break label$109;
      }
      HEAP32[$7 + (HEAP32[$7 + 16 >> 2] == ($4 | 0) ? 16 : 20) >> 2] = $1;
      if (!$1) {
       break label$109
      }
     }
     HEAP32[$1 + 24 >> 2] = $7;
     $0 = HEAP32[$4 + 16 >> 2];
     if ($0) {
      HEAP32[$1 + 16 >> 2] = $0;
      HEAP32[$0 + 24 >> 2] = $1;
     }
     $0 = HEAP32[$4 + 20 >> 2];
     if (!$0) {
      break label$109
     }
     HEAP32[$1 + 20 >> 2] = $0;
     HEAP32[$0 + 24 >> 2] = $1;
    }
    label$113 : {
     if ($2 >>> 0 <= 15) {
      $0 = $2 + $5 | 0;
      HEAP32[$4 + 4 >> 2] = $0 | 3;
      $0 = $0 + $4 | 0;
      HEAP32[$0 + 4 >> 2] = HEAP32[$0 + 4 >> 2] | 1;
      break label$113;
     }
     HEAP32[$4 + 4 >> 2] = $5 | 3;
     $1 = $4 + $5 | 0;
     HEAP32[$1 + 4 >> 2] = $2 | 1;
     HEAP32[$1 + $2 >> 2] = $2;
     if ($2 >>> 0 <= 255) {
      $2 = $2 >>> 3 | 0;
      $0 = ($2 << 3) + 11612 | 0;
      $3 = HEAP32[2893];
      $2 = 1 << $2;
      label$116 : {
       if (!($3 & $2)) {
        HEAP32[2893] = $2 | $3;
        $2 = $0;
        break label$116;
       }
       $2 = HEAP32[$0 + 8 >> 2];
      }
      HEAP32[$0 + 8 >> 2] = $1;
      HEAP32[$2 + 12 >> 2] = $1;
      HEAP32[$1 + 12 >> 2] = $0;
      HEAP32[$1 + 8 >> 2] = $2;
      break label$113;
     }
     $7 = $1;
     $0 = $2 >>> 8 | 0;
     $3 = 0;
     label$118 : {
      if (!$0) {
       break label$118
      }
      $3 = 31;
      if ($2 >>> 0 > 16777215) {
       break label$118
      }
      $5 = $0 + 1048320 >>> 16 & 8;
      $3 = $0 << $5;
      $0 = $3 + 520192 >>> 16 & 4;
      $6 = $3 << $0;
      $3 = $6 + 245760 >>> 16 & 2;
      $0 = ($6 << $3 >>> 15 | 0) - ($3 | ($0 | $5)) | 0;
      $3 = ($0 << 1 | $2 >>> $0 + 21 & 1) + 28 | 0;
     }
     $0 = $3;
     HEAP32[$7 + 28 >> 2] = $0;
     HEAP32[$1 + 16 >> 2] = 0;
     HEAP32[$1 + 20 >> 2] = 0;
     $3 = ($0 << 2) + 11876 | 0;
     label$119 : {
      $5 = 1 << $0;
      label$120 : {
       if (!($5 & $8)) {
        HEAP32[2894] = $5 | $8;
        HEAP32[$3 >> 2] = $1;
        break label$120;
       }
       $0 = $2 << (($0 | 0) == 31 ? 0 : 25 - ($0 >>> 1 | 0) | 0);
       $5 = HEAP32[$3 >> 2];
       while (1) {
        $3 = $5;
        if ((HEAP32[$3 + 4 >> 2] & -8) == ($2 | 0)) {
         break label$119
        }
        $5 = $0 >>> 29 | 0;
        $0 = $0 << 1;
        $6 = ($3 + ($5 & 4) | 0) + 16 | 0;
        $5 = HEAP32[$6 >> 2];
        if ($5) {
         continue
        }
        break;
       };
       HEAP32[$6 >> 2] = $1;
      }
      HEAP32[$1 + 24 >> 2] = $3;
      HEAP32[$1 + 12 >> 2] = $1;
      HEAP32[$1 + 8 >> 2] = $1;
      break label$113;
     }
     $0 = HEAP32[$3 + 8 >> 2];
     HEAP32[$0 + 12 >> 2] = $1;
     HEAP32[$3 + 8 >> 2] = $1;
     HEAP32[$1 + 24 >> 2] = 0;
     HEAP32[$1 + 12 >> 2] = $3;
     HEAP32[$1 + 8 >> 2] = $0;
    }
    $0 = $4 + 8 | 0;
    break label$1;
   }
   label$123 : {
    if (!$9) {
     break label$123
    }
    $0 = HEAP32[$1 + 28 >> 2];
    $2 = ($0 << 2) + 11876 | 0;
    label$124 : {
     if (HEAP32[$2 >> 2] == ($1 | 0)) {
      HEAP32[$2 >> 2] = $4;
      if ($4) {
       break label$124
      }
      (wasm2js_i32$0 = 11576, wasm2js_i32$1 = __wasm_rotl_i32(-2, $0) & $10), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
      break label$123;
     }
     HEAP32[(HEAP32[$9 + 16 >> 2] == ($1 | 0) ? 16 : 20) + $9 >> 2] = $4;
     if (!$4) {
      break label$123
     }
    }
    HEAP32[$4 + 24 >> 2] = $9;
    $0 = HEAP32[$1 + 16 >> 2];
    if ($0) {
     HEAP32[$4 + 16 >> 2] = $0;
     HEAP32[$0 + 24 >> 2] = $4;
    }
    $0 = HEAP32[$1 + 20 >> 2];
    if (!$0) {
     break label$123
    }
    HEAP32[$4 + 20 >> 2] = $0;
    HEAP32[$0 + 24 >> 2] = $4;
   }
   label$127 : {
    if ($3 >>> 0 <= 15) {
     $0 = $3 + $5 | 0;
     HEAP32[$1 + 4 >> 2] = $0 | 3;
     $0 = $0 + $1 | 0;
     HEAP32[$0 + 4 >> 2] = HEAP32[$0 + 4 >> 2] | 1;
     break label$127;
    }
    HEAP32[$1 + 4 >> 2] = $5 | 3;
    $5 = $1 + $5 | 0;
    HEAP32[$5 + 4 >> 2] = $3 | 1;
    HEAP32[$3 + $5 >> 2] = $3;
    if ($7) {
     $4 = $7 >>> 3 | 0;
     $0 = ($4 << 3) + 11612 | 0;
     $2 = HEAP32[2898];
     $4 = 1 << $4;
     label$130 : {
      if (!($4 & $6)) {
       HEAP32[2893] = $4 | $6;
       $6 = $0;
       break label$130;
      }
      $6 = HEAP32[$0 + 8 >> 2];
     }
     HEAP32[$0 + 8 >> 2] = $2;
     HEAP32[$6 + 12 >> 2] = $2;
     HEAP32[$2 + 12 >> 2] = $0;
     HEAP32[$2 + 8 >> 2] = $6;
    }
    HEAP32[2898] = $5;
    HEAP32[2895] = $3;
   }
   $0 = $1 + 8 | 0;
  }
  global$0 = $11 + 16 | 0;
  return $0 | 0;
 }
 
 function dlfree($0) {
  $0 = $0 | 0;
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, wasm2js_i32$0 = 0, wasm2js_i32$1 = 0;
  label$1 : {
   if (!$0) {
    break label$1
   }
   $3 = $0 + -8 | 0;
   $2 = HEAP32[$0 + -4 >> 2];
   $0 = $2 & -8;
   $5 = $3 + $0 | 0;
   label$2 : {
    if ($2 & 1) {
     break label$2
    }
    if (!($2 & 3)) {
     break label$1
    }
    $2 = HEAP32[$3 >> 2];
    $3 = $3 - $2 | 0;
    if ($3 >>> 0 < HEAPU32[2897]) {
     break label$1
    }
    $0 = $0 + $2 | 0;
    if (HEAP32[2898] != ($3 | 0)) {
     if ($2 >>> 0 <= 255) {
      $4 = HEAP32[$3 + 8 >> 2];
      $2 = $2 >>> 3 | 0;
      $1 = HEAP32[$3 + 12 >> 2];
      if (($1 | 0) == ($4 | 0)) {
       (wasm2js_i32$0 = 11572, wasm2js_i32$1 = HEAP32[2893] & __wasm_rotl_i32(-2, $2)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
       break label$2;
      }
      HEAP32[$4 + 12 >> 2] = $1;
      HEAP32[$1 + 8 >> 2] = $4;
      break label$2;
     }
     $7 = HEAP32[$3 + 24 >> 2];
     $2 = HEAP32[$3 + 12 >> 2];
     label$6 : {
      if (($2 | 0) != ($3 | 0)) {
       $1 = HEAP32[$3 + 8 >> 2];
       HEAP32[$1 + 12 >> 2] = $2;
       HEAP32[$2 + 8 >> 2] = $1;
       break label$6;
      }
      label$9 : {
       $4 = $3 + 20 | 0;
       $1 = HEAP32[$4 >> 2];
       if ($1) {
        break label$9
       }
       $4 = $3 + 16 | 0;
       $1 = HEAP32[$4 >> 2];
       if ($1) {
        break label$9
       }
       $2 = 0;
       break label$6;
      }
      while (1) {
       $6 = $4;
       $2 = $1;
       $4 = $2 + 20 | 0;
       $1 = HEAP32[$4 >> 2];
       if ($1) {
        continue
       }
       $4 = $2 + 16 | 0;
       $1 = HEAP32[$2 + 16 >> 2];
       if ($1) {
        continue
       }
       break;
      };
      HEAP32[$6 >> 2] = 0;
     }
     if (!$7) {
      break label$2
     }
     $4 = HEAP32[$3 + 28 >> 2];
     $1 = ($4 << 2) + 11876 | 0;
     label$11 : {
      if (HEAP32[$1 >> 2] == ($3 | 0)) {
       HEAP32[$1 >> 2] = $2;
       if ($2) {
        break label$11
       }
       (wasm2js_i32$0 = 11576, wasm2js_i32$1 = HEAP32[2894] & __wasm_rotl_i32(-2, $4)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
       break label$2;
      }
      HEAP32[$7 + (HEAP32[$7 + 16 >> 2] == ($3 | 0) ? 16 : 20) >> 2] = $2;
      if (!$2) {
       break label$2
      }
     }
     HEAP32[$2 + 24 >> 2] = $7;
     $1 = HEAP32[$3 + 16 >> 2];
     if ($1) {
      HEAP32[$2 + 16 >> 2] = $1;
      HEAP32[$1 + 24 >> 2] = $2;
     }
     $1 = HEAP32[$3 + 20 >> 2];
     if (!$1) {
      break label$2
     }
     HEAP32[$2 + 20 >> 2] = $1;
     HEAP32[$1 + 24 >> 2] = $2;
     break label$2;
    }
    $2 = HEAP32[$5 + 4 >> 2];
    if (($2 & 3) != 3) {
     break label$2
    }
    HEAP32[2895] = $0;
    HEAP32[$5 + 4 >> 2] = $2 & -2;
    HEAP32[$3 + 4 >> 2] = $0 | 1;
    HEAP32[$0 + $3 >> 2] = $0;
    return;
   }
   if ($5 >>> 0 <= $3 >>> 0) {
    break label$1
   }
   $2 = HEAP32[$5 + 4 >> 2];
   if (!($2 & 1)) {
    break label$1
   }
   label$14 : {
    if (!($2 & 2)) {
     if (($5 | 0) == HEAP32[2899]) {
      HEAP32[2899] = $3;
      $0 = HEAP32[2896] + $0 | 0;
      HEAP32[2896] = $0;
      HEAP32[$3 + 4 >> 2] = $0 | 1;
      if (HEAP32[2898] != ($3 | 0)) {
       break label$1
      }
      HEAP32[2895] = 0;
      HEAP32[2898] = 0;
      return;
     }
     if (($5 | 0) == HEAP32[2898]) {
      HEAP32[2898] = $3;
      $0 = HEAP32[2895] + $0 | 0;
      HEAP32[2895] = $0;
      HEAP32[$3 + 4 >> 2] = $0 | 1;
      HEAP32[$0 + $3 >> 2] = $0;
      return;
     }
     $0 = ($2 & -8) + $0 | 0;
     label$18 : {
      if ($2 >>> 0 <= 255) {
       $1 = HEAP32[$5 + 8 >> 2];
       $2 = $2 >>> 3 | 0;
       $4 = HEAP32[$5 + 12 >> 2];
       if (($1 | 0) == ($4 | 0)) {
        (wasm2js_i32$0 = 11572, wasm2js_i32$1 = HEAP32[2893] & __wasm_rotl_i32(-2, $2)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
        break label$18;
       }
       HEAP32[$1 + 12 >> 2] = $4;
       HEAP32[$4 + 8 >> 2] = $1;
       break label$18;
      }
      $7 = HEAP32[$5 + 24 >> 2];
      $2 = HEAP32[$5 + 12 >> 2];
      label$23 : {
       if (($5 | 0) != ($2 | 0)) {
        $1 = HEAP32[$5 + 8 >> 2];
        HEAP32[$1 + 12 >> 2] = $2;
        HEAP32[$2 + 8 >> 2] = $1;
        break label$23;
       }
       label$26 : {
        $4 = $5 + 20 | 0;
        $1 = HEAP32[$4 >> 2];
        if ($1) {
         break label$26
        }
        $4 = $5 + 16 | 0;
        $1 = HEAP32[$4 >> 2];
        if ($1) {
         break label$26
        }
        $2 = 0;
        break label$23;
       }
       while (1) {
        $6 = $4;
        $2 = $1;
        $4 = $2 + 20 | 0;
        $1 = HEAP32[$4 >> 2];
        if ($1) {
         continue
        }
        $4 = $2 + 16 | 0;
        $1 = HEAP32[$2 + 16 >> 2];
        if ($1) {
         continue
        }
        break;
       };
       HEAP32[$6 >> 2] = 0;
      }
      if (!$7) {
       break label$18
      }
      $4 = HEAP32[$5 + 28 >> 2];
      $1 = ($4 << 2) + 11876 | 0;
      label$28 : {
       if (($5 | 0) == HEAP32[$1 >> 2]) {
        HEAP32[$1 >> 2] = $2;
        if ($2) {
         break label$28
        }
        (wasm2js_i32$0 = 11576, wasm2js_i32$1 = HEAP32[2894] & __wasm_rotl_i32(-2, $4)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
        break label$18;
       }
       HEAP32[$7 + (($5 | 0) == HEAP32[$7 + 16 >> 2] ? 16 : 20) >> 2] = $2;
       if (!$2) {
        break label$18
       }
      }
      HEAP32[$2 + 24 >> 2] = $7;
      $1 = HEAP32[$5 + 16 >> 2];
      if ($1) {
       HEAP32[$2 + 16 >> 2] = $1;
       HEAP32[$1 + 24 >> 2] = $2;
      }
      $1 = HEAP32[$5 + 20 >> 2];
      if (!$1) {
       break label$18
      }
      HEAP32[$2 + 20 >> 2] = $1;
      HEAP32[$1 + 24 >> 2] = $2;
     }
     HEAP32[$3 + 4 >> 2] = $0 | 1;
     HEAP32[$0 + $3 >> 2] = $0;
     if (HEAP32[2898] != ($3 | 0)) {
      break label$14
     }
     HEAP32[2895] = $0;
     return;
    }
    HEAP32[$5 + 4 >> 2] = $2 & -2;
    HEAP32[$3 + 4 >> 2] = $0 | 1;
    HEAP32[$0 + $3 >> 2] = $0;
   }
   if ($0 >>> 0 <= 255) {
    $0 = $0 >>> 3 | 0;
    $2 = ($0 << 3) + 11612 | 0;
    $1 = HEAP32[2893];
    $0 = 1 << $0;
    label$32 : {
     if (!($1 & $0)) {
      HEAP32[2893] = $0 | $1;
      $0 = $2;
      break label$32;
     }
     $0 = HEAP32[$2 + 8 >> 2];
    }
    HEAP32[$2 + 8 >> 2] = $3;
    HEAP32[$0 + 12 >> 2] = $3;
    HEAP32[$3 + 12 >> 2] = $2;
    HEAP32[$3 + 8 >> 2] = $0;
    return;
   }
   HEAP32[$3 + 16 >> 2] = 0;
   HEAP32[$3 + 20 >> 2] = 0;
   $5 = $3;
   $4 = $0 >>> 8 | 0;
   $1 = 0;
   label$34 : {
    if (!$4) {
     break label$34
    }
    $1 = 31;
    if ($0 >>> 0 > 16777215) {
     break label$34
    }
    $2 = $4;
    $4 = $4 + 1048320 >>> 16 & 8;
    $1 = $2 << $4;
    $7 = $1 + 520192 >>> 16 & 4;
    $1 = $1 << $7;
    $6 = $1 + 245760 >>> 16 & 2;
    $1 = ($1 << $6 >>> 15 | 0) - ($6 | ($4 | $7)) | 0;
    $1 = ($1 << 1 | $0 >>> $1 + 21 & 1) + 28 | 0;
   }
   HEAP32[$5 + 28 >> 2] = $1;
   $6 = ($1 << 2) + 11876 | 0;
   label$35 : {
    label$36 : {
     $4 = HEAP32[2894];
     $2 = 1 << $1;
     label$37 : {
      if (!($4 & $2)) {
       HEAP32[2894] = $2 | $4;
       HEAP32[$6 >> 2] = $3;
       HEAP32[$3 + 24 >> 2] = $6;
       break label$37;
      }
      $4 = $0 << (($1 | 0) == 31 ? 0 : 25 - ($1 >>> 1 | 0) | 0);
      $2 = HEAP32[$6 >> 2];
      while (1) {
       $1 = $2;
       if ((HEAP32[$2 + 4 >> 2] & -8) == ($0 | 0)) {
        break label$36
       }
       $2 = $4 >>> 29 | 0;
       $4 = $4 << 1;
       $6 = ($1 + ($2 & 4) | 0) + 16 | 0;
       $2 = HEAP32[$6 >> 2];
       if ($2) {
        continue
       }
       break;
      };
      HEAP32[$6 >> 2] = $3;
      HEAP32[$3 + 24 >> 2] = $1;
     }
     HEAP32[$3 + 12 >> 2] = $3;
     HEAP32[$3 + 8 >> 2] = $3;
     break label$35;
    }
    $0 = HEAP32[$1 + 8 >> 2];
    HEAP32[$0 + 12 >> 2] = $3;
    HEAP32[$1 + 8 >> 2] = $3;
    HEAP32[$3 + 24 >> 2] = 0;
    HEAP32[$3 + 12 >> 2] = $1;
    HEAP32[$3 + 8 >> 2] = $0;
   }
   $0 = HEAP32[2901] + -1 | 0;
   HEAP32[2901] = $0;
   if ($0) {
    break label$1
   }
   $3 = 12028;
   while (1) {
    $0 = HEAP32[$3 >> 2];
    $3 = $0 + 8 | 0;
    if ($0) {
     continue
    }
    break;
   };
   HEAP32[2901] = -1;
  }
 }
 
 function dlcalloc($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0;
  $2 = 0;
  label$2 : {
   if (!$0) {
    break label$2
   }
   $3 = __wasm_i64_mul($0, 0, $1, 0);
   $4 = i64toi32_i32$HIGH_BITS;
   $2 = $3;
   if (($0 | $1) >>> 0 < 65536) {
    break label$2
   }
   $2 = $4 ? -1 : $3;
  }
  $1 = $2;
  $0 = dlmalloc($1);
  if (!(!$0 | !(HEAPU8[$0 + -4 | 0] & 3))) {
   memset($0, $1)
  }
  return $0;
 }
 
 function dlrealloc($0, $1) {
  var $2 = 0, $3 = 0;
  if (!$0) {
   return dlmalloc($1)
  }
  if ($1 >>> 0 >= 4294967232) {
   HEAP32[2892] = 48;
   return 0;
  }
  $2 = try_realloc_chunk($0 + -8 | 0, $1 >>> 0 < 11 ? 16 : $1 + 11 & -8);
  if ($2) {
   return $2 + 8 | 0
  }
  $2 = dlmalloc($1);
  if (!$2) {
   return 0
  }
  $3 = HEAP32[$0 + -4 >> 2];
  $3 = ($3 & 3 ? -4 : -8) + ($3 & -8) | 0;
  memcpy($2, $0, $3 >>> 0 < $1 >>> 0 ? $3 : $1);
  dlfree($0);
  return $2;
 }
 
 function try_realloc_chunk($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, wasm2js_i32$0 = 0, wasm2js_i32$1 = 0;
  $7 = HEAP32[$0 + 4 >> 2];
  $2 = $7 & 3;
  $3 = $7 & -8;
  $5 = $3 + $0 | 0;
  label$2 : {
   if (!$2) {
    $2 = 0;
    if ($1 >>> 0 < 256) {
     break label$2
    }
    if ($3 >>> 0 >= $1 + 4 >>> 0) {
     $2 = $0;
     if ($3 - $1 >>> 0 <= HEAP32[3013] << 1 >>> 0) {
      break label$2
     }
    }
    return 0;
   }
   label$5 : {
    if ($3 >>> 0 >= $1 >>> 0) {
     $2 = $3 - $1 | 0;
     if ($2 >>> 0 < 16) {
      break label$5
     }
     HEAP32[$0 + 4 >> 2] = $7 & 1 | $1 | 2;
     $1 = $0 + $1 | 0;
     HEAP32[$1 + 4 >> 2] = $2 | 3;
     HEAP32[$5 + 4 >> 2] = HEAP32[$5 + 4 >> 2] | 1;
     dispose_chunk($1, $2);
     break label$5;
    }
    $2 = 0;
    if (($5 | 0) == HEAP32[2899]) {
     $4 = $3 + HEAP32[2896] | 0;
     if ($4 >>> 0 <= $1 >>> 0) {
      break label$2
     }
     HEAP32[$0 + 4 >> 2] = $7 & 1 | $1 | 2;
     $2 = $0 + $1 | 0;
     $1 = $4 - $1 | 0;
     HEAP32[$2 + 4 >> 2] = $1 | 1;
     HEAP32[2896] = $1;
     HEAP32[2899] = $2;
     break label$5;
    }
    if (($5 | 0) == HEAP32[2898]) {
     $4 = $3 + HEAP32[2895] | 0;
     if ($4 >>> 0 < $1 >>> 0) {
      break label$2
     }
     $2 = $4 - $1 | 0;
     label$9 : {
      if ($2 >>> 0 >= 16) {
       HEAP32[$0 + 4 >> 2] = $7 & 1 | $1 | 2;
       $1 = $0 + $1 | 0;
       HEAP32[$1 + 4 >> 2] = $2 | 1;
       $4 = $0 + $4 | 0;
       HEAP32[$4 >> 2] = $2;
       HEAP32[$4 + 4 >> 2] = HEAP32[$4 + 4 >> 2] & -2;
       break label$9;
      }
      HEAP32[$0 + 4 >> 2] = $4 | $7 & 1 | 2;
      $1 = $0 + $4 | 0;
      HEAP32[$1 + 4 >> 2] = HEAP32[$1 + 4 >> 2] | 1;
      $2 = 0;
      $1 = 0;
     }
     HEAP32[2898] = $1;
     HEAP32[2895] = $2;
     break label$5;
    }
    $6 = HEAP32[$5 + 4 >> 2];
    if ($6 & 2) {
     break label$2
    }
    $8 = $3 + ($6 & -8) | 0;
    if ($8 >>> 0 < $1 >>> 0) {
     break label$2
    }
    $10 = $8 - $1 | 0;
    label$11 : {
     if ($6 >>> 0 <= 255) {
      $2 = $6 >>> 3 | 0;
      $6 = HEAP32[$5 + 8 >> 2];
      $4 = HEAP32[$5 + 12 >> 2];
      if (($6 | 0) == ($4 | 0)) {
       (wasm2js_i32$0 = 11572, wasm2js_i32$1 = HEAP32[2893] & __wasm_rotl_i32(-2, $2)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
       break label$11;
      }
      HEAP32[$6 + 12 >> 2] = $4;
      HEAP32[$4 + 8 >> 2] = $6;
      break label$11;
     }
     $9 = HEAP32[$5 + 24 >> 2];
     $3 = HEAP32[$5 + 12 >> 2];
     label$14 : {
      if (($5 | 0) != ($3 | 0)) {
       $2 = HEAP32[$5 + 8 >> 2];
       HEAP32[$2 + 12 >> 2] = $3;
       HEAP32[$3 + 8 >> 2] = $2;
       break label$14;
      }
      label$17 : {
       $2 = $5 + 20 | 0;
       $6 = HEAP32[$2 >> 2];
       if ($6) {
        break label$17
       }
       $2 = $5 + 16 | 0;
       $6 = HEAP32[$2 >> 2];
       if ($6) {
        break label$17
       }
       $3 = 0;
       break label$14;
      }
      while (1) {
       $4 = $2;
       $3 = $6;
       $2 = $3 + 20 | 0;
       $6 = HEAP32[$2 >> 2];
       if ($6) {
        continue
       }
       $2 = $3 + 16 | 0;
       $6 = HEAP32[$3 + 16 >> 2];
       if ($6) {
        continue
       }
       break;
      };
      HEAP32[$4 >> 2] = 0;
     }
     if (!$9) {
      break label$11
     }
     $4 = HEAP32[$5 + 28 >> 2];
     $2 = ($4 << 2) + 11876 | 0;
     label$19 : {
      if (($5 | 0) == HEAP32[$2 >> 2]) {
       HEAP32[$2 >> 2] = $3;
       if ($3) {
        break label$19
       }
       (wasm2js_i32$0 = 11576, wasm2js_i32$1 = HEAP32[2894] & __wasm_rotl_i32(-2, $4)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
       break label$11;
      }
      HEAP32[(($5 | 0) == HEAP32[$9 + 16 >> 2] ? 16 : 20) + $9 >> 2] = $3;
      if (!$3) {
       break label$11
      }
     }
     HEAP32[$3 + 24 >> 2] = $9;
     $2 = HEAP32[$5 + 16 >> 2];
     if ($2) {
      HEAP32[$3 + 16 >> 2] = $2;
      HEAP32[$2 + 24 >> 2] = $3;
     }
     $2 = HEAP32[$5 + 20 >> 2];
     if (!$2) {
      break label$11
     }
     HEAP32[$3 + 20 >> 2] = $2;
     HEAP32[$2 + 24 >> 2] = $3;
    }
    if ($10 >>> 0 <= 15) {
     HEAP32[$0 + 4 >> 2] = $7 & 1 | $8 | 2;
     $1 = $0 + $8 | 0;
     HEAP32[$1 + 4 >> 2] = HEAP32[$1 + 4 >> 2] | 1;
     break label$5;
    }
    HEAP32[$0 + 4 >> 2] = $7 & 1 | $1 | 2;
    $2 = $0 + $1 | 0;
    HEAP32[$2 + 4 >> 2] = $10 | 3;
    $1 = $0 + $8 | 0;
    HEAP32[$1 + 4 >> 2] = HEAP32[$1 + 4 >> 2] | 1;
    dispose_chunk($2, $10);
   }
   $2 = $0;
  }
  return $2;
 }
 
 function dispose_chunk($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, wasm2js_i32$0 = 0, wasm2js_i32$1 = 0;
  $5 = $0 + $1 | 0;
  label$1 : {
   label$2 : {
    $2 = HEAP32[$0 + 4 >> 2];
    if ($2 & 1) {
     break label$2
    }
    if (!($2 & 3)) {
     break label$1
    }
    $2 = HEAP32[$0 >> 2];
    $1 = $2 + $1 | 0;
    $0 = $0 - $2 | 0;
    if (($0 | 0) != HEAP32[2898]) {
     if ($2 >>> 0 <= 255) {
      $4 = $2 >>> 3 | 0;
      $2 = HEAP32[$0 + 8 >> 2];
      $3 = HEAP32[$0 + 12 >> 2];
      if (($3 | 0) == ($2 | 0)) {
       (wasm2js_i32$0 = 11572, wasm2js_i32$1 = HEAP32[2893] & __wasm_rotl_i32(-2, $4)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
       break label$2;
      }
      HEAP32[$2 + 12 >> 2] = $3;
      HEAP32[$3 + 8 >> 2] = $2;
      break label$2;
     }
     $7 = HEAP32[$0 + 24 >> 2];
     $2 = HEAP32[$0 + 12 >> 2];
     label$6 : {
      if (($2 | 0) != ($0 | 0)) {
       $3 = HEAP32[$0 + 8 >> 2];
       HEAP32[$3 + 12 >> 2] = $2;
       HEAP32[$2 + 8 >> 2] = $3;
       break label$6;
      }
      label$9 : {
       $3 = $0 + 20 | 0;
       $4 = HEAP32[$3 >> 2];
       if ($4) {
        break label$9
       }
       $3 = $0 + 16 | 0;
       $4 = HEAP32[$3 >> 2];
       if ($4) {
        break label$9
       }
       $2 = 0;
       break label$6;
      }
      while (1) {
       $6 = $3;
       $2 = $4;
       $3 = $2 + 20 | 0;
       $4 = HEAP32[$3 >> 2];
       if ($4) {
        continue
       }
       $3 = $2 + 16 | 0;
       $4 = HEAP32[$2 + 16 >> 2];
       if ($4) {
        continue
       }
       break;
      };
      HEAP32[$6 >> 2] = 0;
     }
     if (!$7) {
      break label$2
     }
     $3 = HEAP32[$0 + 28 >> 2];
     $4 = ($3 << 2) + 11876 | 0;
     label$11 : {
      if (HEAP32[$4 >> 2] == ($0 | 0)) {
       HEAP32[$4 >> 2] = $2;
       if ($2) {
        break label$11
       }
       (wasm2js_i32$0 = 11576, wasm2js_i32$1 = HEAP32[2894] & __wasm_rotl_i32(-2, $3)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
       break label$2;
      }
      HEAP32[$7 + (HEAP32[$7 + 16 >> 2] == ($0 | 0) ? 16 : 20) >> 2] = $2;
      if (!$2) {
       break label$2
      }
     }
     HEAP32[$2 + 24 >> 2] = $7;
     $3 = HEAP32[$0 + 16 >> 2];
     if ($3) {
      HEAP32[$2 + 16 >> 2] = $3;
      HEAP32[$3 + 24 >> 2] = $2;
     }
     $3 = HEAP32[$0 + 20 >> 2];
     if (!$3) {
      break label$2
     }
     HEAP32[$2 + 20 >> 2] = $3;
     HEAP32[$3 + 24 >> 2] = $2;
     break label$2;
    }
    $2 = HEAP32[$5 + 4 >> 2];
    if (($2 & 3) != 3) {
     break label$2
    }
    HEAP32[2895] = $1;
    HEAP32[$5 + 4 >> 2] = $2 & -2;
    HEAP32[$0 + 4 >> 2] = $1 | 1;
    HEAP32[$5 >> 2] = $1;
    return;
   }
   $2 = HEAP32[$5 + 4 >> 2];
   label$14 : {
    if (!($2 & 2)) {
     if (($5 | 0) == HEAP32[2899]) {
      HEAP32[2899] = $0;
      $1 = HEAP32[2896] + $1 | 0;
      HEAP32[2896] = $1;
      HEAP32[$0 + 4 >> 2] = $1 | 1;
      if (HEAP32[2898] != ($0 | 0)) {
       break label$1
      }
      HEAP32[2895] = 0;
      HEAP32[2898] = 0;
      return;
     }
     if (($5 | 0) == HEAP32[2898]) {
      HEAP32[2898] = $0;
      $1 = HEAP32[2895] + $1 | 0;
      HEAP32[2895] = $1;
      HEAP32[$0 + 4 >> 2] = $1 | 1;
      HEAP32[$0 + $1 >> 2] = $1;
      return;
     }
     $1 = ($2 & -8) + $1 | 0;
     label$18 : {
      if ($2 >>> 0 <= 255) {
       $4 = $2 >>> 3 | 0;
       $2 = HEAP32[$5 + 8 >> 2];
       $3 = HEAP32[$5 + 12 >> 2];
       if (($2 | 0) == ($3 | 0)) {
        (wasm2js_i32$0 = 11572, wasm2js_i32$1 = HEAP32[2893] & __wasm_rotl_i32(-2, $4)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
        break label$18;
       }
       HEAP32[$2 + 12 >> 2] = $3;
       HEAP32[$3 + 8 >> 2] = $2;
       break label$18;
      }
      $7 = HEAP32[$5 + 24 >> 2];
      $2 = HEAP32[$5 + 12 >> 2];
      label$21 : {
       if (($5 | 0) != ($2 | 0)) {
        $3 = HEAP32[$5 + 8 >> 2];
        HEAP32[$3 + 12 >> 2] = $2;
        HEAP32[$2 + 8 >> 2] = $3;
        break label$21;
       }
       label$24 : {
        $3 = $5 + 20 | 0;
        $4 = HEAP32[$3 >> 2];
        if ($4) {
         break label$24
        }
        $3 = $5 + 16 | 0;
        $4 = HEAP32[$3 >> 2];
        if ($4) {
         break label$24
        }
        $2 = 0;
        break label$21;
       }
       while (1) {
        $6 = $3;
        $2 = $4;
        $3 = $2 + 20 | 0;
        $4 = HEAP32[$3 >> 2];
        if ($4) {
         continue
        }
        $3 = $2 + 16 | 0;
        $4 = HEAP32[$2 + 16 >> 2];
        if ($4) {
         continue
        }
        break;
       };
       HEAP32[$6 >> 2] = 0;
      }
      if (!$7) {
       break label$18
      }
      $3 = HEAP32[$5 + 28 >> 2];
      $4 = ($3 << 2) + 11876 | 0;
      label$26 : {
       if (($5 | 0) == HEAP32[$4 >> 2]) {
        HEAP32[$4 >> 2] = $2;
        if ($2) {
         break label$26
        }
        (wasm2js_i32$0 = 11576, wasm2js_i32$1 = HEAP32[2894] & __wasm_rotl_i32(-2, $3)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
        break label$18;
       }
       HEAP32[$7 + (($5 | 0) == HEAP32[$7 + 16 >> 2] ? 16 : 20) >> 2] = $2;
       if (!$2) {
        break label$18
       }
      }
      HEAP32[$2 + 24 >> 2] = $7;
      $3 = HEAP32[$5 + 16 >> 2];
      if ($3) {
       HEAP32[$2 + 16 >> 2] = $3;
       HEAP32[$3 + 24 >> 2] = $2;
      }
      $3 = HEAP32[$5 + 20 >> 2];
      if (!$3) {
       break label$18
      }
      HEAP32[$2 + 20 >> 2] = $3;
      HEAP32[$3 + 24 >> 2] = $2;
     }
     HEAP32[$0 + 4 >> 2] = $1 | 1;
     HEAP32[$0 + $1 >> 2] = $1;
     if (HEAP32[2898] != ($0 | 0)) {
      break label$14
     }
     HEAP32[2895] = $1;
     return;
    }
    HEAP32[$5 + 4 >> 2] = $2 & -2;
    HEAP32[$0 + 4 >> 2] = $1 | 1;
    HEAP32[$0 + $1 >> 2] = $1;
   }
   if ($1 >>> 0 <= 255) {
    $2 = $1 >>> 3 | 0;
    $1 = ($2 << 3) + 11612 | 0;
    $3 = HEAP32[2893];
    $2 = 1 << $2;
    label$30 : {
     if (!($3 & $2)) {
      HEAP32[2893] = $2 | $3;
      $2 = $1;
      break label$30;
     }
     $2 = HEAP32[$1 + 8 >> 2];
    }
    HEAP32[$1 + 8 >> 2] = $0;
    HEAP32[$2 + 12 >> 2] = $0;
    HEAP32[$0 + 12 >> 2] = $1;
    HEAP32[$0 + 8 >> 2] = $2;
    return;
   }
   HEAP32[$0 + 16 >> 2] = 0;
   HEAP32[$0 + 20 >> 2] = 0;
   $3 = $0;
   $4 = $1 >>> 8 | 0;
   $2 = 0;
   label$32 : {
    if (!$4) {
     break label$32
    }
    $2 = 31;
    if ($1 >>> 0 > 16777215) {
     break label$32
    }
    $6 = $4 + 1048320 >>> 16 & 8;
    $4 = $4 << $6;
    $2 = $4 + 520192 >>> 16 & 4;
    $5 = $4 << $2;
    $4 = $5 + 245760 >>> 16 & 2;
    $2 = ($5 << $4 >>> 15 | 0) - ($4 | ($2 | $6)) | 0;
    $2 = ($2 << 1 | $1 >>> $2 + 21 & 1) + 28 | 0;
   }
   HEAP32[$3 + 28 >> 2] = $2;
   $4 = ($2 << 2) + 11876 | 0;
   label$33 : {
    $3 = HEAP32[2894];
    $6 = 1 << $2;
    label$34 : {
     if (!($3 & $6)) {
      HEAP32[2894] = $3 | $6;
      HEAP32[$4 >> 2] = $0;
      break label$34;
     }
     $3 = $1 << (($2 | 0) == 31 ? 0 : 25 - ($2 >>> 1 | 0) | 0);
     $2 = HEAP32[$4 >> 2];
     while (1) {
      $4 = $2;
      if ((HEAP32[$2 + 4 >> 2] & -8) == ($1 | 0)) {
       break label$33
      }
      $2 = $3 >>> 29 | 0;
      $3 = $3 << 1;
      $6 = ($4 + ($2 & 4) | 0) + 16 | 0;
      $2 = HEAP32[$6 >> 2];
      if ($2) {
       continue
      }
      break;
     };
     HEAP32[$6 >> 2] = $0;
    }
    HEAP32[$0 + 24 >> 2] = $4;
    HEAP32[$0 + 12 >> 2] = $0;
    HEAP32[$0 + 8 >> 2] = $0;
    return;
   }
   $1 = HEAP32[$4 + 8 >> 2];
   HEAP32[$1 + 12 >> 2] = $0;
   HEAP32[$4 + 8 >> 2] = $0;
   HEAP32[$0 + 24 >> 2] = 0;
   HEAP32[$0 + 12 >> 2] = $4;
   HEAP32[$0 + 8 >> 2] = $1;
  }
 }
 
 function memchr($0, $1) {
  var $2 = 0;
  $2 = ($1 | 0) != 0;
  label$1 : {
   label$2 : {
    label$3 : {
     if (!$1 | !($0 & 3)) {
      break label$3
     }
     while (1) {
      if (HEAPU8[$0 | 0] == 79) {
       break label$2
      }
      $0 = $0 + 1 | 0;
      $1 = $1 + -1 | 0;
      $2 = ($1 | 0) != 0;
      if (!$1) {
       break label$3
      }
      if ($0 & 3) {
       continue
      }
      break;
     };
    }
    if (!$2) {
     break label$1
    }
   }
   label$5 : {
    if (HEAPU8[$0 | 0] == 79 | $1 >>> 0 < 4) {
     break label$5
    }
    while (1) {
     $2 = HEAP32[$0 >> 2] ^ 1330597711;
     if (($2 ^ -1) & $2 + -16843009 & -2139062144) {
      break label$5
     }
     $0 = $0 + 4 | 0;
     $1 = $1 + -4 | 0;
     if ($1 >>> 0 > 3) {
      continue
     }
     break;
    };
   }
   if (!$1) {
    break label$1
   }
   while (1) {
    if (HEAPU8[$0 | 0] == 79) {
     return $0
    }
    $0 = $0 + 1 | 0;
    $1 = $1 + -1 | 0;
    if ($1) {
     continue
    }
    break;
   };
  }
  return 0;
 }
 
 function frexp($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0;
  wasm2js_scratch_store_f64(+$0);
  $2 = wasm2js_scratch_load_i32(1) | 0;
  $3 = wasm2js_scratch_load_i32(0) | 0;
  $4 = $2;
  $2 = $2 >>> 20 & 2047;
  if (($2 | 0) != 2047) {
   if (!$2) {
    $2 = $1;
    if ($0 == 0.0) {
     $1 = 0
    } else {
     $0 = frexp($0 * 18446744073709551615.0, $1);
     $1 = HEAP32[$1 >> 2] + -64 | 0;
    }
    HEAP32[$2 >> 2] = $1;
    return $0;
   }
   HEAP32[$1 >> 2] = $2 + -1022;
   wasm2js_scratch_store_i32(0, $3 | 0);
   wasm2js_scratch_store_i32(1, $4 & -2146435073 | 1071644672);
   $0 = +wasm2js_scratch_load_f64();
  }
  return $0;
 }
 
 function __ashlti3($0, $1, $2, $3, $4, $5) {
  var $6 = 0, $7 = 0, $8 = 0, $9 = 0;
  label$1 : {
   if ($5 & 64) {
    $3 = $1;
    $4 = $5 + -64 | 0;
    $1 = $4 & 31;
    if (32 <= ($4 & 63) >>> 0) {
     $4 = $3 << $1;
     $3 = 0;
    } else {
     $4 = (1 << $1) - 1 & $3 >>> 32 - $1 | $2 << $1;
     $3 = $3 << $1;
    }
    $1 = 0;
    $2 = 0;
    break label$1;
   }
   if (!$5) {
    break label$1
   }
   $6 = $3;
   $8 = $5;
   $3 = $5 & 31;
   if (32 <= ($5 & 63) >>> 0) {
    $7 = $6 << $3;
    $9 = 0;
   } else {
    $7 = (1 << $3) - 1 & $6 >>> 32 - $3 | $4 << $3;
    $9 = $6 << $3;
   }
   $3 = $2;
   $6 = $1;
   $5 = 64 - $5 | 0;
   $4 = $5 & 31;
   if (32 <= ($5 & 63) >>> 0) {
    $5 = 0;
    $3 = $3 >>> $4 | 0;
   } else {
    $5 = $3 >>> $4 | 0;
    $3 = ((1 << $4) - 1 & $3) << 32 - $4 | $6 >>> $4;
   }
   $3 = $9 | $3;
   $4 = $5 | $7;
   $5 = $1;
   $1 = $8 & 31;
   if (32 <= ($8 & 63) >>> 0) {
    $7 = $5 << $1;
    $1 = 0;
   } else {
    $7 = (1 << $1) - 1 & $5 >>> 32 - $1 | $2 << $1;
    $1 = $5 << $1;
   }
   $2 = $7;
  }
  HEAP32[$0 >> 2] = $1;
  HEAP32[$0 + 4 >> 2] = $2;
  HEAP32[$0 + 8 >> 2] = $3;
  HEAP32[$0 + 12 >> 2] = $4;
 }
 
 function __lshrti3($0, $1, $2, $3, $4, $5) {
  var $6 = 0, $7 = 0, $8 = 0, $9 = 0;
  label$1 : {
   if ($5 & 64) {
    $2 = $5 + -64 | 0;
    $1 = $2 & 31;
    if (32 <= ($2 & 63) >>> 0) {
     $2 = 0;
     $1 = $4 >>> $1 | 0;
    } else {
     $2 = $4 >>> $1 | 0;
     $1 = ((1 << $1) - 1 & $4) << 32 - $1 | $3 >>> $1;
    }
    $3 = 0;
    $4 = 0;
    break label$1;
   }
   if (!$5) {
    break label$1
   }
   $7 = $4;
   $8 = $3;
   $9 = 64 - $5 | 0;
   $6 = $9 & 31;
   if (32 <= ($9 & 63) >>> 0) {
    $7 = $8 << $6;
    $9 = 0;
   } else {
    $7 = (1 << $6) - 1 & $8 >>> 32 - $6 | $7 << $6;
    $9 = $8 << $6;
   }
   $8 = $1;
   $6 = $5;
   $1 = $6 & 31;
   if (32 <= ($6 & 63) >>> 0) {
    $6 = 0;
    $1 = $2 >>> $1 | 0;
   } else {
    $6 = $2 >>> $1 | 0;
    $1 = ((1 << $1) - 1 & $2) << 32 - $1 | $8 >>> $1;
   }
   $1 = $9 | $1;
   $2 = $6 | $7;
   $6 = $3;
   $3 = $5 & 31;
   if (32 <= ($5 & 63) >>> 0) {
    $7 = 0;
    $3 = $4 >>> $3 | 0;
   } else {
    $7 = $4 >>> $3 | 0;
    $3 = ((1 << $3) - 1 & $4) << 32 - $3 | $6 >>> $3;
   }
   $4 = $7;
  }
  HEAP32[$0 >> 2] = $1;
  HEAP32[$0 + 4 >> 2] = $2;
  HEAP32[$0 + 8 >> 2] = $3;
  HEAP32[$0 + 12 >> 2] = $4;
 }
 
 function __trunctfdf2($0, $1, $2, $3) {
  var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0;
  $6 = global$0 - 32 | 0;
  global$0 = $6;
  $4 = $3 & 2147483647;
  $8 = $4;
  $4 = $4 + -1006698496 | 0;
  $7 = $2;
  $5 = $2;
  if ($2 >>> 0 < 0) {
   $4 = $4 + 1 | 0
  }
  $9 = $5;
  $5 = $4;
  $4 = $8 + -1140785152 | 0;
  $10 = $7;
  if ($7 >>> 0 < 0) {
   $4 = $4 + 1 | 0
  }
  label$1 : {
   if (($4 | 0) == ($5 | 0) & $9 >>> 0 < $10 >>> 0 | $5 >>> 0 < $4 >>> 0) {
    $4 = $3 << 4 | $2 >>> 28;
    $2 = $2 << 4 | $1 >>> 28;
    $1 = $1 & 268435455;
    $7 = $1;
    if (($1 | 0) == 134217728 & $0 >>> 0 >= 1 | $1 >>> 0 > 134217728) {
     $4 = $4 + 1073741824 | 0;
     $0 = $2 + 1 | 0;
     if ($0 >>> 0 < 1) {
      $4 = $4 + 1 | 0
     }
     $5 = $0;
     break label$1;
    }
    $5 = $2;
    $4 = $4 - (($2 >>> 0 < 0) + -1073741824 | 0) | 0;
    if ($0 | $7 ^ 134217728) {
     break label$1
    }
    $0 = $5 + ($5 & 1) | 0;
    if ($0 >>> 0 < $5 >>> 0) {
     $4 = $4 + 1 | 0
    }
    $5 = $0;
    break label$1;
   }
   if (!(!$7 & ($8 | 0) == 2147418112 ? !($0 | $1) : ($8 | 0) == 2147418112 & $7 >>> 0 < 0 | $8 >>> 0 < 2147418112)) {
    $4 = $3 << 4 | $2 >>> 28;
    $5 = $2 << 4 | $1 >>> 28;
    $4 = $4 & 524287 | 2146959360;
    break label$1;
   }
   $5 = 0;
   $4 = 2146435072;
   if (($8 | 0) == 1140785151 & $7 >>> 0 > 4294967295 | $8 >>> 0 > 1140785151) {
    break label$1
   }
   $4 = 0;
   $7 = $8 >>> 16 | 0;
   if ($7 >>> 0 < 15249) {
    break label$1
   }
   $4 = $3 & 65535 | 65536;
   __ashlti3($6 + 16 | 0, $0, $1, $2, $4, $7 + -15233 | 0);
   __lshrti3($6, $0, $1, $2, $4, 15361 - $7 | 0);
   $2 = HEAP32[$6 + 4 >> 2];
   $0 = HEAP32[$6 + 8 >> 2];
   $4 = HEAP32[$6 + 12 >> 2] << 4 | $0 >>> 28;
   $5 = $0 << 4 | $2 >>> 28;
   $0 = $2 & 268435455;
   $2 = $0;
   $1 = HEAP32[$6 >> 2] | ((HEAP32[$6 + 16 >> 2] | HEAP32[$6 + 24 >> 2]) != 0 | (HEAP32[$6 + 20 >> 2] | HEAP32[$6 + 28 >> 2]) != 0);
   if (($0 | 0) == 134217728 & $1 >>> 0 >= 1 | $0 >>> 0 > 134217728) {
    $0 = $5 + 1 | 0;
    if ($0 >>> 0 < 1) {
     $4 = $4 + 1 | 0
    }
    $5 = $0;
    break label$1;
   }
   if ($1 | $2 ^ 134217728) {
    break label$1
   }
   $0 = $5 + ($5 & 1) | 0;
   if ($0 >>> 0 < $5 >>> 0) {
    $4 = $4 + 1 | 0
   }
   $5 = $0;
  }
  global$0 = $6 + 32 | 0;
  wasm2js_scratch_store_i32(0, $5 | 0);
  wasm2js_scratch_store_i32(1, $3 & -2147483648 | $4);
  return +wasm2js_scratch_load_f64();
 }
 
 function FLAC__crc8($0, $1) {
  var $2 = 0;
  if ($1) {
   while (1) {
    $2 = HEAPU8[(HEAPU8[$0 | 0] ^ $2) + 1024 | 0];
    $0 = $0 + 1 | 0;
    $1 = $1 + -1 | 0;
    if ($1) {
     continue
    }
    break;
   }
  }
  return $2;
 }
 
 function FLAC__crc16($0, $1) {
  var $2 = 0, $3 = 0;
  if ($1 >>> 0 > 7) {
   while (1) {
    $3 = $2;
    $2 = HEAPU8[$0 | 0] | HEAPU8[$0 + 1 | 0] << 8;
    $2 = $3 ^ ($2 << 8 & 16711680 | $2 << 24) >>> 16;
    $2 = HEAPU16[(HEAPU8[$0 + 7 | 0] << 1) + 1280 >> 1] ^ (HEAPU16[((HEAPU8[$0 + 6 | 0] << 1) + 1280 | 0) + 512 >> 1] ^ (HEAPU16[(HEAPU8[$0 + 5 | 0] << 1) + 2304 >> 1] ^ (HEAPU16[(HEAPU8[$0 + 4 | 0] << 1) + 2816 >> 1] ^ (HEAPU16[(HEAPU8[$0 + 3 | 0] << 1) + 3328 >> 1] ^ (HEAPU16[(HEAPU8[$0 + 2 | 0] << 1) + 3840 >> 1] ^ (HEAPU16[(($2 & 255) << 1) + 4352 >> 1] ^ HEAPU16[($2 >>> 7 & 510) + 4864 >> 1]))))));
    $0 = $0 + 8 | 0;
    $1 = $1 + -8 | 0;
    if ($1 >>> 0 > 7) {
     continue
    }
    break;
   }
  }
  if ($1) {
   while (1) {
    $2 = HEAPU16[((HEAPU8[$0 | 0] ^ ($2 & 65280) >>> 8) << 1) + 1280 >> 1] ^ $2 << 8;
    $0 = $0 + 1 | 0;
    $1 = $1 + -1 | 0;
    if ($1) {
     continue
    }
    break;
   }
  }
  return $2 & 65535;
 }
 
 function FLAC__crc16_update_words32($0, $1, $2) {
  var $3 = 0;
  if ($1 >>> 0 >= 2) {
   while (1) {
    $3 = $2;
    $2 = HEAP32[$0 >> 2];
    $3 = $3 ^ $2 >>> 16;
    $3 = HEAPU16[(($3 & 255) << 1) + 4352 >> 1] ^ HEAPU16[($3 >>> 7 & 510) + 4864 >> 1] ^ HEAPU16[($2 >>> 7 & 510) + 3840 >> 1] ^ HEAPU16[(($2 & 255) << 1) + 3328 >> 1];
    $2 = HEAP32[$0 + 4 >> 2];
    $2 = $3 ^ HEAPU16[($2 >>> 23 & 510) + 2816 >> 1] ^ HEAPU16[($2 >>> 15 & 510) + 2304 >> 1] ^ HEAPU16[(($2 >>> 7 & 510) + 1280 | 0) + 512 >> 1] ^ HEAPU16[(($2 & 255) << 1) + 1280 >> 1];
    $0 = $0 + 8 | 0;
    $1 = $1 + -2 | 0;
    if ($1 >>> 0 > 1) {
     continue
    }
    break;
   }
  }
  if ($1) {
   $0 = HEAP32[$0 >> 2];
   $1 = $0 >>> 16 ^ $2;
   $2 = HEAPU16[(($1 & 255) << 1) + 2304 >> 1] ^ HEAPU16[($1 >>> 7 & 510) + 2816 >> 1] ^ HEAPU16[(($0 >>> 7 & 510) + 1280 | 0) + 512 >> 1] ^ HEAPU16[(($0 & 255) << 1) + 1280 >> 1];
  }
  return $2 & 65535;
 }
 
 function FLAC__bitwriter_delete($0) {
  var $1 = 0;
  $1 = HEAP32[$0 >> 2];
  if ($1) {
   dlfree($1)
  }
  dlfree($0);
 }
 
 function FLAC__bitwriter_free($0) {
  var $1 = 0;
  $1 = HEAP32[$0 >> 2];
  if ($1) {
   dlfree($1)
  }
  HEAP32[$0 + 16 >> 2] = 0;
  HEAP32[$0 >> 2] = 0;
  HEAP32[$0 + 8 >> 2] = 0;
  HEAP32[$0 + 12 >> 2] = 0;
 }
 
 function FLAC__bitwriter_init($0) {
  var $1 = 0;
  HEAP32[$0 + 16 >> 2] = 0;
  HEAP32[$0 + 8 >> 2] = 8192;
  HEAP32[$0 + 12 >> 2] = 0;
  $1 = $0;
  $0 = dlmalloc(32768);
  HEAP32[$1 >> 2] = $0;
  return ($0 | 0) != 0;
 }
 
 function FLAC__bitwriter_clear($0) {
  HEAP32[$0 + 12 >> 2] = 0;
  HEAP32[$0 + 16 >> 2] = 0;
 }
 
 function FLAC__bitwriter_get_write_crc16($0, $1) {
  var $2 = 0, $3 = 0, wasm2js_i32$0 = 0, wasm2js_i32$1 = 0;
  $2 = global$0 - 16 | 0;
  global$0 = $2;
  $3 = 0;
  label$1 : {
   if (!FLAC__bitwriter_get_buffer($0, $2 + 12 | 0, $2 + 8 | 0)) {
    break label$1
   }
   (wasm2js_i32$0 = $1, wasm2js_i32$1 = FLAC__crc16(HEAP32[$2 + 12 >> 2], HEAP32[$2 + 8 >> 2])), HEAP16[wasm2js_i32$0 >> 1] = wasm2js_i32$1;
   $3 = 1;
  }
  global$0 = $2 + 16 | 0;
  return $3;
 }
 
 function FLAC__bitwriter_get_buffer($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
  $5 = HEAP32[$0 + 16 >> 2];
  label$1 : {
   if ($5 & 7) {
    break label$1
   }
   label$2 : {
    if (!$5) {
     $4 = HEAP32[$0 >> 2];
     $3 = 0;
     break label$2;
    }
    $6 = HEAP32[$0 + 12 >> 2];
    label$4 : {
     if (($6 | 0) != HEAP32[$0 + 8 >> 2]) {
      break label$4
     }
     $4 = $5 + 63 >>> 5 | 0;
     $3 = $4 + $6 | 0;
     if ($3 >>> 0 <= $6 >>> 0) {
      break label$4
     }
     $6 = 0;
     $5 = HEAP32[$0 >> 2];
     $7 = $3;
     $3 = $4 & 1023;
     $3 = $7 + ($3 ? 1024 - $3 | 0 : 0) | 0;
     label$5 : {
      if ($3) {
       if (($3 | 0) != ($3 & 1073741823)) {
        break label$1
       }
       $4 = dlrealloc($5, $3 << 2);
       if ($4) {
        break label$5
       }
       dlfree($5);
       return 0;
      }
      $4 = dlrealloc($5, 0);
      if (!$4) {
       break label$1
      }
     }
     HEAP32[$0 + 8 >> 2] = $3;
     HEAP32[$0 >> 2] = $4;
     $6 = HEAP32[$0 + 12 >> 2];
     $5 = HEAP32[$0 + 16 >> 2];
    }
    $4 = HEAP32[$0 >> 2];
    $3 = HEAP32[$0 + 4 >> 2] << 32 - $5;
    HEAP32[$4 + ($6 << 2) >> 2] = $3 << 24 | $3 << 8 & 16711680 | ($3 >>> 8 & 65280 | $3 >>> 24);
    $3 = HEAP32[$0 + 16 >> 2] >>> 3 | 0;
   }
   HEAP32[$1 >> 2] = $4;
   HEAP32[$2 >> 2] = $3 + (HEAP32[$0 + 12 >> 2] << 2);
   $6 = 1;
  }
  return $6;
 }
 
 function FLAC__bitwriter_get_write_crc8($0, $1) {
  var $2 = 0, $3 = 0, wasm2js_i32$0 = 0, wasm2js_i32$1 = 0;
  $2 = global$0 - 16 | 0;
  global$0 = $2;
  $3 = 0;
  label$1 : {
   if (!FLAC__bitwriter_get_buffer($0, $2 + 12 | 0, $2 + 8 | 0)) {
    break label$1
   }
   (wasm2js_i32$0 = $1, wasm2js_i32$1 = FLAC__crc8(HEAP32[$2 + 12 >> 2], HEAP32[$2 + 8 >> 2])), HEAP8[wasm2js_i32$0 | 0] = wasm2js_i32$1;
   $3 = 1;
  }
  global$0 = $2 + 16 | 0;
  return $3;
 }
 
 function FLAC__bitwriter_write_zeroes($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0;
  label$1 : {
   label$2 : {
    if (!$1) {
     break label$2
    }
    $2 = HEAP32[$0 + 8 >> 2];
    $3 = HEAP32[$0 + 12 >> 2];
    label$3 : {
     if ($2 >>> 0 > $3 + $1 >>> 0) {
      break label$3
     }
     $4 = $3 + ((HEAP32[$0 + 16 >> 2] + $1 | 0) + 31 >>> 5 | 0) | 0;
     if ($4 >>> 0 <= $2 >>> 0) {
      break label$3
     }
     $3 = 0;
     $5 = HEAP32[$0 >> 2];
     $2 = $4 - $2 & 1023;
     $2 = $4 + ($2 ? 1024 - $2 | 0 : 0) | 0;
     label$4 : {
      if ($2) {
       if (($2 | 0) != ($2 & 1073741823)) {
        break label$1
       }
       $4 = dlrealloc($5, $2 << 2);
       if ($4) {
        break label$4
       }
       dlfree($5);
       return 0;
      }
      $4 = dlrealloc($5, 0);
      if (!$4) {
       break label$1
      }
     }
     HEAP32[$0 + 8 >> 2] = $2;
     HEAP32[$0 >> 2] = $4;
    }
    $2 = HEAP32[$0 + 16 >> 2];
    if ($2) {
     $4 = $2;
     $2 = 32 - $2 | 0;
     $3 = $2 >>> 0 < $1 >>> 0 ? $2 : $1;
     $5 = $4 + $3 | 0;
     HEAP32[$0 + 16 >> 2] = $5;
     $2 = HEAP32[$0 + 4 >> 2] << $3;
     HEAP32[$0 + 4 >> 2] = $2;
     if (($5 | 0) != 32) {
      break label$2
     }
     $5 = HEAP32[$0 + 12 >> 2];
     HEAP32[$0 + 12 >> 2] = $5 + 1;
     HEAP32[HEAP32[$0 >> 2] + ($5 << 2) >> 2] = $2 << 8 & 16711680 | $2 << 24 | ($2 >>> 8 & 65280 | $2 >>> 24);
     HEAP32[$0 + 16 >> 2] = 0;
     $1 = $1 - $3 | 0;
    }
    if ($1 >>> 0 >= 32) {
     $2 = HEAP32[$0 >> 2];
     while (1) {
      $3 = HEAP32[$0 + 12 >> 2];
      HEAP32[$0 + 12 >> 2] = $3 + 1;
      HEAP32[$2 + ($3 << 2) >> 2] = 0;
      $1 = $1 + -32 | 0;
      if ($1 >>> 0 > 31) {
       continue
      }
      break;
     };
    }
    if (!$1) {
     break label$2
    }
    HEAP32[$0 + 16 >> 2] = $1;
    HEAP32[$0 + 4 >> 2] = 0;
   }
   $3 = 1;
  }
  return $3;
 }
 
 function FLAC__bitwriter_write_raw_uint32($0, $1, $2) {
  var $3 = 0;
  label$1 : {
   if ($2 >>> 0 <= 31) {
    $3 = 0;
    if ($1 >>> $2) {
     break label$1
    }
   }
   $3 = FLAC__bitwriter_write_raw_uint32_nocheck($0, $1, $2);
  }
  return $3;
 }
 
 function FLAC__bitwriter_write_raw_uint32_nocheck($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
  label$1 : {
   if (!$0 | $2 >>> 0 > 32) {
    break label$1
   }
   $4 = HEAP32[$0 >> 2];
   if (!$4) {
    break label$1
   }
   $6 = 1;
   if (!$2) {
    break label$1
   }
   $7 = HEAP32[$0 + 8 >> 2];
   $3 = HEAP32[$0 + 12 >> 2];
   label$2 : {
    if ($7 >>> 0 > $3 + $2 >>> 0) {
     $3 = $4;
     break label$2;
    }
    $5 = $3 + ((HEAP32[$0 + 16 >> 2] + $2 | 0) + 31 >>> 5 | 0) | 0;
    if ($5 >>> 0 <= $7 >>> 0) {
     $3 = $4;
     break label$2;
    }
    $6 = 0;
    $3 = $5 - $7 & 1023;
    $5 = $5 + ($3 ? 1024 - $3 | 0 : 0) | 0;
    label$5 : {
     if ($5) {
      if (($5 | 0) != ($5 & 1073741823)) {
       break label$1
      }
      $3 = dlrealloc($4, $5 << 2);
      if ($3) {
       break label$5
      }
      dlfree($4);
      return 0;
     }
     $3 = dlrealloc($4, 0);
     if (!$3) {
      break label$1
     }
    }
    HEAP32[$0 + 8 >> 2] = $5;
    HEAP32[$0 >> 2] = $3;
   }
   $4 = HEAP32[$0 + 16 >> 2];
   $5 = 32 - $4 | 0;
   if ($5 >>> 0 > $2 >>> 0) {
    HEAP32[$0 + 16 >> 2] = $2 + $4;
    HEAP32[$0 + 4 >> 2] = HEAP32[$0 + 4 >> 2] << $2 | $1;
    return 1;
   }
   if ($4) {
    $4 = $2 - $5 | 0;
    HEAP32[$0 + 16 >> 2] = $4;
    $2 = HEAP32[$0 + 12 >> 2];
    HEAP32[$0 + 12 >> 2] = $2 + 1;
    $3 = ($2 << 2) + $3 | 0;
    $2 = HEAP32[$0 + 4 >> 2] << $5 | $1 >>> $4;
    HEAP32[$3 >> 2] = $2 << 24 | $2 << 8 & 16711680 | ($2 >>> 8 & 65280 | $2 >>> 24);
    HEAP32[$0 + 4 >> 2] = $1;
    return 1;
   }
   $6 = 1;
   $2 = $0;
   $0 = HEAP32[$0 + 12 >> 2];
   HEAP32[$2 + 12 >> 2] = $0 + 1;
   HEAP32[($0 << 2) + $3 >> 2] = $1 << 8 & 16711680 | $1 << 24 | ($1 >>> 8 & 65280 | $1 >>> 24);
  }
  return $6;
 }
 
 function FLAC__bitwriter_write_raw_int32($0, $1, $2) {
  return FLAC__bitwriter_write_raw_uint32_nocheck($0, ($2 >>> 0 < 32 ? -1 << $2 ^ -1 : -1) & $1, $2);
 }
 
 function FLAC__bitwriter_write_raw_uint64($0, $1, $2, $3) {
  var $4 = 0;
  label$1 : {
   if ($3 >>> 0 >= 33) {
    $3 = $3 + -32 | 0;
    if ($2 >>> $3 | 0 ? $3 >>> 0 <= 31 : 0) {
     break label$1
    }
    if (!FLAC__bitwriter_write_raw_uint32_nocheck($0, $2, $3)) {
     break label$1
    }
    return (FLAC__bitwriter_write_raw_uint32_nocheck($0, $1, 32) | 0) != 0;
   }
   if (($3 | 0) != 32) {
    if ($1 >>> $3) {
     break label$1
    }
   }
   $4 = FLAC__bitwriter_write_raw_uint32_nocheck($0, $1, $3);
  }
  return $4;
 }
 
 function FLAC__bitwriter_write_raw_uint32_little_endian($0, $1) {
  var $2 = 0;
  label$1 : {
   if (!FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 & 255, 8)) {
    break label$1
   }
   if (!FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 8 & 255, 8)) {
    break label$1
   }
   if (!FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 16 & 255, 8)) {
    break label$1
   }
   $2 = (FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 24 | 0, 8) | 0) != 0;
  }
  return $2;
 }
 
 function FLAC__bitwriter_write_byte_block($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0, $6 = 0;
  $3 = HEAP32[$0 + 8 >> 2];
  $4 = HEAP32[$0 + 12 >> 2];
  label$1 : {
   label$2 : {
    if ($3 >>> 0 > ($4 + ($2 >>> 2 | 0) | 0) + 1 >>> 0) {
     break label$2
    }
    $5 = $4 + ((HEAP32[$0 + 16 >> 2] + ($2 << 3) | 0) + 31 >>> 5 | 0) | 0;
    if ($5 >>> 0 <= $3 >>> 0) {
     break label$2
    }
    $4 = 0;
    $6 = HEAP32[$0 >> 2];
    $3 = $5 - $3 & 1023;
    $3 = $5 + ($3 ? 1024 - $3 | 0 : 0) | 0;
    label$3 : {
     if ($3) {
      if (($3 | 0) != ($3 & 1073741823)) {
       break label$1
      }
      $5 = dlrealloc($6, $3 << 2);
      if ($5) {
       break label$3
      }
      dlfree($6);
      return 0;
     }
     $5 = dlrealloc($6, 0);
     if (!$5) {
      break label$1
     }
    }
    HEAP32[$0 + 8 >> 2] = $3;
    HEAP32[$0 >> 2] = $5;
   }
   $4 = 1;
   if (!$2) {
    break label$1
   }
   $4 = 0;
   label$5 : {
    while (1) {
     if (!FLAC__bitwriter_write_raw_uint32_nocheck($0, HEAPU8[$1 + $4 | 0], 8)) {
      break label$5
     }
     $4 = $4 + 1 | 0;
     if (($4 | 0) != ($2 | 0)) {
      continue
     }
     break;
    };
    return 1;
   }
   $4 = 0;
  }
  return $4;
 }
 
 function FLAC__bitwriter_write_unary_unsigned($0, $1) {
  if ($1 >>> 0 <= 31) {
   return FLAC__bitwriter_write_raw_uint32_nocheck($0, 1, $1 + 1 | 0)
  }
  if (!FLAC__bitwriter_write_zeroes($0, $1)) {
   return 0
  }
  return (FLAC__bitwriter_write_raw_uint32_nocheck($0, 1, 1) | 0) != 0;
 }
 
 function FLAC__bitwriter_write_rice_signed_block($0, $1, $2, $3) {
  var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0;
  $4 = 1;
  label$1 : {
   if (!$2) {
    break label$1
   }
   $10 = $3 + 1 | 0;
   $11 = -1 << $3;
   $12 = -1 >>> 31 - $3 | 0;
   while (1) {
    $6 = HEAP32[$1 >> 2];
    $9 = $6 << 1 ^ $6 >> 31;
    $6 = $9 >>> $3 | 0;
    $4 = $10 + $6 | 0;
    label$3 : {
     label$4 : {
      $5 = HEAP32[$0 + 16 >> 2];
      if (!$5) {
       break label$4
      }
      $7 = $4 + $5 | 0;
      if ($7 >>> 0 > 31) {
       break label$4
      }
      HEAP32[$0 + 16 >> 2] = $7;
      HEAP32[$0 + 4 >> 2] = ($9 | $11) & $12 | HEAP32[$0 + 4 >> 2] << $4;
      break label$3;
     }
     $8 = HEAP32[$0 + 8 >> 2];
     $7 = HEAP32[$0 + 12 >> 2];
     label$5 : {
      if ($8 >>> 0 > ($7 + ($5 + $6 | 0) | 0) + 1 >>> 0) {
       break label$5
      }
      $4 = $7 + (($4 + $5 | 0) + 31 >>> 5 | 0) | 0;
      if ($4 >>> 0 <= $8 >>> 0) {
       break label$5
      }
      $7 = HEAP32[$0 >> 2];
      $5 = $4 - $8 & 1023;
      $5 = $4 + ($5 ? 1024 - $5 | 0 : 0) | 0;
      label$6 : {
       if ($5) {
        $4 = 0;
        if (($5 | 0) != ($5 & 1073741823)) {
         break label$1
        }
        $8 = dlrealloc($7, $5 << 2);
        if ($8) {
         break label$6
        }
        dlfree($7);
        return 0;
       }
       $8 = dlrealloc($7, 0);
       $4 = 0;
       if (!$8) {
        break label$1
       }
      }
      HEAP32[$0 + 8 >> 2] = $5;
      HEAP32[$0 >> 2] = $8;
     }
     label$8 : {
      if (!$6) {
       break label$8
      }
      $4 = HEAP32[$0 + 16 >> 2];
      if ($4) {
       $5 = HEAP32[$0 + 4 >> 2];
       $7 = 32 - $4 | 0;
       if ($6 >>> 0 < $7 >>> 0) {
        HEAP32[$0 + 16 >> 2] = $4 + $6;
        HEAP32[$0 + 4 >> 2] = $5 << $6;
        break label$8;
       }
       $4 = $5 << $7;
       HEAP32[$0 + 4 >> 2] = $4;
       $5 = HEAP32[$0 + 12 >> 2];
       HEAP32[$0 + 12 >> 2] = $5 + 1;
       HEAP32[HEAP32[$0 >> 2] + ($5 << 2) >> 2] = $4 << 8 & 16711680 | $4 << 24 | ($4 >>> 8 & 65280 | $4 >>> 24);
       HEAP32[$0 + 16 >> 2] = 0;
       $6 = $6 - $7 | 0;
      }
      if ($6 >>> 0 >= 32) {
       $4 = HEAP32[$0 >> 2];
       while (1) {
        $5 = HEAP32[$0 + 12 >> 2];
        HEAP32[$0 + 12 >> 2] = $5 + 1;
        HEAP32[$4 + ($5 << 2) >> 2] = 0;
        $6 = $6 + -32 | 0;
        if ($6 >>> 0 > 31) {
         continue
        }
        break;
       };
      }
      if (!$6) {
       break label$8
      }
      HEAP32[$0 + 16 >> 2] = $6;
      HEAP32[$0 + 4 >> 2] = 0;
     }
     $6 = ($9 | $11) & $12;
     $4 = HEAP32[$0 + 4 >> 2];
     $7 = HEAP32[$0 + 16 >> 2];
     $5 = 32 - $7 | 0;
     if ($10 >>> 0 < $5 >>> 0) {
      HEAP32[$0 + 16 >> 2] = $7 + $10;
      HEAP32[$0 + 4 >> 2] = $6 | $4 << $10;
      break label$3;
     }
     $7 = $10 - $5 | 0;
     HEAP32[$0 + 16 >> 2] = $7;
     $9 = HEAP32[$0 + 12 >> 2];
     HEAP32[$0 + 12 >> 2] = $9 + 1;
     $4 = $4 << $5 | $6 >>> $7;
     HEAP32[HEAP32[$0 >> 2] + ($9 << 2) >> 2] = $4 << 24 | $4 << 8 & 16711680 | ($4 >>> 8 & 65280 | $4 >>> 24);
     HEAP32[$0 + 4 >> 2] = $6;
    }
    $1 = $1 + 4 | 0;
    $2 = $2 + -1 | 0;
    if ($2) {
     continue
    }
    break;
   };
   $4 = 1;
  }
  return $4;
 }
 
 function FLAC__bitwriter_write_utf8_uint32($0, $1) {
  if (($1 | 0) >= 0) {
   if ($1 >>> 0 <= 127) {
    return FLAC__bitwriter_write_raw_uint32_nocheck($0, $1, 8)
   }
   if ($1 >>> 0 <= 2047) {
    return FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 6 | 192, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 & 63 | 128, 8) & 1
   }
   if ($1 >>> 0 <= 65535) {
    return FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 12 | 224, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 6 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 & 63 | 128, 8) & 1
   }
   if ($1 >>> 0 <= 2097151) {
    return FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 18 | 240, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 12 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 6 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 & 63 | 128, 8) & 1
   }
   if ($1 >>> 0 <= 67108863) {
    return FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 24 | 248, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 18 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 12 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 6 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 & 63 | 128, 8) & 1
   }
   $0 = FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 30 | 252, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 24 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 18 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 12 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 6 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 & 63 | 128, 8) & 1;
  } else {
   $0 = 0
  }
  return $0;
 }
 
 function FLAC__bitwriter_write_utf8_uint64($0, $1, $2) {
  if (($2 | 0) == 15 & $1 >>> 0 <= 4294967295 | $2 >>> 0 < 15) {
   if (!$2 & $1 >>> 0 <= 127 | $2 >>> 0 < 0) {
    return FLAC__bitwriter_write_raw_uint32_nocheck($0, $1, 8)
   }
   if (!$2 & $1 >>> 0 <= 2047 | $2 >>> 0 < 0) {
    return FLAC__bitwriter_write_raw_uint32_nocheck($0, ($2 & 63) << 26 | $1 >>> 6 | 192, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 & 63 | 128, 8) & 1
   }
   if (!$2 & $1 >>> 0 <= 65535 | $2 >>> 0 < 0) {
    return FLAC__bitwriter_write_raw_uint32_nocheck($0, ($2 & 4095) << 20 | $1 >>> 12 | 224, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 6 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 & 63 | 128, 8) & 1
   }
   if (!$2 & $1 >>> 0 <= 2097151 | $2 >>> 0 < 0) {
    return FLAC__bitwriter_write_raw_uint32_nocheck($0, ($2 & 262143) << 14 | $1 >>> 18 | 240, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 12 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 6 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 & 63 | 128, 8) & 1
   }
   if (!$2 & $1 >>> 0 <= 67108863 | $2 >>> 0 < 0) {
    return FLAC__bitwriter_write_raw_uint32_nocheck($0, ($2 & 16777215) << 8 | $1 >>> 24 | 248, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 18 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 12 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 6 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 & 63 | 128, 8) & 1
   }
   if (!$2 & $1 >>> 0 <= 2147483647 | $2 >>> 0 < 0) {
    return FLAC__bitwriter_write_raw_uint32_nocheck($0, ($2 & 1073741823) << 2 | $1 >>> 30 | 252, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 24 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 18 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 12 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 6 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 & 63 | 128, 8) & 1
   }
   $0 = FLAC__bitwriter_write_raw_uint32_nocheck($0, 254, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, ($2 & 1073741823) << 2 | $1 >>> 30 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 24 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 18 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 12 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 >>> 6 & 63 | 128, 8) & FLAC__bitwriter_write_raw_uint32_nocheck($0, $1 & 63 | 128, 8) & 1;
  } else {
   $0 = 0
  }
  return $0;
 }
 
 function memmove($0, $1, $2) {
  var $3 = 0;
  label$1 : {
   if (($0 | 0) == ($1 | 0)) {
    break label$1
   }
   if (($1 - $0 | 0) - $2 >>> 0 <= 0 - ($2 << 1) >>> 0) {
    memcpy($0, $1, $2);
    return;
   }
   $3 = ($0 ^ $1) & 3;
   label$3 : {
    label$4 : {
     if ($0 >>> 0 < $1 >>> 0) {
      if ($3) {
       break label$3
      }
      if (!($0 & 3)) {
       break label$4
      }
      while (1) {
       if (!$2) {
        break label$1
       }
       HEAP8[$0 | 0] = HEAPU8[$1 | 0];
       $1 = $1 + 1 | 0;
       $2 = $2 + -1 | 0;
       $0 = $0 + 1 | 0;
       if ($0 & 3) {
        continue
       }
       break;
      };
      break label$4;
     }
     label$9 : {
      if ($3) {
       break label$9
      }
      if ($0 + $2 & 3) {
       while (1) {
        if (!$2) {
         break label$1
        }
        $2 = $2 + -1 | 0;
        $3 = $2 + $0 | 0;
        HEAP8[$3 | 0] = HEAPU8[$1 + $2 | 0];
        if ($3 & 3) {
         continue
        }
        break;
       }
      }
      if ($2 >>> 0 <= 3) {
       break label$9
      }
      while (1) {
       $2 = $2 + -4 | 0;
       HEAP32[$2 + $0 >> 2] = HEAP32[$1 + $2 >> 2];
       if ($2 >>> 0 > 3) {
        continue
       }
       break;
      };
     }
     if (!$2) {
      break label$1
     }
     while (1) {
      $2 = $2 + -1 | 0;
      HEAP8[$2 + $0 | 0] = HEAPU8[$1 + $2 | 0];
      if ($2) {
       continue
      }
      break;
     };
     break label$1;
    }
    if ($2 >>> 0 <= 3) {
     break label$3
    }
    while (1) {
     HEAP32[$0 >> 2] = HEAP32[$1 >> 2];
     $1 = $1 + 4 | 0;
     $0 = $0 + 4 | 0;
     $2 = $2 + -4 | 0;
     if ($2 >>> 0 > 3) {
      continue
     }
     break;
    };
   }
   if (!$2) {
    break label$1
   }
   while (1) {
    HEAP8[$0 | 0] = HEAPU8[$1 | 0];
    $0 = $0 + 1 | 0;
    $1 = $1 + 1 | 0;
    $2 = $2 + -1 | 0;
    if ($2) {
     continue
    }
    break;
   };
  }
 }
 
 function ogg_page_serialno($0) {
  $0 = HEAP32[$0 >> 2];
  return HEAPU8[$0 + 14 | 0] | HEAPU8[$0 + 15 | 0] << 8 | (HEAPU8[$0 + 16 | 0] << 16 | HEAPU8[$0 + 17 | 0] << 24);
 }
 
 function ogg_stream_init($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0;
  if ($0) {
   memset($0 + 8 | 0, 352);
   HEAP32[$0 + 24 >> 2] = 1024;
   HEAP32[$0 + 4 >> 2] = 16384;
   $3 = dlmalloc(16384);
   HEAP32[$0 >> 2] = $3;
   $2 = dlmalloc(4096);
   HEAP32[$0 + 16 >> 2] = $2;
   $4 = dlmalloc(8192);
   HEAP32[$0 + 20 >> 2] = $4;
   label$2 : {
    if ($3) {
     if ($2 ? $4 : 0) {
      break label$2
     }
     dlfree($3);
     $2 = HEAP32[$0 + 16 >> 2];
    }
    if ($2) {
     dlfree($2)
    }
    $1 = HEAP32[$0 + 20 >> 2];
    if ($1) {
     dlfree($1)
    }
    memset($0, 360);
    return -1;
   }
   HEAP32[$0 + 336 >> 2] = $1;
   $0 = 0;
  } else {
   $0 = -1
  }
  return $0;
 }
 
 function ogg_stream_clear($0) {
  var $1 = 0;
  if ($0) {
   $1 = HEAP32[$0 >> 2];
   if ($1) {
    dlfree($1)
   }
   $1 = HEAP32[$0 + 16 >> 2];
   if ($1) {
    dlfree($1)
   }
   $1 = HEAP32[$0 + 20 >> 2];
   if ($1) {
    dlfree($1)
   }
   memset($0, 360);
  }
 }
 
 function ogg_page_checksum_set($0) {
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0;
  if ($0) {
   HEAP8[HEAP32[$0 >> 2] + 22 | 0] = 0;
   HEAP8[HEAP32[$0 >> 2] + 23 | 0] = 0;
   HEAP8[HEAP32[$0 >> 2] + 24 | 0] = 0;
   HEAP8[HEAP32[$0 >> 2] + 25 | 0] = 0;
   $3 = HEAP32[$0 + 4 >> 2];
   if (($3 | 0) >= 1) {
    $4 = HEAP32[$0 >> 2];
    while (1) {
     $1 = HEAP32[((HEAPU8[$2 + $4 | 0] ^ $1 >>> 24) << 2) + 5376 >> 2] ^ $1 << 8;
     $2 = $2 + 1 | 0;
     if (($3 | 0) != ($2 | 0)) {
      continue
     }
     break;
    };
   }
   $3 = HEAP32[$0 + 12 >> 2];
   if (($3 | 0) >= 1) {
    $4 = HEAP32[$0 + 8 >> 2];
    $2 = 0;
    while (1) {
     $1 = HEAP32[((HEAPU8[$2 + $4 | 0] ^ $1 >>> 24) << 2) + 5376 >> 2] ^ $1 << 8;
     $2 = $2 + 1 | 0;
     if (($3 | 0) != ($2 | 0)) {
      continue
     }
     break;
    };
   }
   HEAP8[HEAP32[$0 >> 2] + 22 | 0] = $1;
   HEAP8[HEAP32[$0 >> 2] + 23 | 0] = $1 >>> 8;
   HEAP8[HEAP32[$0 >> 2] + 24 | 0] = $1 >>> 16;
   HEAP8[HEAP32[$0 >> 2] + 25 | 0] = $1 >>> 24;
  }
 }
 
 function ogg_stream_iovecin($0, $1, $2, $3, $4) {
  var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0;
  $6 = -1;
  folding_inner0 : {
   label$1 : {
    if (!$0) {
     break label$1
    }
    $8 = HEAP32[$0 >> 2];
    if (!$8) {
     break label$1
    }
    if (!$1) {
     return 0
    }
    while (1) {
     $7 = HEAP32[(($5 << 3) + $1 | 0) + 4 >> 2];
     if (($7 | 0) < 0 | ($9 | 0) > (2147483647 - $7 | 0)) {
      break label$1
     }
     $9 = $7 + $9 | 0;
     $5 = $5 + 1 | 0;
     if (($5 | 0) != 1) {
      continue
     }
     break;
    };
    $5 = HEAP32[$0 + 12 >> 2];
    if ($5) {
     $7 = HEAP32[$0 + 8 >> 2] - $5 | 0;
     HEAP32[$0 + 8 >> 2] = $7;
     if ($7) {
      memmove($8, $5 + $8 | 0, $7)
     }
     HEAP32[$0 + 12 >> 2] = 0;
    }
    $5 = HEAP32[$0 + 4 >> 2];
    if (($5 - $9 | 0) <= HEAP32[$0 + 8 >> 2]) {
     if (($5 | 0) > (2147483647 - $9 | 0)) {
      break folding_inner0
     }
     $5 = $5 + $9 | 0;
     $5 = ($5 | 0) < 2147482623 ? $5 + 1024 | 0 : $5;
     $8 = dlrealloc(HEAP32[$0 >> 2], $5);
     if (!$8) {
      break folding_inner0
     }
     HEAP32[$0 >> 2] = $8;
     HEAP32[$0 + 4 >> 2] = $5;
    }
    $8 = ($9 | 0) / 255 | 0;
    $11 = $8 + 1 | 0;
    if (_os_lacing_expand($0, $11)) {
     break label$1
    }
    $6 = HEAP32[$0 + 8 >> 2];
    $5 = 0;
    while (1) {
     $7 = HEAP32[$0 >> 2] + $6 | 0;
     $6 = ($5 << 3) + $1 | 0;
     memcpy($7, HEAP32[$6 >> 2], HEAP32[$6 + 4 >> 2]);
     $6 = HEAP32[$0 + 8 >> 2] + HEAP32[$6 + 4 >> 2] | 0;
     HEAP32[$0 + 8 >> 2] = $6;
     $5 = $5 + 1 | 0;
     if (($5 | 0) != 1) {
      continue
     }
     break;
    };
    $7 = HEAP32[$0 + 16 >> 2];
    $12 = $7;
    $1 = HEAP32[$0 + 28 >> 2];
    $13 = $1;
    label$19 : {
     if (($9 | 0) <= 254) {
      $6 = HEAP32[$0 + 20 >> 2];
      $5 = 0;
      break label$19;
     }
     $6 = HEAP32[$0 + 20 >> 2];
     $5 = 0;
     while (1) {
      $10 = $1 + $5 | 0;
      HEAP32[$7 + ($10 << 2) >> 2] = 255;
      $14 = HEAP32[$0 + 356 >> 2];
      $10 = ($10 << 3) + $6 | 0;
      HEAP32[$10 >> 2] = HEAP32[$0 + 352 >> 2];
      HEAP32[$10 + 4 >> 2] = $14;
      $5 = $5 + 1 | 0;
      if (($8 | 0) != ($5 | 0)) {
       continue
      }
      break;
     };
     $5 = $8;
    }
    $5 = $13 + $5 | 0;
    HEAP32[$12 + ($5 << 2) >> 2] = $9 - Math_imul($8, 255);
    $5 = ($5 << 3) + $6 | 0;
    HEAP32[$5 >> 2] = $3;
    HEAP32[$5 + 4 >> 2] = $4;
    HEAP32[$0 + 352 >> 2] = $3;
    HEAP32[$0 + 356 >> 2] = $4;
    $3 = $7 + ($1 << 2) | 0;
    HEAP32[$3 >> 2] = HEAP32[$3 >> 2] | 256;
    HEAP32[$0 + 28 >> 2] = $1 + $11;
    $1 = HEAP32[$0 + 348 >> 2];
    $3 = HEAP32[$0 + 344 >> 2] + 1 | 0;
    if ($3 >>> 0 < 1) {
     $1 = $1 + 1 | 0
    }
    HEAP32[$0 + 344 >> 2] = $3;
    HEAP32[$0 + 348 >> 2] = $1;
    $6 = 0;
    if (!$2) {
     break label$1
    }
    HEAP32[$0 + 328 >> 2] = 1;
   }
   return $6;
  }
  $1 = HEAP32[$0 >> 2];
  if ($1) {
   dlfree($1)
  }
  $1 = HEAP32[$0 + 16 >> 2];
  if ($1) {
   dlfree($1)
  }
  $1 = HEAP32[$0 + 20 >> 2];
  if ($1) {
   dlfree($1)
  }
  memset($0, 360);
  return -1;
 }
 
 function _os_lacing_expand($0, $1) {
  var $2 = 0;
  folding_inner0 : {
   $2 = HEAP32[$0 + 24 >> 2];
   if (($2 - $1 | 0) <= HEAP32[$0 + 28 >> 2]) {
    if (($2 | 0) > (2147483647 - $1 | 0)) {
     break folding_inner0
    }
    $1 = $1 + $2 | 0;
    $1 = ($1 | 0) < 2147483615 ? $1 + 32 | 0 : $1;
    $2 = dlrealloc(HEAP32[$0 + 16 >> 2], $1 << 2);
    if (!$2) {
     break folding_inner0
    }
    HEAP32[$0 + 16 >> 2] = $2;
    $2 = dlrealloc(HEAP32[$0 + 20 >> 2], $1 << 3);
    if (!$2) {
     break folding_inner0
    }
    HEAP32[$0 + 24 >> 2] = $1;
    HEAP32[$0 + 20 >> 2] = $2;
   }
   return 0;
  }
  $1 = HEAP32[$0 >> 2];
  if ($1) {
   dlfree($1)
  }
  $1 = HEAP32[$0 + 16 >> 2];
  if ($1) {
   dlfree($1)
  }
  $1 = HEAP32[$0 + 20 >> 2];
  if ($1) {
   dlfree($1)
  }
  memset($0, 360);
  return -1;
 }
 
 function ogg_stream_packetin($0, $1) {
  var $2 = 0;
  $2 = global$0 - 16 | 0;
  global$0 = $2;
  HEAP32[$2 + 8 >> 2] = HEAP32[$1 >> 2];
  HEAP32[$2 + 12 >> 2] = HEAP32[$1 + 4 >> 2];
  $0 = ogg_stream_iovecin($0, $2 + 8 | 0, HEAP32[$1 + 12 >> 2], HEAP32[$1 + 16 >> 2], HEAP32[$1 + 20 >> 2]);
  global$0 = $2 + 16 | 0;
  return $0;
 }
 
 function ogg_stream_flush_i($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0;
  label$1 : {
   if (!$0) {
    break label$1
   }
   $8 = HEAP32[$0 + 28 >> 2];
   $4 = ($8 | 0) < 255 ? $8 : 255;
   if (!$4) {
    break label$1
   }
   $10 = HEAP32[$0 >> 2];
   if (!$10) {
    break label$1
   }
   label$2 : {
    label$3 : {
     label$4 : {
      $11 = HEAP32[$0 + 332 >> 2];
      if ($11) {
       if (($8 | 0) >= 1) {
        break label$4
       }
       $7 = -1;
       $5 = -1;
       break label$3;
      }
      $3 = ($4 | 0) > 0 ? $4 : 0;
      while (1) {
       if (($3 | 0) == ($6 | 0)) {
        break label$3
       }
       $9 = $6 << 2;
       $4 = $6 + 1 | 0;
       $6 = $4;
       if (HEAPU8[$9 + HEAP32[$0 + 16 >> 2] | 0] == 255) {
        continue
       }
       break;
      };
      $3 = $4;
      break label$3;
     }
     $4 = ($4 | 0) > 1 ? $4 : 1;
     $7 = -1;
     $5 = -1;
     label$7 : {
      while (1) {
       if (!(($6 | 0) <= 4096 | ($9 | 0) <= 3)) {
        $2 = 1;
        break label$7;
       }
       $9 = 0;
       $12 = HEAPU8[HEAP32[$0 + 16 >> 2] + ($3 << 2) | 0];
       if (($12 | 0) != 255) {
        $13 = $13 + 1 | 0;
        $9 = $13;
        $5 = HEAP32[$0 + 20 >> 2] + ($3 << 3) | 0;
        $7 = HEAP32[$5 >> 2];
        $5 = HEAP32[$5 + 4 >> 2];
       }
       $6 = $6 + $12 | 0;
       $3 = $3 + 1 | 0;
       if (($4 | 0) != ($3 | 0)) {
        continue
       }
       break;
      };
      $3 = $4;
     }
     $4 = 255;
     if (($3 | 0) == 255) {
      break label$2
     }
    }
    $4 = $3;
    if (!$2) {
     break label$1
    }
   }
   HEAP32[$0 + 40 >> 2] = 1399285583;
   HEAP16[$0 + 44 >> 1] = 0;
   $2 = HEAP32[$0 + 16 >> 2];
   $3 = (HEAPU8[$2 + 1 | 0] ^ -1) & 1;
   $3 = $11 ? $3 : $3 | 2;
   HEAP8[$0 + 45 | 0] = $3;
   if (!(!HEAP32[$0 + 328 >> 2] | ($4 | 0) != ($8 | 0))) {
    HEAP8[$0 + 45 | 0] = $3 | 4
   }
   HEAP32[$0 + 332 >> 2] = 1;
   HEAP8[$0 + 53 | 0] = $5 >>> 24;
   HEAP8[$0 + 52 | 0] = $5 >>> 16;
   HEAP8[$0 + 51 | 0] = $5 >>> 8;
   HEAP8[$0 + 50 | 0] = $5;
   HEAP8[$0 + 49 | 0] = ($5 & 16777215) << 8 | $7 >>> 24;
   HEAP8[$0 + 48 | 0] = ($5 & 65535) << 16 | $7 >>> 16;
   HEAP8[$0 + 47 | 0] = ($5 & 255) << 24 | $7 >>> 8;
   HEAP8[$0 + 46 | 0] = $7;
   $3 = HEAP32[$0 + 336 >> 2];
   HEAP8[$0 + 54 | 0] = $3;
   HEAP8[$0 + 55 | 0] = $3 >>> 8;
   HEAP8[$0 + 56 | 0] = $3 >>> 16;
   HEAP8[$0 + 57 | 0] = $3 >>> 24;
   $3 = HEAP32[$0 + 340 >> 2];
   if (($3 | 0) == -1) {
    HEAP32[$0 + 340 >> 2] = 0;
    $3 = 0;
   }
   HEAP8[$0 + 66 | 0] = $4;
   $6 = 0;
   HEAP16[$0 + 62 >> 1] = 0;
   HEAP16[$0 + 64 >> 1] = 0;
   HEAP8[$0 + 61 | 0] = $3 >>> 24;
   HEAP8[$0 + 60 | 0] = $3 >>> 16;
   HEAP8[$0 + 59 | 0] = $3 >>> 8;
   HEAP8[$0 + 58 | 0] = $3;
   $14 = 1;
   HEAP32[$0 + 340 >> 2] = $3 + 1;
   if (($4 | 0) >= 1) {
    $3 = 0;
    while (1) {
     $5 = HEAP32[$2 + ($3 << 2) >> 2];
     HEAP8[($0 + $3 | 0) + 67 | 0] = $5;
     $6 = ($5 & 255) + $6 | 0;
     $3 = $3 + 1 | 0;
     if (($4 | 0) != ($3 | 0)) {
      continue
     }
     break;
    };
   }
   HEAP32[$1 >> 2] = $0 + 40;
   $3 = $4 + 27 | 0;
   HEAP32[$0 + 324 >> 2] = $3;
   HEAP32[$1 + 4 >> 2] = $3;
   $3 = HEAP32[$0 + 12 >> 2];
   HEAP32[$1 + 12 >> 2] = $6;
   HEAP32[$1 + 8 >> 2] = $3 + $10;
   $3 = $8 - $4 | 0;
   HEAP32[$0 + 28 >> 2] = $3;
   memmove($2, $2 + ($4 << 2) | 0, $3 << 2);
   $2 = HEAP32[$0 + 20 >> 2];
   memmove($2, $2 + ($4 << 3) | 0, HEAP32[$0 + 28 >> 2] << 3);
   HEAP32[$0 + 12 >> 2] = HEAP32[$0 + 12 >> 2] + $6;
   if (!$1) {
    break label$1
   }
   $0 = 0;
   HEAP8[HEAP32[$1 >> 2] + 22 | 0] = 0;
   HEAP8[HEAP32[$1 >> 2] + 23 | 0] = 0;
   HEAP8[HEAP32[$1 >> 2] + 24 | 0] = 0;
   HEAP8[HEAP32[$1 >> 2] + 25 | 0] = 0;
   $2 = HEAP32[$1 + 4 >> 2];
   if (($2 | 0) >= 1) {
    $4 = HEAP32[$1 >> 2];
    $3 = 0;
    while (1) {
     $0 = HEAP32[((HEAPU8[$3 + $4 | 0] ^ $0 >>> 24) << 2) + 5376 >> 2] ^ $0 << 8;
     $3 = $3 + 1 | 0;
     if (($2 | 0) != ($3 | 0)) {
      continue
     }
     break;
    };
   }
   $2 = HEAP32[$1 + 12 >> 2];
   if (($2 | 0) >= 1) {
    $4 = HEAP32[$1 + 8 >> 2];
    $3 = 0;
    while (1) {
     $0 = HEAP32[((HEAPU8[$3 + $4 | 0] ^ $0 >>> 24) << 2) + 5376 >> 2] ^ $0 << 8;
     $3 = $3 + 1 | 0;
     if (($2 | 0) != ($3 | 0)) {
      continue
     }
     break;
    };
   }
   HEAP8[HEAP32[$1 >> 2] + 22 | 0] = $0;
   HEAP8[HEAP32[$1 >> 2] + 23 | 0] = $0 >>> 8;
   HEAP8[HEAP32[$1 >> 2] + 24 | 0] = $0 >>> 16;
   HEAP8[HEAP32[$1 >> 2] + 25 | 0] = $0 >>> 24;
  }
  return $14;
 }
 
 function ogg_stream_pageout($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0;
  if (!(!$0 | !HEAP32[$0 >> 2])) {
   $2 = HEAP32[$0 + 28 >> 2];
   $4 = $0;
   label$2 : {
    label$3 : {
     if (HEAP32[$0 + 328 >> 2]) {
      if ($2) {
       break label$3
      }
      $3 = 0;
      break label$2;
     }
     $3 = 0;
     if (HEAP32[$0 + 332 >> 2] | !$2) {
      break label$2
     }
    }
    $3 = 1;
   }
   $2 = ogg_stream_flush_i($4, $1, $3);
  }
  return $2;
 }
 
 function ogg_sync_init($0) {
  if ($0) {
   HEAP32[$0 >> 2] = 0;
   HEAP32[$0 + 4 >> 2] = 0;
   HEAP32[$0 + 24 >> 2] = 0;
   HEAP32[$0 + 16 >> 2] = 0;
   HEAP32[$0 + 20 >> 2] = 0;
   HEAP32[$0 + 8 >> 2] = 0;
   HEAP32[$0 + 12 >> 2] = 0;
  }
  return 0;
 }
 
 function ogg_sync_clear($0) {
  var $1 = 0;
  if ($0) {
   $1 = HEAP32[$0 >> 2];
   if ($1) {
    dlfree($1)
   }
   HEAP32[$0 >> 2] = 0;
   HEAP32[$0 + 4 >> 2] = 0;
   HEAP32[$0 + 24 >> 2] = 0;
   HEAP32[$0 + 16 >> 2] = 0;
   HEAP32[$0 + 20 >> 2] = 0;
   HEAP32[$0 + 8 >> 2] = 0;
   HEAP32[$0 + 12 >> 2] = 0;
  }
 }
 
 function ogg_sync_buffer($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0;
  $2 = HEAP32[$0 + 4 >> 2];
  if (($2 | 0) >= 0) {
   $4 = HEAP32[$0 + 12 >> 2];
   if ($4) {
    $3 = HEAP32[$0 + 8 >> 2] - $4 | 0;
    HEAP32[$0 + 8 >> 2] = $3;
    if (($3 | 0) >= 1) {
     $2 = HEAP32[$0 >> 2];
     memmove($2, $2 + $4 | 0, $3);
     $2 = HEAP32[$0 + 4 >> 2];
    }
    HEAP32[$0 + 12 >> 2] = 0;
   }
   $3 = $2;
   $2 = HEAP32[$0 + 8 >> 2];
   label$4 : {
    if (($3 - $2 | 0) >= ($1 | 0)) {
     $1 = HEAP32[$0 >> 2];
     break label$4;
    }
    $2 = ($1 + $2 | 0) + 4096 | 0;
    $1 = HEAP32[$0 >> 2];
    label$6 : {
     if ($1) {
      $1 = dlrealloc($1, $2);
      break label$6;
     }
     $1 = dlmalloc($2);
    }
    if (!$1) {
     $1 = HEAP32[$0 >> 2];
     if ($1) {
      dlfree($1)
     }
     HEAP32[$0 >> 2] = 0;
     HEAP32[$0 + 4 >> 2] = 0;
     HEAP32[$0 + 24 >> 2] = 0;
     HEAP32[$0 + 16 >> 2] = 0;
     HEAP32[$0 + 20 >> 2] = 0;
     HEAP32[$0 + 8 >> 2] = 0;
     HEAP32[$0 + 12 >> 2] = 0;
     return 0;
    }
    HEAP32[$0 + 4 >> 2] = $2;
    HEAP32[$0 >> 2] = $1;
    $2 = HEAP32[$0 + 8 >> 2];
   }
   $0 = $1 + $2 | 0;
  } else {
   $0 = 0
  }
  return $0;
 }
 
 function ogg_sync_wrote($0, $1) {
  var $2 = 0, $3 = 0;
  $2 = -1;
  $3 = HEAP32[$0 + 4 >> 2];
  label$1 : {
   if (($3 | 0) < 0) {
    break label$1
   }
   $1 = HEAP32[$0 + 8 >> 2] + $1 | 0;
   if (($1 | 0) > ($3 | 0)) {
    break label$1
   }
   HEAP32[$0 + 8 >> 2] = $1;
   $2 = 0;
  }
  return $2;
 }
 
 function ogg_sync_pageseek($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0;
  $9 = global$0 - 16 | 0;
  global$0 = $9;
  label$1 : {
   if (HEAP32[$0 + 4 >> 2] < 0) {
    break label$1
   }
   $4 = HEAP32[$0 + 12 >> 2];
   $10 = HEAP32[$0 + 8 >> 2] - $4 | 0;
   $2 = $4 + HEAP32[$0 >> 2] | 0;
   label$2 : {
    label$3 : {
     label$4 : {
      $5 = HEAP32[$0 + 20 >> 2];
      label$5 : {
       if (!$5) {
        if (($10 | 0) < 27) {
         break label$1
        }
        if ((HEAPU8[$2 | 0] | HEAPU8[$2 + 1 | 0] << 8 | (HEAPU8[$2 + 2 | 0] << 16 | HEAPU8[$2 + 3 | 0] << 24)) != 1399285583) {
         break label$5
        }
        $4 = HEAPU8[$2 + 26 | 0];
        $5 = $4 + 27 | 0;
        if (($10 | 0) < ($5 | 0)) {
         break label$1
        }
        if ($4) {
         $4 = HEAP32[$0 + 24 >> 2];
         while (1) {
          $4 = HEAPU8[($2 + $6 | 0) + 27 | 0] + $4 | 0;
          HEAP32[$0 + 24 >> 2] = $4;
          $6 = $6 + 1 | 0;
          if ($6 >>> 0 < HEAPU8[$2 + 26 | 0]) {
           continue
          }
          break;
         };
        }
        HEAP32[$0 + 20 >> 2] = $5;
       }
       if ((HEAP32[$0 + 24 >> 2] + $5 | 0) > ($10 | 0)) {
        break label$1
       }
       $7 = HEAPU8[$2 + 22 | 0] | HEAPU8[$2 + 23 | 0] << 8 | (HEAPU8[$2 + 24 | 0] << 16 | HEAPU8[$2 + 25 | 0] << 24);
       HEAP32[$9 + 12 >> 2] = $7;
       $6 = 0;
       HEAP8[$2 + 22 | 0] = 0;
       HEAP8[$2 + 23 | 0] = 0;
       HEAP8[$2 + 24 | 0] = 0;
       HEAP8[$2 + 25 | 0] = 0;
       $11 = HEAP32[$0 + 24 >> 2];
       $8 = HEAP32[$0 + 20 >> 2];
       HEAP8[$2 + 22 | 0] = 0;
       HEAP8[$2 + 23 | 0] = 0;
       HEAP8[$2 + 24 | 0] = 0;
       HEAP8[$2 + 25 | 0] = 0;
       if (($8 | 0) > 0) {
        $5 = 0;
        while (1) {
         $3 = HEAP32[((HEAPU8[$2 + $5 | 0] ^ $3 >>> 24) << 2) + 5376 >> 2] ^ $3 << 8;
         $5 = $5 + 1 | 0;
         if (($8 | 0) != ($5 | 0)) {
          continue
         }
         break;
        };
       }
       $4 = $2 + 22 | 0;
       if (($11 | 0) > 0) {
        $8 = $2 + $8 | 0;
        while (1) {
         $3 = HEAP32[((HEAPU8[$6 + $8 | 0] ^ $3 >>> 24) << 2) + 5376 >> 2] ^ $3 << 8;
         $6 = $6 + 1 | 0;
         if (($11 | 0) != ($6 | 0)) {
          continue
         }
         break;
        };
       }
       HEAP8[$2 + 22 | 0] = $3;
       HEAP8[$2 + 23 | 0] = $3 >>> 8;
       HEAP8[$2 + 24 | 0] = $3 >>> 16;
       HEAP8[$2 + 25 | 0] = $3 >>> 24;
       if (HEAP32[$9 + 12 >> 2] == (HEAPU8[$4 | 0] | HEAPU8[$4 + 1 | 0] << 8 | (HEAPU8[$4 + 2 | 0] << 16 | HEAPU8[$4 + 3 | 0] << 24))) {
        break label$4
       }
       HEAP8[$4 | 0] = $7;
       HEAP8[$4 + 1 | 0] = $7 >>> 8;
       HEAP8[$4 + 2 | 0] = $7 >>> 16;
       HEAP8[$4 + 3 | 0] = $7 >>> 24;
      }
      HEAP32[$0 + 20 >> 2] = 0;
      HEAP32[$0 + 24 >> 2] = 0;
      $3 = memchr($2 + 1 | 0, $10 + -1 | 0);
      if (!$3) {
       break label$3
      }
      $6 = HEAP32[$0 >> 2];
      break label$2;
     }
     $7 = HEAP32[$0 + 12 >> 2];
     label$13 : {
      if (!$1) {
       $5 = HEAP32[$0 + 24 >> 2];
       $3 = HEAP32[$0 + 20 >> 2];
       break label$13;
      }
      $4 = $7 + HEAP32[$0 >> 2] | 0;
      HEAP32[$1 >> 2] = $4;
      $3 = HEAP32[$0 + 20 >> 2];
      HEAP32[$1 + 4 >> 2] = $3;
      HEAP32[$1 + 8 >> 2] = $3 + $4;
      $5 = HEAP32[$0 + 24 >> 2];
      HEAP32[$1 + 12 >> 2] = $5;
     }
     HEAP32[$0 + 24 >> 2] = 0;
     HEAP32[$0 + 16 >> 2] = 0;
     HEAP32[$0 + 20 >> 2] = 0;
     $3 = $3 + $5 | 0;
     HEAP32[$0 + 12 >> 2] = $7 + $3;
     break label$1;
    }
    $6 = HEAP32[$0 >> 2];
    $3 = $6 + HEAP32[$0 + 8 >> 2] | 0;
   }
   HEAP32[$0 + 12 >> 2] = $3 - $6;
   $3 = $2 - $3 | 0;
  }
  global$0 = $9 + 16 | 0;
  return $3;
 }
 
 function ogg_sync_pageout($0, $1) {
  var $2 = 0;
  if (HEAP32[$0 + 4 >> 2] >= 0) {
   while (1) {
    $2 = ogg_sync_pageseek($0, $1);
    if (($2 | 0) > 0) {
     return 1
    }
    if (!$2) {
     return 0
    }
    if (HEAP32[$0 + 16 >> 2]) {
     continue
    }
    break;
   };
   HEAP32[$0 + 16 >> 2] = 1;
   $0 = -1;
  } else {
   $0 = 0
  }
  return $0;
 }
 
 function ogg_stream_pagein($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0;
  $4 = -1;
  folding_inner0 : {
   label$1 : {
    if (!$0) {
     break label$1
    }
    $6 = HEAP32[$0 >> 2];
    if (!$6) {
     break label$1
    }
    $3 = HEAP32[$1 >> 2];
    $10 = HEAPU8[$3 + 5 | 0];
    $5 = HEAP32[$1 + 12 >> 2];
    $11 = HEAP32[$1 + 8 >> 2];
    $8 = HEAPU8[$3 + 26 | 0];
    $13 = HEAPU8[$3 + 18 | 0] | HEAPU8[$3 + 19 | 0] << 8 | (HEAPU8[$3 + 20 | 0] << 16 | HEAPU8[$3 + 21 | 0] << 24);
    $9 = HEAPU8[$3 + 14 | 0] | HEAPU8[$3 + 15 | 0] << 8 | (HEAPU8[$3 + 16 | 0] << 16 | HEAPU8[$3 + 17 | 0] << 24);
    $14 = HEAPU8[$3 + 6 | 0] | HEAPU8[$3 + 7 | 0] << 8 | (HEAPU8[$3 + 8 | 0] << 16 | HEAPU8[$3 + 9 | 0] << 24);
    $15 = HEAPU8[$3 + 10 | 0] | HEAPU8[$3 + 11 | 0] << 8 | (HEAPU8[$3 + 12 | 0] << 16 | HEAPU8[$3 + 13 | 0] << 24);
    $12 = HEAPU8[$3 + 4 | 0];
    $2 = HEAP32[$0 + 36 >> 2];
    $1 = HEAP32[$0 + 12 >> 2];
    if ($1) {
     $7 = HEAP32[$0 + 8 >> 2] - $1 | 0;
     HEAP32[$0 + 8 >> 2] = $7;
     if ($7) {
      memmove($6, $1 + $6 | 0, $7)
     }
     HEAP32[$0 + 12 >> 2] = 0;
    }
    if ($2) {
     $1 = $0;
     $6 = HEAP32[$0 + 28 >> 2] - $2 | 0;
     if ($6) {
      $7 = HEAP32[$0 + 16 >> 2];
      memmove($7, $7 + ($2 << 2) | 0, $6 << 2);
      $6 = HEAP32[$0 + 20 >> 2];
      memmove($6, $6 + ($2 << 3) | 0, HEAP32[$0 + 28 >> 2] - $2 << 3);
      $7 = HEAP32[$0 + 28 >> 2] - $2 | 0;
     } else {
      $7 = 0
     }
     HEAP32[$1 + 28 >> 2] = $7;
     HEAP32[$0 + 36 >> 2] = 0;
     HEAP32[$0 + 32 >> 2] = HEAP32[$0 + 32 >> 2] - $2;
    }
    if (($9 | 0) != HEAP32[$0 + 336 >> 2] | $12) {
     break label$1
    }
    if (_os_lacing_expand($0, $8 + 1 | 0)) {
     break label$1
    }
    $7 = $10 & 1;
    $6 = HEAP32[$0 + 340 >> 2];
    label$7 : {
     if (($6 | 0) == ($13 | 0)) {
      break label$7
     }
     $2 = HEAP32[$0 + 32 >> 2];
     $9 = HEAP32[$0 + 28 >> 2];
     if (($2 | 0) < ($9 | 0)) {
      $4 = HEAP32[$0 + 8 >> 2];
      $12 = HEAP32[$0 + 16 >> 2];
      $1 = $2;
      while (1) {
       $4 = $4 - HEAPU8[$12 + ($1 << 2) | 0] | 0;
       $1 = $1 + 1 | 0;
       if (($1 | 0) < ($9 | 0)) {
        continue
       }
       break;
      };
      HEAP32[$0 + 8 >> 2] = $4;
     }
     HEAP32[$0 + 28 >> 2] = $2;
     if (($6 | 0) == -1) {
      break label$7
     }
     $1 = $2 + 1 | 0;
     HEAP32[$0 + 28 >> 2] = $1;
     HEAP32[HEAP32[$0 + 16 >> 2] + ($2 << 2) >> 2] = 1024;
     HEAP32[$0 + 32 >> 2] = $1;
    }
    $6 = $10 & 2;
    $4 = 0;
    label$10 : {
     if (!$7) {
      break label$10
     }
     $1 = HEAP32[$0 + 28 >> 2];
     if (HEAP32[(HEAP32[$0 + 16 >> 2] + ($1 << 2) | 0) + -4 >> 2] != 1024 ? ($1 | 0) >= 1 : 0) {
      break label$10
     }
     $6 = 0;
     if (!$8) {
      break label$10
     }
     $1 = 0;
     while (1) {
      $4 = $1 + 1 | 0;
      $1 = HEAPU8[($1 + $3 | 0) + 27 | 0];
      $5 = $5 - $1 | 0;
      $11 = $1 + $11 | 0;
      if (($1 | 0) != 255) {
       break label$10
      }
      $1 = $4;
      if (($8 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     $4 = $8;
    }
    if ($5) {
     $2 = HEAP32[$0 + 4 >> 2];
     $1 = HEAP32[$0 + 8 >> 2];
     label$15 : {
      if (($2 - $5 | 0) > ($1 | 0)) {
       $2 = HEAP32[$0 >> 2];
       break label$15;
      }
      if (($2 | 0) > (2147483647 - $5 | 0)) {
       break folding_inner0
      }
      $1 = $2 + $5 | 0;
      $1 = ($1 | 0) < 2147482623 ? $1 + 1024 | 0 : $1;
      $2 = dlrealloc(HEAP32[$0 >> 2], $1);
      if (!$2) {
       break folding_inner0
      }
      HEAP32[$0 >> 2] = $2;
      HEAP32[$0 + 4 >> 2] = $1;
      $1 = HEAP32[$0 + 8 >> 2];
     }
     memcpy($1 + $2 | 0, $11, $5);
     HEAP32[$0 + 8 >> 2] = HEAP32[$0 + 8 >> 2] + $5;
    }
    $11 = $10 & 4;
    label$25 : {
     if (($4 | 0) >= ($8 | 0)) {
      break label$25
     }
     $10 = HEAP32[$0 + 20 >> 2];
     $7 = HEAP32[$0 + 16 >> 2];
     $2 = HEAP32[$0 + 28 >> 2];
     $1 = $7 + ($2 << 2) | 0;
     $5 = HEAPU8[($3 + $4 | 0) + 27 | 0];
     HEAP32[$1 >> 2] = $5;
     $9 = $10 + ($2 << 3) | 0;
     HEAP32[$9 >> 2] = -1;
     HEAP32[$9 + 4 >> 2] = -1;
     if ($6) {
      HEAP32[$1 >> 2] = $5 | 256
     }
     $1 = $2 + 1 | 0;
     HEAP32[$0 + 28 >> 2] = $1;
     $4 = $4 + 1 | 0;
     label$27 : {
      if (($5 | 0) == 255) {
       $2 = -1;
       break label$27;
      }
      HEAP32[$0 + 32 >> 2] = $1;
     }
     if (($4 | 0) != ($8 | 0)) {
      while (1) {
       $6 = HEAPU8[($3 + $4 | 0) + 27 | 0];
       HEAP32[$7 + ($1 << 2) >> 2] = $6;
       $5 = $10 + ($1 << 3) | 0;
       HEAP32[$5 >> 2] = -1;
       HEAP32[$5 + 4 >> 2] = -1;
       $5 = $1 + 1 | 0;
       HEAP32[$0 + 28 >> 2] = $5;
       $4 = $4 + 1 | 0;
       if (($6 | 0) != 255) {
        HEAP32[$0 + 32 >> 2] = $5;
        $2 = $1;
       }
       $1 = $5;
       if (($4 | 0) != ($8 | 0)) {
        continue
       }
       break;
      }
     }
     if (($2 | 0) == -1) {
      break label$25
     }
     $1 = HEAP32[$0 + 20 >> 2] + ($2 << 3) | 0;
     HEAP32[$1 >> 2] = $14;
     HEAP32[$1 + 4 >> 2] = $15;
    }
    label$32 : {
     if (!$11) {
      break label$32
     }
     HEAP32[$0 + 328 >> 2] = 1;
     $1 = HEAP32[$0 + 28 >> 2];
     if (($1 | 0) < 1) {
      break label$32
     }
     $1 = (HEAP32[$0 + 16 >> 2] + ($1 << 2) | 0) + -4 | 0;
     HEAP32[$1 >> 2] = HEAP32[$1 >> 2] | 512;
    }
    HEAP32[$0 + 340 >> 2] = $13 + 1;
    $4 = 0;
   }
   return $4;
  }
  $1 = HEAP32[$0 >> 2];
  if ($1) {
   dlfree($1)
  }
  $1 = HEAP32[$0 + 16 >> 2];
  if ($1) {
   dlfree($1)
  }
  $1 = HEAP32[$0 + 20 >> 2];
  if ($1) {
   dlfree($1)
  }
  memset($0, 360);
  return -1;
 }
 
 function ogg_sync_reset($0) {
  if (HEAP32[$0 + 4 >> 2] < 0) {
   return
  }
  HEAP32[$0 + 8 >> 2] = 0;
  HEAP32[$0 + 12 >> 2] = 0;
  HEAP32[$0 + 24 >> 2] = 0;
  HEAP32[$0 + 16 >> 2] = 0;
  HEAP32[$0 + 20 >> 2] = 0;
 }
 
 function ogg_stream_reset($0) {
  if (!$0 | !HEAP32[$0 >> 2]) {
   $0 = -1
  } else {
   HEAP32[$0 + 344 >> 2] = 0;
   HEAP32[$0 + 348 >> 2] = 0;
   HEAP32[$0 + 340 >> 2] = -1;
   HEAP32[$0 + 332 >> 2] = 0;
   HEAP32[$0 + 324 >> 2] = 0;
   HEAP32[$0 + 328 >> 2] = 0;
   HEAP32[$0 + 36 >> 2] = 0;
   HEAP32[$0 + 28 >> 2] = 0;
   HEAP32[$0 + 32 >> 2] = 0;
   HEAP32[$0 + 8 >> 2] = 0;
   HEAP32[$0 + 12 >> 2] = 0;
   HEAP32[$0 + 352 >> 2] = 0;
   HEAP32[$0 + 356 >> 2] = 0;
   $0 = 0;
  }
 }
 
 function ogg_stream_packetout($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
  label$1 : {
   if (!$0) {
    break label$1
   }
   $8 = HEAP32[$0 >> 2];
   if (!$8) {
    break label$1
   }
   $5 = HEAP32[$0 + 36 >> 2];
   if (HEAP32[$0 + 32 >> 2] <= ($5 | 0)) {
    break label$1
   }
   $3 = HEAP32[$0 + 16 >> 2];
   $6 = HEAP32[$3 + ($5 << 2) >> 2];
   if ($6 & 1024) {
    HEAP32[$0 + 36 >> 2] = $5 + 1;
    $1 = $0;
    $3 = $0;
    $2 = HEAP32[$0 + 348 >> 2];
    $0 = HEAP32[$0 + 344 >> 2] + 1 | 0;
    if ($0 >>> 0 < 1) {
     $2 = $2 + 1 | 0
    }
    HEAP32[$3 + 344 >> 2] = $0;
    HEAP32[$1 + 348 >> 2] = $2;
    return -1;
   }
   $4 = $6 & 512;
   $7 = 255;
   $2 = $6 & 255;
   label$3 : {
    if (($2 | 0) != 255) {
     $7 = $2;
     break label$3;
    }
    while (1) {
     $5 = $5 + 1 | 0;
     $2 = HEAP32[($5 << 2) + $3 >> 2];
     $4 = $2 & 512 ? 512 : $4;
     $2 = $2 & 255;
     $7 = $2 + $7 | 0;
     if (($2 | 0) == 255) {
      continue
     }
     break;
    };
   }
   label$6 : {
    if (!$1) {
     $4 = HEAP32[$0 + 344 >> 2];
     $2 = HEAP32[$0 + 348 >> 2];
     $6 = HEAP32[$0 + 12 >> 2];
     break label$6;
    }
    HEAP32[$1 + 8 >> 2] = $6 & 256;
    HEAP32[$1 + 12 >> 2] = $4;
    $6 = HEAP32[$0 + 12 >> 2];
    HEAP32[$1 >> 2] = $8 + $6;
    $3 = HEAP32[$0 + 348 >> 2];
    $2 = $3;
    $4 = HEAP32[$0 + 344 >> 2];
    HEAP32[$1 + 24 >> 2] = $4;
    HEAP32[$1 + 28 >> 2] = $2;
    $3 = HEAP32[$0 + 20 >> 2] + ($5 << 3) | 0;
    $8 = HEAP32[$3 + 4 >> 2];
    $3 = HEAP32[$3 >> 2];
    HEAP32[$1 + 4 >> 2] = $7;
    HEAP32[$1 + 16 >> 2] = $3;
    HEAP32[$1 + 20 >> 2] = $8;
   }
   $3 = $4 + 1 | 0;
   if ($3 >>> 0 < 1) {
    $2 = $2 + 1 | 0
   }
   HEAP32[$0 + 344 >> 2] = $3;
   HEAP32[$0 + 348 >> 2] = $2;
   $4 = 1;
   HEAP32[$0 + 36 >> 2] = $5 + 1;
   HEAP32[$0 + 12 >> 2] = $6 + $7;
  }
  return $4;
 }
 
 function qsort($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0;
  $2 = global$0 - 208 | 0;
  global$0 = $2;
  HEAP32[$2 + 8 >> 2] = 1;
  HEAP32[$2 + 12 >> 2] = 0;
  label$1 : {
   $5 = Math_imul($1, 24);
   if (!$5) {
    break label$1
   }
   HEAP32[$2 + 16 >> 2] = 24;
   HEAP32[$2 + 20 >> 2] = 24;
   $1 = 24;
   $4 = $1;
   $3 = 2;
   while (1) {
    $6 = $4 + 24 | 0;
    $4 = $1;
    $1 = $1 + $6 | 0;
    HEAP32[($2 + 16 | 0) + ($3 << 2) >> 2] = $1;
    $3 = $3 + 1 | 0;
    if ($1 >>> 0 < $5 >>> 0) {
     continue
    }
    break;
   };
   $4 = ($0 + $5 | 0) + -24 | 0;
   label$3 : {
    if ($4 >>> 0 <= $0 >>> 0) {
     $3 = 1;
     $1 = 1;
     break label$3;
    }
    $3 = 1;
    $1 = 1;
    while (1) {
     label$6 : {
      if (($3 & 3) == 3) {
       sift($0, $1, $2 + 16 | 0);
       shr($2 + 8 | 0, 2);
       $1 = $1 + 2 | 0;
       break label$6;
      }
      $3 = $1 + -1 | 0;
      label$8 : {
       if (HEAPU32[($2 + 16 | 0) + ($3 << 2) >> 2] >= $4 - $0 >>> 0) {
        trinkle($0, $2 + 8 | 0, $1, 0, $2 + 16 | 0);
        break label$8;
       }
       sift($0, $1, $2 + 16 | 0);
      }
      if (($1 | 0) == 1) {
       shl($2 + 8 | 0, 1);
       $1 = 0;
       break label$6;
      }
      shl($2 + 8 | 0, $3);
      $1 = 1;
     }
     $3 = HEAP32[$2 + 8 >> 2] | 1;
     HEAP32[$2 + 8 >> 2] = $3;
     $0 = $0 + 24 | 0;
     if ($0 >>> 0 < $4 >>> 0) {
      continue
     }
     break;
    };
   }
   trinkle($0, $2 + 8 | 0, $1, 0, $2 + 16 | 0);
   while (1) {
    label$12 : {
     label$13 : {
      label$14 : {
       if (!(($1 | 0) != 1 | ($3 | 0) != 1)) {
        if (HEAP32[$2 + 12 >> 2]) {
         break label$14
        }
        break label$1;
       }
       if (($1 | 0) > 1) {
        break label$13
       }
      }
      $4 = pntz($2 + 8 | 0);
      shr($2 + 8 | 0, $4);
      $3 = HEAP32[$2 + 8 >> 2];
      $1 = $1 + $4 | 0;
      break label$12;
     }
     shl($2 + 8 | 0, 2);
     HEAP32[$2 + 8 >> 2] = HEAP32[$2 + 8 >> 2] ^ 7;
     shr($2 + 8 | 0, 1);
     $5 = $0 + -24 | 0;
     $4 = $1 + -2 | 0;
     trinkle($5 - HEAP32[($2 + 16 | 0) + ($4 << 2) >> 2] | 0, $2 + 8 | 0, $1 + -1 | 0, 1, $2 + 16 | 0);
     shl($2 + 8 | 0, 1);
     $3 = HEAP32[$2 + 8 >> 2] | 1;
     HEAP32[$2 + 8 >> 2] = $3;
     trinkle($5, $2 + 8 | 0, $4, 1, $2 + 16 | 0);
     $1 = $4;
    }
    $0 = $0 + -24 | 0;
    continue;
   };
  }
  global$0 = $2 + 208 | 0;
 }
 
 function sift($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
  $3 = global$0 - 240 | 0;
  global$0 = $3;
  HEAP32[$3 >> 2] = $0;
  $6 = 1;
  label$1 : {
   if (($1 | 0) < 2) {
    break label$1
   }
   $4 = $0;
   while (1) {
    $5 = $4 + -24 | 0;
    $7 = $1 + -2 | 0;
    $4 = $5 - HEAP32[($7 << 2) + $2 >> 2] | 0;
    if ((FUNCTION_TABLE[1]($0, $4) | 0) >= 0) {
     if ((FUNCTION_TABLE[1]($0, $5) | 0) > -1) {
      break label$1
     }
    }
    $0 = ($6 << 2) + $3 | 0;
    label$4 : {
     if ((FUNCTION_TABLE[1]($4, $5) | 0) >= 0) {
      HEAP32[$0 >> 2] = $4;
      $7 = $1 + -1 | 0;
      break label$4;
     }
     HEAP32[$0 >> 2] = $5;
     $4 = $5;
    }
    $6 = $6 + 1 | 0;
    if (($7 | 0) < 2) {
     break label$1
    }
    $0 = HEAP32[$3 >> 2];
    $1 = $7;
    continue;
   };
  }
  cycle($3, $6);
  global$0 = $3 + 240 | 0;
 }
 
 function shr($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0;
  $4 = $0;
  label$1 : {
   if ($1 >>> 0 <= 31) {
    $2 = HEAP32[$0 >> 2];
    $3 = HEAP32[$0 + 4 >> 2];
    break label$1;
   }
   $2 = HEAP32[$0 + 4 >> 2];
   HEAP32[$0 + 4 >> 2] = 0;
   HEAP32[$0 >> 2] = $2;
   $1 = $1 + -32 | 0;
   $3 = 0;
  }
  HEAP32[$4 + 4 >> 2] = $3 >>> $1;
  HEAP32[$0 >> 2] = $3 << 32 - $1 | $2 >>> $1;
 }
 
 function trinkle($0, $1, $2, $3, $4) {
  var $5 = 0, $6 = 0, $7 = 0, $8 = 0;
  $5 = global$0 - 240 | 0;
  global$0 = $5;
  $6 = HEAP32[$1 >> 2];
  HEAP32[$5 + 232 >> 2] = $6;
  $1 = HEAP32[$1 + 4 >> 2];
  HEAP32[$5 >> 2] = $0;
  HEAP32[$5 + 236 >> 2] = $1;
  $7 = 1;
  label$1 : {
   label$2 : {
    label$3 : {
     label$4 : {
      if ($1 ? 0 : ($6 | 0) == 1) {
       break label$4
      }
      $6 = $0 - HEAP32[($2 << 2) + $4 >> 2] | 0;
      if ((FUNCTION_TABLE[1]($6, $0) | 0) < 1) {
       break label$4
      }
      $8 = !$3;
      while (1) {
       label$6 : {
        $1 = $6;
        if (!(!$8 | ($2 | 0) < 2)) {
         $3 = HEAP32[(($2 << 2) + $4 | 0) + -8 >> 2];
         $6 = $0 + -24 | 0;
         if ((FUNCTION_TABLE[1]($6, $1) | 0) > -1) {
          break label$6
         }
         if ((FUNCTION_TABLE[1]($6 - $3 | 0, $1) | 0) > -1) {
          break label$6
         }
        }
        HEAP32[($7 << 2) + $5 >> 2] = $1;
        $0 = pntz($5 + 232 | 0);
        shr($5 + 232 | 0, $0);
        $7 = $7 + 1 | 0;
        $2 = $0 + $2 | 0;
        if (HEAP32[$5 + 236 >> 2] ? 0 : HEAP32[$5 + 232 >> 2] == 1) {
         break label$2
        }
        $3 = 0;
        $8 = 1;
        $0 = $1;
        $6 = $1 - HEAP32[($2 << 2) + $4 >> 2] | 0;
        if ((FUNCTION_TABLE[1]($6, HEAP32[$5 >> 2]) | 0) > 0) {
         continue
        }
        break label$3;
       }
       break;
      };
      $1 = $0;
      break label$2;
     }
     $1 = $0;
    }
    if ($3) {
     break label$1
    }
   }
   cycle($5, $7);
   sift($1, $2, $4);
  }
  global$0 = $5 + 240 | 0;
 }
 
 function shl($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0;
  $4 = $0;
  label$1 : {
   if ($1 >>> 0 <= 31) {
    $2 = HEAP32[$0 + 4 >> 2];
    $3 = HEAP32[$0 >> 2];
    break label$1;
   }
   $2 = HEAP32[$0 >> 2];
   HEAP32[$0 + 4 >> 2] = $2;
   HEAP32[$0 >> 2] = 0;
   $1 = $1 + -32 | 0;
   $3 = 0;
  }
  HEAP32[$4 >> 2] = $3 << $1;
  HEAP32[$0 + 4 >> 2] = $2 << $1 | $3 >>> 32 - $1;
 }
 
 function pntz($0) {
  var $1 = 0;
  $1 = __wasm_ctz_i32(HEAP32[$0 >> 2] + -1 | 0);
  if (!$1) {
   $0 = __wasm_ctz_i32(HEAP32[$0 + 4 >> 2]);
   return $0 ? $0 + 32 | 0 : 0;
  }
  return $1;
 }
 
 function cycle($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
  $3 = 24;
  $4 = global$0 - 256 | 0;
  global$0 = $4;
  label$1 : {
   if (($1 | 0) < 2) {
    break label$1
   }
   $7 = ($1 << 2) + $0 | 0;
   HEAP32[$7 >> 2] = $4;
   $2 = $4;
   while (1) {
    $5 = $3 >>> 0 < 256 ? $3 : 256;
    memcpy($2, HEAP32[$0 >> 2], $5);
    $2 = 0;
    while (1) {
     $6 = ($2 << 2) + $0 | 0;
     $2 = $2 + 1 | 0;
     memcpy(HEAP32[$6 >> 2], HEAP32[($2 << 2) + $0 >> 2], $5);
     HEAP32[$6 >> 2] = HEAP32[$6 >> 2] + $5;
     if (($1 | 0) != ($2 | 0)) {
      continue
     }
     break;
    };
    $3 = $3 - $5 | 0;
    if (!$3) {
     break label$1
    }
    $2 = HEAP32[$7 >> 2];
    continue;
   };
  }
  global$0 = $4 + 256 | 0;
 }
 
 function FLAC__format_sample_rate_is_subset($0) {
  if ($0 + -1 >>> 0 <= 655349) {
   return !(($0 >>> 0) % 10) | (!(($0 >>> 0) % 1e3) | $0 >>> 0 < 65536)
  }
  return 0;
 }
 
 function FLAC__format_seektable_is_legal($0) {
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
  $3 = HEAP32[$0 >> 2];
  if (!$3) {
   return 1
  }
  $5 = HEAP32[$0 + 4 >> 2];
  $0 = 0;
  while (1) {
   $6 = $2;
   $4 = $1;
   $1 = Math_imul($0, 24) + $5 | 0;
   $2 = HEAP32[$1 >> 2];
   $1 = HEAP32[$1 + 4 >> 2];
   if (!(!$7 | ($2 | 0) == -1 & ($1 | 0) == -1 | (($1 | 0) == ($4 | 0) & $2 >>> 0 > $6 >>> 0 | $1 >>> 0 > $4 >>> 0))) {
    return 0
   }
   $7 = 1;
   $0 = $0 + 1 | 0;
   if ($0 >>> 0 < $3 >>> 0) {
    continue
   }
   break;
  };
  return 1;
 }
 
 function FLAC__format_seektable_sort($0) {
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
  label$1 : {
   $2 = HEAP32[$0 >> 2];
   if (!$2) {
    break label$1
   }
   qsort(HEAP32[$0 + 4 >> 2], $2);
   if (!HEAP32[$0 >> 2]) {
    break label$1
   }
   $2 = 1;
   $1 = HEAP32[$0 >> 2];
   if ($1 >>> 0 > 1) {
    $6 = 1;
    while (1) {
     $4 = HEAP32[$0 + 4 >> 2];
     $3 = $4 + Math_imul($6, 24) | 0;
     $5 = HEAP32[$3 >> 2];
     $7 = HEAP32[$3 + 4 >> 2];
     $8 = $7;
     label$4 : {
      if (($5 | 0) != -1 | ($7 | 0) != -1) {
       $7 = $5;
       $5 = ($4 + Math_imul($2, 24) | 0) + -24 | 0;
       if (($7 | 0) == HEAP32[$5 >> 2] & HEAP32[$5 + 4 >> 2] == ($8 | 0)) {
        break label$4
       }
      }
      $5 = HEAP32[$3 + 4 >> 2];
      $1 = $4 + Math_imul($2, 24) | 0;
      HEAP32[$1 >> 2] = HEAP32[$3 >> 2];
      HEAP32[$1 + 4 >> 2] = $5;
      $4 = HEAP32[$3 + 20 >> 2];
      HEAP32[$1 + 16 >> 2] = HEAP32[$3 + 16 >> 2];
      HEAP32[$1 + 20 >> 2] = $4;
      $4 = HEAP32[$3 + 12 >> 2];
      HEAP32[$1 + 8 >> 2] = HEAP32[$3 + 8 >> 2];
      HEAP32[$1 + 12 >> 2] = $4;
      $2 = $2 + 1 | 0;
      $1 = HEAP32[$0 >> 2];
     }
     $6 = $6 + 1 | 0;
     if ($6 >>> 0 < $1 >>> 0) {
      continue
     }
     break;
    };
   }
   if ($2 >>> 0 >= $1 >>> 0) {
    break label$1
   }
   $3 = HEAP32[$0 + 4 >> 2];
   while (1) {
    $0 = $3 + Math_imul($2, 24) | 0;
    HEAP32[$0 + 16 >> 2] = 0;
    HEAP32[$0 + 8 >> 2] = 0;
    HEAP32[$0 + 12 >> 2] = 0;
    HEAP32[$0 >> 2] = -1;
    HEAP32[$0 + 4 >> 2] = -1;
    $2 = $2 + 1 | 0;
    if (($1 | 0) != ($2 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function seekpoint_compare_($0, $1) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  var $2 = 0, $3 = 0;
  $2 = HEAP32[$0 + 4 >> 2];
  $3 = HEAP32[$1 + 4 >> 2];
  $0 = HEAP32[$0 >> 2];
  $1 = HEAP32[$1 >> 2];
  return (($0 | 0) == ($1 | 0) & ($2 | 0) == ($3 | 0) ? 0 : ($2 | 0) == ($3 | 0) & $0 >>> 0 < $1 >>> 0 | $2 >>> 0 < $3 >>> 0 ? -1 : 1) | 0;
 }
 
 function utf8len_($0) {
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0;
  $2 = 1;
  label$1 : {
   $1 = HEAPU8[$0 | 0];
   label$2 : {
    if (!($1 & 128)) {
     break label$2
    }
    if (!(($1 & 224) != 192 | (HEAPU8[$0 + 1 | 0] & 192) != 128)) {
     return (($1 & 254) != 192) << 1
    }
    label$4 : {
     if (($1 & 240) != 224) {
      break label$4
     }
     $3 = HEAPU8[$0 + 1 | 0];
     if (($3 & 192) != 128) {
      break label$4
     }
     $4 = HEAPU8[$0 + 2 | 0];
     if (($4 & 192) != 128) {
      break label$4
     }
     $2 = 0;
     if (($3 & 224) == 128 ? ($1 | 0) == 224 : 0) {
      break label$2
     }
     label$5 : {
      label$6 : {
       switch ($1 + -237 | 0) {
       case 0:
        if (($3 & 224) != 160) {
         break label$5
        }
        break label$2;
       case 2:
        break label$6;
       default:
        break label$5;
       };
      }
      if (($3 | 0) != 191) {
       break label$5
      }
      if (($4 & 254) == 190) {
       break label$2
      }
     }
     return 3;
    }
    label$8 : {
     if (($1 & 248) != 240) {
      break label$8
     }
     $2 = HEAPU8[$0 + 1 | 0];
     if (($2 & 192) != 128 | (HEAPU8[$0 + 2 | 0] & 192) != 128) {
      break label$8
     }
     if ((HEAPU8[$0 + 3 | 0] & 192) == 128) {
      break label$1
     }
    }
    label$9 : {
     if (($1 & 252) != 248) {
      break label$9
     }
     $2 = HEAPU8[$0 + 1 | 0];
     if (($2 & 192) != 128 | (HEAPU8[$0 + 2 | 0] & 192) != 128 | ((HEAPU8[$0 + 3 | 0] & 192) != 128 | (HEAPU8[$0 + 4 | 0] & 192) != 128)) {
      break label$9
     }
     return ($1 | 0) == 248 ? (($2 & 248) == 128 ? 0 : 5) : 5;
    }
    $2 = 0;
    if (($1 & 254) != 252) {
     break label$2
    }
    $3 = HEAPU8[$0 + 1 | 0];
    if (($3 & 192) != 128 | (HEAPU8[$0 + 2 | 0] & 192) != 128 | ((HEAPU8[$0 + 3 | 0] & 192) != 128 | (HEAPU8[$0 + 4 | 0] & 192) != 128)) {
     break label$2
    }
    if ((HEAPU8[$0 + 5 | 0] & 192) != 128) {
     break label$2
    }
    $2 = ($1 | 0) == 252 ? (($3 & 252) == 128 ? 0 : 6) : 6;
   }
   return $2;
  }
  return ($1 | 0) == 240 ? (($2 & 240) != 128) << 2 : 4;
 }
 
 function FLAC__format_cuesheet_is_legal($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
  label$1 : {
   label$2 : {
    label$3 : {
     label$4 : {
      label$5 : {
       label$6 : {
        label$7 : {
         label$8 : {
          label$9 : {
           if ($1) {
            $1 = HEAP32[$0 + 140 >> 2];
            $3 = $1;
            $2 = HEAP32[$0 + 136 >> 2];
            if (!$1 & $2 >>> 0 <= 88199 | $1 >>> 0 < 0) {
             $0 = 0;
             break label$1;
            }
            if (!(__wasm_i64_urem($2, $3) | i64toi32_i32$HIGH_BITS)) {
             break label$9
            }
            $0 = 0;
            break label$1;
           }
           $2 = HEAP32[$0 + 148 >> 2];
           if ($2) {
            break label$8
           }
           break label$2;
          }
          $3 = HEAP32[$0 + 148 >> 2];
          if (!$3) {
           break label$2
          }
          if (HEAPU8[(HEAP32[$0 + 152 >> 2] + ($3 << 5) | 0) + -24 | 0] == 170) {
           break label$7
          }
          $0 = 0;
          break label$1;
         }
         $4 = $2 + -1 | 0;
         $6 = HEAP32[$0 + 152 >> 2];
         $1 = 0;
         while (1) {
          $0 = $6 + ($1 << 5) | 0;
          if (!HEAPU8[$0 + 8 | 0]) {
           break label$3
          }
          $3 = HEAPU8[$0 + 23 | 0];
          label$13 : {
           label$14 : {
            if ($1 >>> 0 < $4 >>> 0) {
             if (!$3) {
              break label$4
             }
             if (HEAPU8[HEAP32[$0 + 24 >> 2] + 8 | 0] > 1) {
              break label$5
             }
             break label$14;
            }
            if (!$3) {
             break label$13
            }
           }
           $7 = $0 + 24 | 0;
           $0 = 0;
           while (1) {
            if ($0) {
             $5 = HEAP32[$7 >> 2] + ($0 << 4) | 0;
             if ((HEAPU8[$5 + -8 | 0] + 1 | 0) != HEAPU8[$5 + 8 | 0]) {
              break label$6
             }
            }
            $0 = $0 + 1 | 0;
            if ($0 >>> 0 < $3 >>> 0) {
             continue
            }
            break;
           };
          }
          $0 = 1;
          $1 = $1 + 1 | 0;
          if (($2 | 0) != ($1 | 0)) {
           continue
          }
          break;
         };
         break label$1;
        }
        $6 = $3 + -1 | 0;
        $7 = HEAP32[$0 + 152 >> 2];
        $1 = 0;
        while (1) {
         $0 = $7 + ($1 << 5) | 0;
         $2 = HEAPU8[$0 + 8 | 0];
         if (!$2) {
          break label$3
         }
         if (!(($2 | 0) == 170 | $2 >>> 0 < 100)) {
          $0 = 0;
          break label$1;
         }
         if (__wasm_i64_urem(HEAP32[$0 >> 2], HEAP32[$0 + 4 >> 2]) | i64toi32_i32$HIGH_BITS) {
          $0 = 0;
          break label$1;
         }
         $2 = HEAPU8[$0 + 23 | 0];
         label$22 : {
          label$23 : {
           label$24 : {
            if ($1 >>> 0 < $6 >>> 0) {
             if (!$2) {
              break label$4
             }
             if (HEAPU8[HEAP32[$0 + 24 >> 2] + 8 | 0] < 2) {
              break label$24
             }
             break label$5;
            }
            if (!$2) {
             break label$23
            }
           }
           $5 = HEAP32[$0 + 24 >> 2];
           $0 = 0;
           while (1) {
            $4 = $5 + ($0 << 4) | 0;
            if (__wasm_i64_urem(HEAP32[$4 >> 2], HEAP32[$4 + 4 >> 2]) | i64toi32_i32$HIGH_BITS) {
             break label$22
            }
            if (HEAPU8[$4 + 8 | 0] != (HEAPU8[$4 + -8 | 0] + 1 | 0) ? $0 : 0) {
             break label$6
            }
            $0 = $0 + 1 | 0;
            if ($0 >>> 0 < $2 >>> 0) {
             continue
            }
            break;
           };
          }
          $0 = 1;
          $1 = $1 + 1 | 0;
          if (($3 | 0) != ($1 | 0)) {
           continue
          }
          break label$1;
         }
         break;
        };
        $0 = 0;
        break label$1;
       }
       $0 = 0;
       break label$1;
      }
      $0 = 0;
      break label$1;
     }
     $0 = 0;
     break label$1;
    }
    $0 = 0;
    break label$1;
   }
   $0 = 0;
  }
  return $0;
 }
 
 function FLAC__format_picture_is_legal($0) {
  var $1 = 0, $2 = 0;
  label$1 : {
   label$2 : {
    $2 = HEAP32[$0 + 4 >> 2];
    $1 = HEAPU8[$2 | 0];
    if (!$1) {
     break label$2
    }
    while (1) {
     if (($1 + -32 & 255) >>> 0 < 95) {
      $2 = $2 + 1 | 0;
      $1 = HEAPU8[$2 | 0];
      if ($1) {
       continue
      }
      break label$2;
     }
     break;
    };
    $2 = 0;
    break label$1;
   }
   $2 = 1;
   $1 = HEAP32[$0 + 8 >> 2];
   if (!HEAPU8[$1 | 0]) {
    break label$1
   }
   while (1) {
    $0 = utf8len_($1);
    if (!$0) {
     $2 = 0;
     break label$1;
    }
    $1 = $0 + $1 | 0;
    if (HEAPU8[$1 | 0]) {
     continue
    }
    break;
   };
  }
  return $2;
 }
 
 function FLAC__format_get_max_rice_partition_order_from_blocksize_limited_max_and_predictor_order($0, $1, $2) {
  var $3 = 0;
  while (1) {
   $3 = $0;
   if ($3) {
    $0 = $3 + -1 | 0;
    if ($1 >>> $3 >>> 0 <= $2 >>> 0) {
     continue
    }
   }
   break;
  };
  return $3;
 }
 
 function FLAC__format_get_max_rice_partition_order_from_blocksize($0) {
  var $1 = 0, $2 = 0;
  label$1 : {
   if (!($0 & 1)) {
    while (1) {
     $1 = $1 + 1 | 0;
     $2 = $0 & 2;
     $0 = $0 >>> 1 | 0;
     if (!$2) {
      continue
     }
     break;
    };
    $0 = 15;
    if ($1 >>> 0 > 14) {
     break label$1
    }
   }
   $0 = $1;
  }
  return $0;
 }
 
 function FLAC__format_entropy_coding_method_partitioned_rice_contents_init($0) {
  HEAP32[$0 + 8 >> 2] = 0;
  HEAP32[$0 >> 2] = 0;
  HEAP32[$0 + 4 >> 2] = 0;
 }
 
 function FLAC__format_entropy_coding_method_partitioned_rice_contents_clear($0) {
  var $1 = 0;
  $1 = HEAP32[$0 >> 2];
  if ($1) {
   dlfree($1)
  }
  $1 = HEAP32[$0 + 4 >> 2];
  if ($1) {
   dlfree($1)
  }
  HEAP32[$0 + 8 >> 2] = 0;
  HEAP32[$0 >> 2] = 0;
  HEAP32[$0 + 4 >> 2] = 0;
 }
 
 function FLAC__format_entropy_coding_method_partitioned_rice_contents_ensure_size($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0;
  $3 = 1;
  label$1 : {
   if (HEAPU32[$0 + 8 >> 2] >= $1 >>> 0) {
    break label$1
   }
   $3 = HEAP32[$0 >> 2];
   $4 = 4 << $1;
   $2 = dlrealloc($3, $4);
   if (!($2 | $1 >>> 0 > 29)) {
    dlfree($3)
   }
   HEAP32[$0 >> 2] = $2;
   $3 = 0;
   if (!$2) {
    break label$1
   }
   $5 = HEAP32[$0 + 4 >> 2];
   $2 = dlrealloc($5, $4);
   if (!($2 | $1 >>> 0 > 29)) {
    dlfree($5)
   }
   HEAP32[$0 + 4 >> 2] = $2;
   if (!$2) {
    break label$1
   }
   memset($2, $4);
   HEAP32[$0 + 8 >> 2] = $1;
   $3 = 1;
  }
  return $3;
 }
 
 function FLAC__ogg_encoder_aspect_init($0) {
  if (ogg_stream_init($0 + 8 | 0, HEAP32[$0 >> 2])) {
   $0 = 0
  } else {
   HEAP32[$0 + 392 >> 2] = 0;
   HEAP32[$0 + 396 >> 2] = 0;
   HEAP32[$0 + 384 >> 2] = 0;
   HEAP32[$0 + 388 >> 2] = 1;
   $0 = 1;
  }
  return $0;
 }
 
 function FLAC__ogg_encoder_aspect_set_defaults($0) {
  HEAP32[$0 >> 2] = 0;
  HEAP32[$0 + 4 >> 2] = 0;
 }
 
 function FLAC__ogg_encoder_aspect_write_callback_wrapper($0, $1, $2, $3, $4, $5, $6, $7, $8) {
  var $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0;
  $9 = global$0 - 96 | 0;
  global$0 = $9;
  label$1 : {
   label$2 : {
    if (HEAP32[$0 + 384 >> 2]) {
     HEAP32[$9 + 72 >> 2] = 0;
     HEAP32[$9 + 76 >> 2] = 0;
     $12 = $9 + 80 | 0;
     $11 = $12;
     HEAP32[$11 >> 2] = 0;
     HEAP32[$11 + 4 >> 2] = 0;
     HEAP32[$9 + 88 >> 2] = 0;
     HEAP32[$9 + 92 >> 2] = 0;
     HEAP32[$9 + 64 >> 2] = 0;
     HEAP32[$9 + 68 >> 2] = 0;
     $10 = HEAP32[$0 + 396 >> 2];
     $11 = $3;
     $13 = HEAP32[$0 + 392 >> 2];
     $14 = $11 + $13 | 0;
     if ($14 >>> 0 < $13 >>> 0) {
      $10 = $10 + 1 | 0
     }
     HEAP32[$12 >> 2] = $14;
     HEAP32[$12 + 4 >> 2] = $10;
     label$4 : {
      label$5 : {
       if (HEAP32[$0 + 388 >> 2]) {
        if (($2 | 0) != 38) {
         break label$4
        }
        HEAP8[$9 | 0] = HEAPU8[6400];
        $2 = HEAP32[2716];
        $2 = HEAPU8[$2 | 0] | HEAPU8[$2 + 1 | 0] << 8 | (HEAPU8[$2 + 2 | 0] << 16 | HEAPU8[$2 + 3 | 0] << 24);
        HEAP8[$9 + 5 | 0] = 1;
        HEAP8[$9 + 6 | 0] = 0;
        HEAP8[$9 + 1 | 0] = $2;
        HEAP8[$9 + 2 | 0] = $2 >>> 8;
        HEAP8[$9 + 3 | 0] = $2 >>> 16;
        HEAP8[$9 + 4 | 0] = $2 >>> 24;
        $10 = HEAP32[$0 + 4 >> 2];
        $2 = HEAPU8[6439] | HEAPU8[6440] << 8 | (HEAPU8[6441] << 16 | HEAPU8[6442] << 24);
        HEAP8[$9 + 9 | 0] = $2;
        HEAP8[$9 + 10 | 0] = $2 >>> 8;
        HEAP8[$9 + 11 | 0] = $2 >>> 16;
        HEAP8[$9 + 12 | 0] = $2 >>> 24;
        HEAP8[$9 + 8 | 0] = $10;
        HEAP8[$9 + 7 | 0] = $10 >>> 8;
        $2 = HEAPU8[$1 + 34 | 0] | HEAPU8[$1 + 35 | 0] << 8 | (HEAPU8[$1 + 36 | 0] << 16 | HEAPU8[$1 + 37 | 0] << 24);
        $10 = HEAPU8[$1 + 30 | 0] | HEAPU8[$1 + 31 | 0] << 8 | (HEAPU8[$1 + 32 | 0] << 16 | HEAPU8[$1 + 33 | 0] << 24);
        HEAP8[$9 + 43 | 0] = $10;
        HEAP8[$9 + 44 | 0] = $10 >>> 8;
        HEAP8[$9 + 45 | 0] = $10 >>> 16;
        HEAP8[$9 + 46 | 0] = $10 >>> 24;
        HEAP8[$9 + 47 | 0] = $2;
        HEAP8[$9 + 48 | 0] = $2 >>> 8;
        HEAP8[$9 + 49 | 0] = $2 >>> 16;
        HEAP8[$9 + 50 | 0] = $2 >>> 24;
        $2 = HEAPU8[$1 + 28 | 0] | HEAPU8[$1 + 29 | 0] << 8 | (HEAPU8[$1 + 30 | 0] << 16 | HEAPU8[$1 + 31 | 0] << 24);
        $10 = HEAPU8[$1 + 24 | 0] | HEAPU8[$1 + 25 | 0] << 8 | (HEAPU8[$1 + 26 | 0] << 16 | HEAPU8[$1 + 27 | 0] << 24);
        HEAP8[$9 + 37 | 0] = $10;
        HEAP8[$9 + 38 | 0] = $10 >>> 8;
        HEAP8[$9 + 39 | 0] = $10 >>> 16;
        HEAP8[$9 + 40 | 0] = $10 >>> 24;
        HEAP8[$9 + 41 | 0] = $2;
        HEAP8[$9 + 42 | 0] = $2 >>> 8;
        HEAP8[$9 + 43 | 0] = $2 >>> 16;
        HEAP8[$9 + 44 | 0] = $2 >>> 24;
        $2 = HEAPU8[$1 + 20 | 0] | HEAPU8[$1 + 21 | 0] << 8 | (HEAPU8[$1 + 22 | 0] << 16 | HEAPU8[$1 + 23 | 0] << 24);
        $10 = HEAPU8[$1 + 16 | 0] | HEAPU8[$1 + 17 | 0] << 8 | (HEAPU8[$1 + 18 | 0] << 16 | HEAPU8[$1 + 19 | 0] << 24);
        HEAP8[$9 + 29 | 0] = $10;
        HEAP8[$9 + 30 | 0] = $10 >>> 8;
        HEAP8[$9 + 31 | 0] = $10 >>> 16;
        HEAP8[$9 + 32 | 0] = $10 >>> 24;
        HEAP8[$9 + 33 | 0] = $2;
        HEAP8[$9 + 34 | 0] = $2 >>> 8;
        HEAP8[$9 + 35 | 0] = $2 >>> 16;
        HEAP8[$9 + 36 | 0] = $2 >>> 24;
        $2 = HEAPU8[$1 + 12 | 0] | HEAPU8[$1 + 13 | 0] << 8 | (HEAPU8[$1 + 14 | 0] << 16 | HEAPU8[$1 + 15 | 0] << 24);
        $10 = HEAPU8[$1 + 8 | 0] | HEAPU8[$1 + 9 | 0] << 8 | (HEAPU8[$1 + 10 | 0] << 16 | HEAPU8[$1 + 11 | 0] << 24);
        HEAP8[$9 + 21 | 0] = $10;
        HEAP8[$9 + 22 | 0] = $10 >>> 8;
        HEAP8[$9 + 23 | 0] = $10 >>> 16;
        HEAP8[$9 + 24 | 0] = $10 >>> 24;
        HEAP8[$9 + 25 | 0] = $2;
        HEAP8[$9 + 26 | 0] = $2 >>> 8;
        HEAP8[$9 + 27 | 0] = $2 >>> 16;
        HEAP8[$9 + 28 | 0] = $2 >>> 24;
        $2 = HEAPU8[$1 + 4 | 0] | HEAPU8[$1 + 5 | 0] << 8 | (HEAPU8[$1 + 6 | 0] << 16 | HEAPU8[$1 + 7 | 0] << 24);
        $1 = HEAPU8[$1 | 0] | HEAPU8[$1 + 1 | 0] << 8 | (HEAPU8[$1 + 2 | 0] << 16 | HEAPU8[$1 + 3 | 0] << 24);
        HEAP8[$9 + 13 | 0] = $1;
        HEAP8[$9 + 14 | 0] = $1 >>> 8;
        HEAP8[$9 + 15 | 0] = $1 >>> 16;
        HEAP8[$9 + 16 | 0] = $1 >>> 24;
        HEAP8[$9 + 17 | 0] = $2;
        HEAP8[$9 + 18 | 0] = $2 >>> 8;
        HEAP8[$9 + 19 | 0] = $2 >>> 16;
        HEAP8[$9 + 20 | 0] = $2 >>> 24;
        HEAP32[$9 + 68 >> 2] = 51;
        HEAP32[$9 + 72 >> 2] = 1;
        HEAP32[$9 + 64 >> 2] = $9;
        HEAP32[$0 + 388 >> 2] = 0;
        break label$5;
       }
       HEAP32[$9 + 68 >> 2] = $2;
       HEAP32[$9 + 64 >> 2] = $1;
      }
      if ($5) {
       HEAP32[$9 + 76 >> 2] = 1
      }
      $1 = $0 + 8 | 0;
      if (ogg_stream_packetin($1, $9 - -64 | 0)) {
       break label$4
      }
      $2 = $0 + 368 | 0;
      if (!$3) {
       while (1) {
        if (!ogg_stream_flush_i($1, $2, 1)) {
         break label$2
        }
        if (FUNCTION_TABLE[$6]($7, HEAP32[$0 + 368 >> 2], HEAP32[$0 + 372 >> 2], 0, $4, $8)) {
         break label$4
        }
        if (!FUNCTION_TABLE[$6]($7, HEAP32[$0 + 376 >> 2], HEAP32[$0 + 380 >> 2], 0, $4, $8)) {
         continue
        }
        break label$4;
       }
      }
      while (1) {
       if (!ogg_stream_pageout($1, $2)) {
        break label$2
       }
       if (FUNCTION_TABLE[$6]($7, HEAP32[$0 + 368 >> 2], HEAP32[$0 + 372 >> 2], 0, $4, $8)) {
        break label$4
       }
       if (!FUNCTION_TABLE[$6]($7, HEAP32[$0 + 376 >> 2], HEAP32[$0 + 380 >> 2], 0, $4, $8)) {
        continue
       }
       break;
      };
     }
     $6 = 1;
     break label$1;
    }
    $6 = 1;
    if ($3 | $4 | ($2 | 0) != 4 | (HEAPU8[$1 | 0] | HEAPU8[$1 + 1 | 0] << 8 | (HEAPU8[$1 + 2 | 0] << 16 | HEAPU8[$1 + 3 | 0] << 24)) != (HEAPU8[6439] | HEAPU8[6440] << 8 | (HEAPU8[6441] << 16 | HEAPU8[6442] << 24))) {
     break label$1
    }
    HEAP32[$0 + 384 >> 2] = 1;
    $11 = $3;
   }
   $1 = $0;
   $3 = $1;
   $2 = HEAP32[$1 + 396 >> 2];
   $0 = $11 + HEAP32[$1 + 392 >> 2] | 0;
   if ($0 >>> 0 < $11 >>> 0) {
    $2 = $2 + 1 | 0
   }
   HEAP32[$3 + 392 >> 2] = $0;
   HEAP32[$1 + 396 >> 2] = $2;
   $6 = 0;
  }
  global$0 = $9 + 96 | 0;
  return $6;
 }
 
 function FLAC__bitreader_free($0) {
  var $1 = 0;
  $1 = HEAP32[$0 >> 2];
  if ($1) {
   dlfree($1)
  }
  HEAP32[$0 + 36 >> 2] = 0;
  HEAP32[$0 + 40 >> 2] = 0;
  HEAP32[$0 >> 2] = 0;
  HEAP32[$0 + 4 >> 2] = 0;
  HEAP32[$0 + 8 >> 2] = 0;
  HEAP32[$0 + 12 >> 2] = 0;
  HEAP32[$0 + 16 >> 2] = 0;
  HEAP32[$0 + 20 >> 2] = 0;
 }
 
 function FLAC__bitreader_init($0, $1) {
  var $2 = 0;
  HEAP32[$0 + 8 >> 2] = 0;
  HEAP32[$0 + 12 >> 2] = 0;
  HEAP32[$0 + 4 >> 2] = 2048;
  HEAP32[$0 + 16 >> 2] = 0;
  HEAP32[$0 + 20 >> 2] = 0;
  $2 = dlmalloc(8192);
  HEAP32[$0 >> 2] = $2;
  if (!$2) {
   return 0
  }
  HEAP32[$0 + 40 >> 2] = $1;
  HEAP32[$0 + 36 >> 2] = 7;
  return 1;
 }
 
 function FLAC__bitreader_get_read_crc16($0) {
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
  $5 = HEAP32[$0 + 16 >> 2];
  $2 = HEAP32[$0 + 28 >> 2];
  label$1 : {
   if ($5 >>> 0 <= $2 >>> 0) {
    $4 = $2;
    break label$1;
   }
   $1 = HEAP32[$0 + 32 >> 2];
   if (!$1) {
    $4 = $2;
    break label$1;
   }
   $4 = $2 + 1 | 0;
   HEAP32[$0 + 28 >> 2] = $4;
   $3 = HEAP32[$0 + 24 >> 2];
   if ($1 >>> 0 <= 31) {
    $2 = HEAP32[HEAP32[$0 >> 2] + ($2 << 2) >> 2];
    while (1) {
     $3 = HEAPU16[(($2 >>> 24 - $1 & 255 ^ $3 >>> 8) << 1) + 1280 >> 1] ^ $3 << 8 & 65280;
     $7 = $1 >>> 0 < 24;
     $6 = $1 + 8 | 0;
     $1 = $6;
     if ($7) {
      continue
     }
     break;
    };
    HEAP32[$0 + 32 >> 2] = $6;
   }
   HEAP32[$0 + 32 >> 2] = 0;
   HEAP32[$0 + 24 >> 2] = $3;
  }
  $1 = FLAC__crc16_update_words32(HEAP32[$0 >> 2] + ($4 << 2) | 0, $5 - $4 | 0, HEAPU16[$0 + 24 >> 1]);
  HEAP32[$0 + 28 >> 2] = 0;
  HEAP32[$0 + 24 >> 2] = $1;
  $2 = HEAP32[$0 + 20 >> 2];
  label$6 : {
   if (!$2) {
    break label$6
   }
   $3 = HEAP32[$0 + 32 >> 2];
   if ($3 >>> 0 >= $2 >>> 0) {
    break label$6
   }
   $4 = HEAP32[HEAP32[$0 >> 2] + (HEAP32[$0 + 16 >> 2] << 2) >> 2];
   while (1) {
    $1 = HEAPU16[(($4 >>> 24 - $3 & 255 ^ $1 >>> 8) << 1) + 1280 >> 1] ^ $1 << 8 & 65280;
    $3 = $3 + 8 | 0;
    if ($3 >>> 0 < $2 >>> 0) {
     continue
    }
    break;
   };
   HEAP32[$0 + 32 >> 2] = $3;
   HEAP32[$0 + 24 >> 2] = $1;
  }
  return $1;
 }
 
 function FLAC__bitreader_is_consumed_byte_aligned($0) {
  return !(HEAPU8[$0 + 20 | 0] & 7);
 }
 
 function FLAC__bitreader_bits_left_for_byte_alignment($0) {
  return 8 - (HEAP32[$0 + 20 >> 2] & 7) | 0;
 }
 
 function FLAC__bitreader_read_raw_uint32($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0;
  label$1 : {
   if ($2) {
    label$4 : {
     while (1) {
      $5 = HEAP32[$0 + 8 >> 2];
      $4 = HEAP32[$0 + 16 >> 2];
      $3 = HEAP32[$0 + 20 >> 2];
      if ((($5 - $4 << 5) + (HEAP32[$0 + 12 >> 2] << 3) | 0) - $3 >>> 0 >= $2 >>> 0) {
       break label$4
      }
      if (bitreader_read_from_client_($0)) {
       continue
      }
      break;
     };
     return 0;
    }
    if ($5 >>> 0 > $4 >>> 0) {
     if ($3) {
      $5 = HEAP32[$0 >> 2];
      $4 = HEAP32[$5 + ($4 << 2) >> 2] & -1 >>> $3;
      $3 = 32 - $3 | 0;
      if ($3 >>> 0 > $2 >>> 0) {
       HEAP32[$1 >> 2] = $4 >>> $3 - $2;
       HEAP32[$0 + 20 >> 2] = HEAP32[$0 + 20 >> 2] + $2;
       break label$1;
      }
      HEAP32[$1 >> 2] = $4;
      HEAP32[$0 + 20 >> 2] = 0;
      HEAP32[$0 + 16 >> 2] = HEAP32[$0 + 16 >> 2] + 1;
      $2 = $2 - $3 | 0;
      if (!$2) {
       break label$1
      }
      $3 = HEAP32[$1 >> 2] << $2;
      HEAP32[$1 >> 2] = $3;
      HEAP32[$1 >> 2] = $3 | HEAP32[(HEAP32[$0 + 16 >> 2] << 2) + $5 >> 2] >>> 32 - $2;
      HEAP32[$0 + 20 >> 2] = $2;
      return 1;
     }
     $3 = HEAP32[HEAP32[$0 >> 2] + ($4 << 2) >> 2];
     if ($2 >>> 0 <= 31) {
      HEAP32[$1 >> 2] = $3 >>> 32 - $2;
      HEAP32[$0 + 20 >> 2] = $2;
      break label$1;
     }
     HEAP32[$1 >> 2] = $3;
     HEAP32[$0 + 16 >> 2] = HEAP32[$0 + 16 >> 2] + 1;
     return 1;
    }
    $4 = HEAP32[HEAP32[$0 >> 2] + ($4 << 2) >> 2];
    if ($3) {
     HEAP32[$1 >> 2] = ($4 & -1 >>> $3) >>> 32 - ($2 + $3 | 0);
     HEAP32[$0 + 20 >> 2] = HEAP32[$0 + 20 >> 2] + $2;
     break label$1;
    }
    HEAP32[$1 >> 2] = $4 >>> 32 - $2;
    HEAP32[$0 + 20 >> 2] = HEAP32[$0 + 20 >> 2] + $2;
    break label$1;
   }
   HEAP32[$1 >> 2] = 0;
  }
  return 1;
 }
 
 function bitreader_read_from_client_($0) {
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
  $6 = global$0 - 16 | 0;
  global$0 = $6;
  $5 = HEAP32[$0 + 16 >> 2];
  label$1 : {
   if (!$5) {
    $2 = HEAP32[$0 + 8 >> 2];
    break label$1;
   }
   $1 = HEAP32[$0 + 28 >> 2];
   label$3 : {
    if ($5 >>> 0 <= $1 >>> 0) {
     $3 = $1;
     break label$3;
    }
    $2 = HEAP32[$0 + 32 >> 2];
    if (!$2) {
     $3 = $1;
     break label$3;
    }
    $3 = $1 + 1 | 0;
    HEAP32[$0 + 28 >> 2] = $3;
    $4 = HEAP32[$0 + 24 >> 2];
    if ($2 >>> 0 <= 31) {
     $1 = HEAP32[HEAP32[$0 >> 2] + ($1 << 2) >> 2];
     while (1) {
      $4 = HEAPU16[(($1 >>> 24 - $2 & 255 ^ $4 >>> 8) << 1) + 1280 >> 1] ^ $4 << 8 & 65280;
      $7 = $2 >>> 0 < 24;
      $8 = $2 + 8 | 0;
      $2 = $8;
      if ($7) {
       continue
      }
      break;
     };
     HEAP32[$0 + 32 >> 2] = $8;
    }
    HEAP32[$0 + 32 >> 2] = 0;
    HEAP32[$0 + 24 >> 2] = $4;
   }
   $1 = FLAC__crc16_update_words32(HEAP32[$0 >> 2] + ($3 << 2) | 0, $5 - $3 | 0, HEAPU16[$0 + 24 >> 1]);
   HEAP32[$0 + 28 >> 2] = 0;
   HEAP32[$0 + 24 >> 2] = $1;
   $3 = HEAP32[$0 >> 2];
   $1 = HEAP32[$0 + 16 >> 2];
   memmove($3, $3 + ($1 << 2) | 0, (HEAP32[$0 + 8 >> 2] - $1 | 0) + (HEAP32[$0 + 12 >> 2] != 0) << 2);
   HEAP32[$0 + 16 >> 2] = 0;
   $2 = HEAP32[$0 + 8 >> 2] - $1 | 0;
   HEAP32[$0 + 8 >> 2] = $2;
  }
  $1 = HEAP32[$0 + 12 >> 2];
  $3 = (HEAP32[$0 + 4 >> 2] - $2 << 2) - $1 | 0;
  HEAP32[$6 + 12 >> 2] = $3;
  $4 = 0;
  label$8 : {
   if (!$3) {
    break label$8
   }
   $3 = HEAP32[$0 >> 2] + ($2 << 2) | 0;
   $2 = $3 + $1 | 0;
   if ($1) {
    $1 = HEAP32[$3 >> 2];
    HEAP32[$3 >> 2] = $1 << 24 | $1 << 8 & 16711680 | ($1 >>> 8 & 65280 | $1 >>> 24);
   }
   if (!FUNCTION_TABLE[HEAP32[$0 + 36 >> 2]]($2, $6 + 12 | 0, HEAP32[$0 + 40 >> 2])) {
    break label$8
   }
   $5 = HEAP32[$6 + 12 >> 2];
   $2 = HEAP32[$0 + 12 >> 2];
   $4 = HEAP32[$0 + 8 >> 2];
   $1 = $4 << 2;
   $3 = ($5 + ($2 + $1 | 0) | 0) + 3 >>> 2 | 0;
   $8 = $0;
   if ($4 >>> 0 < $3 >>> 0) {
    $2 = HEAP32[$0 >> 2];
    while (1) {
     $7 = $2 + ($4 << 2) | 0;
     $1 = HEAP32[$7 >> 2];
     HEAP32[$7 >> 2] = $1 << 8 & 16711680 | $1 << 24 | ($1 >>> 8 & 65280 | $1 >>> 24);
     $4 = $4 + 1 | 0;
     if (($3 | 0) != ($4 | 0)) {
      continue
     }
     break;
    };
    $2 = HEAP32[$0 + 12 >> 2];
    $1 = HEAP32[$0 + 8 >> 2] << 2;
   }
   $1 = $1 + ($2 + $5 | 0) | 0;
   HEAP32[$8 + 12 >> 2] = $1 & 3;
   HEAP32[$0 + 8 >> 2] = $1 >>> 2;
   $4 = 1;
  }
  global$0 = $6 + 16 | 0;
  return $4;
 }
 
 function FLAC__bitreader_read_raw_int32($0, $1, $2) {
  var $3 = 0, $4 = 0;
  $3 = global$0 - 16 | 0;
  global$0 = $3;
  $4 = 0;
  label$1 : {
   if (!FLAC__bitreader_read_raw_uint32($0, $3 + 12 | 0, $2)) {
    break label$1
   }
   $0 = 1 << $2 + -1;
   HEAP32[$1 >> 2] = ($0 ^ HEAP32[$3 + 12 >> 2]) - $0;
   $4 = 1;
  }
  $0 = $4;
  global$0 = $3 + 16 | 0;
  return $0;
 }
 
 function FLAC__bitreader_read_raw_uint64($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0, $6 = 0;
  $3 = global$0 - 16 | 0;
  global$0 = $3;
  $4 = $1;
  $5 = $1;
  label$1 : {
   label$2 : {
    if ($2 >>> 0 >= 33) {
     if (!FLAC__bitreader_read_raw_uint32($0, $3 + 12 | 0, $2 + -32 | 0)) {
      break label$1
     }
     if (!FLAC__bitreader_read_raw_uint32($0, $3 + 8 | 0, 32)) {
      break label$1
     }
     $0 = HEAP32[$3 + 12 >> 2];
     $2 = 0;
     HEAP32[$1 >> 2] = $2;
     HEAP32[$1 + 4 >> 2] = $0;
     $1 = HEAP32[$3 + 8 >> 2] | $2;
     break label$2;
    }
    if (!FLAC__bitreader_read_raw_uint32($0, $3 + 8 | 0, $2)) {
     break label$1
    }
    $0 = 0;
    $1 = HEAP32[$3 + 8 >> 2];
   }
   HEAP32[$5 >> 2] = $1;
   HEAP32[$4 + 4 >> 2] = $0;
   $6 = 1;
  }
  global$0 = $3 + 16 | 0;
  return $6;
 }
 
 function FLAC__bitreader_read_uint32_little_endian($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0;
  $2 = global$0 - 16 | 0;
  global$0 = $2;
  HEAP32[$2 + 8 >> 2] = 0;
  label$1 : {
   if (!FLAC__bitreader_read_raw_uint32($0, $2 + 8 | 0, 8)) {
    break label$1
   }
   if (!FLAC__bitreader_read_raw_uint32($0, $2 + 12 | 0, 8)) {
    break label$1
   }
   $3 = HEAP32[$2 + 8 >> 2] | HEAP32[$2 + 12 >> 2] << 8;
   HEAP32[$2 + 8 >> 2] = $3;
   if (!FLAC__bitreader_read_raw_uint32($0, $2 + 12 | 0, 8)) {
    break label$1
   }
   $3 = $3 | HEAP32[$2 + 12 >> 2] << 16;
   HEAP32[$2 + 8 >> 2] = $3;
   if (!FLAC__bitreader_read_raw_uint32($0, $2 + 12 | 0, 8)) {
    break label$1
   }
   $0 = $3 | HEAP32[$2 + 12 >> 2] << 24;
   HEAP32[$2 + 8 >> 2] = $0;
   HEAP32[$1 >> 2] = $0;
   $4 = 1;
  }
  global$0 = $2 + 16 | 0;
  return $4;
 }
 
 function FLAC__bitreader_skip_bits_no_crc($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0;
  $3 = global$0 - 16 | 0;
  global$0 = $3;
  $4 = 1;
  label$1 : {
   if (!$1) {
    break label$1
   }
   $2 = HEAP32[$0 + 20 >> 2] & 7;
   label$2 : {
    if ($2) {
     $2 = 8 - $2 | 0;
     $2 = $2 >>> 0 < $1 >>> 0 ? $2 : $1;
     if (!FLAC__bitreader_read_raw_uint32($0, $3 + 8 | 0, $2)) {
      break label$2
     }
     $1 = $1 - $2 | 0;
    }
    $2 = $1 >>> 3 | 0;
    if ($2) {
     while (1) {
      label$7 : {
       if (!HEAP32[$0 + 20 >> 2]) {
        if ($2 >>> 0 > 3) {
         while (1) {
          $5 = HEAP32[$0 + 16 >> 2];
          label$11 : {
           if ($5 >>> 0 < HEAPU32[$0 + 8 >> 2]) {
            HEAP32[$0 + 16 >> 2] = $5 + 1;
            $2 = $2 + -4 | 0;
            break label$11;
           }
           if (!bitreader_read_from_client_($0)) {
            break label$2
           }
          }
          if ($2 >>> 0 > 3) {
           continue
          }
          break;
         };
         if (!$2) {
          break label$7
         }
        }
        while (1) {
         if (!FLAC__bitreader_read_raw_uint32($0, $3 + 12 | 0, 8)) {
          break label$2
         }
         $2 = $2 + -1 | 0;
         if ($2) {
          continue
         }
         break;
        };
        break label$7;
       }
       if (!FLAC__bitreader_read_raw_uint32($0, $3 + 12 | 0, 8)) {
        break label$2
       }
       $2 = $2 + -1 | 0;
       if ($2) {
        continue
       }
      }
      break;
     };
     $1 = $1 & 7;
    }
    if (!$1) {
     break label$1
    }
    if (FLAC__bitreader_read_raw_uint32($0, $3 + 8 | 0, $1)) {
     break label$1
    }
   }
   $4 = 0;
  }
  global$0 = $3 + 16 | 0;
  return $4;
 }
 
 function FLAC__bitreader_skip_byte_block_aligned_no_crc($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0;
  $2 = global$0 - 16 | 0;
  global$0 = $2;
  $3 = 1;
  label$1 : {
   if (!$1) {
    break label$1
   }
   while (1) {
    label$3 : {
     if (!HEAP32[$0 + 20 >> 2]) {
      label$5 : {
       if ($1 >>> 0 < 4) {
        break label$5
       }
       while (1) {
        $4 = HEAP32[$0 + 16 >> 2];
        label$7 : {
         if ($4 >>> 0 < HEAPU32[$0 + 8 >> 2]) {
          HEAP32[$0 + 16 >> 2] = $4 + 1;
          $1 = $1 + -4 | 0;
          break label$7;
         }
         if (!bitreader_read_from_client_($0)) {
          break label$3
         }
        }
        if ($1 >>> 0 > 3) {
         continue
        }
        break;
       };
       if ($1) {
        break label$5
       }
       break label$1;
      }
      while (1) {
       if (!FLAC__bitreader_read_raw_uint32($0, $2 + 12 | 0, 8)) {
        break label$3
       }
       $1 = $1 + -1 | 0;
       if ($1) {
        continue
       }
       break;
      };
      break label$1;
     }
     if (!FLAC__bitreader_read_raw_uint32($0, $2 + 12 | 0, 8)) {
      break label$3
     }
     $1 = $1 + -1 | 0;
     if ($1) {
      continue
     }
     break label$1;
    }
    break;
   };
   $3 = 0;
  }
  global$0 = $2 + 16 | 0;
  return $3;
 }
 
 function FLAC__bitreader_read_byte_block_aligned_no_crc($0, $1, $2) {
  var $3 = 0, $4 = 0;
  $4 = global$0 - 16 | 0;
  global$0 = $4;
  label$1 : {
   if (!$2) {
    $3 = 1;
    break label$1;
   }
   while (1) {
    if (!HEAP32[$0 + 20 >> 2]) {
     label$5 : {
      if ($2 >>> 0 < 4) {
       break label$5
      }
      while (1) {
       label$7 : {
        $3 = HEAP32[$0 + 16 >> 2];
        if ($3 >>> 0 < HEAPU32[$0 + 8 >> 2]) {
         HEAP32[$0 + 16 >> 2] = $3 + 1;
         $3 = HEAP32[HEAP32[$0 >> 2] + ($3 << 2) >> 2];
         $3 = $3 << 24 | $3 << 8 & 16711680 | ($3 >>> 8 & 65280 | $3 >>> 24);
         HEAP8[$1 | 0] = $3;
         HEAP8[$1 + 1 | 0] = $3 >>> 8;
         HEAP8[$1 + 2 | 0] = $3 >>> 16;
         HEAP8[$1 + 3 | 0] = $3 >>> 24;
         $2 = $2 + -4 | 0;
         $1 = $1 + 4 | 0;
         break label$7;
        }
        if (bitreader_read_from_client_($0)) {
         break label$7
        }
        $3 = 0;
        break label$1;
       }
       if ($2 >>> 0 > 3) {
        continue
       }
       break;
      };
      if ($2) {
       break label$5
      }
      $3 = 1;
      break label$1;
     }
     while (1) {
      if (!FLAC__bitreader_read_raw_uint32($0, $4 + 12 | 0, 8)) {
       $3 = 0;
       break label$1;
      }
      HEAP8[$1 | 0] = HEAP32[$4 + 12 >> 2];
      $3 = 1;
      $1 = $1 + 1 | 0;
      $2 = $2 + -1 | 0;
      if ($2) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (!FLAC__bitreader_read_raw_uint32($0, $4 + 12 | 0, 8)) {
     $3 = 0;
     break label$1;
    }
    HEAP8[$1 | 0] = HEAP32[$4 + 12 >> 2];
    $3 = 1;
    $1 = $1 + 1 | 0;
    $2 = $2 + -1 | 0;
    if ($2) {
     continue
    }
    break;
   };
  }
  global$0 = $4 + 16 | 0;
  return $3;
 }
 
 function FLAC__bitreader_read_unary_unsigned($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0;
  HEAP32[$1 >> 2] = 0;
  label$1 : {
   while (1) {
    $3 = HEAP32[$0 + 16 >> 2];
    label$3 : {
     if ($3 >>> 0 >= HEAPU32[$0 + 8 >> 2]) {
      $2 = HEAP32[$0 + 20 >> 2];
      break label$3;
     }
     $2 = HEAP32[$0 + 20 >> 2];
     $4 = HEAP32[$0 >> 2];
     while (1) {
      $3 = HEAP32[$4 + ($3 << 2) >> 2] << $2;
      if ($3) {
       $2 = $1;
       $4 = HEAP32[$1 >> 2];
       $1 = Math_clz32($3);
       HEAP32[$2 >> 2] = $4 + $1;
       $2 = ($1 + HEAP32[$0 + 20 >> 2] | 0) + 1 | 0;
       HEAP32[$0 + 20 >> 2] = $2;
       $1 = 1;
       if ($2 >>> 0 < 32) {
        break label$1
       }
       HEAP32[$0 + 20 >> 2] = 0;
       HEAP32[$0 + 16 >> 2] = HEAP32[$0 + 16 >> 2] + 1;
       return 1;
      }
      HEAP32[$1 >> 2] = (HEAP32[$1 >> 2] - $2 | 0) + 32;
      $2 = 0;
      HEAP32[$0 + 20 >> 2] = 0;
      $3 = HEAP32[$0 + 16 >> 2] + 1 | 0;
      HEAP32[$0 + 16 >> 2] = $3;
      if ($3 >>> 0 < HEAPU32[$0 + 8 >> 2]) {
       continue
      }
      break;
     };
    }
    $4 = HEAP32[$0 + 12 >> 2] << 3;
    if ($4 >>> 0 > $2 >>> 0) {
     $3 = (HEAP32[HEAP32[$0 >> 2] + ($3 << 2) >> 2] & -1 << 32 - $4) << $2;
     if ($3) {
      $2 = $1;
      $4 = HEAP32[$1 >> 2];
      $1 = Math_clz32($3);
      HEAP32[$2 >> 2] = $4 + $1;
      HEAP32[$0 + 20 >> 2] = ($1 + HEAP32[$0 + 20 >> 2] | 0) + 1;
      return 1;
     }
     HEAP32[$1 >> 2] = HEAP32[$1 >> 2] + ($4 - $2 | 0);
     HEAP32[$0 + 20 >> 2] = $4;
    }
    if (bitreader_read_from_client_($0)) {
     continue
    }
    break;
   };
   $1 = 0;
  }
  return $1;
 }
 
 function FLAC__bitreader_read_rice_signed_block($0, $1, $2, $3) {
  var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0;
  $6 = global$0 - 16 | 0;
  global$0 = $6;
  $12 = ($2 << 2) + $1 | 0;
  label$1 : {
   if (!$3) {
    $14 = 1;
    if (($2 | 0) < 1) {
     break label$1
    }
    while (1) {
     if (!FLAC__bitreader_read_unary_unsigned($0, $6 + 8 | 0)) {
      $14 = 0;
      break label$1;
     }
     $2 = HEAP32[$6 + 8 >> 2];
     HEAP32[$1 >> 2] = $2 >>> 1 ^ 0 - ($2 & 1);
     $1 = $1 + 4 | 0;
     if ($1 >>> 0 < $12 >>> 0) {
      continue
     }
     break;
    };
    break label$1;
   }
   label$5 : {
    label$6 : {
     $4 = HEAP32[$0 + 16 >> 2];
     $10 = HEAP32[$0 + 8 >> 2];
     if ($4 >>> 0 >= $10 >>> 0) {
      break label$6
     }
     $11 = HEAP32[$0 >> 2];
     $13 = HEAP32[$0 + 20 >> 2];
     $9 = HEAP32[$11 + ($4 << 2) >> 2] << $13;
     $2 = 0;
     break label$5;
    }
    $2 = 1;
   }
   while (1) {
    label$9 : {
     label$10 : {
      label$11 : {
       label$12 : {
        if (!$2) {
         $5 = 32 - $13 | 0;
         label$14 : {
          if ($1 >>> 0 < $12 >>> 0) {
           $15 = 32 - $3 | 0;
           while (1) {
            $2 = $4;
            $7 = $5;
            label$17 : {
             if ($9) {
              $7 = Math_clz32($9);
              $8 = $7;
              break label$17;
             }
             while (1) {
              $2 = $2 + 1 | 0;
              if ($2 >>> 0 >= $10 >>> 0) {
               break label$14
              }
              $9 = HEAP32[($2 << 2) + $11 >> 2];
              $8 = Math_clz32($9);
              $7 = $8 + $7 | 0;
              if (!$9) {
               continue
              }
              break;
             };
            }
            $4 = $9 << $8 << 1;
            $8 = $4 >>> $15 | 0;
            HEAP32[$6 + 8 >> 2] = $7;
            $5 = ($7 ^ -1) + $5 & 31;
            label$20 : {
             if ($5 >>> 0 >= $3 >>> 0) {
              $9 = $4 << $3;
              $5 = $5 - $3 | 0;
              $4 = $2;
              break label$20;
             }
             $4 = $2 + 1 | 0;
             if ($4 >>> 0 >= $10 >>> 0) {
              break label$12
             }
             $2 = HEAP32[($4 << 2) + $11 >> 2];
             $5 = $5 + $15 | 0;
             $9 = $2 << 32 - $5;
             $8 = $2 >>> $5 | $8;
            }
            HEAP32[$6 + 12 >> 2] = $8;
            $2 = $7 << $3 | $8;
            HEAP32[$1 >> 2] = $2 >>> 1 ^ 0 - ($2 & 1);
            $1 = $1 + 4 | 0;
            if ($1 >>> 0 < $12 >>> 0) {
             continue
            }
            break;
           };
          }
          $1 = $4 >>> 0 < $10 >>> 0;
          HEAP32[$0 + 16 >> 2] = ($1 & !$5) + $4;
          HEAP32[$0 + 20 >> 2] = 32 - ($5 ? $5 : $1 << 5);
          $14 = 1;
          break label$1;
         }
         HEAP32[$0 + 20 >> 2] = 0;
         $2 = $4 + 1 | 0;
         HEAP32[$0 + 16 >> 2] = $10 >>> 0 > $2 >>> 0 ? $10 : $2;
         break label$10;
        }
        if (!FLAC__bitreader_read_unary_unsigned($0, $6 + 8 | 0)) {
         break label$1
        }
        $7 = HEAP32[$6 + 8 >> 2] + $7 | 0;
        HEAP32[$6 + 8 >> 2] = $7;
        $8 = 0;
        $5 = 0;
        break label$11;
       }
       HEAP32[$0 + 16 >> 2] = $4;
       HEAP32[$0 + 20 >> 2] = 0;
      }
      if (!FLAC__bitreader_read_raw_uint32($0, $6 + 12 | 0, $3 - $5 | 0)) {
       break label$1
      }
      $2 = $7 << $3;
      $4 = HEAP32[$6 + 12 >> 2] | $8;
      HEAP32[$6 + 12 >> 2] = $4;
      $7 = 0;
      $2 = $2 | $4;
      HEAP32[$1 >> 2] = $2 >>> 1 ^ 0 - ($2 & 1);
      $11 = HEAP32[$0 >> 2];
      $4 = HEAP32[$0 + 16 >> 2];
      $13 = HEAP32[$0 + 20 >> 2];
      $9 = HEAP32[$11 + ($4 << 2) >> 2] << $13;
      $10 = HEAP32[$0 + 8 >> 2];
      $1 = $1 + 4 | 0;
      if ($4 >>> 0 < $10 >>> 0 | $1 >>> 0 >= $12 >>> 0) {
       break label$9
      }
     }
     $2 = 1;
     continue;
    }
    $2 = 0;
    continue;
   };
  }
  global$0 = $6 + 16 | 0;
  return $14;
 }
 
 function FLAC__bitreader_read_utf8_uint32($0, $1, $2, $3) {
  var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
  $7 = global$0 - 16 | 0;
  global$0 = $7;
  label$1 : {
   if (!FLAC__bitreader_read_raw_uint32($0, $7 + 12 | 0, 8)) {
    break label$1
   }
   $4 = HEAP32[$7 + 12 >> 2];
   if ($2) {
    $5 = HEAP32[$3 >> 2];
    HEAP32[$3 >> 2] = $5 + 1;
    HEAP8[$2 + $5 | 0] = $4;
   }
   label$3 : {
    label$4 : {
     label$5 : {
      label$6 : {
       if (!($4 & 128)) {
        break label$6
       }
       label$7 : {
        if (!(!($4 & 192) | $4 & 32)) {
         $6 = 31;
         $5 = 1;
         break label$7;
        }
        if (!(!($4 & 224) | $4 & 16)) {
         $6 = 15;
         $5 = 2;
         break label$7;
        }
        if (!(!($4 & 240) | $4 & 8)) {
         $6 = 7;
         $5 = 3;
         break label$7;
        }
        if ($4 & 248) {
         $6 = 3;
         $5 = 4;
         if (!($4 & 4)) {
          break label$7
         }
        }
        if (!($4 & 252) | $4 & 2) {
         break label$5
        }
        $6 = 1;
        $5 = 5;
       }
       $4 = $4 & $6;
       if ($2) {
        while (1) {
         if (!FLAC__bitreader_read_raw_uint32($0, $7 + 12 | 0, 8)) {
          break label$1
         }
         $6 = HEAP32[$7 + 12 >> 2];
         $8 = HEAP32[$3 >> 2];
         HEAP32[$3 >> 2] = $8 + 1;
         HEAP8[$2 + $8 | 0] = $6;
         if (($6 & 192) != 128) {
          break label$4
         }
         $4 = $6 & 63 | $4 << 6;
         $5 = $5 + -1 | 0;
         if ($5) {
          continue
         }
         break label$6;
        }
       }
       while (1) {
        if (!FLAC__bitreader_read_raw_uint32($0, $7 + 12 | 0, 8)) {
         break label$1
        }
        $2 = HEAP32[$7 + 12 >> 2];
        if (($2 & 192) != 128) {
         break label$4
        }
        $4 = $2 & 63 | $4 << 6;
        $5 = $5 + -1 | 0;
        if ($5) {
         continue
        }
        break;
       };
      }
      HEAP32[$1 >> 2] = $4;
      break label$3;
     }
     HEAP32[$1 >> 2] = -1;
     break label$3;
    }
    HEAP32[$1 >> 2] = -1;
   }
   $9 = 1;
  }
  global$0 = $7 + 16 | 0;
  return $9;
 }
 
 function FLAC__bitreader_read_utf8_uint64($0, $1, $2, $3) {
  var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
  $7 = global$0 - 16 | 0;
  global$0 = $7;
  label$1 : {
   if (!FLAC__bitreader_read_raw_uint32($0, $7 + 12 | 0, 8)) {
    break label$1
   }
   $4 = HEAP32[$7 + 12 >> 2];
   if ($2) {
    $6 = HEAP32[$3 >> 2];
    HEAP32[$3 >> 2] = $6 + 1;
    HEAP8[$2 + $6 | 0] = $4;
   }
   label$4 : {
    label$5 : {
     label$6 : {
      label$7 : {
       if ($4 & 128) {
        if (!(!($4 & 192) | $4 & 32)) {
         $4 = $4 & 31;
         $5 = 1;
         break label$7;
        }
        if (!(!($4 & 224) | $4 & 16)) {
         $4 = $4 & 15;
         $5 = 2;
         break label$7;
        }
        if (!(!($4 & 240) | $4 & 8)) {
         $4 = $4 & 7;
         $5 = 3;
         break label$7;
        }
        if (!(!($4 & 248) | $4 & 4)) {
         $4 = $4 & 3;
         $5 = 4;
         break label$7;
        }
        if (!(!($4 & 252) | $4 & 2)) {
         $4 = $4 & 1;
         $5 = 5;
         break label$7;
        }
        $5 = 1;
        if (!(!($4 & 254) | $4 & 1)) {
         $5 = 6;
         $4 = 0;
         break label$7;
        }
        HEAP32[$1 >> 2] = -1;
        HEAP32[$1 + 4 >> 2] = -1;
        break label$1;
       }
       $6 = 0;
       break label$6;
      }
      $6 = 0;
      if ($2) {
       while (1) {
        if (!FLAC__bitreader_read_raw_uint32($0, $7 + 12 | 0, 8)) {
         $5 = 0;
         break label$1;
        }
        $8 = HEAP32[$7 + 12 >> 2];
        $9 = HEAP32[$3 >> 2];
        HEAP32[$3 >> 2] = $9 + 1;
        HEAP8[$2 + $9 | 0] = $8;
        if (($8 & 192) != 128) {
         break label$5
        }
        $6 = $6 << 6 | $4 >>> 26;
        $4 = $8 & 63 | $4 << 6;
        $5 = $5 + -1 | 0;
        if ($5) {
         continue
        }
        break label$6;
       }
      }
      while (1) {
       if (!FLAC__bitreader_read_raw_uint32($0, $7 + 12 | 0, 8)) {
        $5 = 0;
        break label$1;
       }
       $2 = HEAP32[$7 + 12 >> 2];
       if (($2 & 192) != 128) {
        break label$5
       }
       $2 = $2 & 63;
       $6 = $6 << 6 | $4 >>> 26;
       $4 = $2 | $4 << 6;
       $5 = $5 + -1 | 0;
       if ($5) {
        continue
       }
       break;
      };
     }
     HEAP32[$1 >> 2] = $4;
     HEAP32[$1 + 4 >> 2] = $6;
     break label$4;
    }
    HEAP32[$1 >> 2] = -1;
    HEAP32[$1 + 4 >> 2] = -1;
   }
   $5 = 1;
  }
  global$0 = $7 + 16 | 0;
  return $5;
 }
 
 function FLAC__ogg_decoder_aspect_init($0) {
  var $1 = 0;
  label$1 : {
   if (ogg_stream_init($0 + 8 | 0, HEAP32[$0 + 4 >> 2])) {
    break label$1
   }
   if (ogg_sync_init($0 + 368 | 0)) {
    break label$1
   }
   HEAP32[$0 + 396 >> 2] = -1;
   HEAP32[$0 + 400 >> 2] = -1;
   HEAP32[$0 + 408 >> 2] = 0;
   HEAP32[$0 + 412 >> 2] = 0;
   HEAP32[$0 + 404 >> 2] = HEAP32[$0 >> 2];
   $1 = 1;
  }
  return $1;
 }
 
 function FLAC__ogg_decoder_aspect_set_defaults($0) {
  HEAP32[$0 >> 2] = 1;
 }
 
 function FLAC__ogg_decoder_aspect_reset($0) {
  ogg_stream_reset($0 + 8 | 0);
  ogg_sync_reset($0 + 368 | 0);
  HEAP32[$0 + 408 >> 2] = 0;
  HEAP32[$0 + 412 >> 2] = 0;
  if (HEAP32[$0 >> 2]) {
   HEAP32[$0 + 404 >> 2] = 1
  }
 }
 
 function FLAC__ogg_decoder_aspect_read_callback_wrapper($0, $1, $2, $3, $4) {
  var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0;
  $8 = global$0 - 16 | 0;
  global$0 = $8;
  $9 = HEAP32[$2 >> 2];
  HEAP32[$2 >> 2] = 0;
  label$1 : {
   label$2 : {
    label$3 : {
     if (!$9) {
      break label$3
     }
     $10 = $0 + 416 | 0;
     $11 = $0 + 368 | 0;
     $13 = $0 + 440 | 0;
     $14 = $0 + 8 | 0;
     $15 = HEAP32[2716];
     $16 = HEAPU8[6400];
     while (1) {
      if (HEAP32[$0 + 408 >> 2]) {
       break label$3
      }
      label$5 : {
       label$6 : {
        if (HEAP32[$0 + 412 >> 2]) {
         if (HEAP32[$0 + 432 >> 2]) {
          $7 = HEAP32[$0 + 440 >> 2];
          $6 = HEAP32[$0 + 444 >> 2];
          $5 = $9 - $5 | 0;
          if ($6 >>> 0 > $5 >>> 0) {
           break label$6
          }
          $1 = memcpy($1, $7, $6);
          HEAP32[$2 >> 2] = $6 + HEAP32[$2 >> 2];
          HEAP32[$0 + 432 >> 2] = 0;
          $1 = $1 + $6 | 0;
          break label$5;
         }
         $5 = ogg_stream_packetout($14, $13);
         if (($5 | 0) >= 1) {
          HEAP32[$0 + 432 >> 2] = 1;
          $12 = HEAP32[$0 + 444 >> 2];
          if (($12 | 0) < 1) {
           break label$5
          }
          $6 = HEAP32[$13 >> 2];
          if (HEAPU8[$6 | 0] != ($16 | 0)) {
           break label$5
          }
          $7 = 3;
          if (($12 | 0) < 9) {
           break label$1
          }
          $5 = $15;
          if ((HEAPU8[$6 + 1 | 0] | HEAPU8[$6 + 2 | 0] << 8 | (HEAPU8[$6 + 3 | 0] << 16 | HEAPU8[$6 + 4 | 0] << 24)) != (HEAPU8[$5 | 0] | HEAPU8[$5 + 1 | 0] << 8 | (HEAPU8[$5 + 2 | 0] << 16 | HEAPU8[$5 + 3 | 0] << 24))) {
           break label$1
          }
          $5 = HEAPU8[$6 + 5 | 0];
          HEAP32[$0 + 396 >> 2] = $5;
          HEAP32[$0 + 400 >> 2] = HEAPU8[$6 + 6 | 0];
          if (($5 | 0) != 1) {
           $7 = 4;
           break label$1;
          }
          HEAP32[$0 + 444 >> 2] = $12 + -9;
          HEAP32[$0 + 440 >> 2] = $6 + 9;
          break label$5;
         }
         if ($5) {
          $7 = 2;
          break label$1;
         }
         HEAP32[$0 + 412 >> 2] = 0;
         break label$5;
        }
        $5 = ogg_sync_pageout($11, $10);
        if (($5 | 0) >= 1) {
         if (HEAP32[$0 + 404 >> 2]) {
          $5 = ogg_page_serialno($10);
          HEAP32[$0 + 404 >> 2] = 0;
          HEAP32[$0 + 344 >> 2] = $5;
          HEAP32[$0 + 4 >> 2] = $5;
         }
         if (ogg_stream_pagein($14, $10)) {
          break label$5
         }
         HEAP32[$0 + 432 >> 2] = 0;
         HEAP32[$0 + 412 >> 2] = 1;
         break label$5;
        }
        if ($5) {
         $7 = 2;
         break label$1;
        }
        $5 = $9 - HEAP32[$2 >> 2] | 0;
        $5 = $5 >>> 0 > 8192 ? $5 : 8192;
        $6 = ogg_sync_buffer($11, $5);
        if (!$6) {
         $7 = 7;
         break label$1;
        }
        HEAP32[$8 + 12 >> 2] = $5;
        label$16 : {
         switch ((FUNCTION_TABLE[8]($3, $6, $8 + 12 | 0, $4) | 0) + -1 | 0) {
         case 0:
          HEAP32[$0 + 408 >> 2] = 1;
          break;
         case 4:
          break label$2;
         default:
          break label$16;
         };
        }
        if ((ogg_sync_wrote($11, HEAP32[$8 + 12 >> 2]) | 0) >= 0) {
         break label$5
        }
        $7 = 6;
        break label$1;
       }
       $1 = memcpy($1, $7, $5);
       HEAP32[$2 >> 2] = $5 + HEAP32[$2 >> 2];
       HEAP32[$0 + 440 >> 2] = $5 + HEAP32[$0 + 440 >> 2];
       HEAP32[$0 + 444 >> 2] = HEAP32[$0 + 444 >> 2] - $5;
       $1 = $1 + $5 | 0;
      }
      $5 = HEAP32[$2 >> 2];
      if ($9 >>> 0 > $5 >>> 0) {
       continue
      }
      break;
     };
    }
    global$0 = $8 + 16 | 0;
    return !$5 & HEAP32[$0 + 408 >> 2] != 0;
   }
   $7 = 5;
  }
  global$0 = $8 + 16 | 0;
  return $7;
 }
 
 function FLAC__MD5Init($0) {
  HEAP32[$0 + 80 >> 2] = 0;
  HEAP32[$0 + 84 >> 2] = 0;
  HEAP32[$0 + 64 >> 2] = 1732584193;
  HEAP32[$0 + 68 >> 2] = -271733879;
  HEAP32[$0 + 72 >> 2] = -1732584194;
  HEAP32[$0 + 76 >> 2] = 271733878;
  HEAP32[$0 + 88 >> 2] = 0;
  HEAP32[$0 + 92 >> 2] = 0;
 }
 
 function FLAC__MD5Final($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0;
  $3 = HEAP32[$1 + 80 >> 2] & 63;
  $2 = $3 + $1 | 0;
  HEAP8[$2 | 0] = 128;
  $2 = $2 + 1 | 0;
  $4 = 56;
  label$1 : {
   if ($3 >>> 0 < 56) {
    $4 = 55 - $3 | 0;
    break label$1;
   }
   memset($2, $3 ^ 63);
   FLAC__MD5Transform($1 - -64 | 0, $1);
   $2 = $1;
  }
  memset($2, $4);
  $2 = HEAP32[$1 + 80 >> 2];
  HEAP32[$1 + 56 >> 2] = $2 << 3;
  HEAP32[$1 + 60 >> 2] = HEAP32[$1 + 84 >> 2] << 3 | $2 >>> 29;
  FLAC__MD5Transform($1 - -64 | 0, $1);
  $2 = HEAPU8[$1 + 76 | 0] | HEAPU8[$1 + 77 | 0] << 8 | (HEAPU8[$1 + 78 | 0] << 16 | HEAPU8[$1 + 79 | 0] << 24);
  $3 = HEAPU8[$1 + 72 | 0] | HEAPU8[$1 + 73 | 0] << 8 | (HEAPU8[$1 + 74 | 0] << 16 | HEAPU8[$1 + 75 | 0] << 24);
  HEAP8[$0 + 8 | 0] = $3;
  HEAP8[$0 + 9 | 0] = $3 >>> 8;
  HEAP8[$0 + 10 | 0] = $3 >>> 16;
  HEAP8[$0 + 11 | 0] = $3 >>> 24;
  HEAP8[$0 + 12 | 0] = $2;
  HEAP8[$0 + 13 | 0] = $2 >>> 8;
  HEAP8[$0 + 14 | 0] = $2 >>> 16;
  HEAP8[$0 + 15 | 0] = $2 >>> 24;
  $2 = HEAPU8[$1 + 68 | 0] | HEAPU8[$1 + 69 | 0] << 8 | (HEAPU8[$1 + 70 | 0] << 16 | HEAPU8[$1 + 71 | 0] << 24);
  $3 = HEAPU8[$1 + 64 | 0] | HEAPU8[$1 + 65 | 0] << 8 | (HEAPU8[$1 + 66 | 0] << 16 | HEAPU8[$1 + 67 | 0] << 24);
  HEAP8[$0 | 0] = $3;
  HEAP8[$0 + 1 | 0] = $3 >>> 8;
  HEAP8[$0 + 2 | 0] = $3 >>> 16;
  HEAP8[$0 + 3 | 0] = $3 >>> 24;
  HEAP8[$0 + 4 | 0] = $2;
  HEAP8[$0 + 5 | 0] = $2 >>> 8;
  HEAP8[$0 + 6 | 0] = $2 >>> 16;
  HEAP8[$0 + 7 | 0] = $2 >>> 24;
  $0 = HEAP32[$1 + 88 >> 2];
  if ($0) {
   dlfree($0);
   HEAP32[$1 + 88 >> 2] = 0;
   HEAP32[$1 + 92 >> 2] = 0;
  }
  memset($1, 96);
 }
 
 function FLAC__MD5Transform($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, wasm2js_i32$0 = 0, wasm2js_i32$1 = 0;
  $11 = HEAP32[$1 + 16 >> 2];
  $8 = HEAP32[$1 + 32 >> 2];
  $12 = HEAP32[$1 + 48 >> 2];
  $13 = HEAP32[$1 + 36 >> 2];
  $14 = HEAP32[$1 + 52 >> 2];
  $15 = HEAP32[$1 + 4 >> 2];
  $6 = HEAP32[$1 + 20 >> 2];
  $7 = HEAP32[$0 + 4 >> 2];
  $9 = HEAP32[$1 >> 2];
  $25 = HEAP32[$0 >> 2];
  $16 = HEAP32[$0 + 12 >> 2];
  $10 = HEAP32[$0 + 8 >> 2];
  $3 = $7 + __wasm_rotl_i32((($9 + $25 | 0) + ($16 ^ ($16 ^ $10) & $7) | 0) + -680876936 | 0, 7) | 0;
  $17 = HEAP32[$1 + 12 >> 2];
  $18 = HEAP32[$1 + 8 >> 2];
  $4 = __wasm_rotl_i32((($15 + $16 | 0) + ($3 & ($7 ^ $10) ^ $10) | 0) + -389564586 | 0, 12) + $3 | 0;
  $2 = __wasm_rotl_i32((($18 + $10 | 0) + ($4 & ($3 ^ $7) ^ $7) | 0) + 606105819 | 0, 17) + $4 | 0;
  $5 = __wasm_rotl_i32((($7 + $17 | 0) + ($3 ^ $2 & ($3 ^ $4)) | 0) + -1044525330 | 0, 22) + $2 | 0;
  $3 = __wasm_rotl_i32((($3 + $11 | 0) + ($4 ^ $5 & ($2 ^ $4)) | 0) + -176418897 | 0, 7) + $5 | 0;
  $19 = HEAP32[$1 + 28 >> 2];
  $20 = HEAP32[$1 + 24 >> 2];
  $4 = __wasm_rotl_i32((($4 + $6 | 0) + ($2 ^ $3 & ($2 ^ $5)) | 0) + 1200080426 | 0, 12) + $3 | 0;
  $2 = __wasm_rotl_i32((($2 + $20 | 0) + ($5 ^ $4 & ($3 ^ $5)) | 0) + -1473231341 | 0, 17) + $4 | 0;
  $5 = __wasm_rotl_i32((($5 + $19 | 0) + ($3 ^ $2 & ($3 ^ $4)) | 0) + -45705983 | 0, 22) + $2 | 0;
  $3 = __wasm_rotl_i32((($3 + $8 | 0) + ($4 ^ $5 & ($2 ^ $4)) | 0) + 1770035416 | 0, 7) + $5 | 0;
  $21 = HEAP32[$1 + 44 >> 2];
  $22 = HEAP32[$1 + 40 >> 2];
  $4 = __wasm_rotl_i32((($4 + $13 | 0) + ($2 ^ $3 & ($2 ^ $5)) | 0) + -1958414417 | 0, 12) + $3 | 0;
  $2 = __wasm_rotl_i32((($2 + $22 | 0) + ($5 ^ $4 & ($3 ^ $5)) | 0) + -42063 | 0, 17) + $4 | 0;
  $5 = __wasm_rotl_i32((($5 + $21 | 0) + ($3 ^ $2 & ($3 ^ $4)) | 0) + -1990404162 | 0, 22) + $2 | 0;
  $3 = __wasm_rotl_i32((($3 + $12 | 0) + ($4 ^ $5 & ($2 ^ $4)) | 0) + 1804603682 | 0, 7) + $5 | 0;
  $23 = HEAP32[$1 + 56 >> 2];
  $24 = HEAP32[$1 + 60 >> 2];
  $4 = __wasm_rotl_i32((($4 + $14 | 0) + ($2 ^ $3 & ($2 ^ $5)) | 0) + -40341101 | 0, 12) + $3 | 0;
  $1 = $4 + __wasm_rotl_i32((($2 + $23 | 0) + ($5 ^ ($3 ^ $5) & $4) | 0) + -1502002290 | 0, 17) | 0;
  $26 = $1 + $21 | 0;
  $2 = $3 + $15 | 0;
  $3 = __wasm_rotl_i32((($5 + $24 | 0) + ($3 ^ $1 & ($3 ^ $4)) | 0) + 1236535329 | 0, 22) + $1 | 0;
  $2 = __wasm_rotl_i32(($2 + ($1 ^ ($3 ^ $1) & $4) | 0) + -165796510 | 0, 5) + $3 | 0;
  $1 = __wasm_rotl_i32((($4 + $20 | 0) + ($3 ^ $1 & ($3 ^ $2)) | 0) + -1069501632 | 0, 9) + $2 | 0;
  $4 = __wasm_rotl_i32(($26 + (($2 ^ $1) & $3 ^ $2) | 0) + 643717713 | 0, 14) + $1 | 0;
  $3 = __wasm_rotl_i32((($3 + $9 | 0) + ($1 ^ $2 & ($1 ^ $4)) | 0) + -373897302 | 0, 20) + $4 | 0;
  $2 = __wasm_rotl_i32((($2 + $6 | 0) + ($4 ^ $1 & ($3 ^ $4)) | 0) + -701558691 | 0, 5) + $3 | 0;
  $1 = __wasm_rotl_i32((($1 + $22 | 0) + ($3 ^ $4 & ($3 ^ $2)) | 0) + 38016083 | 0, 9) + $2 | 0;
  $4 = __wasm_rotl_i32((($24 + $4 | 0) + (($2 ^ $1) & $3 ^ $2) | 0) + -660478335 | 0, 14) + $1 | 0;
  $3 = __wasm_rotl_i32((($3 + $11 | 0) + ($1 ^ $2 & ($1 ^ $4)) | 0) + -405537848 | 0, 20) + $4 | 0;
  $2 = __wasm_rotl_i32((($2 + $13 | 0) + ($4 ^ $1 & ($3 ^ $4)) | 0) + 568446438 | 0, 5) + $3 | 0;
  $1 = __wasm_rotl_i32((($1 + $23 | 0) + ($3 ^ $4 & ($3 ^ $2)) | 0) + -1019803690 | 0, 9) + $2 | 0;
  $4 = __wasm_rotl_i32((($4 + $17 | 0) + (($2 ^ $1) & $3 ^ $2) | 0) + -187363961 | 0, 14) + $1 | 0;
  $3 = __wasm_rotl_i32((($3 + $8 | 0) + ($1 ^ $2 & ($1 ^ $4)) | 0) + 1163531501 | 0, 20) + $4 | 0;
  $2 = __wasm_rotl_i32((($2 + $14 | 0) + ($4 ^ $1 & ($3 ^ $4)) | 0) + -1444681467 | 0, 5) + $3 | 0;
  $1 = __wasm_rotl_i32((($1 + $18 | 0) + ($3 ^ $4 & ($3 ^ $2)) | 0) + -51403784 | 0, 9) + $2 | 0;
  $4 = __wasm_rotl_i32((($4 + $19 | 0) + (($2 ^ $1) & $3 ^ $2) | 0) + 1735328473 | 0, 14) + $1 | 0;
  $5 = $1 ^ $4;
  $3 = __wasm_rotl_i32((($3 + $12 | 0) + ($1 ^ $5 & $2) | 0) + -1926607734 | 0, 20) + $4 | 0;
  $2 = __wasm_rotl_i32((($2 + $6 | 0) + ($3 ^ $5) | 0) + -378558 | 0, 4) + $3 | 0;
  $1 = __wasm_rotl_i32((($1 + $8 | 0) + ($3 ^ $4 ^ $2) | 0) + -2022574463 | 0, 11) + $2 | 0;
  $4 = __wasm_rotl_i32((($4 + $21 | 0) + ($1 ^ ($3 ^ $2)) | 0) + 1839030562 | 0, 16) + $1 | 0;
  $3 = __wasm_rotl_i32((($3 + $23 | 0) + ($4 ^ ($1 ^ $2)) | 0) + -35309556 | 0, 23) + $4 | 0;
  $2 = __wasm_rotl_i32((($2 + $15 | 0) + ($3 ^ ($1 ^ $4)) | 0) + -1530992060 | 0, 4) + $3 | 0;
  $1 = __wasm_rotl_i32((($1 + $11 | 0) + ($2 ^ ($3 ^ $4)) | 0) + 1272893353 | 0, 11) + $2 | 0;
  $4 = __wasm_rotl_i32((($4 + $19 | 0) + ($1 ^ ($3 ^ $2)) | 0) + -155497632 | 0, 16) + $1 | 0;
  $3 = __wasm_rotl_i32((($3 + $22 | 0) + ($4 ^ ($1 ^ $2)) | 0) + -1094730640 | 0, 23) + $4 | 0;
  $2 = __wasm_rotl_i32((($2 + $14 | 0) + ($3 ^ ($1 ^ $4)) | 0) + 681279174 | 0, 4) + $3 | 0;
  $1 = __wasm_rotl_i32((($1 + $9 | 0) + ($2 ^ ($3 ^ $4)) | 0) + -358537222 | 0, 11) + $2 | 0;
  $4 = __wasm_rotl_i32((($4 + $17 | 0) + ($1 ^ ($3 ^ $2)) | 0) + -722521979 | 0, 16) + $1 | 0;
  $3 = __wasm_rotl_i32((($3 + $20 | 0) + ($4 ^ ($1 ^ $2)) | 0) + 76029189 | 0, 23) + $4 | 0;
  $2 = __wasm_rotl_i32((($2 + $13 | 0) + ($3 ^ ($1 ^ $4)) | 0) + -640364487 | 0, 4) + $3 | 0;
  $1 = __wasm_rotl_i32((($1 + $12 | 0) + ($2 ^ ($3 ^ $4)) | 0) + -421815835 | 0, 11) + $2 | 0;
  $5 = $2 + $9 | 0;
  $9 = $1 ^ $2;
  $2 = __wasm_rotl_i32((($4 + $24 | 0) + ($1 ^ ($3 ^ $2)) | 0) + 530742520 | 0, 16) + $1 | 0;
  $4 = __wasm_rotl_i32((($3 + $18 | 0) + ($9 ^ $2) | 0) + -995338651 | 0, 23) + $2 | 0;
  $3 = __wasm_rotl_i32(($5 + (($4 | $1 ^ -1) ^ $2) | 0) + -198630844 | 0, 6) + $4 | 0;
  $5 = $4 + $6 | 0;
  $6 = $2 + $23 | 0;
  $2 = __wasm_rotl_i32((($1 + $19 | 0) + ($4 ^ ($3 | $2 ^ -1)) | 0) + 1126891415 | 0, 10) + $3 | 0;
  $4 = __wasm_rotl_i32(($6 + ($3 ^ ($2 | $4 ^ -1)) | 0) + -1416354905 | 0, 15) + $2 | 0;
  $1 = __wasm_rotl_i32(($5 + (($4 | $3 ^ -1) ^ $2) | 0) + -57434055 | 0, 21) + $4 | 0;
  $5 = $4 + $22 | 0;
  $6 = $2 + $17 | 0;
  $2 = __wasm_rotl_i32((($3 + $12 | 0) + ($4 ^ ($1 | $2 ^ -1)) | 0) + 1700485571 | 0, 6) + $1 | 0;
  $4 = __wasm_rotl_i32(($6 + ($1 ^ ($2 | $4 ^ -1)) | 0) + -1894986606 | 0, 10) + $2 | 0;
  $3 = __wasm_rotl_i32(($5 + (($4 | $1 ^ -1) ^ $2) | 0) + -1051523 | 0, 15) + $4 | 0;
  $5 = $4 + $24 | 0;
  $8 = $2 + $8 | 0;
  $2 = __wasm_rotl_i32((($1 + $15 | 0) + ($4 ^ ($3 | $2 ^ -1)) | 0) + -2054922799 | 0, 21) + $3 | 0;
  $4 = __wasm_rotl_i32(($8 + ($3 ^ ($2 | $4 ^ -1)) | 0) + 1873313359 | 0, 6) + $2 | 0;
  $1 = __wasm_rotl_i32(($5 + (($4 | $3 ^ -1) ^ $2) | 0) + -30611744 | 0, 10) + $4 | 0;
  $3 = __wasm_rotl_i32((($3 + $20 | 0) + ($4 ^ ($1 | $2 ^ -1)) | 0) + -1560198380 | 0, 15) + $1 | 0;
  $2 = __wasm_rotl_i32((($2 + $14 | 0) + ($1 ^ ($3 | $4 ^ -1)) | 0) + 1309151649 | 0, 21) + $3 | 0;
  $4 = __wasm_rotl_i32((($4 + $11 | 0) + (($2 | $1 ^ -1) ^ $3) | 0) + -145523070 | 0, 6) + $2 | 0;
  HEAP32[$0 >> 2] = $4 + $25;
  $1 = __wasm_rotl_i32((($1 + $21 | 0) + ($2 ^ ($4 | $3 ^ -1)) | 0) + -1120210379 | 0, 10) + $4 | 0;
  HEAP32[$0 + 12 >> 2] = $1 + $16;
  $3 = __wasm_rotl_i32((($3 + $18 | 0) + ($4 ^ ($1 | $2 ^ -1)) | 0) + 718787259 | 0, 15) + $1 | 0;
  HEAP32[$0 + 8 >> 2] = $3 + $10;
  (wasm2js_i32$0 = $0, wasm2js_i32$1 = __wasm_rotl_i32((($2 + $13 | 0) + ($1 ^ ($3 | $4 ^ -1)) | 0) + -343485551 | 0, 21) + ($3 + $7 | 0) | 0), HEAP32[wasm2js_i32$0 + 4 >> 2] = wasm2js_i32$1;
 }
 
 function FLAC__MD5Accumulate($0, $1, $2, $3, $4) {
  var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0;
  __wasm_i64_mul($4, 0, $2, 0);
  label$1 : {
   if (i64toi32_i32$HIGH_BITS) {
    break label$1
   }
   $7 = Math_imul($2, $4);
   __wasm_i64_mul($3, 0, $7, 0);
   if (i64toi32_i32$HIGH_BITS) {
    break label$1
   }
   $6 = HEAP32[$0 + 88 >> 2];
   $11 = Math_imul($3, $7);
   label$2 : {
    if (HEAPU32[$0 + 92 >> 2] >= $11 >>> 0) {
     $5 = $6;
     break label$2;
    }
    $5 = dlrealloc($6, $11);
    label$4 : {
     if (!$5) {
      dlfree($6);
      $5 = dlmalloc($11);
      HEAP32[$0 + 88 >> 2] = $5;
      if ($5) {
       break label$4
      }
      HEAP32[$0 + 92 >> 2] = 0;
      return 0;
     }
     HEAP32[$0 + 88 >> 2] = $5;
    }
    HEAP32[$0 + 92 >> 2] = $11;
   }
   label$6 : {
    label$7 : {
     label$8 : {
      label$9 : {
       label$10 : {
        label$11 : {
         label$12 : {
          label$13 : {
           label$14 : {
            label$15 : {
             label$16 : {
              label$17 : {
               $6 = Math_imul($4, 100) + $2 | 0;
               if (($6 | 0) <= 300) {
                label$19 : {
                 switch ($6 + -101 | 0) {
                 case 3:
                  break label$10;
                 case 5:
                  break label$11;
                 case 7:
                  break label$12;
                 case 2:
                 case 4:
                 case 6:
                  break label$7;
                 case 0:
                  break label$8;
                 case 1:
                  break label$9;
                 default:
                  break label$19;
                 };
                }
                switch ($6 + -201 | 0) {
                case 0:
                 break label$13;
                case 1:
                 break label$14;
                case 3:
                 break label$15;
                case 5:
                 break label$16;
                case 7:
                 break label$17;
                default:
                 break label$7;
                };
               }
               label$20 : {
                label$21 : {
                 label$22 : {
                  switch ($6 + -401 | 0) {
                  default:
                   switch ($6 + -301 | 0) {
                   case 0:
                    break label$20;
                   case 1:
                    break label$21;
                   default:
                    break label$7;
                   };
                  case 7:
                   if (!$3) {
                    break label$6
                   }
                   $13 = HEAP32[$1 + 28 >> 2];
                   $8 = HEAP32[$1 + 24 >> 2];
                   $12 = HEAP32[$1 + 20 >> 2];
                   $7 = HEAP32[$1 + 16 >> 2];
                   $10 = HEAP32[$1 + 12 >> 2];
                   $6 = HEAP32[$1 + 8 >> 2];
                   $4 = HEAP32[$1 + 4 >> 2];
                   $1 = HEAP32[$1 >> 2];
                   $2 = 0;
                   while (1) {
                    $9 = $2 << 2;
                    HEAP32[$5 >> 2] = HEAP32[$9 + $1 >> 2];
                    HEAP32[$5 + 4 >> 2] = HEAP32[$4 + $9 >> 2];
                    HEAP32[$5 + 8 >> 2] = HEAP32[$6 + $9 >> 2];
                    HEAP32[$5 + 12 >> 2] = HEAP32[$10 + $9 >> 2];
                    HEAP32[$5 + 16 >> 2] = HEAP32[$7 + $9 >> 2];
                    HEAP32[$5 + 20 >> 2] = HEAP32[$9 + $12 >> 2];
                    HEAP32[$5 + 24 >> 2] = HEAP32[$8 + $9 >> 2];
                    HEAP32[$5 + 28 >> 2] = HEAP32[$9 + $13 >> 2];
                    $5 = $5 + 32 | 0;
                    $2 = $2 + 1 | 0;
                    if (($3 | 0) != ($2 | 0)) {
                     continue
                    }
                    break;
                   };
                   break label$6;
                  case 5:
                   if (!$3) {
                    break label$6
                   }
                   $12 = HEAP32[$1 + 20 >> 2];
                   $7 = HEAP32[$1 + 16 >> 2];
                   $10 = HEAP32[$1 + 12 >> 2];
                   $6 = HEAP32[$1 + 8 >> 2];
                   $4 = HEAP32[$1 + 4 >> 2];
                   $1 = HEAP32[$1 >> 2];
                   $2 = 0;
                   while (1) {
                    $8 = $2 << 2;
                    HEAP32[$5 >> 2] = HEAP32[$8 + $1 >> 2];
                    HEAP32[$5 + 4 >> 2] = HEAP32[$4 + $8 >> 2];
                    HEAP32[$5 + 8 >> 2] = HEAP32[$6 + $8 >> 2];
                    HEAP32[$5 + 12 >> 2] = HEAP32[$8 + $10 >> 2];
                    HEAP32[$5 + 16 >> 2] = HEAP32[$7 + $8 >> 2];
                    HEAP32[$5 + 20 >> 2] = HEAP32[$8 + $12 >> 2];
                    $5 = $5 + 24 | 0;
                    $2 = $2 + 1 | 0;
                    if (($3 | 0) != ($2 | 0)) {
                     continue
                    }
                    break;
                   };
                   break label$6;
                  case 3:
                   if (!$3) {
                    break label$6
                   }
                   $10 = HEAP32[$1 + 12 >> 2];
                   $6 = HEAP32[$1 + 8 >> 2];
                   $4 = HEAP32[$1 + 4 >> 2];
                   $1 = HEAP32[$1 >> 2];
                   $2 = 0;
                   while (1) {
                    $7 = $2 << 2;
                    HEAP32[$5 >> 2] = HEAP32[$7 + $1 >> 2];
                    HEAP32[$5 + 4 >> 2] = HEAP32[$4 + $7 >> 2];
                    HEAP32[$5 + 8 >> 2] = HEAP32[$6 + $7 >> 2];
                    HEAP32[$5 + 12 >> 2] = HEAP32[$7 + $10 >> 2];
                    $5 = $5 + 16 | 0;
                    $2 = $2 + 1 | 0;
                    if (($3 | 0) != ($2 | 0)) {
                     continue
                    }
                    break;
                   };
                   break label$6;
                  case 1:
                   if (!$3) {
                    break label$6
                   }
                   $6 = HEAP32[$1 + 4 >> 2];
                   $4 = HEAP32[$1 >> 2];
                   $1 = 0;
                   while (1) {
                    $2 = $1 << 2;
                    HEAP32[$5 >> 2] = HEAP32[$2 + $4 >> 2];
                    HEAP32[$5 + 4 >> 2] = HEAP32[$2 + $6 >> 2];
                    $5 = $5 + 8 | 0;
                    $1 = $1 + 1 | 0;
                    if (($3 | 0) != ($1 | 0)) {
                     continue
                    }
                    break;
                   };
                   break label$6;
                  case 0:
                   break label$22;
                  case 2:
                  case 4:
                  case 6:
                   break label$7;
                  };
                 }
                 if (!$3) {
                  break label$6
                 }
                 $2 = HEAP32[$1 >> 2];
                 $1 = 0;
                 while (1) {
                  HEAP32[$5 >> 2] = HEAP32[$2 + ($1 << 2) >> 2];
                  $5 = $5 + 4 | 0;
                  $1 = $1 + 1 | 0;
                  if (($3 | 0) != ($1 | 0)) {
                   continue
                  }
                  break;
                 };
                 break label$6;
                }
                if (!$3) {
                 break label$6
                }
                $2 = 0;
                while (1) {
                 $4 = $2 << 2;
                 $6 = HEAP32[$4 + HEAP32[$1 >> 2] >> 2];
                 HEAP8[$5 | 0] = $6;
                 HEAP8[$5 + 2 | 0] = $6 >>> 16;
                 HEAP8[$5 + 1 | 0] = $6 >>> 8;
                 $4 = HEAP32[$4 + HEAP32[$1 + 4 >> 2] >> 2];
                 HEAP8[$5 + 3 | 0] = $4;
                 HEAP8[$5 + 5 | 0] = $4 >>> 16;
                 HEAP8[$5 + 4 | 0] = $4 >>> 8;
                 $5 = $5 + 6 | 0;
                 $2 = $2 + 1 | 0;
                 if (($3 | 0) != ($2 | 0)) {
                  continue
                 }
                 break;
                };
                break label$6;
               }
               if (!$3) {
                break label$6
               }
               $2 = 0;
               while (1) {
                $4 = HEAP32[HEAP32[$1 >> 2] + ($2 << 2) >> 2];
                HEAP8[$5 | 0] = $4;
                HEAP8[$5 + 2 | 0] = $4 >>> 16;
                HEAP8[$5 + 1 | 0] = $4 >>> 8;
                $5 = $5 + 3 | 0;
                $2 = $2 + 1 | 0;
                if (($3 | 0) != ($2 | 0)) {
                 continue
                }
                break;
               };
               break label$6;
              }
              if (!$3) {
               break label$6
              }
              $13 = HEAP32[$1 + 28 >> 2];
              $8 = HEAP32[$1 + 24 >> 2];
              $12 = HEAP32[$1 + 20 >> 2];
              $7 = HEAP32[$1 + 16 >> 2];
              $10 = HEAP32[$1 + 12 >> 2];
              $6 = HEAP32[$1 + 8 >> 2];
              $4 = HEAP32[$1 + 4 >> 2];
              $1 = HEAP32[$1 >> 2];
              $2 = 0;
              while (1) {
               $9 = $2 << 2;
               HEAP16[$5 >> 1] = HEAP32[$9 + $1 >> 2];
               HEAP16[$5 + 2 >> 1] = HEAP32[$4 + $9 >> 2];
               HEAP16[$5 + 4 >> 1] = HEAP32[$6 + $9 >> 2];
               HEAP16[$5 + 6 >> 1] = HEAP32[$10 + $9 >> 2];
               HEAP16[$5 + 8 >> 1] = HEAP32[$7 + $9 >> 2];
               HEAP16[$5 + 10 >> 1] = HEAP32[$9 + $12 >> 2];
               HEAP16[$5 + 12 >> 1] = HEAP32[$8 + $9 >> 2];
               HEAP16[$5 + 14 >> 1] = HEAP32[$9 + $13 >> 2];
               $5 = $5 + 16 | 0;
               $2 = $2 + 1 | 0;
               if (($3 | 0) != ($2 | 0)) {
                continue
               }
               break;
              };
              break label$6;
             }
             if (!$3) {
              break label$6
             }
             $12 = HEAP32[$1 + 20 >> 2];
             $7 = HEAP32[$1 + 16 >> 2];
             $10 = HEAP32[$1 + 12 >> 2];
             $6 = HEAP32[$1 + 8 >> 2];
             $4 = HEAP32[$1 + 4 >> 2];
             $1 = HEAP32[$1 >> 2];
             $2 = 0;
             while (1) {
              $8 = $2 << 2;
              HEAP16[$5 >> 1] = HEAP32[$8 + $1 >> 2];
              HEAP16[$5 + 2 >> 1] = HEAP32[$4 + $8 >> 2];
              HEAP16[$5 + 4 >> 1] = HEAP32[$6 + $8 >> 2];
              HEAP16[$5 + 6 >> 1] = HEAP32[$8 + $10 >> 2];
              HEAP16[$5 + 8 >> 1] = HEAP32[$7 + $8 >> 2];
              HEAP16[$5 + 10 >> 1] = HEAP32[$8 + $12 >> 2];
              $5 = $5 + 12 | 0;
              $2 = $2 + 1 | 0;
              if (($3 | 0) != ($2 | 0)) {
               continue
              }
              break;
             };
             break label$6;
            }
            if (!$3) {
             break label$6
            }
            $10 = HEAP32[$1 + 12 >> 2];
            $6 = HEAP32[$1 + 8 >> 2];
            $4 = HEAP32[$1 + 4 >> 2];
            $1 = HEAP32[$1 >> 2];
            $2 = 0;
            while (1) {
             $7 = $2 << 2;
             HEAP16[$5 >> 1] = HEAP32[$7 + $1 >> 2];
             HEAP16[$5 + 2 >> 1] = HEAP32[$4 + $7 >> 2];
             HEAP16[$5 + 4 >> 1] = HEAP32[$6 + $7 >> 2];
             HEAP16[$5 + 6 >> 1] = HEAP32[$7 + $10 >> 2];
             $5 = $5 + 8 | 0;
             $2 = $2 + 1 | 0;
             if (($3 | 0) != ($2 | 0)) {
              continue
             }
             break;
            };
            break label$6;
           }
           if (!$3) {
            break label$6
           }
           $6 = HEAP32[$1 + 4 >> 2];
           $4 = HEAP32[$1 >> 2];
           $1 = 0;
           while (1) {
            $2 = $1 << 2;
            HEAP16[$5 >> 1] = HEAP32[$2 + $4 >> 2];
            HEAP16[$5 + 2 >> 1] = HEAP32[$2 + $6 >> 2];
            $5 = $5 + 4 | 0;
            $1 = $1 + 1 | 0;
            if (($3 | 0) != ($1 | 0)) {
             continue
            }
            break;
           };
           break label$6;
          }
          if (!$3) {
           break label$6
          }
          $2 = HEAP32[$1 >> 2];
          $1 = 0;
          while (1) {
           HEAP16[$5 >> 1] = HEAP32[$2 + ($1 << 2) >> 2];
           $5 = $5 + 2 | 0;
           $1 = $1 + 1 | 0;
           if (($3 | 0) != ($1 | 0)) {
            continue
           }
           break;
          };
          break label$6;
         }
         if (!$3) {
          break label$6
         }
         $4 = 0;
         while (1) {
          $2 = $4 << 2;
          HEAP8[$5 | 0] = HEAP32[$2 + HEAP32[$1 >> 2] >> 2];
          HEAP8[$5 + 1 | 0] = HEAP32[$2 + HEAP32[$1 + 4 >> 2] >> 2];
          HEAP8[$5 + 2 | 0] = HEAP32[$2 + HEAP32[$1 + 8 >> 2] >> 2];
          HEAP8[$5 + 3 | 0] = HEAP32[$2 + HEAP32[$1 + 12 >> 2] >> 2];
          HEAP8[$5 + 4 | 0] = HEAP32[$2 + HEAP32[$1 + 16 >> 2] >> 2];
          HEAP8[$5 + 5 | 0] = HEAP32[$2 + HEAP32[$1 + 20 >> 2] >> 2];
          HEAP8[$5 + 6 | 0] = HEAP32[$2 + HEAP32[$1 + 24 >> 2] >> 2];
          HEAP8[$5 + 7 | 0] = HEAP32[$2 + HEAP32[$1 + 28 >> 2] >> 2];
          $5 = $5 + 8 | 0;
          $4 = $4 + 1 | 0;
          if (($4 | 0) != ($3 | 0)) {
           continue
          }
          break;
         };
         break label$6;
        }
        if (!$3) {
         break label$6
        }
        $4 = 0;
        while (1) {
         $2 = $4 << 2;
         HEAP8[$5 | 0] = HEAP32[$2 + HEAP32[$1 >> 2] >> 2];
         HEAP8[$5 + 1 | 0] = HEAP32[$2 + HEAP32[$1 + 4 >> 2] >> 2];
         HEAP8[$5 + 2 | 0] = HEAP32[$2 + HEAP32[$1 + 8 >> 2] >> 2];
         HEAP8[$5 + 3 | 0] = HEAP32[$2 + HEAP32[$1 + 12 >> 2] >> 2];
         HEAP8[$5 + 4 | 0] = HEAP32[$2 + HEAP32[$1 + 16 >> 2] >> 2];
         HEAP8[$5 + 5 | 0] = HEAP32[$2 + HEAP32[$1 + 20 >> 2] >> 2];
         $5 = $5 + 6 | 0;
         $4 = $4 + 1 | 0;
         if (($4 | 0) != ($3 | 0)) {
          continue
         }
         break;
        };
        break label$6;
       }
       if (!$3) {
        break label$6
       }
       $4 = 0;
       while (1) {
        $2 = $4 << 2;
        HEAP8[$5 | 0] = HEAP32[$2 + HEAP32[$1 >> 2] >> 2];
        HEAP8[$5 + 1 | 0] = HEAP32[$2 + HEAP32[$1 + 4 >> 2] >> 2];
        HEAP8[$5 + 2 | 0] = HEAP32[$2 + HEAP32[$1 + 8 >> 2] >> 2];
        HEAP8[$5 + 3 | 0] = HEAP32[$2 + HEAP32[$1 + 12 >> 2] >> 2];
        $5 = $5 + 4 | 0;
        $4 = $4 + 1 | 0;
        if (($4 | 0) != ($3 | 0)) {
         continue
        }
        break;
       };
       break label$6;
      }
      if (!$3) {
       break label$6
      }
      $2 = 0;
      while (1) {
       $4 = $2 << 2;
       HEAP8[$5 | 0] = HEAP32[$4 + HEAP32[$1 >> 2] >> 2];
       HEAP8[$5 + 1 | 0] = HEAP32[$4 + HEAP32[$1 + 4 >> 2] >> 2];
       $5 = $5 + 2 | 0;
       $2 = $2 + 1 | 0;
       if (($3 | 0) != ($2 | 0)) {
        continue
       }
       break;
      };
      break label$6;
     }
     if (!$3) {
      break label$6
     }
     $2 = 0;
     while (1) {
      HEAP8[$5 | 0] = HEAP32[HEAP32[$1 >> 2] + ($2 << 2) >> 2];
      $5 = $5 + 1 | 0;
      $2 = $2 + 1 | 0;
      if (($3 | 0) != ($2 | 0)) {
       continue
      }
      break;
     };
     break label$6;
    }
    label$45 : {
     switch ($4 + -1 | 0) {
     case 3:
      if (!$2 | !$3) {
       break label$6
      }
      $6 = 0;
      while (1) {
       $4 = 0;
       while (1) {
        HEAP32[$5 >> 2] = HEAP32[HEAP32[($4 << 2) + $1 >> 2] + ($6 << 2) >> 2];
        $5 = $5 + 4 | 0;
        $4 = $4 + 1 | 0;
        if (($4 | 0) != ($2 | 0)) {
         continue
        }
        break;
       };
       $6 = $6 + 1 | 0;
       if (($6 | 0) != ($3 | 0)) {
        continue
       }
       break;
      };
      break label$6;
     case 2:
      if (!$2 | !$3) {
       break label$6
      }
      while (1) {
       $4 = 0;
       while (1) {
        $6 = HEAP32[HEAP32[($4 << 2) + $1 >> 2] + ($10 << 2) >> 2];
        HEAP8[$5 | 0] = $6;
        HEAP8[$5 + 2 | 0] = $6 >>> 16;
        HEAP8[$5 + 1 | 0] = $6 >>> 8;
        $5 = $5 + 3 | 0;
        $4 = $4 + 1 | 0;
        if (($4 | 0) != ($2 | 0)) {
         continue
        }
        break;
       };
       $10 = $10 + 1 | 0;
       if (($10 | 0) != ($3 | 0)) {
        continue
       }
       break;
      };
      break label$6;
     case 1:
      if (!$2 | !$3) {
       break label$6
      }
      $6 = 0;
      while (1) {
       $4 = 0;
       while (1) {
        HEAP16[$5 >> 1] = HEAP32[HEAP32[($4 << 2) + $1 >> 2] + ($6 << 2) >> 2];
        $5 = $5 + 2 | 0;
        $4 = $4 + 1 | 0;
        if (($4 | 0) != ($2 | 0)) {
         continue
        }
        break;
       };
       $6 = $6 + 1 | 0;
       if (($6 | 0) != ($3 | 0)) {
        continue
       }
       break;
      };
      break label$6;
     case 0:
      break label$45;
     default:
      break label$6;
     };
    }
    if (!$2 | !$3) {
     break label$6
    }
    $6 = 0;
    while (1) {
     $4 = 0;
     while (1) {
      HEAP8[$5 | 0] = HEAP32[HEAP32[($4 << 2) + $1 >> 2] + ($6 << 2) >> 2];
      $5 = $5 + 1 | 0;
      $4 = $4 + 1 | 0;
      if (($4 | 0) != ($2 | 0)) {
       continue
      }
      break;
     };
     $6 = $6 + 1 | 0;
     if (($6 | 0) != ($3 | 0)) {
      continue
     }
     break;
    };
   }
   $2 = HEAP32[$0 + 80 >> 2];
   $1 = $2 + $11 | 0;
   HEAP32[$0 + 80 >> 2] = $1;
   $3 = HEAP32[$0 + 88 >> 2];
   if ($1 >>> 0 < $2 >>> 0) {
    $1 = $0 + 84 | 0;
    HEAP32[$1 >> 2] = HEAP32[$1 >> 2] + 1;
   }
   $4 = 64 - ($2 & 63) | 0;
   $1 = ($0 - $4 | 0) - -64 | 0;
   label$58 : {
    if ($11 >>> 0 < $4 >>> 0) {
     memcpy($1, $3, $11);
     break label$58;
    }
    memcpy($1, $3, $4);
    $2 = $0 - -64 | 0;
    FLAC__MD5Transform($2, $0);
    $5 = $3 + $4 | 0;
    $1 = $11 - $4 | 0;
    if ($1 >>> 0 >= 64) {
     while (1) {
      $4 = HEAPU8[$5 + 4 | 0] | HEAPU8[$5 + 5 | 0] << 8 | (HEAPU8[$5 + 6 | 0] << 16 | HEAPU8[$5 + 7 | 0] << 24);
      $3 = HEAPU8[$5 | 0] | HEAPU8[$5 + 1 | 0] << 8 | (HEAPU8[$5 + 2 | 0] << 16 | HEAPU8[$5 + 3 | 0] << 24);
      HEAP8[$0 | 0] = $3;
      HEAP8[$0 + 1 | 0] = $3 >>> 8;
      HEAP8[$0 + 2 | 0] = $3 >>> 16;
      HEAP8[$0 + 3 | 0] = $3 >>> 24;
      HEAP8[$0 + 4 | 0] = $4;
      HEAP8[$0 + 5 | 0] = $4 >>> 8;
      HEAP8[$0 + 6 | 0] = $4 >>> 16;
      HEAP8[$0 + 7 | 0] = $4 >>> 24;
      $4 = HEAPU8[$5 + 60 | 0] | HEAPU8[$5 + 61 | 0] << 8 | (HEAPU8[$5 + 62 | 0] << 16 | HEAPU8[$5 + 63 | 0] << 24);
      $3 = HEAPU8[$5 + 56 | 0] | HEAPU8[$5 + 57 | 0] << 8 | (HEAPU8[$5 + 58 | 0] << 16 | HEAPU8[$5 + 59 | 0] << 24);
      HEAP8[$0 + 56 | 0] = $3;
      HEAP8[$0 + 57 | 0] = $3 >>> 8;
      HEAP8[$0 + 58 | 0] = $3 >>> 16;
      HEAP8[$0 + 59 | 0] = $3 >>> 24;
      HEAP8[$0 + 60 | 0] = $4;
      HEAP8[$0 + 61 | 0] = $4 >>> 8;
      HEAP8[$0 + 62 | 0] = $4 >>> 16;
      HEAP8[$0 + 63 | 0] = $4 >>> 24;
      $4 = HEAPU8[$5 + 52 | 0] | HEAPU8[$5 + 53 | 0] << 8 | (HEAPU8[$5 + 54 | 0] << 16 | HEAPU8[$5 + 55 | 0] << 24);
      $3 = HEAPU8[$5 + 48 | 0] | HEAPU8[$5 + 49 | 0] << 8 | (HEAPU8[$5 + 50 | 0] << 16 | HEAPU8[$5 + 51 | 0] << 24);
      HEAP8[$0 + 48 | 0] = $3;
      HEAP8[$0 + 49 | 0] = $3 >>> 8;
      HEAP8[$0 + 50 | 0] = $3 >>> 16;
      HEAP8[$0 + 51 | 0] = $3 >>> 24;
      HEAP8[$0 + 52 | 0] = $4;
      HEAP8[$0 + 53 | 0] = $4 >>> 8;
      HEAP8[$0 + 54 | 0] = $4 >>> 16;
      HEAP8[$0 + 55 | 0] = $4 >>> 24;
      $4 = HEAPU8[$5 + 44 | 0] | HEAPU8[$5 + 45 | 0] << 8 | (HEAPU8[$5 + 46 | 0] << 16 | HEAPU8[$5 + 47 | 0] << 24);
      $3 = HEAPU8[$5 + 40 | 0] | HEAPU8[$5 + 41 | 0] << 8 | (HEAPU8[$5 + 42 | 0] << 16 | HEAPU8[$5 + 43 | 0] << 24);
      HEAP8[$0 + 40 | 0] = $3;
      HEAP8[$0 + 41 | 0] = $3 >>> 8;
      HEAP8[$0 + 42 | 0] = $3 >>> 16;
      HEAP8[$0 + 43 | 0] = $3 >>> 24;
      HEAP8[$0 + 44 | 0] = $4;
      HEAP8[$0 + 45 | 0] = $4 >>> 8;
      HEAP8[$0 + 46 | 0] = $4 >>> 16;
      HEAP8[$0 + 47 | 0] = $4 >>> 24;
      $4 = HEAPU8[$5 + 36 | 0] | HEAPU8[$5 + 37 | 0] << 8 | (HEAPU8[$5 + 38 | 0] << 16 | HEAPU8[$5 + 39 | 0] << 24);
      $3 = HEAPU8[$5 + 32 | 0] | HEAPU8[$5 + 33 | 0] << 8 | (HEAPU8[$5 + 34 | 0] << 16 | HEAPU8[$5 + 35 | 0] << 24);
      HEAP8[$0 + 32 | 0] = $3;
      HEAP8[$0 + 33 | 0] = $3 >>> 8;
      HEAP8[$0 + 34 | 0] = $3 >>> 16;
      HEAP8[$0 + 35 | 0] = $3 >>> 24;
      HEAP8[$0 + 36 | 0] = $4;
      HEAP8[$0 + 37 | 0] = $4 >>> 8;
      HEAP8[$0 + 38 | 0] = $4 >>> 16;
      HEAP8[$0 + 39 | 0] = $4 >>> 24;
      $4 = HEAPU8[$5 + 28 | 0] | HEAPU8[$5 + 29 | 0] << 8 | (HEAPU8[$5 + 30 | 0] << 16 | HEAPU8[$5 + 31 | 0] << 24);
      $3 = HEAPU8[$5 + 24 | 0] | HEAPU8[$5 + 25 | 0] << 8 | (HEAPU8[$5 + 26 | 0] << 16 | HEAPU8[$5 + 27 | 0] << 24);
      HEAP8[$0 + 24 | 0] = $3;
      HEAP8[$0 + 25 | 0] = $3 >>> 8;
      HEAP8[$0 + 26 | 0] = $3 >>> 16;
      HEAP8[$0 + 27 | 0] = $3 >>> 24;
      HEAP8[$0 + 28 | 0] = $4;
      HEAP8[$0 + 29 | 0] = $4 >>> 8;
      HEAP8[$0 + 30 | 0] = $4 >>> 16;
      HEAP8[$0 + 31 | 0] = $4 >>> 24;
      $4 = HEAPU8[$5 + 20 | 0] | HEAPU8[$5 + 21 | 0] << 8 | (HEAPU8[$5 + 22 | 0] << 16 | HEAPU8[$5 + 23 | 0] << 24);
      $3 = HEAPU8[$5 + 16 | 0] | HEAPU8[$5 + 17 | 0] << 8 | (HEAPU8[$5 + 18 | 0] << 16 | HEAPU8[$5 + 19 | 0] << 24);
      HEAP8[$0 + 16 | 0] = $3;
      HEAP8[$0 + 17 | 0] = $3 >>> 8;
      HEAP8[$0 + 18 | 0] = $3 >>> 16;
      HEAP8[$0 + 19 | 0] = $3 >>> 24;
      HEAP8[$0 + 20 | 0] = $4;
      HEAP8[$0 + 21 | 0] = $4 >>> 8;
      HEAP8[$0 + 22 | 0] = $4 >>> 16;
      HEAP8[$0 + 23 | 0] = $4 >>> 24;
      $4 = HEAPU8[$5 + 12 | 0] | HEAPU8[$5 + 13 | 0] << 8 | (HEAPU8[$5 + 14 | 0] << 16 | HEAPU8[$5 + 15 | 0] << 24);
      $3 = HEAPU8[$5 + 8 | 0] | HEAPU8[$5 + 9 | 0] << 8 | (HEAPU8[$5 + 10 | 0] << 16 | HEAPU8[$5 + 11 | 0] << 24);
      HEAP8[$0 + 8 | 0] = $3;
      HEAP8[$0 + 9 | 0] = $3 >>> 8;
      HEAP8[$0 + 10 | 0] = $3 >>> 16;
      HEAP8[$0 + 11 | 0] = $3 >>> 24;
      HEAP8[$0 + 12 | 0] = $4;
      HEAP8[$0 + 13 | 0] = $4 >>> 8;
      HEAP8[$0 + 14 | 0] = $4 >>> 16;
      HEAP8[$0 + 15 | 0] = $4 >>> 24;
      FLAC__MD5Transform($2, $0);
      $5 = $5 - -64 | 0;
      $1 = $1 + -64 | 0;
      if ($1 >>> 0 > 63) {
       continue
      }
      break;
     }
    }
    memcpy($0, $5, $1);
   }
   $5 = 1;
  }
  return $5;
 }
 
 function __stdio_close($0) {
  $0 = $0 | 0;
  return __wasi_fd_close(HEAP32[$0 + 60 >> 2]) | 0;
 }
 
 function __wasi_syscall_ret($0) {
  if (!$0) {
   return 0
  }
  HEAP32[2892] = $0;
  return -1;
 }
 
 function __stdio_read($0, $1, $2) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  var $3 = 0, $4 = 0, $5 = 0, $6 = 0;
  $3 = global$0 - 32 | 0;
  global$0 = $3;
  HEAP32[$3 + 16 >> 2] = $1;
  $4 = HEAP32[$0 + 48 >> 2];
  HEAP32[$3 + 20 >> 2] = $2 - (($4 | 0) != 0);
  $5 = HEAP32[$0 + 44 >> 2];
  HEAP32[$3 + 28 >> 2] = $4;
  HEAP32[$3 + 24 >> 2] = $5;
  label$1 : {
   label$2 : {
    label$3 : {
     if (__wasi_syscall_ret(__wasi_fd_read(HEAP32[$0 + 60 >> 2], $3 + 16 | 0, 2, $3 + 12 | 0) | 0)) {
      HEAP32[$3 + 12 >> 2] = -1;
      $2 = -1;
      break label$3;
     }
     $4 = HEAP32[$3 + 12 >> 2];
     if (($4 | 0) > 0) {
      break label$2
     }
     $2 = $4;
    }
    HEAP32[$0 >> 2] = HEAP32[$0 >> 2] | $2 & 48 ^ 16;
    break label$1;
   }
   $6 = HEAP32[$3 + 20 >> 2];
   if ($4 >>> 0 <= $6 >>> 0) {
    $2 = $4;
    break label$1;
   }
   $5 = HEAP32[$0 + 44 >> 2];
   HEAP32[$0 + 4 >> 2] = $5;
   HEAP32[$0 + 8 >> 2] = $5 + ($4 - $6 | 0);
   if (!HEAP32[$0 + 48 >> 2]) {
    break label$1
   }
   HEAP32[$0 + 4 >> 2] = $5 + 1;
   HEAP8[($1 + $2 | 0) + -1 | 0] = HEAPU8[$5 | 0];
  }
  global$0 = $3 + 32 | 0;
  return $2 | 0;
 }
 
 function __stdio_seek($0, $1, $2, $3) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  var $4 = 0;
  $4 = global$0 - 16 | 0;
  global$0 = $4;
  label$1 : {
   if (!__wasi_syscall_ret(legalimport$__wasi_fd_seek(HEAP32[$0 + 60 >> 2], $1 | 0, $2 | 0, $3 & 255, $4 + 8 | 0) | 0)) {
    $1 = HEAP32[$4 + 12 >> 2];
    $0 = HEAP32[$4 + 8 >> 2];
    break label$1;
   }
   HEAP32[$4 + 8 >> 2] = -1;
   HEAP32[$4 + 12 >> 2] = -1;
   $1 = -1;
   $0 = -1;
  }
  global$0 = $4 + 16 | 0;
  i64toi32_i32$HIGH_BITS = $1;
  return $0 | 0;
 }
 
 function fflush($0) {
  var $1 = 0;
  if ($0) {
   if (HEAP32[$0 + 76 >> 2] <= -1) {
    return __fflush_unlocked($0)
   }
   return __fflush_unlocked($0);
  }
  if (HEAP32[2790]) {
   $1 = fflush(HEAP32[2790])
  }
  $0 = HEAP32[3019];
  if ($0) {
   while (1) {
    if (HEAPU32[$0 + 20 >> 2] > HEAPU32[$0 + 28 >> 2]) {
     $1 = __fflush_unlocked($0) | $1
    }
    $0 = HEAP32[$0 + 56 >> 2];
    if ($0) {
     continue
    }
    break;
   }
  }
  return $1;
 }
 
 function __fflush_unlocked($0) {
  var $1 = 0, $2 = 0;
  label$1 : {
   if (HEAPU32[$0 + 20 >> 2] <= HEAPU32[$0 + 28 >> 2]) {
    break label$1
   }
   FUNCTION_TABLE[HEAP32[$0 + 36 >> 2]]($0, 0, 0) | 0;
   if (HEAP32[$0 + 20 >> 2]) {
    break label$1
   }
   return -1;
  }
  $1 = HEAP32[$0 + 4 >> 2];
  $2 = HEAP32[$0 + 8 >> 2];
  if ($1 >>> 0 < $2 >>> 0) {
   $1 = $1 - $2 | 0;
   FUNCTION_TABLE[HEAP32[$0 + 40 >> 2]]($0, $1, $1 >> 31, 1) | 0;
  }
  HEAP32[$0 + 28 >> 2] = 0;
  HEAP32[$0 + 16 >> 2] = 0;
  HEAP32[$0 + 20 >> 2] = 0;
  HEAP32[$0 + 4 >> 2] = 0;
  HEAP32[$0 + 8 >> 2] = 0;
  return 0;
 }
 
 function fclose($0) {
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0;
  $4 = HEAP32[$0 + 76 >> 2] >= 0 ? 1 : 0;
  $3 = HEAP32[$0 >> 2] & 1;
  if (!$3) {
   $1 = HEAP32[$0 + 52 >> 2];
   if ($1) {
    HEAP32[$1 + 56 >> 2] = HEAP32[$0 + 56 >> 2]
   }
   $2 = HEAP32[$0 + 56 >> 2];
   if ($2) {
    HEAP32[$2 + 52 >> 2] = $1
   }
   if (HEAP32[3019] == ($0 | 0)) {
    HEAP32[3019] = $2
   }
  }
  fflush($0);
  FUNCTION_TABLE[HEAP32[$0 + 12 >> 2]]($0) | 0;
  $1 = HEAP32[$0 + 96 >> 2];
  if ($1) {
   dlfree($1)
  }
  label$7 : {
   if (!$3) {
    dlfree($0);
    break label$7;
   }
   if (!$4) {
    break label$7
   }
  }
 }
 
 function memcmp($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0;
  label$1 : {
   if (!$2) {
    break label$1
   }
   while (1) {
    $3 = HEAPU8[$0 | 0];
    $4 = HEAPU8[$1 | 0];
    if (($3 | 0) == ($4 | 0)) {
     $1 = $1 + 1 | 0;
     $0 = $0 + 1 | 0;
     $2 = $2 + -1 | 0;
     if ($2) {
      continue
     }
     break label$1;
    }
    break;
   };
   $5 = $3 - $4 | 0;
  }
  return $5;
 }
 
 function FLAC__cpu_info($0) {
  HEAP32[$0 + 8 >> 2] = 0;
  HEAP32[$0 + 12 >> 2] = 0;
  HEAP32[$0 >> 2] = 0;
  HEAP32[$0 + 4 >> 2] = 3;
  HEAP32[$0 + 56 >> 2] = 0;
  HEAP32[$0 + 60 >> 2] = 0;
  HEAP32[$0 + 48 >> 2] = 0;
  HEAP32[$0 + 52 >> 2] = 0;
  HEAP32[$0 + 40 >> 2] = 0;
  HEAP32[$0 + 44 >> 2] = 0;
  HEAP32[$0 + 32 >> 2] = 0;
  HEAP32[$0 + 36 >> 2] = 0;
  HEAP32[$0 + 24 >> 2] = 0;
  HEAP32[$0 + 28 >> 2] = 0;
  HEAP32[$0 + 16 >> 2] = 0;
  HEAP32[$0 + 20 >> 2] = 0;
 }
 
 function lround($0) {
  $0 = +round(+$0);
  if (Math_abs($0) < 2147483648.0) {
   return ~~$0
  }
  return -2147483648;
 }
 
 function log($0) {
  var $1 = 0, $2 = 0.0, $3 = 0, $4 = 0.0, $5 = 0, $6 = 0, $7 = 0.0, $8 = 0.0, $9 = 0.0, $10 = 0.0;
  label$1 : {
   label$2 : {
    label$3 : {
     label$4 : {
      wasm2js_scratch_store_f64(+$0);
      $1 = wasm2js_scratch_load_i32(1) | 0;
      $3 = wasm2js_scratch_load_i32(0) | 0;
      if (($1 | 0) > 0 ? 1 : ($1 | 0) >= 0 ? ($3 >>> 0 < 0 ? 0 : 1) : 0) {
       $5 = $1;
       if ($1 >>> 0 > 1048575) {
        break label$4
       }
      }
      if (!($1 & 2147483647 | $3)) {
       return -1.0 / ($0 * $0)
      }
      if (($1 | 0) > -1 ? 1 : ($1 | 0) >= -1 ? ($3 >>> 0 <= 4294967295 ? 0 : 1) : 0) {
       break label$3
      }
      return ($0 - $0) / 0.0;
     }
     if ($5 >>> 0 > 2146435071) {
      break label$1
     }
     $1 = 1072693248;
     $6 = -1023;
     if (($5 | 0) != 1072693248) {
      $1 = $5;
      break label$2;
     }
     if ($3) {
      break label$2
     }
     return 0.0;
    }
    wasm2js_scratch_store_f64(+($0 * 18014398509481984.0));
    $1 = wasm2js_scratch_load_i32(1) | 0;
    $3 = wasm2js_scratch_load_i32(0) | 0;
    $6 = -1077;
   }
   $1 = $1 + 614242 | 0;
   $4 = +(($1 >>> 20 | 0) + $6 | 0);
   wasm2js_scratch_store_i32(0, $3 | 0);
   wasm2js_scratch_store_i32(1, ($1 & 1048575) + 1072079006 | 0);
   $0 = +wasm2js_scratch_load_f64() + -1.0;
   $2 = $0 / ($0 + 2.0);
   $7 = $4 * .6931471803691238;
   $8 = $0;
   $9 = $4 * 1.9082149292705877e-10;
   $10 = $2;
   $4 = $0 * ($0 * .5);
   $2 = $2 * $2;
   $0 = $2 * $2;
   $0 = $7 + ($8 + ($9 + $10 * ($4 + ($0 * ($0 * ($0 * .15313837699209373 + .22222198432149784) + .3999999999940942) + $2 * ($0 * ($0 * ($0 * .14798198605116586 + .1818357216161805) + .2857142874366239) + .6666666666666735))) - $4));
  }
  return $0;
 }
 
 function FLAC__lpc_window_data($0, $1, $2, $3) {
  var $4 = 0, $5 = 0;
  if ($3) {
   while (1) {
    $5 = $4 << 2;
    HEAPF32[$5 + $2 >> 2] = HEAPF32[$1 + $5 >> 2] * Math_fround(HEAP32[$0 + $5 >> 2]);
    $4 = $4 + 1 | 0;
    if (($4 | 0) != ($3 | 0)) {
     continue
    }
    break;
   }
  }
 }
 
 function FLAC__lpc_compute_autocorrelation($0, $1, $2, $3) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  var $4 = 0, $5 = 0, $6 = 0, $7 = Math_fround(0), $8 = 0, $9 = 0;
  $6 = $1 - $2 | 0;
  label$1 : {
   if (!$2) {
    while (1) {
     $4 = $4 + 1 | 0;
     if ($4 >>> 0 <= $6 >>> 0) {
      continue
     }
     break;
    };
    break label$1;
   }
   $9 = memset($3, $2 << 2);
   while (1) {
    $7 = HEAPF32[($4 << 2) + $0 >> 2];
    $5 = 0;
    while (1) {
     $8 = ($5 << 2) + $9 | 0;
     HEAPF32[$8 >> 2] = HEAPF32[$8 >> 2] + Math_fround($7 * HEAPF32[($4 + $5 << 2) + $0 >> 2]);
     $5 = $5 + 1 | 0;
     if (($5 | 0) != ($2 | 0)) {
      continue
     }
     break;
    };
    $4 = $4 + 1 | 0;
    if ($4 >>> 0 <= $6 >>> 0) {
     continue
    }
    break;
   };
  }
  if ($4 >>> 0 < $1 >>> 0) {
   while (1) {
    $2 = $1 - $4 | 0;
    if ($2) {
     $7 = HEAPF32[($4 << 2) + $0 >> 2];
     $5 = 0;
     while (1) {
      $6 = ($5 << 2) + $3 | 0;
      HEAPF32[$6 >> 2] = HEAPF32[$6 >> 2] + Math_fround($7 * HEAPF32[($4 + $5 << 2) + $0 >> 2]);
      $5 = $5 + 1 | 0;
      if ($5 >>> 0 < $2 >>> 0) {
       continue
      }
      break;
     };
    }
    $4 = $4 + 1 | 0;
    if (($4 | 0) != ($1 | 0)) {
     continue
    }
    break;
   }
  }
 }
 
 function FLAC__lpc_compute_lp_coefficients($0, $1, $2, $3) {
  var $4 = 0, $5 = 0, $6 = 0.0, $7 = 0, $8 = 0, $9 = 0.0, $10 = 0.0, $11 = 0, $12 = 0, $13 = 0, $14 = 0;
  $7 = global$0 - 256 | 0;
  global$0 = $7;
  $13 = HEAP32[$1 >> 2];
  $10 = +HEAPF32[$0 >> 2];
  label$1 : {
   while (1) {
    if (($5 | 0) == ($13 | 0)) {
     break label$1
    }
    $11 = $5 + 1 | 0;
    $6 = +Math_fround(-HEAPF32[($11 << 2) + $0 >> 2]);
    label$3 : {
     if ($5) {
      $12 = $5 >>> 1 | 0;
      $4 = 0;
      while (1) {
       $6 = $6 - HEAPF64[($4 << 3) + $7 >> 3] * +HEAPF32[($5 - $4 << 2) + $0 >> 2];
       $4 = $4 + 1 | 0;
       if (($5 | 0) != ($4 | 0)) {
        continue
       }
       break;
      };
      $6 = $6 / $10;
      HEAPF64[($5 << 3) + $7 >> 3] = $6;
      $4 = 0;
      if ($12) {
       while (1) {
        $8 = ($4 << 3) + $7 | 0;
        $9 = HEAPF64[$8 >> 3];
        $14 = $8;
        $8 = (($4 ^ -1) + $5 << 3) + $7 | 0;
        HEAPF64[$14 >> 3] = $9 + $6 * HEAPF64[$8 >> 3];
        HEAPF64[$8 >> 3] = $6 * $9 + HEAPF64[$8 >> 3];
        $4 = $4 + 1 | 0;
        if (($12 | 0) != ($4 | 0)) {
         continue
        }
        break;
       }
      }
      if (!($5 & 1)) {
       break label$3
      }
      $8 = ($12 << 3) + $7 | 0;
      $9 = HEAPF64[$8 >> 3];
      HEAPF64[$8 >> 3] = $9 + $6 * $9;
      break label$3;
     }
     $6 = $6 / $10;
     HEAPF64[($5 << 3) + $7 >> 3] = $6;
    }
    $9 = 1.0 - $6 * $6;
    $4 = 0;
    while (1) {
     HEAPF32[(($5 << 7) + $2 | 0) + ($4 << 2) >> 2] = -Math_fround(HEAPF64[($4 << 3) + $7 >> 3]);
     $4 = $4 + 1 | 0;
     if ($4 >>> 0 <= $5 >>> 0) {
      continue
     }
     break;
    };
    $10 = $10 * $9;
    HEAPF64[($5 << 3) + $3 >> 3] = $10;
    $5 = $11;
    if ($10 != 0.0) {
     continue
    }
    break;
   };
   HEAP32[$1 >> 2] = $11;
  }
  global$0 = $7 + 256 | 0;
 }
 
 function FLAC__lpc_quantize_coefficients($0, $1, $2, $3, $4) {
  var $5 = 0, $6 = 0.0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0.0, $12 = 0, $13 = 0, $14 = Math_fround(0);
  $8 = global$0 - 16 | 0;
  global$0 = $8;
  label$1 : {
   if (!$1) {
    $7 = 2;
    break label$1;
   }
   $5 = $2 + -1 | 0;
   $2 = 0;
   while (1) {
    $11 = +Math_fround(Math_abs(HEAPF32[($2 << 2) + $0 >> 2]));
    $6 = $6 < $11 ? $11 : $6;
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
   $7 = 2;
   if ($6 <= 0.0) {
    break label$1
   }
   $9 = 1 << $5;
   $12 = $9 + -1 | 0;
   $10 = 0 - $9 | 0;
   frexp($6, $8 + 12 | 0);
   $2 = HEAP32[$8 + 12 >> 2];
   HEAP32[$8 + 12 >> 2] = $2 + -1;
   $5 = $5 - $2 | 0;
   HEAP32[$4 >> 2] = $5;
   label$4 : {
    $7 = -1 << HEAP32[1670] + -1;
    $2 = $7 ^ -1;
    if (($5 | 0) > ($2 | 0)) {
     HEAP32[$4 >> 2] = $2;
     $5 = $2;
     break label$4;
    }
    if (($5 | 0) >= ($7 | 0)) {
     break label$4
    }
    $7 = 1;
    break label$1;
   }
   $7 = 0;
   if (($5 | 0) >= 0) {
    if (!$1) {
     break label$1
    }
    $6 = 0.0;
    $2 = 0;
    while (1) {
     $13 = $2 << 2;
     $6 = $6 + +Math_fround(HEAPF32[$13 + $0 >> 2] * Math_fround(1 << $5));
     $5 = lround($6);
     $5 = ($5 | 0) < ($9 | 0) ? (($5 | 0) < ($10 | 0) ? $10 : $5) : $12;
     HEAP32[$3 + $13 >> 2] = $5;
     $2 = $2 + 1 | 0;
     if (($2 | 0) == ($1 | 0)) {
      break label$1
     }
     $6 = $6 - +($5 | 0);
     $5 = HEAP32[$4 >> 2];
     continue;
    };
   }
   if ($1) {
    $2 = 0;
    $14 = Math_fround(1 << 0 - $5);
    $6 = 0.0;
    while (1) {
     $7 = $2 << 2;
     $6 = $6 + +Math_fround(HEAPF32[$7 + $0 >> 2] / $14);
     $5 = lround($6);
     $5 = ($5 | 0) < ($9 | 0) ? (($5 | 0) < ($10 | 0) ? $10 : $5) : $12;
     HEAP32[$3 + $7 >> 2] = $5;
     $6 = $6 - +($5 | 0);
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
   }
   $7 = 0;
   HEAP32[$4 >> 2] = 0;
  }
  global$0 = $8 + 16 | 0;
  return $7;
 }
 
 function FLAC__lpc_compute_residual_from_qlp_coefficients($0, $1, $2, $3, $4, $5) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $4 = $4 | 0;
  $5 = $5 | 0;
  var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $30 = 0;
  label$1 : {
   if ($3 >>> 0 >= 13) {
    if (($1 | 0) < 1) {
     break label$1
    }
    $25 = $3 + -13 | 0;
    while (1) {
     $17 = 0;
     $20 = 0;
     $19 = 0;
     $22 = 0;
     $21 = 0;
     $24 = 0;
     $23 = 0;
     $26 = 0;
     $18 = 0;
     $16 = 0;
     $15 = 0;
     $14 = 0;
     $13 = 0;
     $12 = 0;
     $11 = 0;
     $10 = 0;
     $9 = 0;
     $8 = 0;
     $7 = 0;
     $3 = 0;
     label$4 : {
      switch ($25 | 0) {
      case 19:
       $17 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -128 >> 2], HEAP32[$2 + 124 >> 2]);
      case 18:
       $20 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -124 >> 2], HEAP32[$2 + 120 >> 2]) + $17 | 0;
      case 17:
       $19 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -120 >> 2], HEAP32[$2 + 116 >> 2]) + $20 | 0;
      case 16:
       $22 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -116 >> 2], HEAP32[$2 + 112 >> 2]) + $19 | 0;
      case 15:
       $21 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -112 >> 2], HEAP32[$2 + 108 >> 2]) + $22 | 0;
      case 14:
       $24 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -108 >> 2], HEAP32[$2 + 104 >> 2]) + $21 | 0;
      case 13:
       $23 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -104 >> 2], HEAP32[$2 + 100 >> 2]) + $24 | 0;
      case 12:
       $26 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -100 >> 2], HEAP32[$2 + 96 >> 2]) + $23 | 0;
      case 11:
       $18 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -96 >> 2], HEAP32[$2 + 92 >> 2]) + $26 | 0;
      case 10:
       $16 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -92 >> 2], HEAP32[$2 + 88 >> 2]) + $18 | 0;
      case 9:
       $15 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -88 >> 2], HEAP32[$2 + 84 >> 2]) + $16 | 0;
      case 8:
       $14 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -84 >> 2], HEAP32[$2 + 80 >> 2]) + $15 | 0;
      case 7:
       $13 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -80 >> 2], HEAP32[$2 + 76 >> 2]) + $14 | 0;
      case 6:
       $12 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -76 >> 2], HEAP32[$2 + 72 >> 2]) + $13 | 0;
      case 5:
       $11 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -72 >> 2], HEAP32[$2 + 68 >> 2]) + $12 | 0;
      case 4:
       $10 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -68 >> 2], HEAP32[$2 + 64 >> 2]) + $11 | 0;
      case 3:
       $9 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -64 >> 2], HEAP32[$2 + 60 >> 2]) + $10 | 0;
      case 2:
       $8 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -60 >> 2], HEAP32[$2 + 56 >> 2]) + $9 | 0;
      case 1:
       $7 = Math_imul(HEAP32[(($6 << 2) + $0 | 0) + -56 >> 2], HEAP32[$2 + 52 >> 2]) + $8 | 0;
      case 0:
       $3 = ($6 << 2) + $0 | 0;
       $3 = ((((((((((((Math_imul(HEAP32[$3 + -52 >> 2], HEAP32[$2 + 48 >> 2]) + $7 | 0) + Math_imul(HEAP32[$3 + -48 >> 2], HEAP32[$2 + 44 >> 2]) | 0) + Math_imul(HEAP32[$3 + -44 >> 2], HEAP32[$2 + 40 >> 2]) | 0) + Math_imul(HEAP32[$3 + -40 >> 2], HEAP32[$2 + 36 >> 2]) | 0) + Math_imul(HEAP32[$3 + -36 >> 2], HEAP32[$2 + 32 >> 2]) | 0) + Math_imul(HEAP32[$3 + -32 >> 2], HEAP32[$2 + 28 >> 2]) | 0) + Math_imul(HEAP32[$3 + -28 >> 2], HEAP32[$2 + 24 >> 2]) | 0) + Math_imul(HEAP32[$3 + -24 >> 2], HEAP32[$2 + 20 >> 2]) | 0) + Math_imul(HEAP32[$3 + -20 >> 2], HEAP32[$2 + 16 >> 2]) | 0) + Math_imul(HEAP32[$3 + -16 >> 2], HEAP32[$2 + 12 >> 2]) | 0) + Math_imul(HEAP32[$3 + -12 >> 2], HEAP32[$2 + 8 >> 2]) | 0) + Math_imul(HEAP32[$3 + -8 >> 2], HEAP32[$2 + 4 >> 2]) | 0) + Math_imul(HEAP32[$3 + -4 >> 2], HEAP32[$2 >> 2]) | 0;
       break;
      default:
       break label$4;
      };
     }
     $7 = $6 << 2;
     HEAP32[$7 + $5 >> 2] = HEAP32[$0 + $7 >> 2] - ($3 >> $4);
     $6 = $6 + 1 | 0;
     if (($6 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if ($3 >>> 0 >= 9) {
    if ($3 >>> 0 >= 11) {
     if (($3 | 0) != 12) {
      if (($1 | 0) < 1) {
       break label$1
      }
      $15 = HEAP32[$0 + -4 >> 2];
      $6 = HEAP32[$0 + -8 >> 2];
      $3 = HEAP32[$0 + -12 >> 2];
      $7 = HEAP32[$0 + -16 >> 2];
      $8 = HEAP32[$0 + -20 >> 2];
      $9 = HEAP32[$0 + -24 >> 2];
      $10 = HEAP32[$0 + -28 >> 2];
      $11 = HEAP32[$0 + -32 >> 2];
      $12 = HEAP32[$0 + -36 >> 2];
      $13 = HEAP32[$0 + -40 >> 2];
      $16 = HEAP32[$0 + -44 >> 2];
      $18 = HEAP32[$2 >> 2];
      $17 = HEAP32[$2 + 4 >> 2];
      $20 = HEAP32[$2 + 8 >> 2];
      $19 = HEAP32[$2 + 12 >> 2];
      $22 = HEAP32[$2 + 16 >> 2];
      $21 = HEAP32[$2 + 20 >> 2];
      $24 = HEAP32[$2 + 24 >> 2];
      $23 = HEAP32[$2 + 28 >> 2];
      $26 = HEAP32[$2 + 32 >> 2];
      $25 = HEAP32[$2 + 36 >> 2];
      $28 = HEAP32[$2 + 40 >> 2];
      $2 = 0;
      while (1) {
       $14 = $13;
       $13 = $12;
       $12 = $11;
       $11 = $10;
       $10 = $9;
       $9 = $8;
       $8 = $7;
       $7 = $3;
       $3 = $6;
       $6 = $15;
       $27 = $2 << 2;
       $15 = HEAP32[$27 + $0 >> 2];
       HEAP32[$5 + $27 >> 2] = $15 - ((((((((((Math_imul($14, $25) + Math_imul($16, $28) | 0) + Math_imul($13, $26) | 0) + Math_imul($12, $23) | 0) + Math_imul($11, $24) | 0) + Math_imul($10, $21) | 0) + Math_imul($9, $22) | 0) + Math_imul($8, $19) | 0) + Math_imul($7, $20) | 0) + Math_imul($3, $17) | 0) + Math_imul($6, $18) >> $4);
       $16 = $14;
       $2 = $2 + 1 | 0;
       if (($2 | 0) != ($1 | 0)) {
        continue
       }
       break;
      };
      break label$1;
     }
     if (($1 | 0) < 1) {
      break label$1
     }
     $16 = HEAP32[$0 + -4 >> 2];
     $6 = HEAP32[$0 + -8 >> 2];
     $3 = HEAP32[$0 + -12 >> 2];
     $7 = HEAP32[$0 + -16 >> 2];
     $8 = HEAP32[$0 + -20 >> 2];
     $9 = HEAP32[$0 + -24 >> 2];
     $10 = HEAP32[$0 + -28 >> 2];
     $11 = HEAP32[$0 + -32 >> 2];
     $12 = HEAP32[$0 + -36 >> 2];
     $13 = HEAP32[$0 + -40 >> 2];
     $14 = HEAP32[$0 + -44 >> 2];
     $18 = HEAP32[$0 + -48 >> 2];
     $17 = HEAP32[$2 >> 2];
     $20 = HEAP32[$2 + 4 >> 2];
     $19 = HEAP32[$2 + 8 >> 2];
     $22 = HEAP32[$2 + 12 >> 2];
     $21 = HEAP32[$2 + 16 >> 2];
     $24 = HEAP32[$2 + 20 >> 2];
     $23 = HEAP32[$2 + 24 >> 2];
     $26 = HEAP32[$2 + 28 >> 2];
     $25 = HEAP32[$2 + 32 >> 2];
     $28 = HEAP32[$2 + 36 >> 2];
     $27 = HEAP32[$2 + 40 >> 2];
     $30 = HEAP32[$2 + 44 >> 2];
     $2 = 0;
     while (1) {
      $15 = $14;
      $14 = $13;
      $13 = $12;
      $12 = $11;
      $11 = $10;
      $10 = $9;
      $9 = $8;
      $8 = $7;
      $7 = $3;
      $3 = $6;
      $6 = $16;
      $29 = $2 << 2;
      $16 = HEAP32[$29 + $0 >> 2];
      HEAP32[$5 + $29 >> 2] = $16 - (((((((((((Math_imul($15, $27) + Math_imul($18, $30) | 0) + Math_imul($14, $28) | 0) + Math_imul($13, $25) | 0) + Math_imul($12, $26) | 0) + Math_imul($11, $23) | 0) + Math_imul($10, $24) | 0) + Math_imul($9, $21) | 0) + Math_imul($8, $22) | 0) + Math_imul($7, $19) | 0) + Math_imul($3, $20) | 0) + Math_imul($6, $17) >> $4);
      $18 = $15;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($3 | 0) != 10) {
     if (($1 | 0) < 1) {
      break label$1
     }
     $13 = HEAP32[$0 + -4 >> 2];
     $6 = HEAP32[$0 + -8 >> 2];
     $3 = HEAP32[$0 + -12 >> 2];
     $7 = HEAP32[$0 + -16 >> 2];
     $8 = HEAP32[$0 + -20 >> 2];
     $9 = HEAP32[$0 + -24 >> 2];
     $10 = HEAP32[$0 + -28 >> 2];
     $11 = HEAP32[$0 + -32 >> 2];
     $14 = HEAP32[$0 + -36 >> 2];
     $16 = HEAP32[$2 >> 2];
     $15 = HEAP32[$2 + 4 >> 2];
     $18 = HEAP32[$2 + 8 >> 2];
     $17 = HEAP32[$2 + 12 >> 2];
     $20 = HEAP32[$2 + 16 >> 2];
     $19 = HEAP32[$2 + 20 >> 2];
     $22 = HEAP32[$2 + 24 >> 2];
     $21 = HEAP32[$2 + 28 >> 2];
     $24 = HEAP32[$2 + 32 >> 2];
     $2 = 0;
     while (1) {
      $12 = $11;
      $11 = $10;
      $10 = $9;
      $9 = $8;
      $8 = $7;
      $7 = $3;
      $3 = $6;
      $6 = $13;
      $23 = $2 << 2;
      $13 = HEAP32[$23 + $0 >> 2];
      HEAP32[$5 + $23 >> 2] = $13 - ((((((((Math_imul($12, $21) + Math_imul($14, $24) | 0) + Math_imul($11, $22) | 0) + Math_imul($10, $19) | 0) + Math_imul($9, $20) | 0) + Math_imul($8, $17) | 0) + Math_imul($7, $18) | 0) + Math_imul($3, $15) | 0) + Math_imul($6, $16) >> $4);
      $14 = $12;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($1 | 0) < 1) {
     break label$1
    }
    $14 = HEAP32[$0 + -4 >> 2];
    $6 = HEAP32[$0 + -8 >> 2];
    $3 = HEAP32[$0 + -12 >> 2];
    $7 = HEAP32[$0 + -16 >> 2];
    $8 = HEAP32[$0 + -20 >> 2];
    $9 = HEAP32[$0 + -24 >> 2];
    $10 = HEAP32[$0 + -28 >> 2];
    $11 = HEAP32[$0 + -32 >> 2];
    $12 = HEAP32[$0 + -36 >> 2];
    $15 = HEAP32[$0 + -40 >> 2];
    $16 = HEAP32[$2 >> 2];
    $18 = HEAP32[$2 + 4 >> 2];
    $17 = HEAP32[$2 + 8 >> 2];
    $20 = HEAP32[$2 + 12 >> 2];
    $19 = HEAP32[$2 + 16 >> 2];
    $22 = HEAP32[$2 + 20 >> 2];
    $21 = HEAP32[$2 + 24 >> 2];
    $24 = HEAP32[$2 + 28 >> 2];
    $23 = HEAP32[$2 + 32 >> 2];
    $26 = HEAP32[$2 + 36 >> 2];
    $2 = 0;
    while (1) {
     $13 = $12;
     $12 = $11;
     $11 = $10;
     $10 = $9;
     $9 = $8;
     $8 = $7;
     $7 = $3;
     $3 = $6;
     $6 = $14;
     $25 = $2 << 2;
     $14 = HEAP32[$25 + $0 >> 2];
     HEAP32[$5 + $25 >> 2] = $14 - (((((((((Math_imul($13, $23) + Math_imul($15, $26) | 0) + Math_imul($12, $24) | 0) + Math_imul($11, $21) | 0) + Math_imul($10, $22) | 0) + Math_imul($9, $19) | 0) + Math_imul($8, $20) | 0) + Math_imul($7, $17) | 0) + Math_imul($3, $18) | 0) + Math_imul($6, $16) >> $4);
     $15 = $13;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if ($3 >>> 0 >= 5) {
    if ($3 >>> 0 >= 7) {
     if (($3 | 0) != 8) {
      if (($1 | 0) < 1) {
       break label$1
      }
      $11 = HEAP32[$0 + -4 >> 2];
      $6 = HEAP32[$0 + -8 >> 2];
      $3 = HEAP32[$0 + -12 >> 2];
      $7 = HEAP32[$0 + -16 >> 2];
      $8 = HEAP32[$0 + -20 >> 2];
      $9 = HEAP32[$0 + -24 >> 2];
      $12 = HEAP32[$0 + -28 >> 2];
      $13 = HEAP32[$2 >> 2];
      $14 = HEAP32[$2 + 4 >> 2];
      $16 = HEAP32[$2 + 8 >> 2];
      $15 = HEAP32[$2 + 12 >> 2];
      $18 = HEAP32[$2 + 16 >> 2];
      $17 = HEAP32[$2 + 20 >> 2];
      $20 = HEAP32[$2 + 24 >> 2];
      $2 = 0;
      while (1) {
       $10 = $9;
       $9 = $8;
       $8 = $7;
       $7 = $3;
       $3 = $6;
       $6 = $11;
       $19 = $2 << 2;
       $11 = HEAP32[$19 + $0 >> 2];
       HEAP32[$5 + $19 >> 2] = $11 - ((((((Math_imul($10, $17) + Math_imul($12, $20) | 0) + Math_imul($9, $18) | 0) + Math_imul($8, $15) | 0) + Math_imul($7, $16) | 0) + Math_imul($3, $14) | 0) + Math_imul($6, $13) >> $4);
       $12 = $10;
       $2 = $2 + 1 | 0;
       if (($2 | 0) != ($1 | 0)) {
        continue
       }
       break;
      };
      break label$1;
     }
     if (($1 | 0) < 1) {
      break label$1
     }
     $12 = HEAP32[$0 + -4 >> 2];
     $6 = HEAP32[$0 + -8 >> 2];
     $3 = HEAP32[$0 + -12 >> 2];
     $7 = HEAP32[$0 + -16 >> 2];
     $8 = HEAP32[$0 + -20 >> 2];
     $9 = HEAP32[$0 + -24 >> 2];
     $10 = HEAP32[$0 + -28 >> 2];
     $13 = HEAP32[$0 + -32 >> 2];
     $14 = HEAP32[$2 >> 2];
     $16 = HEAP32[$2 + 4 >> 2];
     $15 = HEAP32[$2 + 8 >> 2];
     $18 = HEAP32[$2 + 12 >> 2];
     $17 = HEAP32[$2 + 16 >> 2];
     $20 = HEAP32[$2 + 20 >> 2];
     $19 = HEAP32[$2 + 24 >> 2];
     $22 = HEAP32[$2 + 28 >> 2];
     $2 = 0;
     while (1) {
      $11 = $10;
      $10 = $9;
      $9 = $8;
      $8 = $7;
      $7 = $3;
      $3 = $6;
      $6 = $12;
      $21 = $2 << 2;
      $12 = HEAP32[$21 + $0 >> 2];
      HEAP32[$5 + $21 >> 2] = $12 - (((((((Math_imul($11, $19) + Math_imul($13, $22) | 0) + Math_imul($10, $20) | 0) + Math_imul($9, $17) | 0) + Math_imul($8, $18) | 0) + Math_imul($7, $15) | 0) + Math_imul($3, $16) | 0) + Math_imul($6, $14) >> $4);
      $13 = $11;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($3 | 0) != 6) {
     if (($1 | 0) < 1) {
      break label$1
     }
     $9 = HEAP32[$0 + -4 >> 2];
     $6 = HEAP32[$0 + -8 >> 2];
     $3 = HEAP32[$0 + -12 >> 2];
     $7 = HEAP32[$0 + -16 >> 2];
     $10 = HEAP32[$0 + -20 >> 2];
     $11 = HEAP32[$2 >> 2];
     $12 = HEAP32[$2 + 4 >> 2];
     $13 = HEAP32[$2 + 8 >> 2];
     $14 = HEAP32[$2 + 12 >> 2];
     $16 = HEAP32[$2 + 16 >> 2];
     $2 = 0;
     while (1) {
      $8 = $7;
      $7 = $3;
      $3 = $6;
      $6 = $9;
      $15 = $2 << 2;
      $9 = HEAP32[$15 + $0 >> 2];
      HEAP32[$5 + $15 >> 2] = $9 - ((((Math_imul($8, $14) + Math_imul($10, $16) | 0) + Math_imul($7, $13) | 0) + Math_imul($3, $12) | 0) + Math_imul($6, $11) >> $4);
      $10 = $8;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($1 | 0) < 1) {
     break label$1
    }
    $10 = HEAP32[$0 + -4 >> 2];
    $6 = HEAP32[$0 + -8 >> 2];
    $3 = HEAP32[$0 + -12 >> 2];
    $7 = HEAP32[$0 + -16 >> 2];
    $8 = HEAP32[$0 + -20 >> 2];
    $11 = HEAP32[$0 + -24 >> 2];
    $12 = HEAP32[$2 >> 2];
    $13 = HEAP32[$2 + 4 >> 2];
    $14 = HEAP32[$2 + 8 >> 2];
    $16 = HEAP32[$2 + 12 >> 2];
    $15 = HEAP32[$2 + 16 >> 2];
    $18 = HEAP32[$2 + 20 >> 2];
    $2 = 0;
    while (1) {
     $9 = $8;
     $8 = $7;
     $7 = $3;
     $3 = $6;
     $6 = $10;
     $17 = $2 << 2;
     $10 = HEAP32[$17 + $0 >> 2];
     HEAP32[$5 + $17 >> 2] = $10 - (((((Math_imul($9, $15) + Math_imul($11, $18) | 0) + Math_imul($8, $16) | 0) + Math_imul($7, $14) | 0) + Math_imul($3, $13) | 0) + Math_imul($6, $12) >> $4);
     $11 = $9;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if ($3 >>> 0 >= 3) {
    if (($3 | 0) != 4) {
     if (($1 | 0) < 1) {
      break label$1
     }
     $7 = HEAP32[$0 + -4 >> 2];
     $6 = HEAP32[$0 + -8 >> 2];
     $8 = HEAP32[$0 + -12 >> 2];
     $9 = HEAP32[$2 >> 2];
     $10 = HEAP32[$2 + 4 >> 2];
     $11 = HEAP32[$2 + 8 >> 2];
     $2 = 0;
     while (1) {
      $3 = $6;
      $6 = $7;
      $12 = $2 << 2;
      $7 = HEAP32[$12 + $0 >> 2];
      HEAP32[$5 + $12 >> 2] = $7 - ((Math_imul($3, $10) + Math_imul($8, $11) | 0) + Math_imul($6, $9) >> $4);
      $8 = $3;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($1 | 0) < 1) {
     break label$1
    }
    $8 = HEAP32[$0 + -4 >> 2];
    $6 = HEAP32[$0 + -8 >> 2];
    $3 = HEAP32[$0 + -12 >> 2];
    $9 = HEAP32[$0 + -16 >> 2];
    $10 = HEAP32[$2 >> 2];
    $11 = HEAP32[$2 + 4 >> 2];
    $12 = HEAP32[$2 + 8 >> 2];
    $13 = HEAP32[$2 + 12 >> 2];
    $2 = 0;
    while (1) {
     $7 = $3;
     $3 = $6;
     $6 = $8;
     $14 = $2 << 2;
     $8 = HEAP32[$14 + $0 >> 2];
     HEAP32[$5 + $14 >> 2] = $8 - (((Math_imul($7, $12) + Math_imul($9, $13) | 0) + Math_imul($3, $11) | 0) + Math_imul($6, $10) >> $4);
     $9 = $7;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if (($3 | 0) != 2) {
    if (($1 | 0) < 1) {
     break label$1
    }
    $6 = HEAP32[$0 + -4 >> 2];
    $3 = HEAP32[$2 >> 2];
    $2 = 0;
    while (1) {
     $7 = Math_imul($3, $6);
     $8 = $2 << 2;
     $6 = HEAP32[$8 + $0 >> 2];
     HEAP32[$5 + $8 >> 2] = $6 - ($7 >> $4);
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if (($1 | 0) < 1) {
    break label$1
   }
   $3 = HEAP32[$0 + -4 >> 2];
   $7 = HEAP32[$0 + -8 >> 2];
   $8 = HEAP32[$2 >> 2];
   $9 = HEAP32[$2 + 4 >> 2];
   $2 = 0;
   while (1) {
    $6 = $3;
    $10 = $2 << 2;
    $3 = HEAP32[$10 + $0 >> 2];
    HEAP32[$5 + $10 >> 2] = $3 - (Math_imul($6, $8) + Math_imul($7, $9) >> $4);
    $7 = $6;
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__lpc_compute_residual_from_qlp_coefficients_wide($0, $1, $2, $3, $4, $5) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $4 = $4 | 0;
  $5 = $5 | 0;
  var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0;
  label$1 : {
   if ($3 >>> 0 >= 13) {
    if (($1 | 0) < 1) {
     break label$1
    }
    $18 = $4;
    $12 = $3 + -13 | 0;
    while (1) {
     $4 = 0;
     $3 = 0;
     label$4 : {
      switch ($12 | 0) {
      case 19:
       $3 = HEAP32[(($15 << 2) + $0 | 0) + -128 >> 2];
       $4 = $3;
       $7 = $3 >> 31;
       $3 = HEAP32[$2 + 124 >> 2];
       $4 = __wasm_i64_mul($4, $7, $3, $3 >> 31);
       $3 = i64toi32_i32$HIGH_BITS;
      case 18:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -124 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 120 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 17:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -120 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 116 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 16:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -116 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 112 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 15:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -112 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 108 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 14:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -108 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 104 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 13:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -104 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 100 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 12:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -100 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 96 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 11:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -96 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 92 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 10:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -92 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 88 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 9:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -88 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 84 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 8:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -84 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 80 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 7:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -80 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 76 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 6:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -76 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 72 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 5:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -72 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 68 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 4:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -68 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 64 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 3:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -64 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 60 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 2:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -60 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 56 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 1:
       $7 = HEAP32[(($15 << 2) + $0 | 0) + -56 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 52 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 0:
       $8 = ($15 << 2) + $0 | 0;
       $7 = HEAP32[$8 + -52 >> 2];
       $6 = $7;
       $9 = $7 >> 31;
       $7 = HEAP32[$2 + 48 >> 2];
       $7 = __wasm_i64_mul($6, $9, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $3 = HEAP32[$8 + -48 >> 2];
       $4 = $3;
       $9 = $3 >> 31;
       $3 = HEAP32[$2 + 44 >> 2];
       $3 = __wasm_i64_mul($4, $9, $3, $3 >> 31);
       $4 = $3 + $7 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $4 >>> 0 < $3 >>> 0 ? $6 + 1 | 0 : $6;
       $3 = HEAP32[$8 + -44 >> 2];
       $7 = $3;
       $9 = $3 >> 31;
       $3 = HEAP32[$2 + 40 >> 2];
       $3 = __wasm_i64_mul($7, $9, $3, $3 >> 31);
       $4 = $3 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $4 >>> 0 < $3 >>> 0 ? $6 + 1 | 0 : $6;
       $3 = HEAP32[$8 + -40 >> 2];
       $7 = $3;
       $9 = $3 >> 31;
       $3 = HEAP32[$2 + 36 >> 2];
       $3 = __wasm_i64_mul($7, $9, $3, $3 >> 31);
       $4 = $3 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $4 >>> 0 < $3 >>> 0 ? $6 + 1 | 0 : $6;
       $3 = HEAP32[$8 + -36 >> 2];
       $7 = $3;
       $9 = $3 >> 31;
       $3 = HEAP32[$2 + 32 >> 2];
       $3 = __wasm_i64_mul($7, $9, $3, $3 >> 31);
       $4 = $3 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $4 >>> 0 < $3 >>> 0 ? $6 + 1 | 0 : $6;
       $3 = HEAP32[$8 + -32 >> 2];
       $7 = $3;
       $9 = $3 >> 31;
       $3 = HEAP32[$2 + 28 >> 2];
       $3 = __wasm_i64_mul($7, $9, $3, $3 >> 31);
       $4 = $3 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $4 >>> 0 < $3 >>> 0 ? $6 + 1 | 0 : $6;
       $3 = HEAP32[$8 + -28 >> 2];
       $7 = $3;
       $9 = $3 >> 31;
       $3 = HEAP32[$2 + 24 >> 2];
       $3 = __wasm_i64_mul($7, $9, $3, $3 >> 31);
       $4 = $3 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $4 >>> 0 < $3 >>> 0 ? $6 + 1 | 0 : $6;
       $3 = HEAP32[$8 + -24 >> 2];
       $7 = $3;
       $9 = $3 >> 31;
       $3 = HEAP32[$2 + 20 >> 2];
       $3 = __wasm_i64_mul($7, $9, $3, $3 >> 31);
       $4 = $3 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $4 >>> 0 < $3 >>> 0 ? $6 + 1 | 0 : $6;
       $3 = HEAP32[$8 + -20 >> 2];
       $7 = $3;
       $9 = $3 >> 31;
       $3 = HEAP32[$2 + 16 >> 2];
       $3 = __wasm_i64_mul($7, $9, $3, $3 >> 31);
       $4 = $3 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $4 >>> 0 < $3 >>> 0 ? $6 + 1 | 0 : $6;
       $3 = HEAP32[$8 + -16 >> 2];
       $7 = $3;
       $9 = $3 >> 31;
       $3 = HEAP32[$2 + 12 >> 2];
       $3 = __wasm_i64_mul($7, $9, $3, $3 >> 31);
       $4 = $3 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $4 >>> 0 < $3 >>> 0 ? $6 + 1 | 0 : $6;
       $3 = HEAP32[$8 + -12 >> 2];
       $7 = $3;
       $9 = $3 >> 31;
       $3 = HEAP32[$2 + 8 >> 2];
       $3 = __wasm_i64_mul($7, $9, $3, $3 >> 31);
       $4 = $3 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $4 >>> 0 < $3 >>> 0 ? $6 + 1 | 0 : $6;
       $3 = HEAP32[$8 + -8 >> 2];
       $7 = $3;
       $9 = $3 >> 31;
       $3 = HEAP32[$2 + 4 >> 2];
       $3 = __wasm_i64_mul($7, $9, $3, $3 >> 31);
       $4 = $3 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $4 >>> 0 < $3 >>> 0 ? $6 + 1 | 0 : $6;
       $3 = HEAP32[$8 + -4 >> 2];
       $7 = $3;
       $8 = $3 >> 31;
       $3 = HEAP32[$2 >> 2];
       $3 = __wasm_i64_mul($7, $8, $3, $3 >> 31);
       $4 = $3 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $4 >>> 0 < $3 >>> 0 ? $6 + 1 | 0 : $6;
       $3 = $6;
       break;
      default:
       break label$4;
      };
     }
     $7 = $15 << 2;
     $6 = $7 + $5 | 0;
     $9 = HEAP32[$0 + $7 >> 2];
     $7 = $3;
     $3 = $18;
     $8 = $3 & 31;
     HEAP32[$6 >> 2] = $9 - (32 <= ($3 & 63) >>> 0 ? $7 >> $8 : ((1 << $8) - 1 & $7) << 32 - $8 | $4 >>> $8);
     $15 = $15 + 1 | 0;
     if (($15 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if ($3 >>> 0 >= 9) {
    if ($3 >>> 0 >= 11) {
     if (($3 | 0) != 12) {
      if (($1 | 0) < 1) {
       break label$1
      }
      $10 = HEAP32[$0 + -4 >> 2];
      $15 = HEAP32[$0 + -8 >> 2];
      $3 = HEAP32[$0 + -12 >> 2];
      $18 = HEAP32[$0 + -16 >> 2];
      $7 = HEAP32[$0 + -20 >> 2];
      $12 = HEAP32[$0 + -24 >> 2];
      $8 = HEAP32[$0 + -28 >> 2];
      $9 = HEAP32[$0 + -32 >> 2];
      $11 = HEAP32[$0 + -36 >> 2];
      $17 = HEAP32[$0 + -40 >> 2];
      $13 = HEAP32[$0 + -44 >> 2];
      $6 = HEAP32[$2 >> 2];
      $40 = $6;
      $41 = $6 >> 31;
      $6 = HEAP32[$2 + 4 >> 2];
      $42 = $6;
      $37 = $6 >> 31;
      $6 = HEAP32[$2 + 8 >> 2];
      $38 = $6;
      $39 = $6 >> 31;
      $6 = HEAP32[$2 + 12 >> 2];
      $34 = $6;
      $35 = $6 >> 31;
      $6 = HEAP32[$2 + 16 >> 2];
      $36 = $6;
      $31 = $6 >> 31;
      $6 = HEAP32[$2 + 20 >> 2];
      $32 = $6;
      $33 = $6 >> 31;
      $6 = HEAP32[$2 + 24 >> 2];
      $29 = $6;
      $30 = $6 >> 31;
      $6 = HEAP32[$2 + 28 >> 2];
      $26 = $6;
      $27 = $6 >> 31;
      $6 = HEAP32[$2 + 32 >> 2];
      $28 = $6;
      $23 = $6 >> 31;
      $6 = HEAP32[$2 + 36 >> 2];
      $24 = $6;
      $25 = $6 >> 31;
      $2 = HEAP32[$2 + 40 >> 2];
      $21 = $2;
      $22 = $2 >> 31;
      $2 = 0;
      while (1) {
       $16 = $17;
       $17 = $11;
       $11 = $9;
       $9 = $8;
       $8 = $12;
       $12 = $7;
       $7 = $18;
       $18 = $3;
       $3 = $15;
       $15 = $10;
       $6 = $2 << 2;
       $20 = $6 + $5 | 0;
       $10 = HEAP32[$0 + $6 >> 2];
       $14 = __wasm_i64_mul($16, $16 >> 31, $24, $25);
       $6 = i64toi32_i32$HIGH_BITS;
       $13 = __wasm_i64_mul($13, $13 >> 31, $21, $22);
       $14 = $13 + $14 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $14 >>> 0 < $13 >>> 0 ? $6 + 1 | 0 : $6;
       $13 = __wasm_i64_mul($17, $17 >> 31, $28, $23);
       $14 = $13 + $14 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $14 >>> 0 < $13 >>> 0 ? $6 + 1 | 0 : $6;
       $13 = __wasm_i64_mul($11, $11 >> 31, $26, $27);
       $14 = $13 + $14 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $14 >>> 0 < $13 >>> 0 ? $6 + 1 | 0 : $6;
       $13 = __wasm_i64_mul($9, $9 >> 31, $29, $30);
       $14 = $13 + $14 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $14 >>> 0 < $13 >>> 0 ? $6 + 1 | 0 : $6;
       $13 = __wasm_i64_mul($8, $8 >> 31, $32, $33);
       $14 = $13 + $14 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $14 >>> 0 < $13 >>> 0 ? $6 + 1 | 0 : $6;
       $13 = __wasm_i64_mul($12, $12 >> 31, $36, $31);
       $14 = $13 + $14 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $14 >>> 0 < $13 >>> 0 ? $6 + 1 | 0 : $6;
       $13 = __wasm_i64_mul($7, $7 >> 31, $34, $35);
       $14 = $13 + $14 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $14 >>> 0 < $13 >>> 0 ? $6 + 1 | 0 : $6;
       $13 = __wasm_i64_mul($18, $18 >> 31, $38, $39);
       $14 = $13 + $14 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $14 >>> 0 < $13 >>> 0 ? $6 + 1 | 0 : $6;
       $13 = __wasm_i64_mul($3, $3 >> 31, $42, $37);
       $14 = $13 + $14 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $14 >>> 0 < $13 >>> 0 ? $6 + 1 | 0 : $6;
       $13 = __wasm_i64_mul($15, $15 >> 31, $40, $41);
       $14 = $13 + $14 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $14 >>> 0 < $13 >>> 0 ? $6 + 1 | 0 : $6;
       $13 = $6;
       $6 = $4;
       $19 = $6 & 31;
       HEAP32[$20 >> 2] = $10 - (32 <= ($6 & 63) >>> 0 ? $13 >> $19 : ((1 << $19) - 1 & $13) << 32 - $19 | $14 >>> $19);
       $13 = $16;
       $2 = $2 + 1 | 0;
       if (($2 | 0) != ($1 | 0)) {
        continue
       }
       break;
      };
      break label$1;
     }
     if (($1 | 0) < 1) {
      break label$1
     }
     $13 = HEAP32[$0 + -4 >> 2];
     $15 = HEAP32[$0 + -8 >> 2];
     $3 = HEAP32[$0 + -12 >> 2];
     $18 = HEAP32[$0 + -16 >> 2];
     $7 = HEAP32[$0 + -20 >> 2];
     $12 = HEAP32[$0 + -24 >> 2];
     $8 = HEAP32[$0 + -28 >> 2];
     $9 = HEAP32[$0 + -32 >> 2];
     $11 = HEAP32[$0 + -36 >> 2];
     $17 = HEAP32[$0 + -40 >> 2];
     $16 = HEAP32[$0 + -44 >> 2];
     $6 = HEAP32[$0 + -48 >> 2];
     $10 = HEAP32[$2 >> 2];
     $43 = $10;
     $44 = $10 >> 31;
     $10 = HEAP32[$2 + 4 >> 2];
     $45 = $10;
     $40 = $10 >> 31;
     $10 = HEAP32[$2 + 8 >> 2];
     $41 = $10;
     $42 = $10 >> 31;
     $10 = HEAP32[$2 + 12 >> 2];
     $37 = $10;
     $38 = $10 >> 31;
     $10 = HEAP32[$2 + 16 >> 2];
     $39 = $10;
     $34 = $10 >> 31;
     $10 = HEAP32[$2 + 20 >> 2];
     $35 = $10;
     $36 = $10 >> 31;
     $10 = HEAP32[$2 + 24 >> 2];
     $31 = $10;
     $32 = $10 >> 31;
     $10 = HEAP32[$2 + 28 >> 2];
     $33 = $10;
     $29 = $10 >> 31;
     $10 = HEAP32[$2 + 32 >> 2];
     $30 = $10;
     $26 = $10 >> 31;
     $10 = HEAP32[$2 + 36 >> 2];
     $27 = $10;
     $28 = $10 >> 31;
     $10 = HEAP32[$2 + 40 >> 2];
     $23 = $10;
     $24 = $10 >> 31;
     $2 = HEAP32[$2 + 44 >> 2];
     $25 = $2;
     $21 = $2 >> 31;
     $2 = 0;
     while (1) {
      $10 = $16;
      $16 = $17;
      $17 = $11;
      $11 = $9;
      $9 = $8;
      $8 = $12;
      $12 = $7;
      $7 = $18;
      $18 = $3;
      $3 = $15;
      $15 = $13;
      $13 = $2 << 2;
      $22 = $13 + $5 | 0;
      $13 = HEAP32[$0 + $13 >> 2];
      $14 = __wasm_i64_mul($10, $10 >> 31, $23, $24);
      $19 = i64toi32_i32$HIGH_BITS;
      $20 = $14;
      $14 = __wasm_i64_mul($6, $6 >> 31, $25, $21);
      $20 = $20 + $14 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $19 | 0;
      $6 = $20 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = __wasm_i64_mul($16, $16 >> 31, $27, $28);
      $19 = $14 + $20 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $19 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = __wasm_i64_mul($17, $17 >> 31, $30, $26);
      $19 = $14 + $19 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $19 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = __wasm_i64_mul($11, $11 >> 31, $33, $29);
      $19 = $14 + $19 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $19 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = __wasm_i64_mul($9, $9 >> 31, $31, $32);
      $19 = $14 + $19 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $19 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = __wasm_i64_mul($8, $8 >> 31, $35, $36);
      $19 = $14 + $19 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $19 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = __wasm_i64_mul($12, $12 >> 31, $39, $34);
      $19 = $14 + $19 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $19 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = __wasm_i64_mul($7, $7 >> 31, $37, $38);
      $19 = $14 + $19 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $19 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = __wasm_i64_mul($18, $18 >> 31, $41, $42);
      $19 = $14 + $19 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $19 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = __wasm_i64_mul($3, $3 >> 31, $45, $40);
      $19 = $14 + $19 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $19 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = __wasm_i64_mul($15, $15 >> 31, $43, $44);
      $19 = $14 + $19 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $19 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = $6;
      $6 = $4;
      $20 = $6 & 31;
      HEAP32[$22 >> 2] = $13 - (32 <= ($6 & 63) >>> 0 ? $14 >> $20 : ((1 << $20) - 1 & $14) << 32 - $20 | $19 >>> $20);
      $6 = $10;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($3 | 0) != 10) {
     if (($1 | 0) < 1) {
      break label$1
     }
     $17 = HEAP32[$0 + -4 >> 2];
     $15 = HEAP32[$0 + -8 >> 2];
     $3 = HEAP32[$0 + -12 >> 2];
     $18 = HEAP32[$0 + -16 >> 2];
     $7 = HEAP32[$0 + -20 >> 2];
     $12 = HEAP32[$0 + -24 >> 2];
     $8 = HEAP32[$0 + -28 >> 2];
     $9 = HEAP32[$0 + -32 >> 2];
     $16 = HEAP32[$0 + -36 >> 2];
     $11 = HEAP32[$2 >> 2];
     $34 = $11;
     $35 = $11 >> 31;
     $11 = HEAP32[$2 + 4 >> 2];
     $36 = $11;
     $31 = $11 >> 31;
     $11 = HEAP32[$2 + 8 >> 2];
     $32 = $11;
     $33 = $11 >> 31;
     $11 = HEAP32[$2 + 12 >> 2];
     $29 = $11;
     $30 = $11 >> 31;
     $11 = HEAP32[$2 + 16 >> 2];
     $26 = $11;
     $27 = $11 >> 31;
     $11 = HEAP32[$2 + 20 >> 2];
     $28 = $11;
     $23 = $11 >> 31;
     $11 = HEAP32[$2 + 24 >> 2];
     $24 = $11;
     $25 = $11 >> 31;
     $11 = HEAP32[$2 + 28 >> 2];
     $21 = $11;
     $22 = $11 >> 31;
     $2 = HEAP32[$2 + 32 >> 2];
     $20 = $2;
     $19 = $2 >> 31;
     $2 = 0;
     while (1) {
      $11 = $9;
      $9 = $8;
      $8 = $12;
      $12 = $7;
      $7 = $18;
      $18 = $3;
      $3 = $15;
      $15 = $17;
      $6 = $2 << 2;
      $14 = $6 + $5 | 0;
      $17 = HEAP32[$0 + $6 >> 2];
      $10 = __wasm_i64_mul($11, $11 >> 31, $21, $22);
      $6 = i64toi32_i32$HIGH_BITS;
      $16 = __wasm_i64_mul($16, $16 >> 31, $20, $19);
      $10 = $16 + $10 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $10 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
      $16 = __wasm_i64_mul($9, $9 >> 31, $24, $25);
      $10 = $16 + $10 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $10 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
      $16 = __wasm_i64_mul($8, $8 >> 31, $28, $23);
      $10 = $16 + $10 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $10 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
      $16 = __wasm_i64_mul($12, $12 >> 31, $26, $27);
      $10 = $16 + $10 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $10 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
      $16 = __wasm_i64_mul($7, $7 >> 31, $29, $30);
      $10 = $16 + $10 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $10 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
      $16 = __wasm_i64_mul($18, $18 >> 31, $32, $33);
      $10 = $16 + $10 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $10 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
      $16 = __wasm_i64_mul($3, $3 >> 31, $36, $31);
      $10 = $16 + $10 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $10 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
      $16 = __wasm_i64_mul($15, $15 >> 31, $34, $35);
      $10 = $16 + $10 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $10 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
      $16 = $6;
      $6 = $4;
      $13 = $6 & 31;
      HEAP32[$14 >> 2] = $17 - (32 <= ($6 & 63) >>> 0 ? $16 >> $13 : ((1 << $13) - 1 & $16) << 32 - $13 | $10 >>> $13);
      $16 = $11;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($1 | 0) < 1) {
     break label$1
    }
    $16 = HEAP32[$0 + -4 >> 2];
    $15 = HEAP32[$0 + -8 >> 2];
    $3 = HEAP32[$0 + -12 >> 2];
    $18 = HEAP32[$0 + -16 >> 2];
    $7 = HEAP32[$0 + -20 >> 2];
    $12 = HEAP32[$0 + -24 >> 2];
    $8 = HEAP32[$0 + -28 >> 2];
    $9 = HEAP32[$0 + -32 >> 2];
    $11 = HEAP32[$0 + -36 >> 2];
    $10 = HEAP32[$0 + -40 >> 2];
    $6 = HEAP32[$2 >> 2];
    $37 = $6;
    $38 = $6 >> 31;
    $6 = HEAP32[$2 + 4 >> 2];
    $39 = $6;
    $34 = $6 >> 31;
    $6 = HEAP32[$2 + 8 >> 2];
    $35 = $6;
    $36 = $6 >> 31;
    $6 = HEAP32[$2 + 12 >> 2];
    $31 = $6;
    $32 = $6 >> 31;
    $6 = HEAP32[$2 + 16 >> 2];
    $33 = $6;
    $29 = $6 >> 31;
    $6 = HEAP32[$2 + 20 >> 2];
    $30 = $6;
    $26 = $6 >> 31;
    $6 = HEAP32[$2 + 24 >> 2];
    $27 = $6;
    $28 = $6 >> 31;
    $6 = HEAP32[$2 + 28 >> 2];
    $23 = $6;
    $24 = $6 >> 31;
    $6 = HEAP32[$2 + 32 >> 2];
    $25 = $6;
    $21 = $6 >> 31;
    $2 = HEAP32[$2 + 36 >> 2];
    $22 = $2;
    $20 = $2 >> 31;
    $2 = 0;
    while (1) {
     $17 = $11;
     $11 = $9;
     $9 = $8;
     $8 = $12;
     $12 = $7;
     $7 = $18;
     $18 = $3;
     $3 = $15;
     $15 = $16;
     $6 = $2 << 2;
     $19 = $6 + $5 | 0;
     $16 = HEAP32[$0 + $6 >> 2];
     $13 = __wasm_i64_mul($17, $17 >> 31, $25, $21);
     $6 = i64toi32_i32$HIGH_BITS;
     $10 = __wasm_i64_mul($10, $10 >> 31, $22, $20);
     $13 = $10 + $13 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $13 >>> 0 < $10 >>> 0 ? $6 + 1 | 0 : $6;
     $10 = __wasm_i64_mul($11, $11 >> 31, $23, $24);
     $13 = $10 + $13 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $13 >>> 0 < $10 >>> 0 ? $6 + 1 | 0 : $6;
     $10 = __wasm_i64_mul($9, $9 >> 31, $27, $28);
     $13 = $10 + $13 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $13 >>> 0 < $10 >>> 0 ? $6 + 1 | 0 : $6;
     $10 = __wasm_i64_mul($8, $8 >> 31, $30, $26);
     $13 = $10 + $13 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $13 >>> 0 < $10 >>> 0 ? $6 + 1 | 0 : $6;
     $10 = __wasm_i64_mul($12, $12 >> 31, $33, $29);
     $13 = $10 + $13 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $13 >>> 0 < $10 >>> 0 ? $6 + 1 | 0 : $6;
     $10 = __wasm_i64_mul($7, $7 >> 31, $31, $32);
     $13 = $10 + $13 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $13 >>> 0 < $10 >>> 0 ? $6 + 1 | 0 : $6;
     $10 = __wasm_i64_mul($18, $18 >> 31, $35, $36);
     $13 = $10 + $13 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $13 >>> 0 < $10 >>> 0 ? $6 + 1 | 0 : $6;
     $10 = __wasm_i64_mul($3, $3 >> 31, $39, $34);
     $13 = $10 + $13 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $13 >>> 0 < $10 >>> 0 ? $6 + 1 | 0 : $6;
     $10 = __wasm_i64_mul($15, $15 >> 31, $37, $38);
     $13 = $10 + $13 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $13 >>> 0 < $10 >>> 0 ? $6 + 1 | 0 : $6;
     $10 = $6;
     $6 = $4;
     $14 = $6 & 31;
     HEAP32[$19 >> 2] = $16 - (32 <= ($6 & 63) >>> 0 ? $10 >> $14 : ((1 << $14) - 1 & $10) << 32 - $14 | $13 >>> $14);
     $10 = $17;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if ($3 >>> 0 >= 5) {
    if ($3 >>> 0 >= 7) {
     if (($3 | 0) != 8) {
      if (($1 | 0) < 1) {
       break label$1
      }
      $9 = HEAP32[$0 + -4 >> 2];
      $15 = HEAP32[$0 + -8 >> 2];
      $3 = HEAP32[$0 + -12 >> 2];
      $18 = HEAP32[$0 + -16 >> 2];
      $7 = HEAP32[$0 + -20 >> 2];
      $12 = HEAP32[$0 + -24 >> 2];
      $11 = HEAP32[$0 + -28 >> 2];
      $8 = HEAP32[$2 >> 2];
      $29 = $8;
      $30 = $8 >> 31;
      $8 = HEAP32[$2 + 4 >> 2];
      $26 = $8;
      $27 = $8 >> 31;
      $8 = HEAP32[$2 + 8 >> 2];
      $28 = $8;
      $23 = $8 >> 31;
      $8 = HEAP32[$2 + 12 >> 2];
      $24 = $8;
      $25 = $8 >> 31;
      $8 = HEAP32[$2 + 16 >> 2];
      $21 = $8;
      $22 = $8 >> 31;
      $8 = HEAP32[$2 + 20 >> 2];
      $20 = $8;
      $19 = $8 >> 31;
      $2 = HEAP32[$2 + 24 >> 2];
      $14 = $2;
      $13 = $2 >> 31;
      $2 = 0;
      while (1) {
       $8 = $12;
       $12 = $7;
       $7 = $18;
       $18 = $3;
       $3 = $15;
       $15 = $9;
       $9 = $2 << 2;
       $10 = $9 + $5 | 0;
       $9 = HEAP32[$0 + $9 >> 2];
       $17 = __wasm_i64_mul($8, $8 >> 31, $20, $19);
       $6 = i64toi32_i32$HIGH_BITS;
       $11 = __wasm_i64_mul($11, $11 >> 31, $14, $13);
       $17 = $11 + $17 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $17 >>> 0 < $11 >>> 0 ? $6 + 1 | 0 : $6;
       $11 = __wasm_i64_mul($12, $12 >> 31, $21, $22);
       $17 = $11 + $17 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $17 >>> 0 < $11 >>> 0 ? $6 + 1 | 0 : $6;
       $11 = __wasm_i64_mul($7, $7 >> 31, $24, $25);
       $17 = $11 + $17 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $17 >>> 0 < $11 >>> 0 ? $6 + 1 | 0 : $6;
       $11 = __wasm_i64_mul($18, $18 >> 31, $28, $23);
       $17 = $11 + $17 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $17 >>> 0 < $11 >>> 0 ? $6 + 1 | 0 : $6;
       $11 = __wasm_i64_mul($3, $3 >> 31, $26, $27);
       $17 = $11 + $17 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $17 >>> 0 < $11 >>> 0 ? $6 + 1 | 0 : $6;
       $11 = __wasm_i64_mul($15, $15 >> 31, $29, $30);
       $17 = $11 + $17 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $17 >>> 0 < $11 >>> 0 ? $6 + 1 | 0 : $6;
       $16 = $4 & 31;
       HEAP32[$10 >> 2] = $9 - (32 <= ($4 & 63) >>> 0 ? $6 >> $16 : ((1 << $16) - 1 & $6) << 32 - $16 | $17 >>> $16);
       $11 = $8;
       $2 = $2 + 1 | 0;
       if (($2 | 0) != ($1 | 0)) {
        continue
       }
       break;
      };
      break label$1;
     }
     if (($1 | 0) < 1) {
      break label$1
     }
     $11 = HEAP32[$0 + -4 >> 2];
     $15 = HEAP32[$0 + -8 >> 2];
     $3 = HEAP32[$0 + -12 >> 2];
     $18 = HEAP32[$0 + -16 >> 2];
     $7 = HEAP32[$0 + -20 >> 2];
     $12 = HEAP32[$0 + -24 >> 2];
     $8 = HEAP32[$0 + -28 >> 2];
     $17 = HEAP32[$0 + -32 >> 2];
     $9 = HEAP32[$2 >> 2];
     $31 = $9;
     $32 = $9 >> 31;
     $9 = HEAP32[$2 + 4 >> 2];
     $33 = $9;
     $29 = $9 >> 31;
     $9 = HEAP32[$2 + 8 >> 2];
     $30 = $9;
     $26 = $9 >> 31;
     $9 = HEAP32[$2 + 12 >> 2];
     $27 = $9;
     $28 = $9 >> 31;
     $9 = HEAP32[$2 + 16 >> 2];
     $23 = $9;
     $24 = $9 >> 31;
     $9 = HEAP32[$2 + 20 >> 2];
     $25 = $9;
     $21 = $9 >> 31;
     $9 = HEAP32[$2 + 24 >> 2];
     $22 = $9;
     $20 = $9 >> 31;
     $2 = HEAP32[$2 + 28 >> 2];
     $19 = $2;
     $14 = $2 >> 31;
     $2 = 0;
     while (1) {
      $9 = $8;
      $8 = $12;
      $12 = $7;
      $7 = $18;
      $18 = $3;
      $3 = $15;
      $15 = $11;
      $11 = $2 << 2;
      $13 = $11 + $5 | 0;
      $11 = HEAP32[$0 + $11 >> 2];
      $16 = __wasm_i64_mul($9, $9 >> 31, $22, $20);
      $6 = i64toi32_i32$HIGH_BITS;
      $17 = __wasm_i64_mul($17, $17 >> 31, $19, $14);
      $16 = $17 + $16 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $16 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $17 = __wasm_i64_mul($8, $8 >> 31, $25, $21);
      $16 = $17 + $16 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $16 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $17 = __wasm_i64_mul($12, $12 >> 31, $23, $24);
      $16 = $17 + $16 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $16 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $17 = __wasm_i64_mul($7, $7 >> 31, $27, $28);
      $16 = $17 + $16 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $16 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $17 = __wasm_i64_mul($18, $18 >> 31, $30, $26);
      $16 = $17 + $16 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $16 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $17 = __wasm_i64_mul($3, $3 >> 31, $33, $29);
      $16 = $17 + $16 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $16 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $17 = __wasm_i64_mul($15, $15 >> 31, $31, $32);
      $16 = $17 + $16 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $16 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $17 = $6;
      $6 = $4;
      $10 = $6 & 31;
      HEAP32[$13 >> 2] = $11 - (32 <= ($6 & 63) >>> 0 ? $17 >> $10 : ((1 << $10) - 1 & $17) << 32 - $10 | $16 >>> $10);
      $17 = $9;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($3 | 0) != 6) {
     if (($1 | 0) < 1) {
      break label$1
     }
     $12 = HEAP32[$0 + -4 >> 2];
     $15 = HEAP32[$0 + -8 >> 2];
     $3 = HEAP32[$0 + -12 >> 2];
     $18 = HEAP32[$0 + -16 >> 2];
     $8 = HEAP32[$0 + -20 >> 2];
     $7 = HEAP32[$2 >> 2];
     $23 = $7;
     $24 = $7 >> 31;
     $7 = HEAP32[$2 + 4 >> 2];
     $25 = $7;
     $21 = $7 >> 31;
     $7 = HEAP32[$2 + 8 >> 2];
     $22 = $7;
     $20 = $7 >> 31;
     $7 = HEAP32[$2 + 12 >> 2];
     $19 = $7;
     $14 = $7 >> 31;
     $2 = HEAP32[$2 + 16 >> 2];
     $13 = $2;
     $10 = $2 >> 31;
     $2 = 0;
     while (1) {
      $7 = $18;
      $18 = $3;
      $3 = $15;
      $15 = $12;
      $12 = $2 << 2;
      $16 = $12 + $5 | 0;
      $12 = HEAP32[$0 + $12 >> 2];
      $11 = __wasm_i64_mul($7, $7 >> 31, $19, $14);
      $9 = i64toi32_i32$HIGH_BITS;
      $8 = __wasm_i64_mul($8, $8 >> 31, $13, $10);
      $11 = $8 + $11 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $9 | 0;
      $6 = $11 >>> 0 < $8 >>> 0 ? $6 + 1 | 0 : $6;
      $8 = __wasm_i64_mul($18, $18 >> 31, $22, $20);
      $9 = $8 + $11 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $9 >>> 0 < $8 >>> 0 ? $6 + 1 | 0 : $6;
      $8 = __wasm_i64_mul($3, $3 >> 31, $25, $21);
      $9 = $8 + $9 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $9 >>> 0 < $8 >>> 0 ? $6 + 1 | 0 : $6;
      $8 = __wasm_i64_mul($15, $15 >> 31, $23, $24);
      $9 = $8 + $9 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $9 >>> 0 < $8 >>> 0 ? $6 + 1 | 0 : $6;
      $11 = $4 & 31;
      HEAP32[$16 >> 2] = $12 - (32 <= ($4 & 63) >>> 0 ? $6 >> $11 : ((1 << $11) - 1 & $6) << 32 - $11 | $9 >>> $11);
      $8 = $7;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($1 | 0) < 1) {
     break label$1
    }
    $8 = HEAP32[$0 + -4 >> 2];
    $15 = HEAP32[$0 + -8 >> 2];
    $3 = HEAP32[$0 + -12 >> 2];
    $18 = HEAP32[$0 + -16 >> 2];
    $7 = HEAP32[$0 + -20 >> 2];
    $9 = HEAP32[$0 + -24 >> 2];
    $12 = HEAP32[$2 >> 2];
    $27 = $12;
    $28 = $12 >> 31;
    $12 = HEAP32[$2 + 4 >> 2];
    $23 = $12;
    $24 = $12 >> 31;
    $12 = HEAP32[$2 + 8 >> 2];
    $25 = $12;
    $21 = $12 >> 31;
    $12 = HEAP32[$2 + 12 >> 2];
    $22 = $12;
    $20 = $12 >> 31;
    $12 = HEAP32[$2 + 16 >> 2];
    $19 = $12;
    $14 = $12 >> 31;
    $2 = HEAP32[$2 + 20 >> 2];
    $13 = $2;
    $10 = $2 >> 31;
    $2 = 0;
    while (1) {
     $12 = $7;
     $7 = $18;
     $18 = $3;
     $3 = $15;
     $15 = $8;
     $8 = $2 << 2;
     $16 = $8 + $5 | 0;
     $8 = HEAP32[$0 + $8 >> 2];
     $6 = __wasm_i64_mul($12, $12 >> 31, $19, $14);
     $11 = i64toi32_i32$HIGH_BITS;
     $9 = __wasm_i64_mul($9, $9 >> 31, $13, $10);
     $26 = $9 + $6 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $11 | 0;
     $6 = $26 >>> 0 < $9 >>> 0 ? $6 + 1 | 0 : $6;
     $9 = __wasm_i64_mul($7, $7 >> 31, $22, $20);
     $11 = $9 + $26 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $11 >>> 0 < $9 >>> 0 ? $6 + 1 | 0 : $6;
     $9 = __wasm_i64_mul($18, $18 >> 31, $25, $21);
     $11 = $9 + $11 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $11 >>> 0 < $9 >>> 0 ? $6 + 1 | 0 : $6;
     $9 = __wasm_i64_mul($3, $3 >> 31, $23, $24);
     $11 = $9 + $11 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $11 >>> 0 < $9 >>> 0 ? $6 + 1 | 0 : $6;
     $9 = __wasm_i64_mul($15, $15 >> 31, $27, $28);
     $11 = $9 + $11 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $11 >>> 0 < $9 >>> 0 ? $6 + 1 | 0 : $6;
     $17 = $4 & 31;
     HEAP32[$16 >> 2] = $8 - (32 <= ($4 & 63) >>> 0 ? $6 >> $17 : ((1 << $17) - 1 & $6) << 32 - $17 | $11 >>> $17);
     $9 = $12;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if ($3 >>> 0 >= 3) {
    if (($3 | 0) != 4) {
     if (($1 | 0) < 1) {
      break label$1
     }
     $18 = HEAP32[$0 + -4 >> 2];
     $15 = HEAP32[$0 + -8 >> 2];
     $7 = HEAP32[$0 + -12 >> 2];
     $3 = HEAP32[$2 >> 2];
     $19 = $3;
     $14 = $3 >> 31;
     $3 = HEAP32[$2 + 4 >> 2];
     $13 = $3;
     $10 = $3 >> 31;
     $2 = HEAP32[$2 + 8 >> 2];
     $16 = $2;
     $17 = $2 >> 31;
     $2 = 0;
     while (1) {
      $3 = $15;
      $15 = $18;
      $18 = $2 << 2;
      $11 = $18 + $5 | 0;
      $18 = HEAP32[$0 + $18 >> 2];
      $9 = $18;
      $8 = __wasm_i64_mul($3, $3 >> 31, $13, $10);
      $12 = i64toi32_i32$HIGH_BITS;
      $7 = __wasm_i64_mul($7, $7 >> 31, $16, $17);
      $8 = $7 + $8 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $12 | 0;
      $6 = $8 >>> 0 < $7 >>> 0 ? $6 + 1 | 0 : $6;
      $7 = __wasm_i64_mul($15, $15 >> 31, $19, $14);
      $12 = $7 + $8 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $12 >>> 0 < $7 >>> 0 ? $6 + 1 | 0 : $6;
      $7 = $4;
      $8 = $7 & 31;
      HEAP32[$11 >> 2] = $9 - (32 <= ($7 & 63) >>> 0 ? $6 >> $8 : ((1 << $8) - 1 & $6) << 32 - $8 | $12 >>> $8);
      $7 = $3;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($1 | 0) < 1) {
     break label$1
    }
    $7 = HEAP32[$0 + -4 >> 2];
    $15 = HEAP32[$0 + -8 >> 2];
    $3 = HEAP32[$0 + -12 >> 2];
    $12 = HEAP32[$0 + -16 >> 2];
    $18 = HEAP32[$2 >> 2];
    $21 = $18;
    $22 = $18 >> 31;
    $18 = HEAP32[$2 + 4 >> 2];
    $20 = $18;
    $19 = $18 >> 31;
    $18 = HEAP32[$2 + 8 >> 2];
    $14 = $18;
    $13 = $14 >> 31;
    $2 = HEAP32[$2 + 12 >> 2];
    $10 = $2;
    $16 = $2 >> 31;
    $2 = 0;
    while (1) {
     $18 = $3;
     $3 = $15;
     $15 = $7;
     $7 = $2 << 2;
     $17 = $7 + $5 | 0;
     $7 = HEAP32[$0 + $7 >> 2];
     $9 = __wasm_i64_mul($18, $18 >> 31, $14, $13);
     $8 = i64toi32_i32$HIGH_BITS;
     $12 = __wasm_i64_mul($12, $12 >> 31, $10, $16);
     $9 = $12 + $9 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $8 | 0;
     $6 = $9 >>> 0 < $12 >>> 0 ? $6 + 1 | 0 : $6;
     $12 = __wasm_i64_mul($3, $3 >> 31, $20, $19);
     $8 = $12 + $9 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $8 >>> 0 < $12 >>> 0 ? $6 + 1 | 0 : $6;
     $12 = __wasm_i64_mul($15, $15 >> 31, $21, $22);
     $8 = $12 + $8 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $8 >>> 0 < $12 >>> 0 ? $6 + 1 | 0 : $6;
     $9 = $4 & 31;
     HEAP32[$17 >> 2] = $7 - (32 <= ($4 & 63) >>> 0 ? $6 >> $9 : ((1 << $9) - 1 & $6) << 32 - $9 | $8 >>> $9);
     $12 = $18;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if (($3 | 0) != 2) {
    if (($1 | 0) < 1) {
     break label$1
    }
    $15 = HEAP32[$0 + -4 >> 2];
    $2 = HEAP32[$2 >> 2];
    $9 = $2;
    $8 = $2 >> 31;
    $2 = 0;
    while (1) {
     $3 = $2 << 2;
     $6 = $3 + $5 | 0;
     $18 = HEAP32[$0 + $3 >> 2];
     $15 = __wasm_i64_mul($15, $15 >> 31, $9, $8);
     $7 = i64toi32_i32$HIGH_BITS;
     $3 = $4;
     $12 = $3 & 31;
     HEAP32[$6 >> 2] = $18 - (32 <= ($3 & 63) >>> 0 ? $7 >> $12 : ((1 << $12) - 1 & $7) << 32 - $12 | $15 >>> $12);
     $15 = $18;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if (($1 | 0) < 1) {
    break label$1
   }
   $3 = HEAP32[$0 + -4 >> 2];
   $18 = HEAP32[$0 + -8 >> 2];
   $15 = HEAP32[$2 >> 2];
   $10 = $15;
   $16 = $10 >> 31;
   $2 = HEAP32[$2 + 4 >> 2];
   $17 = $2;
   $11 = $2 >> 31;
   $2 = 0;
   while (1) {
    $15 = $3;
    $3 = $2 << 2;
    $9 = $3 + $5 | 0;
    $3 = HEAP32[$0 + $3 >> 2];
    $12 = __wasm_i64_mul($15, $15 >> 31, $10, $16);
    $7 = i64toi32_i32$HIGH_BITS;
    $18 = __wasm_i64_mul($18, $18 >> 31, $17, $11);
    $12 = $18 + $12 | 0;
    $6 = i64toi32_i32$HIGH_BITS + $7 | 0;
    $6 = $12 >>> 0 < $18 >>> 0 ? $6 + 1 | 0 : $6;
    $7 = $12;
    $12 = $4 & 31;
    HEAP32[$9 >> 2] = $3 - (32 <= ($4 & 63) >>> 0 ? $6 >> $12 : ((1 << $12) - 1 & $6) << 32 - $12 | $7 >>> $12);
    $18 = $15;
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__lpc_restore_signal($0, $1, $2, $3, $4, $5) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $4 = $4 | 0;
  $5 = $5 | 0;
  var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $30 = 0;
  label$1 : {
   if ($3 >>> 0 >= 13) {
    if (($1 | 0) < 1) {
     break label$1
    }
    $17 = $3 + -13 | 0;
    while (1) {
     $25 = 0;
     $26 = 0;
     $23 = 0;
     $24 = 0;
     $21 = 0;
     $22 = 0;
     $19 = 0;
     $20 = 0;
     $18 = 0;
     $15 = 0;
     $12 = 0;
     $10 = 0;
     $14 = 0;
     $9 = 0;
     $13 = 0;
     $7 = 0;
     $16 = 0;
     $11 = 0;
     $8 = 0;
     $3 = 0;
     label$4 : {
      switch ($17 | 0) {
      case 19:
       $25 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -128 >> 2], HEAP32[$2 + 124 >> 2]);
      case 18:
       $26 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -124 >> 2], HEAP32[$2 + 120 >> 2]) + $25 | 0;
      case 17:
       $23 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -120 >> 2], HEAP32[$2 + 116 >> 2]) + $26 | 0;
      case 16:
       $24 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -116 >> 2], HEAP32[$2 + 112 >> 2]) + $23 | 0;
      case 15:
       $21 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -112 >> 2], HEAP32[$2 + 108 >> 2]) + $24 | 0;
      case 14:
       $22 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -108 >> 2], HEAP32[$2 + 104 >> 2]) + $21 | 0;
      case 13:
       $19 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -104 >> 2], HEAP32[$2 + 100 >> 2]) + $22 | 0;
      case 12:
       $20 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -100 >> 2], HEAP32[$2 + 96 >> 2]) + $19 | 0;
      case 11:
       $18 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -96 >> 2], HEAP32[$2 + 92 >> 2]) + $20 | 0;
      case 10:
       $15 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -92 >> 2], HEAP32[$2 + 88 >> 2]) + $18 | 0;
      case 9:
       $12 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -88 >> 2], HEAP32[$2 + 84 >> 2]) + $15 | 0;
      case 8:
       $10 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -84 >> 2], HEAP32[$2 + 80 >> 2]) + $12 | 0;
      case 7:
       $14 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -80 >> 2], HEAP32[$2 + 76 >> 2]) + $10 | 0;
      case 6:
       $9 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -76 >> 2], HEAP32[$2 + 72 >> 2]) + $14 | 0;
      case 5:
       $13 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -72 >> 2], HEAP32[$2 + 68 >> 2]) + $9 | 0;
      case 4:
       $7 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -68 >> 2], HEAP32[$2 + 64 >> 2]) + $13 | 0;
      case 3:
       $16 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -64 >> 2], HEAP32[$2 + 60 >> 2]) + $7 | 0;
      case 2:
       $11 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -60 >> 2], HEAP32[$2 + 56 >> 2]) + $16 | 0;
      case 1:
       $8 = Math_imul(HEAP32[(($6 << 2) + $5 | 0) + -56 >> 2], HEAP32[$2 + 52 >> 2]) + $11 | 0;
      case 0:
       $3 = ($6 << 2) + $5 | 0;
       $3 = ((((((((((((Math_imul(HEAP32[$3 + -52 >> 2], HEAP32[$2 + 48 >> 2]) + $8 | 0) + Math_imul(HEAP32[$3 + -48 >> 2], HEAP32[$2 + 44 >> 2]) | 0) + Math_imul(HEAP32[$3 + -44 >> 2], HEAP32[$2 + 40 >> 2]) | 0) + Math_imul(HEAP32[$3 + -40 >> 2], HEAP32[$2 + 36 >> 2]) | 0) + Math_imul(HEAP32[$3 + -36 >> 2], HEAP32[$2 + 32 >> 2]) | 0) + Math_imul(HEAP32[$3 + -32 >> 2], HEAP32[$2 + 28 >> 2]) | 0) + Math_imul(HEAP32[$3 + -28 >> 2], HEAP32[$2 + 24 >> 2]) | 0) + Math_imul(HEAP32[$3 + -24 >> 2], HEAP32[$2 + 20 >> 2]) | 0) + Math_imul(HEAP32[$3 + -20 >> 2], HEAP32[$2 + 16 >> 2]) | 0) + Math_imul(HEAP32[$3 + -16 >> 2], HEAP32[$2 + 12 >> 2]) | 0) + Math_imul(HEAP32[$3 + -12 >> 2], HEAP32[$2 + 8 >> 2]) | 0) + Math_imul(HEAP32[$3 + -8 >> 2], HEAP32[$2 + 4 >> 2]) | 0) + Math_imul(HEAP32[$3 + -4 >> 2], HEAP32[$2 >> 2]) | 0;
       break;
      default:
       break label$4;
      };
     }
     $8 = $6 << 2;
     HEAP32[$8 + $5 >> 2] = HEAP32[$0 + $8 >> 2] + ($3 >> $4);
     $6 = $6 + 1 | 0;
     if (($6 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if ($3 >>> 0 >= 9) {
    if ($3 >>> 0 >= 11) {
     if (($3 | 0) != 12) {
      if (($1 | 0) < 1) {
       break label$1
      }
      $6 = HEAP32[$5 + -4 >> 2];
      $3 = HEAP32[$5 + -8 >> 2];
      $8 = HEAP32[$5 + -12 >> 2];
      $11 = HEAP32[$5 + -16 >> 2];
      $16 = HEAP32[$5 + -20 >> 2];
      $7 = HEAP32[$5 + -24 >> 2];
      $13 = HEAP32[$5 + -28 >> 2];
      $9 = HEAP32[$5 + -32 >> 2];
      $14 = HEAP32[$5 + -36 >> 2];
      $10 = HEAP32[$5 + -40 >> 2];
      $12 = HEAP32[$5 + -44 >> 2];
      $27 = HEAP32[$2 >> 2];
      $28 = HEAP32[$2 + 4 >> 2];
      $25 = HEAP32[$2 + 8 >> 2];
      $26 = HEAP32[$2 + 12 >> 2];
      $23 = HEAP32[$2 + 16 >> 2];
      $24 = HEAP32[$2 + 20 >> 2];
      $21 = HEAP32[$2 + 24 >> 2];
      $22 = HEAP32[$2 + 28 >> 2];
      $19 = HEAP32[$2 + 32 >> 2];
      $20 = HEAP32[$2 + 36 >> 2];
      $18 = HEAP32[$2 + 40 >> 2];
      $2 = 0;
      while (1) {
       $17 = $10;
       $12 = Math_imul($10, $20) + Math_imul($12, $18) | 0;
       $10 = $14;
       $12 = $12 + Math_imul($19, $10) | 0;
       $14 = $9;
       $12 = Math_imul($9, $22) + $12 | 0;
       $9 = $13;
       $12 = $12 + Math_imul($21, $9) | 0;
       $13 = $7;
       $12 = Math_imul($7, $24) + $12 | 0;
       $7 = $16;
       $12 = $12 + Math_imul($23, $7) | 0;
       $16 = $11;
       $12 = Math_imul($11, $26) + $12 | 0;
       $11 = $8;
       $15 = Math_imul($8, $25) + $12 | 0;
       $8 = $3;
       $12 = $2 << 2;
       $15 = Math_imul($3, $28) + $15 | 0;
       $3 = $6;
       $6 = HEAP32[$12 + $0 >> 2] + ($15 + Math_imul($27, $3) >> $4) | 0;
       HEAP32[$5 + $12 >> 2] = $6;
       $12 = $17;
       $2 = $2 + 1 | 0;
       if (($2 | 0) != ($1 | 0)) {
        continue
       }
       break;
      };
      break label$1;
     }
     if (($1 | 0) < 1) {
      break label$1
     }
     $6 = HEAP32[$5 + -4 >> 2];
     $3 = HEAP32[$5 + -8 >> 2];
     $8 = HEAP32[$5 + -12 >> 2];
     $11 = HEAP32[$5 + -16 >> 2];
     $16 = HEAP32[$5 + -20 >> 2];
     $7 = HEAP32[$5 + -24 >> 2];
     $13 = HEAP32[$5 + -28 >> 2];
     $9 = HEAP32[$5 + -32 >> 2];
     $14 = HEAP32[$5 + -36 >> 2];
     $10 = HEAP32[$5 + -40 >> 2];
     $12 = HEAP32[$5 + -44 >> 2];
     $15 = HEAP32[$5 + -48 >> 2];
     $29 = HEAP32[$2 >> 2];
     $30 = HEAP32[$2 + 4 >> 2];
     $27 = HEAP32[$2 + 8 >> 2];
     $28 = HEAP32[$2 + 12 >> 2];
     $25 = HEAP32[$2 + 16 >> 2];
     $26 = HEAP32[$2 + 20 >> 2];
     $23 = HEAP32[$2 + 24 >> 2];
     $24 = HEAP32[$2 + 28 >> 2];
     $21 = HEAP32[$2 + 32 >> 2];
     $22 = HEAP32[$2 + 36 >> 2];
     $19 = HEAP32[$2 + 40 >> 2];
     $20 = HEAP32[$2 + 44 >> 2];
     $2 = 0;
     while (1) {
      $17 = $12;
      $15 = Math_imul($12, $19) + Math_imul($15, $20) | 0;
      $12 = $10;
      $15 = Math_imul($10, $22) + $15 | 0;
      $10 = $14;
      $15 = $15 + Math_imul($21, $10) | 0;
      $14 = $9;
      $15 = Math_imul($9, $24) + $15 | 0;
      $9 = $13;
      $15 = $15 + Math_imul($23, $9) | 0;
      $13 = $7;
      $15 = Math_imul($7, $26) + $15 | 0;
      $7 = $16;
      $15 = $15 + Math_imul($25, $7) | 0;
      $16 = $11;
      $15 = Math_imul($11, $28) + $15 | 0;
      $11 = $8;
      $18 = Math_imul($8, $27) + $15 | 0;
      $8 = $3;
      $15 = $2 << 2;
      $18 = Math_imul($3, $30) + $18 | 0;
      $3 = $6;
      $6 = HEAP32[$15 + $0 >> 2] + ($18 + Math_imul($29, $3) >> $4) | 0;
      HEAP32[$5 + $15 >> 2] = $6;
      $15 = $17;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($3 | 0) != 10) {
     if (($1 | 0) < 1) {
      break label$1
     }
     $6 = HEAP32[$5 + -4 >> 2];
     $3 = HEAP32[$5 + -8 >> 2];
     $8 = HEAP32[$5 + -12 >> 2];
     $11 = HEAP32[$5 + -16 >> 2];
     $16 = HEAP32[$5 + -20 >> 2];
     $7 = HEAP32[$5 + -24 >> 2];
     $13 = HEAP32[$5 + -28 >> 2];
     $9 = HEAP32[$5 + -32 >> 2];
     $14 = HEAP32[$5 + -36 >> 2];
     $23 = HEAP32[$2 >> 2];
     $24 = HEAP32[$2 + 4 >> 2];
     $21 = HEAP32[$2 + 8 >> 2];
     $22 = HEAP32[$2 + 12 >> 2];
     $19 = HEAP32[$2 + 16 >> 2];
     $20 = HEAP32[$2 + 20 >> 2];
     $18 = HEAP32[$2 + 24 >> 2];
     $15 = HEAP32[$2 + 28 >> 2];
     $17 = HEAP32[$2 + 32 >> 2];
     $2 = 0;
     while (1) {
      $10 = $9;
      $14 = Math_imul($9, $15) + Math_imul($14, $17) | 0;
      $9 = $13;
      $14 = $14 + Math_imul($18, $9) | 0;
      $13 = $7;
      $14 = Math_imul($7, $20) + $14 | 0;
      $7 = $16;
      $14 = $14 + Math_imul($19, $7) | 0;
      $16 = $11;
      $14 = Math_imul($11, $22) + $14 | 0;
      $11 = $8;
      $12 = Math_imul($8, $21) + $14 | 0;
      $8 = $3;
      $14 = $2 << 2;
      $12 = Math_imul($3, $24) + $12 | 0;
      $3 = $6;
      $6 = HEAP32[$14 + $0 >> 2] + ($12 + Math_imul($23, $3) >> $4) | 0;
      HEAP32[$5 + $14 >> 2] = $6;
      $14 = $10;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($1 | 0) < 1) {
     break label$1
    }
    $6 = HEAP32[$5 + -4 >> 2];
    $3 = HEAP32[$5 + -8 >> 2];
    $8 = HEAP32[$5 + -12 >> 2];
    $11 = HEAP32[$5 + -16 >> 2];
    $16 = HEAP32[$5 + -20 >> 2];
    $7 = HEAP32[$5 + -24 >> 2];
    $13 = HEAP32[$5 + -28 >> 2];
    $9 = HEAP32[$5 + -32 >> 2];
    $14 = HEAP32[$5 + -36 >> 2];
    $10 = HEAP32[$5 + -40 >> 2];
    $25 = HEAP32[$2 >> 2];
    $26 = HEAP32[$2 + 4 >> 2];
    $23 = HEAP32[$2 + 8 >> 2];
    $24 = HEAP32[$2 + 12 >> 2];
    $21 = HEAP32[$2 + 16 >> 2];
    $22 = HEAP32[$2 + 20 >> 2];
    $19 = HEAP32[$2 + 24 >> 2];
    $20 = HEAP32[$2 + 28 >> 2];
    $18 = HEAP32[$2 + 32 >> 2];
    $15 = HEAP32[$2 + 36 >> 2];
    $2 = 0;
    while (1) {
     $12 = $14;
     $10 = Math_imul($18, $12) + Math_imul($10, $15) | 0;
     $14 = $9;
     $10 = Math_imul($9, $20) + $10 | 0;
     $9 = $13;
     $10 = $10 + Math_imul($19, $9) | 0;
     $13 = $7;
     $10 = Math_imul($7, $22) + $10 | 0;
     $7 = $16;
     $10 = $10 + Math_imul($21, $7) | 0;
     $16 = $11;
     $10 = Math_imul($11, $24) + $10 | 0;
     $11 = $8;
     $17 = Math_imul($8, $23) + $10 | 0;
     $8 = $3;
     $10 = $2 << 2;
     $17 = Math_imul($3, $26) + $17 | 0;
     $3 = $6;
     $6 = HEAP32[$10 + $0 >> 2] + ($17 + Math_imul($25, $3) >> $4) | 0;
     HEAP32[$5 + $10 >> 2] = $6;
     $10 = $12;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if ($3 >>> 0 >= 5) {
    if ($3 >>> 0 >= 7) {
     if (($3 | 0) != 8) {
      if (($1 | 0) < 1) {
       break label$1
      }
      $6 = HEAP32[$5 + -4 >> 2];
      $3 = HEAP32[$5 + -8 >> 2];
      $8 = HEAP32[$5 + -12 >> 2];
      $11 = HEAP32[$5 + -16 >> 2];
      $16 = HEAP32[$5 + -20 >> 2];
      $7 = HEAP32[$5 + -24 >> 2];
      $13 = HEAP32[$5 + -28 >> 2];
      $19 = HEAP32[$2 >> 2];
      $20 = HEAP32[$2 + 4 >> 2];
      $18 = HEAP32[$2 + 8 >> 2];
      $15 = HEAP32[$2 + 12 >> 2];
      $17 = HEAP32[$2 + 16 >> 2];
      $12 = HEAP32[$2 + 20 >> 2];
      $10 = HEAP32[$2 + 24 >> 2];
      $2 = 0;
      while (1) {
       $9 = $7;
       $13 = Math_imul($7, $12) + Math_imul($10, $13) | 0;
       $7 = $16;
       $13 = $13 + Math_imul($17, $7) | 0;
       $16 = $11;
       $13 = Math_imul($11, $15) + $13 | 0;
       $11 = $8;
       $14 = Math_imul($8, $18) + $13 | 0;
       $8 = $3;
       $13 = $2 << 2;
       $14 = Math_imul($3, $20) + $14 | 0;
       $3 = $6;
       $6 = HEAP32[$13 + $0 >> 2] + ($14 + Math_imul($19, $3) >> $4) | 0;
       HEAP32[$5 + $13 >> 2] = $6;
       $13 = $9;
       $2 = $2 + 1 | 0;
       if (($2 | 0) != ($1 | 0)) {
        continue
       }
       break;
      };
      break label$1;
     }
     if (($1 | 0) < 1) {
      break label$1
     }
     $6 = HEAP32[$5 + -4 >> 2];
     $3 = HEAP32[$5 + -8 >> 2];
     $8 = HEAP32[$5 + -12 >> 2];
     $11 = HEAP32[$5 + -16 >> 2];
     $16 = HEAP32[$5 + -20 >> 2];
     $7 = HEAP32[$5 + -24 >> 2];
     $13 = HEAP32[$5 + -28 >> 2];
     $9 = HEAP32[$5 + -32 >> 2];
     $21 = HEAP32[$2 >> 2];
     $22 = HEAP32[$2 + 4 >> 2];
     $19 = HEAP32[$2 + 8 >> 2];
     $20 = HEAP32[$2 + 12 >> 2];
     $18 = HEAP32[$2 + 16 >> 2];
     $15 = HEAP32[$2 + 20 >> 2];
     $17 = HEAP32[$2 + 24 >> 2];
     $12 = HEAP32[$2 + 28 >> 2];
     $2 = 0;
     while (1) {
      $14 = $13;
      $9 = Math_imul($17, $13) + Math_imul($9, $12) | 0;
      $13 = $7;
      $9 = Math_imul($7, $15) + $9 | 0;
      $7 = $16;
      $9 = $9 + Math_imul($18, $7) | 0;
      $16 = $11;
      $9 = Math_imul($11, $20) + $9 | 0;
      $11 = $8;
      $10 = Math_imul($8, $19) + $9 | 0;
      $8 = $3;
      $9 = $2 << 2;
      $10 = Math_imul($3, $22) + $10 | 0;
      $3 = $6;
      $6 = HEAP32[$9 + $0 >> 2] + ($10 + Math_imul($21, $3) >> $4) | 0;
      HEAP32[$5 + $9 >> 2] = $6;
      $9 = $14;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($3 | 0) != 6) {
     if (($1 | 0) < 1) {
      break label$1
     }
     $6 = HEAP32[$5 + -4 >> 2];
     $3 = HEAP32[$5 + -8 >> 2];
     $8 = HEAP32[$5 + -12 >> 2];
     $11 = HEAP32[$5 + -16 >> 2];
     $16 = HEAP32[$5 + -20 >> 2];
     $17 = HEAP32[$2 >> 2];
     $12 = HEAP32[$2 + 4 >> 2];
     $10 = HEAP32[$2 + 8 >> 2];
     $14 = HEAP32[$2 + 12 >> 2];
     $9 = HEAP32[$2 + 16 >> 2];
     $2 = 0;
     while (1) {
      $7 = $11;
      $16 = Math_imul($14, $7) + Math_imul($9, $16) | 0;
      $11 = $8;
      $13 = Math_imul($8, $10) + $16 | 0;
      $8 = $3;
      $16 = $2 << 2;
      $13 = Math_imul($3, $12) + $13 | 0;
      $3 = $6;
      $6 = HEAP32[$16 + $0 >> 2] + ($13 + Math_imul($17, $3) >> $4) | 0;
      HEAP32[$5 + $16 >> 2] = $6;
      $16 = $7;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($1 | 0) < 1) {
     break label$1
    }
    $6 = HEAP32[$5 + -4 >> 2];
    $3 = HEAP32[$5 + -8 >> 2];
    $8 = HEAP32[$5 + -12 >> 2];
    $11 = HEAP32[$5 + -16 >> 2];
    $16 = HEAP32[$5 + -20 >> 2];
    $7 = HEAP32[$5 + -24 >> 2];
    $18 = HEAP32[$2 >> 2];
    $15 = HEAP32[$2 + 4 >> 2];
    $17 = HEAP32[$2 + 8 >> 2];
    $12 = HEAP32[$2 + 12 >> 2];
    $10 = HEAP32[$2 + 16 >> 2];
    $14 = HEAP32[$2 + 20 >> 2];
    $2 = 0;
    while (1) {
     $13 = $16;
     $7 = Math_imul($10, $13) + Math_imul($7, $14) | 0;
     $16 = $11;
     $7 = Math_imul($11, $12) + $7 | 0;
     $11 = $8;
     $9 = Math_imul($8, $17) + $7 | 0;
     $8 = $3;
     $7 = $2 << 2;
     $9 = Math_imul($3, $15) + $9 | 0;
     $3 = $6;
     $6 = HEAP32[$7 + $0 >> 2] + ($9 + Math_imul($18, $3) >> $4) | 0;
     HEAP32[$5 + $7 >> 2] = $6;
     $7 = $13;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if ($3 >>> 0 >= 3) {
    if (($3 | 0) != 4) {
     if (($1 | 0) < 1) {
      break label$1
     }
     $6 = HEAP32[$5 + -4 >> 2];
     $3 = HEAP32[$5 + -8 >> 2];
     $8 = HEAP32[$5 + -12 >> 2];
     $9 = HEAP32[$2 >> 2];
     $13 = HEAP32[$2 + 4 >> 2];
     $7 = HEAP32[$2 + 8 >> 2];
     $2 = 0;
     while (1) {
      $11 = $3;
      $16 = $2 << 2;
      $8 = Math_imul($3, $13) + Math_imul($8, $7) | 0;
      $3 = $6;
      $6 = HEAP32[$16 + $0 >> 2] + ($8 + Math_imul($9, $3) >> $4) | 0;
      HEAP32[$5 + $16 >> 2] = $6;
      $8 = $11;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($1 | 0) < 1) {
     break label$1
    }
    $6 = HEAP32[$5 + -4 >> 2];
    $3 = HEAP32[$5 + -8 >> 2];
    $8 = HEAP32[$5 + -12 >> 2];
    $11 = HEAP32[$5 + -16 >> 2];
    $10 = HEAP32[$2 >> 2];
    $14 = HEAP32[$2 + 4 >> 2];
    $9 = HEAP32[$2 + 8 >> 2];
    $13 = HEAP32[$2 + 12 >> 2];
    $2 = 0;
    while (1) {
     $16 = $8;
     $7 = Math_imul($8, $9) + Math_imul($11, $13) | 0;
     $8 = $3;
     $11 = $2 << 2;
     $7 = Math_imul($3, $14) + $7 | 0;
     $3 = $6;
     $6 = HEAP32[$11 + $0 >> 2] + ($7 + Math_imul($10, $3) >> $4) | 0;
     HEAP32[$5 + $11 >> 2] = $6;
     $11 = $16;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if (($3 | 0) != 2) {
    if (($1 | 0) < 1) {
     break label$1
    }
    $6 = HEAP32[$5 + -4 >> 2];
    $8 = HEAP32[$2 >> 2];
    $2 = 0;
    while (1) {
     $3 = $2 << 2;
     $6 = HEAP32[$3 + $0 >> 2] + (Math_imul($6, $8) >> $4) | 0;
     HEAP32[$3 + $5 >> 2] = $6;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if (($1 | 0) < 1) {
    break label$1
   }
   $6 = HEAP32[$5 + -4 >> 2];
   $3 = HEAP32[$5 + -8 >> 2];
   $7 = HEAP32[$2 >> 2];
   $16 = HEAP32[$2 + 4 >> 2];
   $2 = 0;
   while (1) {
    $8 = $6;
    $11 = $2 << 2;
    $6 = HEAP32[$11 + $0 >> 2] + (Math_imul($6, $7) + Math_imul($3, $16) >> $4) | 0;
    HEAP32[$5 + $11 >> 2] = $6;
    $3 = $8;
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__lpc_restore_signal_wide($0, $1, $2, $3, $4, $5) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $4 = $4 | 0;
  $5 = $5 | 0;
  var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0;
  label$1 : {
   if ($3 >>> 0 >= 13) {
    if (($1 | 0) < 1) {
     break label$1
    }
    $13 = $4;
    $12 = $3 + -13 | 0;
    while (1) {
     $4 = 0;
     $3 = 0;
     label$4 : {
      switch ($12 | 0) {
      case 19:
       $3 = HEAP32[(($9 << 2) + $5 | 0) + -128 >> 2];
       $4 = $3;
       $7 = $3 >> 31;
       $3 = HEAP32[$2 + 124 >> 2];
       $4 = __wasm_i64_mul($4, $7, $3, $3 >> 31);
       $3 = i64toi32_i32$HIGH_BITS;
      case 18:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -124 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 120 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 17:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -120 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 116 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 16:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -116 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 112 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 15:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -112 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 108 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 14:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -108 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 104 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 13:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -104 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 100 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 12:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -100 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 96 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 11:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -96 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 92 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 10:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -92 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 88 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 9:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -88 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 84 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 8:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -84 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 80 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 7:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -80 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 76 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 6:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -76 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 72 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 5:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -72 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 68 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 4:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -68 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 64 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 3:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -64 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 60 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 2:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -60 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 56 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 1:
       $7 = HEAP32[(($9 << 2) + $5 | 0) + -56 >> 2];
       $6 = $7;
       $8 = $7 >> 31;
       $7 = HEAP32[$2 + 52 >> 2];
       $7 = __wasm_i64_mul($6, $8, $7, $7 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $7 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $7;
       $3 = $6;
      case 0:
       $7 = ($9 << 2) + $5 | 0;
       $8 = HEAP32[$7 + -52 >> 2];
       $6 = $8;
       $10 = $8 >> 31;
       $8 = HEAP32[$2 + 48 >> 2];
       $8 = __wasm_i64_mul($6, $10, $8, $8 >> 31) + $4 | 0;
       $6 = $3 + i64toi32_i32$HIGH_BITS | 0;
       $6 = $8 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $3 = HEAP32[$7 + -48 >> 2];
       $4 = $3;
       $10 = $3 >> 31;
       $3 = HEAP32[$2 + 44 >> 2];
       $4 = __wasm_i64_mul($4, $10, $3, $3 >> 31);
       $3 = $4 + $8 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $3 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $8 = $3;
       $3 = HEAP32[$7 + -44 >> 2];
       $4 = $3;
       $10 = $3 >> 31;
       $3 = HEAP32[$2 + 40 >> 2];
       $4 = __wasm_i64_mul($4, $10, $3, $3 >> 31);
       $3 = $8 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $3 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $8 = $3;
       $3 = HEAP32[$7 + -40 >> 2];
       $4 = $3;
       $10 = $3 >> 31;
       $3 = HEAP32[$2 + 36 >> 2];
       $4 = __wasm_i64_mul($4, $10, $3, $3 >> 31);
       $3 = $8 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $3 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $8 = $3;
       $3 = HEAP32[$7 + -36 >> 2];
       $4 = $3;
       $10 = $3 >> 31;
       $3 = HEAP32[$2 + 32 >> 2];
       $4 = __wasm_i64_mul($4, $10, $3, $3 >> 31);
       $3 = $8 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $3 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $8 = $3;
       $3 = HEAP32[$7 + -32 >> 2];
       $4 = $3;
       $10 = $3 >> 31;
       $3 = HEAP32[$2 + 28 >> 2];
       $4 = __wasm_i64_mul($4, $10, $3, $3 >> 31);
       $3 = $8 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $3 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $8 = $3;
       $3 = HEAP32[$7 + -28 >> 2];
       $4 = $3;
       $10 = $3 >> 31;
       $3 = HEAP32[$2 + 24 >> 2];
       $4 = __wasm_i64_mul($4, $10, $3, $3 >> 31);
       $3 = $8 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $3 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $8 = $3;
       $3 = HEAP32[$7 + -24 >> 2];
       $4 = $3;
       $10 = $3 >> 31;
       $3 = HEAP32[$2 + 20 >> 2];
       $4 = __wasm_i64_mul($4, $10, $3, $3 >> 31);
       $3 = $8 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $3 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $8 = $3;
       $3 = HEAP32[$7 + -20 >> 2];
       $4 = $3;
       $10 = $3 >> 31;
       $3 = HEAP32[$2 + 16 >> 2];
       $4 = __wasm_i64_mul($4, $10, $3, $3 >> 31);
       $3 = $8 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $3 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $8 = $3;
       $3 = HEAP32[$7 + -16 >> 2];
       $4 = $3;
       $10 = $3 >> 31;
       $3 = HEAP32[$2 + 12 >> 2];
       $4 = __wasm_i64_mul($4, $10, $3, $3 >> 31);
       $3 = $8 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $3 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $8 = $3;
       $3 = HEAP32[$7 + -12 >> 2];
       $4 = $3;
       $10 = $3 >> 31;
       $3 = HEAP32[$2 + 8 >> 2];
       $4 = __wasm_i64_mul($4, $10, $3, $3 >> 31);
       $3 = $8 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $3 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $8 = $3;
       $3 = HEAP32[$7 + -8 >> 2];
       $4 = $3;
       $10 = $3 >> 31;
       $3 = HEAP32[$2 + 4 >> 2];
       $4 = __wasm_i64_mul($4, $10, $3, $3 >> 31);
       $3 = $8 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $3 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $8 = $3;
       $3 = HEAP32[$7 + -4 >> 2];
       $4 = $3;
       $7 = $3 >> 31;
       $3 = HEAP32[$2 >> 2];
       $4 = __wasm_i64_mul($4, $7, $3, $3 >> 31);
       $3 = $8 + $4 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $3 >>> 0 < $4 >>> 0 ? $6 + 1 | 0 : $6;
       $4 = $3;
       $3 = $6;
       break;
      default:
       break label$4;
      };
     }
     $7 = $9 << 2;
     $10 = $7 + $5 | 0;
     $6 = HEAP32[$0 + $7 >> 2];
     $8 = $4;
     $4 = $13;
     $7 = $4 & 31;
     HEAP32[$10 >> 2] = $6 + (32 <= ($4 & 63) >>> 0 ? $3 >> $7 : ((1 << $7) - 1 & $3) << 32 - $7 | $8 >>> $7);
     $9 = $9 + 1 | 0;
     if (($9 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if ($3 >>> 0 >= 9) {
    if ($3 >>> 0 >= 11) {
     if (($3 | 0) != 12) {
      if (($1 | 0) < 1) {
       break label$1
      }
      $9 = HEAP32[$5 + -4 >> 2];
      $3 = HEAP32[$5 + -8 >> 2];
      $13 = HEAP32[$5 + -12 >> 2];
      $7 = HEAP32[$5 + -16 >> 2];
      $8 = HEAP32[$5 + -20 >> 2];
      $12 = HEAP32[$5 + -24 >> 2];
      $10 = HEAP32[$5 + -28 >> 2];
      $11 = HEAP32[$5 + -32 >> 2];
      $14 = HEAP32[$5 + -36 >> 2];
      $16 = HEAP32[$5 + -40 >> 2];
      $15 = HEAP32[$5 + -44 >> 2];
      $6 = HEAP32[$2 >> 2];
      $17 = $6;
      $25 = $6 >> 31;
      $6 = HEAP32[$2 + 4 >> 2];
      $26 = $6;
      $27 = $6 >> 31;
      $6 = HEAP32[$2 + 8 >> 2];
      $24 = $6;
      $29 = $6 >> 31;
      $6 = HEAP32[$2 + 12 >> 2];
      $30 = $6;
      $22 = $6 >> 31;
      $6 = HEAP32[$2 + 16 >> 2];
      $31 = $6;
      $32 = $6 >> 31;
      $6 = HEAP32[$2 + 20 >> 2];
      $28 = $6;
      $34 = $6 >> 31;
      $6 = HEAP32[$2 + 24 >> 2];
      $35 = $6;
      $21 = $6 >> 31;
      $6 = HEAP32[$2 + 28 >> 2];
      $36 = $6;
      $37 = $6 >> 31;
      $6 = HEAP32[$2 + 32 >> 2];
      $33 = $6;
      $39 = $6 >> 31;
      $6 = HEAP32[$2 + 36 >> 2];
      $40 = $6;
      $20 = $6 >> 31;
      $2 = HEAP32[$2 + 40 >> 2];
      $41 = $2;
      $42 = $2 >> 31;
      $2 = 0;
      while (1) {
       $6 = $2 << 2;
       $38 = $6 + $5 | 0;
       $43 = HEAP32[$0 + $6 >> 2];
       $18 = $16;
       $6 = __wasm_i64_mul($16, $16 >> 31, $40, $20);
       $44 = i64toi32_i32$HIGH_BITS;
       $16 = $14;
       $19 = __wasm_i64_mul($15, $15 >> 31, $41, $42);
       $15 = $19 + $6 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $44 | 0;
       $6 = $15 >>> 0 < $19 >>> 0 ? $6 + 1 | 0 : $6;
       $19 = $15;
       $15 = __wasm_i64_mul($14, $14 >> 31, $33, $39);
       $14 = $19 + $15 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $14 >>> 0 < $15 >>> 0 ? $6 + 1 | 0 : $6;
       $15 = $14;
       $14 = $11;
       $19 = $15;
       $15 = __wasm_i64_mul($11, $11 >> 31, $36, $37);
       $11 = $19 + $15 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $11 >>> 0 < $15 >>> 0 ? $6 + 1 | 0 : $6;
       $15 = $11;
       $11 = $10;
       $10 = $15;
       $15 = __wasm_i64_mul($11, $11 >> 31, $35, $21);
       $10 = $10 + $15 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $10 >>> 0 < $15 >>> 0 ? $6 + 1 | 0 : $6;
       $15 = $10;
       $10 = $12;
       $19 = $15;
       $15 = __wasm_i64_mul($12, $12 >> 31, $28, $34);
       $12 = $19 + $15 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $12 >>> 0 < $15 >>> 0 ? $6 + 1 | 0 : $6;
       $15 = $12;
       $12 = $8;
       $19 = $15;
       $15 = __wasm_i64_mul($8, $8 >> 31, $31, $32);
       $8 = $19 + $15 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $8 >>> 0 < $15 >>> 0 ? $6 + 1 | 0 : $6;
       $15 = $8;
       $8 = $7;
       $19 = $15;
       $15 = __wasm_i64_mul($7, $7 >> 31, $30, $22);
       $7 = $19 + $15 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $7 >>> 0 < $15 >>> 0 ? $6 + 1 | 0 : $6;
       $19 = $7;
       $7 = $13;
       $15 = __wasm_i64_mul($7, $7 >> 31, $24, $29);
       $13 = $19 + $15 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $13 >>> 0 < $15 >>> 0 ? $6 + 1 | 0 : $6;
       $15 = $13;
       $13 = $3;
       $23 = $38;
       $19 = $15;
       $15 = __wasm_i64_mul($3, $3 >> 31, $26, $27);
       $3 = $19 + $15 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $3 >>> 0 < $15 >>> 0 ? $6 + 1 | 0 : $6;
       $19 = $3;
       $3 = $9;
       $15 = __wasm_i64_mul($3, $3 >> 31, $17, $25);
       $9 = $19 + $15 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $9 >>> 0 < $15 >>> 0 ? $6 + 1 | 0 : $6;
       $38 = $9;
       $9 = $4;
       $15 = $9 & 31;
       $9 = (32 <= ($9 & 63) >>> 0 ? $6 >> $15 : ((1 << $15) - 1 & $6) << 32 - $15 | $38 >>> $15) + $43 | 0;
       HEAP32[$23 >> 2] = $9;
       $15 = $18;
       $2 = $2 + 1 | 0;
       if (($2 | 0) != ($1 | 0)) {
        continue
       }
       break;
      };
      break label$1;
     }
     if (($1 | 0) < 1) {
      break label$1
     }
     $9 = HEAP32[$5 + -4 >> 2];
     $3 = HEAP32[$5 + -8 >> 2];
     $13 = HEAP32[$5 + -12 >> 2];
     $7 = HEAP32[$5 + -16 >> 2];
     $8 = HEAP32[$5 + -20 >> 2];
     $12 = HEAP32[$5 + -24 >> 2];
     $10 = HEAP32[$5 + -28 >> 2];
     $11 = HEAP32[$5 + -32 >> 2];
     $14 = HEAP32[$5 + -36 >> 2];
     $16 = HEAP32[$5 + -40 >> 2];
     $15 = HEAP32[$5 + -44 >> 2];
     $6 = HEAP32[$5 + -48 >> 2];
     $18 = HEAP32[$2 >> 2];
     $25 = $18;
     $26 = $18 >> 31;
     $18 = HEAP32[$2 + 4 >> 2];
     $27 = $18;
     $24 = $18 >> 31;
     $18 = HEAP32[$2 + 8 >> 2];
     $29 = $18;
     $30 = $18 >> 31;
     $18 = HEAP32[$2 + 12 >> 2];
     $22 = $18;
     $31 = $18 >> 31;
     $18 = HEAP32[$2 + 16 >> 2];
     $32 = $18;
     $28 = $18 >> 31;
     $18 = HEAP32[$2 + 20 >> 2];
     $34 = $18;
     $35 = $18 >> 31;
     $18 = HEAP32[$2 + 24 >> 2];
     $21 = $18;
     $36 = $18 >> 31;
     $18 = HEAP32[$2 + 28 >> 2];
     $37 = $18;
     $33 = $18 >> 31;
     $18 = HEAP32[$2 + 32 >> 2];
     $39 = $18;
     $40 = $18 >> 31;
     $18 = HEAP32[$2 + 36 >> 2];
     $20 = $18;
     $41 = $18 >> 31;
     $18 = HEAP32[$2 + 40 >> 2];
     $42 = $18;
     $38 = $18 >> 31;
     $2 = HEAP32[$2 + 44 >> 2];
     $43 = $2;
     $44 = $2 >> 31;
     $2 = 0;
     while (1) {
      $18 = $2 << 2;
      $19 = $18 + $5 | 0;
      $46 = HEAP32[$0 + $18 >> 2];
      $18 = $15;
      $17 = __wasm_i64_mul($15, $15 >> 31, $42, $38);
      $23 = i64toi32_i32$HIGH_BITS;
      $15 = $16;
      $45 = __wasm_i64_mul($6, $6 >> 31, $43, $44);
      $17 = $45 + $17 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $23 | 0;
      $6 = $17 >>> 0 < $45 >>> 0 ? $6 + 1 | 0 : $6;
      $23 = $17;
      $17 = __wasm_i64_mul($16, $16 >> 31, $20, $41);
      $16 = $23 + $17 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $16 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $17 = $16;
      $16 = $14;
      $23 = $17;
      $17 = __wasm_i64_mul($14, $14 >> 31, $39, $40);
      $14 = $23 + $17 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $14 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $17 = $14;
      $14 = $11;
      $23 = $17;
      $17 = __wasm_i64_mul($11, $11 >> 31, $37, $33);
      $11 = $23 + $17 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $11 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $17 = $11;
      $11 = $10;
      $10 = $17;
      $17 = __wasm_i64_mul($11, $11 >> 31, $21, $36);
      $10 = $10 + $17 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $10 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $17 = $10;
      $10 = $12;
      $23 = $17;
      $17 = __wasm_i64_mul($12, $12 >> 31, $34, $35);
      $12 = $23 + $17 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $12 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $17 = $12;
      $12 = $8;
      $23 = $17;
      $17 = __wasm_i64_mul($8, $8 >> 31, $32, $28);
      $8 = $23 + $17 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $8 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $17 = $8;
      $8 = $7;
      $23 = $17;
      $17 = __wasm_i64_mul($7, $7 >> 31, $22, $31);
      $7 = $23 + $17 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $7 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $23 = $7;
      $7 = $13;
      $17 = __wasm_i64_mul($7, $7 >> 31, $29, $30);
      $13 = $23 + $17 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $13 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $17 = $13;
      $13 = $3;
      $23 = $19;
      $19 = $17;
      $17 = __wasm_i64_mul($3, $3 >> 31, $27, $24);
      $3 = $19 + $17 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $3 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $19 = $3;
      $3 = $9;
      $17 = __wasm_i64_mul($3, $3 >> 31, $25, $26);
      $9 = $19 + $17 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $9 >>> 0 < $17 >>> 0 ? $6 + 1 | 0 : $6;
      $19 = $9;
      $9 = $4;
      $17 = $9 & 31;
      $9 = (32 <= ($9 & 63) >>> 0 ? $6 >> $17 : ((1 << $17) - 1 & $6) << 32 - $17 | $19 >>> $17) + $46 | 0;
      HEAP32[$23 >> 2] = $9;
      $6 = $18;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($3 | 0) != 10) {
     if (($1 | 0) < 1) {
      break label$1
     }
     $9 = HEAP32[$5 + -4 >> 2];
     $3 = HEAP32[$5 + -8 >> 2];
     $13 = HEAP32[$5 + -12 >> 2];
     $7 = HEAP32[$5 + -16 >> 2];
     $8 = HEAP32[$5 + -20 >> 2];
     $12 = HEAP32[$5 + -24 >> 2];
     $10 = HEAP32[$5 + -28 >> 2];
     $11 = HEAP32[$5 + -32 >> 2];
     $14 = HEAP32[$5 + -36 >> 2];
     $6 = HEAP32[$2 >> 2];
     $15 = $6;
     $18 = $6 >> 31;
     $6 = HEAP32[$2 + 4 >> 2];
     $17 = $6;
     $25 = $6 >> 31;
     $6 = HEAP32[$2 + 8 >> 2];
     $26 = $6;
     $27 = $6 >> 31;
     $6 = HEAP32[$2 + 12 >> 2];
     $24 = $6;
     $29 = $6 >> 31;
     $6 = HEAP32[$2 + 16 >> 2];
     $30 = $6;
     $22 = $6 >> 31;
     $6 = HEAP32[$2 + 20 >> 2];
     $31 = $6;
     $32 = $6 >> 31;
     $6 = HEAP32[$2 + 24 >> 2];
     $28 = $6;
     $34 = $6 >> 31;
     $6 = HEAP32[$2 + 28 >> 2];
     $35 = $6;
     $21 = $6 >> 31;
     $2 = HEAP32[$2 + 32 >> 2];
     $36 = $2;
     $37 = $2 >> 31;
     $2 = 0;
     while (1) {
      $6 = $2 << 2;
      $33 = $6 + $5 | 0;
      $39 = HEAP32[$0 + $6 >> 2];
      $16 = $11;
      $6 = __wasm_i64_mul($11, $11 >> 31, $35, $21);
      $40 = i64toi32_i32$HIGH_BITS;
      $11 = $10;
      $20 = __wasm_i64_mul($14, $14 >> 31, $36, $37);
      $14 = $20 + $6 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $40 | 0;
      $6 = $14 >>> 0 < $20 >>> 0 ? $6 + 1 | 0 : $6;
      $10 = $14;
      $14 = __wasm_i64_mul($11, $11 >> 31, $28, $34);
      $10 = $10 + $14 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $10 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = $10;
      $10 = $12;
      $20 = $14;
      $14 = __wasm_i64_mul($12, $12 >> 31, $31, $32);
      $12 = $20 + $14 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $12 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = $12;
      $12 = $8;
      $20 = $14;
      $14 = __wasm_i64_mul($8, $8 >> 31, $30, $22);
      $8 = $20 + $14 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $8 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = $8;
      $8 = $7;
      $20 = $14;
      $14 = __wasm_i64_mul($7, $7 >> 31, $24, $29);
      $7 = $20 + $14 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $7 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $20 = $7;
      $7 = $13;
      $14 = __wasm_i64_mul($7, $7 >> 31, $26, $27);
      $13 = $20 + $14 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $13 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $14 = $13;
      $13 = $3;
      $19 = $33;
      $20 = $14;
      $14 = __wasm_i64_mul($3, $3 >> 31, $17, $25);
      $3 = $20 + $14 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $3 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $20 = $3;
      $3 = $9;
      $14 = __wasm_i64_mul($3, $3 >> 31, $15, $18);
      $9 = $20 + $14 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $9 >>> 0 < $14 >>> 0 ? $6 + 1 | 0 : $6;
      $33 = $9;
      $9 = $4;
      $14 = $9 & 31;
      $9 = (32 <= ($9 & 63) >>> 0 ? $6 >> $14 : ((1 << $14) - 1 & $6) << 32 - $14 | $33 >>> $14) + $39 | 0;
      HEAP32[$19 >> 2] = $9;
      $14 = $16;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($1 | 0) < 1) {
     break label$1
    }
    $9 = HEAP32[$5 + -4 >> 2];
    $3 = HEAP32[$5 + -8 >> 2];
    $13 = HEAP32[$5 + -12 >> 2];
    $7 = HEAP32[$5 + -16 >> 2];
    $8 = HEAP32[$5 + -20 >> 2];
    $12 = HEAP32[$5 + -24 >> 2];
    $10 = HEAP32[$5 + -28 >> 2];
    $11 = HEAP32[$5 + -32 >> 2];
    $14 = HEAP32[$5 + -36 >> 2];
    $16 = HEAP32[$5 + -40 >> 2];
    $6 = HEAP32[$2 >> 2];
    $18 = $6;
    $17 = $6 >> 31;
    $6 = HEAP32[$2 + 4 >> 2];
    $25 = $6;
    $26 = $6 >> 31;
    $6 = HEAP32[$2 + 8 >> 2];
    $27 = $6;
    $24 = $6 >> 31;
    $6 = HEAP32[$2 + 12 >> 2];
    $29 = $6;
    $30 = $6 >> 31;
    $6 = HEAP32[$2 + 16 >> 2];
    $22 = $6;
    $31 = $6 >> 31;
    $6 = HEAP32[$2 + 20 >> 2];
    $32 = $6;
    $28 = $6 >> 31;
    $6 = HEAP32[$2 + 24 >> 2];
    $34 = $6;
    $35 = $6 >> 31;
    $6 = HEAP32[$2 + 28 >> 2];
    $21 = $6;
    $36 = $6 >> 31;
    $6 = HEAP32[$2 + 32 >> 2];
    $37 = $6;
    $33 = $6 >> 31;
    $2 = HEAP32[$2 + 36 >> 2];
    $39 = $2;
    $40 = $2 >> 31;
    $2 = 0;
    while (1) {
     $6 = $2 << 2;
     $20 = $6 + $5 | 0;
     $41 = HEAP32[$0 + $6 >> 2];
     $15 = $14;
     $6 = __wasm_i64_mul($14, $14 >> 31, $37, $33);
     $42 = i64toi32_i32$HIGH_BITS;
     $14 = $11;
     $38 = __wasm_i64_mul($16, $16 >> 31, $39, $40);
     $16 = $38 + $6 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $42 | 0;
     $6 = $16 >>> 0 < $38 >>> 0 ? $6 + 1 | 0 : $6;
     $19 = $16;
     $16 = __wasm_i64_mul($11, $11 >> 31, $21, $36);
     $11 = $19 + $16 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $11 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
     $16 = $11;
     $11 = $10;
     $10 = $16;
     $16 = __wasm_i64_mul($11, $11 >> 31, $34, $35);
     $10 = $10 + $16 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $10 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
     $16 = $10;
     $10 = $12;
     $19 = $16;
     $16 = __wasm_i64_mul($12, $12 >> 31, $32, $28);
     $12 = $19 + $16 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $12 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
     $16 = $12;
     $12 = $8;
     $19 = $16;
     $16 = __wasm_i64_mul($8, $8 >> 31, $22, $31);
     $8 = $19 + $16 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $8 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
     $16 = $8;
     $8 = $7;
     $19 = $16;
     $16 = __wasm_i64_mul($7, $7 >> 31, $29, $30);
     $7 = $19 + $16 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $7 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
     $19 = $7;
     $7 = $13;
     $16 = __wasm_i64_mul($7, $7 >> 31, $27, $24);
     $13 = $19 + $16 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $13 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
     $16 = $13;
     $13 = $3;
     $19 = $20;
     $20 = $16;
     $16 = __wasm_i64_mul($3, $3 >> 31, $25, $26);
     $3 = $20 + $16 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $3 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
     $20 = $3;
     $3 = $9;
     $16 = __wasm_i64_mul($3, $3 >> 31, $18, $17);
     $9 = $20 + $16 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $9 >>> 0 < $16 >>> 0 ? $6 + 1 | 0 : $6;
     $20 = $9;
     $9 = $4;
     $16 = $9 & 31;
     $9 = (32 <= ($9 & 63) >>> 0 ? $6 >> $16 : ((1 << $16) - 1 & $6) << 32 - $16 | $20 >>> $16) + $41 | 0;
     HEAP32[$19 >> 2] = $9;
     $16 = $15;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if ($3 >>> 0 >= 5) {
    if ($3 >>> 0 >= 7) {
     if (($3 | 0) != 8) {
      if (($1 | 0) < 1) {
       break label$1
      }
      $9 = HEAP32[$5 + -4 >> 2];
      $3 = HEAP32[$5 + -8 >> 2];
      $13 = HEAP32[$5 + -12 >> 2];
      $7 = HEAP32[$5 + -16 >> 2];
      $8 = HEAP32[$5 + -20 >> 2];
      $12 = HEAP32[$5 + -24 >> 2];
      $10 = HEAP32[$5 + -28 >> 2];
      $11 = HEAP32[$2 >> 2];
      $14 = $11;
      $16 = $11 >> 31;
      $11 = HEAP32[$2 + 4 >> 2];
      $15 = $11;
      $18 = $11 >> 31;
      $11 = HEAP32[$2 + 8 >> 2];
      $17 = $11;
      $25 = $11 >> 31;
      $11 = HEAP32[$2 + 12 >> 2];
      $26 = $11;
      $27 = $11 >> 31;
      $11 = HEAP32[$2 + 16 >> 2];
      $24 = $11;
      $29 = $11 >> 31;
      $11 = HEAP32[$2 + 20 >> 2];
      $30 = $11;
      $22 = $11 >> 31;
      $2 = HEAP32[$2 + 24 >> 2];
      $31 = $2;
      $32 = $2 >> 31;
      $2 = 0;
      while (1) {
       $11 = $2 << 2;
       $28 = $11 + $5 | 0;
       $34 = HEAP32[$0 + $11 >> 2];
       $11 = $12;
       $6 = __wasm_i64_mul($11, $11 >> 31, $30, $22);
       $35 = i64toi32_i32$HIGH_BITS;
       $12 = $8;
       $21 = __wasm_i64_mul($10, $10 >> 31, $31, $32);
       $10 = $21 + $6 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $35 | 0;
       $6 = $10 >>> 0 < $21 >>> 0 ? $6 + 1 | 0 : $6;
       $21 = $10;
       $10 = __wasm_i64_mul($8, $8 >> 31, $24, $29);
       $8 = $21 + $10 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $8 >>> 0 < $10 >>> 0 ? $6 + 1 | 0 : $6;
       $10 = $8;
       $8 = $7;
       $21 = $10;
       $10 = __wasm_i64_mul($7, $7 >> 31, $26, $27);
       $7 = $21 + $10 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $7 >>> 0 < $10 >>> 0 ? $6 + 1 | 0 : $6;
       $21 = $7;
       $7 = $13;
       $10 = __wasm_i64_mul($7, $7 >> 31, $17, $25);
       $13 = $21 + $10 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $13 >>> 0 < $10 >>> 0 ? $6 + 1 | 0 : $6;
       $10 = $13;
       $13 = $3;
       $20 = $28;
       $21 = $10;
       $10 = __wasm_i64_mul($3, $3 >> 31, $15, $18);
       $3 = $21 + $10 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $3 >>> 0 < $10 >>> 0 ? $6 + 1 | 0 : $6;
       $21 = $3;
       $3 = $9;
       $10 = __wasm_i64_mul($3, $3 >> 31, $14, $16);
       $9 = $21 + $10 | 0;
       $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
       $6 = $9 >>> 0 < $10 >>> 0 ? $6 + 1 | 0 : $6;
       $28 = $9;
       $9 = $4;
       $10 = $9 & 31;
       $9 = (32 <= ($9 & 63) >>> 0 ? $6 >> $10 : ((1 << $10) - 1 & $6) << 32 - $10 | $28 >>> $10) + $34 | 0;
       HEAP32[$20 >> 2] = $9;
       $10 = $11;
       $2 = $2 + 1 | 0;
       if (($2 | 0) != ($1 | 0)) {
        continue
       }
       break;
      };
      break label$1;
     }
     if (($1 | 0) < 1) {
      break label$1
     }
     $9 = HEAP32[$5 + -4 >> 2];
     $3 = HEAP32[$5 + -8 >> 2];
     $13 = HEAP32[$5 + -12 >> 2];
     $7 = HEAP32[$5 + -16 >> 2];
     $8 = HEAP32[$5 + -20 >> 2];
     $12 = HEAP32[$5 + -24 >> 2];
     $10 = HEAP32[$5 + -28 >> 2];
     $11 = HEAP32[$5 + -32 >> 2];
     $6 = HEAP32[$2 >> 2];
     $16 = $6;
     $15 = $6 >> 31;
     $6 = HEAP32[$2 + 4 >> 2];
     $18 = $6;
     $17 = $6 >> 31;
     $6 = HEAP32[$2 + 8 >> 2];
     $25 = $6;
     $26 = $6 >> 31;
     $6 = HEAP32[$2 + 12 >> 2];
     $27 = $6;
     $24 = $6 >> 31;
     $6 = HEAP32[$2 + 16 >> 2];
     $29 = $6;
     $30 = $6 >> 31;
     $6 = HEAP32[$2 + 20 >> 2];
     $22 = $6;
     $31 = $6 >> 31;
     $6 = HEAP32[$2 + 24 >> 2];
     $32 = $6;
     $28 = $6 >> 31;
     $2 = HEAP32[$2 + 28 >> 2];
     $34 = $2;
     $35 = $2 >> 31;
     $2 = 0;
     while (1) {
      $6 = $2 << 2;
      $21 = $6 + $5 | 0;
      $36 = HEAP32[$0 + $6 >> 2];
      $14 = $10;
      $6 = __wasm_i64_mul($10, $10 >> 31, $32, $28);
      $37 = i64toi32_i32$HIGH_BITS;
      $10 = $12;
      $33 = __wasm_i64_mul($11, $11 >> 31, $34, $35);
      $11 = $33 + $6 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $37 | 0;
      $6 = $11 >>> 0 < $33 >>> 0 ? $6 + 1 | 0 : $6;
      $20 = $11;
      $11 = __wasm_i64_mul($12, $12 >> 31, $22, $31);
      $12 = $20 + $11 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $12 >>> 0 < $11 >>> 0 ? $6 + 1 | 0 : $6;
      $11 = $12;
      $12 = $8;
      $20 = $11;
      $11 = __wasm_i64_mul($8, $8 >> 31, $29, $30);
      $8 = $20 + $11 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $8 >>> 0 < $11 >>> 0 ? $6 + 1 | 0 : $6;
      $11 = $8;
      $8 = $7;
      $20 = $11;
      $11 = __wasm_i64_mul($7, $7 >> 31, $27, $24);
      $7 = $20 + $11 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $7 >>> 0 < $11 >>> 0 ? $6 + 1 | 0 : $6;
      $20 = $7;
      $7 = $13;
      $11 = __wasm_i64_mul($7, $7 >> 31, $25, $26);
      $13 = $20 + $11 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $13 >>> 0 < $11 >>> 0 ? $6 + 1 | 0 : $6;
      $11 = $13;
      $13 = $3;
      $20 = $21;
      $21 = $11;
      $11 = __wasm_i64_mul($3, $3 >> 31, $18, $17);
      $3 = $21 + $11 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $3 >>> 0 < $11 >>> 0 ? $6 + 1 | 0 : $6;
      $21 = $3;
      $3 = $9;
      $11 = __wasm_i64_mul($3, $3 >> 31, $16, $15);
      $9 = $21 + $11 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $9 >>> 0 < $11 >>> 0 ? $6 + 1 | 0 : $6;
      $21 = $9;
      $9 = $4;
      $11 = $9 & 31;
      $9 = (32 <= ($9 & 63) >>> 0 ? $6 >> $11 : ((1 << $11) - 1 & $6) << 32 - $11 | $21 >>> $11) + $36 | 0;
      HEAP32[$20 >> 2] = $9;
      $11 = $14;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($3 | 0) != 6) {
     if (($1 | 0) < 1) {
      break label$1
     }
     $9 = HEAP32[$5 + -4 >> 2];
     $3 = HEAP32[$5 + -8 >> 2];
     $13 = HEAP32[$5 + -12 >> 2];
     $7 = HEAP32[$5 + -16 >> 2];
     $8 = HEAP32[$5 + -20 >> 2];
     $12 = HEAP32[$2 >> 2];
     $10 = $12;
     $11 = $12 >> 31;
     $12 = HEAP32[$2 + 4 >> 2];
     $14 = $12;
     $16 = $12 >> 31;
     $12 = HEAP32[$2 + 8 >> 2];
     $15 = $12;
     $18 = $12 >> 31;
     $12 = HEAP32[$2 + 12 >> 2];
     $17 = $12;
     $25 = $12 >> 31;
     $2 = HEAP32[$2 + 16 >> 2];
     $26 = $2;
     $27 = $2 >> 31;
     $2 = 0;
     while (1) {
      $12 = $2 << 2;
      $24 = $12 + $5 | 0;
      $29 = HEAP32[$0 + $12 >> 2];
      $12 = $7;
      $6 = __wasm_i64_mul($7, $7 >> 31, $17, $25);
      $30 = i64toi32_i32$HIGH_BITS;
      $7 = $13;
      $22 = __wasm_i64_mul($8, $8 >> 31, $26, $27);
      $8 = $22 + $6 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $30 | 0;
      $6 = $8 >>> 0 < $22 >>> 0 ? $6 + 1 | 0 : $6;
      $13 = $8;
      $8 = __wasm_i64_mul($7, $7 >> 31, $15, $18);
      $13 = $13 + $8 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $13 >>> 0 < $8 >>> 0 ? $6 + 1 | 0 : $6;
      $8 = $13;
      $13 = $3;
      $22 = $8;
      $8 = __wasm_i64_mul($3, $3 >> 31, $14, $16);
      $3 = $22 + $8 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $3 >>> 0 < $8 >>> 0 ? $6 + 1 | 0 : $6;
      $8 = $3;
      $3 = $9;
      $9 = __wasm_i64_mul($3, $3 >> 31, $10, $11);
      $8 = $8 + $9 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $8 >>> 0 < $9 >>> 0 ? $6 + 1 | 0 : $6;
      $9 = $4 & 31;
      $9 = (32 <= ($4 & 63) >>> 0 ? $6 >> $9 : ((1 << $9) - 1 & $6) << 32 - $9 | $8 >>> $9) + $29 | 0;
      HEAP32[$24 >> 2] = $9;
      $8 = $12;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($1 | 0) < 1) {
     break label$1
    }
    $9 = HEAP32[$5 + -4 >> 2];
    $3 = HEAP32[$5 + -8 >> 2];
    $13 = HEAP32[$5 + -12 >> 2];
    $7 = HEAP32[$5 + -16 >> 2];
    $8 = HEAP32[$5 + -20 >> 2];
    $12 = HEAP32[$5 + -24 >> 2];
    $10 = HEAP32[$2 >> 2];
    $11 = $10;
    $14 = $11 >> 31;
    $10 = HEAP32[$2 + 4 >> 2];
    $16 = $10;
    $15 = $10 >> 31;
    $10 = HEAP32[$2 + 8 >> 2];
    $18 = $10;
    $17 = $10 >> 31;
    $10 = HEAP32[$2 + 12 >> 2];
    $25 = $10;
    $26 = $10 >> 31;
    $10 = HEAP32[$2 + 16 >> 2];
    $27 = $10;
    $24 = $10 >> 31;
    $2 = HEAP32[$2 + 20 >> 2];
    $29 = $2;
    $30 = $2 >> 31;
    $2 = 0;
    while (1) {
     $10 = $2 << 2;
     $22 = $10 + $5 | 0;
     $31 = HEAP32[$0 + $10 >> 2];
     $10 = $8;
     $6 = __wasm_i64_mul($8, $8 >> 31, $27, $24);
     $32 = i64toi32_i32$HIGH_BITS;
     $8 = $7;
     $28 = __wasm_i64_mul($12, $12 >> 31, $29, $30);
     $12 = $28 + $6 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $32 | 0;
     $6 = $12 >>> 0 < $28 >>> 0 ? $6 + 1 | 0 : $6;
     $21 = $12;
     $12 = __wasm_i64_mul($7, $7 >> 31, $25, $26);
     $7 = $21 + $12 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $7 >>> 0 < $12 >>> 0 ? $6 + 1 | 0 : $6;
     $21 = $7;
     $7 = $13;
     $12 = __wasm_i64_mul($7, $7 >> 31, $18, $17);
     $13 = $21 + $12 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $13 >>> 0 < $12 >>> 0 ? $6 + 1 | 0 : $6;
     $12 = $13;
     $13 = $3;
     $21 = $22;
     $22 = $12;
     $12 = __wasm_i64_mul($3, $3 >> 31, $16, $15);
     $3 = $22 + $12 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $3 >>> 0 < $12 >>> 0 ? $6 + 1 | 0 : $6;
     $12 = $3;
     $3 = $9;
     $9 = __wasm_i64_mul($3, $3 >> 31, $11, $14);
     $12 = $12 + $9 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $12 >>> 0 < $9 >>> 0 ? $6 + 1 | 0 : $6;
     $9 = $4 & 31;
     $9 = (32 <= ($4 & 63) >>> 0 ? $6 >> $9 : ((1 << $9) - 1 & $6) << 32 - $9 | $12 >>> $9) + $31 | 0;
     HEAP32[$21 >> 2] = $9;
     $12 = $10;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if ($3 >>> 0 >= 3) {
    if (($3 | 0) != 4) {
     if (($1 | 0) < 1) {
      break label$1
     }
     $9 = HEAP32[$5 + -4 >> 2];
     $3 = HEAP32[$5 + -8 >> 2];
     $13 = HEAP32[$5 + -12 >> 2];
     $7 = HEAP32[$2 >> 2];
     $12 = $7;
     $10 = $7 >> 31;
     $7 = HEAP32[$2 + 4 >> 2];
     $11 = $7;
     $14 = $7 >> 31;
     $2 = HEAP32[$2 + 8 >> 2];
     $16 = $2;
     $15 = $2 >> 31;
     $2 = 0;
     while (1) {
      $7 = $2 << 2;
      $8 = $7 + $5 | 0;
      $18 = HEAP32[$0 + $7 >> 2];
      $7 = $3;
      $3 = __wasm_i64_mul($7, $7 >> 31, $11, $14);
      $6 = i64toi32_i32$HIGH_BITS;
      $17 = $8;
      $13 = __wasm_i64_mul($13, $13 >> 31, $16, $15);
      $3 = $13 + $3 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $3 >>> 0 < $13 >>> 0 ? $6 + 1 | 0 : $6;
      $8 = $3;
      $3 = $9;
      $9 = __wasm_i64_mul($3, $3 >> 31, $12, $10);
      $13 = $8 + $9 | 0;
      $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
      $6 = $13 >>> 0 < $9 >>> 0 ? $6 + 1 | 0 : $6;
      $9 = $13;
      $8 = $4 & 31;
      $9 = (32 <= ($4 & 63) >>> 0 ? $6 >> $8 : ((1 << $8) - 1 & $6) << 32 - $8 | $9 >>> $8) + $18 | 0;
      HEAP32[$17 >> 2] = $9;
      $13 = $7;
      $2 = $2 + 1 | 0;
      if (($2 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     break label$1;
    }
    if (($1 | 0) < 1) {
     break label$1
    }
    $9 = HEAP32[$5 + -4 >> 2];
    $3 = HEAP32[$5 + -8 >> 2];
    $13 = HEAP32[$5 + -12 >> 2];
    $7 = HEAP32[$5 + -16 >> 2];
    $8 = HEAP32[$2 >> 2];
    $10 = $8;
    $11 = $8 >> 31;
    $8 = HEAP32[$2 + 4 >> 2];
    $14 = $8;
    $16 = $8 >> 31;
    $8 = HEAP32[$2 + 8 >> 2];
    $15 = $8;
    $18 = $8 >> 31;
    $2 = HEAP32[$2 + 12 >> 2];
    $17 = $2;
    $25 = $2 >> 31;
    $2 = 0;
    while (1) {
     $8 = $2 << 2;
     $12 = $8 + $5 | 0;
     $26 = HEAP32[$0 + $8 >> 2];
     $8 = $13;
     $6 = __wasm_i64_mul($8, $8 >> 31, $15, $18);
     $27 = i64toi32_i32$HIGH_BITS;
     $13 = $3;
     $22 = $12;
     $24 = __wasm_i64_mul($7, $7 >> 31, $17, $25);
     $7 = $24 + $6 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $27 | 0;
     $6 = $7 >>> 0 < $24 >>> 0 ? $6 + 1 | 0 : $6;
     $12 = $7;
     $7 = __wasm_i64_mul($3, $3 >> 31, $14, $16);
     $3 = $12 + $7 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $3 >>> 0 < $7 >>> 0 ? $6 + 1 | 0 : $6;
     $7 = $3;
     $3 = $9;
     $9 = __wasm_i64_mul($3, $3 >> 31, $10, $11);
     $7 = $7 + $9 | 0;
     $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
     $6 = $7 >>> 0 < $9 >>> 0 ? $6 + 1 | 0 : $6;
     $9 = $7;
     $7 = $4;
     $12 = $7 & 31;
     $9 = (32 <= ($7 & 63) >>> 0 ? $6 >> $12 : ((1 << $12) - 1 & $6) << 32 - $12 | $9 >>> $12) + $26 | 0;
     HEAP32[$22 >> 2] = $9;
     $7 = $8;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if (($3 | 0) != 2) {
    if (($1 | 0) < 1) {
     break label$1
    }
    $9 = HEAP32[$5 + -4 >> 2];
    $2 = HEAP32[$2 >> 2];
    $8 = $2;
    $12 = $2 >> 31;
    $2 = 0;
    while (1) {
     $3 = $2 << 2;
     $10 = $3 + $5 | 0;
     $6 = HEAP32[$0 + $3 >> 2];
     $9 = __wasm_i64_mul($9, $9 >> 31, $8, $12);
     $7 = i64toi32_i32$HIGH_BITS;
     $3 = $4;
     $13 = $3 & 31;
     $9 = $6 + (32 <= ($3 & 63) >>> 0 ? $7 >> $13 : ((1 << $13) - 1 & $7) << 32 - $13 | $9 >>> $13) | 0;
     HEAP32[$10 >> 2] = $9;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if (($1 | 0) < 1) {
    break label$1
   }
   $9 = HEAP32[$5 + -4 >> 2];
   $3 = HEAP32[$5 + -8 >> 2];
   $13 = HEAP32[$2 >> 2];
   $8 = $13;
   $12 = $8 >> 31;
   $2 = HEAP32[$2 + 4 >> 2];
   $10 = $2;
   $11 = $2 >> 31;
   $2 = 0;
   while (1) {
    $13 = $2 << 2;
    $7 = $13 + $5 | 0;
    $14 = HEAP32[$0 + $13 >> 2];
    $13 = $9;
    $9 = __wasm_i64_mul($9, $9 >> 31, $8, $12);
    $6 = i64toi32_i32$HIGH_BITS;
    $15 = $7;
    $7 = $9;
    $9 = __wasm_i64_mul($3, $3 >> 31, $10, $11);
    $3 = $7 + $9 | 0;
    $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
    $6 = $3 >>> 0 < $9 >>> 0 ? $6 + 1 | 0 : $6;
    $9 = $3;
    $3 = $4;
    $7 = $3 & 31;
    $9 = (32 <= ($3 & 63) >>> 0 ? $6 >> $7 : ((1 << $7) - 1 & $6) << 32 - $7 | $9 >>> $7) + $14 | 0;
    HEAP32[$15 >> 2] = $9;
    $3 = $13;
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__lpc_compute_expected_bits_per_residual_sample($0, $1) {
  if (!!($0 > 0.0)) {
   $0 = log(.5 / +($1 >>> 0) * $0) * .5 / .6931471805599453;
   return $0 >= 0.0 ? $0 : 0.0;
  }
  return $0 < 0.0 ? 1.e+32 : 0.0;
 }
 
 function FLAC__lpc_compute_best_order($0, $1, $2, $3) {
  var $4 = 0.0, $5 = 0, $6 = 0, $7 = 0.0, $8 = 0, $9 = 0, $10 = 0.0;
  $5 = 1;
  if ($1) {
   $10 = .5 / +($2 >>> 0);
   $7 = 4294967295.0;
   while (1) {
    $4 = HEAPF64[($6 << 3) + $0 >> 3];
    label$3 : {
     if (!!($4 > 0.0)) {
      $4 = log($10 * $4) * .5 / .6931471805599453;
      $4 = $4 >= 0.0 ? $4 : 0.0;
      break label$3;
     }
     $4 = $4 < 0.0 ? 1.e+32 : 0.0;
    }
    $4 = $4 * +($2 - $5 >>> 0) + +(Math_imul($3, $5) >>> 0);
    $8 = $4 < $7;
    $7 = $8 ? $4 : $7;
    $9 = $8 ? $6 : $9;
    $5 = $5 + 1 | 0;
    $6 = $6 + 1 | 0;
    if (($6 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
   $0 = $9 + 1 | 0;
  } else {
   $0 = 1
  }
  return $0;
 }
 
 function strlen($0) {
  var $1 = 0, $2 = 0, $3 = 0;
  label$1 : {
   label$2 : {
    $1 = $0;
    if (!($1 & 3)) {
     break label$2
    }
    if (!HEAPU8[$0 | 0]) {
     return 0
    }
    while (1) {
     $1 = $1 + 1 | 0;
     if (!($1 & 3)) {
      break label$2
     }
     if (HEAPU8[$1 | 0]) {
      continue
     }
     break;
    };
    break label$1;
   }
   while (1) {
    $2 = $1;
    $1 = $1 + 4 | 0;
    $3 = HEAP32[$2 >> 2];
    if (!(($3 ^ -1) & $3 + -16843009 & -2139062144)) {
     continue
    }
    break;
   };
   if (!($3 & 255)) {
    return $2 - $0 | 0
   }
   while (1) {
    $3 = HEAPU8[$2 + 1 | 0];
    $1 = $2 + 1 | 0;
    $2 = $1;
    if ($3) {
     continue
    }
    break;
   };
  }
  return $1 - $0 | 0;
 }
 
 function __strchrnul($0, $1) {
  var $2 = 0, $3 = 0;
  label$1 : {
   $3 = $1 & 255;
   if ($3) {
    if ($0 & 3) {
     while (1) {
      $2 = HEAPU8[$0 | 0];
      if (!$2 | ($2 | 0) == ($1 & 255)) {
       break label$1
      }
      $0 = $0 + 1 | 0;
      if ($0 & 3) {
       continue
      }
      break;
     }
    }
    $2 = HEAP32[$0 >> 2];
    label$5 : {
     if (($2 ^ -1) & $2 + -16843009 & -2139062144) {
      break label$5
     }
     $3 = Math_imul($3, 16843009);
     while (1) {
      $2 = $2 ^ $3;
      if (($2 ^ -1) & $2 + -16843009 & -2139062144) {
       break label$5
      }
      $2 = HEAP32[$0 + 4 >> 2];
      $0 = $0 + 4 | 0;
      if (!($2 + -16843009 & ($2 ^ -1) & -2139062144)) {
       continue
      }
      break;
     };
    }
    while (1) {
     $2 = $0;
     $3 = HEAPU8[$2 | 0];
     if ($3) {
      $0 = $2 + 1 | 0;
      if (($3 | 0) != ($1 & 255)) {
       continue
      }
     }
     break;
    };
    return $2;
   }
   return strlen($0) + $0 | 0;
  }
  return $0;
 }
 
 function strchr($0, $1) {
  $0 = __strchrnul($0, $1);
  return HEAPU8[$0 | 0] == ($1 & 255) ? $0 : 0;
 }
 
 function __stdio_write($0, $1, $2) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
  $3 = global$0 - 32 | 0;
  global$0 = $3;
  $4 = HEAP32[$0 + 28 >> 2];
  HEAP32[$3 + 16 >> 2] = $4;
  $5 = HEAP32[$0 + 20 >> 2];
  HEAP32[$3 + 28 >> 2] = $2;
  HEAP32[$3 + 24 >> 2] = $1;
  $1 = $5 - $4 | 0;
  HEAP32[$3 + 20 >> 2] = $1;
  $4 = $1 + $2 | 0;
  $9 = 2;
  $1 = $3 + 16 | 0;
  label$1 : {
   label$2 : {
    label$3 : {
     if (!__wasi_syscall_ret(__wasi_fd_write(HEAP32[$0 + 60 >> 2], $3 + 16 | 0, 2, $3 + 12 | 0) | 0)) {
      while (1) {
       $5 = HEAP32[$3 + 12 >> 2];
       if (($5 | 0) == ($4 | 0)) {
        break label$3
       }
       if (($5 | 0) <= -1) {
        break label$2
       }
       $6 = HEAP32[$1 + 4 >> 2];
       $7 = $5 >>> 0 > $6 >>> 0;
       $8 = ($7 << 3) + $1 | 0;
       $6 = $5 - ($7 ? $6 : 0) | 0;
       HEAP32[$8 >> 2] = $6 + HEAP32[$8 >> 2];
       $8 = ($7 ? 12 : 4) + $1 | 0;
       HEAP32[$8 >> 2] = HEAP32[$8 >> 2] - $6;
       $4 = $4 - $5 | 0;
       $1 = $7 ? $1 + 8 | 0 : $1;
       $9 = $9 - $7 | 0;
       if (!__wasi_syscall_ret(__wasi_fd_write(HEAP32[$0 + 60 >> 2], $1 | 0, $9 | 0, $3 + 12 | 0) | 0)) {
        continue
       }
       break;
      }
     }
     HEAP32[$3 + 12 >> 2] = -1;
     if (($4 | 0) != -1) {
      break label$2
     }
    }
    $1 = HEAP32[$0 + 44 >> 2];
    HEAP32[$0 + 28 >> 2] = $1;
    HEAP32[$0 + 20 >> 2] = $1;
    HEAP32[$0 + 16 >> 2] = $1 + HEAP32[$0 + 48 >> 2];
    $0 = $2;
    break label$1;
   }
   HEAP32[$0 + 28 >> 2] = 0;
   HEAP32[$0 + 16 >> 2] = 0;
   HEAP32[$0 + 20 >> 2] = 0;
   HEAP32[$0 >> 2] = HEAP32[$0 >> 2] | 32;
   $0 = 0;
   if (($9 | 0) == 2) {
    break label$1
   }
   $0 = $2 - HEAP32[$1 + 4 >> 2] | 0;
  }
  global$0 = $3 + 32 | 0;
  return $0 | 0;
 }
 
 function FLAC__memory_alloc_aligned_int32_array($0, $1, $2) {
  var $3 = 0;
  label$1 : {
   if ($0 >>> 0 > 1073741823) {
    break label$1
   }
   $0 = dlmalloc($0 ? $0 << 2 : 1);
   if (!$0) {
    break label$1
   }
   $3 = HEAP32[$1 >> 2];
   if ($3) {
    dlfree($3)
   }
   HEAP32[$1 >> 2] = $0;
   HEAP32[$2 >> 2] = $0;
   $3 = 1;
  }
  return $3;
 }
 
 function FLAC__memory_alloc_aligned_uint64_array($0, $1, $2) {
  var $3 = 0;
  label$1 : {
   if ($0 >>> 0 > 536870911) {
    break label$1
   }
   $0 = dlmalloc($0 ? $0 << 3 : 1);
   if (!$0) {
    break label$1
   }
   $3 = HEAP32[$1 >> 2];
   if ($3) {
    dlfree($3)
   }
   HEAP32[$1 >> 2] = $0;
   HEAP32[$2 >> 2] = $0;
   $3 = 1;
  }
  return $3;
 }
 
 function safe_malloc_mul_2op_p($0, $1) {
  if (!($1 ? $0 : 0)) {
   return dlmalloc(1)
  }
  __wasm_i64_mul($1, 0, $0, 0);
  if (i64toi32_i32$HIGH_BITS) {
   $0 = 0
  } else {
   $0 = dlmalloc(Math_imul($0, $1))
  }
  return $0;
 }
 
 function FLAC__fixed_compute_best_predictor($0, $1, $2) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  var $3 = 0, $4 = Math_fround(0), $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, wasm2js_i32$0 = 0, wasm2js_f32$0 = Math_fround(0);
  if ($1) {
   $3 = HEAP32[$0 + -4 >> 2];
   $8 = HEAP32[$0 + -8 >> 2];
   $12 = $3 - $8 | 0;
   $5 = HEAP32[$0 + -12 >> 2];
   $9 = $12 + ($5 - $8 | 0) | 0;
   $17 = $9 + ((($5 << 1) - $8 | 0) - HEAP32[$0 + -16 >> 2] | 0) | 0;
   while (1) {
    $8 = HEAP32[($15 << 2) + $0 >> 2];
    $5 = $8 >> 31;
    $14 = ($5 ^ $5 + $8) + $14 | 0;
    $5 = $8 - $3 | 0;
    $11 = $5 >> 31;
    $13 = ($11 ^ $5 + $11) + $13 | 0;
    $11 = $5 - $12 | 0;
    $3 = $11 >> 31;
    $10 = ($3 ^ $3 + $11) + $10 | 0;
    $9 = $11 - $9 | 0;
    $3 = $9 >> 31;
    $6 = ($3 ^ $3 + $9) + $6 | 0;
    $12 = $9 - $17 | 0;
    $3 = $12 >> 31;
    $7 = ($3 ^ $3 + $12) + $7 | 0;
    $3 = $8;
    $12 = $5;
    $17 = $9;
    $9 = $11;
    $15 = $15 + 1 | 0;
    if (($15 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
  $0 = $13 >>> 0 < $10 >>> 0 ? $13 : $10;
  $0 = $0 >>> 0 < $6 >>> 0 ? $0 : $6;
  label$3 : {
   if ($14 >>> 0 < ($0 >>> 0 < $7 >>> 0 ? $0 : $7) >>> 0) {
    break label$3
   }
   $16 = 1;
   $0 = $10 >>> 0 < $6 >>> 0 ? $10 : $6;
   if ($13 >>> 0 < ($0 >>> 0 < $7 >>> 0 ? $0 : $7) >>> 0) {
    break label$3
   }
   $0 = $6 >>> 0 < $7 >>> 0;
   $16 = $10 >>> 0 < ($0 ? $6 : $7) >>> 0 ? 2 : $0 ? 3 : 4;
  }
  $0 = $2;
  if ($14) {
   $4 = Math_fround(log(+($14 >>> 0) * .6931471805599453 / +($1 >>> 0)) / .6931471805599453)
  } else {
   $4 = Math_fround(0.0)
  }
  HEAPF32[$0 >> 2] = $4;
  $0 = $2;
  if ($13) {
   $4 = Math_fround(log(+($13 >>> 0) * .6931471805599453 / +($1 >>> 0)) / .6931471805599453)
  } else {
   $4 = Math_fround(0.0)
  }
  HEAPF32[$0 + 4 >> 2] = $4;
  $0 = $2;
  if ($10) {
   $4 = Math_fround(log(+($10 >>> 0) * .6931471805599453 / +($1 >>> 0)) / .6931471805599453)
  } else {
   $4 = Math_fround(0.0)
  }
  HEAPF32[$0 + 8 >> 2] = $4;
  $0 = $2;
  if ($6) {
   $4 = Math_fround(log(+($6 >>> 0) * .6931471805599453 / +($1 >>> 0)) / .6931471805599453)
  } else {
   $4 = Math_fround(0.0)
  }
  HEAPF32[$0 + 12 >> 2] = $4;
  if (!$7) {
   HEAPF32[$2 + 16 >> 2] = 0;
   return $16 | 0;
  }
  (wasm2js_i32$0 = $2, wasm2js_f32$0 = Math_fround(log(+($7 >>> 0) * .6931471805599453 / +($1 >>> 0)) / .6931471805599453)), HEAPF32[wasm2js_i32$0 + 16 >> 2] = wasm2js_f32$0;
  return $16 | 0;
 }
 
 function FLAC__fixed_compute_best_predictor_wide($0, $1, $2) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = Math_fround(0), $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, wasm2js_i32$0 = 0, wasm2js_f32$0 = Math_fround(0);
  label$1 : {
   if (!$1) {
    break label$1
   }
   $5 = HEAP32[$0 + -4 >> 2];
   $8 = HEAP32[$0 + -8 >> 2];
   $6 = $5 - $8 | 0;
   $9 = HEAP32[$0 + -12 >> 2];
   $14 = $6 + ($9 - $8 | 0) | 0;
   $21 = $14 + ((($9 << 1) - $8 | 0) - HEAP32[$0 + -16 >> 2] | 0) | 0;
   $9 = 0;
   $8 = 0;
   while (1) {
    $3 = HEAP32[($20 << 2) + $0 >> 2];
    $4 = $3 >> 31;
    $4 = $4 ^ $3 + $4;
    $7 = $4 + $19 | 0;
    if ($7 >>> 0 < $4 >>> 0) {
     $18 = $18 + 1 | 0
    }
    $19 = $7;
    $4 = $3 - $5 | 0;
    $7 = $4 >> 31;
    $7 = $7 ^ $4 + $7;
    $5 = $7 + $17 | 0;
    if ($5 >>> 0 < $7 >>> 0) {
     $15 = $15 + 1 | 0
    }
    $17 = $5;
    $7 = $4 - $6 | 0;
    $5 = $7 >> 31;
    $5 = $5 ^ $5 + $7;
    $6 = $5 + $16 | 0;
    if ($6 >>> 0 < $5 >>> 0) {
     $10 = $10 + 1 | 0
    }
    $16 = $6;
    $14 = $7 - $14 | 0;
    $5 = $14 >> 31;
    $5 = $5 ^ $5 + $14;
    $6 = $5 + $12 | 0;
    if ($6 >>> 0 < $5 >>> 0) {
     $8 = $8 + 1 | 0
    }
    $12 = $6;
    $6 = $14 - $21 | 0;
    $5 = $6 >> 31;
    $5 = $5 ^ $5 + $6;
    $6 = $5 + $13 | 0;
    if ($6 >>> 0 < $5 >>> 0) {
     $9 = $9 + 1 | 0
    }
    $13 = $6;
    $5 = $3;
    $6 = $4;
    $21 = $14;
    $14 = $7;
    $20 = $20 + 1 | 0;
    if (($20 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
  $3 = ($10 | 0) == ($15 | 0) & $17 >>> 0 < $16 >>> 0 | $15 >>> 0 < $10 >>> 0;
  $4 = $3 ? $17 : $16;
  $0 = $4;
  $3 = $3 ? $15 : $10;
  $4 = ($8 | 0) == ($3 | 0) & $4 >>> 0 < $12 >>> 0 | $3 >>> 0 < $8 >>> 0;
  $7 = $4 ? $0 : $12;
  $3 = $4 ? $3 : $8;
  $4 = ($9 | 0) == ($3 | 0) & $7 >>> 0 < $13 >>> 0 | $3 >>> 0 < $9 >>> 0;
  $7 = $4 ? $7 : $13;
  $3 = $4 ? $3 : $9;
  $0 = 0;
  label$4 : {
   if (($3 | 0) == ($18 | 0) & $19 >>> 0 < $7 >>> 0 | $18 >>> 0 < $3 >>> 0) {
    break label$4
   }
   $3 = ($8 | 0) == ($10 | 0) & $16 >>> 0 < $12 >>> 0 | $10 >>> 0 < $8 >>> 0;
   $4 = $3 ? $16 : $12;
   $0 = $4;
   $3 = $3 ? $10 : $8;
   $4 = ($9 | 0) == ($3 | 0) & $4 >>> 0 < $13 >>> 0 | $3 >>> 0 < $9 >>> 0;
   $7 = $4 ? $0 : $13;
   $3 = $4 ? $3 : $9;
   $0 = 1;
   if (($3 | 0) == ($15 | 0) & $17 >>> 0 < $7 >>> 0 | $15 >>> 0 < $3 >>> 0) {
    break label$4
   }
   $0 = ($8 | 0) == ($9 | 0) & $12 >>> 0 < $13 >>> 0 | $8 >>> 0 < $9 >>> 0;
   $3 = $0;
   $4 = $3 ? $12 : $13;
   $0 = $3 ? $8 : $9;
   $0 = ($0 | 0) == ($10 | 0) & $16 >>> 0 < $4 >>> 0 | $10 >>> 0 < $0 >>> 0 ? 2 : $3 ? 3 : 4;
  }
  $6 = $2;
  if ($18 | $19) {
   $11 = Math_fround(log((+($19 >>> 0) + 4294967296.0 * +($18 >>> 0)) * .6931471805599453 / +($1 >>> 0)) / .6931471805599453)
  } else {
   $11 = Math_fround(0.0)
  }
  HEAPF32[$6 >> 2] = $11;
  $6 = $2;
  if ($15 | $17) {
   $11 = Math_fround(log((+($17 >>> 0) + 4294967296.0 * +($15 >>> 0)) * .6931471805599453 / +($1 >>> 0)) / .6931471805599453)
  } else {
   $11 = Math_fround(0.0)
  }
  HEAPF32[$6 + 4 >> 2] = $11;
  $6 = $2;
  if ($10 | $16) {
   $11 = Math_fround(log((+($16 >>> 0) + 4294967296.0 * +($10 >>> 0)) * .6931471805599453 / +($1 >>> 0)) / .6931471805599453)
  } else {
   $11 = Math_fround(0.0)
  }
  HEAPF32[$6 + 8 >> 2] = $11;
  $6 = $2;
  if ($8 | $12) {
   $11 = Math_fround(log((+($12 >>> 0) + 4294967296.0 * +($8 >>> 0)) * .6931471805599453 / +($1 >>> 0)) / .6931471805599453)
  } else {
   $11 = Math_fround(0.0)
  }
  HEAPF32[$6 + 12 >> 2] = $11;
  if (!($9 | $13)) {
   HEAPF32[$2 + 16 >> 2] = 0;
   return $0 | 0;
  }
  (wasm2js_i32$0 = $2, wasm2js_f32$0 = Math_fround(log((+($13 >>> 0) + 4294967296.0 * +($9 >>> 0)) * .6931471805599453 / +($1 >>> 0)) / .6931471805599453)), HEAPF32[wasm2js_i32$0 + 16 >> 2] = wasm2js_f32$0;
  return $0 | 0;
 }
 
 function FLAC__fixed_compute_residual($0, $1, $2, $3) {
  var $4 = 0, $5 = 0;
  label$1 : {
   label$2 : {
    label$3 : {
     switch ($2 | 0) {
     case 4:
      $2 = 0;
      if (($1 | 0) <= 0) {
       break label$2
      }
      while (1) {
       $5 = $2 << 2;
       $4 = $5 + $0 | 0;
       HEAP32[$3 + $5 >> 2] = (HEAP32[$4 + -16 >> 2] + (HEAP32[$4 >> 2] + Math_imul(HEAP32[$4 + -8 >> 2], 6) | 0) | 0) - (HEAP32[$4 + -12 >> 2] + HEAP32[$4 + -4 >> 2] << 2);
       $2 = $2 + 1 | 0;
       if (($2 | 0) != ($1 | 0)) {
        continue
       }
       break;
      };
      break label$2;
     case 3:
      $2 = 0;
      if (($1 | 0) <= 0) {
       break label$2
      }
      while (1) {
       $5 = $2 << 2;
       $4 = $5 + $0 | 0;
       HEAP32[$3 + $5 >> 2] = (HEAP32[$4 >> 2] - HEAP32[$4 + -12 >> 2] | 0) + Math_imul(HEAP32[$4 + -8 >> 2] - HEAP32[$4 + -4 >> 2] | 0, 3);
       $2 = $2 + 1 | 0;
       if (($2 | 0) != ($1 | 0)) {
        continue
       }
       break;
      };
      break label$2;
     case 2:
      $2 = 0;
      if (($1 | 0) <= 0) {
       break label$2
      }
      while (1) {
       $5 = $2 << 2;
       $4 = $5 + $0 | 0;
       HEAP32[$3 + $5 >> 2] = HEAP32[$4 + -8 >> 2] + (HEAP32[$4 >> 2] - (HEAP32[$4 + -4 >> 2] << 1) | 0);
       $2 = $2 + 1 | 0;
       if (($2 | 0) != ($1 | 0)) {
        continue
       }
       break;
      };
      break label$2;
     case 0:
      break label$1;
     case 1:
      break label$3;
     default:
      break label$2;
     };
    }
    $2 = 0;
    if (($1 | 0) <= 0) {
     break label$2
    }
    while (1) {
     $5 = $2 << 2;
     $4 = $5 + $0 | 0;
     HEAP32[$3 + $5 >> 2] = HEAP32[$4 >> 2] - HEAP32[$4 + -4 >> 2];
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
   }
   return;
  }
  memcpy($3, $0, $1 << 2);
 }
 
 function FLAC__fixed_restore_signal($0, $1, $2, $3) {
  var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
  label$1 : {
   label$2 : {
    label$3 : {
     switch ($2 | 0) {
     case 4:
      if (($1 | 0) < 1) {
       break label$2
      }
      $5 = HEAP32[$3 + -12 >> 2];
      $6 = HEAP32[$3 + -4 >> 2];
      $2 = 0;
      while (1) {
       $8 = $2 << 2;
       $7 = $8 + $3 | 0;
       $4 = HEAP32[$7 + -8 >> 2];
       $6 = ((HEAP32[$0 + $8 >> 2] + Math_imul($4, -6) | 0) - HEAP32[$7 + -16 >> 2] | 0) + ($5 + $6 << 2) | 0;
       HEAP32[$7 >> 2] = $6;
       $5 = $4;
       $2 = $2 + 1 | 0;
       if (($2 | 0) != ($1 | 0)) {
        continue
       }
       break;
      };
      break label$2;
     case 3:
      if (($1 | 0) < 1) {
       break label$2
      }
      $4 = HEAP32[$3 + -12 >> 2];
      $5 = HEAP32[$3 + -4 >> 2];
      $2 = 0;
      while (1) {
       $6 = $2 << 2;
       $7 = $6 + $3 | 0;
       $8 = HEAP32[$0 + $6 >> 2] + $4 | 0;
       $4 = HEAP32[$7 + -8 >> 2];
       $5 = $8 + Math_imul($5 - $4 | 0, 3) | 0;
       HEAP32[$7 >> 2] = $5;
       $2 = $2 + 1 | 0;
       if (($2 | 0) != ($1 | 0)) {
        continue
       }
       break;
      };
      break label$2;
     case 2:
      if (($1 | 0) < 1) {
       break label$2
      }
      $4 = HEAP32[$3 + -4 >> 2];
      $2 = 0;
      while (1) {
       $5 = $2 << 2;
       $6 = $5 + $3 | 0;
       $4 = (HEAP32[$0 + $5 >> 2] + ($4 << 1) | 0) - HEAP32[$6 + -8 >> 2] | 0;
       HEAP32[$6 >> 2] = $4;
       $2 = $2 + 1 | 0;
       if (($2 | 0) != ($1 | 0)) {
        continue
       }
       break;
      };
      break label$2;
     case 0:
      break label$1;
     case 1:
      break label$3;
     default:
      break label$2;
     };
    }
    if (($1 | 0) < 1) {
     break label$2
    }
    $4 = HEAP32[$3 + -4 >> 2];
    $2 = 0;
    while (1) {
     $5 = $2 << 2;
     $4 = HEAP32[$5 + $0 >> 2] + $4 | 0;
     HEAP32[$3 + $5 >> 2] = $4;
     $2 = $2 + 1 | 0;
     if (($2 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
   }
   return;
  }
  memcpy($3, $0, $1 << 2);
 }
 
 function __toread($0) {
  var $1 = 0, $2 = 0;
  $1 = HEAPU8[$0 + 74 | 0];
  HEAP8[$0 + 74 | 0] = $1 + -1 | $1;
  if (HEAPU32[$0 + 20 >> 2] > HEAPU32[$0 + 28 >> 2]) {
   FUNCTION_TABLE[HEAP32[$0 + 36 >> 2]]($0, 0, 0) | 0
  }
  HEAP32[$0 + 28 >> 2] = 0;
  HEAP32[$0 + 16 >> 2] = 0;
  HEAP32[$0 + 20 >> 2] = 0;
  $1 = HEAP32[$0 >> 2];
  if ($1 & 4) {
   HEAP32[$0 >> 2] = $1 | 32;
   return -1;
  }
  $2 = HEAP32[$0 + 44 >> 2] + HEAP32[$0 + 48 >> 2] | 0;
  HEAP32[$0 + 8 >> 2] = $2;
  HEAP32[$0 + 4 >> 2] = $2;
  return $1 << 27 >> 31;
 }
 
 function FLAC__stream_decoder_new() {
  var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0;
  $3 = dlcalloc(1, 8);
  if ($3) {
   $2 = dlcalloc(1, 504);
   HEAP32[$3 >> 2] = $2;
   if ($2) {
    $0 = dlcalloc(1, 6160);
    HEAP32[$3 + 4 >> 2] = $0;
    if ($0) {
     $1 = dlcalloc(1, 44);
     HEAP32[$0 + 56 >> 2] = $1;
     if ($1) {
      HEAP32[$0 + 1128 >> 2] = 16;
      $4 = dlmalloc(HEAP32[1621] << 1 & -16);
      HEAP32[$0 + 1120 >> 2] = $4;
      if ($4) {
       HEAP32[$0 + 252 >> 2] = 0;
       HEAP32[$0 + 220 >> 2] = 0;
       HEAP32[$0 + 224 >> 2] = 0;
       $1 = $0 + 3616 | 0;
       HEAP32[$1 >> 2] = 0;
       HEAP32[$1 + 4 >> 2] = 0;
       $1 = $0 + 3608 | 0;
       HEAP32[$1 >> 2] = 0;
       HEAP32[$1 + 4 >> 2] = 0;
       $1 = $0 + 3600 | 0;
       HEAP32[$1 >> 2] = 0;
       HEAP32[$1 + 4 >> 2] = 0;
       $1 = $0 + 3592 | 0;
       HEAP32[$1 >> 2] = 0;
       HEAP32[$1 + 4 >> 2] = 0;
       HEAP32[$0 + 60 >> 2] = 0;
       HEAP32[$0 + 64 >> 2] = 0;
       HEAP32[$0 + 68 >> 2] = 0;
       HEAP32[$0 + 72 >> 2] = 0;
       HEAP32[$0 + 76 >> 2] = 0;
       HEAP32[$0 + 80 >> 2] = 0;
       HEAP32[$0 + 84 >> 2] = 0;
       HEAP32[$0 + 88 >> 2] = 0;
       HEAP32[$0 + 92 >> 2] = 0;
       HEAP32[$0 + 96 >> 2] = 0;
       HEAP32[$0 + 100 >> 2] = 0;
       HEAP32[$0 + 104 >> 2] = 0;
       HEAP32[$0 + 108 >> 2] = 0;
       HEAP32[$0 + 112 >> 2] = 0;
       HEAP32[$0 + 116 >> 2] = 0;
       HEAP32[$0 + 120 >> 2] = 0;
       FLAC__format_entropy_coding_method_partitioned_rice_contents_init($0 + 124 | 0);
       FLAC__format_entropy_coding_method_partitioned_rice_contents_init($0 + 136 | 0);
       FLAC__format_entropy_coding_method_partitioned_rice_contents_init($0 + 148 | 0);
       FLAC__format_entropy_coding_method_partitioned_rice_contents_init($0 + 160 | 0);
       FLAC__format_entropy_coding_method_partitioned_rice_contents_init($0 + 172 | 0);
       FLAC__format_entropy_coding_method_partitioned_rice_contents_init($0 + 184 | 0);
       FLAC__format_entropy_coding_method_partitioned_rice_contents_init($0 + 196 | 0);
       FLAC__format_entropy_coding_method_partitioned_rice_contents_init($0 + 208 | 0);
       HEAP32[$0 + 48 >> 2] = 0;
       HEAP32[$0 + 52 >> 2] = 0;
       memset($0 + 608 | 0, 512);
       HEAP32[$0 + 1124 >> 2] = 0;
       HEAP32[$0 + 608 >> 2] = 1;
       HEAP32[$0 + 32 >> 2] = 0;
       HEAP32[$0 + 24 >> 2] = 0;
       HEAP32[$0 + 28 >> 2] = 0;
       HEAP32[$0 + 16 >> 2] = 0;
       HEAP32[$0 + 20 >> 2] = 0;
       HEAP32[$0 + 8 >> 2] = 0;
       HEAP32[$0 + 12 >> 2] = 0;
       HEAP32[$0 >> 2] = 0;
       HEAP32[$0 + 4 >> 2] = 0;
       HEAP32[$2 + 28 >> 2] = 0;
       FLAC__ogg_decoder_aspect_set_defaults($2 + 32 | 0);
       HEAP32[$2 >> 2] = 9;
       return $3 | 0;
      }
      FLAC__bitwriter_delete($1);
     }
     dlfree($0);
    }
    dlfree($2);
   }
   dlfree($3);
  }
  return 0;
 }
 
 function FLAC__stream_decoder_delete($0) {
  $0 = $0 | 0;
  var $1 = 0, $2 = 0;
  if ($0) {
   FLAC__stream_decoder_finish($0);
   $1 = HEAP32[$0 + 4 >> 2];
   $2 = HEAP32[$1 + 1120 >> 2];
   if ($2) {
    dlfree($2);
    $1 = HEAP32[$0 + 4 >> 2];
   }
   FLAC__bitwriter_delete(HEAP32[$1 + 56 >> 2]);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 124 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 136 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 148 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 160 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 172 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 184 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 196 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 208 | 0);
   dlfree(HEAP32[$0 + 4 >> 2]);
   dlfree(HEAP32[$0 >> 2]);
   dlfree($0);
  }
 }
 
 function FLAC__stream_decoder_finish($0) {
  $0 = $0 | 0;
  var $1 = 0, $2 = 0, $3 = 0;
  $3 = 1;
  if (HEAP32[HEAP32[$0 >> 2] >> 2] != 9) {
   $1 = HEAP32[$0 + 4 >> 2];
   FLAC__MD5Final($1 + 3732 | 0, $1 + 3636 | 0);
   dlfree(HEAP32[HEAP32[$0 + 4 >> 2] + 452 >> 2]);
   HEAP32[HEAP32[$0 + 4 >> 2] + 452 >> 2] = 0;
   $1 = HEAP32[$0 + 4 >> 2];
   HEAP32[$1 + 252 >> 2] = 0;
   FLAC__bitreader_free(HEAP32[$1 + 56 >> 2]);
   $3 = $0 + 4 | 0;
   $1 = HEAP32[$0 + 4 >> 2];
   $2 = HEAP32[$1 + 60 >> 2];
   if ($2) {
    dlfree($2 + -16 | 0);
    HEAP32[HEAP32[$3 >> 2] + 60 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 + 3592 >> 2];
   if ($2) {
    dlfree($2);
    HEAP32[HEAP32[$3 >> 2] + 92 >> 2] = 0;
    HEAP32[HEAP32[$3 >> 2] + 3592 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 - -64 >> 2];
   if ($2) {
    dlfree($2 + -16 | 0);
    HEAP32[HEAP32[$3 >> 2] - -64 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 + 3596 >> 2];
   if ($2) {
    dlfree($2);
    HEAP32[HEAP32[$3 >> 2] + 96 >> 2] = 0;
    HEAP32[HEAP32[$3 >> 2] + 3596 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 + 68 >> 2];
   if ($2) {
    dlfree($2 + -16 | 0);
    HEAP32[HEAP32[$3 >> 2] + 68 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 + 3600 >> 2];
   if ($2) {
    dlfree($2);
    HEAP32[HEAP32[$3 >> 2] + 100 >> 2] = 0;
    HEAP32[HEAP32[$3 >> 2] + 3600 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 + 72 >> 2];
   if ($2) {
    dlfree($2 + -16 | 0);
    HEAP32[HEAP32[$3 >> 2] + 72 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 + 3604 >> 2];
   if ($2) {
    dlfree($2);
    HEAP32[HEAP32[$3 >> 2] + 104 >> 2] = 0;
    HEAP32[HEAP32[$3 >> 2] + 3604 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 + 76 >> 2];
   if ($2) {
    dlfree($2 + -16 | 0);
    HEAP32[HEAP32[$3 >> 2] + 76 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 + 3608 >> 2];
   if ($2) {
    dlfree($2);
    HEAP32[HEAP32[$3 >> 2] + 108 >> 2] = 0;
    HEAP32[HEAP32[$3 >> 2] + 3608 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 + 80 >> 2];
   if ($2) {
    dlfree($2 + -16 | 0);
    HEAP32[HEAP32[$3 >> 2] + 80 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 + 3612 >> 2];
   if ($2) {
    dlfree($2);
    HEAP32[HEAP32[$3 >> 2] + 112 >> 2] = 0;
    HEAP32[HEAP32[$3 >> 2] + 3612 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 + 84 >> 2];
   if ($2) {
    dlfree($2 + -16 | 0);
    HEAP32[HEAP32[$3 >> 2] + 84 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 + 3616 >> 2];
   if ($2) {
    dlfree($2);
    HEAP32[HEAP32[$3 >> 2] + 116 >> 2] = 0;
    HEAP32[HEAP32[$3 >> 2] + 3616 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 + 88 >> 2];
   if ($2) {
    dlfree($2 + -16 | 0);
    HEAP32[HEAP32[$3 >> 2] + 88 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   $2 = HEAP32[$1 + 3620 >> 2];
   if ($2) {
    dlfree($2);
    HEAP32[HEAP32[$3 >> 2] + 120 >> 2] = 0;
    HEAP32[HEAP32[$3 >> 2] + 3620 >> 2] = 0;
    $1 = HEAP32[$3 >> 2];
   }
   HEAP32[$1 + 220 >> 2] = 0;
   HEAP32[$1 + 224 >> 2] = 0;
   if (HEAP32[$1 >> 2]) {
    $1 = HEAP32[$0 >> 2] + 32 | 0;
    ogg_sync_clear($1 + 368 | 0);
    ogg_stream_clear($1 + 8 | 0);
    $1 = HEAP32[$0 + 4 >> 2];
   }
   $2 = HEAP32[$1 + 52 >> 2];
   if ($2) {
    if (($2 | 0) != HEAP32[1884]) {
     fclose($2);
     $1 = HEAP32[$3 >> 2];
    }
    HEAP32[$1 + 52 >> 2] = 0;
   }
   $3 = 1;
   if (HEAP32[$1 + 3624 >> 2]) {
    $3 = !memcmp($1 + 312 | 0, $1 + 3732 | 0, 16)
   }
   HEAP32[$1 + 48 >> 2] = 0;
   HEAP32[$1 + 3632 >> 2] = 0;
   memset($1 + 608 | 0, 512);
   HEAP32[$1 + 32 >> 2] = 0;
   HEAP32[$1 + 24 >> 2] = 0;
   HEAP32[$1 + 28 >> 2] = 0;
   HEAP32[$1 + 16 >> 2] = 0;
   HEAP32[$1 + 20 >> 2] = 0;
   HEAP32[$1 + 8 >> 2] = 0;
   HEAP32[$1 + 12 >> 2] = 0;
   HEAP32[$1 >> 2] = 0;
   HEAP32[$1 + 4 >> 2] = 0;
   $1 = HEAP32[$0 + 4 >> 2];
   HEAP32[$1 + 1124 >> 2] = 0;
   HEAP32[$1 + 608 >> 2] = 1;
   $1 = HEAP32[$0 >> 2];
   HEAP32[$1 + 28 >> 2] = 0;
   FLAC__ogg_decoder_aspect_set_defaults($1 + 32 | 0);
   HEAP32[HEAP32[$0 >> 2] >> 2] = 9;
  }
  return $3 | 0;
 }
 
 function FLAC__stream_decoder_init_stream($0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $4 = $4 | 0;
  $5 = $5 | 0;
  $6 = $6 | 0;
  $7 = $7 | 0;
  $8 = $8 | 0;
  $9 = $9 | 0;
  return init_stream_internal_($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, 0) | 0;
 }
 
 function init_stream_internal_($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10) {
  var $11 = 0, $12 = 0;
  $11 = 5;
  label$1 : {
   $12 = HEAP32[$0 >> 2];
   label$2 : {
    if (HEAP32[$12 >> 2] != 9) {
     break label$2
    }
    $11 = 2;
    if (!$8 | (!$1 | !$6)) {
     break label$2
    }
    if ($2) {
     if (!$5 | (!$3 | !$4)) {
      break label$2
     }
    }
    $11 = HEAP32[$0 + 4 >> 2];
    HEAP32[$11 >> 2] = $10;
    if ($10) {
     if (!FLAC__ogg_decoder_aspect_init($12 + 32 | 0)) {
      break label$1
     }
     $11 = HEAP32[$0 + 4 >> 2];
    }
    FLAC__cpu_info($11 + 3524 | 0);
    $10 = HEAP32[$0 + 4 >> 2];
    HEAP32[$10 + 44 >> 2] = 5;
    HEAP32[$10 + 40 >> 2] = 6;
    HEAP32[$10 + 36 >> 2] = 5;
    if (!FLAC__bitreader_init(HEAP32[$10 + 56 >> 2], $0)) {
     HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
     return 3;
    }
    $10 = HEAP32[$0 + 4 >> 2];
    HEAP32[$10 + 48 >> 2] = $9;
    HEAP32[$10 + 32 >> 2] = $8;
    HEAP32[$10 + 28 >> 2] = $7;
    HEAP32[$10 + 24 >> 2] = $6;
    HEAP32[$10 + 20 >> 2] = $5;
    HEAP32[$10 + 16 >> 2] = $4;
    HEAP32[$10 + 12 >> 2] = $3;
    HEAP32[$10 + 8 >> 2] = $2;
    HEAP32[$10 + 4 >> 2] = $1;
    HEAP32[$10 + 3520 >> 2] = 0;
    HEAP32[$10 + 248 >> 2] = 0;
    HEAP32[$10 + 240 >> 2] = 0;
    HEAP32[$10 + 244 >> 2] = 0;
    HEAP32[$10 + 228 >> 2] = 0;
    HEAP32[$10 + 232 >> 2] = 0;
    HEAP32[$10 + 3624 >> 2] = HEAP32[HEAP32[$0 >> 2] + 28 >> 2];
    HEAP32[$10 + 3628 >> 2] = 1;
    HEAP32[$10 + 3632 >> 2] = 0;
    $11 = FLAC__stream_decoder_reset($0) ? 0 : 3;
   }
   return $11;
  }
  HEAP32[HEAP32[$0 >> 2] + 4 >> 2] = 4;
  return 4;
 }
 
 function read_callback_($0, $1, $2) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  var $3 = 0, $4 = 0;
  label$1 : {
   $3 = HEAP32[$2 + 4 >> 2];
   if (HEAP32[$3 >> 2]) {
    break label$1
   }
   $4 = HEAP32[$3 + 20 >> 2];
   if (!$4) {
    break label$1
   }
   if (!FUNCTION_TABLE[$4]($2, HEAP32[$3 + 48 >> 2])) {
    break label$1
   }
   HEAP32[$1 >> 2] = 0;
   HEAP32[HEAP32[$2 >> 2] >> 2] = 4;
   return 0;
  }
  label$2 : {
   label$3 : {
    if (HEAP32[$1 >> 2]) {
     $3 = HEAP32[$2 + 4 >> 2];
     if (!(!HEAP32[$3 + 3632 >> 2] | HEAPU32[$3 + 6152 >> 2] < 21)) {
      HEAP32[HEAP32[$2 >> 2] >> 2] = 7;
      break label$3;
     }
     label$6 : {
      label$7 : {
       label$8 : {
        label$9 : {
         if (HEAP32[$3 >> 2]) {
          $4 = 0;
          switch (FLAC__ogg_decoder_aspect_read_callback_wrapper(HEAP32[$2 >> 2] + 32 | 0, $0, $1, $2, HEAP32[$3 + 48 >> 2]) | 0) {
          case 0:
          case 2:
           break label$7;
          case 1:
           break label$8;
          default:
           break label$9;
          };
         }
         $4 = FUNCTION_TABLE[HEAP32[$3 + 4 >> 2]]($2, $0, $1, HEAP32[$3 + 48 >> 2]) | 0;
         if (($4 | 0) != 2) {
          break label$7
         }
        }
        HEAP32[HEAP32[$2 >> 2] >> 2] = 7;
        break label$3;
       }
       $0 = 1;
       if (!HEAP32[$1 >> 2]) {
        break label$6
       }
       break label$2;
      }
      $0 = 1;
      if (HEAP32[$1 >> 2]) {
       break label$2
      }
      if (($4 | 0) == 1) {
       break label$6
      }
      $1 = HEAP32[$2 + 4 >> 2];
      if (HEAP32[$1 >> 2]) {
       break label$2
      }
      $3 = HEAP32[$1 + 20 >> 2];
      if (!$3) {
       break label$2
      }
      if (!FUNCTION_TABLE[$3]($2, HEAP32[$1 + 48 >> 2])) {
       break label$2
      }
     }
     HEAP32[HEAP32[$2 >> 2] >> 2] = 4;
     break label$3;
    }
    HEAP32[HEAP32[$2 >> 2] >> 2] = 7;
   }
   $0 = 0;
  }
  return $0 | 0;
 }
 
 function FLAC__stream_decoder_reset($0) {
  $0 = $0 | 0;
  var $1 = 0, $2 = 0, $3 = 0;
  $1 = HEAP32[$0 + 4 >> 2];
  label$1 : {
   if (HEAP32[HEAP32[$0 >> 2] >> 2] == 9 ? !HEAP32[$1 + 3628 >> 2] : 0) {
    break label$1
   }
   HEAP32[$1 + 3624 >> 2] = 0;
   HEAP32[$1 + 240 >> 2] = 0;
   HEAP32[$1 + 244 >> 2] = 0;
   if (HEAP32[$1 >> 2]) {
    $1 = HEAP32[$0 >> 2] + 32 | 0;
    ogg_stream_reset($1 + 8 | 0);
    ogg_sync_reset($1 + 368 | 0);
    HEAP32[$1 + 408 >> 2] = 0;
    HEAP32[$1 + 412 >> 2] = 0;
    $1 = HEAP32[$0 + 4 >> 2];
   }
   $1 = HEAP32[$1 + 56 >> 2];
   HEAP32[$1 + 8 >> 2] = 0;
   HEAP32[$1 + 12 >> 2] = 0;
   HEAP32[$1 + 16 >> 2] = 0;
   HEAP32[$1 + 20 >> 2] = 0;
   $1 = 1;
   $2 = HEAP32[$0 >> 2];
   if (!$1) {
    HEAP32[$2 >> 2] = 8;
    return 0;
   }
   HEAP32[$2 >> 2] = 2;
   $1 = HEAP32[$0 + 4 >> 2];
   if (HEAP32[$1 >> 2]) {
    FLAC__ogg_decoder_aspect_reset($2 + 32 | 0);
    $1 = HEAP32[$0 + 4 >> 2];
   }
   label$6 : {
    if (!HEAP32[$1 + 3628 >> 2]) {
     $2 = 0;
     if (HEAP32[$1 + 52 >> 2] == HEAP32[1884]) {
      break label$1
     }
     $3 = HEAP32[$1 + 8 >> 2];
     if (!$3) {
      break label$6
     }
     if ((FUNCTION_TABLE[$3]($0, 0, 0, HEAP32[$1 + 48 >> 2]) | 0) == 1) {
      break label$1
     }
     $1 = HEAP32[$0 + 4 >> 2];
     break label$6;
    }
    HEAP32[$1 + 3628 >> 2] = 0;
   }
   HEAP32[HEAP32[$0 >> 2] >> 2] = 0;
   HEAP32[$1 + 248 >> 2] = 0;
   dlfree(HEAP32[$1 + 452 >> 2]);
   HEAP32[HEAP32[$0 + 4 >> 2] + 452 >> 2] = 0;
   $1 = HEAP32[$0 + 4 >> 2];
   HEAP32[$1 + 252 >> 2] = 0;
   HEAP32[$1 + 3624 >> 2] = HEAP32[HEAP32[$0 >> 2] + 28 >> 2];
   HEAP32[$1 + 228 >> 2] = 0;
   HEAP32[$1 + 232 >> 2] = 0;
   FLAC__MD5Init($1 + 3636 | 0);
   $0 = HEAP32[$0 + 4 >> 2];
   HEAP32[$0 + 6152 >> 2] = 0;
   HEAP32[$0 + 6136 >> 2] = 0;
   HEAP32[$0 + 6140 >> 2] = 0;
   $2 = 1;
  }
  return $2 | 0;
 }
 
 function FLAC__stream_decoder_init_ogg_stream($0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $4 = $4 | 0;
  $5 = $5 | 0;
  $6 = $6 | 0;
  $7 = $7 | 0;
  $8 = $8 | 0;
  $9 = $9 | 0;
  return init_stream_internal_($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, 1) | 0;
 }
 
 function FLAC__stream_decoder_set_ogg_serial_number($0, $1) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $0 = HEAP32[$0 >> 2];
  if (HEAP32[$0 >> 2] == 9) {
   $0 = $0 + 32 | 0;
   HEAP32[$0 + 4 >> 2] = $1;
   HEAP32[$0 >> 2] = 0;
   $0 = 1;
  } else {
   $0 = 0
  }
  return $0 | 0;
 }
 
 function FLAC__stream_decoder_set_md5_checking($0, $1) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $0 = HEAP32[$0 >> 2];
  if (HEAP32[$0 >> 2] == 9) {
   HEAP32[$0 + 28 >> 2] = $1;
   $0 = 1;
  } else {
   $0 = 0
  }
  return $0 | 0;
 }
 
 function FLAC__stream_decoder_get_state($0) {
  $0 = $0 | 0;
  return HEAP32[HEAP32[$0 >> 2] >> 2];
 }
 
 function FLAC__stream_decoder_get_md5_checking($0) {
  $0 = $0 | 0;
  return HEAP32[HEAP32[$0 >> 2] + 28 >> 2];
 }
 
 function FLAC__stream_decoder_process_single($0) {
  $0 = $0 | 0;
  var $1 = 0, $2 = 0, $3 = 0;
  $1 = global$0 - 16 | 0;
  global$0 = $1;
  $2 = 1;
  label$1 : {
   while (1) {
    label$3 : {
     label$4 : {
      switch (HEAP32[HEAP32[$0 >> 2] >> 2]) {
      case 0:
       if (find_metadata_($0)) {
        continue
       }
       $2 = 0;
       break label$3;
      case 1:
       $3 = (read_metadata_($0) | 0) != 0;
       break label$1;
      case 2:
       if (frame_sync_($0)) {
        continue
       }
       break label$3;
      case 4:
      case 7:
       break label$3;
      case 3:
       break label$4;
      default:
       break label$1;
      };
     }
     if (!read_frame_($0, $1 + 12 | 0)) {
      $2 = 0;
      break label$3;
     }
     if (!HEAP32[$1 + 12 >> 2]) {
      continue
     }
    }
    break;
   };
   $3 = $2;
  }
  global$0 = $1 + 16 | 0;
  return $3 | 0;
 }
 
 function find_metadata_($0) {
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
  $2 = global$0 - 16 | 0;
  global$0 = $2;
  $5 = 1;
  label$1 : {
   while (1) {
    $1 = 0;
    label$3 : {
     while (1) {
      $6 = HEAP32[$0 + 4 >> 2];
      label$5 : {
       if (HEAP32[$6 + 3520 >> 2]) {
        $4 = HEAPU8[$6 + 3590 | 0];
        HEAP32[$2 + 8 >> 2] = $4;
        HEAP32[$6 + 3520 >> 2] = 0;
        break label$5;
       }
       if (!FLAC__bitreader_read_raw_uint32(HEAP32[$6 + 56 >> 2], $2 + 8 | 0, 8)) {
        $3 = 0;
        break label$1;
       }
       $4 = HEAP32[$2 + 8 >> 2];
      }
      if (HEAPU8[$3 + 6439 | 0] == ($4 | 0)) {
       $3 = $3 + 1 | 0;
       $1 = 1;
       break label$3;
      }
      $3 = 0;
      if (($1 | 0) == 3) {
       break label$1
      }
      if (HEAPU8[$1 + 7540 | 0] == ($4 | 0)) {
       $1 = $1 + 1 | 0;
       if (($1 | 0) != 3) {
        continue
       }
       label$10 : {
        label$11 : {
         if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $2 + 12 | 0, 24)) {
          break label$11
         }
         if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $2 + 12 | 0, 8)) {
          break label$11
         }
         $4 = HEAP32[$2 + 12 >> 2];
         if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $2 + 12 | 0, 8)) {
          break label$11
         }
         $6 = HEAP32[$2 + 12 >> 2];
         if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $2 + 12 | 0, 8)) {
          break label$11
         }
         $7 = HEAP32[$2 + 12 >> 2];
         if (FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $2 + 12 | 0, 8)) {
          break label$10
         }
        }
        break label$1;
       }
       if (FLAC__bitreader_skip_byte_block_aligned_no_crc(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], HEAP32[$2 + 12 >> 2] & 127 | ($7 << 7 & 16256 | ($6 & 127 | $4 << 7 & 16256) << 14))) {
        continue
       }
       break label$1;
      }
      break;
     };
     label$12 : {
      if (($4 | 0) != 255) {
       break label$12
      }
      HEAP8[HEAP32[$0 + 4 >> 2] + 3588 | 0] = 255;
      if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $2 + 8 | 0, 8)) {
       break label$1
      }
      $1 = HEAP32[$2 + 8 >> 2];
      if (($1 | 0) == 255) {
       $1 = HEAP32[$0 + 4 >> 2];
       HEAP32[$1 + 3520 >> 2] = 1;
       HEAP8[$1 + 3590 | 0] = 255;
       break label$12;
      }
      if (($1 & -2) != 248) {
       break label$12
      }
      HEAP8[HEAP32[$0 + 4 >> 2] + 3589 | 0] = $1;
      HEAP32[HEAP32[$0 >> 2] >> 2] = 3;
      $3 = 1;
      break label$1;
     }
     $1 = 0;
     if (!$5) {
      break label$3
     }
     $5 = HEAP32[$0 + 4 >> 2];
     $1 = 0;
     if (HEAP32[$5 + 3632 >> 2]) {
      break label$3
     }
     FUNCTION_TABLE[HEAP32[$5 + 32 >> 2]]($0, 0, HEAP32[$5 + 48 >> 2]);
     $1 = 0;
    }
    $5 = $1;
    if ($3 >>> 0 < 4) {
     continue
    }
    break;
   };
   $3 = 1;
   HEAP32[HEAP32[$0 >> 2] >> 2] = 1;
  }
  global$0 = $2 + 16 | 0;
  return $3;
 }
 
 function read_metadata_($0) {
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0;
  $7 = global$0 - 192 | 0;
  global$0 = $7;
  label$1 : {
   label$2 : {
    if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $7 + 184 | 0, HEAP32[1648])) {
     break label$2
    }
    $15 = HEAP32[$7 + 184 >> 2];
    $4 = $0 + 4 | 0;
    if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $7 + 180 | 0, HEAP32[1649])) {
     break label$1
    }
    if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $7 + 176 | 0, HEAP32[1650])) {
     break label$1
    }
    $6 = ($15 | 0) != 0;
    label$3 : {
     label$4 : {
      label$5 : {
       label$6 : {
        label$7 : {
         $2 = HEAP32[$7 + 180 >> 2];
         switch ($2 | 0) {
         case 3:
          break label$6;
         case 0:
          break label$7;
         default:
          break label$5;
         };
        }
        $3 = HEAP32[$7 + 176 >> 2];
        $2 = 0;
        $1 = HEAP32[$4 >> 2];
        HEAP32[$1 + 256 >> 2] = 0;
        HEAP32[$1 + 264 >> 2] = $3;
        HEAP32[$1 + 260 >> 2] = $6;
        $5 = HEAP32[$1 + 56 >> 2];
        $1 = HEAP32[1613];
        if (!FLAC__bitreader_read_raw_uint32($5, $7, $1)) {
         break label$1
        }
        HEAP32[HEAP32[$4 >> 2] + 272 >> 2] = HEAP32[$7 >> 2];
        $5 = HEAP32[1614];
        if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $7, $5)) {
         break label$1
        }
        HEAP32[HEAP32[$4 >> 2] + 276 >> 2] = HEAP32[$7 >> 2];
        $6 = HEAP32[1615];
        if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $7, $6)) {
         break label$1
        }
        HEAP32[HEAP32[$4 >> 2] + 280 >> 2] = HEAP32[$7 >> 2];
        $8 = HEAP32[1616];
        if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $7, $8)) {
         break label$1
        }
        HEAP32[HEAP32[$4 >> 2] + 284 >> 2] = HEAP32[$7 >> 2];
        $9 = HEAP32[1617];
        if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $7, $9)) {
         break label$1
        }
        HEAP32[HEAP32[$4 >> 2] + 288 >> 2] = HEAP32[$7 >> 2];
        $10 = HEAP32[1618];
        if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $7, $10)) {
         break label$1
        }
        HEAP32[HEAP32[$4 >> 2] + 292 >> 2] = HEAP32[$7 >> 2] + 1;
        $11 = HEAP32[1619];
        if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $7, $11)) {
         break label$1
        }
        HEAP32[HEAP32[$4 >> 2] + 296 >> 2] = HEAP32[$7 >> 2] + 1;
        $12 = HEAP32[$4 >> 2];
        $13 = HEAP32[$12 + 56 >> 2];
        $14 = $12 + 304 | 0;
        $12 = HEAP32[1620];
        if (!FLAC__bitreader_read_raw_uint64($13, $14, $12)) {
         break label$1
        }
        $13 = HEAP32[$4 >> 2];
        if (!FLAC__bitreader_read_byte_block_aligned_no_crc(HEAP32[$13 + 56 >> 2], $13 + 312 | 0, 16)) {
         break label$1
        }
        if (!FLAC__bitreader_skip_byte_block_aligned_no_crc(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $3 - (($12 + ($11 + ($10 + ($9 + ($8 + ($6 + ($1 + $5 | 0) | 0) | 0) | 0) | 0) | 0) | 0) + 128 >>> 3 | 0) | 0)) {
         break label$2
        }
        $1 = HEAP32[$4 >> 2];
        HEAP32[$1 + 248 >> 2] = 1;
        if (!memcmp($1 + 312 | 0, 7543, 16)) {
         HEAP32[$1 + 3624 >> 2] = 0
        }
        if (HEAP32[$1 + 3632 >> 2] | !HEAP32[$1 + 608 >> 2]) {
         break label$4
        }
        $2 = HEAP32[$1 + 28 >> 2];
        if (!$2) {
         break label$4
        }
        FUNCTION_TABLE[$2]($0, $1 + 256 | 0, HEAP32[$1 + 48 >> 2]);
        break label$4;
       }
       $1 = HEAP32[$4 >> 2];
       HEAP32[$1 + 252 >> 2] = 0;
       $5 = HEAP32[$7 + 176 >> 2];
       HEAP32[$1 + 448 >> 2] = ($5 >>> 0) / 18;
       HEAP32[$1 + 440 >> 2] = $5;
       HEAP32[$1 + 436 >> 2] = $6;
       HEAP32[$1 + 432 >> 2] = 3;
       $1 = HEAP32[$4 >> 2];
       $2 = HEAP32[$1 + 452 >> 2];
       $3 = HEAP32[$1 + 448 >> 2];
       label$9 : {
        if ($3) {
         __wasm_i64_mul($3, 0, 24, 0);
         if (!i64toi32_i32$HIGH_BITS) {
          $1 = dlrealloc($2, Math_imul($3, 24));
          if ($1) {
           HEAP32[HEAP32[$4 >> 2] + 452 >> 2] = $1;
           break label$9;
          }
          dlfree($2);
          $1 = HEAP32[$4 >> 2];
         }
         HEAP32[$1 + 452 >> 2] = 0;
         break label$3;
        }
        $1 = dlrealloc($2, 0);
        HEAP32[HEAP32[$4 >> 2] + 452 >> 2] = $1;
        if (!$1) {
         break label$3
        }
       }
       $2 = HEAP32[$4 >> 2];
       $1 = 0;
       label$14 : {
        if (!HEAP32[$2 + 448 >> 2]) {
         break label$14
        }
        $6 = HEAP32[1624];
        $8 = HEAP32[1623];
        $9 = HEAP32[1622];
        $3 = 0;
        while (1) {
         if (!FLAC__bitreader_read_raw_uint64(HEAP32[$2 + 56 >> 2], $7, $9)) {
          break label$2
         }
         $2 = HEAP32[$7 + 4 >> 2];
         $1 = Math_imul($3, 24);
         $10 = HEAP32[$4 >> 2];
         $11 = $1 + HEAP32[$10 + 452 >> 2] | 0;
         HEAP32[$11 >> 2] = HEAP32[$7 >> 2];
         HEAP32[$11 + 4 >> 2] = $2;
         if (!FLAC__bitreader_read_raw_uint64(HEAP32[$10 + 56 >> 2], $7, $8)) {
          break label$2
         }
         $2 = HEAP32[$7 + 4 >> 2];
         $10 = HEAP32[$4 >> 2];
         $11 = $1 + HEAP32[$10 + 452 >> 2] | 0;
         HEAP32[$11 + 8 >> 2] = HEAP32[$7 >> 2];
         HEAP32[$11 + 12 >> 2] = $2;
         if (!FLAC__bitreader_read_raw_uint32(HEAP32[$10 + 56 >> 2], $7 + 188 | 0, $6)) {
          break label$2
         }
         $2 = HEAP32[$4 >> 2];
         HEAP32[($1 + HEAP32[$2 + 452 >> 2] | 0) + 16 >> 2] = HEAP32[$7 + 188 >> 2];
         $3 = $3 + 1 | 0;
         $1 = HEAP32[$2 + 448 >> 2];
         if ($3 >>> 0 < $1 >>> 0) {
          continue
         }
         break;
        };
        $1 = Math_imul($1, -18);
       }
       $1 = $1 + $5 | 0;
       if ($1) {
        if (!FLAC__bitreader_skip_byte_block_aligned_no_crc(HEAP32[$2 + 56 >> 2], $1)) {
         break label$2
        }
        $2 = HEAP32[$4 >> 2];
       }
       HEAP32[$2 + 252 >> 2] = 1;
       if (HEAP32[$2 + 3632 >> 2] | !HEAP32[$2 + 620 >> 2]) {
        break label$4
       }
       $1 = HEAP32[$2 + 28 >> 2];
       if (!$1) {
        break label$4
       }
       FUNCTION_TABLE[$1]($0, $2 + 432 | 0, HEAP32[$2 + 48 >> 2]);
       break label$4;
      }
      $3 = HEAP32[$4 >> 2];
      $8 = HEAP32[($3 + ($2 << 2) | 0) + 608 >> 2];
      $5 = HEAP32[$7 + 176 >> 2];
      $1 = memset($7, 176);
      HEAP32[$1 + 8 >> 2] = $5;
      HEAP32[$1 >> 2] = $2;
      HEAP32[$1 + 4 >> 2] = $6;
      $9 = !$8;
      label$17 : {
       if (($2 | 0) != 2) {
        break label$17
       }
       $10 = $1 + 16 | 0;
       $6 = HEAP32[1621] >>> 3 | 0;
       if (!FLAC__bitreader_read_byte_block_aligned_no_crc(HEAP32[$3 + 56 >> 2], $10, $6)) {
        break label$2
       }
       if ($5 >>> 0 < $6 >>> 0) {
        HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
        $2 = 0;
        break label$1;
       }
       $5 = $5 - $6 | 0;
       $3 = HEAP32[$4 >> 2];
       $11 = HEAP32[$3 + 1124 >> 2];
       if (!$11) {
        break label$17
       }
       $12 = HEAP32[$3 + 1120 >> 2];
       $2 = 0;
       while (1) {
        if (memcmp($12 + Math_imul($2, $6) | 0, $10, $6)) {
         $2 = $2 + 1 | 0;
         if (($11 | 0) != ($2 | 0)) {
          continue
         }
         break label$17;
        }
        break;
       };
       $9 = ($8 | 0) != 0;
      }
      if ($9) {
       if (!FLAC__bitreader_skip_byte_block_aligned_no_crc(HEAP32[$3 + 56 >> 2], $5)) {
        break label$2
       }
       break label$4;
      }
      label$22 : {
       label$23 : {
        label$24 : {
         label$25 : {
          label$26 : {
           label$27 : {
            switch (HEAP32[$1 + 180 >> 2]) {
            case 1:
             if (FLAC__bitreader_skip_byte_block_aligned_no_crc(HEAP32[$3 + 56 >> 2], $5)) {
              break label$25
             }
             $6 = 0;
             break label$22;
            case 2:
             if (!$5) {
              break label$26
             }
             $2 = dlmalloc($5);
             HEAP32[$1 + 20 >> 2] = $2;
             if (!$2) {
              HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
              $6 = 0;
              break label$22;
             }
             if (FLAC__bitreader_read_byte_block_aligned_no_crc(HEAP32[$3 + 56 >> 2], $2, $5)) {
              break label$25
             }
             $6 = 0;
             break label$22;
            case 4:
             label$34 : {
              if ($5 >>> 0 < 8) {
               break label$34
              }
              $6 = 0;
              if (!FLAC__bitreader_read_uint32_little_endian(HEAP32[$3 + 56 >> 2], $1 + 16 | 0)) {
               break label$22
              }
              $5 = $5 + -8 | 0;
              $2 = HEAP32[$1 + 16 >> 2];
              label$35 : {
               if ($2) {
                if ($5 >>> 0 < $2 >>> 0) {
                 HEAP32[$1 + 16 >> 2] = 0;
                 HEAP32[$1 + 20 >> 2] = 0;
                 break label$34;
                }
                label$38 : {
                 label$39 : {
                  if (($2 | 0) == -1) {
                   HEAP32[$1 + 20 >> 2] = 0;
                   break label$39;
                  }
                  $3 = dlmalloc($2 + 1 | 0);
                  HEAP32[$1 + 20 >> 2] = $3;
                  if ($3) {
                   break label$38
                  }
                 }
                 HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
                 break label$22;
                }
                if (!FLAC__bitreader_read_byte_block_aligned_no_crc(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $3, $2)) {
                 break label$22
                }
                $5 = $5 - $2 | 0;
                HEAP8[HEAP32[$1 + 20 >> 2] + HEAP32[$1 + 16 >> 2] | 0] = 0;
                break label$35;
               }
               HEAP32[$1 + 20 >> 2] = 0;
              }
              if (!FLAC__bitreader_read_uint32_little_endian(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 24 | 0)) {
               break label$22
              }
              $2 = HEAP32[$1 + 24 >> 2];
              if ($2 >>> 0 >= 100001) {
               HEAP32[$1 + 24 >> 2] = 0;
               break label$22;
              }
              if (!$2) {
               break label$34
              }
              $3 = safe_malloc_mul_2op_p($2, 8);
              HEAP32[$1 + 28 >> 2] = $3;
              if (!$3) {
               break label$24
              }
              if (!HEAP32[$1 + 24 >> 2]) {
               break label$34
              }
              HEAP32[$3 >> 2] = 0;
              HEAP32[$3 + 4 >> 2] = 0;
              $2 = 0;
              label$42 : {
               if ($5 >>> 0 < 4) {
                break label$42
               }
               while (1) {
                if (!FLAC__bitreader_read_uint32_little_endian(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $3)) {
                 break label$23
                }
                $5 = $5 + -4 | 0;
                $8 = HEAP32[$1 + 28 >> 2];
                $9 = $2 << 3;
                $3 = $8 + $9 | 0;
                $6 = HEAP32[$3 >> 2];
                label$44 : {
                 if ($6) {
                  if ($5 >>> 0 < $6 >>> 0) {
                   break label$42
                  }
                  label$46 : {
                   label$47 : {
                    if (($6 | 0) == -1) {
                     HEAP32[($8 + ($2 << 3) | 0) + 4 >> 2] = 0;
                     break label$47;
                    }
                    $8 = dlmalloc($6 + 1 | 0);
                    HEAP32[$3 + 4 >> 2] = $8;
                    if ($8) {
                     break label$46
                    }
                   }
                   HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
                   break label$23;
                  }
                  $5 = $5 - $6 | 0;
                  memset($8, HEAP32[$3 >> 2]);
                  $6 = FLAC__bitreader_read_byte_block_aligned_no_crc(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], HEAP32[$3 + 4 >> 2], HEAP32[$3 >> 2]);
                  $8 = $9 + HEAP32[$1 + 28 >> 2] | 0;
                  $3 = HEAP32[$8 + 4 >> 2];
                  if (!$6) {
                   dlfree($3);
                   HEAP32[(HEAP32[$1 + 28 >> 2] + ($2 << 3) | 0) + 4 >> 2] = 0;
                   break label$42;
                  }
                  HEAP8[$3 + HEAP32[$8 >> 2] | 0] = 0;
                  break label$44;
                 }
                 HEAP32[$3 + 4 >> 2] = 0;
                }
                $2 = $2 + 1 | 0;
                if ($2 >>> 0 >= HEAPU32[$1 + 24 >> 2]) {
                 break label$34
                }
                $3 = HEAP32[$1 + 28 >> 2] + ($2 << 3) | 0;
                HEAP32[$3 >> 2] = 0;
                HEAP32[$3 + 4 >> 2] = 0;
                if ($5 >>> 0 >= 4) {
                 continue
                }
                break;
               };
              }
              HEAP32[$1 + 24 >> 2] = $2;
             }
             if (!$5) {
              break label$25
             }
             if (!HEAP32[$1 + 24 >> 2]) {
              $2 = $1 + 28 | 0;
              dlfree(HEAP32[$2 >> 2]);
              HEAP32[$2 >> 2] = 0;
             }
             if (FLAC__bitreader_skip_byte_block_aligned_no_crc(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $5)) {
              break label$25
             }
             $6 = 0;
             break label$22;
            case 5:
             $6 = 0;
             $2 = memset($1 + 16 | 0, 160);
             if (!FLAC__bitreader_read_byte_block_aligned_no_crc(HEAP32[$3 + 56 >> 2], $2, HEAP32[1635] >>> 3 | 0)) {
              break label$22
             }
             if (!FLAC__bitreader_read_raw_uint64(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 152 | 0, HEAP32[1636])) {
              break label$22
             }
             if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 188 | 0, HEAP32[1637])) {
              break label$22
             }
             HEAP32[$1 + 160 >> 2] = HEAP32[$1 + 188 >> 2] != 0;
             if (!FLAC__bitreader_skip_bits_no_crc(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], HEAP32[1638])) {
              break label$22
             }
             if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 188 | 0, HEAP32[1639])) {
              break label$22
             }
             $2 = HEAP32[$1 + 188 >> 2];
             HEAP32[$1 + 164 >> 2] = $2;
             if (!$2) {
              break label$25
             }
             $2 = dlcalloc($2, 32);
             HEAP32[$1 + 168 >> 2] = $2;
             if ($2) {
              $9 = HEAP32[1628];
              if (!FLAC__bitreader_read_raw_uint64(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $2, $9)) {
               break label$22
              }
              $10 = HEAP32[1630] >>> 3 | 0;
              $11 = HEAP32[1627];
              $12 = HEAP32[1626];
              $8 = HEAP32[1625];
              $13 = HEAP32[1634];
              $16 = HEAP32[1633];
              $17 = HEAP32[1632];
              $18 = HEAP32[1631];
              $19 = HEAP32[1629];
              $5 = 0;
              while (1) {
               if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 188 | 0, $19)) {
                break label$22
               }
               $2 = ($5 << 5) + $2 | 0;
               HEAP8[$2 + 8 | 0] = HEAP32[$1 + 188 >> 2];
               if (!FLAC__bitreader_read_byte_block_aligned_no_crc(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $2 + 9 | 0, $10)) {
                break label$22
               }
               if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 188 | 0, $18)) {
                break label$22
               }
               HEAP8[$2 + 22 | 0] = HEAPU8[$2 + 22 | 0] & 254 | HEAP8[$1 + 188 | 0] & 1;
               if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 188 | 0, $17)) {
                break label$22
               }
               $3 = $2 + 22 | 0;
               HEAP8[$3 | 0] = HEAPU8[$1 + 188 | 0] << 1 & 2 | HEAPU8[$3 | 0] & 253;
               if (!FLAC__bitreader_skip_bits_no_crc(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $16)) {
                break label$22
               }
               if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 188 | 0, $13)) {
                break label$22
               }
               $3 = HEAP32[$1 + 188 >> 2];
               HEAP8[$2 + 23 | 0] = $3;
               label$53 : {
                $3 = $3 & 255;
                if (!$3) {
                 break label$53
                }
                $3 = dlcalloc($3, 16);
                HEAP32[$2 + 24 >> 2] = $3;
                label$54 : {
                 if ($3) {
                  $14 = $2 + 23 | 0;
                  if (!HEAPU8[$14 | 0]) {
                   break label$53
                  }
                  if (!FLAC__bitreader_read_raw_uint64(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $3, $8)) {
                   break label$22
                  }
                  $20 = $2 + 24 | 0;
                  $2 = 0;
                  break label$54;
                 }
                 HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
                 break label$22;
                }
                while (1) {
                 if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 188 | 0, $12)) {
                  break label$22
                 }
                 HEAP8[(($2 << 4) + $3 | 0) + 8 | 0] = HEAP32[$1 + 188 >> 2];
                 if (!FLAC__bitreader_skip_bits_no_crc(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $11)) {
                  break label$22
                 }
                 $2 = $2 + 1 | 0;
                 if ($2 >>> 0 >= HEAPU8[$14 | 0]) {
                  break label$53
                 }
                 $3 = HEAP32[$20 >> 2];
                 if (FLAC__bitreader_read_raw_uint64(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $3 + ($2 << 4) | 0, $8)) {
                  continue
                 }
                 break;
                };
                break label$22;
               }
               $5 = $5 + 1 | 0;
               if ($5 >>> 0 >= HEAPU32[$1 + 164 >> 2]) {
                break label$25
               }
               $2 = HEAP32[$1 + 168 >> 2];
               if (FLAC__bitreader_read_raw_uint64(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $2 + ($5 << 5) | 0, $9)) {
                continue
               }
               break;
              };
              break label$22;
             }
             HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
             break label$22;
            case 6:
             label$57 : {
              if (!FLAC__bitreader_read_raw_uint32(HEAP32[$3 + 56 >> 2], $1 + 188 | 0, HEAP32[1640])) {
               break label$57
              }
              HEAP32[$1 + 16 >> 2] = HEAP32[$1 + 188 >> 2];
              if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 188 | 0, HEAP32[1641])) {
               break label$57
              }
              label$58 : {
               $2 = HEAP32[$1 + 188 >> 2];
               label$59 : {
                if (($2 | 0) == -1) {
                 HEAP32[$1 + 20 >> 2] = 0;
                 break label$59;
                }
                $3 = dlmalloc($2 + 1 | 0);
                HEAP32[$1 + 20 >> 2] = $3;
                if ($3) {
                 break label$58
                }
               }
               HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
               $6 = 0;
               break label$22;
              }
              if ($2) {
               if (!FLAC__bitreader_read_byte_block_aligned_no_crc(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $3, $2)) {
                break label$57
               }
               $3 = HEAP32[$1 + 20 >> 2];
               $2 = HEAP32[$1 + 188 >> 2];
              } else {
               $2 = 0
              }
              HEAP8[$2 + $3 | 0] = 0;
              if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 188 | 0, HEAP32[1642])) {
               break label$57
              }
              label$63 : {
               $2 = HEAP32[$1 + 188 >> 2];
               label$64 : {
                if (($2 | 0) == -1) {
                 HEAP32[$1 + 24 >> 2] = 0;
                 break label$64;
                }
                $3 = dlmalloc($2 + 1 | 0);
                HEAP32[$1 + 24 >> 2] = $3;
                if ($3) {
                 break label$63
                }
               }
               HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
               $6 = 0;
               break label$22;
              }
              if ($2) {
               if (!FLAC__bitreader_read_byte_block_aligned_no_crc(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $3, $2)) {
                break label$57
               }
               $3 = HEAP32[$1 + 24 >> 2];
               $2 = HEAP32[$1 + 188 >> 2];
              } else {
               $2 = 0
              }
              HEAP8[$2 + $3 | 0] = 0;
              if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 28 | 0, HEAP32[1643])) {
               break label$57
              }
              if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 32 | 0, HEAP32[1644])) {
               break label$57
              }
              if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 36 | 0, HEAP32[1645])) {
               break label$57
              }
              if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 40 | 0, HEAP32[1646])) {
               break label$57
              }
              if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $1 + 44 | 0, HEAP32[1647])) {
               break label$57
              }
              $2 = HEAP32[$1 + 44 >> 2];
              $3 = dlmalloc($2 ? $2 : 1);
              HEAP32[$1 + 48 >> 2] = $3;
              if (!$3) {
               HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
               $6 = 0;
               break label$22;
              }
              if (!$2) {
               break label$25
              }
              if (FLAC__bitreader_read_byte_block_aligned_no_crc(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $3, $2)) {
               break label$25
              }
             }
             $6 = 0;
             break label$22;
            case 0:
            case 3:
             break label$25;
            default:
             break label$27;
            };
           }
           label$69 : {
            if ($5) {
             $2 = dlmalloc($5);
             HEAP32[$1 + 16 >> 2] = $2;
             if ($2) {
              break label$69
             }
             HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
             $6 = 0;
             break label$22;
            }
            HEAP32[$1 + 16 >> 2] = 0;
            break label$25;
           }
           if (FLAC__bitreader_read_byte_block_aligned_no_crc(HEAP32[$3 + 56 >> 2], $2, $5)) {
            break label$25
           }
           $6 = 0;
           break label$22;
          }
          HEAP32[$1 + 20 >> 2] = 0;
         }
         $6 = 1;
         $2 = HEAP32[$4 >> 2];
         if (HEAP32[$2 + 3632 >> 2]) {
          break label$22
         }
         $3 = HEAP32[$2 + 28 >> 2];
         if (!$3) {
          break label$22
         }
         FUNCTION_TABLE[$3]($0, $1, HEAP32[$2 + 48 >> 2]);
         break label$22;
        }
        HEAP32[$1 + 24 >> 2] = 0;
        HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
        break label$22;
       }
       HEAP32[$1 + 24 >> 2] = $2;
       $6 = 0;
      }
      label$71 : {
       label$72 : {
        switch (HEAP32[$1 + 180 >> 2] + -1 | 0) {
        case 1:
         $1 = HEAP32[$1 + 20 >> 2];
         if (!$1) {
          break label$71
         }
         dlfree($1);
         break label$71;
        case 3:
         $2 = HEAP32[$1 + 20 >> 2];
         if ($2) {
          dlfree($2)
         }
         $3 = HEAP32[$1 + 24 >> 2];
         if ($3) {
          $2 = 0;
          while (1) {
           $5 = HEAP32[(HEAP32[$1 + 28 >> 2] + ($2 << 3) | 0) + 4 >> 2];
           if ($5) {
            dlfree($5);
            $3 = HEAP32[$1 + 24 >> 2];
           }
           $2 = $2 + 1 | 0;
           if ($2 >>> 0 < $3 >>> 0) {
            continue
           }
           break;
          };
         }
         $1 = HEAP32[$1 + 28 >> 2];
         if (!$1) {
          break label$71
         }
         dlfree($1);
         break label$71;
        case 4:
         $3 = HEAP32[$1 + 164 >> 2];
         if ($3) {
          $2 = 0;
          while (1) {
           $5 = HEAP32[(HEAP32[$1 + 168 >> 2] + ($2 << 5) | 0) + 24 >> 2];
           if ($5) {
            dlfree($5);
            $3 = HEAP32[$1 + 164 >> 2];
           }
           $2 = $2 + 1 | 0;
           if ($2 >>> 0 < $3 >>> 0) {
            continue
           }
           break;
          };
         }
         $1 = HEAP32[$1 + 168 >> 2];
         if (!$1) {
          break label$71
         }
         dlfree($1);
         break label$71;
        case 5:
         $2 = HEAP32[$1 + 20 >> 2];
         if ($2) {
          dlfree($2)
         }
         $2 = HEAP32[$1 + 24 >> 2];
         if ($2) {
          dlfree($2)
         }
         $1 = HEAP32[$1 + 48 >> 2];
         if (!$1) {
          break label$71
         }
         dlfree($1);
         break label$71;
        case 0:
         break label$71;
        default:
         break label$72;
        };
       }
       $1 = HEAP32[$1 + 16 >> 2];
       if (!$1) {
        break label$71
       }
       dlfree($1);
      }
      if (!$6) {
       break label$2
      }
     }
     $2 = 1;
     if (!$15) {
      break label$1
     }
     label$86 : {
      label$87 : {
       $3 = HEAP32[$4 >> 2];
       if (HEAP32[$3 >> 2]) {
        break label$87
       }
       $5 = HEAP32[$3 + 12 >> 2];
       if (!$5) {
        break label$87
       }
       $1 = $3 + 6136 | 0;
       if (FUNCTION_TABLE[$5]($0, $1, HEAP32[$3 + 48 >> 2])) {
        break label$87
       }
       if (!FLAC__bitreader_is_consumed_byte_aligned(HEAP32[HEAP32[$4 >> 2] + 56 >> 2])) {
        break label$87
       }
       $3 = HEAP32[$1 >> 2];
       $4 = HEAP32[HEAP32[$4 >> 2] + 56 >> 2];
       $4 = ((HEAP32[$4 + 8 >> 2] - HEAP32[$4 + 16 >> 2] << 5) + (HEAP32[$4 + 12 >> 2] << 3) | 0) - HEAP32[$4 + 20 >> 2] >>> 3 | 0;
       $5 = HEAP32[$1 + 4 >> 2] - ($3 >>> 0 < $4 >>> 0) | 0;
       HEAP32[$1 >> 2] = $3 - $4;
       HEAP32[$1 + 4 >> 2] = $5;
       break label$86;
      }
      $1 = HEAP32[$4 >> 2];
      HEAP32[$1 + 6136 >> 2] = 0;
      HEAP32[$1 + 6140 >> 2] = 0;
     }
     HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
     break label$1;
    }
    HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
   }
   $2 = 0;
  }
  global$0 = $7 + 192 | 0;
  return $2;
 }
 
 function frame_sync_($0) {
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0;
  $4 = global$0 - 16 | 0;
  global$0 = $4;
  label$1 : {
   label$2 : {
    label$3 : {
     $2 = HEAP32[$0 + 4 >> 2];
     if (!HEAP32[$2 + 248 >> 2]) {
      break label$3
     }
     $3 = HEAP32[$2 + 308 >> 2];
     $1 = $3;
     $5 = HEAP32[$2 + 304 >> 2];
     if (!($1 | $5)) {
      break label$3
     }
     $3 = HEAP32[$2 + 244 >> 2];
     if (($1 | 0) == ($3 | 0) & HEAPU32[$2 + 240 >> 2] < $5 >>> 0 | $3 >>> 0 < $1 >>> 0) {
      break label$3
     }
     HEAP32[HEAP32[$0 >> 2] >> 2] = 4;
     break label$2;
    }
    label$4 : {
     if (FLAC__bitreader_is_consumed_byte_aligned(HEAP32[$2 + 56 >> 2])) {
      break label$4
     }
     $2 = HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2];
     if (FLAC__bitreader_read_raw_uint32($2, $4 + 12 | 0, FLAC__bitreader_bits_left_for_byte_alignment($2))) {
      break label$4
     }
     $1 = 0;
     break label$1;
    }
    $2 = 1;
    while (1) {
     $3 = HEAP32[$0 + 4 >> 2];
     label$6 : {
      if (HEAP32[$3 + 3520 >> 2]) {
       $1 = HEAPU8[$3 + 3590 | 0];
       HEAP32[$4 + 12 >> 2] = $1;
       HEAP32[$3 + 3520 >> 2] = 0;
       break label$6;
      }
      $1 = 0;
      if (!FLAC__bitreader_read_raw_uint32(HEAP32[$3 + 56 >> 2], $4 + 12 | 0, 8)) {
       break label$1
      }
      $1 = HEAP32[$4 + 12 >> 2];
     }
     label$8 : {
      if (($1 | 0) != 255) {
       break label$8
      }
      HEAP8[HEAP32[$0 + 4 >> 2] + 3588 | 0] = 255;
      $1 = 0;
      if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $4 + 12 | 0, 8)) {
       break label$1
      }
      $1 = HEAP32[$4 + 12 >> 2];
      if (($1 | 0) == 255) {
       $1 = HEAP32[$0 + 4 >> 2];
       HEAP32[$1 + 3520 >> 2] = 1;
       HEAP8[$1 + 3590 | 0] = 255;
       break label$8;
      }
      if (($1 & -2) != 248) {
       break label$8
      }
      HEAP8[HEAP32[$0 + 4 >> 2] + 3589 | 0] = $1;
      HEAP32[HEAP32[$0 >> 2] >> 2] = 3;
      break label$2;
     }
     $1 = $2;
     $2 = 0;
     if (!$1) {
      continue
     }
     $1 = HEAP32[$0 + 4 >> 2];
     if (HEAP32[$1 + 3632 >> 2]) {
      continue
     }
     FUNCTION_TABLE[HEAP32[$1 + 32 >> 2]]($0, 0, HEAP32[$1 + 48 >> 2]);
     continue;
    };
   }
   $1 = 1;
  }
  global$0 = $4 + 16 | 0;
  return $1;
 }
 
 function read_frame_($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, wasm2js_i32$0 = 0, wasm2js_i32$1 = 0;
  $7 = global$0 + -64 | 0;
  global$0 = $7;
  HEAP32[$1 >> 2] = 0;
  $2 = HEAP32[$0 + 4 >> 2];
  $4 = HEAPU16[(HEAPU8[$2 + 3588 | 0] << 1) + 1280 >> 1];
  $5 = HEAP32[$2 + 56 >> 2];
  HEAP32[$5 + 24 >> 2] = HEAPU16[((HEAPU8[$2 + 3589 | 0] ^ $4 >>> 8) << 1) + 1280 >> 1] ^ $4 << 8 & 65280;
  $2 = HEAP32[$5 + 20 >> 2];
  HEAP32[$5 + 28 >> 2] = HEAP32[$5 + 16 >> 2];
  HEAP32[$5 + 32 >> 2] = $2;
  $5 = HEAP32[$0 + 4 >> 2];
  HEAP8[$7 + 32 | 0] = HEAPU8[$5 + 3588 | 0];
  $2 = HEAPU8[$5 + 3589 | 0];
  HEAP32[$7 + 12 >> 2] = 2;
  HEAP8[$7 + 33 | 0] = $2;
  label$1 : {
   if (!FLAC__bitreader_read_raw_uint32(HEAP32[$5 + 56 >> 2], $7 + 28 | 0, 8)) {
    break label$1
   }
   $4 = $0 + 4 | 0;
   label$2 : {
    label$3 : {
     label$4 : {
      $5 = HEAP32[$7 + 28 >> 2];
      if (($5 | 0) == 255) {
       break label$4
      }
      HEAP8[$7 + 34 | 0] = $5;
      HEAP32[$7 + 12 >> 2] = 3;
      if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $7 + 28 | 0, 8)) {
       break label$2
      }
      $5 = HEAP32[$7 + 28 >> 2];
      if (($5 | 0) == 255) {
       break label$4
      }
      $9 = $2 >>> 1 & 1;
      $2 = HEAP32[$7 + 12 >> 2];
      HEAP8[$2 + ($7 + 32 | 0) | 0] = $5;
      $5 = 1;
      HEAP32[$7 + 12 >> 2] = $2 + 1;
      $2 = HEAPU8[$7 + 34 | 0];
      $3 = $2 >>> 4 | 0;
      HEAP32[$7 + 28 >> 2] = $3;
      label$5 : {
       label$6 : {
        label$7 : {
         label$8 : {
          switch ($3 - 1 | 0) {
          case 7:
          case 8:
          case 9:
          case 10:
          case 11:
          case 12:
          case 13:
          case 14:
           HEAP32[HEAP32[$4 >> 2] + 1136 >> 2] = 256 << $3 + -8;
           break label$7;
          case 1:
          case 2:
          case 3:
          case 4:
           HEAP32[HEAP32[$4 >> 2] + 1136 >> 2] = 576 << $3 + -2;
           break label$7;
          case 5:
          case 6:
           break label$6;
          case 0:
           break label$8;
          default:
           break label$5;
          };
         }
         HEAP32[HEAP32[$4 >> 2] + 1136 >> 2] = 192;
        }
        $3 = 0;
       }
       $5 = $9;
      }
      $6 = $2 & 15;
      HEAP32[$7 + 28 >> 2] = $6;
      label$11 : {
       label$12 : {
        label$13 : {
         switch ($6 - 1 | 0) {
         default:
          $6 = 0;
          $9 = HEAP32[$4 >> 2];
          if (HEAP32[$9 + 248 >> 2]) {
           break label$12
          }
          $5 = 1;
          break label$11;
         case 0:
          HEAP32[HEAP32[$4 >> 2] + 1140 >> 2] = 88200;
          $6 = 0;
          break label$11;
         case 1:
          HEAP32[HEAP32[$4 >> 2] + 1140 >> 2] = 176400;
          $6 = 0;
          break label$11;
         case 2:
          HEAP32[HEAP32[$4 >> 2] + 1140 >> 2] = 192e3;
          $6 = 0;
          break label$11;
         case 3:
          HEAP32[HEAP32[$4 >> 2] + 1140 >> 2] = 8e3;
          $6 = 0;
          break label$11;
         case 4:
          HEAP32[HEAP32[$4 >> 2] + 1140 >> 2] = 16e3;
          $6 = 0;
          break label$11;
         case 5:
          HEAP32[HEAP32[$4 >> 2] + 1140 >> 2] = 22050;
          $6 = 0;
          break label$11;
         case 6:
          HEAP32[HEAP32[$4 >> 2] + 1140 >> 2] = 24e3;
          $6 = 0;
          break label$11;
         case 7:
          HEAP32[HEAP32[$4 >> 2] + 1140 >> 2] = 32e3;
          $6 = 0;
          break label$11;
         case 8:
          HEAP32[HEAP32[$4 >> 2] + 1140 >> 2] = 44100;
          $6 = 0;
          break label$11;
         case 9:
          HEAP32[HEAP32[$4 >> 2] + 1140 >> 2] = 48e3;
          $6 = 0;
          break label$11;
         case 10:
          HEAP32[HEAP32[$4 >> 2] + 1140 >> 2] = 96e3;
          $6 = 0;
          break label$11;
         case 11:
         case 12:
         case 13:
          break label$11;
         case 14:
          break label$13;
         };
        }
        $5 = HEAP32[$4 >> 2];
        if (!HEAP32[$5 + 3632 >> 2]) {
         FUNCTION_TABLE[HEAP32[$5 + 32 >> 2]]($0, 1, HEAP32[$5 + 48 >> 2])
        }
        $2 = HEAP32[$0 >> 2];
        HEAP32[$2 >> 2] = 2;
        break label$3;
       }
       HEAP32[$9 + 1140 >> 2] = HEAP32[$9 + 288 >> 2];
      }
      $10 = HEAPU8[$7 + 35 | 0];
      $8 = $10 >>> 4 | 0;
      HEAP32[$7 + 28 >> 2] = $8;
      label$27 : {
       label$28 : {
        if ($8 & 8) {
         $2 = HEAP32[$4 >> 2];
         HEAP32[$2 + 1144 >> 2] = 2;
         $9 = 1;
         label$30 : {
          switch ($8 & 7) {
          case 1:
           $9 = 2;
           break label$28;
          case 0:
           break label$28;
          case 2:
           break label$30;
          default:
           break label$27;
          };
         }
         $9 = 3;
         break label$28;
        }
        $2 = HEAP32[$4 >> 2];
        HEAP32[$2 + 1144 >> 2] = $8 + 1;
        $9 = 0;
       }
       HEAP32[$2 + 1148 >> 2] = $9;
       $9 = $5;
      }
      $8 = $10 >>> 1 & 7;
      HEAP32[$7 + 28 >> 2] = $8;
      $5 = 1;
      label$32 : {
       label$33 : {
        label$34 : {
         switch ($8 - 1 | 0) {
         default:
          if (!HEAP32[$2 + 248 >> 2]) {
           break label$32
          }
          HEAP32[$2 + 1152 >> 2] = HEAP32[$2 + 296 >> 2];
          break label$33;
         case 0:
          HEAP32[$2 + 1152 >> 2] = 8;
          break label$33;
         case 1:
          HEAP32[$2 + 1152 >> 2] = 12;
          break label$33;
         case 3:
          HEAP32[$2 + 1152 >> 2] = 16;
          break label$33;
         case 4:
          HEAP32[$2 + 1152 >> 2] = 20;
          break label$33;
         case 2:
         case 6:
          break label$32;
         case 5:
          break label$34;
         };
        }
        HEAP32[$2 + 1152 >> 2] = 24;
       }
       $5 = $9;
      }
      label$40 : {
       if (!(!HEAP32[$2 + 248 >> 2] | HEAP32[$2 + 272 >> 2] == HEAP32[$2 + 276 >> 2] ? !(HEAP8[$7 + 33 | 0] & 1) : 0)) {
        if (!FLAC__bitreader_read_utf8_uint64(HEAP32[$2 + 56 >> 2], $7 + 16 | 0, $7 + 32 | 0, $7 + 12 | 0)) {
         break label$2
        }
        $9 = HEAP32[$7 + 20 >> 2];
        $2 = $9;
        $8 = HEAP32[$7 + 16 >> 2];
        if (($8 | 0) == -1 & ($2 | 0) == -1) {
         $9 = HEAPU8[(HEAP32[$7 + 12 >> 2] + $7 | 0) + 31 | 0];
         $5 = HEAP32[$4 >> 2];
         HEAP32[$5 + 3520 >> 2] = 1;
         HEAP8[$5 + 3590 | 0] = $9;
         if (!HEAP32[$5 + 3632 >> 2]) {
          FUNCTION_TABLE[HEAP32[$5 + 32 >> 2]]($0, 1, HEAP32[$5 + 48 >> 2])
         }
         $2 = HEAP32[$0 >> 2];
         HEAP32[$2 >> 2] = 2;
         break label$3;
        }
        $9 = HEAP32[$4 >> 2];
        $11 = $9 + 1160 | 0;
        HEAP32[$11 >> 2] = $8;
        HEAP32[$11 + 4 >> 2] = $2;
        HEAP32[$9 + 1156 >> 2] = 1;
        break label$40;
       }
       if (!FLAC__bitreader_read_utf8_uint32(HEAP32[$2 + 56 >> 2], $7 + 28 | 0, $7 + 32 | 0, $7 + 12 | 0)) {
        break label$2
       }
       $9 = HEAP32[$7 + 28 >> 2];
       if (($9 | 0) == -1) {
        $9 = HEAPU8[(HEAP32[$7 + 12 >> 2] + $7 | 0) + 31 | 0];
        $5 = HEAP32[$4 >> 2];
        HEAP32[$5 + 3520 >> 2] = 1;
        HEAP8[$5 + 3590 | 0] = $9;
        if (!HEAP32[$5 + 3632 >> 2]) {
         FUNCTION_TABLE[HEAP32[$5 + 32 >> 2]]($0, 1, HEAP32[$5 + 48 >> 2])
        }
        $2 = HEAP32[$0 >> 2];
        HEAP32[$2 >> 2] = 2;
        break label$3;
       }
       $2 = HEAP32[$4 >> 2];
       HEAP32[$2 + 1160 >> 2] = $9;
       HEAP32[$2 + 1156 >> 2] = 0;
      }
      $2 = HEAP32[$4 >> 2];
      if ($3) {
       if (!FLAC__bitreader_read_raw_uint32(HEAP32[$2 + 56 >> 2], $7 + 28 | 0, 8)) {
        break label$2
       }
       $2 = HEAP32[$7 + 12 >> 2];
       $9 = HEAP32[$7 + 28 >> 2];
       HEAP8[$2 + ($7 + 32 | 0) | 0] = $9;
       HEAP32[$7 + 12 >> 2] = $2 + 1;
       if (($3 | 0) == 7) {
        if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $7 + 8 | 0, 8)) {
         break label$2
        }
        $9 = HEAP32[$7 + 12 >> 2];
        $2 = HEAP32[$7 + 8 >> 2];
        HEAP8[$9 + ($7 + 32 | 0) | 0] = $2;
        HEAP32[$7 + 12 >> 2] = $9 + 1;
        $9 = $2 | HEAP32[$7 + 28 >> 2] << 8;
        HEAP32[$7 + 28 >> 2] = $9;
       }
       $2 = HEAP32[$4 >> 2];
       HEAP32[$2 + 1136 >> 2] = $9 + 1;
      }
      if ($6) {
       if (!FLAC__bitreader_read_raw_uint32(HEAP32[$2 + 56 >> 2], $7 + 28 | 0, 8)) {
        break label$2
       }
       $9 = HEAP32[$7 + 12 >> 2];
       $2 = HEAP32[$7 + 28 >> 2];
       HEAP8[$9 + ($7 + 32 | 0) | 0] = $2;
       HEAP32[$7 + 12 >> 2] = $9 + 1;
       label$50 : {
        if (($6 | 0) != 12) {
         if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $7 + 8 | 0, 8)) {
          break label$2
         }
         $9 = HEAP32[$7 + 12 >> 2];
         $2 = HEAP32[$7 + 8 >> 2];
         HEAP8[$9 + ($7 + 32 | 0) | 0] = $2;
         HEAP32[$7 + 12 >> 2] = $9 + 1;
         $3 = $2 | HEAP32[$7 + 28 >> 2] << 8;
         HEAP32[$7 + 28 >> 2] = $3;
         if (($6 | 0) == 13) {
          break label$50
         }
         $3 = Math_imul($3, 10);
         break label$50;
        }
        $3 = Math_imul($2, 1e3);
       }
       $2 = HEAP32[$4 >> 2];
       HEAP32[$2 + 1140 >> 2] = $3;
      }
      if (!FLAC__bitreader_read_raw_uint32(HEAP32[$2 + 56 >> 2], $7 + 28 | 0, 8)) {
       break label$2
      }
      $9 = HEAPU8[$7 + 28 | 0];
      $3 = FLAC__crc8($7 + 32 | 0, HEAP32[$7 + 12 >> 2]);
      $2 = HEAP32[$4 >> 2];
      if (($3 | 0) != ($9 | 0)) {
       if (!HEAP32[$2 + 3632 >> 2]) {
        FUNCTION_TABLE[HEAP32[$2 + 32 >> 2]]($0, 1, HEAP32[$2 + 48 >> 2])
       }
       $2 = HEAP32[$0 >> 2];
       HEAP32[$2 >> 2] = 2;
       break label$3;
      }
      HEAP32[$2 + 232 >> 2] = 0;
      label$54 : {
       label$55 : {
        if (HEAP32[$2 + 1156 >> 2]) {
         break label$55
        }
        $3 = $2 + 1160 | 0;
        $9 = HEAP32[$3 >> 2];
        HEAP32[$7 + 28 >> 2] = $9;
        HEAP32[$2 + 1156 >> 2] = 1;
        $6 = HEAP32[$2 + 228 >> 2];
        if ($6) {
         (wasm2js_i32$0 = $3, wasm2js_i32$1 = __wasm_i64_mul($6, 0, $9, 0)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
         HEAP32[$3 + 4 >> 2] = i64toi32_i32$HIGH_BITS;
         break label$55;
        }
        if (HEAP32[$2 + 248 >> 2]) {
         $3 = HEAP32[$2 + 272 >> 2];
         if (($3 | 0) != HEAP32[$2 + 276 >> 2]) {
          break label$54
         }
         $2 = $2 + 1160 | 0;
         (wasm2js_i32$0 = $2, wasm2js_i32$1 = __wasm_i64_mul($3, 0, $9, 0)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
         HEAP32[$2 + 4 >> 2] = i64toi32_i32$HIGH_BITS;
         $9 = HEAP32[$4 >> 2];
         HEAP32[$9 + 232 >> 2] = HEAP32[$9 + 276 >> 2];
         break label$55;
        }
        if (!$9) {
         $9 = $2 + 1160 | 0;
         HEAP32[$9 >> 2] = 0;
         HEAP32[$9 + 4 >> 2] = 0;
         $9 = HEAP32[$4 >> 2];
         HEAP32[$9 + 232 >> 2] = HEAP32[$9 + 1136 >> 2];
         break label$55;
        }
        $3 = $2 + 1160 | 0;
        (wasm2js_i32$0 = $3, wasm2js_i32$1 = __wasm_i64_mul(HEAP32[$2 + 1136 >> 2], 0, $9, 0)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
        HEAP32[$3 + 4 >> 2] = i64toi32_i32$HIGH_BITS;
       }
       if (!($5 | $10 & 1)) {
        $2 = HEAP32[$0 >> 2];
        break label$3;
       }
       $2 = HEAP32[$4 >> 2];
      }
      label$60 : {
       if (!HEAP32[$2 + 3632 >> 2]) {
        FUNCTION_TABLE[HEAP32[$2 + 32 >> 2]]($0, 3, HEAP32[$2 + 48 >> 2]);
        break label$60;
       }
       HEAP32[$2 + 6152 >> 2] = HEAP32[$2 + 6152 >> 2] + 1;
      }
      $2 = HEAP32[$0 >> 2];
      HEAP32[$2 >> 2] = 2;
      break label$3;
     }
     $5 = HEAP32[$4 >> 2];
     HEAP32[$5 + 3520 >> 2] = 1;
     HEAP8[$5 + 3590 | 0] = 255;
     if (!HEAP32[$5 + 3632 >> 2]) {
      FUNCTION_TABLE[HEAP32[$5 + 32 >> 2]]($0, 1, HEAP32[$5 + 48 >> 2])
     }
     $2 = HEAP32[$0 >> 2];
     HEAP32[$2 >> 2] = 2;
    }
    $9 = 1;
    if (HEAP32[$2 >> 2] == 2) {
     break label$1
    }
    $2 = HEAP32[$4 >> 2];
    $5 = HEAP32[$2 + 1144 >> 2];
    label$63 : {
     label$100 : {
      $6 = HEAP32[$2 + 1136 >> 2];
      if (!(HEAPU32[$2 + 224 >> 2] >= $5 >>> 0 ? HEAPU32[$2 + 220 >> 2] >= $6 >>> 0 : 0)) {
       $3 = HEAP32[$2 + 60 >> 2];
       if ($3) {
        dlfree($3 + -16 | 0);
        HEAP32[HEAP32[$4 >> 2] + 60 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $3 = HEAP32[$2 + 3592 >> 2];
       if ($3) {
        dlfree($3);
        HEAP32[HEAP32[$4 >> 2] + 92 >> 2] = 0;
        HEAP32[HEAP32[$4 >> 2] + 3592 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $3 = HEAP32[$2 - -64 >> 2];
       if ($3) {
        dlfree($3 + -16 | 0);
        HEAP32[HEAP32[$4 >> 2] - -64 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $3 = HEAP32[$2 + 3596 >> 2];
       if ($3) {
        dlfree($3);
        HEAP32[HEAP32[$4 >> 2] + 96 >> 2] = 0;
        HEAP32[HEAP32[$4 >> 2] + 3596 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $3 = HEAP32[$2 + 68 >> 2];
       if ($3) {
        dlfree($3 + -16 | 0);
        HEAP32[HEAP32[$4 >> 2] + 68 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $3 = HEAP32[$2 + 3600 >> 2];
       if ($3) {
        dlfree($3);
        HEAP32[HEAP32[$4 >> 2] + 100 >> 2] = 0;
        HEAP32[HEAP32[$4 >> 2] + 3600 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $3 = HEAP32[$2 + 72 >> 2];
       if ($3) {
        dlfree($3 + -16 | 0);
        HEAP32[HEAP32[$4 >> 2] + 72 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $3 = HEAP32[$2 + 3604 >> 2];
       if ($3) {
        dlfree($3);
        HEAP32[HEAP32[$4 >> 2] + 104 >> 2] = 0;
        HEAP32[HEAP32[$4 >> 2] + 3604 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $3 = HEAP32[$2 + 76 >> 2];
       if ($3) {
        dlfree($3 + -16 | 0);
        HEAP32[HEAP32[$4 >> 2] + 76 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $3 = HEAP32[$2 + 3608 >> 2];
       if ($3) {
        dlfree($3);
        HEAP32[HEAP32[$4 >> 2] + 108 >> 2] = 0;
        HEAP32[HEAP32[$4 >> 2] + 3608 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $3 = HEAP32[$2 + 80 >> 2];
       if ($3) {
        dlfree($3 + -16 | 0);
        HEAP32[HEAP32[$4 >> 2] + 80 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $3 = HEAP32[$2 + 3612 >> 2];
       if ($3) {
        dlfree($3);
        HEAP32[HEAP32[$4 >> 2] + 112 >> 2] = 0;
        HEAP32[HEAP32[$4 >> 2] + 3612 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $3 = HEAP32[$2 + 84 >> 2];
       if ($3) {
        dlfree($3 + -16 | 0);
        HEAP32[HEAP32[$4 >> 2] + 84 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $3 = HEAP32[$2 + 3616 >> 2];
       if ($3) {
        dlfree($3);
        HEAP32[HEAP32[$4 >> 2] + 116 >> 2] = 0;
        HEAP32[HEAP32[$4 >> 2] + 3616 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $3 = HEAP32[$2 + 88 >> 2];
       if ($3) {
        dlfree($3 + -16 | 0);
        HEAP32[HEAP32[$4 >> 2] + 88 >> 2] = 0;
        $2 = HEAP32[$4 >> 2];
       }
       $2 = HEAP32[$2 + 3620 >> 2];
       if ($2) {
        dlfree($2);
        HEAP32[HEAP32[$4 >> 2] + 120 >> 2] = 0;
        HEAP32[HEAP32[$4 >> 2] + 3620 >> 2] = 0;
       }
       label$97 : {
        if (!$5) {
         break label$97
        }
        if ($6 >>> 0 > 4294967291) {
         break label$63
        }
        $2 = $6 + 4 | 0;
        if (($2 & 1073741823) != ($2 | 0)) {
         break label$63
        }
        $8 = $2 << 2;
        $3 = 0;
        while (1) {
         $2 = dlmalloc($8);
         if (!$2) {
          break label$63
         }
         HEAP32[$2 >> 2] = 0;
         HEAP32[$2 + 4 >> 2] = 0;
         HEAP32[$2 + 8 >> 2] = 0;
         HEAP32[$2 + 12 >> 2] = 0;
         $10 = $3 << 2;
         HEAP32[($10 + HEAP32[$4 >> 2] | 0) + 60 >> 2] = $2 + 16;
         $2 = $10 + HEAP32[$4 >> 2] | 0;
         if (FLAC__memory_alloc_aligned_int32_array($6, $2 + 3592 | 0, $2 + 92 | 0)) {
          $3 = $3 + 1 | 0;
          if (($5 | 0) == ($3 | 0)) {
           break label$97
          }
          continue;
         }
         break;
        };
        HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
        break label$2;
       }
       $2 = HEAP32[$4 >> 2];
       HEAP32[$2 + 224 >> 2] = $5;
       HEAP32[$2 + 220 >> 2] = $6;
       $5 = HEAP32[$2 + 1144 >> 2];
      }
      if (!$5) {
       break label$100
      }
      $17 = HEAP32[1669];
      $20 = -1 << $17 ^ -1;
      $18 = HEAP32[1663];
      $19 = HEAP32[1662];
      $21 = HEAP32[1670];
      $5 = 0;
      while (1) {
       $3 = HEAP32[$2 + 1152 >> 2];
       label$102 : {
        label$103 : {
         switch (HEAP32[$2 + 1148 >> 2] + -1 | 0) {
         case 0:
          $3 = (($5 | 0) == 1) + $3 | 0;
          break label$102;
         case 1:
          $3 = !$5 + $3 | 0;
          break label$102;
         case 2:
          break label$103;
         default:
          break label$102;
         };
        }
        $3 = (($5 | 0) == 1) + $3 | 0;
       }
       if (!FLAC__bitreader_read_raw_uint32(HEAP32[$2 + 56 >> 2], $7 + 28 | 0, 8)) {
        break label$2
       }
       $2 = HEAP32[$7 + 28 >> 2];
       HEAP32[$7 + 28 >> 2] = $2 & 254;
       $13 = $2 & 1;
       label$106 : {
        if ($13) {
         if (!FLAC__bitreader_read_unary_unsigned(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $7 + 32 | 0)) {
          break label$2
         }
         $2 = HEAP32[$4 >> 2];
         $6 = HEAP32[$7 + 32 >> 2] + 1 | 0;
         HEAP32[($2 + Math_imul($5, 292) | 0) + 1464 >> 2] = $6;
         if ($3 >>> 0 <= $6 >>> 0) {
          break label$2
         }
         $3 = $3 - $6 | 0;
         break label$106;
        }
        $2 = HEAP32[$4 >> 2];
        HEAP32[($2 + Math_imul($5, 292) | 0) + 1464 >> 2] = 0;
       }
       $6 = HEAP32[$7 + 28 >> 2];
       label$108 : {
        if ($6 & 128) {
         if (!HEAP32[$2 + 3632 >> 2]) {
          FUNCTION_TABLE[HEAP32[$2 + 32 >> 2]]($0, 0, HEAP32[$2 + 48 >> 2])
         }
         HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
         break label$108;
        }
        label$111 : {
         label$112 : {
          label$113 : {
           switch ($6 | 0) {
           case 0:
            $6 = HEAP32[(($5 << 2) + $2 | 0) + 60 >> 2];
            $8 = Math_imul($5, 292) + $2 | 0;
            HEAP32[$8 + 1176 >> 2] = 0;
            if (!FLAC__bitreader_read_raw_int32(HEAP32[$2 + 56 >> 2], $7 + 32 | 0, $3)) {
             break label$2
            }
            HEAP32[$8 + 1180 >> 2] = HEAP32[$7 + 32 >> 2];
            $2 = 0;
            $3 = HEAP32[$4 >> 2];
            if (!HEAP32[$3 + 1136 >> 2]) {
             break label$112
            }
            while (1) {
             HEAP32[$6 + ($2 << 2) >> 2] = HEAP32[$7 + 32 >> 2];
             $2 = $2 + 1 | 0;
             if ($2 >>> 0 < HEAPU32[$3 + 1136 >> 2]) {
              continue
             }
             break;
            };
            break label$112;
           case 2:
            $6 = ($2 + 1136 | 0) + Math_imul($5, 292) | 0;
            $8 = $6 + 44 | 0;
            $10 = $5 << 2;
            $11 = HEAP32[($10 + $2 | 0) + 92 >> 2];
            HEAP32[$8 >> 2] = $11;
            HEAP32[$6 + 40 >> 2] = 1;
            $6 = 0;
            if (HEAP32[$2 + 1136 >> 2]) {
             while (1) {
              if (!FLAC__bitreader_read_raw_int32(HEAP32[$2 + 56 >> 2], $7 + 32 | 0, $3)) {
               break label$2
              }
              HEAP32[$11 + ($6 << 2) >> 2] = HEAP32[$7 + 32 >> 2];
              $6 = $6 + 1 | 0;
              $2 = HEAP32[$4 >> 2];
              $12 = HEAP32[$2 + 1136 >> 2];
              if ($6 >>> 0 < $12 >>> 0) {
               continue
              }
              break;
             };
             $6 = $12 << 2;
            }
            memcpy(HEAP32[($2 + $10 | 0) + 60 >> 2], HEAP32[$8 >> 2], $6);
            break label$112;
           default:
            break label$113;
           };
          }
          if ($6 >>> 0 <= 15) {
           label$120 : {
            if (!HEAP32[$2 + 3632 >> 2]) {
             FUNCTION_TABLE[HEAP32[$2 + 32 >> 2]]($0, 3, HEAP32[$2 + 48 >> 2]);
             break label$120;
            }
            HEAP32[$2 + 6152 >> 2] = HEAP32[$2 + 6152 >> 2] + 1;
           }
           HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
           break label$108;
          }
          if ($6 >>> 0 <= 24) {
           $8 = Math_imul($5, 292) + $2 | 0;
           HEAP32[$8 + 1176 >> 2] = 2;
           $11 = $5 << 2;
           $12 = HEAP32[($11 + $2 | 0) + 92 >> 2];
           $10 = $6 >>> 1 & 7;
           HEAP32[$8 + 1192 >> 2] = $10;
           HEAP32[$8 + 1212 >> 2] = $12;
           $6 = HEAP32[$2 + 56 >> 2];
           if ($10) {
            $12 = $8 + 1196 | 0;
            $2 = 0;
            while (1) {
             if (!FLAC__bitreader_read_raw_int32($6, $7 + 32 | 0, $3)) {
              break label$2
             }
             HEAP32[$12 + ($2 << 2) >> 2] = HEAP32[$7 + 32 >> 2];
             $6 = HEAP32[HEAP32[$4 >> 2] + 56 >> 2];
             $2 = $2 + 1 | 0;
             if (($10 | 0) != ($2 | 0)) {
              continue
             }
             break;
            };
           }
           if (!FLAC__bitreader_read_raw_uint32($6, $7 + 16 | 0, $19)) {
            break label$2
           }
           $6 = $8 + 1180 | 0;
           $3 = HEAP32[$7 + 16 >> 2];
           HEAP32[$6 >> 2] = $3;
           $2 = HEAP32[$4 >> 2];
           label$125 : {
            label$126 : {
             if ($3 >>> 0 <= 1) {
              if (!FLAC__bitreader_read_raw_uint32(HEAP32[$2 + 56 >> 2], $7 + 16 | 0, $18)) {
               break label$2
              }
              $2 = HEAP32[$4 >> 2];
              $3 = HEAP32[$7 + 16 >> 2];
              if (HEAP32[$2 + 1136 >> 2] >>> $3 >>> 0 >= $10 >>> 0) {
               break label$126
              }
              if (!HEAP32[$2 + 3632 >> 2]) {
               FUNCTION_TABLE[HEAP32[$2 + 32 >> 2]]($0, 0, HEAP32[$2 + 48 >> 2])
              }
              HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
              break label$125;
             }
             label$129 : {
              if (!HEAP32[$2 + 3632 >> 2]) {
               FUNCTION_TABLE[HEAP32[$2 + 32 >> 2]]($0, 3, HEAP32[$2 + 48 >> 2]);
               break label$129;
              }
              HEAP32[$2 + 6152 >> 2] = HEAP32[$2 + 6152 >> 2] + 1;
             }
             HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
             break label$125;
            }
            HEAP32[$8 + 1184 >> 2] = $3;
            $2 = Math_imul($5, 12);
            HEAP32[$8 + 1188 >> 2] = ($2 + HEAP32[$4 >> 2] | 0) + 124;
            $6 = HEAP32[$6 >> 2];
            if ($6 >>> 0 < 2) {
             $14 = $3;
             $3 = HEAP32[$0 + 4 >> 2];
             if (!read_residual_partitioned_rice_($0, $10, $14, ($2 + $3 | 0) + 124 | 0, HEAP32[($3 + $11 | 0) + 92 >> 2], ($6 | 0) == 1)) {
              break label$2
             }
            }
            $2 = $10 << 2;
            memcpy(HEAP32[($11 + HEAP32[$4 >> 2] | 0) + 60 >> 2], $8 + 1196 | 0, $2);
            $3 = HEAP32[$4 >> 2];
            $6 = $3 + $11 | 0;
            FLAC__fixed_restore_signal(HEAP32[$6 + 92 >> 2], HEAP32[$3 + 1136 >> 2] - $10 | 0, $10, $2 + HEAP32[$6 + 60 >> 2] | 0);
           }
           if (HEAP32[HEAP32[$0 >> 2] >> 2] == 2) {
            break label$108
           }
           if ($13) {
            break label$111
           }
           break label$108;
          }
          if ($6 >>> 0 <= 63) {
           label$133 : {
            if (!HEAP32[$2 + 3632 >> 2]) {
             FUNCTION_TABLE[HEAP32[$2 + 32 >> 2]]($0, 3, HEAP32[$2 + 48 >> 2]);
             break label$133;
            }
            HEAP32[$2 + 6152 >> 2] = HEAP32[$2 + 6152 >> 2] + 1;
           }
           HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
           break label$108;
          }
          $8 = Math_imul($5, 292) + $2 | 0;
          HEAP32[$8 + 1176 >> 2] = 3;
          $11 = $5 << 2;
          $15 = HEAP32[($11 + $2 | 0) + 92 >> 2];
          $12 = $6 >>> 1 & 31;
          $10 = $12 + 1 | 0;
          HEAP32[$8 + 1192 >> 2] = $10;
          HEAP32[$8 + 1460 >> 2] = $15;
          $6 = HEAP32[$2 + 56 >> 2];
          $2 = 0;
          while (1) {
           if (!FLAC__bitreader_read_raw_int32($6, $7 + 32 | 0, $3)) {
            break label$2
           }
           HEAP32[($8 + ($2 << 2) | 0) + 1332 >> 2] = HEAP32[$7 + 32 >> 2];
           $15 = ($2 | 0) != ($12 | 0);
           $6 = HEAP32[HEAP32[$4 >> 2] + 56 >> 2];
           $2 = $2 + 1 | 0;
           if ($15) {
            continue
           }
           break;
          };
          if (!FLAC__bitreader_read_raw_uint32($6, $7 + 16 | 0, $17)) {
           break label$2
          }
          $2 = HEAP32[$7 + 16 >> 2];
          label$136 : {
           if (($2 | 0) == ($20 | 0)) {
            $2 = HEAP32[$4 >> 2];
            if (!HEAP32[$2 + 3632 >> 2]) {
             FUNCTION_TABLE[HEAP32[$2 + 32 >> 2]]($0, 0, HEAP32[$2 + 48 >> 2])
            }
            HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
            break label$136;
           }
           $16 = $8 + 1196 | 0;
           HEAP32[$16 >> 2] = $2 + 1;
           if (!FLAC__bitreader_read_raw_int32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $7 + 32 | 0, $21)) {
            break label$2
           }
           $2 = HEAP32[$7 + 32 >> 2];
           if (($2 | 0) <= -1) {
            $2 = HEAP32[$4 >> 2];
            if (!HEAP32[$2 + 3632 >> 2]) {
             FUNCTION_TABLE[HEAP32[$2 + 32 >> 2]]($0, 0, HEAP32[$2 + 48 >> 2])
            }
            HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
            break label$136;
           }
           $15 = $8 + 1200 | 0;
           HEAP32[$15 >> 2] = $2;
           $6 = HEAP32[HEAP32[$4 >> 2] + 56 >> 2];
           $2 = 0;
           while (1) {
            if (!FLAC__bitreader_read_raw_int32($6, $7 + 32 | 0, HEAP32[$16 >> 2])) {
             break label$2
            }
            HEAP32[($8 + ($2 << 2) | 0) + 1204 >> 2] = HEAP32[$7 + 32 >> 2];
            $14 = ($2 | 0) != ($12 | 0);
            $6 = HEAP32[HEAP32[$4 >> 2] + 56 >> 2];
            $2 = $2 + 1 | 0;
            if ($14) {
             continue
            }
            break;
           };
           if (!FLAC__bitreader_read_raw_uint32($6, $7 + 16 | 0, $19)) {
            break label$2
           }
           $14 = $8 + 1180 | 0;
           $6 = HEAP32[$7 + 16 >> 2];
           HEAP32[$14 >> 2] = $6;
           $2 = HEAP32[$4 >> 2];
           label$142 : {
            if ($6 >>> 0 <= 1) {
             if (!FLAC__bitreader_read_raw_uint32(HEAP32[$2 + 56 >> 2], $7 + 16 | 0, $18)) {
              break label$2
             }
             $2 = HEAP32[$4 >> 2];
             $6 = HEAP32[$7 + 16 >> 2];
             if (HEAP32[$2 + 1136 >> 2] >>> $6 >>> 0 > $12 >>> 0) {
              break label$142
             }
             if (!HEAP32[$2 + 3632 >> 2]) {
              FUNCTION_TABLE[HEAP32[$2 + 32 >> 2]]($0, 0, HEAP32[$2 + 48 >> 2])
             }
             HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
             break label$136;
            }
            label$145 : {
             if (!HEAP32[$2 + 3632 >> 2]) {
              FUNCTION_TABLE[HEAP32[$2 + 32 >> 2]]($0, 3, HEAP32[$2 + 48 >> 2]);
              break label$145;
             }
             HEAP32[$2 + 6152 >> 2] = HEAP32[$2 + 6152 >> 2] + 1;
            }
            HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
            break label$136;
           }
           HEAP32[$8 + 1184 >> 2] = $6;
           $2 = Math_imul($5, 12);
           HEAP32[$8 + 1188 >> 2] = ($2 + HEAP32[$4 >> 2] | 0) + 124;
           $12 = HEAP32[$14 >> 2];
           if ($12 >>> 0 < 2) {
            $14 = $6;
            $6 = HEAP32[$0 + 4 >> 2];
            if (!read_residual_partitioned_rice_($0, $10, $14, ($2 + $6 | 0) + 124 | 0, HEAP32[($6 + $11 | 0) + 92 >> 2], ($12 | 0) == 1)) {
             break label$2
            }
           }
           $6 = $10 << 2;
           memcpy(HEAP32[(HEAP32[$4 >> 2] + $11 | 0) + 60 >> 2], $8 + 1332 | 0, $6);
           label$148 : {
            $12 = HEAP32[$16 >> 2];
            if ($12 + ((Math_clz32($10) ^ 31) + $3 | 0) >>> 0 <= 32) {
             $2 = HEAP32[$4 >> 2];
             if ($3 >>> 0 > 16 | $12 >>> 0 > 16) {
              break label$148
             }
             $3 = $2 + $11 | 0;
             FUNCTION_TABLE[HEAP32[$2 + 44 >> 2]](HEAP32[$3 + 92 >> 2], HEAP32[$2 + 1136 >> 2] - $10 | 0, $8 + 1204 | 0, $10, HEAP32[$15 >> 2], $6 + HEAP32[$3 + 60 >> 2] | 0);
             break label$136;
            }
            $2 = HEAP32[$4 >> 2];
            $3 = $2 + $11 | 0;
            FUNCTION_TABLE[HEAP32[$2 + 40 >> 2]](HEAP32[$3 + 92 >> 2], HEAP32[$2 + 1136 >> 2] - $10 | 0, $8 + 1204 | 0, $10, HEAP32[$15 >> 2], $6 + HEAP32[$3 + 60 >> 2] | 0);
            break label$136;
           }
           $3 = $2 + $11 | 0;
           FUNCTION_TABLE[HEAP32[$2 + 36 >> 2]](HEAP32[$3 + 92 >> 2], HEAP32[$2 + 1136 >> 2] - $10 | 0, $8 + 1204 | 0, $10, HEAP32[$15 >> 2], $6 + HEAP32[$3 + 60 >> 2] | 0);
          }
          if (!$13 | HEAP32[HEAP32[$0 >> 2] >> 2] == 2) {
           break label$108
          }
          break label$111;
         }
         if (!$13) {
          break label$108
         }
        }
        $3 = HEAP32[$4 >> 2];
        $2 = HEAP32[($3 + Math_imul($5, 292) | 0) + 1464 >> 2];
        HEAP32[$7 + 28 >> 2] = $2;
        if (!HEAP32[$3 + 1136 >> 2]) {
         break label$108
        }
        $6 = HEAP32[($3 + ($5 << 2) | 0) + 60 >> 2];
        HEAP32[$6 >> 2] = HEAP32[$6 >> 2] << $2;
        $2 = 1;
        if (HEAPU32[$3 + 1136 >> 2] < 2) {
         break label$108
        }
        while (1) {
         $8 = $6 + ($2 << 2) | 0;
         HEAP32[$8 >> 2] = HEAP32[$8 >> 2] << HEAP32[$7 + 28 >> 2];
         $2 = $2 + 1 | 0;
         if ($2 >>> 0 < HEAPU32[$3 + 1136 >> 2]) {
          continue
         }
         break;
        };
       }
       if (HEAP32[HEAP32[$0 >> 2] >> 2] != 2) {
        $5 = $5 + 1 | 0;
        $2 = HEAP32[$4 >> 2];
        if ($5 >>> 0 >= HEAPU32[$2 + 1144 >> 2]) {
         break label$100
        }
        continue;
       }
       break;
      };
      break label$1;
     }
     label$152 : {
      if (FLAC__bitreader_is_consumed_byte_aligned(HEAP32[$2 + 56 >> 2])) {
       break label$152
      }
      HEAP32[$7 + 32 >> 2] = 0;
      $5 = HEAP32[HEAP32[$4 >> 2] + 56 >> 2];
      if (!FLAC__bitreader_read_raw_uint32($5, $7 + 32 | 0, FLAC__bitreader_bits_left_for_byte_alignment($5))) {
       break label$2
      }
      if (!HEAP32[$7 + 32 >> 2]) {
       break label$152
      }
      $5 = HEAP32[$4 >> 2];
      if (!HEAP32[$5 + 3632 >> 2]) {
       FUNCTION_TABLE[HEAP32[$5 + 32 >> 2]]($0, 0, HEAP32[$5 + 48 >> 2])
      }
      HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
     }
     if (HEAP32[HEAP32[$0 >> 2] >> 2] == 2) {
      break label$1
     }
     $5 = FLAC__bitreader_get_read_crc16(HEAP32[HEAP32[$4 >> 2] + 56 >> 2]);
     $9 = 0;
     if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$4 >> 2] + 56 >> 2], $7 + 16 | 0, HEAP32[1661])) {
      break label$1
     }
     label$154 : {
      if (($5 | 0) == HEAP32[$7 + 16 >> 2]) {
       label$156 : {
        label$157 : {
         label$158 : {
          $5 = HEAP32[$4 >> 2];
          switch (HEAP32[$5 + 1148 >> 2] + -1 | 0) {
          case 2:
           break label$156;
          case 0:
           break label$157;
          case 1:
           break label$158;
          default:
           break label$154;
          };
         }
         if (!HEAP32[$5 + 1136 >> 2]) {
          break label$154
         }
         $2 = HEAP32[$5 - -64 >> 2];
         $6 = HEAP32[$5 + 60 >> 2];
         $3 = 0;
         while (1) {
          $8 = $3 << 2;
          $10 = $8 + $6 | 0;
          HEAP32[$10 >> 2] = HEAP32[$10 >> 2] + HEAP32[$2 + $8 >> 2];
          $3 = $3 + 1 | 0;
          if ($3 >>> 0 < HEAPU32[$5 + 1136 >> 2]) {
           continue
          }
          break;
         };
         break label$154;
        }
        if (!HEAP32[$5 + 1136 >> 2]) {
         break label$154
        }
        $2 = HEAP32[$5 - -64 >> 2];
        $6 = HEAP32[$5 + 60 >> 2];
        $3 = 0;
        while (1) {
         $8 = $3 << 2;
         $10 = $8 + $2 | 0;
         HEAP32[$10 >> 2] = HEAP32[$6 + $8 >> 2] - HEAP32[$10 >> 2];
         $3 = $3 + 1 | 0;
         if ($3 >>> 0 < HEAPU32[$5 + 1136 >> 2]) {
          continue
         }
         break;
        };
        break label$154;
       }
       if (!HEAP32[$5 + 1136 >> 2]) {
        break label$154
       }
       $10 = HEAP32[$5 - -64 >> 2];
       $11 = HEAP32[$5 + 60 >> 2];
       $3 = 0;
       while (1) {
        $6 = $3 << 2;
        $2 = $6 + $11 | 0;
        $13 = $6 + $10 | 0;
        $6 = HEAP32[$13 >> 2];
        $8 = $6 & 1 | HEAP32[$2 >> 2] << 1;
        HEAP32[$2 >> 2] = $6 + $8 >> 1;
        HEAP32[$13 >> 2] = $8 - $6 >> 1;
        $3 = $3 + 1 | 0;
        if ($3 >>> 0 < HEAPU32[$5 + 1136 >> 2]) {
         continue
        }
        break;
       };
       break label$154;
      }
      $5 = HEAP32[$4 >> 2];
      if (!HEAP32[$5 + 3632 >> 2]) {
       FUNCTION_TABLE[HEAP32[$5 + 32 >> 2]]($0, 2, HEAP32[$5 + 48 >> 2])
      }
      $2 = HEAP32[$4 >> 2];
      if (!HEAP32[$2 + 1144 >> 2]) {
       break label$154
      }
      $3 = 0;
      while (1) {
       memset(HEAP32[(($3 << 2) + $2 | 0) + 60 >> 2], HEAP32[$2 + 1136 >> 2] << 2);
       $3 = $3 + 1 | 0;
       $2 = HEAP32[$4 >> 2];
       if ($3 >>> 0 < HEAPU32[$2 + 1144 >> 2]) {
        continue
       }
       break;
      };
     }
     HEAP32[$1 >> 2] = 1;
     $2 = HEAP32[$4 >> 2];
     $1 = HEAP32[$2 + 232 >> 2];
     if ($1) {
      HEAP32[$2 + 228 >> 2] = $1
     }
     $1 = HEAP32[$0 >> 2];
     $6 = HEAP32[$2 + 1144 >> 2];
     HEAP32[$1 + 8 >> 2] = $6;
     HEAP32[$1 + 12 >> 2] = HEAP32[$2 + 1148 >> 2];
     $13 = HEAP32[$2 + 1152 >> 2];
     HEAP32[$1 + 16 >> 2] = $13;
     HEAP32[$1 + 20 >> 2] = HEAP32[$2 + 1140 >> 2];
     $5 = HEAP32[$2 + 1136 >> 2];
     HEAP32[$1 + 24 >> 2] = $5;
     $1 = $2 + 1160 | 0;
     $8 = HEAP32[$1 >> 2];
     $3 = HEAP32[$1 + 4 >> 2];
     $1 = $3;
     $12 = $5 + $8 | 0;
     if ($12 >>> 0 < $5 >>> 0) {
      $1 = $1 + 1 | 0
     }
     HEAP32[$2 + 240 >> 2] = $12;
     HEAP32[$2 + 244 >> 2] = $1;
     $10 = $2 + 60 | 0;
     $11 = $2 + 1136 | 0;
     label$165 : {
      label$166 : {
       label$167 : {
        if (HEAP32[$2 + 3632 >> 2]) {
         HEAP32[$2 + 6156 >> 2] = 1;
         $13 = HEAP32[$2 + 6144 >> 2];
         $5 = HEAP32[$2 + 6148 >> 2];
         memcpy($2 + 3752 | 0, $11, 2384);
         if (($3 | 0) == ($5 | 0) & $13 >>> 0 < $8 >>> 0 | $5 >>> 0 < $3 >>> 0 | (($1 | 0) == ($5 | 0) & $13 >>> 0 >= $12 >>> 0 | $5 >>> 0 > $1 >>> 0)) {
          break label$165
         }
         $3 = 0;
         $1 = HEAP32[$4 >> 2];
         HEAP32[$1 + 3632 >> 2] = 0;
         $5 = $13 - $8 | 0;
         $4 = $5;
         if ($4) {
          if ($6) {
           while (1) {
            $8 = $3 << 2;
            HEAP32[$8 + ($7 + 32 | 0) >> 2] = HEAP32[($2 + $8 | 0) + 60 >> 2] + ($4 << 2);
            $3 = $3 + 1 | 0;
            if (($6 | 0) != ($3 | 0)) {
             continue
            }
            break;
           }
          }
          HEAP32[$1 + 3752 >> 2] = HEAP32[$1 + 3752 >> 2] - $4;
          $2 = $1 + 3776 | 0;
          $4 = $2;
          $3 = $2;
          $1 = HEAP32[$2 + 4 >> 2];
          $2 = $5 + HEAP32[$2 >> 2] | 0;
          if ($2 >>> 0 < $5 >>> 0) {
           $1 = $1 + 1 | 0
          }
          HEAP32[$3 >> 2] = $2;
          HEAP32[$4 + 4 >> 2] = $1;
          $1 = HEAP32[$0 + 4 >> 2];
          $1 = FUNCTION_TABLE[HEAP32[$1 + 24 >> 2]]($0, $1 + 3752 | 0, $7 + 32 | 0, HEAP32[$1 + 48 >> 2]) | 0;
          break label$167;
         }
         $1 = FUNCTION_TABLE[HEAP32[$1 + 24 >> 2]]($0, $11, $10, HEAP32[$1 + 48 >> 2]) | 0;
         break label$167;
        }
        label$172 : {
         if (!HEAP32[$2 + 248 >> 2]) {
          HEAP32[$2 + 3624 >> 2] = 0;
          break label$172;
         }
         if (!HEAP32[$2 + 3624 >> 2]) {
          break label$172
         }
         if (!FLAC__MD5Accumulate($2 + 3636 | 0, $10, $6, $5, $13 + 7 >>> 3 | 0)) {
          break label$166
         }
         $2 = HEAP32[$4 >> 2];
        }
        $1 = FUNCTION_TABLE[HEAP32[$2 + 24 >> 2]]($0, $11, $10, HEAP32[$2 + 48 >> 2]) | 0;
       }
       if (!$1) {
        break label$165
       }
      }
      HEAP32[HEAP32[$0 >> 2] >> 2] = 7;
      break label$1;
     }
     HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
     $9 = 1;
     break label$1;
    }
    HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
   }
   $9 = 0;
  }
  global$0 = $7 - -64 | 0;
  return $9;
 }
 
 function read_residual_partitioned_rice_($0, $1, $2, $3, $4, $5) {
  var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0;
  $6 = global$0 - 16 | 0;
  global$0 = $6;
  $7 = HEAP32[HEAP32[$0 + 4 >> 2] + 1136 >> 2];
  $11 = HEAP32[($5 ? 6672 : 6668) >> 2];
  $12 = HEAP32[($5 ? 6660 : 6656) >> 2];
  label$1 : {
   label$2 : {
    if (FLAC__format_entropy_coding_method_partitioned_rice_contents_ensure_size($3, $2 >>> 0 > 6 ? $2 : 6)) {
     $8 = $2 ? $7 >>> $2 | 0 : $7 - $1 | 0;
     $13 = HEAP32[1666];
     if (!$2) {
      break label$2
     }
     $5 = 0;
     while (1) {
      if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $6 + 12 | 0, $12)) {
       $7 = 0;
       break label$1;
      }
      $9 = $10 << 2;
      HEAP32[$9 + HEAP32[$3 >> 2] >> 2] = HEAP32[$6 + 12 >> 2];
      label$6 : {
       if (HEAPU32[$6 + 12 >> 2] < $11 >>> 0) {
        $7 = 0;
        HEAP32[$9 + HEAP32[$3 + 4 >> 2] >> 2] = 0;
        $9 = $8 - ($10 ? 0 : $1) | 0;
        if (!FLAC__bitreader_read_rice_signed_block(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], ($5 << 2) + $4 | 0, $9, HEAP32[$6 + 12 >> 2])) {
         break label$1
        }
        $5 = $5 + $9 | 0;
        break label$6;
       }
       if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $6 + 12 | 0, $13)) {
        $7 = 0;
        break label$1;
       }
       HEAP32[$9 + HEAP32[$3 + 4 >> 2] >> 2] = HEAP32[$6 + 12 >> 2];
       $7 = $10 ? 0 : $1;
       if ($7 >>> 0 >= $8 >>> 0) {
        break label$6
       }
       while (1) {
        if (!FLAC__bitreader_read_raw_int32(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $6 + 8 | 0, HEAP32[$6 + 12 >> 2])) {
         $7 = 0;
         break label$1;
        }
        HEAP32[($5 << 2) + $4 >> 2] = HEAP32[$6 + 8 >> 2];
        $5 = $5 + 1 | 0;
        $7 = $7 + 1 | 0;
        if (($8 | 0) != ($7 | 0)) {
         continue
        }
        break;
       };
      }
      $7 = 1;
      $10 = $10 + 1 | 0;
      if (!($10 >>> $2)) {
       continue
      }
      break;
     };
     break label$1;
    }
    HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
    $7 = 0;
    break label$1;
   }
   $7 = 0;
   if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $6 + 12 | 0, $12)) {
    break label$1
   }
   HEAP32[HEAP32[$3 >> 2] >> 2] = HEAP32[$6 + 12 >> 2];
   label$11 : {
    if (HEAPU32[$6 + 12 >> 2] >= $11 >>> 0) {
     if (!FLAC__bitreader_read_raw_uint32(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $6 + 12 | 0, $13)) {
      break label$1
     }
     HEAP32[HEAP32[$3 + 4 >> 2] >> 2] = HEAP32[$6 + 12 >> 2];
     if (!$8) {
      break label$11
     }
     $5 = 0;
     while (1) {
      if (!FLAC__bitreader_read_raw_int32(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $6 + 8 | 0, HEAP32[$6 + 12 >> 2])) {
       $7 = 0;
       break label$1;
      }
      HEAP32[($5 << 2) + $4 >> 2] = HEAP32[$6 + 8 >> 2];
      $5 = $5 + 1 | 0;
      $7 = $7 + 1 | 0;
      if (($8 | 0) != ($7 | 0)) {
       continue
      }
      break;
     };
     break label$11;
    }
    HEAP32[HEAP32[$3 + 4 >> 2] >> 2] = 0;
    if (!FLAC__bitreader_read_rice_signed_block(HEAP32[HEAP32[$0 + 4 >> 2] + 56 >> 2], $4, $8, HEAP32[$6 + 12 >> 2])) {
     break label$1
    }
   }
   $7 = 1;
  }
  global$0 = $6 + 16 | 0;
  return $7;
 }
 
 function FLAC__stream_decoder_process_until_end_of_metadata($0) {
  $0 = $0 | 0;
  var $1 = 0, $2 = 0;
  label$1 : {
   label$2 : {
    while (1) {
     label$4 : {
      $1 = 1;
      label$5 : {
       switch (HEAP32[HEAP32[$0 >> 2] >> 2]) {
       case 0:
        if (find_metadata_($0)) {
         continue
        }
        break label$4;
       case 2:
       case 3:
       case 4:
       case 7:
        break label$2;
       case 1:
        break label$5;
       default:
        break label$1;
       };
      }
      if (read_metadata_($0)) {
       continue
      }
     }
     break;
    };
    $1 = 0;
   }
   $2 = $1;
  }
  return $2 | 0;
 }
 
 function FLAC__stream_decoder_process_until_end_of_stream($0) {
  $0 = $0 | 0;
  var $1 = 0, $2 = 0, $3 = 0;
  $1 = global$0 - 16 | 0;
  global$0 = $1;
  $2 = 1;
  label$1 : {
   label$2 : {
    while (1) {
     label$4 : {
      label$5 : {
       switch (HEAP32[HEAP32[$0 >> 2] >> 2]) {
       case 0:
        if (find_metadata_($0)) {
         continue
        }
        break label$4;
       case 1:
        if (read_metadata_($0)) {
         continue
        }
        break label$4;
       case 2:
        if (frame_sync_($0)) {
         continue
        }
        break label$2;
       case 4:
       case 7:
        break label$2;
       case 3:
        break label$5;
       default:
        break label$1;
       };
      }
      if (read_frame_($0, $1 + 12 | 0)) {
       continue
      }
     }
     break;
    };
    $2 = 0;
   }
   $3 = $2;
  }
  global$0 = $1 + 16 | 0;
  return $3 | 0;
 }
 
 function read_callback_proxy_($0, $1, $2, $3) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $0 = FUNCTION_TABLE[HEAP32[HEAP32[$0 + 4 >> 2] + 4 >> 2]]($0, $1, $2, $3) | 0;
  if ($0 >>> 0 <= 2) {
   return HEAP32[($0 << 2) + 7560 >> 2]
  }
  return 5;
 }
 
 function simple_ogg_page__init($0) {
  HEAP32[$0 >> 2] = 0;
  HEAP32[$0 + 4 >> 2] = 0;
  HEAP32[$0 + 8 >> 2] = 0;
  HEAP32[$0 + 12 >> 2] = 0;
 }
 
 function simple_ogg_page__clear($0) {
  var $1 = 0;
  $1 = HEAP32[$0 >> 2];
  if ($1) {
   dlfree($1)
  }
  $1 = HEAP32[$0 + 8 >> 2];
  if ($1) {
   dlfree($1)
  }
  HEAP32[$0 >> 2] = 0;
  HEAP32[$0 + 4 >> 2] = 0;
  HEAP32[$0 + 8 >> 2] = 0;
  HEAP32[$0 + 12 >> 2] = 0;
 }
 
 function simple_ogg_page__get_at($0, $1, $2, $3, $4, $5, $6) {
  var $7 = 0, $8 = 0, $9 = 0;
  $7 = global$0 - 16 | 0;
  global$0 = $7;
  label$1 : {
   if (!$4) {
    break label$1
   }
   label$2 : {
    switch (FUNCTION_TABLE[$4]($0, $1, $2, $6) | 0) {
    case 1:
     HEAP32[HEAP32[$0 >> 2] >> 2] = 5;
     break label$1;
    case 0:
     break label$2;
    default:
     break label$1;
    };
   }
   $4 = dlmalloc(282);
   HEAP32[$3 >> 2] = $4;
   if (!$4) {
    HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
    break label$1;
   }
   $8 = 27;
   while (1) {
    HEAP32[$7 + 12 >> 2] = $8;
    $1 = 5;
    label$6 : {
     label$7 : {
      switch (FUNCTION_TABLE[$5]($0, $4, $7 + 12 | 0, $6) | 0) {
      case 1:
       $1 = HEAP32[$7 + 12 >> 2];
       if ($1) {
        break label$6
       }
       $1 = 2;
      default:
       HEAP32[HEAP32[$0 >> 2] >> 2] = $1;
       break label$1;
      case 3:
       break label$1;
      case 0:
       break label$7;
      };
     }
     $1 = HEAP32[$7 + 12 >> 2];
    }
    $4 = $1 + $4 | 0;
    $8 = $8 - $1 | 0;
    if ($8) {
     continue
    }
    break;
   };
   $1 = HEAP32[$3 >> 2];
   HEAP32[$3 + 4 >> 2] = HEAPU8[$1 + 26 | 0] + 27;
   label$10 : {
    if (!(HEAP8[$1 + 5 | 0] & 1 | (HEAPU8[$1 | 0] | HEAPU8[$1 + 1 | 0] << 8 | (HEAPU8[$1 + 2 | 0] << 16 | HEAPU8[$1 + 3 | 0] << 24)) != 1399285583 | ((HEAPU8[$1 + 6 | 0] | HEAPU8[$1 + 7 | 0] << 8 | (HEAPU8[$1 + 8 | 0] << 16 | HEAPU8[$1 + 9 | 0] << 24)) != 0 | (HEAPU8[$1 + 10 | 0] | HEAPU8[$1 + 11 | 0] << 8 | (HEAPU8[$1 + 12 | 0] << 16 | HEAPU8[$1 + 13 | 0] << 24)) != 0))) {
     $8 = HEAPU8[$1 + 26 | 0];
     if ($8) {
      break label$10
     }
    }
    HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
    break label$1;
   }
   $4 = $1 + 27 | 0;
   while (1) {
    HEAP32[$7 + 12 >> 2] = $8;
    $1 = 5;
    label$13 : {
     label$14 : {
      switch (FUNCTION_TABLE[$5]($0, $4, $7 + 12 | 0, $6) | 0) {
      case 1:
       $1 = HEAP32[$7 + 12 >> 2];
       if ($1) {
        break label$13
       }
       $1 = 2;
      default:
       HEAP32[HEAP32[$0 >> 2] >> 2] = $1;
       break label$1;
      case 3:
       break label$1;
      case 0:
       break label$14;
      };
     }
     $1 = HEAP32[$7 + 12 >> 2];
    }
    $4 = $1 + $4 | 0;
    $8 = $8 - $1 | 0;
    if ($8) {
     continue
    }
    break;
   };
   $4 = 0;
   $1 = HEAP32[$3 >> 2];
   $2 = HEAPU8[$1 + 26 | 0];
   label$17 : {
    if (($2 | 0) != 1) {
     $2 = $2 + -1 | 0;
     while (1) {
      if (HEAPU8[($1 + $4 | 0) + 27 | 0] != 255) {
       HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
       break label$17;
      }
      $4 = $4 + 1 | 0;
      if ($4 >>> 0 < $2 >>> 0) {
       continue
      }
      break;
     };
    }
    $4 = HEAPU8[($1 + $4 | 0) + 27 | 0] + Math_imul($4, 255) | 0;
    HEAP32[$3 + 12 >> 2] = $4;
    $8 = dlmalloc($4 ? $4 : 1);
    HEAP32[$3 + 8 >> 2] = $8;
    if (!$8) {
     HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
     break label$17;
    }
    $2 = $7;
    if ($4) {
     while (1) {
      HEAP32[$7 + 12 >> 2] = $4;
      $1 = 5;
      label$24 : {
       label$25 : {
        switch (FUNCTION_TABLE[$5]($0, $8, $7 + 12 | 0, $6) | 0) {
        case 1:
         $1 = HEAP32[$7 + 12 >> 2];
         if ($1) {
          break label$24
         }
         $1 = 2;
        default:
         HEAP32[HEAP32[$0 >> 2] >> 2] = $1;
         break label$17;
        case 3:
         break label$17;
        case 0:
         break label$25;
        };
       }
       $1 = HEAP32[$7 + 12 >> 2];
      }
      $8 = $1 + $8 | 0;
      $4 = $4 - $1 | 0;
      if ($4) {
       continue
      }
      break;
     };
     $1 = HEAP32[$3 >> 2];
    }
    HEAP32[$2 + 12 >> 2] = HEAPU8[$1 + 22 | 0] | HEAPU8[$1 + 23 | 0] << 8 | (HEAPU8[$1 + 24 | 0] << 16 | HEAPU8[$1 + 25 | 0] << 24);
    ogg_page_checksum_set($3);
    $1 = HEAP32[$3 >> 2];
    if (HEAP32[$7 + 12 >> 2] == (HEAPU8[$1 + 22 | 0] | HEAPU8[$1 + 23 | 0] << 8 | (HEAPU8[$1 + 24 | 0] << 16 | HEAPU8[$1 + 25 | 0] << 24))) {
     $9 = 1;
     break label$1;
    }
    HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
   }
  }
  global$0 = $7 + 16 | 0;
  return $9;
 }
 
 function simple_ogg_page__set_at($0, $1, $2, $3, $4, $5, $6) {
  folding_inner0 : {
   label$1 : {
    if (!$4) {
     break label$1
    }
    label$2 : {
     switch (FUNCTION_TABLE[$4]($0, $1, $2, $6) | 0) {
     case 1:
      break folding_inner0;
     case 0:
      break label$2;
     default:
      break label$1;
     };
    }
    ogg_page_checksum_set($3);
    if (FUNCTION_TABLE[$5]($0, HEAP32[$3 >> 2], HEAP32[$3 + 4 >> 2], 0, 0, $6)) {
     break folding_inner0
    }
    if (!FUNCTION_TABLE[$5]($0, HEAP32[$3 + 8 >> 2], HEAP32[$3 + 12 >> 2], 0, 0, $6)) {
     return 1
    }
    HEAP32[HEAP32[$0 >> 2] >> 2] = 5;
   }
   return 0;
  }
  HEAP32[HEAP32[$0 >> 2] >> 2] = 5;
  return 0;
 }
 
 function __emscripten_stdout_close($0) {
  $0 = $0 | 0;
  return 0;
 }
 
 function __emscripten_stdout_seek($0, $1, $2, $3) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  i64toi32_i32$HIGH_BITS = 0;
  return 0;
 }
 
 function strcmp($0, $1) {
  var $2 = 0, $3 = 0;
  $2 = HEAPU8[$0 | 0];
  $3 = HEAPU8[$1 | 0];
  label$1 : {
   if (!$2 | ($2 | 0) != ($3 | 0)) {
    break label$1
   }
   while (1) {
    $3 = HEAPU8[$1 + 1 | 0];
    $2 = HEAPU8[$0 + 1 | 0];
    if (!$2) {
     break label$1
    }
    $1 = $1 + 1 | 0;
    $0 = $0 + 1 | 0;
    if (($2 | 0) == ($3 | 0)) {
     continue
    }
    break;
   };
  }
  return $2 - $3 | 0;
 }
 
 function __cos($0, $1) {
  var $2 = 0.0, $3 = 0.0, $4 = 0.0, $5 = 0.0;
  $2 = $0 * $0;
  $3 = $2 * .5;
  $4 = 1.0 - $3;
  $5 = 1.0 - $4 - $3;
  $3 = $2 * $2;
  return $4 + ($5 + ($2 * ($2 * ($2 * ($2 * 2.480158728947673e-05 + -.001388888888887411) + .0416666666666666) + $3 * $3 * ($2 * ($2 * -1.1359647557788195e-11 + 2.087572321298175e-09) + -2.7557314351390663e-07)) - $0 * $1));
 }
 
 function scalbn($0, $1) {
  label$1 : {
   if (($1 | 0) >= 1024) {
    $0 = $0 * 8988465674311579538646525.0e283;
    if (($1 | 0) < 2047) {
     $1 = $1 + -1023 | 0;
     break label$1;
    }
    $0 = $0 * 8988465674311579538646525.0e283;
    $1 = (($1 | 0) < 3069 ? $1 : 3069) + -2046 | 0;
    break label$1;
   }
   if (($1 | 0) > -1023) {
    break label$1
   }
   $0 = $0 * 2.2250738585072014e-308;
   if (($1 | 0) > -2045) {
    $1 = $1 + 1022 | 0;
    break label$1;
   }
   $0 = $0 * 2.2250738585072014e-308;
   $1 = (($1 | 0) > -3066 ? $1 : -3066) + 2044 | 0;
  }
  wasm2js_scratch_store_i32(0, 0);
  wasm2js_scratch_store_i32(1, $1 + 1023 << 20);
  return $0 * +wasm2js_scratch_load_f64();
 }
 
 function __rem_pio2_large($0, $1, $2, $3) {
  var $4 = 0.0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0.0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0;
  $7 = global$0 - 560 | 0;
  global$0 = $7;
  $5 = ($2 + -3 | 0) / 24 | 0;
  $16 = ($5 | 0) > 0 ? $5 : 0;
  $10 = $2 + Math_imul($16, -24) | 0;
  $12 = HEAP32[1897];
  $9 = $3 + -1 | 0;
  if (($12 + $9 | 0) >= 0) {
   $5 = $3 + $12 | 0;
   $2 = $16 - $9 | 0;
   while (1) {
    HEAPF64[($7 + 320 | 0) + ($6 << 3) >> 3] = ($2 | 0) < 0 ? 0.0 : +HEAP32[($2 << 2) + 7600 >> 2];
    $2 = $2 + 1 | 0;
    $6 = $6 + 1 | 0;
    if (($5 | 0) != ($6 | 0)) {
     continue
    }
    break;
   };
  }
  $13 = $10 + -24 | 0;
  $5 = 0;
  $6 = ($12 | 0) > 0 ? $12 : 0;
  $11 = ($3 | 0) < 1;
  while (1) {
   label$6 : {
    if ($11) {
     $4 = 0.0;
     break label$6;
    }
    $8 = $5 + $9 | 0;
    $2 = 0;
    $4 = 0.0;
    while (1) {
     $4 = $4 + HEAPF64[($2 << 3) + $0 >> 3] * HEAPF64[($7 + 320 | 0) + ($8 - $2 << 3) >> 3];
     $2 = $2 + 1 | 0;
     if (($3 | 0) != ($2 | 0)) {
      continue
     }
     break;
    };
   }
   HEAPF64[($5 << 3) + $7 >> 3] = $4;
   $2 = ($5 | 0) == ($6 | 0);
   $5 = $5 + 1 | 0;
   if (!$2) {
    continue
   }
   break;
  };
  $20 = 47 - $10 | 0;
  $17 = 48 - $10 | 0;
  $21 = $10 + -25 | 0;
  $5 = $12;
  label$9 : {
   while (1) {
    $4 = HEAPF64[($5 << 3) + $7 >> 3];
    $2 = 0;
    $6 = $5;
    $9 = ($5 | 0) < 1;
    if (!$9) {
     while (1) {
      $11 = ($7 + 480 | 0) + ($2 << 2) | 0;
      $14 = $4;
      $4 = $4 * 5.9604644775390625e-08;
      label$14 : {
       if (Math_abs($4) < 2147483648.0) {
        $8 = ~~$4;
        break label$14;
       }
       $8 = -2147483648;
      }
      $4 = +($8 | 0);
      $14 = $14 + $4 * -16777216.0;
      label$13 : {
       if (Math_abs($14) < 2147483648.0) {
        $8 = ~~$14;
        break label$13;
       }
       $8 = -2147483648;
      }
      HEAP32[$11 >> 2] = $8;
      $6 = $6 + -1 | 0;
      $4 = HEAPF64[($6 << 3) + $7 >> 3] + $4;
      $2 = $2 + 1 | 0;
      if (($5 | 0) != ($2 | 0)) {
       continue
      }
      break;
     }
    }
    $4 = scalbn($4, $13);
    $4 = $4 + Math_floor($4 * .125) * -8.0;
    label$17 : {
     if (Math_abs($4) < 2147483648.0) {
      $11 = ~~$4;
      break label$17;
     }
     $11 = -2147483648;
    }
    $4 = $4 - +($11 | 0);
    label$19 : {
     label$20 : {
      label$21 : {
       $18 = ($13 | 0) < 1;
       label$22 : {
        if (!$18) {
         $6 = (($5 << 2) + $7 | 0) + 476 | 0;
         $8 = HEAP32[$6 >> 2];
         $2 = $8 >> $17;
         $15 = $6;
         $6 = $8 - ($2 << $17) | 0;
         HEAP32[$15 >> 2] = $6;
         $11 = $2 + $11 | 0;
         $8 = $6 >> $20;
         break label$22;
        }
        if ($13) {
         break label$21
        }
        $8 = HEAP32[(($5 << 2) + $7 | 0) + 476 >> 2] >> 23;
       }
       if (($8 | 0) < 1) {
        break label$19
       }
       break label$20;
      }
      $8 = 2;
      if (!!($4 >= .5)) {
       break label$20
      }
      $8 = 0;
      break label$19;
     }
     $2 = 0;
     $6 = 0;
     if (!$9) {
      while (1) {
       $15 = ($7 + 480 | 0) + ($2 << 2) | 0;
       $19 = HEAP32[$15 >> 2];
       $9 = 16777215;
       label$26 : {
        label$27 : {
         if ($6) {
          break label$27
         }
         $9 = 16777216;
         if ($19) {
          break label$27
         }
         $6 = 0;
         break label$26;
        }
        HEAP32[$15 >> 2] = $9 - $19;
        $6 = 1;
       }
       $2 = $2 + 1 | 0;
       if (($5 | 0) != ($2 | 0)) {
        continue
       }
       break;
      }
     }
     label$28 : {
      if ($18) {
       break label$28
      }
      label$29 : {
       switch ($21 | 0) {
       case 0:
        $2 = (($5 << 2) + $7 | 0) + 476 | 0;
        HEAP32[$2 >> 2] = HEAP32[$2 >> 2] & 8388607;
        break label$28;
       case 1:
        break label$29;
       default:
        break label$28;
       };
      }
      $2 = (($5 << 2) + $7 | 0) + 476 | 0;
      HEAP32[$2 >> 2] = HEAP32[$2 >> 2] & 4194303;
     }
     $11 = $11 + 1 | 0;
     if (($8 | 0) != 2) {
      break label$19
     }
     $4 = 1.0 - $4;
     $8 = 2;
     if (!$6) {
      break label$19
     }
     $4 = $4 - scalbn(1.0, $13);
    }
    if ($4 == 0.0) {
     $6 = 0;
     label$32 : {
      $2 = $5;
      if (($2 | 0) <= ($12 | 0)) {
       break label$32
      }
      while (1) {
       $2 = $2 + -1 | 0;
       $6 = HEAP32[($7 + 480 | 0) + ($2 << 2) >> 2] | $6;
       if (($2 | 0) > ($12 | 0)) {
        continue
       }
       break;
      };
      if (!$6) {
       break label$32
      }
      $10 = $13;
      while (1) {
       $10 = $10 + -24 | 0;
       $5 = $5 + -1 | 0;
       if (!HEAP32[($7 + 480 | 0) + ($5 << 2) >> 2]) {
        continue
       }
       break;
      };
      break label$9;
     }
     $2 = 1;
     while (1) {
      $6 = $2;
      $2 = $2 + 1 | 0;
      if (!HEAP32[($7 + 480 | 0) + ($12 - $6 << 2) >> 2]) {
       continue
      }
      break;
     };
     $6 = $5 + $6 | 0;
     while (1) {
      $9 = $3 + $5 | 0;
      $5 = $5 + 1 | 0;
      HEAPF64[($7 + 320 | 0) + ($9 << 3) >> 3] = HEAP32[($16 + $5 << 2) + 7600 >> 2];
      $2 = 0;
      $4 = 0.0;
      if (($3 | 0) >= 1) {
       while (1) {
        $4 = $4 + HEAPF64[($2 << 3) + $0 >> 3] * HEAPF64[($7 + 320 | 0) + ($9 - $2 << 3) >> 3];
        $2 = $2 + 1 | 0;
        if (($3 | 0) != ($2 | 0)) {
         continue
        }
        break;
       }
      }
      HEAPF64[($5 << 3) + $7 >> 3] = $4;
      if (($5 | 0) < ($6 | 0)) {
       continue
      }
      break;
     };
     $5 = $6;
     continue;
    }
    break;
   };
   $4 = scalbn($4, 0 - $13 | 0);
   label$39 : {
    if (!!($4 >= 16777216.0)) {
     $3 = ($7 + 480 | 0) + ($5 << 2) | 0;
     $14 = $4;
     $4 = $4 * 5.9604644775390625e-08;
     label$42 : {
      if (Math_abs($4) < 2147483648.0) {
       $2 = ~~$4;
       break label$42;
      }
      $2 = -2147483648;
     }
     $4 = $14 + +($2 | 0) * -16777216.0;
     label$41 : {
      if (Math_abs($4) < 2147483648.0) {
       $0 = ~~$4;
       break label$41;
      }
      $0 = -2147483648;
     }
     HEAP32[$3 >> 2] = $0;
     $5 = $5 + 1 | 0;
     break label$39;
    }
    $2 = Math_abs($4) < 2147483648.0 ? ~~$4 : -2147483648;
    $10 = $13;
   }
   HEAP32[($7 + 480 | 0) + ($5 << 2) >> 2] = $2;
  }
  $4 = scalbn(1.0, $10);
  label$47 : {
   if (($5 | 0) <= -1) {
    break label$47
   }
   $2 = $5;
   while (1) {
    HEAPF64[($2 << 3) + $7 >> 3] = $4 * +HEAP32[($7 + 480 | 0) + ($2 << 2) >> 2];
    $4 = $4 * 5.9604644775390625e-08;
    $0 = ($2 | 0) > 0;
    $2 = $2 + -1 | 0;
    if ($0) {
     continue
    }
    break;
   };
   $9 = 0;
   if (($5 | 0) < 0) {
    break label$47
   }
   $0 = ($12 | 0) > 0 ? $12 : 0;
   $6 = $5;
   while (1) {
    $3 = $0 >>> 0 < $9 >>> 0 ? $0 : $9;
    $10 = $5 - $6 | 0;
    $2 = 0;
    $4 = 0.0;
    while (1) {
     $4 = $4 + HEAPF64[($2 << 3) + 10368 >> 3] * HEAPF64[($2 + $6 << 3) + $7 >> 3];
     $13 = ($2 | 0) != ($3 | 0);
     $2 = $2 + 1 | 0;
     if ($13) {
      continue
     }
     break;
    };
    HEAPF64[($7 + 160 | 0) + ($10 << 3) >> 3] = $4;
    $6 = $6 + -1 | 0;
    $2 = ($5 | 0) != ($9 | 0);
    $9 = $9 + 1 | 0;
    if ($2) {
     continue
    }
    break;
   };
  }
  $4 = 0.0;
  if (($5 | 0) >= 0) {
   $2 = $5;
   while (1) {
    $4 = $4 + HEAPF64[($7 + 160 | 0) + ($2 << 3) >> 3];
    $0 = ($2 | 0) > 0;
    $2 = $2 + -1 | 0;
    if ($0) {
     continue
    }
    break;
   };
  }
  HEAPF64[$1 >> 3] = $8 ? -$4 : $4;
  $4 = HEAPF64[$7 + 160 >> 3] - $4;
  $2 = 1;
  if (($5 | 0) >= 1) {
   while (1) {
    $4 = $4 + HEAPF64[($7 + 160 | 0) + ($2 << 3) >> 3];
    $0 = ($2 | 0) != ($5 | 0);
    $2 = $2 + 1 | 0;
    if ($0) {
     continue
    }
    break;
   }
  }
  HEAPF64[$1 + 8 >> 3] = $8 ? -$4 : $4;
  global$0 = $7 + 560 | 0;
  return $11 & 7;
 }
 
 function __rem_pio2($0, $1) {
  var $2 = 0.0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0.0, $8 = 0, $9 = 0.0, $10 = 0, $11 = 0;
  $5 = global$0 - 48 | 0;
  global$0 = $5;
  wasm2js_scratch_store_f64(+$0);
  $3 = wasm2js_scratch_load_i32(1) | 0;
  $8 = wasm2js_scratch_load_i32(0) | 0;
  label$1 : {
   label$2 : {
    $4 = $3;
    $3 = $4;
    $6 = $4 & 2147483647;
    label$3 : {
     if ($6 >>> 0 <= 1074752122) {
      if (($3 & 1048575) == 598523) {
       break label$3
      }
      if ($6 >>> 0 <= 1073928572) {
       if (($4 | 0) > 0 ? 1 : ($4 | 0) >= 0 ? ($8 >>> 0 < 0 ? 0 : 1) : 0) {
        $0 = $0 + -1.5707963267341256;
        $2 = $0 + -6.077100506506192e-11;
        HEAPF64[$1 >> 3] = $2;
        HEAPF64[$1 + 8 >> 3] = $0 - $2 + -6.077100506506192e-11;
        $3 = 1;
        break label$1;
       }
       $0 = $0 + 1.5707963267341256;
       $2 = $0 + 6.077100506506192e-11;
       HEAPF64[$1 >> 3] = $2;
       HEAPF64[$1 + 8 >> 3] = $0 - $2 + 6.077100506506192e-11;
       $3 = -1;
       break label$1;
      }
      if (($4 | 0) > 0 ? 1 : ($4 | 0) >= 0 ? ($8 >>> 0 < 0 ? 0 : 1) : 0) {
       $0 = $0 + -3.1415926534682512;
       $2 = $0 + -1.2154201013012384e-10;
       HEAPF64[$1 >> 3] = $2;
       HEAPF64[$1 + 8 >> 3] = $0 - $2 + -1.2154201013012384e-10;
       $3 = 2;
       break label$1;
      }
      $0 = $0 + 3.1415926534682512;
      $2 = $0 + 1.2154201013012384e-10;
      HEAPF64[$1 >> 3] = $2;
      HEAPF64[$1 + 8 >> 3] = $0 - $2 + 1.2154201013012384e-10;
      $3 = -2;
      break label$1;
     }
     if ($6 >>> 0 <= 1075594811) {
      if ($6 >>> 0 <= 1075183036) {
       if (($6 | 0) == 1074977148) {
        break label$3
       }
       if (($4 | 0) > 0 ? 1 : ($4 | 0) >= 0 ? ($8 >>> 0 < 0 ? 0 : 1) : 0) {
        $0 = $0 + -4.712388980202377;
        $2 = $0 + -1.8231301519518578e-10;
        HEAPF64[$1 >> 3] = $2;
        HEAPF64[$1 + 8 >> 3] = $0 - $2 + -1.8231301519518578e-10;
        $3 = 3;
        break label$1;
       }
       $0 = $0 + 4.712388980202377;
       $2 = $0 + 1.8231301519518578e-10;
       HEAPF64[$1 >> 3] = $2;
       HEAPF64[$1 + 8 >> 3] = $0 - $2 + 1.8231301519518578e-10;
       $3 = -3;
       break label$1;
      }
      if (($6 | 0) == 1075388923) {
       break label$3
      }
      if (($4 | 0) > 0 ? 1 : ($4 | 0) >= 0 ? ($8 >>> 0 < 0 ? 0 : 1) : 0) {
       $0 = $0 + -6.2831853069365025;
       $2 = $0 + -2.430840202602477e-10;
       HEAPF64[$1 >> 3] = $2;
       HEAPF64[$1 + 8 >> 3] = $0 - $2 + -2.430840202602477e-10;
       $3 = 4;
       break label$1;
      }
      $0 = $0 + 6.2831853069365025;
      $2 = $0 + 2.430840202602477e-10;
      HEAPF64[$1 >> 3] = $2;
      HEAPF64[$1 + 8 >> 3] = $0 - $2 + 2.430840202602477e-10;
      $3 = -4;
      break label$1;
     }
     if ($6 >>> 0 > 1094263290) {
      break label$2
     }
    }
    $9 = $0 * .6366197723675814 + 6755399441055744.0 + -6755399441055744.0;
    $2 = $0 + $9 * -1.5707963267341256;
    $7 = $9 * 6.077100506506192e-11;
    $0 = $2 - $7;
    HEAPF64[$1 >> 3] = $0;
    wasm2js_scratch_store_f64(+$0);
    $3 = wasm2js_scratch_load_i32(1) | 0;
    wasm2js_scratch_load_i32(0) | 0;
    $4 = $6 >>> 20 | 0;
    $8 = ($4 - ($3 >>> 20 & 2047) | 0) < 17;
    if (Math_abs($9) < 2147483648.0) {
     $3 = ~~$9
    } else {
     $3 = -2147483648
    }
    label$14 : {
     if ($8) {
      break label$14
     }
     $7 = $2;
     $0 = $9 * 6.077100506303966e-11;
     $2 = $2 - $0;
     $7 = $9 * 2.0222662487959506e-21 - ($7 - $2 - $0);
     $0 = $2 - $7;
     HEAPF64[$1 >> 3] = $0;
     $10 = $4;
     wasm2js_scratch_store_f64(+$0);
     $4 = wasm2js_scratch_load_i32(1) | 0;
     wasm2js_scratch_load_i32(0) | 0;
     if (($10 - ($4 >>> 20 & 2047) | 0) < 50) {
      break label$14
     }
     $7 = $2;
     $0 = $9 * 2.0222662487111665e-21;
     $2 = $2 - $0;
     $7 = $9 * 8.4784276603689e-32 - ($7 - $2 - $0);
     $0 = $2 - $7;
     HEAPF64[$1 >> 3] = $0;
    }
    HEAPF64[$1 + 8 >> 3] = $2 - $0 - $7;
    break label$1;
   }
   if ($6 >>> 0 >= 2146435072) {
    $0 = $0 - $0;
    HEAPF64[$1 >> 3] = $0;
    HEAPF64[$1 + 8 >> 3] = $0;
    $3 = 0;
    break label$1;
   }
   wasm2js_scratch_store_i32(0, $8 | 0);
   wasm2js_scratch_store_i32(1, $4 & 1048575 | 1096810496);
   $0 = +wasm2js_scratch_load_f64();
   $3 = 0;
   $10 = 1;
   while (1) {
    $11 = ($5 + 16 | 0) + ($3 << 3) | 0;
    if (Math_abs($0) < 2147483648.0) {
     $3 = ~~$0
    } else {
     $3 = -2147483648
    }
    $2 = +($3 | 0);
    HEAPF64[$11 >> 3] = $2;
    $0 = ($0 - $2) * 16777216.0;
    $3 = 1;
    $11 = $10 & 1;
    $10 = 0;
    if ($11) {
     continue
    }
    break;
   };
   HEAPF64[$5 + 32 >> 3] = $0;
   label$20 : {
    if ($0 != 0.0) {
     $3 = 2;
     break label$20;
    }
    $10 = 1;
    while (1) {
     $3 = $10;
     $10 = $3 + -1 | 0;
     if (HEAPF64[($5 + 16 | 0) + ($3 << 3) >> 3] == 0.0) {
      continue
     }
     break;
    };
   }
   $3 = __rem_pio2_large($5 + 16 | 0, $5, ($6 >>> 20 | 0) + -1046 | 0, $3 + 1 | 0);
   $0 = HEAPF64[$5 >> 3];
   if (($4 | 0) < -1 ? 1 : ($4 | 0) <= -1 ? ($8 >>> 0 > 4294967295 ? 0 : 1) : 0) {
    HEAPF64[$1 >> 3] = -$0;
    HEAPF64[$1 + 8 >> 3] = -HEAPF64[$5 + 8 >> 3];
    $3 = 0 - $3 | 0;
    break label$1;
   }
   HEAPF64[$1 >> 3] = $0;
   $4 = HEAP32[$5 + 12 >> 2];
   HEAP32[$1 + 8 >> 2] = HEAP32[$5 + 8 >> 2];
   HEAP32[$1 + 12 >> 2] = $4;
  }
  global$0 = $5 + 48 | 0;
  return $3;
 }
 
 function __sin($0, $1) {
  var $2 = 0.0, $3 = 0.0;
  $2 = $0 * $0;
  $3 = $0;
  $0 = $2 * $0;
  return $3 - ($2 * ($1 * .5 - $0 * ($2 * ($2 * $2) * ($2 * 1.58969099521155e-10 + -2.5050760253406863e-08) + ($2 * ($2 * 2.7557313707070068e-06 + -1.984126982985795e-04) + .00833333333332249))) - $1 + $0 * .16666666666666632);
 }
 
 function cos($0) {
  var $1 = 0, $2 = 0.0, $3 = 0;
  $1 = global$0 - 16 | 0;
  global$0 = $1;
  wasm2js_scratch_store_f64(+$0);
  $3 = wasm2js_scratch_load_i32(1) | 0;
  wasm2js_scratch_load_i32(0) | 0;
  $3 = $3 & 2147483647;
  label$1 : {
   if ($3 >>> 0 <= 1072243195) {
    $2 = 1.0;
    if ($3 >>> 0 < 1044816030) {
     break label$1
    }
    $2 = __cos($0, 0.0);
    break label$1;
   }
   $2 = $0 - $0;
   if ($3 >>> 0 >= 2146435072) {
    break label$1
   }
   label$3 : {
    switch (__rem_pio2($0, $1) & 3) {
    case 0:
     $2 = __cos(HEAPF64[$1 >> 3], HEAPF64[$1 + 8 >> 3]);
     break label$1;
    case 1:
     $2 = -__sin(HEAPF64[$1 >> 3], HEAPF64[$1 + 8 >> 3]);
     break label$1;
    case 2:
     $2 = -__cos(HEAPF64[$1 >> 3], HEAPF64[$1 + 8 >> 3]);
     break label$1;
    default:
     break label$3;
    };
   }
   $2 = __sin(HEAPF64[$1 >> 3], HEAPF64[$1 + 8 >> 3]);
  }
  $0 = $2;
  global$0 = $1 + 16 | 0;
  return $0;
 }
 
 function exp($0) {
  var $1 = 0, $2 = 0.0, $3 = 0, $4 = 0.0, $5 = 0, $6 = 0.0, $7 = 0;
  wasm2js_scratch_store_f64(+$0);
  $3 = wasm2js_scratch_load_i32(1) | 0;
  $7 = wasm2js_scratch_load_i32(0) | 0;
  $5 = $3 >>> 31 | 0;
  label$1 : {
   label$2 : {
    label$3 : {
     label$4 : {
      $6 = $0;
      label$5 : {
       label$6 : {
        $1 = $3;
        $3 = $1 & 2147483647;
        label$7 : {
         if ($3 >>> 0 >= 1082532651) {
          $1 = $1 & 2147483647;
          if (($1 | 0) == 2146435072 & $7 >>> 0 > 0 | $1 >>> 0 > 2146435072) {
           return $0
          }
          if (!!($0 > 709.782712893384)) {
           return $0 * 8988465674311579538646525.0e283
          }
          if (!($0 < -708.3964185322641)) {
           break label$7
          }
          if (!($0 < -745.1332191019411)) {
           break label$7
          }
          break label$2;
         }
         if ($3 >>> 0 < 1071001155) {
          break label$4
         }
         if ($3 >>> 0 < 1072734898) {
          break label$6
         }
        }
        $0 = $0 * 1.4426950408889634 + HEAPF64[($5 << 3) + 10432 >> 3];
        if (Math_abs($0) < 2147483648.0) {
         $1 = ~~$0;
         break label$5;
        }
        $1 = -2147483648;
        break label$5;
       }
       $1 = ($5 ^ 1) - $5 | 0;
      }
      $2 = +($1 | 0);
      $0 = $6 + $2 * -.6931471803691238;
      $4 = $2 * 1.9082149292705877e-10;
      $2 = $0 - $4;
      break label$3;
     }
     if ($3 >>> 0 <= 1043333120) {
      break label$1
     }
     $1 = 0;
     $2 = $0;
    }
    $6 = $0;
    $0 = $2 * $2;
    $0 = $2 - $0 * ($0 * ($0 * ($0 * ($0 * 4.1381367970572385e-08 + -1.6533902205465252e-06) + 6.613756321437934e-05) + -2.7777777777015593e-03) + .16666666666666602);
    $4 = $6 + ($2 * $0 / (2.0 - $0) - $4) + 1.0;
    if (!$1) {
     break label$2
    }
    $4 = scalbn($4, $1);
   }
   return $4;
  }
  return $0 + 1.0;
 }
 
 function FLAC__window_bartlett($0, $1) {
  var $2 = 0, $3 = Math_fround(0), $4 = 0, $5 = Math_fround(0), $6 = 0, $7 = 0, $8 = 0;
  $7 = $1 + -1 | 0;
  label$1 : {
   if ($1 & 1) {
    $4 = ($7 | 0) / 2 | 0;
    if (($1 | 0) >= 0) {
     $8 = ($4 | 0) > 0 ? $4 : 0;
     $6 = $8 + 1 | 0;
     $5 = Math_fround($7 | 0);
     while (1) {
      $3 = Math_fround($2 | 0);
      HEAPF32[($2 << 2) + $0 >> 2] = Math_fround($3 + $3) / $5;
      $4 = ($2 | 0) == ($8 | 0);
      $2 = $2 + 1 | 0;
      if (!$4) {
       continue
      }
      break;
     };
    }
    if (($6 | 0) >= ($1 | 0)) {
     break label$1
    }
    $5 = Math_fround($7 | 0);
    while (1) {
     $3 = Math_fround($6 | 0);
     HEAPF32[($6 << 2) + $0 >> 2] = Math_fround(2.0) - Math_fround(Math_fround($3 + $3) / $5);
     $6 = $6 + 1 | 0;
     if (($6 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   $4 = ($1 | 0) / 2 | 0;
   if (($1 | 0) >= 2) {
    $5 = Math_fround($7 | 0);
    while (1) {
     $3 = Math_fround($2 | 0);
     HEAPF32[($2 << 2) + $0 >> 2] = Math_fround($3 + $3) / $5;
     $2 = $2 + 1 | 0;
     if (($4 | 0) != ($2 | 0)) {
      continue
     }
     break;
    };
    $2 = $4;
   }
   if (($2 | 0) >= ($1 | 0)) {
    break label$1
   }
   $5 = Math_fround($7 | 0);
   while (1) {
    $3 = Math_fround($2 | 0);
    HEAPF32[($2 << 2) + $0 >> 2] = Math_fround(2.0) - Math_fround(Math_fround($3 + $3) / $5);
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__window_bartlett_hann($0, $1) {
  var $2 = 0, $3 = Math_fround(0), $4 = Math_fround(0), wasm2js_i32$0 = 0, wasm2js_f32$0 = Math_fround(0);
  if (($1 | 0) >= 1) {
   $4 = Math_fround($1 + -1 | 0);
   while (1) {
    $3 = Math_fround(Math_fround($2 | 0) / $4);
    (wasm2js_i32$0 = ($2 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(+Math_fround(Math_abs(Math_fround($3 + Math_fround(-.5)))) * -.47999998927116394 + .6200000047683716 + cos(+$3 * 6.283185307179586) * -.3799999952316284)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__window_blackman($0, $1) {
  var $2 = 0, $3 = 0.0, $4 = 0.0, wasm2js_i32$0 = 0, wasm2js_f32$0 = Math_fround(0);
  if (($1 | 0) >= 1) {
   $3 = +($1 + -1 | 0);
   while (1) {
    $4 = +($2 | 0);
    (wasm2js_i32$0 = ($2 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(cos($4 * 12.566370614359172 / $3) * .07999999821186066 + (cos($4 * 6.283185307179586 / $3) * -.5 + .41999998688697815))), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__window_blackman_harris_4term_92db_sidelobe($0, $1) {
  var $2 = 0, $3 = 0.0, $4 = 0.0, wasm2js_i32$0 = 0, wasm2js_f32$0 = Math_fround(0);
  if (($1 | 0) >= 1) {
   $3 = +($1 + -1 | 0);
   while (1) {
    $4 = +($2 | 0);
    (wasm2js_i32$0 = ($2 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(cos($4 * 12.566370614359172 / $3) * .14127999544143677 + (cos($4 * 6.283185307179586 / $3) * -.488290011882782 + .35874998569488525) + cos($4 * 18.84955592153876 / $3) * -.011680000461637974)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__window_connes($0, $1) {
  var $2 = 0.0, $3 = 0, $4 = 0.0;
  if (($1 | 0) >= 1) {
   $4 = +($1 + -1 | 0) * .5;
   while (1) {
    $2 = (+($3 | 0) - $4) / $4;
    $2 = 1.0 - $2 * $2;
    HEAPF32[($3 << 2) + $0 >> 2] = $2 * $2;
    $3 = $3 + 1 | 0;
    if (($3 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__window_flattop($0, $1) {
  var $2 = 0.0, $3 = 0, $4 = 0.0, $5 = 0.0, $6 = 0.0, $7 = 0.0, wasm2js_i32$0 = 0, wasm2js_f32$0 = Math_fround(0);
  if (($1 | 0) >= 1) {
   $2 = +($1 + -1 | 0);
   while (1) {
    $4 = +($3 | 0);
    $5 = cos($4 * 12.566370614359172 / $2);
    $6 = cos($4 * 6.283185307179586 / $2);
    $7 = cos($4 * 18.84955592153876 / $2);
    (wasm2js_i32$0 = ($3 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(cos($4 * 25.132741228718345 / $2) * 6.9473679177463055e-03 + ($5 * .27726316452026367 + ($6 * -.4166315793991089 + .21557894349098206) + $7 * -.08357894420623779))), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $3 = $3 + 1 | 0;
    if (($3 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__window_gauss($0, $1, $2) {
  var $3 = 0, $4 = 0.0, $5 = 0.0, $6 = 0.0, wasm2js_i32$0 = 0, wasm2js_f32$0 = Math_fround(0);
  if (($1 | 0) >= 1) {
   $4 = +($1 + -1 | 0) * .5;
   $6 = $4 * +$2;
   while (1) {
    $5 = (+($3 | 0) - $4) / $6;
    (wasm2js_i32$0 = ($3 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(exp($5 * ($5 * -.5)))), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $3 = $3 + 1 | 0;
    if (($3 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__window_hamming($0, $1) {
  var $2 = 0, $3 = 0.0, wasm2js_i32$0 = 0, wasm2js_f32$0 = Math_fround(0);
  if (($1 | 0) >= 1) {
   $3 = +($1 + -1 | 0);
   while (1) {
    (wasm2js_i32$0 = ($2 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(cos(+($2 | 0) * 6.283185307179586 / $3) * -.46000000834465027 + .5400000214576721)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__window_hann($0, $1) {
  var $2 = 0, $3 = 0.0, wasm2js_i32$0 = 0, wasm2js_f32$0 = Math_fround(0);
  if (($1 | 0) >= 1) {
   $3 = +($1 + -1 | 0);
   while (1) {
    (wasm2js_i32$0 = ($2 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(.5 - cos(+($2 | 0) * 6.283185307179586 / $3) * .5)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__window_kaiser_bessel($0, $1) {
  var $2 = 0, $3 = 0.0, $4 = 0.0, wasm2js_i32$0 = 0, wasm2js_f32$0 = Math_fround(0);
  if (($1 | 0) >= 1) {
   $3 = +($1 + -1 | 0);
   while (1) {
    $4 = +($2 | 0);
    (wasm2js_i32$0 = ($2 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(cos($4 * 12.566370614359172 / $3) * .09799999743700027 + (cos($4 * 6.283185307179586 / $3) * -.49799999594688416 + .4020000100135803) + cos($4 * 18.84955592153876 / $3) * -1.0000000474974513e-03)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__window_nuttall($0, $1) {
  var $2 = 0, $3 = 0.0, $4 = 0.0, wasm2js_i32$0 = 0, wasm2js_f32$0 = Math_fround(0);
  if (($1 | 0) >= 1) {
   $3 = +($1 + -1 | 0);
   while (1) {
    $4 = +($2 | 0);
    (wasm2js_i32$0 = ($2 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(cos($4 * 12.566370614359172 / $3) * .13659949600696564 + (cos($4 * 6.283185307179586 / $3) * -.48917749524116516 + .36358189582824707) + cos($4 * 18.84955592153876 / $3) * -.010641099885106087)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__window_rectangle($0, $1) {
  var $2 = 0;
  if (($1 | 0) >= 1) {
   while (1) {
    HEAP32[($2 << 2) + $0 >> 2] = 1065353216;
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   }
  }
 }
 
 function FLAC__window_triangle($0, $1) {
  var $2 = 0, $3 = 0, $4 = Math_fround(0), $5 = 0, $6 = Math_fround(0), $7 = 0;
  $3 = 1;
  label$1 : {
   if ($1 & 1) {
    $2 = ($1 + 1 | 0) / 2 | 0;
    if (($1 | 0) >= 1) {
     $4 = Math_fround(Math_fround($1 | 0) + Math_fround(1.0));
     $5 = ($2 | 0) > 1 ? $2 : 1;
     $3 = $5 + 1 | 0;
     $2 = 1;
     while (1) {
      $6 = Math_fround($2 | 0);
      HEAPF32[(($2 << 2) + $0 | 0) + -4 >> 2] = Math_fround($6 + $6) / $4;
      $7 = ($2 | 0) == ($5 | 0);
      $2 = $2 + 1 | 0;
      if (!$7) {
       continue
      }
      break;
     };
    }
    if (($3 | 0) > ($1 | 0)) {
     break label$1
    }
    $4 = Math_fround(Math_fround($1 | 0) + Math_fround(1.0));
    while (1) {
     HEAPF32[(($3 << 2) + $0 | 0) + -4 >> 2] = Math_fround(($1 - $3 << 1) + 2 | 0) / $4;
     $2 = ($1 | 0) == ($3 | 0);
     $3 = $3 + 1 | 0;
     if (!$2) {
      continue
     }
     break;
    };
    break label$1;
   }
   $2 = 1;
   if (($1 | 0) >= 2) {
    $5 = $1 >>> 1 | 0;
    $2 = $5 + 1 | 0;
    $4 = Math_fround(Math_fround($1 | 0) + Math_fround(1.0));
    while (1) {
     $6 = Math_fround($3 | 0);
     HEAPF32[(($3 << 2) + $0 | 0) + -4 >> 2] = Math_fround($6 + $6) / $4;
     $7 = ($3 | 0) == ($5 | 0);
     $3 = $3 + 1 | 0;
     if (!$7) {
      continue
     }
     break;
    };
   }
   if (($2 | 0) > ($1 | 0)) {
    break label$1
   }
   $4 = Math_fround(Math_fround($1 | 0) + Math_fround(1.0));
   while (1) {
    HEAPF32[(($2 << 2) + $0 | 0) + -4 >> 2] = Math_fround(($1 - $2 << 1) + 2 | 0) / $4;
    $3 = ($1 | 0) != ($2 | 0);
    $2 = $2 + 1 | 0;
    if ($3) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__window_tukey($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0.0, $6 = 0, wasm2js_i32$0 = 0, wasm2js_f32$0 = Math_fround(0);
  label$1 : {
   if (!!($2 <= Math_fround(0.0))) {
    if (($1 | 0) < 1) {
     break label$1
    }
    while (1) {
     HEAP32[($3 << 2) + $0 >> 2] = 1065353216;
     $3 = $3 + 1 | 0;
     if (($3 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   if (!!($2 >= Math_fround(1.0))) {
    if (($1 | 0) < 1) {
     break label$1
    }
    $5 = +($1 + -1 | 0);
    while (1) {
     (wasm2js_i32$0 = ($3 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(.5 - cos(+($3 | 0) * 6.283185307179586 / $5) * .5)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
     $3 = $3 + 1 | 0;
     if (($3 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   $2 = Math_fround(Math_fround($2 * Math_fround(.5)) * Math_fround($1 | 0));
   label$6 : {
    if (Math_fround(Math_abs($2)) < Math_fround(2147483648.0)) {
     $4 = ~~$2;
     break label$6;
    }
    $4 = -2147483648;
   }
   if (($1 | 0) >= 1) {
    while (1) {
     HEAP32[($3 << 2) + $0 >> 2] = 1065353216;
     $3 = $3 + 1 | 0;
     if (($3 | 0) != ($1 | 0)) {
      continue
     }
     break;
    }
   }
   if (($4 | 0) < 2) {
    break label$1
   }
   $1 = $1 - $4 | 0;
   $6 = $4 + -1 | 0;
   $5 = +($6 | 0);
   $3 = 0;
   while (1) {
    (wasm2js_i32$0 = ($3 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(.5 - cos(+($3 | 0) * 3.141592653589793 / $5) * .5)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    (wasm2js_i32$0 = ($1 + $3 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(.5 - cos(+($3 + $6 | 0) * 3.141592653589793 / $5) * .5)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $3 = $3 + 1 | 0;
    if (($4 | 0) != ($3 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__window_partial_tukey($0, $1, $2, $3, $4) {
  var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = Math_fround(0), $12 = 0.0, $13 = 0, wasm2js_i32$0 = 0, wasm2js_f32$0 = Math_fround(0);
  while (1) {
   $11 = $2;
   $2 = Math_fround(.05000000074505806);
   if ($11 <= Math_fround(0.0)) {
    continue
   }
   $2 = Math_fround(.949999988079071);
   if ($11 >= Math_fround(1.0)) {
    continue
   }
   break;
  };
  $2 = Math_fround($1 | 0);
  $3 = Math_fround($2 * $3);
  label$2 : {
   if (Math_fround(Math_abs($3)) < Math_fround(2147483648.0)) {
    $6 = ~~$3;
    break label$2;
   }
   $6 = -2147483648;
  }
  $3 = Math_fround($11 * Math_fround(.5));
  $2 = Math_fround($2 * $4);
  label$5 : {
   if (Math_fround(Math_abs($2)) < Math_fround(2147483648.0)) {
    $10 = ~~$2;
    break label$5;
   }
   $10 = -2147483648;
  }
  $2 = Math_fround($3 * Math_fround($10 - $6 | 0));
  label$4 : {
   if (Math_fround(Math_abs($2)) < Math_fround(2147483648.0)) {
    $7 = ~~$2;
    break label$4;
   }
   $7 = -2147483648;
  }
  if (!(($6 | 0) < 1 | ($1 | 0) < 1)) {
   $5 = $6 + -1 | 0;
   $8 = $1 + -1 | 0;
   $8 = $5 >>> 0 < $8 >>> 0 ? $5 : $8;
   memset($0, ($8 << 2) + 4 | 0);
   $5 = $8 + 1 | 0;
   while (1) {
    $13 = ($9 | 0) == ($8 | 0);
    $9 = $9 + 1 | 0;
    if (!$13) {
     continue
    }
    break;
   };
  }
  $6 = $6 + $7 | 0;
  label$10 : {
   if (($5 | 0) >= ($6 | 0) | ($5 | 0) >= ($1 | 0)) {
    break label$10
   }
   $12 = +($7 | 0);
   $9 = 1;
   while (1) {
    (wasm2js_i32$0 = ($5 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(.5 - cos(+($9 | 0) * 3.141592653589793 / $12) * .5)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $5 = $5 + 1 | 0;
    if (($5 | 0) >= ($6 | 0)) {
     break label$10
    }
    $9 = $9 + 1 | 0;
    if (($5 | 0) < ($1 | 0)) {
     continue
    }
    break;
   };
  }
  $6 = $10 - $7 | 0;
  label$12 : {
   if (($5 | 0) >= ($6 | 0) | ($5 | 0) >= ($1 | 0)) {
    break label$12
   }
   while (1) {
    HEAP32[($5 << 2) + $0 >> 2] = 1065353216;
    $5 = $5 + 1 | 0;
    if (($5 | 0) >= ($6 | 0)) {
     break label$12
    }
    if (($5 | 0) < ($1 | 0)) {
     continue
    }
    break;
   };
  }
  label$14 : {
   if (($5 | 0) >= ($10 | 0) | ($5 | 0) >= ($1 | 0)) {
    break label$14
   }
   $12 = +($7 | 0);
   while (1) {
    (wasm2js_i32$0 = ($5 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(.5 - cos(+($7 | 0) * 3.141592653589793 / $12) * .5)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $5 = $5 + 1 | 0;
    if (($5 | 0) >= ($10 | 0)) {
     break label$14
    }
    $7 = $7 + -1 | 0;
    if (($5 | 0) < ($1 | 0)) {
     continue
    }
    break;
   };
  }
  if (($5 | 0) < ($1 | 0)) {
   memset(($5 << 2) + $0 | 0, $1 - $5 << 2)
  }
 }
 
 function FLAC__window_punchout_tukey($0, $1, $2, $3, $4) {
  var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0.0, $12 = Math_fround(0), $13 = 0, $14 = Math_fround(0), wasm2js_i32$0 = 0, wasm2js_f32$0 = Math_fround(0);
  while (1) {
   $12 = $2;
   $2 = Math_fround(.05000000074505806);
   if ($12 <= Math_fround(0.0)) {
    continue
   }
   $2 = Math_fround(.949999988079071);
   if ($12 >= Math_fround(1.0)) {
    continue
   }
   break;
  };
  $2 = Math_fround($12 * Math_fround(.5));
  $14 = $2;
  $12 = Math_fround($1 | 0);
  $3 = Math_fround($12 * $3);
  label$3 : {
   if (Math_fround(Math_abs($3)) < Math_fround(2147483648.0)) {
    $10 = ~~$3;
    break label$3;
   }
   $10 = -2147483648;
  }
  $3 = Math_fround($14 * Math_fround($10 | 0));
  label$2 : {
   if (Math_fround(Math_abs($3)) < Math_fround(2147483648.0)) {
    $6 = ~~$3;
    break label$2;
   }
   $6 = -2147483648;
  }
  $8 = ($6 | 0) < 1;
  $7 = $1;
  $3 = Math_fround($12 * $4);
  label$7 : {
   if (Math_fround(Math_abs($3)) < Math_fround(2147483648.0)) {
    $9 = ~~$3;
    break label$7;
   }
   $9 = -2147483648;
  }
  $2 = Math_fround($2 * Math_fround($7 - $9 | 0));
  label$6 : {
   if (Math_fround(Math_abs($2)) < Math_fround(2147483648.0)) {
    $7 = ~~$2;
    break label$6;
   }
   $7 = -2147483648;
  }
  if (!(($1 | 0) < 1 | $8)) {
   $5 = $6 + -1 >>> 0 < $1 + -1 >>> 0 ? $6 : $1;
   $11 = +($6 | 0);
   $8 = 0;
   $13 = 1;
   while (1) {
    (wasm2js_i32$0 = ($8 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(.5 - cos(+($13 | 0) * 3.141592653589793 / $11) * .5)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $13 = $13 + 1 | 0;
    $8 = $8 + 1 | 0;
    if (($8 | 0) != ($5 | 0)) {
     continue
    }
    break;
   };
  }
  $8 = $10 - $6 | 0;
  label$12 : {
   if (($5 | 0) >= ($8 | 0) | ($5 | 0) >= ($1 | 0)) {
    break label$12
   }
   while (1) {
    HEAP32[($5 << 2) + $0 >> 2] = 1065353216;
    $5 = $5 + 1 | 0;
    if (($5 | 0) >= ($8 | 0)) {
     break label$12
    }
    if (($5 | 0) < ($1 | 0)) {
     continue
    }
    break;
   };
  }
  label$14 : {
   if (($5 | 0) >= ($10 | 0) | ($5 | 0) >= ($1 | 0)) {
    break label$14
   }
   $11 = +($6 | 0);
   while (1) {
    (wasm2js_i32$0 = ($5 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(.5 - cos(+($6 | 0) * 3.141592653589793 / $11) * .5)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $5 = $5 + 1 | 0;
    if (($5 | 0) >= ($10 | 0)) {
     break label$14
    }
    $6 = $6 + -1 | 0;
    if (($5 | 0) < ($1 | 0)) {
     continue
    }
    break;
   };
  }
  label$16 : {
   if (($5 | 0) >= ($9 | 0) | ($5 | 0) >= ($1 | 0)) {
    break label$16
   }
   $6 = $5 ^ -1;
   $10 = $6 + $9 | 0;
   $6 = $1 + $6 | 0;
   memset(($5 << 2) + $0 | 0, (($10 >>> 0 < $6 >>> 0 ? $10 : $6) << 2) + 4 | 0);
   while (1) {
    $5 = $5 + 1 | 0;
    if (($5 | 0) >= ($9 | 0)) {
     break label$16
    }
    if (($5 | 0) < ($1 | 0)) {
     continue
    }
    break;
   };
  }
  $9 = $7 + $9 | 0;
  label$18 : {
   if (($5 | 0) >= ($9 | 0) | ($5 | 0) >= ($1 | 0)) {
    break label$18
   }
   $11 = +($7 | 0);
   $6 = 1;
   while (1) {
    (wasm2js_i32$0 = ($5 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(.5 - cos(+($6 | 0) * 3.141592653589793 / $11) * .5)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $5 = $5 + 1 | 0;
    if (($5 | 0) >= ($9 | 0)) {
     break label$18
    }
    $6 = $6 + 1 | 0;
    if (($5 | 0) < ($1 | 0)) {
     continue
    }
    break;
   };
  }
  $6 = $1 - $7 | 0;
  label$20 : {
   if (($5 | 0) >= ($6 | 0) | ($5 | 0) >= ($1 | 0)) {
    break label$20
   }
   while (1) {
    HEAP32[($5 << 2) + $0 >> 2] = 1065353216;
    $5 = $5 + 1 | 0;
    if (($5 | 0) >= ($6 | 0)) {
     break label$20
    }
    if (($5 | 0) < ($1 | 0)) {
     continue
    }
    break;
   };
  }
  if (($5 | 0) < ($1 | 0)) {
   $11 = +($7 | 0);
   while (1) {
    (wasm2js_i32$0 = ($5 << 2) + $0 | 0, wasm2js_f32$0 = Math_fround(.5 - cos(+($7 | 0) * 3.141592653589793 / $11) * .5)), HEAPF32[wasm2js_i32$0 >> 2] = wasm2js_f32$0;
    $7 = $7 + -1 | 0;
    $5 = $5 + 1 | 0;
    if (($5 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__window_welch($0, $1) {
  var $2 = 0, $3 = 0.0, $4 = 0.0;
  if (($1 | 0) >= 1) {
   $3 = +($1 + -1 | 0) * .5;
   while (1) {
    $4 = (+($2 | 0) - $3) / $3;
    HEAPF32[($2 << 2) + $0 >> 2] = 1.0 - $4 * $4;
    $2 = $2 + 1 | 0;
    if (($2 | 0) != ($1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function FLAC__add_metadata_block($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0;
  $3 = strlen(HEAP32[2717]);
  label$1 : {
   if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 4 >> 2], HEAP32[1648])) {
    break label$1
   }
   if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 >> 2], HEAP32[1649])) {
    break label$1
   }
   $2 = HEAP32[$0 + 8 >> 2];
   $2 = HEAP32[$0 >> 2] == 4 ? ($2 + $3 | 0) - HEAP32[$0 + 16 >> 2] | 0 : $2;
   $4 = HEAP32[1650];
   if ($2 >>> $4) {
    break label$1
   }
   if (!FLAC__bitwriter_write_raw_uint32($1, $2, $4)) {
    break label$1
   }
   label$3 : {
    label$4 : {
     label$5 : {
      label$6 : {
       label$7 : {
        label$8 : {
         label$9 : {
          switch (HEAP32[$0 >> 2]) {
          case 3:
           if (!HEAP32[$0 + 16 >> 2]) {
            break label$3
           }
           $4 = HEAP32[1624];
           $6 = HEAP32[1623];
           $7 = HEAP32[1622];
           $2 = 0;
           break label$8;
          case 0:
           if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 16 >> 2], HEAP32[1613])) {
            break label$1
           }
           if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 20 >> 2], HEAP32[1614])) {
            break label$1
           }
           if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 24 >> 2], HEAP32[1615])) {
            break label$1
           }
           if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 28 >> 2], HEAP32[1616])) {
            break label$1
           }
           if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 32 >> 2], HEAP32[1617])) {
            break label$1
           }
           if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 36 >> 2] + -1 | 0, HEAP32[1618])) {
            break label$1
           }
           if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 40 >> 2] + -1 | 0, HEAP32[1619])) {
            break label$1
           }
           if (!FLAC__bitwriter_write_raw_uint64($1, HEAP32[$0 + 48 >> 2], HEAP32[$0 + 52 >> 2], HEAP32[1620])) {
            break label$1
           }
           if (FLAC__bitwriter_write_byte_block($1, $0 + 56 | 0, 16)) {
            break label$3
           }
           break label$1;
          case 1:
           if (FLAC__bitwriter_write_zeroes($1, HEAP32[$0 + 8 >> 2] << 3)) {
            break label$3
           }
           break label$1;
          case 6:
           break label$5;
          case 5:
           break label$6;
          case 4:
           break label$7;
          case 2:
           break label$9;
          default:
           break label$4;
          };
         }
         $2 = HEAP32[1621] >>> 3 | 0;
         if (!FLAC__bitwriter_write_byte_block($1, $0 + 16 | 0, $2)) {
          break label$1
         }
         if (FLAC__bitwriter_write_byte_block($1, HEAP32[$0 + 20 >> 2], HEAP32[$0 + 8 >> 2] - $2 | 0)) {
          break label$3
         }
         break label$1;
        }
        while (1) {
         $3 = Math_imul($2, 24);
         $5 = $3 + HEAP32[$0 + 20 >> 2] | 0;
         if (!FLAC__bitwriter_write_raw_uint64($1, HEAP32[$5 >> 2], HEAP32[$5 + 4 >> 2], $7)) {
          break label$1
         }
         $5 = $3 + HEAP32[$0 + 20 >> 2] | 0;
         if (!FLAC__bitwriter_write_raw_uint64($1, HEAP32[$5 + 8 >> 2], HEAP32[$5 + 12 >> 2], $6)) {
          break label$1
         }
         if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[($3 + HEAP32[$0 + 20 >> 2] | 0) + 16 >> 2], $4)) {
          break label$1
         }
         $2 = $2 + 1 | 0;
         if ($2 >>> 0 < HEAPU32[$0 + 16 >> 2]) {
          continue
         }
         break;
        };
        break label$3;
       }
       if (!FLAC__bitwriter_write_raw_uint32_little_endian($1, $3)) {
        break label$1
       }
       if (!FLAC__bitwriter_write_byte_block($1, HEAP32[2717], $3)) {
        break label$1
       }
       if (!FLAC__bitwriter_write_raw_uint32_little_endian($1, HEAP32[$0 + 24 >> 2])) {
        break label$1
       }
       if (!HEAP32[$0 + 24 >> 2]) {
        break label$3
       }
       $2 = 0;
       while (1) {
        $3 = $2 << 3;
        if (!FLAC__bitwriter_write_raw_uint32_little_endian($1, HEAP32[$3 + HEAP32[$0 + 28 >> 2] >> 2])) {
         break label$1
        }
        $3 = $3 + HEAP32[$0 + 28 >> 2] | 0;
        if (!FLAC__bitwriter_write_byte_block($1, HEAP32[$3 + 4 >> 2], HEAP32[$3 >> 2])) {
         break label$1
        }
        $2 = $2 + 1 | 0;
        if ($2 >>> 0 < HEAPU32[$0 + 24 >> 2]) {
         continue
        }
        break;
       };
       break label$3;
      }
      if (!FLAC__bitwriter_write_byte_block($1, $0 + 16 | 0, HEAP32[1635] >>> 3 | 0)) {
       break label$1
      }
      if (!FLAC__bitwriter_write_raw_uint64($1, HEAP32[$0 + 152 >> 2], HEAP32[$0 + 156 >> 2], HEAP32[1636])) {
       break label$1
      }
      if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 160 >> 2] != 0, HEAP32[1637])) {
       break label$1
      }
      if (!FLAC__bitwriter_write_zeroes($1, HEAP32[1638])) {
       break label$1
      }
      if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 164 >> 2], HEAP32[1639])) {
       break label$1
      }
      if (!HEAP32[$0 + 164 >> 2]) {
       break label$3
      }
      $6 = HEAP32[1630] >>> 3 | 0;
      $7 = HEAP32[1627];
      $5 = HEAP32[1626];
      $9 = HEAP32[1625];
      $10 = HEAP32[1634];
      $11 = HEAP32[1633];
      $12 = HEAP32[1632];
      $13 = HEAP32[1631];
      $14 = HEAP32[1629];
      $15 = HEAP32[1628];
      $3 = 0;
      while (1) {
       $2 = HEAP32[$0 + 168 >> 2] + ($3 << 5) | 0;
       if (!FLAC__bitwriter_write_raw_uint64($1, HEAP32[$2 >> 2], HEAP32[$2 + 4 >> 2], $15)) {
        break label$1
       }
       if (!FLAC__bitwriter_write_raw_uint32($1, HEAPU8[$2 + 8 | 0], $14)) {
        break label$1
       }
       if (!FLAC__bitwriter_write_byte_block($1, $2 + 9 | 0, $6)) {
        break label$1
       }
       if (!FLAC__bitwriter_write_raw_uint32($1, HEAP8[$2 + 22 | 0] & 1, $13)) {
        break label$1
       }
       if (!FLAC__bitwriter_write_raw_uint32($1, HEAPU8[$2 + 22 | 0] >>> 1 & 1, $12)) {
        break label$1
       }
       if (!FLAC__bitwriter_write_zeroes($1, $11)) {
        break label$1
       }
       if (!FLAC__bitwriter_write_raw_uint32($1, HEAPU8[$2 + 23 | 0], $10)) {
        break label$1
       }
       label$16 : {
        $8 = $2 + 23 | 0;
        if (!HEAPU8[$8 | 0]) {
         break label$16
        }
        $16 = $2 + 24 | 0;
        $2 = 0;
        while (1) {
         $4 = HEAP32[$16 >> 2] + ($2 << 4) | 0;
         if (!FLAC__bitwriter_write_raw_uint64($1, HEAP32[$4 >> 2], HEAP32[$4 + 4 >> 2], $9)) {
          return 0
         }
         if (!FLAC__bitwriter_write_raw_uint32($1, HEAPU8[$4 + 8 | 0], $5)) {
          return 0
         }
         if (FLAC__bitwriter_write_zeroes($1, $7)) {
          $2 = $2 + 1 | 0;
          if ($2 >>> 0 >= HEAPU8[$8 | 0]) {
           break label$16
          }
          continue;
         }
         break;
        };
        return 0;
       }
       $3 = $3 + 1 | 0;
       if ($3 >>> 0 < HEAPU32[$0 + 164 >> 2]) {
        continue
       }
       break;
      };
      break label$3;
     }
     if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 16 >> 2], HEAP32[1640])) {
      break label$1
     }
     $2 = strlen(HEAP32[$0 + 20 >> 2]);
     if (!FLAC__bitwriter_write_raw_uint32($1, $2, HEAP32[1641])) {
      break label$1
     }
     if (!FLAC__bitwriter_write_byte_block($1, HEAP32[$0 + 20 >> 2], $2)) {
      break label$1
     }
     $2 = strlen(HEAP32[$0 + 24 >> 2]);
     if (!FLAC__bitwriter_write_raw_uint32($1, $2, HEAP32[1642])) {
      break label$1
     }
     if (!FLAC__bitwriter_write_byte_block($1, HEAP32[$0 + 24 >> 2], $2)) {
      break label$1
     }
     if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 28 >> 2], HEAP32[1643])) {
      break label$1
     }
     if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 32 >> 2], HEAP32[1644])) {
      break label$1
     }
     if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 36 >> 2], HEAP32[1645])) {
      break label$1
     }
     if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 40 >> 2], HEAP32[1646])) {
      break label$1
     }
     if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 44 >> 2], HEAP32[1647])) {
      break label$1
     }
     if (FLAC__bitwriter_write_byte_block($1, HEAP32[$0 + 48 >> 2], HEAP32[$0 + 44 >> 2])) {
      break label$3
     }
     break label$1;
    }
    if (!FLAC__bitwriter_write_byte_block($1, HEAP32[$0 + 16 >> 2], HEAP32[$0 + 8 >> 2])) {
     break label$1
    }
   }
   $17 = 1;
  }
  return $17;
 }
 
 function FLAC__frame_add_header($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
  $5 = global$0 - 16 | 0;
  global$0 = $5;
  label$1 : {
   if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[1651], HEAP32[1652])) {
    break label$1
   }
   if (!FLAC__bitwriter_write_raw_uint32($1, 0, HEAP32[1653])) {
    break label$1
   }
   if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 20 >> 2] != 0, HEAP32[1654])) {
    break label$1
   }
   $7 = 16;
   $3 = $1;
   label$3 : {
    label$4 : {
     label$5 : {
      label$6 : {
       label$7 : {
        label$8 : {
         label$9 : {
          label$10 : {
           label$11 : {
            $2 = HEAP32[$0 >> 2];
            if (($2 | 0) <= 2047) {
             if (($2 | 0) <= 575) {
              $4 = 1;
              if (($2 | 0) == 192) {
               break label$3
              }
              if (($2 | 0) == 256) {
               break label$8
              }
              if (($2 | 0) != 512) {
               break label$4
              }
              $4 = 9;
              break label$3;
             }
             if (($2 | 0) == 576) {
              break label$11
             }
             if (($2 | 0) == 1024) {
              break label$7
             }
             if (($2 | 0) != 1152) {
              break label$4
             }
             $4 = 3;
             break label$3;
            }
            if (($2 | 0) <= 4607) {
             if (($2 | 0) == 2048) {
              break label$6
             }
             if (($2 | 0) == 2304) {
              break label$10
             }
             if (($2 | 0) != 4096) {
              break label$4
             }
             $4 = 12;
             break label$3;
            }
            if (($2 | 0) <= 16383) {
             if (($2 | 0) == 4608) {
              break label$9
             }
             if (($2 | 0) != 8192) {
              break label$4
             }
             $4 = 13;
             break label$3;
            }
            if (($2 | 0) == 16384) {
             break label$5
            }
            if (($2 | 0) != 32768) {
             break label$4
            }
            $4 = 15;
            break label$3;
           }
           $4 = 2;
           break label$3;
          }
          $4 = 4;
          break label$3;
         }
         $4 = 5;
         break label$3;
        }
        $4 = 8;
        break label$3;
       }
       $4 = 10;
       break label$3;
      }
      $4 = 11;
      break label$3;
     }
     $4 = 14;
     break label$3;
    }
    $2 = $2 >>> 0 < 257;
    $7 = $2 ? 8 : 16;
    $8 = 1;
    $4 = $2 ? 6 : 7;
   }
   if (!FLAC__bitwriter_write_raw_uint32($3, $4, HEAP32[1655])) {
    $2 = 0;
    break label$1;
   }
   label$17 : {
    label$18 : {
     label$19 : {
      label$20 : {
       label$21 : {
        label$22 : {
         label$23 : {
          label$24 : {
           $2 = HEAP32[$0 + 4 >> 2];
           if (($2 | 0) <= 44099) {
            if (($2 | 0) <= 22049) {
             if (($2 | 0) == 8e3) {
              break label$24
             }
             if (($2 | 0) != 16e3) {
              break label$18
             }
             $3 = 5;
             break label$17;
            }
            if (($2 | 0) == 22050) {
             break label$23
            }
            if (($2 | 0) == 24e3) {
             break label$22
            }
            if (($2 | 0) != 32e3) {
             break label$18
            }
            $3 = 8;
            break label$17;
           }
           if (($2 | 0) <= 95999) {
            if (($2 | 0) == 44100) {
             break label$21
            }
            if (($2 | 0) == 48e3) {
             break label$20
            }
            $3 = 1;
            if (($2 | 0) == 88200) {
             break label$17
            }
            break label$18;
           }
           if (($2 | 0) == 96e3) {
            break label$19
           }
           if (($2 | 0) != 192e3) {
            if (($2 | 0) != 176400) {
             break label$18
            }
            $3 = 2;
            break label$17;
           }
           $3 = 3;
           break label$17;
          }
          $3 = 4;
          break label$17;
         }
         $3 = 6;
         break label$17;
        }
        $3 = 7;
        break label$17;
       }
       $3 = 9;
       break label$17;
      }
      $3 = 10;
      break label$17;
     }
     $3 = 11;
     break label$17;
    }
    $4 = ($2 >>> 0) % 1e3 | 0;
    if ($2 >>> 0 <= 255e3) {
     $3 = 12;
     $6 = 12;
     if (!$4) {
      break label$17
     }
    }
    if (!(($2 >>> 0) % 10)) {
     $3 = 14;
     $6 = 14;
     break label$17;
    }
    $3 = $2 >>> 0 < 65536 ? 13 : 0;
    $6 = $3;
   }
   $2 = 0;
   if (!FLAC__bitwriter_write_raw_uint32($1, $3, HEAP32[1656])) {
    break label$1
   }
   label$31 : {
    label$32 : {
     switch (HEAP32[$0 + 12 >> 2]) {
     case 0:
      $3 = HEAP32[$0 + 8 >> 2] + -1 | 0;
      break label$31;
     case 1:
      $3 = 8;
      break label$31;
     case 2:
      $3 = 9;
      break label$31;
     case 3:
      break label$32;
     default:
      break label$31;
     };
    }
    $3 = 10;
   }
   if (!FLAC__bitwriter_write_raw_uint32($1, $3, HEAP32[1657])) {
    break label$1
   }
   $3 = $1;
   $4 = __wasm_rotl_i32(HEAP32[$0 + 16 >> 2] + -8 | 0, 30);
   if ($4 >>> 0 <= 4) {
    $4 = HEAP32[($4 << 2) + 10448 >> 2]
   } else {
    $4 = 0
   }
   if (!FLAC__bitwriter_write_raw_uint32($3, $4, HEAP32[1658])) {
    break label$1
   }
   if (!FLAC__bitwriter_write_raw_uint32($1, 0, HEAP32[1659])) {
    break label$1
   }
   label$38 : {
    if (!HEAP32[$0 + 20 >> 2]) {
     if (FLAC__bitwriter_write_utf8_uint32($1, HEAP32[$0 + 24 >> 2])) {
      break label$38
     }
     break label$1;
    }
    if (!FLAC__bitwriter_write_utf8_uint64($1, HEAP32[$0 + 24 >> 2], HEAP32[$0 + 28 >> 2])) {
     break label$1
    }
   }
   if ($8) {
    if (!FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 >> 2] + -1 | 0, $7)) {
     break label$1
    }
   }
   label$41 : {
    label$42 : {
     switch ($6 + -12 | 0) {
     case 0:
      if (FLAC__bitwriter_write_raw_uint32($1, HEAPU32[$0 + 4 >> 2] / 1e3 | 0, 8)) {
       break label$41
      }
      break label$1;
     case 1:
      if (FLAC__bitwriter_write_raw_uint32($1, HEAP32[$0 + 4 >> 2], 16)) {
       break label$41
      }
      break label$1;
     case 2:
      break label$42;
     default:
      break label$41;
     };
    }
    if (!FLAC__bitwriter_write_raw_uint32($1, HEAPU32[$0 + 4 >> 2] / 10 | 0, 16)) {
     break label$1
    }
   }
   if (!FLAC__bitwriter_get_write_crc8($1, $5 + 15 | 0)) {
    break label$1
   }
   $2 = (FLAC__bitwriter_write_raw_uint32($1, HEAPU8[$5 + 15 | 0], HEAP32[1660]) | 0) != 0;
  }
  global$0 = $5 + 16 | 0;
  return $2;
 }
 
 function FLAC__subframe_add_constant($0, $1, $2, $3) {
  var $4 = 0;
  label$1 : {
   if (!FLAC__bitwriter_write_raw_uint32($3, HEAP32[1674] | ($2 | 0) != 0, HEAP32[1673] + (HEAP32[1672] + HEAP32[1671] | 0) | 0)) {
    break label$1
   }
   if ($2) {
    if (!FLAC__bitwriter_write_unary_unsigned($3, $2 + -1 | 0)) {
     break label$1
    }
   }
   $4 = (FLAC__bitwriter_write_raw_int32($3, HEAP32[$0 >> 2], $1) | 0) != 0;
  }
  return $4;
 }
 
 function FLAC__subframe_add_fixed($0, $1, $2, $3, $4) {
  var $5 = 0;
  label$1 : {
   if (!FLAC__bitwriter_write_raw_uint32($4, HEAP32[1676] | ($3 | 0) != 0 | HEAP32[$0 + 12 >> 2] << 1, HEAP32[1673] + (HEAP32[1672] + HEAP32[1671] | 0) | 0)) {
    break label$1
   }
   if ($3) {
    if (!FLAC__bitwriter_write_unary_unsigned($4, $3 + -1 | 0)) {
     break label$1
    }
   }
   label$3 : {
    if (!HEAP32[$0 + 12 >> 2]) {
     break label$3
    }
    $3 = 0;
    while (1) {
     if (FLAC__bitwriter_write_raw_int32($4, HEAP32[(($3 << 2) + $0 | 0) + 16 >> 2], $2)) {
      $3 = $3 + 1 | 0;
      if ($3 >>> 0 < HEAPU32[$0 + 12 >> 2]) {
       continue
      }
      break label$3;
     }
     break;
    };
    return 0;
   }
   if (!FLAC__bitwriter_write_raw_uint32($4, HEAP32[$0 >> 2], HEAP32[1662])) {
    break label$1
   }
   label$6 : {
    if (HEAPU32[$0 >> 2] > 1) {
     break label$6
    }
    if (!FLAC__bitwriter_write_raw_uint32($4, HEAP32[$0 + 4 >> 2], HEAP32[1663])) {
     break label$1
    }
    $2 = HEAP32[$0 >> 2];
    if ($2 >>> 0 > 1) {
     break label$6
    }
    $3 = $1;
    $1 = HEAP32[$0 + 8 >> 2];
    if (!add_residual_partitioned_rice_($4, HEAP32[$0 + 32 >> 2], $3, HEAP32[$0 + 12 >> 2], HEAP32[$1 >> 2], HEAP32[$1 + 4 >> 2], HEAP32[$0 + 4 >> 2], ($2 | 0) == 1)) {
     break label$1
    }
   }
   $5 = 1;
  }
  return $5;
 }
 
 function add_residual_partitioned_rice_($0, $1, $2, $3, $4, $5, $6, $7) {
  var $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0;
  $12 = HEAP32[($7 ? 6672 : 6668) >> 2];
  $9 = HEAP32[($7 ? 6660 : 6656) >> 2];
  label$1 : {
   label$2 : {
    if (!$6) {
     if (!HEAP32[$5 >> 2]) {
      if (!FLAC__bitwriter_write_raw_uint32($0, HEAP32[$4 >> 2], $9)) {
       break label$2
      }
      if (!FLAC__bitwriter_write_rice_signed_block($0, $1, $2, HEAP32[$4 >> 2])) {
       break label$2
      }
      break label$1;
     }
     if (!FLAC__bitwriter_write_raw_uint32($0, $12, $9)) {
      break label$2
     }
     if (!FLAC__bitwriter_write_raw_uint32($0, HEAP32[$5 >> 2], HEAP32[1666])) {
      break label$2
     }
     if (!$2) {
      break label$1
     }
     $7 = 0;
     while (1) {
      if (FLAC__bitwriter_write_raw_int32($0, HEAP32[($7 << 2) + $1 >> 2], HEAP32[$5 >> 2])) {
       $7 = $7 + 1 | 0;
       if (($7 | 0) != ($2 | 0)) {
        continue
       }
       break label$1;
      }
      break;
     };
     return 0;
    }
    $15 = $2 + $3 >>> $6 | 0;
    $16 = HEAP32[1666];
    $2 = 0;
    while (1) {
     $7 = $2;
     $13 = $15 - ($10 ? 0 : $3) | 0;
     $2 = $7 + $13 | 0;
     $14 = $10 << 2;
     $8 = $14 + $5 | 0;
     label$8 : {
      if (!HEAP32[$8 >> 2]) {
       $11 = 0;
       $8 = $4 + $14 | 0;
       if (!FLAC__bitwriter_write_raw_uint32($0, HEAP32[$8 >> 2], $9)) {
        break label$2
       }
       if (FLAC__bitwriter_write_rice_signed_block($0, ($7 << 2) + $1 | 0, $13, HEAP32[$8 >> 2])) {
        break label$8
       }
       break label$2;
      }
      $11 = 0;
      if (!FLAC__bitwriter_write_raw_uint32($0, $12, $9)) {
       break label$2
      }
      if (!FLAC__bitwriter_write_raw_uint32($0, HEAP32[$8 >> 2], $16)) {
       break label$2
      }
      if ($7 >>> 0 >= $2 >>> 0) {
       break label$8
      }
      while (1) {
       if (!FLAC__bitwriter_write_raw_int32($0, HEAP32[($7 << 2) + $1 >> 2], HEAP32[$8 >> 2])) {
        break label$2
       }
       $7 = $7 + 1 | 0;
       if (($7 | 0) != ($2 | 0)) {
        continue
       }
       break;
      };
     }
     $11 = 1;
     $10 = $10 + 1 | 0;
     if (!($10 >>> $6)) {
      continue
     }
     break;
    };
   }
   return $11;
  }
  return 1;
 }
 
 function FLAC__subframe_add_lpc($0, $1, $2, $3, $4) {
  var $5 = 0;
  label$1 : {
   if (!FLAC__bitwriter_write_raw_uint32($4, (HEAP32[$0 + 12 >> 2] << 1) + -2 | (HEAP32[1677] | ($3 | 0) != 0), HEAP32[1673] + (HEAP32[1672] + HEAP32[1671] | 0) | 0)) {
    break label$1
   }
   if ($3) {
    if (!FLAC__bitwriter_write_unary_unsigned($4, $3 + -1 | 0)) {
     break label$1
    }
   }
   label$3 : {
    if (!HEAP32[$0 + 12 >> 2]) {
     break label$3
    }
    $3 = 0;
    while (1) {
     if (FLAC__bitwriter_write_raw_int32($4, HEAP32[(($3 << 2) + $0 | 0) + 152 >> 2], $2)) {
      $3 = $3 + 1 | 0;
      if ($3 >>> 0 < HEAPU32[$0 + 12 >> 2]) {
       continue
      }
      break label$3;
     }
     break;
    };
    return 0;
   }
   if (!FLAC__bitwriter_write_raw_uint32($4, HEAP32[$0 + 16 >> 2] + -1 | 0, HEAP32[1669])) {
    break label$1
   }
   if (!FLAC__bitwriter_write_raw_int32($4, HEAP32[$0 + 20 >> 2], HEAP32[1670])) {
    break label$1
   }
   label$6 : {
    if (!HEAP32[$0 + 12 >> 2]) {
     break label$6
    }
    $3 = 0;
    while (1) {
     if (FLAC__bitwriter_write_raw_int32($4, HEAP32[(($3 << 2) + $0 | 0) + 24 >> 2], HEAP32[$0 + 16 >> 2])) {
      $3 = $3 + 1 | 0;
      if ($3 >>> 0 < HEAPU32[$0 + 12 >> 2]) {
       continue
      }
      break label$6;
     }
     break;
    };
    return 0;
   }
   if (!FLAC__bitwriter_write_raw_uint32($4, HEAP32[$0 >> 2], HEAP32[1662])) {
    break label$1
   }
   label$9 : {
    if (HEAPU32[$0 >> 2] > 1) {
     break label$9
    }
    if (!FLAC__bitwriter_write_raw_uint32($4, HEAP32[$0 + 4 >> 2], HEAP32[1663])) {
     break label$1
    }
    $2 = HEAP32[$0 >> 2];
    if ($2 >>> 0 > 1) {
     break label$9
    }
    $3 = $1;
    $1 = HEAP32[$0 + 8 >> 2];
    if (!add_residual_partitioned_rice_($4, HEAP32[$0 + 280 >> 2], $3, HEAP32[$0 + 12 >> 2], HEAP32[$1 >> 2], HEAP32[$1 + 4 >> 2], HEAP32[$0 + 4 >> 2], ($2 | 0) == 1)) {
     break label$1
    }
   }
   $5 = 1;
  }
  return $5;
 }
 
 function FLAC__subframe_add_verbatim($0, $1, $2, $3, $4) {
  $0 = HEAP32[$0 >> 2];
  label$1 : {
   if (!FLAC__bitwriter_write_raw_uint32($4, HEAP32[1675] | ($3 | 0) != 0, HEAP32[1673] + (HEAP32[1672] + HEAP32[1671] | 0) | 0)) {
    break label$1
   }
   if ($3) {
    if (!FLAC__bitwriter_write_unary_unsigned($4, $3 + -1 | 0)) {
     break label$1
    }
   }
   if (!$1) {
    return 1
   }
   $3 = 0;
   label$4 : {
    while (1) {
     if (!FLAC__bitwriter_write_raw_int32($4, HEAP32[$0 + ($3 << 2) >> 2], $2)) {
      break label$4
     }
     $3 = $3 + 1 | 0;
     if (($3 | 0) != ($1 | 0)) {
      continue
     }
     break;
    };
    return 1;
   }
  }
  return 0;
 }
 
 function strncmp($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0;
  if (!$2) {
   return 0
  }
  $3 = HEAPU8[$0 | 0];
  label$2 : {
   if (!$3) {
    break label$2
   }
   while (1) {
    label$4 : {
     $4 = HEAPU8[$1 | 0];
     if (($4 | 0) != ($3 | 0)) {
      break label$4
     }
     $2 = $2 + -1 | 0;
     if (!$2 | !$4) {
      break label$4
     }
     $1 = $1 + 1 | 0;
     $3 = HEAPU8[$0 + 1 | 0];
     $0 = $0 + 1 | 0;
     if ($3) {
      continue
     }
     break label$2;
    }
    break;
   };
   $5 = $3;
  }
  return ($5 & 255) - HEAPU8[$1 | 0] | 0;
 }
 
 function __uflow($0) {
  var $1 = 0, $2 = 0;
  $1 = global$0 - 16 | 0;
  global$0 = $1;
  $2 = -1;
  label$1 : {
   if (__toread($0)) {
    break label$1
   }
   if ((FUNCTION_TABLE[HEAP32[$0 + 32 >> 2]]($0, $1 + 15 | 0, 1) | 0) != 1) {
    break label$1
   }
   $2 = HEAPU8[$1 + 15 | 0];
  }
  global$0 = $1 + 16 | 0;
  return $2;
 }
 
 function __shlim($0) {
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0;
  HEAP32[$0 + 112 >> 2] = 0;
  HEAP32[$0 + 116 >> 2] = 0;
  $3 = HEAP32[$0 + 8 >> 2];
  $4 = HEAP32[$0 + 4 >> 2];
  $1 = $3 - $4 | 0;
  $2 = $1 >> 31;
  HEAP32[$0 + 120 >> 2] = $1;
  HEAP32[$0 + 124 >> 2] = $2;
  if (!((($2 | 0) < 0 ? 1 : ($2 | 0) <= 0 ? ($1 >>> 0 > 0 ? 0 : 1) : 0) | 1)) {
   HEAP32[$0 + 104 >> 2] = $4;
   return;
  }
  HEAP32[$0 + 104 >> 2] = $3;
 }
 
 function __shgetc($0) {
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
  $2 = HEAP32[$0 + 116 >> 2];
  $3 = $2;
  label$1 : {
   $5 = HEAP32[$0 + 112 >> 2];
   label$2 : {
    if ($2 | $5) {
     $2 = HEAP32[$0 + 124 >> 2];
     if (($2 | 0) > ($3 | 0) ? 1 : ($2 | 0) >= ($3 | 0) ? (HEAPU32[$0 + 120 >> 2] < $5 >>> 0 ? 0 : 1) : 0) {
      break label$2
     }
    }
    $5 = __uflow($0);
    if (($5 | 0) > -1) {
     break label$1
    }
   }
   HEAP32[$0 + 104 >> 2] = 0;
   return -1;
  }
  $2 = HEAP32[$0 + 8 >> 2];
  $3 = HEAP32[$0 + 116 >> 2];
  $4 = $3;
  label$4 : {
   label$5 : {
    $1 = HEAP32[$0 + 112 >> 2];
    if (!($3 | $1)) {
     break label$5
    }
    $3 = (HEAP32[$0 + 124 >> 2] ^ -1) + $4 | 0;
    $4 = HEAP32[$0 + 120 >> 2] ^ -1;
    $1 = $4 + $1 | 0;
    if ($1 >>> 0 < $4 >>> 0) {
     $3 = $3 + 1 | 0
    }
    $4 = $1;
    $1 = HEAP32[$0 + 4 >> 2];
    $6 = $2 - $1 | 0;
    $7 = $4 >>> 0 < $6 >>> 0 ? 0 : 1;
    $6 = $6 >> 31;
    if (($3 | 0) > ($6 | 0) ? 1 : ($3 | 0) >= ($6 | 0) ? $7 : 0) {
     break label$5
    }
    HEAP32[$0 + 104 >> 2] = $4 + $1;
    break label$4;
   }
   HEAP32[$0 + 104 >> 2] = $2;
  }
  label$6 : {
   if (!$2) {
    $2 = HEAP32[$0 + 4 >> 2];
    break label$6;
   }
   $3 = $0;
   $1 = $2;
   $2 = HEAP32[$0 + 4 >> 2];
   $1 = ($1 - $2 | 0) + 1 | 0;
   $4 = $1 + HEAP32[$0 + 120 >> 2] | 0;
   $0 = HEAP32[$0 + 124 >> 2] + ($1 >> 31) | 0;
   HEAP32[$3 + 120 >> 2] = $4;
   HEAP32[$3 + 124 >> 2] = $4 >>> 0 < $1 >>> 0 ? $0 + 1 | 0 : $0;
  }
  $0 = $2 + -1 | 0;
  if (HEAPU8[$0 | 0] != ($5 | 0)) {
   HEAP8[$0 | 0] = $5
  }
  return $5;
 }
 
 function __extendsftf2($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
  $4 = global$0 - 16 | 0;
  global$0 = $4;
  $5 = (wasm2js_scratch_store_f32($1), wasm2js_scratch_load_i32(0));
  $2 = $5 & 2147483647;
  label$1 : {
   if ($2 + -8388608 >>> 0 <= 2130706431) {
    $3 = $2;
    $2 = $2 >>> 7 | 0;
    $3 = $3 << 25;
    $2 = $2 + 1065353216 | 0;
    $6 = $3;
    $2 = $3 >>> 0 < 0 ? $2 + 1 | 0 : $2;
    break label$1;
   }
   if ($2 >>> 0 >= 2139095040) {
    $2 = $5;
    $3 = $2 >>> 7 | 0;
    $6 = $2 << 25;
    $2 = $3 | 2147418112;
    break label$1;
   }
   if (!$2) {
    $2 = 0;
    break label$1;
   }
   $3 = $2;
   $2 = Math_clz32($2);
   __ashlti3($4, $3, 0, 0, 0, $2 + 81 | 0);
   $7 = HEAP32[$4 >> 2];
   $8 = HEAP32[$4 + 4 >> 2];
   $6 = HEAP32[$4 + 8 >> 2];
   $2 = HEAP32[$4 + 12 >> 2] ^ 65536 | 16265 - $2 << 16;
  }
  HEAP32[$0 >> 2] = $7;
  HEAP32[$0 + 4 >> 2] = $8;
  HEAP32[$0 + 8 >> 2] = $6;
  HEAP32[$0 + 12 >> 2] = $5 & -2147483648 | $2;
  global$0 = $4 + 16 | 0;
 }
 
 function __floatsitf($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
  $3 = global$0 - 16 | 0;
  global$0 = $3;
  $6 = $0;
  $7 = $0;
  label$1 : {
   if (!$1) {
    $1 = 0;
    $5 = 0;
    break label$1;
   }
   $2 = $1 >> 31;
   $4 = $2 + $1 ^ $2;
   $2 = Math_clz32($4);
   __ashlti3($3, $4, 0, 0, 0, $2 + 81 | 0);
   $2 = (HEAP32[$3 + 12 >> 2] ^ 65536) + (16414 - $2 << 16) | 0;
   $4 = 0 + HEAP32[$3 + 8 >> 2] | 0;
   if ($4 >>> 0 < $5 >>> 0) {
    $2 = $2 + 1 | 0
   }
   $1 = $1 & -2147483648 | $2;
   $2 = HEAP32[$3 + 4 >> 2];
   $5 = HEAP32[$3 >> 2];
  }
  HEAP32[$7 >> 2] = $5;
  HEAP32[$6 + 4 >> 2] = $2;
  HEAP32[$0 + 8 >> 2] = $4;
  HEAP32[$0 + 12 >> 2] = $1;
  global$0 = $3 + 16 | 0;
 }
 
 function __multf3($0, $1, $2, $3, $4, $5, $6, $7, $8) {
  var $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0;
  $13 = global$0 - 96 | 0;
  global$0 = $13;
  $15 = $2;
  $9 = $6;
  $20 = ($9 & 131071) << 15 | $5 >>> 17;
  $10 = $8 & 65535;
  $22 = $10;
  $17 = $7;
  $9 = $7;
  $25 = $9 << 15 | $6 >>> 17;
  $14 = ($4 ^ $8) & -2147483648;
  $9 = $4 & 65535;
  $12 = $9;
  $18 = $3;
  $28 = $9;
  $9 = $10;
  $26 = ($9 & 131071) << 15 | $7 >>> 17;
  $29 = $8 >>> 16 & 32767;
  $37 = $4 >>> 16 & 32767;
  label$1 : {
   label$2 : {
    if ($37 + -1 >>> 0 <= 32765) {
     $21 = 0;
     if ($29 + -1 >>> 0 < 32766) {
      break label$2
     }
    }
    $11 = $4 & 2147483647;
    $10 = $11;
    $9 = $3;
    if (!(!$3 & ($10 | 0) == 2147418112 ? !($1 | $2) : ($10 | 0) == 2147418112 & $3 >>> 0 < 0 | $10 >>> 0 < 2147418112)) {
     $23 = $3;
     $14 = $4 | 32768;
     break label$1;
    }
    $4 = $8 & 2147483647;
    $16 = $4;
    $3 = $7;
    if (!(!$3 & ($4 | 0) == 2147418112 ? !($5 | $6) : ($4 | 0) == 2147418112 & $3 >>> 0 < 0 | $4 >>> 0 < 2147418112)) {
     $23 = $7;
     $14 = $8 | 32768;
     $1 = $5;
     $2 = $6;
     break label$1;
    }
    if (!($1 | $9 | ($10 ^ 2147418112 | $2))) {
     if (!($3 | $5 | ($6 | $16))) {
      $14 = 2147450880;
      $1 = 0;
      $2 = 0;
      break label$1;
     }
     $14 = $14 | 2147418112;
     $1 = 0;
     $2 = 0;
     break label$1;
    }
    if (!($3 | $5 | ($16 ^ 2147418112 | $6))) {
     $3 = $1 | $9;
     $4 = $2 | $10;
     $1 = 0;
     $2 = 0;
     if (!($3 | $4)) {
      $14 = 2147450880;
      break label$1;
     }
     $14 = $14 | 2147418112;
     break label$1;
    }
    if (!($1 | $9 | ($2 | $10))) {
     $1 = 0;
     $2 = 0;
     break label$1;
    }
    if (!($3 | $5 | ($6 | $16))) {
     $1 = 0;
     $2 = 0;
     break label$1;
    }
    $4 = 0;
    if (($10 | 0) == 65535 & $9 >>> 0 <= 4294967295 | $10 >>> 0 < 65535) {
     $8 = $1;
     $10 = $2;
     $4 = !($12 | $18);
     $7 = $4 << 6;
     $9 = Math_clz32($4 ? $1 : $18) + 32 | 0;
     $1 = Math_clz32($4 ? $2 : $12);
     $1 = $7 + (($1 | 0) == 32 ? $9 : $1) | 0;
     __ashlti3($13 + 80 | 0, $8, $10, $18, $12, $1 + -15 | 0);
     $18 = HEAP32[$13 + 88 >> 2];
     $15 = HEAP32[$13 + 84 >> 2];
     $28 = HEAP32[$13 + 92 >> 2];
     $4 = 16 - $1 | 0;
     $1 = HEAP32[$13 + 80 >> 2];
    }
    $21 = $4;
    if (($16 | 0) == 65535 & $3 >>> 0 > 4294967295 | $16 >>> 0 > 65535) {
     break label$2
    }
    $2 = !($17 | $22);
    $3 = $2 << 6;
    $7 = Math_clz32($2 ? $5 : $17) + 32 | 0;
    $2 = Math_clz32($2 ? $6 : $22);
    $2 = $3 + (($2 | 0) == 32 ? $7 : $2) | 0;
    $8 = $2;
    __ashlti3($13 - -64 | 0, $5, $6, $17, $22, $2 + -15 | 0);
    $5 = HEAP32[$13 + 76 >> 2];
    $2 = $5;
    $7 = HEAP32[$13 + 72 >> 2];
    $3 = $7;
    $3 = $3 << 15;
    $9 = HEAP32[$13 + 68 >> 2];
    $25 = $9 >>> 17 | $3;
    $3 = $9;
    $5 = HEAP32[$13 + 64 >> 2];
    $20 = ($3 & 131071) << 15 | $5 >>> 17;
    $26 = ($2 & 131071) << 15 | $7 >>> 17;
    $21 = ($4 - $8 | 0) + 16 | 0;
   }
   $3 = $20;
   $17 = 0;
   $8 = __wasm_i64_mul($3, 0, $1, $17);
   $2 = i64toi32_i32$HIGH_BITS;
   $27 = $2;
   $24 = $5 << 15 & -32768;
   $5 = __wasm_i64_mul($24, 0, $15, 0);
   $4 = $5 + $8 | 0;
   $11 = i64toi32_i32$HIGH_BITS + $2 | 0;
   $11 = $4 >>> 0 < $5 >>> 0 ? $11 + 1 | 0 : $11;
   $2 = $4;
   $5 = 0;
   $6 = __wasm_i64_mul($24, $30, $1, $17);
   $4 = $5 + $6 | 0;
   $10 = i64toi32_i32$HIGH_BITS + $2 | 0;
   $10 = $4 >>> 0 < $6 >>> 0 ? $10 + 1 | 0 : $10;
   $20 = $4;
   $6 = $10;
   $47 = ($2 | 0) == ($10 | 0) & $4 >>> 0 < $5 >>> 0 | $10 >>> 0 < $2 >>> 0;
   $40 = __wasm_i64_mul($3, $38, $15, $39);
   $33 = i64toi32_i32$HIGH_BITS;
   $16 = $18;
   $5 = __wasm_i64_mul($24, $30, $16, 0);
   $4 = $5 + $40 | 0;
   $12 = i64toi32_i32$HIGH_BITS + $33 | 0;
   $12 = $4 >>> 0 < $5 >>> 0 ? $12 + 1 | 0 : $12;
   $41 = $4;
   $7 = __wasm_i64_mul($25, 0, $1, $17);
   $4 = $4 + $7 | 0;
   $5 = i64toi32_i32$HIGH_BITS + $12 | 0;
   $34 = $4;
   $5 = $4 >>> 0 < $7 >>> 0 ? $5 + 1 | 0 : $5;
   $22 = $5;
   $7 = $5;
   $5 = ($11 | 0) == ($27 | 0) & $2 >>> 0 < $8 >>> 0 | $11 >>> 0 < $27 >>> 0;
   $4 = $11;
   $2 = $4 + $34 | 0;
   $10 = $5 + $7 | 0;
   $27 = $2;
   $10 = $2 >>> 0 < $4 >>> 0 ? $10 + 1 | 0 : $10;
   $4 = $10;
   $7 = $2;
   $43 = __wasm_i64_mul($3, $38, $16, $42);
   $35 = i64toi32_i32$HIGH_BITS;
   $2 = $24;
   $31 = $28 | 65536;
   $24 = $19;
   $5 = __wasm_i64_mul($2, $30, $31, $19);
   $2 = $5 + $43 | 0;
   $10 = i64toi32_i32$HIGH_BITS + $35 | 0;
   $10 = $2 >>> 0 < $5 >>> 0 ? $10 + 1 | 0 : $10;
   $44 = $2;
   $9 = __wasm_i64_mul($15, $39, $25, $45);
   $2 = $2 + $9 | 0;
   $19 = $10;
   $5 = $10 + i64toi32_i32$HIGH_BITS | 0;
   $5 = $2 >>> 0 < $9 >>> 0 ? $5 + 1 | 0 : $5;
   $36 = $2;
   $32 = $26 & 2147483647 | -2147483648;
   $2 = __wasm_i64_mul($32, 0, $1, $17);
   $1 = $36 + $2 | 0;
   $17 = $5;
   $9 = $5 + i64toi32_i32$HIGH_BITS | 0;
   $30 = $1;
   $2 = $1 >>> 0 < $2 >>> 0 ? $9 + 1 | 0 : $9;
   $10 = $4 + $1 | 0;
   $5 = 0;
   $1 = $5 + $7 | 0;
   if ($1 >>> 0 < $5 >>> 0) {
    $10 = $10 + 1 | 0
   }
   $28 = $1;
   $26 = $10;
   $5 = $10;
   $7 = $1 + $47 | 0;
   if ($7 >>> 0 < $1 >>> 0) {
    $5 = $5 + 1 | 0
   }
   $8 = $5;
   $18 = ($21 + ($29 + $37 | 0) | 0) + -16383 | 0;
   $5 = __wasm_i64_mul($16, $42, $25, $45);
   $1 = i64toi32_i32$HIGH_BITS;
   $11 = 0;
   $9 = __wasm_i64_mul($3, $38, $31, $24);
   $3 = $9 + $5 | 0;
   $10 = i64toi32_i32$HIGH_BITS + $1 | 0;
   $10 = $3 >>> 0 < $9 >>> 0 ? $10 + 1 | 0 : $10;
   $21 = $3;
   $9 = $3;
   $3 = $10;
   $10 = ($1 | 0) == ($3 | 0) & $9 >>> 0 < $5 >>> 0 | $3 >>> 0 < $1 >>> 0;
   $5 = __wasm_i64_mul($32, $46, $15, $39);
   $1 = $5 + $9 | 0;
   $9 = i64toi32_i32$HIGH_BITS + $3 | 0;
   $9 = $1 >>> 0 < $5 >>> 0 ? $9 + 1 | 0 : $9;
   $15 = $1;
   $5 = $1;
   $1 = $9;
   $3 = ($3 | 0) == ($1 | 0) & $5 >>> 0 < $21 >>> 0 | $1 >>> 0 < $3 >>> 0;
   $5 = $10 + $3 | 0;
   if ($5 >>> 0 < $3 >>> 0) {
    $11 = 1
   }
   $9 = $5;
   $3 = $1;
   $5 = $11;
   $29 = $9;
   $10 = 0;
   $9 = ($12 | 0) == ($22 | 0) & $34 >>> 0 < $41 >>> 0 | $22 >>> 0 < $12 >>> 0;
   $12 = $9 + (($12 | 0) == ($33 | 0) & $41 >>> 0 < $40 >>> 0 | $12 >>> 0 < $33 >>> 0) | 0;
   if ($12 >>> 0 < $9 >>> 0) {
    $10 = 1
   }
   $11 = $12;
   $12 = $12 + $15 | 0;
   $9 = $3 + $10 | 0;
   $21 = $12;
   $10 = $12;
   $9 = $10 >>> 0 < $11 >>> 0 ? $9 + 1 | 0 : $9;
   $3 = $9;
   $1 = ($1 | 0) == ($3 | 0) & $10 >>> 0 < $15 >>> 0 | $3 >>> 0 < $1 >>> 0;
   $9 = $29 + $1 | 0;
   if ($9 >>> 0 < $1 >>> 0) {
    $5 = $5 + 1 | 0
   }
   $1 = $9;
   $9 = __wasm_i64_mul($32, $46, $31, $24);
   $1 = $1 + $9 | 0;
   $10 = i64toi32_i32$HIGH_BITS + $5 | 0;
   $10 = $1 >>> 0 < $9 >>> 0 ? $10 + 1 | 0 : $10;
   $11 = $1;
   $12 = __wasm_i64_mul($32, $46, $16, $42);
   $5 = i64toi32_i32$HIGH_BITS;
   $15 = __wasm_i64_mul($25, $45, $31, $24);
   $1 = $15 + $12 | 0;
   $9 = i64toi32_i32$HIGH_BITS + $5 | 0;
   $9 = $1 >>> 0 < $15 >>> 0 ? $9 + 1 | 0 : $9;
   $15 = $1;
   $16 = $1;
   $1 = $9;
   $9 = ($5 | 0) == ($1 | 0) & $16 >>> 0 < $12 >>> 0 | $1 >>> 0 < $5 >>> 0;
   $5 = $1 + $11 | 0;
   $11 = $10 + $9 | 0;
   $9 = $5 >>> 0 < $1 >>> 0 ? $11 + 1 | 0 : $11;
   $16 = $5;
   $10 = $3 + $15 | 0;
   $11 = 0;
   $1 = $11 + $21 | 0;
   if ($1 >>> 0 < $11 >>> 0) {
    $10 = $10 + 1 | 0
   }
   $12 = $1;
   $5 = $1;
   $1 = $10;
   $3 = ($3 | 0) == ($1 | 0) & $5 >>> 0 < $21 >>> 0 | $1 >>> 0 < $3 >>> 0;
   $5 = $16 + $3 | 0;
   if ($5 >>> 0 < $3 >>> 0) {
    $9 = $9 + 1 | 0
   }
   $15 = $5;
   $11 = $1;
   $10 = 0;
   $5 = ($19 | 0) == ($17 | 0) & $36 >>> 0 < $44 >>> 0 | $17 >>> 0 < $19 >>> 0;
   $19 = $5 + (($19 | 0) == ($35 | 0) & $44 >>> 0 < $43 >>> 0 | $19 >>> 0 < $35 >>> 0) | 0;
   if ($19 >>> 0 < $5 >>> 0) {
    $10 = 1
   }
   $5 = $19 + (($2 | 0) == ($17 | 0) & $30 >>> 0 < $36 >>> 0 | $2 >>> 0 < $17 >>> 0) | 0;
   $3 = $2;
   $2 = $3 + $12 | 0;
   $11 = $5 + $11 | 0;
   $11 = $2 >>> 0 < $3 >>> 0 ? $11 + 1 | 0 : $11;
   $19 = $2;
   $3 = $2;
   $2 = $11;
   $1 = ($1 | 0) == ($2 | 0) & $3 >>> 0 < $12 >>> 0 | $2 >>> 0 < $1 >>> 0;
   $3 = $1 + $15 | 0;
   if ($3 >>> 0 < $1 >>> 0) {
    $9 = $9 + 1 | 0
   }
   $1 = $2;
   $10 = $9;
   $9 = $3;
   $5 = 0;
   $3 = ($4 | 0) == ($26 | 0) & $28 >>> 0 < $27 >>> 0 | $26 >>> 0 < $4 >>> 0;
   $4 = $3 + (($4 | 0) == ($22 | 0) & $27 >>> 0 < $34 >>> 0 | $4 >>> 0 < $22 >>> 0) | 0;
   if ($4 >>> 0 < $3 >>> 0) {
    $5 = 1
   }
   $3 = $4 + $19 | 0;
   $11 = $1 + $5 | 0;
   $11 = $3 >>> 0 < $4 >>> 0 ? $11 + 1 | 0 : $11;
   $1 = $3;
   $4 = $11;
   $1 = ($2 | 0) == ($4 | 0) & $1 >>> 0 < $19 >>> 0 | $4 >>> 0 < $2 >>> 0;
   $2 = $9 + $1 | 0;
   if ($2 >>> 0 < $1 >>> 0) {
    $10 = $10 + 1 | 0
   }
   $1 = $2;
   $2 = $10;
   label$13 : {
    if ($2 & 65536) {
     $18 = $18 + 1 | 0;
     break label$13;
    }
    $12 = $6 >>> 31 | 0;
    $10 = $2 << 1 | $1 >>> 31;
    $1 = $1 << 1 | $4 >>> 31;
    $2 = $10;
    $10 = $4 << 1 | $3 >>> 31;
    $3 = $3 << 1 | $8 >>> 31;
    $4 = $10;
    $9 = $20;
    $10 = $6 << 1 | $9 >>> 31;
    $20 = $9 << 1;
    $6 = $10;
    $9 = $8 << 1 | $7 >>> 31;
    $7 = $7 << 1 | $12;
    $8 = $9;
   }
   if (($18 | 0) >= 32767) {
    $14 = $14 | 2147418112;
    $1 = 0;
    $2 = 0;
    break label$1;
   }
   label$16 : {
    if (($18 | 0) <= 0) {
     $5 = 1 - $18 | 0;
     if ($5 >>> 0 <= 127) {
      $9 = $18 + 127 | 0;
      __ashlti3($13 + 48 | 0, $20, $6, $7, $8, $9);
      __ashlti3($13 + 32 | 0, $3, $4, $1, $2, $9);
      __lshrti3($13 + 16 | 0, $20, $6, $7, $8, $5);
      __lshrti3($13, $3, $4, $1, $2, $5);
      $20 = (HEAP32[$13 + 48 >> 2] | HEAP32[$13 + 56 >> 2]) != 0 | (HEAP32[$13 + 52 >> 2] | HEAP32[$13 + 60 >> 2]) != 0 | (HEAP32[$13 + 32 >> 2] | HEAP32[$13 + 16 >> 2]);
      $6 = HEAP32[$13 + 36 >> 2] | HEAP32[$13 + 20 >> 2];
      $7 = HEAP32[$13 + 40 >> 2] | HEAP32[$13 + 24 >> 2];
      $8 = HEAP32[$13 + 44 >> 2] | HEAP32[$13 + 28 >> 2];
      $3 = HEAP32[$13 >> 2];
      $4 = HEAP32[$13 + 4 >> 2];
      $2 = HEAP32[$13 + 12 >> 2];
      $1 = HEAP32[$13 + 8 >> 2];
      break label$16;
     }
     $1 = 0;
     $2 = 0;
     break label$1;
    }
    $2 = $2 & 65535 | $18 << 16;
   }
   $23 = $1 | $23;
   $14 = $2 | $14;
   if (!(!$7 & ($8 | 0) == -2147483648 ? !($6 | $20) : ($8 | 0) > -1 ? 1 : ($8 | 0) >= -1 ? ($7 >>> 0 <= 4294967295 ? 0 : 1) : 0)) {
    $11 = $14;
    $12 = $4;
    $1 = $3 + 1 | 0;
    if ($1 >>> 0 < 1) {
     $12 = $12 + 1 | 0
    }
    $2 = $12;
    $3 = ($4 | 0) == ($2 | 0) & $1 >>> 0 < $3 >>> 0 | $2 >>> 0 < $4 >>> 0;
    $4 = $3 + $23 | 0;
    if ($4 >>> 0 < $3 >>> 0) {
     $11 = $11 + 1 | 0
    }
    $23 = $4;
    $14 = $11;
    break label$1;
   }
   if ($7 | $20 | ($8 ^ -2147483648 | $6)) {
    $1 = $3;
    $2 = $4;
    break label$1;
   }
   $12 = $14;
   $10 = $4;
   $1 = $3 & 1;
   $2 = $1 + $3 | 0;
   if ($2 >>> 0 < $1 >>> 0) {
    $10 = $10 + 1 | 0
   }
   $1 = $2;
   $2 = $10;
   $3 = ($4 | 0) == ($2 | 0) & $1 >>> 0 < $3 >>> 0 | $2 >>> 0 < $4 >>> 0;
   $4 = $3 + $23 | 0;
   if ($4 >>> 0 < $3 >>> 0) {
    $12 = $12 + 1 | 0
   }
   $23 = $4;
   $14 = $12;
  }
  HEAP32[$0 >> 2] = $1;
  HEAP32[$0 + 4 >> 2] = $2;
  HEAP32[$0 + 8 >> 2] = $23;
  HEAP32[$0 + 12 >> 2] = $14;
  global$0 = $13 + 96 | 0;
 }
 
 function __addtf3($0, $1, $2, $3, $4, $5, $6, $7, $8) {
  var $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0;
  $11 = global$0 - 112 | 0;
  global$0 = $11;
  $12 = $7;
  $14 = $8 & 2147483647;
  $10 = $2 + -1 | 0;
  $9 = $1 + -1 | 0;
  if ($9 >>> 0 < 4294967295) {
   $10 = $10 + 1 | 0
  }
  $13 = $9;
  $16 = ($9 | 0) == -1 & ($10 | 0) == -1;
  $15 = $4 & 2147483647;
  $9 = $15;
  $17 = $3;
  $10 = ($2 | 0) == ($10 | 0) & $13 >>> 0 < $1 >>> 0 | $10 >>> 0 < $2 >>> 0;
  $13 = $3 + $10 | 0;
  if ($13 >>> 0 < $10 >>> 0) {
   $9 = $9 + 1 | 0
  }
  $13 = $13 + -1 | 0;
  $10 = $9 + -1 | 0;
  $9 = $13;
  label$1 : {
   label$2 : {
    $10 = $9 >>> 0 < 4294967295 ? $10 + 1 | 0 : $10;
    if (!(($9 | 0) == -1 & ($10 | 0) == 2147418111 ? $16 : ($10 | 0) == 2147418111 & $9 >>> 0 > 4294967295 | $10 >>> 0 > 2147418111)) {
     $10 = $6 + -1 | 0;
     $9 = $5 + -1 | 0;
     if ($9 >>> 0 < 4294967295) {
      $10 = $10 + 1 | 0
     }
     $13 = $9;
     $16 = ($9 | 0) != -1 | ($10 | 0) != -1;
     $9 = $14;
     $10 = ($6 | 0) == ($10 | 0) & $13 >>> 0 < $5 >>> 0 | $10 >>> 0 < $6 >>> 0;
     $13 = $10 + $12 | 0;
     if ($13 >>> 0 < $10 >>> 0) {
      $9 = $9 + 1 | 0
     }
     $10 = $13 + -1 | 0;
     $9 = $9 + -1 | 0;
     $9 = $10 >>> 0 < 4294967295 ? $9 + 1 | 0 : $9;
     if (($10 | 0) == -1 & ($9 | 0) == 2147418111 ? $16 : ($9 | 0) == 2147418111 & $10 >>> 0 < 4294967295 | $9 >>> 0 < 2147418111) {
      break label$2
     }
    }
    if (!(!$17 & ($15 | 0) == 2147418112 ? !($1 | $2) : ($15 | 0) == 2147418112 & $17 >>> 0 < 0 | $15 >>> 0 < 2147418112)) {
     $7 = $3;
     $8 = $4 | 32768;
     $5 = $1;
     $6 = $2;
     break label$1;
    }
    if (!(!$12 & ($14 | 0) == 2147418112 ? !($5 | $6) : ($14 | 0) == 2147418112 & $12 >>> 0 < 0 | $14 >>> 0 < 2147418112)) {
     $8 = $8 | 32768;
     break label$1;
    }
    if (!($1 | $17 | ($15 ^ 2147418112 | $2))) {
     $9 = $3;
     $3 = !($1 ^ $5 | $3 ^ $7 | ($2 ^ $6 | $4 ^ $8 ^ -2147483648));
     $7 = $3 ? 0 : $9;
     $8 = $3 ? 2147450880 : $4;
     $5 = $3 ? 0 : $1;
     $6 = $3 ? 0 : $2;
     break label$1;
    }
    if (!($5 | $12 | ($14 ^ 2147418112 | $6))) {
     break label$1
    }
    if (!($1 | $17 | ($2 | $15))) {
     if ($5 | $12 | ($6 | $14)) {
      break label$1
     }
     $5 = $1 & $5;
     $6 = $2 & $6;
     $7 = $3 & $7;
     $8 = $4 & $8;
     break label$1;
    }
    if ($5 | $12 | ($6 | $14)) {
     break label$2
    }
    $5 = $1;
    $6 = $2;
    $7 = $3;
    $8 = $4;
    break label$1;
   }
   $10 = ($12 | 0) == ($17 | 0) & ($14 | 0) == ($15 | 0) ? ($2 | 0) == ($6 | 0) & $5 >>> 0 > $1 >>> 0 | $6 >>> 0 > $2 >>> 0 : ($14 | 0) == ($15 | 0) & $12 >>> 0 > $17 >>> 0 | $14 >>> 0 > $15 >>> 0;
   $9 = $10;
   $15 = $9 ? $5 : $1;
   $14 = $9 ? $6 : $2;
   $12 = $9 ? $8 : $4;
   $17 = $12;
   $18 = $9 ? $7 : $3;
   $13 = $18;
   $9 = $12 & 65535;
   $8 = $10 ? $4 : $8;
   $19 = $8;
   $4 = $10 ? $3 : $7;
   $16 = $8 >>> 16 & 32767;
   $12 = $12 >>> 16 & 32767;
   if (!$12) {
    $3 = !($9 | $13);
    $7 = $3 << 6;
    $8 = Math_clz32($3 ? $15 : $13) + 32 | 0;
    $3 = Math_clz32($3 ? $14 : $9);
    $3 = $7 + (($3 | 0) == 32 ? $8 : $3) | 0;
    __ashlti3($11 + 96 | 0, $15, $14, $13, $9, $3 + -15 | 0);
    $13 = HEAP32[$11 + 104 >> 2];
    $15 = HEAP32[$11 + 96 >> 2];
    $14 = HEAP32[$11 + 100 >> 2];
    $12 = 16 - $3 | 0;
    $9 = HEAP32[$11 + 108 >> 2];
   }
   $5 = $10 ? $1 : $5;
   $6 = $10 ? $2 : $6;
   $1 = $4;
   $2 = $19 & 65535;
   if ($16) {
    $3 = $1;
    $1 = $2;
   } else {
    $8 = $1;
    $3 = !($1 | $2);
    $7 = $3 << 6;
    $10 = Math_clz32($3 ? $5 : $1) + 32 | 0;
    $1 = Math_clz32($3 ? $6 : $2);
    $1 = $7 + (($1 | 0) == 32 ? $10 : $1) | 0;
    __ashlti3($11 + 80 | 0, $5, $6, $8, $2, $1 + -15 | 0);
    $16 = 16 - $1 | 0;
    $5 = HEAP32[$11 + 80 >> 2];
    $6 = HEAP32[$11 + 84 >> 2];
    $3 = HEAP32[$11 + 88 >> 2];
    $1 = HEAP32[$11 + 92 >> 2];
   }
   $2 = $3;
   $10 = $1 << 3 | $2 >>> 29;
   $7 = $2 << 3 | $6 >>> 29;
   $8 = $10 | 524288;
   $1 = $13;
   $3 = $9 << 3 | $1 >>> 29;
   $10 = $1 << 3 | $14 >>> 29;
   $20 = $3;
   $18 = $4 ^ $18;
   $13 = $17 ^ $19;
   $1 = $5;
   $9 = $6 << 3 | $1 >>> 29;
   $1 = $1 << 3;
   $2 = $9;
   $4 = $12 - $16 | 0;
   $3 = $1;
   label$11 : {
    if (!$4) {
     break label$11
    }
    if ($4 >>> 0 > 127) {
     $7 = 0;
     $8 = 0;
     $9 = 0;
     $3 = 1;
     break label$11;
    }
    __ashlti3($11 - -64 | 0, $1, $2, $7, $8, 128 - $4 | 0);
    __lshrti3($11 + 48 | 0, $1, $2, $7, $8, $4);
    $7 = HEAP32[$11 + 56 >> 2];
    $8 = HEAP32[$11 + 60 >> 2];
    $9 = HEAP32[$11 + 52 >> 2];
    $3 = HEAP32[$11 + 48 >> 2] | ((HEAP32[$11 + 64 >> 2] | HEAP32[$11 + 72 >> 2]) != 0 | (HEAP32[$11 + 68 >> 2] | HEAP32[$11 + 76 >> 2]) != 0);
   }
   $6 = $9;
   $4 = $10;
   $16 = $20 | 524288;
   $1 = $15;
   $9 = $14 << 3 | $1 >>> 29;
   $2 = $1 << 3;
   label$13 : {
    if (($13 | 0) < -1 ? 1 : ($13 | 0) <= -1 ? ($18 >>> 0 > 4294967295 ? 0 : 1) : 0) {
     $14 = $3;
     $1 = $2 - $3 | 0;
     $15 = $4 - $7 | 0;
     $3 = ($6 | 0) == ($9 | 0) & $2 >>> 0 < $3 >>> 0 | $9 >>> 0 < $6 >>> 0;
     $5 = $15 - $3 | 0;
     $2 = $9 - (($2 >>> 0 < $14 >>> 0) + $6 | 0) | 0;
     $6 = ($16 - (($4 >>> 0 < $7 >>> 0) + $8 | 0) | 0) - ($15 >>> 0 < $3 >>> 0) | 0;
     if (!($1 | $5 | ($2 | $6))) {
      $5 = 0;
      $6 = 0;
      $7 = 0;
      $8 = 0;
      break label$1;
     }
     if (($6 | 0) == 524287 & $5 >>> 0 > 4294967295 | $6 >>> 0 > 524287) {
      break label$13
     }
     $7 = $1;
     $3 = !($5 | $6);
     $4 = $3 << 6;
     $8 = Math_clz32($3 ? $1 : $5) + 32 | 0;
     $1 = Math_clz32($3 ? $2 : $6);
     $1 = $4 + (($1 | 0) == 32 ? $8 : $1) | 0;
     $1 = $1 + -12 | 0;
     __ashlti3($11 + 32 | 0, $7, $2, $5, $6, $1);
     $12 = $12 - $1 | 0;
     $5 = HEAP32[$11 + 40 >> 2];
     $6 = HEAP32[$11 + 44 >> 2];
     $1 = HEAP32[$11 + 32 >> 2];
     $2 = HEAP32[$11 + 36 >> 2];
     break label$13;
    }
    $10 = $6 + $9 | 0;
    $1 = $3;
    $2 = $1 + $2 | 0;
    if ($2 >>> 0 < $1 >>> 0) {
     $10 = $10 + 1 | 0
    }
    $1 = $2;
    $2 = $10;
    $6 = ($6 | 0) == ($2 | 0) & $1 >>> 0 < $3 >>> 0 | $2 >>> 0 < $6 >>> 0;
    $10 = $8 + $16 | 0;
    $3 = $4 + $7 | 0;
    if ($3 >>> 0 < $4 >>> 0) {
     $10 = $10 + 1 | 0
    }
    $5 = $3;
    $4 = $6 + $3 | 0;
    $3 = $10;
    $3 = $4 >>> 0 < $5 >>> 0 ? $3 + 1 | 0 : $3;
    $5 = $4;
    $6 = $3;
    if (!($3 & 1048576)) {
     break label$13
    }
    $1 = $1 & 1 | (($2 & 1) << 31 | $1 >>> 1);
    $2 = $5 << 31 | $2 >>> 1;
    $12 = $12 + 1 | 0;
    $5 = ($6 & 1) << 31 | $5 >>> 1;
    $6 = $6 >>> 1 | 0;
   }
   $7 = 0;
   $9 = $17 & -2147483648;
   if (($12 | 0) >= 32767) {
    $8 = $9 | 2147418112;
    $5 = 0;
    $6 = 0;
    break label$1;
   }
   $4 = 0;
   label$17 : {
    if (($12 | 0) > 0) {
     $4 = $12;
     break label$17;
    }
    __ashlti3($11 + 16 | 0, $1, $2, $5, $6, $12 + 127 | 0);
    __lshrti3($11, $1, $2, $5, $6, 1 - $12 | 0);
    $1 = HEAP32[$11 >> 2] | ((HEAP32[$11 + 16 >> 2] | HEAP32[$11 + 24 >> 2]) != 0 | (HEAP32[$11 + 20 >> 2] | HEAP32[$11 + 28 >> 2]) != 0);
    $2 = HEAP32[$11 + 4 >> 2];
    $5 = HEAP32[$11 + 8 >> 2];
    $6 = HEAP32[$11 + 12 >> 2];
   }
   $7 = $7 | (($6 & 7) << 29 | $5 >>> 3);
   $4 = $9 | $6 >>> 3 & 65535 | $4 << 16;
   $9 = $5 << 29;
   $3 = 0;
   $5 = $9;
   $6 = ($2 & 7) << 29 | $1 >>> 3 | $3;
   $9 = $4;
   $3 = $2 >>> 3 | $5;
   $10 = $3;
   $4 = $1 & 7;
   $1 = $4 >>> 0 > 4;
   $2 = $1 + $6 | 0;
   if ($2 >>> 0 < $1 >>> 0) {
    $10 = $10 + 1 | 0
   }
   $1 = $2;
   $2 = $10;
   $3 = ($3 | 0) == ($2 | 0) & $1 >>> 0 < $6 >>> 0 | $2 >>> 0 < $3 >>> 0;
   $5 = $3 + $7 | 0;
   if ($5 >>> 0 < $3 >>> 0) {
    $9 = $9 + 1 | 0
   }
   $4 = ($4 | 0) == 4;
   $3 = $4 ? $1 & 1 : 0;
   $8 = $9;
   $7 = $5;
   $4 = 0;
   $9 = $2 + $4 | 0;
   $2 = $1 + $3 | 0;
   if ($2 >>> 0 < $1 >>> 0) {
    $9 = $9 + 1 | 0
   }
   $5 = $2;
   $1 = $2;
   $6 = $9;
   $1 = ($4 | 0) == ($9 | 0) & $1 >>> 0 < $3 >>> 0 | $9 >>> 0 < $4 >>> 0;
   $2 = $7 + $1 | 0;
   if ($2 >>> 0 < $1 >>> 0) {
    $8 = $8 + 1 | 0
   }
   $7 = $2;
  }
  HEAP32[$0 >> 2] = $5;
  HEAP32[$0 + 4 >> 2] = $6;
  HEAP32[$0 + 8 >> 2] = $7;
  HEAP32[$0 + 12 >> 2] = $8;
  global$0 = $11 + 112 | 0;
 }
 
 function __extenddftf2($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
  $6 = global$0 - 16 | 0;
  global$0 = $6;
  wasm2js_scratch_store_f64(+$1);
  $8 = wasm2js_scratch_load_i32(1) | 0;
  $7 = wasm2js_scratch_load_i32(0) | 0;
  $4 = $8 & 2147483647;
  $2 = $4;
  $5 = $2 + -1048576 | 0;
  $3 = $7;
  $4 = $3;
  if ($3 >>> 0 < 0) {
   $5 = $5 + 1 | 0
  }
  label$1 : {
   if (($5 | 0) == 2145386495 & $4 >>> 0 <= 4294967295 | $5 >>> 0 < 2145386495) {
    $4 = $3 << 28;
    $5 = ($2 & 15) << 28 | $3 >>> 4;
    $2 = ($2 >>> 4 | 0) + 1006632960 | 0;
    $3 = $5;
    $2 = $3 >>> 0 < 0 ? $2 + 1 | 0 : $2;
    break label$1;
   }
   if (($2 | 0) == 2146435072 & $3 >>> 0 >= 0 | $2 >>> 0 > 2146435072) {
    $4 = $7 << 28;
    $5 = $7;
    $2 = $8;
    $7 = $2 >>> 4 | 0;
    $3 = ($2 & 15) << 28 | $5 >>> 4;
    $2 = $7 | 2147418112;
    break label$1;
   }
   if (!($2 | $3)) {
    $4 = 0;
    $3 = 0;
    $2 = 0;
    break label$1;
   }
   $4 = $2;
   $2 = ($2 | 0) == 1 & $3 >>> 0 < 0 | $2 >>> 0 < 1 ? Math_clz32($7) + 32 | 0 : Math_clz32($2);
   __ashlti3($6, $3, $4, 0, 0, $2 + 49 | 0);
   $9 = HEAP32[$6 >> 2];
   $4 = HEAP32[$6 + 4 >> 2];
   $3 = HEAP32[$6 + 8 >> 2];
   $2 = HEAP32[$6 + 12 >> 2] ^ 65536 | 15372 - $2 << 16;
  }
  HEAP32[$0 >> 2] = $9;
  HEAP32[$0 + 4 >> 2] = $4;
  HEAP32[$0 + 8 >> 2] = $3;
  HEAP32[$0 + 12 >> 2] = $8 & -2147483648 | $2;
  global$0 = $6 + 16 | 0;
 }
 
 function __letf2($0, $1, $2, $3, $4, $5, $6, $7) {
  var $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0;
  $9 = 1;
  $8 = $3 & 2147483647;
  $12 = $8;
  $10 = $2;
  label$1 : {
   if (!$2 & ($8 | 0) == 2147418112 ? $0 | $1 : ($8 | 0) == 2147418112 & $2 >>> 0 > 0 | $8 >>> 0 > 2147418112) {
    break label$1
   }
   $11 = $7 & 2147483647;
   $13 = $11;
   $8 = $6;
   if (!$6 & ($11 | 0) == 2147418112 ? $4 | $5 : ($11 | 0) == 2147418112 & $6 >>> 0 > 0 | $11 >>> 0 > 2147418112) {
    break label$1
   }
   if (!($0 | $4 | ($8 | $10) | ($1 | $5 | ($12 | $13)))) {
    return 0
   }
   $10 = $3 & $7;
   if (($10 | 0) > 0 ? 1 : ($10 | 0) >= 0 ? (($2 & $6) >>> 0 < 0 ? 0 : 1) : 0) {
    $9 = -1;
    if (($2 | 0) == ($6 | 0) & ($3 | 0) == ($7 | 0) ? ($1 | 0) == ($5 | 0) & $0 >>> 0 < $4 >>> 0 | $1 >>> 0 < $5 >>> 0 : ($3 | 0) < ($7 | 0) ? 1 : ($3 | 0) <= ($7 | 0) ? ($2 >>> 0 >= $6 >>> 0 ? 0 : 1) : 0) {
     break label$1
    }
    return ($0 ^ $4 | $2 ^ $6) != 0 | ($1 ^ $5 | $3 ^ $7) != 0;
   }
   $9 = -1;
   if (($2 | 0) == ($6 | 0) & ($3 | 0) == ($7 | 0) ? ($1 | 0) == ($5 | 0) & $0 >>> 0 > $4 >>> 0 | $1 >>> 0 > $5 >>> 0 : ($3 | 0) > ($7 | 0) ? 1 : ($3 | 0) >= ($7 | 0) ? ($2 >>> 0 <= $6 >>> 0 ? 0 : 1) : 0) {
    break label$1
   }
   $9 = ($0 ^ $4 | $2 ^ $6) != 0 | ($1 ^ $5 | $3 ^ $7) != 0;
  }
  return $9;
 }
 
 function __getf2($0, $1, $2, $3) {
  var $4 = 0, $5 = 0, $6 = 0, $7 = 0;
  $6 = -1;
  $4 = $3 & 2147483647;
  $7 = $4;
  $5 = $2;
  label$1 : {
   if (!$2 & ($4 | 0) == 2147418112 ? $0 | $1 : ($4 | 0) == 2147418112 & $2 >>> 0 > 0 | $4 >>> 0 > 2147418112) {
    break label$1
   }
   if (!($0 | $5 | ($1 | ($7 | 1073610752)))) {
    return 0
   }
   $5 = $3 & 1073610752;
   if (($5 | 0) > 0 ? 1 : ($5 | 0) >= 0 ? 1 : 0) {
    if (!$2 & ($3 | 0) == 1073610752 ? !$1 & $0 >>> 0 < 0 | $1 >>> 0 < 0 : ($3 | 0) < 1073610752 ? 1 : ($3 | 0) <= 1073610752 ? ($2 >>> 0 >= 0 ? 0 : 1) : 0) {
     break label$1
    }
    return ($0 | $2) != 0 | ($1 | $3 ^ 1073610752) != 0;
   }
   if (!$2 & ($3 | 0) == 1073610752 ? !$1 & $0 >>> 0 > 0 | $1 >>> 0 > 0 : ($3 | 0) > 1073610752 ? 1 : ($3 | 0) >= 1073610752 ? ($2 >>> 0 <= 0 ? 0 : 1) : 0) {
    break label$1
   }
   $6 = ($0 | $2) != 0 | ($1 | $3 ^ 1073610752) != 0;
  }
  return $6;
 }
 
 function copysignl($0, $1, $2, $3, $4, $5, $6, $7, $8) {
  HEAP32[$0 >> 2] = $1;
  HEAP32[$0 + 4 >> 2] = $2;
  HEAP32[$0 + 8 >> 2] = $3;
  HEAP32[$0 + 12 >> 2] = $4 & 65535 | ($8 >>> 16 & 32768 | $4 >>> 16 & 32767) << 16;
 }
 
 function __floatunsitf($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
  $2 = global$0 - 16 | 0;
  global$0 = $2;
  $6 = $0;
  $7 = $0;
  label$1 : {
   if (!$1) {
    $1 = 0;
    $3 = 0;
    break label$1;
   }
   $3 = $1;
   $1 = Math_clz32($1) ^ 31;
   __ashlti3($2, $3, 0, 0, 0, 112 - $1 | 0);
   $1 = (HEAP32[$2 + 12 >> 2] ^ 65536) + ($1 + 16383 << 16) | 0;
   $4 = 0 + HEAP32[$2 + 8 >> 2] | 0;
   if ($4 >>> 0 < $5 >>> 0) {
    $1 = $1 + 1 | 0
   }
   $5 = HEAP32[$2 + 4 >> 2];
   $3 = HEAP32[$2 >> 2];
  }
  HEAP32[$7 >> 2] = $3;
  HEAP32[$6 + 4 >> 2] = $5;
  HEAP32[$0 + 8 >> 2] = $4;
  HEAP32[$0 + 12 >> 2] = $1;
  global$0 = $2 + 16 | 0;
 }
 
 function __subtf3($0, $1, $2, $3, $4, $5, $6, $7, $8) {
  var $9 = 0;
  $9 = global$0 - 16 | 0;
  global$0 = $9;
  __addtf3($9, $1, $2, $3, $4, $5, $6, $7, $8 ^ -2147483648);
  $1 = HEAP32[$9 + 4 >> 2];
  HEAP32[$0 >> 2] = HEAP32[$9 >> 2];
  HEAP32[$0 + 4 >> 2] = $1;
  $1 = HEAP32[$9 + 12 >> 2];
  HEAP32[$0 + 8 >> 2] = HEAP32[$9 + 8 >> 2];
  HEAP32[$0 + 12 >> 2] = $1;
  global$0 = $9 + 16 | 0;
 }
 
 function scalbnl($0, $1, $2, $3, $4, $5) {
  var $6 = 0;
  $6 = global$0 - 80 | 0;
  global$0 = $6;
  label$1 : {
   if (($5 | 0) >= 16384) {
    __multf3($6 + 32 | 0, $1, $2, $3, $4, 0, 0, 0, 2147352576);
    $3 = HEAP32[$6 + 40 >> 2];
    $4 = HEAP32[$6 + 44 >> 2];
    $1 = HEAP32[$6 + 32 >> 2];
    $2 = HEAP32[$6 + 36 >> 2];
    if (($5 | 0) < 32767) {
     $5 = $5 + -16383 | 0;
     break label$1;
    }
    __multf3($6 + 16 | 0, $1, $2, $3, $4, 0, 0, 0, 2147352576);
    $5 = (($5 | 0) < 49149 ? $5 : 49149) + -32766 | 0;
    $3 = HEAP32[$6 + 24 >> 2];
    $4 = HEAP32[$6 + 28 >> 2];
    $1 = HEAP32[$6 + 16 >> 2];
    $2 = HEAP32[$6 + 20 >> 2];
    break label$1;
   }
   if (($5 | 0) > -16383) {
    break label$1
   }
   __multf3($6 - -64 | 0, $1, $2, $3, $4, 0, 0, 0, 65536);
   $3 = HEAP32[$6 + 72 >> 2];
   $4 = HEAP32[$6 + 76 >> 2];
   $1 = HEAP32[$6 + 64 >> 2];
   $2 = HEAP32[$6 + 68 >> 2];
   if (($5 | 0) > -32765) {
    $5 = $5 + 16382 | 0;
    break label$1;
   }
   __multf3($6 + 48 | 0, $1, $2, $3, $4, 0, 0, 0, 65536);
   $5 = (($5 | 0) > -49146 ? $5 : -49146) + 32764 | 0;
   $3 = HEAP32[$6 + 56 >> 2];
   $4 = HEAP32[$6 + 60 >> 2];
   $1 = HEAP32[$6 + 48 >> 2];
   $2 = HEAP32[$6 + 52 >> 2];
  }
  __multf3($6, $1, $2, $3, $4, 0, 0, 0, $5 + 16383 << 16);
  $1 = HEAP32[$6 + 12 >> 2];
  HEAP32[$0 + 8 >> 2] = HEAP32[$6 + 8 >> 2];
  HEAP32[$0 + 12 >> 2] = $1;
  $1 = HEAP32[$6 + 4 >> 2];
  HEAP32[$0 >> 2] = HEAP32[$6 >> 2];
  HEAP32[$0 + 4 >> 2] = $1;
  global$0 = $6 + 80 | 0;
 }
 
 function __multi3($0, $1, $2, $3, $4) {
  var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0;
  $5 = __wasm_i64_mul($1, $2, 0, 0);
  $6 = i64toi32_i32$HIGH_BITS;
  $7 = __wasm_i64_mul(0, 0, $3, $4);
  $5 = $5 + $7 | 0;
  $6 = i64toi32_i32$HIGH_BITS + $6 | 0;
  $9 = __wasm_i64_mul($4, 0, $2, 0);
  $8 = $5 + $9 | 0;
  $5 = i64toi32_i32$HIGH_BITS + ($5 >>> 0 < $7 >>> 0 ? $6 + 1 | 0 : $6) | 0;
  $6 = __wasm_i64_mul($3, 0, $1, 0);
  $10 = i64toi32_i32$HIGH_BITS;
  $7 = __wasm_i64_mul($2, 0, $3, 0);
  $3 = $10 + $7 | 0;
  $2 = $8 >>> 0 < $9 >>> 0 ? $5 + 1 | 0 : $5;
  $5 = i64toi32_i32$HIGH_BITS;
  $5 = $3 >>> 0 < $7 >>> 0 ? $5 + 1 | 0 : $5;
  $8 = $5 + $8 | 0;
  if ($8 >>> 0 < $5 >>> 0) {
   $2 = $2 + 1 | 0
  }
  $1 = __wasm_i64_mul($1, 0, $4, 0) + $3 | 0;
  $4 = i64toi32_i32$HIGH_BITS;
  $3 = $1 >>> 0 < $3 >>> 0 ? $4 + 1 | 0 : $4;
  $4 = $8 + $3 | 0;
  if ($4 >>> 0 < $3 >>> 0) {
   $2 = $2 + 1 | 0
  }
  HEAP32[$0 + 8 >> 2] = $4;
  HEAP32[$0 + 12 >> 2] = $2;
  HEAP32[$0 >> 2] = $6;
  HEAP32[$0 + 4 >> 2] = $1;
 }
 
 function __divtf3($0, $1, $2, $3, $4, $5, $6, $7, $8) {
  var $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0, $41 = 0;
  $13 = global$0 - 192 | 0;
  global$0 = $13;
  $29 = $7;
  $32 = $8 & 65535;
  $16 = $3;
  $14 = $4 & 65535;
  $28 = ($4 ^ $8) & -2147483648;
  $17 = $8 >>> 16 & 32767;
  label$1 : {
   $19 = $4 >>> 16 & 32767;
   label$2 : {
    label$3 : {
     if ($19 + -1 >>> 0 <= 32765) {
      if ($17 + -1 >>> 0 < 32766) {
       break label$3
      }
     }
     $10 = $4 & 2147483647;
     $11 = $10;
     $9 = $3;
     if (!(!$9 & ($10 | 0) == 2147418112 ? !($1 | $2) : ($10 | 0) == 2147418112 & $9 >>> 0 < 0 | $10 >>> 0 < 2147418112)) {
      $33 = $3;
      $28 = $4 | 32768;
      break label$2;
     }
     $10 = $8 & 2147483647;
     $4 = $10;
     $3 = $7;
     if (!(!$3 & ($10 | 0) == 2147418112 ? !($5 | $6) : ($10 | 0) == 2147418112 & $3 >>> 0 < 0 | $10 >>> 0 < 2147418112)) {
      $33 = $7;
      $28 = $8 | 32768;
      $1 = $5;
      $2 = $6;
      break label$2;
     }
     if (!($1 | $9 | ($11 ^ 2147418112 | $2))) {
      if (!($3 | $5 | ($4 ^ 2147418112 | $6))) {
       $1 = 0;
       $2 = 0;
       $28 = 2147450880;
       break label$2;
      }
      $28 = $28 | 2147418112;
      $1 = 0;
      $2 = 0;
      break label$2;
     }
     if (!($3 | $5 | ($4 ^ 2147418112 | $6))) {
      $1 = 0;
      $2 = 0;
      break label$2;
     }
     if (!($1 | $9 | ($2 | $11))) {
      break label$1
     }
     if (!($3 | $5 | ($4 | $6))) {
      $28 = $28 | 2147418112;
      $1 = 0;
      $2 = 0;
      break label$2;
     }
     $10 = 0;
     if (($11 | 0) == 65535 & $9 >>> 0 <= 4294967295 | $11 >>> 0 < 65535) {
      $9 = $1;
      $7 = !($14 | $16);
      $8 = $7 << 6;
      $10 = Math_clz32($7 ? $1 : $16) + 32 | 0;
      $1 = Math_clz32($7 ? $2 : $14);
      $1 = $8 + (($1 | 0) == 32 ? $10 : $1) | 0;
      __ashlti3($13 + 176 | 0, $9, $2, $16, $14, $1 + -15 | 0);
      $10 = 16 - $1 | 0;
      $16 = HEAP32[$13 + 184 >> 2];
      $14 = HEAP32[$13 + 188 >> 2];
      $2 = HEAP32[$13 + 180 >> 2];
      $1 = HEAP32[$13 + 176 >> 2];
     }
     if (($4 | 0) == 65535 & $3 >>> 0 > 4294967295 | $4 >>> 0 > 65535) {
      break label$3
     }
     $3 = !($29 | $32);
     $4 = $3 << 6;
     $7 = Math_clz32($3 ? $5 : $29) + 32 | 0;
     $3 = Math_clz32($3 ? $6 : $32);
     $3 = $4 + (($3 | 0) == 32 ? $7 : $3) | 0;
     __ashlti3($13 + 160 | 0, $5, $6, $29, $32, $3 + -15 | 0);
     $10 = ($3 + $10 | 0) + -16 | 0;
     $29 = HEAP32[$13 + 168 >> 2];
     $32 = HEAP32[$13 + 172 >> 2];
     $5 = HEAP32[$13 + 160 >> 2];
     $6 = HEAP32[$13 + 164 >> 2];
    }
    $4 = $32 | 65536;
    $31 = $4;
    $38 = $29;
    $3 = $29;
    $12 = $4 << 15 | $3 >>> 17;
    $3 = $3 << 15 | $6 >>> 17;
    $7 = -102865788 - $3 | 0;
    $4 = $12;
    $9 = $4;
    $8 = 1963258675 - ($9 + (4192101508 < $3 >>> 0) | 0) | 0;
    __multi3($13 + 144 | 0, $3, $9, $7, $8);
    $9 = HEAP32[$13 + 152 >> 2];
    __multi3($13 + 128 | 0, 0 - $9 | 0, 0 - (HEAP32[$13 + 156 >> 2] + (0 < $9 >>> 0) | 0) | 0, $7, $8);
    $7 = HEAP32[$13 + 136 >> 2];
    $8 = $7 << 1 | HEAP32[$13 + 132 >> 2] >>> 31;
    $7 = HEAP32[$13 + 140 >> 2] << 1 | $7 >>> 31;
    __multi3($13 + 112 | 0, $8, $7, $3, $4);
    $9 = $7;
    $7 = HEAP32[$13 + 120 >> 2];
    __multi3($13 + 96 | 0, $8, $9, 0 - $7 | 0, 0 - (HEAP32[$13 + 124 >> 2] + (0 < $7 >>> 0) | 0) | 0);
    $7 = HEAP32[$13 + 104 >> 2];
    $11 = HEAP32[$13 + 108 >> 2] << 1 | $7 >>> 31;
    $8 = $7 << 1 | HEAP32[$13 + 100 >> 2] >>> 31;
    __multi3($13 + 80 | 0, $8, $11, $3, $4);
    $7 = HEAP32[$13 + 88 >> 2];
    __multi3($13 - -64 | 0, $8, $11, 0 - $7 | 0, 0 - (HEAP32[$13 + 92 >> 2] + (0 < $7 >>> 0) | 0) | 0);
    $7 = HEAP32[$13 + 72 >> 2];
    $8 = $7 << 1 | HEAP32[$13 + 68 >> 2] >>> 31;
    $7 = HEAP32[$13 + 76 >> 2] << 1 | $7 >>> 31;
    __multi3($13 + 48 | 0, $8, $7, $3, $4);
    $9 = $7;
    $7 = HEAP32[$13 + 56 >> 2];
    __multi3($13 + 32 | 0, $8, $9, 0 - $7 | 0, 0 - (HEAP32[$13 + 60 >> 2] + (0 < $7 >>> 0) | 0) | 0);
    $7 = HEAP32[$13 + 40 >> 2];
    $11 = HEAP32[$13 + 44 >> 2] << 1 | $7 >>> 31;
    $8 = $7 << 1 | HEAP32[$13 + 36 >> 2] >>> 31;
    __multi3($13 + 16 | 0, $8, $11, $3, $4);
    $7 = HEAP32[$13 + 24 >> 2];
    __multi3($13, $8, $11, 0 - $7 | 0, 0 - (HEAP32[$13 + 28 >> 2] + (0 < $7 >>> 0) | 0) | 0);
    $34 = ($19 - $17 | 0) + $10 | 0;
    $7 = HEAP32[$13 + 8 >> 2];
    $9 = HEAP32[$13 + 12 >> 2] << 1 | $7 >>> 31;
    $8 = $7 << 1;
    $10 = $9 + -1 | 0;
    $8 = (HEAP32[$13 + 4 >> 2] >>> 31 | $8) + -1 | 0;
    if ($8 >>> 0 < 4294967295) {
     $10 = $10 + 1 | 0
    }
    $7 = $8;
    $9 = 0;
    $21 = $9;
    $20 = $4;
    $11 = 0;
    $12 = __wasm_i64_mul($7, $9, $4, $11);
    $4 = i64toi32_i32$HIGH_BITS;
    $19 = $4;
    $22 = $10;
    $17 = 0;
    $9 = $3;
    $7 = __wasm_i64_mul($10, $17, $9, 0);
    $3 = $7 + $12 | 0;
    $10 = i64toi32_i32$HIGH_BITS + $4 | 0;
    $10 = $3 >>> 0 < $7 >>> 0 ? $10 + 1 | 0 : $10;
    $7 = $3;
    $3 = $10;
    $15 = __wasm_i64_mul($8, $21, $9, $15);
    $4 = 0 + $15 | 0;
    $10 = $7;
    $9 = $10 + i64toi32_i32$HIGH_BITS | 0;
    $9 = $4 >>> 0 < $15 >>> 0 ? $9 + 1 | 0 : $9;
    $15 = $4;
    $4 = $9;
    $9 = ($10 | 0) == ($9 | 0) & $15 >>> 0 < $23 >>> 0 | $9 >>> 0 < $10 >>> 0;
    $10 = ($3 | 0) == ($19 | 0) & $10 >>> 0 < $12 >>> 0 | $3 >>> 0 < $19 >>> 0;
    $7 = $3;
    $3 = __wasm_i64_mul($22, $17, $20, $11) + $3 | 0;
    $11 = $10 + i64toi32_i32$HIGH_BITS | 0;
    $11 = $3 >>> 0 < $7 >>> 0 ? $11 + 1 | 0 : $11;
    $7 = $3;
    $3 = $9 + $3 | 0;
    $9 = $11;
    $26 = $3;
    $7 = $3 >>> 0 < $7 >>> 0 ? $9 + 1 | 0 : $9;
    $3 = $6;
    $24 = ($3 & 131071) << 15 | $5 >>> 17;
    $20 = __wasm_i64_mul($8, $21, $24, 0);
    $3 = i64toi32_i32$HIGH_BITS;
    $23 = $3;
    $10 = $5;
    $18 = $10 << 15 & -32768;
    $11 = __wasm_i64_mul($22, $17, $18, 0);
    $9 = $11 + $20 | 0;
    $10 = i64toi32_i32$HIGH_BITS + $3 | 0;
    $10 = $9 >>> 0 < $11 >>> 0 ? $10 + 1 | 0 : $10;
    $3 = $10;
    $25 = __wasm_i64_mul($8, $21, $18, $25);
    $18 = 0 + $25 | 0;
    $10 = $9 + i64toi32_i32$HIGH_BITS | 0;
    $10 = $18 >>> 0 < $25 >>> 0 ? $10 + 1 | 0 : $10;
    $10 = ($9 | 0) == ($10 | 0) & $18 >>> 0 < $30 >>> 0 | $10 >>> 0 < $9 >>> 0;
    $9 = ($3 | 0) == ($23 | 0) & $9 >>> 0 < $20 >>> 0 | $3 >>> 0 < $23 >>> 0;
    $12 = $3;
    $3 = __wasm_i64_mul($22, $17, $24, $27) + $3 | 0;
    $11 = $9 + i64toi32_i32$HIGH_BITS | 0;
    $11 = $3 >>> 0 < $12 >>> 0 ? $11 + 1 | 0 : $11;
    $9 = $3;
    $3 = $10 + $9 | 0;
    $12 = $3 >>> 0 < $9 >>> 0 ? $11 + 1 | 0 : $11;
    $10 = $3;
    $3 = $15 + $3 | 0;
    $9 = $12 + $4 | 0;
    $9 = $3 >>> 0 < $10 >>> 0 ? $9 + 1 | 0 : $9;
    $19 = $3;
    $10 = $7;
    $20 = $9;
    $3 = ($4 | 0) == ($9 | 0) & $3 >>> 0 < $15 >>> 0 | $9 >>> 0 < $4 >>> 0;
    $4 = $3 + $26 | 0;
    if ($4 >>> 0 < $3 >>> 0) {
     $10 = $10 + 1 | 0
    }
    $9 = $10;
    $3 = ($19 | 0) != 0 | ($20 | 0) != 0;
    $4 = $4 + $3 | 0;
    if ($4 >>> 0 < $3 >>> 0) {
     $9 = $9 + 1 | 0
    }
    $10 = $4;
    $4 = 0 - $10 | 0;
    $15 = 0;
    $7 = __wasm_i64_mul($4, $15, $8, $21);
    $3 = i64toi32_i32$HIGH_BITS;
    $23 = $3;
    $18 = __wasm_i64_mul($22, $17, $4, $15);
    $4 = i64toi32_i32$HIGH_BITS;
    $26 = $4;
    $24 = 0 - ((0 < $10 >>> 0) + $9 | 0) | 0;
    $9 = 0;
    $15 = __wasm_i64_mul($8, $21, $24, $9);
    $12 = $15 + $18 | 0;
    $10 = i64toi32_i32$HIGH_BITS + $4 | 0;
    $10 = $12 >>> 0 < $15 >>> 0 ? $10 + 1 | 0 : $10;
    $4 = $12;
    $15 = 0 + $7 | 0;
    $11 = $3 + $4 | 0;
    $11 = $15 >>> 0 < $27 >>> 0 ? $11 + 1 | 0 : $11;
    $12 = $15;
    $3 = $11;
    $11 = ($23 | 0) == ($3 | 0) & $12 >>> 0 < $7 >>> 0 | $3 >>> 0 < $23 >>> 0;
    $12 = ($10 | 0) == ($26 | 0) & $4 >>> 0 < $18 >>> 0 | $10 >>> 0 < $26 >>> 0;
    $4 = __wasm_i64_mul($22, $17, $24, $9) + $10 | 0;
    $9 = $12 + i64toi32_i32$HIGH_BITS | 0;
    $9 = $4 >>> 0 < $10 >>> 0 ? $9 + 1 | 0 : $9;
    $7 = $4;
    $4 = $11 + $4 | 0;
    if ($4 >>> 0 < $7 >>> 0) {
     $9 = $9 + 1 | 0
    }
    $24 = $4;
    $7 = $9;
    $4 = 0 - $19 | 0;
    $27 = 0 - ((0 < $19 >>> 0) + $20 | 0) | 0;
    $19 = 0;
    $26 = __wasm_i64_mul($27, $19, $8, $21);
    $18 = i64toi32_i32$HIGH_BITS;
    $20 = $4;
    $25 = 0;
    $9 = __wasm_i64_mul($4, $25, $22, $17);
    $4 = $9 + $26 | 0;
    $10 = i64toi32_i32$HIGH_BITS + $18 | 0;
    $11 = $4;
    $4 = $4 >>> 0 < $9 >>> 0 ? $10 + 1 | 0 : $10;
    $20 = __wasm_i64_mul($8, $21, $20, $25);
    $8 = 0 + $20 | 0;
    $9 = $11;
    $10 = $9 + i64toi32_i32$HIGH_BITS | 0;
    $10 = $8 >>> 0 < $20 >>> 0 ? $10 + 1 | 0 : $10;
    $10 = ($9 | 0) == ($10 | 0) & $8 >>> 0 < $30 >>> 0 | $10 >>> 0 < $9 >>> 0;
    $9 = ($4 | 0) == ($18 | 0) & $9 >>> 0 < $26 >>> 0 | $4 >>> 0 < $18 >>> 0;
    $8 = $4;
    $4 = __wasm_i64_mul($27, $19, $22, $17) + $4 | 0;
    $12 = $9 + i64toi32_i32$HIGH_BITS | 0;
    $12 = $4 >>> 0 < $8 >>> 0 ? $12 + 1 | 0 : $12;
    $8 = $4;
    $4 = $10 + $4 | 0;
    $9 = $12;
    $9 = $4 >>> 0 < $8 >>> 0 ? $9 + 1 | 0 : $9;
    $8 = $4;
    $4 = $15 + $4 | 0;
    $9 = $9 + $3 | 0;
    $9 = $4 >>> 0 < $8 >>> 0 ? $9 + 1 | 0 : $9;
    $8 = $4;
    $10 = $7;
    $4 = $9;
    $3 = ($3 | 0) == ($9 | 0) & $8 >>> 0 < $15 >>> 0 | $9 >>> 0 < $3 >>> 0;
    $7 = $3 + $24 | 0;
    if ($7 >>> 0 < $3 >>> 0) {
     $10 = $10 + 1 | 0
    }
    $3 = $7;
    $9 = $10;
    $12 = $3;
    $11 = $4 + -1 | 0;
    $3 = $8 + -2 | 0;
    if ($3 >>> 0 < 4294967294) {
     $11 = $11 + 1 | 0
    }
    $7 = $3;
    $10 = $3;
    $3 = $11;
    $4 = ($4 | 0) == ($3 | 0) & $10 >>> 0 < $8 >>> 0 | $3 >>> 0 < $4 >>> 0;
    $8 = $12 + $4 | 0;
    if ($8 >>> 0 < $4 >>> 0) {
     $9 = $9 + 1 | 0
    }
    $4 = $8 + -1 | 0;
    $10 = $9 + -1 | 0;
    $10 = $4 >>> 0 < 4294967295 ? $10 + 1 | 0 : $10;
    $8 = 0;
    $22 = $8;
    $17 = $4;
    $9 = $16;
    $18 = $9 << 2 | $2 >>> 30;
    $24 = 0;
    $12 = __wasm_i64_mul($4, $8, $18, $24);
    $8 = i64toi32_i32$HIGH_BITS;
    $15 = $8;
    $11 = $8;
    $8 = $2;
    $27 = ($8 & 1073741823) << 2 | $1 >>> 30;
    $25 = $10;
    $8 = 0;
    $9 = __wasm_i64_mul($27, 0, $10, $8);
    $4 = $9 + $12 | 0;
    $11 = i64toi32_i32$HIGH_BITS + $11 | 0;
    $11 = $4 >>> 0 < $9 >>> 0 ? $11 + 1 | 0 : $11;
    $9 = $4;
    $20 = $11;
    $23 = ($15 | 0) == ($11 | 0) & $9 >>> 0 < $12 >>> 0 | $11 >>> 0 < $15 >>> 0;
    $12 = $11;
    $11 = 0;
    $15 = $11;
    $10 = 0;
    $26 = $3;
    $30 = (($14 & 1073741823) << 2 | $16 >>> 30) & -262145 | 262144;
    $4 = __wasm_i64_mul($3, $11, $30, 0);
    $3 = $4 + $9 | 0;
    $12 = i64toi32_i32$HIGH_BITS + $12 | 0;
    $12 = $3 >>> 0 < $4 >>> 0 ? $12 + 1 | 0 : $12;
    $16 = $3;
    $4 = $12;
    $3 = ($20 | 0) == ($4 | 0) & $3 >>> 0 < $9 >>> 0 | $4 >>> 0 < $20 >>> 0;
    $9 = $3 + $23 | 0;
    if ($9 >>> 0 < $3 >>> 0) {
     $10 = 1
    }
    $11 = __wasm_i64_mul($25, $8, $30, $35);
    $3 = $11 + $9 | 0;
    $9 = i64toi32_i32$HIGH_BITS + $10 | 0;
    $10 = $3 >>> 0 < $11 >>> 0 ? $9 + 1 | 0 : $9;
    $11 = __wasm_i64_mul($17, $22, $30, $35);
    $9 = i64toi32_i32$HIGH_BITS;
    $2 = $3;
    $14 = __wasm_i64_mul($18, $24, $25, $8);
    $3 = $14 + $11 | 0;
    $12 = i64toi32_i32$HIGH_BITS + $9 | 0;
    $12 = $3 >>> 0 < $14 >>> 0 ? $12 + 1 | 0 : $12;
    $14 = $3;
    $3 = $12;
    $12 = ($9 | 0) == ($3 | 0) & $14 >>> 0 < $11 >>> 0 | $3 >>> 0 < $9 >>> 0;
    $11 = $2 + $3 | 0;
    $10 = $10 + $12 | 0;
    $9 = $11;
    $12 = $9 >>> 0 < $3 >>> 0 ? $10 + 1 | 0 : $10;
    $2 = $9;
    $11 = $4 + $14 | 0;
    $10 = 0;
    $3 = $10 + $16 | 0;
    if ($3 >>> 0 < $10 >>> 0) {
     $11 = $11 + 1 | 0
    }
    $14 = $3;
    $9 = $3;
    $3 = $11;
    $4 = ($4 | 0) == ($3 | 0) & $9 >>> 0 < $16 >>> 0 | $3 >>> 0 < $4 >>> 0;
    $9 = $2 + $4 | 0;
    if ($9 >>> 0 < $4 >>> 0) {
     $12 = $12 + 1 | 0
    }
    $39 = $9;
    $4 = $14;
    $10 = $3;
    $16 = __wasm_i64_mul($27, $19, $26, $15);
    $11 = i64toi32_i32$HIGH_BITS;
    $20 = $7;
    $23 = __wasm_i64_mul($7, 0, $18, $24);
    $7 = $23 + $16 | 0;
    $9 = i64toi32_i32$HIGH_BITS + $11 | 0;
    $9 = $7 >>> 0 < $23 >>> 0 ? $9 + 1 | 0 : $9;
    $21 = $7;
    $7 = $9;
    $16 = ($11 | 0) == ($9 | 0) & $21 >>> 0 < $16 >>> 0 | $9 >>> 0 < $11 >>> 0;
    $11 = $9;
    $40 = $4;
    $9 = 0;
    $41 = $16;
    $36 = $1 << 2 & -4;
    $2 = 0;
    $16 = __wasm_i64_mul($17, $22, $36, $2);
    $4 = $16 + $21 | 0;
    $11 = i64toi32_i32$HIGH_BITS + $11 | 0;
    $11 = $4 >>> 0 < $16 >>> 0 ? $11 + 1 | 0 : $11;
    $23 = $4;
    $16 = $4;
    $4 = $11;
    $7 = ($7 | 0) == ($4 | 0) & $16 >>> 0 < $21 >>> 0 | $4 >>> 0 < $7 >>> 0;
    $11 = $41 + $7 | 0;
    if ($11 >>> 0 < $7 >>> 0) {
     $9 = 1
    }
    $7 = $40 + $11 | 0;
    $10 = $9 + $10 | 0;
    $10 = $7 >>> 0 < $11 >>> 0 ? $10 + 1 | 0 : $10;
    $16 = $7;
    $11 = $12;
    $7 = $10;
    $3 = ($3 | 0) == ($10 | 0) & $16 >>> 0 < $14 >>> 0 | $10 >>> 0 < $3 >>> 0;
    $9 = $3 + $39 | 0;
    if ($9 >>> 0 < $3 >>> 0) {
     $11 = $11 + 1 | 0
    }
    $40 = $9;
    $14 = $16;
    $21 = $7;
    $39 = __wasm_i64_mul($25, $8, $36, $2);
    $25 = i64toi32_i32$HIGH_BITS;
    $8 = __wasm_i64_mul($30, $35, $20, $37);
    $3 = $8 + $39 | 0;
    $12 = i64toi32_i32$HIGH_BITS + $25 | 0;
    $12 = $3 >>> 0 < $8 >>> 0 ? $12 + 1 | 0 : $12;
    $30 = $3;
    $9 = __wasm_i64_mul($18, $24, $26, $15);
    $3 = $3 + $9 | 0;
    $8 = $12;
    $10 = $8 + i64toi32_i32$HIGH_BITS | 0;
    $10 = $3 >>> 0 < $9 >>> 0 ? $10 + 1 | 0 : $10;
    $18 = $3;
    $12 = __wasm_i64_mul($17, $22, $27, $19);
    $3 = $3 + $12 | 0;
    $9 = i64toi32_i32$HIGH_BITS + $10 | 0;
    $17 = $3;
    $9 = $3 >>> 0 < $12 >>> 0 ? $9 + 1 | 0 : $9;
    $22 = 0;
    $12 = $11;
    $3 = $9;
    $9 = ($9 | 0) == ($10 | 0) & $17 >>> 0 < $18 >>> 0 | $9 >>> 0 < $10 >>> 0;
    $11 = ($8 | 0) == ($25 | 0) & $30 >>> 0 < $39 >>> 0 | $8 >>> 0 < $25 >>> 0;
    $8 = ($8 | 0) == ($10 | 0) & $18 >>> 0 < $30 >>> 0 | $10 >>> 0 < $8 >>> 0;
    $10 = $11 + $8 | 0;
    $10 >>> 0 < $8 >>> 0;
    $8 = $9 + $10 | 0;
    $10 = $8;
    $9 = $3 | 0;
    $8 = $9 + $14 | 0;
    $10 = ($10 | $22) + $21 | 0;
    $10 = $8 >>> 0 < $9 >>> 0 ? $10 + 1 | 0 : $10;
    $21 = $8;
    $14 = $10;
    $7 = ($7 | 0) == ($10 | 0) & $8 >>> 0 < $16 >>> 0 | $10 >>> 0 < $7 >>> 0;
    $8 = $7 + $40 | 0;
    if ($8 >>> 0 < $7 >>> 0) {
     $12 = $12 + 1 | 0
    }
    $24 = $8;
    $8 = $12;
    $12 = $21;
    $16 = $14;
    $22 = $23;
    $26 = __wasm_i64_mul($26, $15, $36, $2);
    $15 = i64toi32_i32$HIGH_BITS;
    $9 = __wasm_i64_mul($27, $19, $20, $37);
    $7 = $9 + $26 | 0;
    $11 = i64toi32_i32$HIGH_BITS + $15 | 0;
    $11 = $7 >>> 0 < $9 >>> 0 ? $11 + 1 | 0 : $11;
    $10 = $11;
    $19 = $10;
    $11 = 0;
    $9 = ($10 | 0) == ($15 | 0) & $7 >>> 0 < $26 >>> 0 | $10 >>> 0 < $15 >>> 0;
    $7 = $10 + $22 | 0;
    $10 = ($9 | $11) + $4 | 0;
    $10 = $7 >>> 0 < $19 >>> 0 ? $10 + 1 | 0 : $10;
    $19 = $7;
    $9 = $7;
    $7 = $10;
    $9 = ($4 | 0) == ($10 | 0) & $9 >>> 0 < $22 >>> 0 | $10 >>> 0 < $4 >>> 0;
    $23 = $12;
    $4 = $9;
    $9 = $10 + $17 | 0;
    $12 = 0;
    $3 = $12 + $19 | 0;
    if ($3 >>> 0 < $12 >>> 0) {
     $9 = $9 + 1 | 0
    }
    $3 = ($7 | 0) == ($9 | 0) & $3 >>> 0 < $19 >>> 0 | $9 >>> 0 < $7 >>> 0;
    $4 = $4 + $3 | 0;
    if ($4 >>> 0 < $3 >>> 0) {
     $11 = 1
    }
    $3 = $23 + $4 | 0;
    $12 = $11 + $16 | 0;
    $7 = $3;
    $9 = $8;
    $12 = $3 >>> 0 < $4 >>> 0 ? $12 + 1 | 0 : $12;
    $8 = $12;
    $3 = ($14 | 0) == ($8 | 0) & $3 >>> 0 < $21 >>> 0 | $8 >>> 0 < $14 >>> 0;
    $4 = $3 + $24 | 0;
    if ($4 >>> 0 < $3 >>> 0) {
     $9 = $9 + 1 | 0
    }
    $3 = $4;
    $4 = $9;
    label$12 : {
     if (($9 | 0) == 131071 & $3 >>> 0 <= 4294967295 | $9 >>> 0 < 131071) {
      $22 = 0;
      $14 = $5;
      $18 = 0;
      $10 = __wasm_i64_mul($7, $22, $14, $18);
      $11 = i64toi32_i32$HIGH_BITS;
      $9 = $1 << 17;
      $1 = 0;
      $2 = ($10 | 0) != 0 | ($11 | 0) != 0;
      $16 = $1 - $2 | 0;
      $30 = $9 - ($1 >>> 0 < $2 >>> 0) | 0;
      $19 = 0 - $10 | 0;
      $15 = 0 - ((0 < $10 >>> 0) + $11 | 0) | 0;
      $2 = 0;
      $24 = __wasm_i64_mul($8, $2, $14, $18);
      $1 = i64toi32_i32$HIGH_BITS;
      $27 = $1;
      $17 = 0;
      $10 = __wasm_i64_mul($7, $22, $6, $17);
      $9 = $10 + $24 | 0;
      $11 = i64toi32_i32$HIGH_BITS + $1 | 0;
      $11 = $9 >>> 0 < $10 >>> 0 ? $11 + 1 | 0 : $11;
      $1 = $9;
      $10 = $9;
      $20 = 0;
      $9 = $20;
      $23 = $10;
      $9 = ($10 | 0) == ($15 | 0) & $19 >>> 0 < $9 >>> 0 | $15 >>> 0 < $10 >>> 0;
      $21 = $16 - $9 | 0;
      $30 = $30 - ($16 >>> 0 < $9 >>> 0) | 0;
      $9 = __wasm_i64_mul($3, 0, $14, $18);
      $10 = i64toi32_i32$HIGH_BITS;
      $14 = __wasm_i64_mul($7, $22, $29, 0);
      $9 = $14 + $9 | 0;
      $12 = i64toi32_i32$HIGH_BITS + $10 | 0;
      $12 = $9 >>> 0 < $14 >>> 0 ? $12 + 1 | 0 : $12;
      $14 = __wasm_i64_mul($8, $2, $6, $17);
      $9 = $14 + $9 | 0;
      $10 = i64toi32_i32$HIGH_BITS + $12 | 0;
      $10 = $9 >>> 0 < $14 >>> 0 ? $10 + 1 | 0 : $10;
      $12 = $10;
      $10 = ($11 | 0) == ($27 | 0) & $1 >>> 0 < $24 >>> 0 | $11 >>> 0 < $27 >>> 0;
      $1 = $11 + $9 | 0;
      $10 = $10 + $12 | 0;
      $10 = $1 >>> 0 < $11 >>> 0 ? $10 + 1 | 0 : $10;
      $11 = $1;
      $1 = $10;
      $9 = __wasm_i64_mul($7, $8, $31, 0);
      $14 = i64toi32_i32$HIGH_BITS;
      $16 = $11;
      $11 = __wasm_i64_mul($5, $6, $4, 0);
      $10 = $11 + $9 | 0;
      $9 = i64toi32_i32$HIGH_BITS + $14 | 0;
      $9 = $10 >>> 0 < $11 >>> 0 ? $9 + 1 | 0 : $9;
      $12 = __wasm_i64_mul($3, $4, $6, $17);
      $11 = $12 + $10 | 0;
      $9 = __wasm_i64_mul($8, $2, $29, $32);
      $2 = $9 + $11 | 0;
      $9 = $2;
      $10 = 0;
      $2 = $16 + $10 | 0;
      $9 = $1 + $9 | 0;
      $1 = $2;
      $16 = $21 - $1 | 0;
      $2 = $30 - (($21 >>> 0 < $1 >>> 0) + ($1 >>> 0 < $10 >>> 0 ? $9 + 1 | 0 : $9) | 0) | 0;
      $34 = $34 + -1 | 0;
      $29 = $19 - $20 | 0;
      $1 = $15 - (($19 >>> 0 < $20 >>> 0) + $23 | 0) | 0;
      break label$12;
     }
     $17 = $8 >>> 1 | 0;
     $11 = 0;
     $12 = $1 << 16;
     $10 = $3 << 31;
     $7 = ($8 & 1) << 31 | $7 >>> 1;
     $8 = $8 >>> 1 | $10;
     $27 = 0;
     $25 = 0;
     $1 = __wasm_i64_mul($7, $27, $5, $25);
     $9 = i64toi32_i32$HIGH_BITS;
     $10 = $9;
     $9 = ($1 | 0) != 0 | ($9 | 0) != 0;
     $14 = $2 - $9 | 0;
     $37 = $12 - ($2 >>> 0 < $9 >>> 0) | 0;
     $21 = 0 - $1 | 0;
     $22 = 0 - ((0 < $1 >>> 0) + $10 | 0) | 0;
     $12 = $22;
     $15 = 0;
     $20 = __wasm_i64_mul($7, $27, $6, $15);
     $1 = i64toi32_i32$HIGH_BITS;
     $35 = $1;
     $23 = $17 | $3 << 31;
     $36 = $4 << 31 | $3 >>> 1 | $11;
     $10 = $23;
     $17 = __wasm_i64_mul($10, 0, $5, $25);
     $2 = $17 + $20 | 0;
     $9 = i64toi32_i32$HIGH_BITS + $1 | 0;
     $9 = $2 >>> 0 < $17 >>> 0 ? $9 + 1 | 0 : $9;
     $1 = $9;
     $9 = $2;
     $26 = $9;
     $18 = 0;
     $9 = ($9 | 0) == ($12 | 0) & $21 >>> 0 < $18 >>> 0 | $12 >>> 0 < $9 >>> 0;
     $24 = $14 - $9 | 0;
     $37 = $37 - ($14 >>> 0 < $9 >>> 0) | 0;
     $10 = __wasm_i64_mul($6, $15, $10, $11);
     $11 = i64toi32_i32$HIGH_BITS;
     $9 = $4;
     $12 = $9 >>> 1 | 0;
     $17 = ($9 & 1) << 31 | $3 >>> 1;
     $14 = $12;
     $12 = __wasm_i64_mul($17, 0, $5, $25);
     $9 = $12 + $10 | 0;
     $10 = i64toi32_i32$HIGH_BITS + $11 | 0;
     $10 = $9 >>> 0 < $12 >>> 0 ? $10 + 1 | 0 : $10;
     $12 = __wasm_i64_mul($7, $27, $29, 0);
     $11 = $12 + $9 | 0;
     $9 = i64toi32_i32$HIGH_BITS + $10 | 0;
     $10 = $11;
     $11 = $10 >>> 0 < $12 >>> 0 ? $9 + 1 | 0 : $9;
     $9 = ($1 | 0) == ($35 | 0) & $2 >>> 0 < $20 >>> 0 | $1 >>> 0 < $35 >>> 0;
     $2 = $1;
     $1 = $1 + $10 | 0;
     $11 = $9 + $11 | 0;
     $9 = $1;
     $1 = $9 >>> 0 < $2 >>> 0 ? $11 + 1 | 0 : $11;
     $2 = __wasm_i64_mul($7, $8, $31, 0);
     $10 = i64toi32_i32$HIGH_BITS;
     $11 = $9;
     $3 = __wasm_i64_mul($5, $6, $4 >>> 1 | 0, 0);
     $2 = $3 + $2 | 0;
     $9 = i64toi32_i32$HIGH_BITS + $10 | 0;
     $9 = $2 >>> 0 < $3 >>> 0 ? $9 + 1 | 0 : $9;
     $3 = __wasm_i64_mul($6, $15, $17, $14);
     $2 = $3 + $2 | 0;
     $9 = i64toi32_i32$HIGH_BITS + $9 | 0;
     $3 = __wasm_i64_mul($23, $36, $29, $32);
     $2 = $3 + $2 | 0;
     $9 = $2;
     $3 = 0;
     $2 = $11 + $3 | 0;
     $10 = $1 + $9 | 0;
     $1 = $2;
     $16 = $24 - $1 | 0;
     $2 = $37 - (($24 >>> 0 < $1 >>> 0) + ($1 >>> 0 < $3 >>> 0 ? $10 + 1 | 0 : $10) | 0) | 0;
     $3 = $17;
     $4 = $14;
     $29 = $21 - $18 | 0;
     $1 = $22 - (($21 >>> 0 < $18 >>> 0) + $26 | 0) | 0;
    }
    if (($34 | 0) >= 16384) {
     $28 = $28 | 2147418112;
     $1 = 0;
     $2 = 0;
     break label$2;
    }
    $11 = $34 + 16383 | 0;
    if (($34 | 0) <= -16383) {
     label$16 : {
      if ($11) {
       break label$16
      }
      $11 = $8;
      $14 = $29;
      $12 = $1 << 1 | $14 >>> 31;
      $9 = $14 << 1;
      $6 = ($6 | 0) == ($12 | 0) & $9 >>> 0 > $5 >>> 0 | $12 >>> 0 > $6 >>> 0;
      $9 = $4 & 65535;
      $5 = $16;
      $12 = $2 << 1 | $5 >>> 31;
      $2 = $5 << 1 | $1 >>> 31;
      $4 = $2;
      $1 = $12;
      $1 = ($4 | 0) == ($38 | 0) & ($1 | 0) == ($31 | 0) ? $6 : ($31 | 0) == ($1 | 0) & $4 >>> 0 > $38 >>> 0 | $1 >>> 0 > $31 >>> 0;
      $2 = $1 + $7 | 0;
      if ($2 >>> 0 < $1 >>> 0) {
       $11 = $11 + 1 | 0
      }
      $1 = $2;
      $4 = $1;
      $2 = $11;
      $4 = $3 + (($8 | 0) == ($11 | 0) & $4 >>> 0 < $7 >>> 0 | $11 >>> 0 < $8 >>> 0) | 0;
      if ($4 >>> 0 < $3 >>> 0) {
       $9 = $9 + 1 | 0
      }
      $3 = $9;
      if (!($9 & 65536)) {
       break label$16
      }
      $33 = $4 | $33;
      $28 = $3 | $28;
      break label$2;
     }
     $1 = 0;
     $2 = 0;
     break label$2;
    }
    $10 = $8;
    $4 = $4 & 65535;
    $14 = $29;
    $9 = $1 << 1 | $14 >>> 31;
    $14 = $14 << 1;
    $6 = ($6 | 0) == ($9 | 0) & $14 >>> 0 >= $5 >>> 0 | $9 >>> 0 > $6 >>> 0;
    $5 = $16;
    $9 = $2 << 1 | $5 >>> 31;
    $2 = $5 << 1 | $1 >>> 31;
    $1 = ($2 | 0) == ($38 | 0) & ($9 | 0) == ($31 | 0) ? $6 : ($31 | 0) == ($9 | 0) & $2 >>> 0 >= $38 >>> 0 | $9 >>> 0 > $31 >>> 0;
    $2 = $1 + $7 | 0;
    if ($2 >>> 0 < $1 >>> 0) {
     $10 = $10 + 1 | 0
    }
    $1 = $2;
    $2 = $10;
    $5 = $3;
    $3 = (($8 | 0) == ($10 | 0) & $1 >>> 0 < $7 >>> 0 | $10 >>> 0 < $8 >>> 0) + $3 | 0;
    $10 = $11 << 16 | $4;
    $33 = $3 | $33;
    $28 = $28 | ($3 >>> 0 < $5 >>> 0 ? $10 + 1 | 0 : $10);
   }
   HEAP32[$0 >> 2] = $1;
   HEAP32[$0 + 4 >> 2] = $2;
   HEAP32[$0 + 8 >> 2] = $33;
   HEAP32[$0 + 12 >> 2] = $28;
   global$0 = $13 + 192 | 0;
   return;
  }
  HEAP32[$0 >> 2] = 0;
  HEAP32[$0 + 4 >> 2] = 0;
  $1 = ($3 | $5) != 0 | ($4 | $6) != 0;
  HEAP32[$0 + 8 >> 2] = $1 ? $33 : 0;
  HEAP32[$0 + 12 >> 2] = $1 ? $28 : 2147450880;
  global$0 = $13 + 192 | 0;
 }
 
 function __fpclassifyl($0, $1, $2, $3) {
  var $4 = 0, $5 = 0;
  $5 = $3 & 65535;
  $3 = $3 >>> 16 & 32767;
  label$1 : {
   if (($3 | 0) != 32767) {
    $4 = 4;
    if ($3) {
     break label$1
    }
    return $0 | $2 | ($1 | $5) ? 3 : 2;
   }
   $4 = !($0 | $2 | ($1 | $5));
  }
  return $4;
 }
 
 function fmodl($0, $1, $2, $3, $4, $5, $6, $7, $8) {
  var $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0;
  $9 = global$0 - 128 | 0;
  global$0 = $9;
  label$1 : {
   label$2 : {
    label$3 : {
     if (!__letf2($5, $6, $7, $8, 0, 0, 0, 0)) {
      break label$3
     }
     $11 = __fpclassifyl($5, $6, $7, $8);
     $19 = $4 >>> 16 | 0;
     $14 = $19 & 32767;
     if (($14 | 0) == 32767) {
      break label$3
     }
     if ($11) {
      break label$2
     }
    }
    __multf3($9 + 16 | 0, $1, $2, $3, $4, $5, $6, $7, $8);
    $4 = HEAP32[$9 + 16 >> 2];
    $3 = HEAP32[$9 + 20 >> 2];
    $2 = HEAP32[$9 + 24 >> 2];
    $1 = HEAP32[$9 + 28 >> 2];
    __divtf3($9, $4, $3, $2, $1, $4, $3, $2, $1);
    $3 = HEAP32[$9 + 8 >> 2];
    $4 = HEAP32[$9 + 12 >> 2];
    $7 = HEAP32[$9 >> 2];
    $8 = HEAP32[$9 + 4 >> 2];
    break label$1;
   }
   $10 = $4 & 65535 | $14 << 16;
   $13 = $10;
   $12 = $3;
   $15 = $7;
   $18 = $8 >>> 16 & 32767;
   $11 = $8 & 65535 | $18 << 16;
   if ((__letf2($1, $2, $12, $10, $5, $6, $7, $11) | 0) <= 0) {
    if (__letf2($1, $2, $12, $13, $5, $6, $15, $11)) {
     $7 = $1;
     $8 = $2;
     break label$1;
    }
    __multf3($9 + 112 | 0, $1, $2, $3, $4, 0, 0, 0, 0);
    $3 = HEAP32[$9 + 120 >> 2];
    $4 = HEAP32[$9 + 124 >> 2];
    $7 = HEAP32[$9 + 112 >> 2];
    $8 = HEAP32[$9 + 116 >> 2];
    break label$1;
   }
   if ($14) {
    $8 = $2;
    $7 = $1;
   } else {
    __multf3($9 + 96 | 0, $1, $2, $12, $13, 0, 0, 0, 1081540608);
    $7 = HEAP32[$9 + 108 >> 2];
    $13 = $7;
    $12 = HEAP32[$9 + 104 >> 2];
    $14 = ($7 >>> 16 | 0) + -120 | 0;
    $8 = HEAP32[$9 + 100 >> 2];
    $7 = HEAP32[$9 + 96 >> 2];
   }
   if (!$18) {
    __multf3($9 + 80 | 0, $5, $6, $15, $11, 0, 0, 0, 1081540608);
    $5 = HEAP32[$9 + 92 >> 2];
    $11 = $5;
    $15 = HEAP32[$9 + 88 >> 2];
    $18 = ($11 >>> 16 | 0) + -120 | 0;
    $6 = HEAP32[$9 + 84 >> 2];
    $5 = HEAP32[$9 + 80 >> 2];
   }
   $21 = $15;
   $10 = $15;
   $15 = $12 - $10 | 0;
   $13 = $13 & 65535 | 65536;
   $20 = $11 & 65535 | 65536;
   $11 = ($6 | 0) == ($8 | 0) & $7 >>> 0 < $5 >>> 0 | $8 >>> 0 < $6 >>> 0;
   $10 = ($13 - ($20 + ($12 >>> 0 < $10 >>> 0) | 0) | 0) - ($15 >>> 0 < $11 >>> 0) | 0;
   $16 = $15 - $11 | 0;
   $17 = ($10 | 0) > -1 ? 1 : ($10 | 0) >= -1 ? ($16 >>> 0 <= 4294967295 ? 0 : 1) : 0;
   $15 = $7 - $5 | 0;
   $11 = $8 - (($7 >>> 0 < $5 >>> 0) + $6 | 0) | 0;
   if (($14 | 0) > ($18 | 0)) {
    while (1) {
     label$11 : {
      if ($17 & 1) {
       if (!($15 | $16 | ($10 | $11))) {
        __multf3($9 + 32 | 0, $1, $2, $3, $4, 0, 0, 0, 0);
        $3 = HEAP32[$9 + 40 >> 2];
        $4 = HEAP32[$9 + 44 >> 2];
        $7 = HEAP32[$9 + 32 >> 2];
        $8 = HEAP32[$9 + 36 >> 2];
        break label$1;
       }
       $7 = $16;
       $17 = $10 << 1 | $7 >>> 31;
       $16 = $7 << 1;
       $10 = $17;
       $17 = 0;
       $7 = $11 >>> 31 | 0;
       break label$11;
      }
      $10 = 0;
      $11 = $8;
      $16 = $8 >>> 31 | 0;
      $15 = $7;
      $7 = $12;
      $17 = $13 << 1 | $7 >>> 31;
      $7 = $7 << 1;
     }
     $12 = $7 | $16;
     $8 = $12;
     $7 = $21;
     $16 = $8 - $7 | 0;
     $13 = $10 | $17;
     $10 = $13 - (($8 >>> 0 < $7 >>> 0) + $20 | 0) | 0;
     $7 = $15;
     $17 = $11 << 1 | $7 >>> 31;
     $7 = $7 << 1;
     $8 = $17;
     $11 = ($6 | 0) == ($8 | 0) & $7 >>> 0 < $5 >>> 0 | $8 >>> 0 < $6 >>> 0;
     $10 = $10 - ($16 >>> 0 < $11 >>> 0) | 0;
     $16 = $16 - $11 | 0;
     $17 = ($10 | 0) > -1 ? 1 : ($10 | 0) >= -1 ? ($16 >>> 0 <= 4294967295 ? 0 : 1) : 0;
     $15 = $7 - $5 | 0;
     $11 = $8 - (($7 >>> 0 < $5 >>> 0) + $6 | 0) | 0;
     $14 = $14 + -1 | 0;
     if (($14 | 0) > ($18 | 0)) {
      continue
     }
     break;
    };
    $14 = $18;
   }
   label$14 : {
    if (!$17) {
     break label$14
    }
    $7 = $15;
    $12 = $16;
    $8 = $11;
    $13 = $10;
    if ($7 | $12 | ($8 | $10)) {
     break label$14
    }
    __multf3($9 + 48 | 0, $1, $2, $3, $4, 0, 0, 0, 0);
    $3 = HEAP32[$9 + 56 >> 2];
    $4 = HEAP32[$9 + 60 >> 2];
    $7 = HEAP32[$9 + 48 >> 2];
    $8 = HEAP32[$9 + 52 >> 2];
    break label$1;
   }
   if (($13 | 0) == 65535 & $12 >>> 0 <= 4294967295 | $13 >>> 0 < 65535) {
    while (1) {
     $3 = $8 >>> 31 | 0;
     $1 = 0;
     $14 = $14 + -1 | 0;
     $10 = $8 << 1 | $7 >>> 31;
     $7 = $7 << 1;
     $8 = $10;
     $17 = $13 << 1 | $12 >>> 31;
     $12 = $12 << 1 | $3;
     $1 = $1 | $17;
     $13 = $1;
     if (($1 | 0) == 65536 & $12 >>> 0 < 0 | $1 >>> 0 < 65536) {
      continue
     }
     break;
    }
   }
   $1 = $19 & 32768;
   if (($14 | 0) <= 0) {
    __multf3($9 - -64 | 0, $7, $8, $12, $13 & 65535 | ($1 | $14 + 120) << 16, 0, 0, 0, 1065811968);
    $3 = HEAP32[$9 + 72 >> 2];
    $4 = HEAP32[$9 + 76 >> 2];
    $7 = HEAP32[$9 + 64 >> 2];
    $8 = HEAP32[$9 + 68 >> 2];
    break label$1;
   }
   $3 = $12;
   $4 = $13 & 65535 | ($1 | $14) << 16;
  }
  HEAP32[$0 >> 2] = $7;
  HEAP32[$0 + 4 >> 2] = $8;
  HEAP32[$0 + 8 >> 2] = $3;
  HEAP32[$0 + 12 >> 2] = $4;
  global$0 = $9 + 128 | 0;
 }
 
 function __floatscan($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0;
  $5 = global$0 - 48 | 0;
  global$0 = $5;
  $4 = $1 + 4 | 0;
  $7 = HEAP32[2640];
  $10 = HEAP32[2637];
  while (1) {
   $2 = HEAP32[$1 + 4 >> 2];
   label$4 : {
    if ($2 >>> 0 < HEAPU32[$1 + 104 >> 2]) {
     HEAP32[$4 >> 2] = $2 + 1;
     $2 = HEAPU8[$2 | 0];
     break label$4;
    }
    $2 = __shgetc($1);
   }
   if (($2 | 0) == 32 | $2 + -9 >>> 0 < 5) {
    continue
   }
   break;
  };
  $6 = 1;
  label$6 : {
   label$7 : {
    switch ($2 + -43 | 0) {
    case 0:
    case 2:
     break label$7;
    default:
     break label$6;
    };
   }
   $6 = ($2 | 0) == 45 ? -1 : 1;
   $2 = HEAP32[$1 + 4 >> 2];
   if ($2 >>> 0 < HEAPU32[$1 + 104 >> 2]) {
    HEAP32[$4 >> 2] = $2 + 1;
    $2 = HEAPU8[$2 | 0];
    break label$6;
   }
   $2 = __shgetc($1);
  }
  label$1 : {
   label$9 : {
    label$10 : {
     while (1) {
      if (HEAP8[$3 + 10468 | 0] == ($2 | 32)) {
       label$13 : {
        if ($3 >>> 0 > 6) {
         break label$13
        }
        $2 = HEAP32[$1 + 4 >> 2];
        if ($2 >>> 0 < HEAPU32[$1 + 104 >> 2]) {
         HEAP32[$4 >> 2] = $2 + 1;
         $2 = HEAPU8[$2 | 0];
         break label$13;
        }
        $2 = __shgetc($1);
       }
       $3 = $3 + 1 | 0;
       if (($3 | 0) != 8) {
        continue
       }
       break label$10;
      }
      break;
     };
     if (($3 | 0) != 3) {
      if (($3 | 0) == 8) {
       break label$10
      }
      if ($3 >>> 0 < 4) {
       break label$9
      }
      if (($3 | 0) == 8) {
       break label$10
      }
     }
     $1 = HEAP32[$1 + 104 >> 2];
     if ($1) {
      HEAP32[$4 >> 2] = HEAP32[$4 >> 2] + -1
     }
     if ($3 >>> 0 < 4) {
      break label$10
     }
     while (1) {
      if ($1) {
       HEAP32[$4 >> 2] = HEAP32[$4 >> 2] + -1
      }
      $3 = $3 + -1 | 0;
      if ($3 >>> 0 > 3) {
       continue
      }
      break;
     };
    }
    __extendsftf2($5, Math_fround(Math_fround($6 | 0) * Math_fround(infinity)));
    $6 = HEAP32[$5 + 8 >> 2];
    $2 = HEAP32[$5 + 12 >> 2];
    $8 = HEAP32[$5 >> 2];
    $9 = HEAP32[$5 + 4 >> 2];
    break label$1;
   }
   label$19 : {
    label$20 : {
     label$21 : {
      if ($3) {
       break label$21
      }
      $3 = 0;
      while (1) {
       if (HEAP8[$3 + 10477 | 0] != ($2 | 32)) {
        break label$21
       }
       label$23 : {
        if ($3 >>> 0 > 1) {
         break label$23
        }
        $2 = HEAP32[$1 + 4 >> 2];
        if ($2 >>> 0 < HEAPU32[$1 + 104 >> 2]) {
         HEAP32[$4 >> 2] = $2 + 1;
         $2 = HEAPU8[$2 | 0];
         break label$23;
        }
        $2 = __shgetc($1);
       }
       $3 = $3 + 1 | 0;
       if (($3 | 0) != 3) {
        continue
       }
       break;
      };
      break label$20;
     }
     label$25 : {
      switch ($3 | 0) {
      case 0:
       label$27 : {
        if (($2 | 0) != 48) {
         break label$27
        }
        $3 = HEAP32[$1 + 4 >> 2];
        label$28 : {
         if ($3 >>> 0 < HEAPU32[$1 + 104 >> 2]) {
          HEAP32[$4 >> 2] = $3 + 1;
          $3 = HEAPU8[$3 | 0];
          break label$28;
         }
         $3 = __shgetc($1);
        }
        if (($3 & -33) == 88) {
         hexfloat($5 + 16 | 0, $1, $10, $7, $6);
         $6 = HEAP32[$5 + 24 >> 2];
         $2 = HEAP32[$5 + 28 >> 2];
         $8 = HEAP32[$5 + 16 >> 2];
         $9 = HEAP32[$5 + 20 >> 2];
         break label$1;
        }
        if (!HEAP32[$1 + 104 >> 2]) {
         break label$27
        }
        HEAP32[$4 >> 2] = HEAP32[$4 >> 2] + -1;
       }
       decfloat($5 + 32 | 0, $1, $2, $10, $7, $6);
       $6 = HEAP32[$5 + 40 >> 2];
       $2 = HEAP32[$5 + 44 >> 2];
       $8 = HEAP32[$5 + 32 >> 2];
       $9 = HEAP32[$5 + 36 >> 2];
       break label$1;
      case 3:
       break label$20;
      default:
       break label$25;
      };
     }
     if (HEAP32[$1 + 104 >> 2]) {
      HEAP32[$4 >> 2] = HEAP32[$4 >> 2] + -1
     }
     break label$19;
    }
    label$32 : {
     $3 = HEAP32[$1 + 4 >> 2];
     label$33 : {
      if ($3 >>> 0 < HEAPU32[$1 + 104 >> 2]) {
       HEAP32[$4 >> 2] = $3 + 1;
       $2 = HEAPU8[$3 | 0];
       break label$33;
      }
      $2 = __shgetc($1);
     }
     if (($2 | 0) == 40) {
      $3 = 1;
      break label$32;
     }
     $6 = 0;
     $2 = 2147450880;
     if (!HEAP32[$1 + 104 >> 2]) {
      break label$1
     }
     HEAP32[$4 >> 2] = HEAP32[$4 >> 2] + -1;
     break label$1;
    }
    while (1) {
     $2 = HEAP32[$1 + 4 >> 2];
     label$37 : {
      if ($2 >>> 0 < HEAPU32[$1 + 104 >> 2]) {
       HEAP32[$4 >> 2] = $2 + 1;
       $7 = HEAPU8[$2 | 0];
       break label$37;
      }
      $7 = __shgetc($1);
     }
     if (!($7 + -97 >>> 0 >= 26 ? !($7 + -48 >>> 0 < 10 | $7 + -65 >>> 0 < 26 | ($7 | 0) == 95) : 0)) {
      $3 = $3 + 1 | 0;
      continue;
     }
     break;
    };
    $6 = 0;
    $2 = 2147450880;
    if (($7 | 0) == 41) {
     break label$1
    }
    $1 = HEAP32[$1 + 104 >> 2];
    if ($1) {
     HEAP32[$4 >> 2] = HEAP32[$4 >> 2] + -1
    }
    if (!$3) {
     break label$1
    }
    while (1) {
     $3 = $3 + -1 | 0;
     if ($1) {
      HEAP32[$4 >> 2] = HEAP32[$4 >> 2] + -1
     }
     if ($3) {
      continue
     }
     break;
    };
    break label$1;
   }
   HEAP32[2892] = 28;
   __shlim($1);
   $6 = 0;
   $2 = 0;
  }
  HEAP32[$0 >> 2] = $8;
  HEAP32[$0 + 4 >> 2] = $9;
  HEAP32[$0 + 8 >> 2] = $6;
  HEAP32[$0 + 12 >> 2] = $2;
  global$0 = $5 + 48 | 0;
 }
 
 function hexfloat($0, $1, $2, $3, $4) {
  var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
  $5 = global$0 - 432 | 0;
  global$0 = $5;
  $6 = HEAP32[$1 + 4 >> 2];
  label$1 : {
   if ($6 >>> 0 < HEAPU32[$1 + 104 >> 2]) {
    HEAP32[$1 + 4 >> 2] = $6 + 1;
    $7 = HEAPU8[$6 | 0];
    break label$1;
   }
   $7 = __shgetc($1);
  }
  label$3 : {
   label$4 : {
    while (1) {
     if (($7 | 0) != 48) {
      label$6 : {
       if (($7 | 0) != 46) {
        break label$3
       }
       $6 = HEAP32[$1 + 4 >> 2];
       if ($6 >>> 0 >= HEAPU32[$1 + 104 >> 2]) {
        break label$6
       }
       HEAP32[$1 + 4 >> 2] = $6 + 1;
       $7 = HEAPU8[$6 | 0];
       break label$4;
      }
     } else {
      $6 = HEAP32[$1 + 4 >> 2];
      if ($6 >>> 0 < HEAPU32[$1 + 104 >> 2]) {
       HEAP32[$1 + 4 >> 2] = $6 + 1;
       $7 = HEAPU8[$6 | 0];
      } else {
       $7 = __shgetc($1)
      }
      $21 = 1;
      continue;
     }
     break;
    };
    $7 = __shgetc($1);
   }
   $20 = 1;
   if (($7 | 0) != 48) {
    break label$3
   }
   while (1) {
    $6 = HEAP32[$1 + 4 >> 2];
    label$10 : {
     if ($6 >>> 0 < HEAPU32[$1 + 104 >> 2]) {
      HEAP32[$1 + 4 >> 2] = $6 + 1;
      $7 = HEAPU8[$6 | 0];
      break label$10;
     }
     $7 = __shgetc($1);
    }
    $13 = $13 + -1 | 0;
    $14 = $14 + -1 | 0;
    if ($14 >>> 0 < 4294967295) {
     $13 = $13 + 1 | 0
    }
    if (($7 | 0) == 48) {
     continue
    }
    break;
   };
   $21 = 1;
  }
  $12 = 1073676288;
  $6 = 0;
  while (1) {
   label$13 : {
    $22 = $7 | 32;
    label$14 : {
     label$15 : {
      $23 = $7 + -48 | 0;
      if ($23 >>> 0 < 10) {
       break label$15
      }
      if ($22 + -97 >>> 0 > 5 ? ($7 | 0) != 46 : 0) {
       break label$13
      }
      if (($7 | 0) != 46) {
       break label$15
      }
      if ($20) {
       break label$13
      }
      $20 = 1;
      $14 = $9;
      $13 = $6;
      break label$14;
     }
     $7 = ($7 | 0) > 57 ? $22 + -87 | 0 : $23;
     label$16 : {
      if (($6 | 0) < 0 ? 1 : ($6 | 0) <= 0 ? ($9 >>> 0 > 7 ? 0 : 1) : 0) {
       $15 = $7 + ($15 << 4) | 0;
       break label$16;
      }
      if (($6 | 0) < 0 ? 1 : ($6 | 0) <= 0 ? ($9 >>> 0 > 28 ? 0 : 1) : 0) {
       __floatsitf($5 + 48 | 0, $7);
       __multf3($5 + 32 | 0, $18, $19, $8, $12, 0, 0, 0, 1073414144);
       $18 = HEAP32[$5 + 32 >> 2];
       $19 = HEAP32[$5 + 36 >> 2];
       $8 = HEAP32[$5 + 40 >> 2];
       $12 = HEAP32[$5 + 44 >> 2];
       __multf3($5 + 16 | 0, $18, $19, $8, $12, HEAP32[$5 + 48 >> 2], HEAP32[$5 + 52 >> 2], HEAP32[$5 + 56 >> 2], HEAP32[$5 + 60 >> 2]);
       __addtf3($5, $10, $11, $16, $17, HEAP32[$5 + 16 >> 2], HEAP32[$5 + 20 >> 2], HEAP32[$5 + 24 >> 2], HEAP32[$5 + 28 >> 2]);
       $16 = HEAP32[$5 + 8 >> 2];
       $17 = HEAP32[$5 + 12 >> 2];
       $10 = HEAP32[$5 >> 2];
       $11 = HEAP32[$5 + 4 >> 2];
       break label$16;
      }
      if (!$7 | $24) {
       break label$16
      }
      __multf3($5 + 80 | 0, $18, $19, $8, $12, 0, 0, 0, 1073610752);
      __addtf3($5 - -64 | 0, $10, $11, $16, $17, HEAP32[$5 + 80 >> 2], HEAP32[$5 + 84 >> 2], HEAP32[$5 + 88 >> 2], HEAP32[$5 + 92 >> 2]);
      $16 = HEAP32[$5 + 72 >> 2];
      $17 = HEAP32[$5 + 76 >> 2];
      $24 = 1;
      $10 = HEAP32[$5 + 64 >> 2];
      $11 = HEAP32[$5 + 68 >> 2];
     }
     $9 = $9 + 1 | 0;
     if ($9 >>> 0 < 1) {
      $6 = $6 + 1 | 0
     }
     $21 = 1;
    }
    $7 = HEAP32[$1 + 4 >> 2];
    if ($7 >>> 0 < HEAPU32[$1 + 104 >> 2]) {
     HEAP32[$1 + 4 >> 2] = $7 + 1;
     $7 = HEAPU8[$7 | 0];
    } else {
     $7 = __shgetc($1)
    }
    continue;
   }
   break;
  };
  label$20 : {
   label$21 : {
    if (!$21) {
     if (!HEAP32[$1 + 104 >> 2]) {
      break label$21
     }
     $2 = HEAP32[$1 + 4 >> 2];
     HEAP32[$1 + 4 >> 2] = $2 + -1;
     HEAP32[$1 + 4 >> 2] = $2 + -2;
     if (!$20) {
      break label$21
     }
     HEAP32[$1 + 4 >> 2] = $2 + -3;
     break label$21;
    }
    if (($6 | 0) < 0 ? 1 : ($6 | 0) <= 0 ? ($9 >>> 0 > 7 ? 0 : 1) : 0) {
     $8 = $9;
     $12 = $6;
     while (1) {
      $15 = $15 << 4;
      $8 = $8 + 1 | 0;
      if ($8 >>> 0 < 1) {
       $12 = $12 + 1 | 0
      }
      if (($8 | 0) != 8 | $12) {
       continue
      }
      break;
     };
    }
    label$27 : {
     if (($7 & -33) == 80) {
      $8 = scanexp($1);
      $7 = i64toi32_i32$HIGH_BITS;
      $12 = $7;
      if ($8 | ($7 | 0) != -2147483648) {
       break label$27
      }
      $8 = 0;
      $12 = 0;
      if (!HEAP32[$1 + 104 >> 2]) {
       break label$27
      }
      HEAP32[$1 + 4 >> 2] = HEAP32[$1 + 4 >> 2] + -1;
      break label$27;
     }
     $8 = 0;
     $12 = 0;
     if (!HEAP32[$1 + 104 >> 2]) {
      break label$27
     }
     HEAP32[$1 + 4 >> 2] = HEAP32[$1 + 4 >> 2] + -1;
    }
    if (!$15) {
     __extenddftf2($5 + 112 | 0, +($4 | 0) * 0.0);
     $10 = HEAP32[$5 + 112 >> 2];
     $11 = HEAP32[$5 + 116 >> 2];
     $2 = HEAP32[$5 + 120 >> 2];
     $1 = HEAP32[$5 + 124 >> 2];
     break label$20;
    }
    $1 = $20 ? $14 : $9;
    $6 = ($20 ? $13 : $6) << 2 | $1 >>> 30;
    $1 = $8 + ($1 << 2) | 0;
    $13 = $1 + -32 | 0;
    $9 = $13;
    $14 = 0 - $3 | 0;
    $6 = $6 + $12 | 0;
    $1 = ($1 >>> 0 < $8 >>> 0 ? $6 + 1 | 0 : $6) + -1 | 0;
    $6 = $9 >>> 0 < 4294967264 ? $1 + 1 | 0 : $1;
    $1 = $14 >> 31;
    if (($6 | 0) > ($1 | 0) ? 1 : ($6 | 0) >= ($1 | 0) ? ($9 >>> 0 <= $14 >>> 0 ? 0 : 1) : 0) {
     HEAP32[2892] = 68;
     __floatsitf($5 + 160 | 0, $4);
     __multf3($5 + 144 | 0, HEAP32[$5 + 160 >> 2], HEAP32[$5 + 164 >> 2], HEAP32[$5 + 168 >> 2], HEAP32[$5 + 172 >> 2], -1, -1, -1, 2147418111);
     __multf3($5 + 128 | 0, HEAP32[$5 + 144 >> 2], HEAP32[$5 + 148 >> 2], HEAP32[$5 + 152 >> 2], HEAP32[$5 + 156 >> 2], -1, -1, -1, 2147418111);
     $10 = HEAP32[$5 + 128 >> 2];
     $11 = HEAP32[$5 + 132 >> 2];
     $2 = HEAP32[$5 + 136 >> 2];
     $1 = HEAP32[$5 + 140 >> 2];
     break label$20;
    }
    $1 = $3 + -226 | 0;
    $7 = $9 >>> 0 < $1 >>> 0 ? 0 : 1;
    $1 = $1 >> 31;
    if (($6 | 0) > ($1 | 0) ? 1 : ($6 | 0) >= ($1 | 0) ? $7 : 0) {
     if (($15 | 0) > -1) {
      while (1) {
       __addtf3($5 + 416 | 0, $10, $11, $16, $17, 0, 0, 0, -1073807360);
       $1 = __getf2($10, $11, $16, $17);
       $8 = ($1 | 0) < 0;
       __addtf3($5 + 400 | 0, $10, $11, $16, $17, $8 ? $10 : HEAP32[$5 + 416 >> 2], $8 ? $11 : HEAP32[$5 + 420 >> 2], $8 ? $16 : HEAP32[$5 + 424 >> 2], $8 ? $17 : HEAP32[$5 + 428 >> 2]);
       $6 = $6 + -1 | 0;
       $9 = $9 + -1 | 0;
       if ($9 >>> 0 < 4294967295) {
        $6 = $6 + 1 | 0
       }
       $16 = HEAP32[$5 + 408 >> 2];
       $17 = HEAP32[$5 + 412 >> 2];
       $10 = HEAP32[$5 + 400 >> 2];
       $11 = HEAP32[$5 + 404 >> 2];
       $15 = $15 << 1 | ($1 | 0) > -1;
       if (($15 | 0) > -1) {
        continue
       }
       break;
      }
     }
     $1 = ($9 - $3 | 0) + 32 | 0;
     $8 = $1;
     $7 = $2;
     $12 = $1 >>> 0 >= $2 >>> 0 ? 0 : 1;
     $3 = $6 - (($3 >> 31) + ($9 >>> 0 < $3 >>> 0) | 0) | 0;
     $1 = $1 >>> 0 < 32 ? $3 + 1 | 0 : $3;
     $2 = $2 >> 31;
     $1 = (($1 | 0) < ($2 | 0) ? 1 : ($1 | 0) <= ($2 | 0) ? $12 : 0) ? (($8 | 0) > 0 ? $8 : 0) : $7;
     label$35 : {
      if (($1 | 0) >= 113) {
       __floatsitf($5 + 384 | 0, $4);
       $14 = HEAP32[$5 + 392 >> 2];
       $13 = HEAP32[$5 + 396 >> 2];
       $18 = HEAP32[$5 + 384 >> 2];
       $19 = HEAP32[$5 + 388 >> 2];
       $6 = 0;
       $4 = 0;
       $3 = 0;
       $2 = 0;
       break label$35;
      }
      __extenddftf2($5 + 352 | 0, scalbn(1.0, 144 - $1 | 0));
      __floatsitf($5 + 336 | 0, $4);
      $18 = HEAP32[$5 + 336 >> 2];
      $19 = HEAP32[$5 + 340 >> 2];
      $14 = HEAP32[$5 + 344 >> 2];
      $13 = HEAP32[$5 + 348 >> 2];
      copysignl($5 + 368 | 0, HEAP32[$5 + 352 >> 2], HEAP32[$5 + 356 >> 2], HEAP32[$5 + 360 >> 2], HEAP32[$5 + 364 >> 2], $18, $19, $14, $13);
      $6 = HEAP32[$5 + 376 >> 2];
      $4 = HEAP32[$5 + 380 >> 2];
      $3 = HEAP32[$5 + 372 >> 2];
      $2 = HEAP32[$5 + 368 >> 2];
     }
     $1 = !($15 & 1) & ((__letf2($10, $11, $16, $17, 0, 0, 0, 0) | 0) != 0 & ($1 | 0) < 32);
     __floatunsitf($5 + 320 | 0, $1 + $15 | 0);
     __multf3($5 + 304 | 0, $18, $19, $14, $13, HEAP32[$5 + 320 >> 2], HEAP32[$5 + 324 >> 2], HEAP32[$5 + 328 >> 2], HEAP32[$5 + 332 >> 2]);
     __addtf3($5 + 272 | 0, HEAP32[$5 + 304 >> 2], HEAP32[$5 + 308 >> 2], HEAP32[$5 + 312 >> 2], HEAP32[$5 + 316 >> 2], $2, $3, $6, $4);
     __multf3($5 + 288 | 0, $1 ? 0 : $10, $1 ? 0 : $11, $1 ? 0 : $16, $1 ? 0 : $17, $18, $19, $14, $13);
     __addtf3($5 + 256 | 0, HEAP32[$5 + 288 >> 2], HEAP32[$5 + 292 >> 2], HEAP32[$5 + 296 >> 2], HEAP32[$5 + 300 >> 2], HEAP32[$5 + 272 >> 2], HEAP32[$5 + 276 >> 2], HEAP32[$5 + 280 >> 2], HEAP32[$5 + 284 >> 2]);
     __subtf3($5 + 240 | 0, HEAP32[$5 + 256 >> 2], HEAP32[$5 + 260 >> 2], HEAP32[$5 + 264 >> 2], HEAP32[$5 + 268 >> 2], $2, $3, $6, $4);
     $1 = HEAP32[$5 + 240 >> 2];
     $2 = HEAP32[$5 + 244 >> 2];
     $3 = HEAP32[$5 + 248 >> 2];
     $4 = HEAP32[$5 + 252 >> 2];
     if (!__letf2($1, $2, $3, $4, 0, 0, 0, 0)) {
      HEAP32[2892] = 68
     }
     scalbnl($5 + 224 | 0, $1, $2, $3, $4, $9);
     $10 = HEAP32[$5 + 224 >> 2];
     $11 = HEAP32[$5 + 228 >> 2];
     $2 = HEAP32[$5 + 232 >> 2];
     $1 = HEAP32[$5 + 236 >> 2];
     break label$20;
    }
    HEAP32[2892] = 68;
    __floatsitf($5 + 208 | 0, $4);
    __multf3($5 + 192 | 0, HEAP32[$5 + 208 >> 2], HEAP32[$5 + 212 >> 2], HEAP32[$5 + 216 >> 2], HEAP32[$5 + 220 >> 2], 0, 0, 0, 65536);
    __multf3($5 + 176 | 0, HEAP32[$5 + 192 >> 2], HEAP32[$5 + 196 >> 2], HEAP32[$5 + 200 >> 2], HEAP32[$5 + 204 >> 2], 0, 0, 0, 65536);
    $10 = HEAP32[$5 + 176 >> 2];
    $11 = HEAP32[$5 + 180 >> 2];
    $2 = HEAP32[$5 + 184 >> 2];
    $1 = HEAP32[$5 + 188 >> 2];
    break label$20;
   }
   __extenddftf2($5 + 96 | 0, +($4 | 0) * 0.0);
   $10 = HEAP32[$5 + 96 >> 2];
   $11 = HEAP32[$5 + 100 >> 2];
   $2 = HEAP32[$5 + 104 >> 2];
   $1 = HEAP32[$5 + 108 >> 2];
  }
  HEAP32[$0 >> 2] = $10;
  HEAP32[$0 + 4 >> 2] = $11;
  HEAP32[$0 + 8 >> 2] = $2;
  HEAP32[$0 + 12 >> 2] = $1;
  global$0 = $5 + 432 | 0;
 }
 
 function decfloat($0, $1, $2, $3, $4, $5) {
  var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0.0, $25 = 0;
  $6 = global$0 - 8960 | 0;
  global$0 = $6;
  $20 = $3 + $4 | 0;
  $25 = 0 - $20 | 0;
  label$1 : {
   label$2 : {
    while (1) {
     if (($2 | 0) != 48) {
      label$4 : {
       if (($2 | 0) != 46) {
        break label$1
       }
       $2 = HEAP32[$1 + 4 >> 2];
       if ($2 >>> 0 >= HEAPU32[$1 + 104 >> 2]) {
        break label$4
       }
       HEAP32[$1 + 4 >> 2] = $2 + 1;
       $2 = HEAPU8[$2 | 0];
       break label$2;
      }
     } else {
      $2 = HEAP32[$1 + 4 >> 2];
      if ($2 >>> 0 < HEAPU32[$1 + 104 >> 2]) {
       $14 = 1;
       HEAP32[$1 + 4 >> 2] = $2 + 1;
       $2 = HEAPU8[$2 | 0];
      } else {
       $14 = 1;
       $2 = __shgetc($1);
      }
      continue;
     }
     break;
    };
    $2 = __shgetc($1);
   }
   $10 = 1;
   if (($2 | 0) != 48) {
    break label$1
   }
   while (1) {
    $2 = HEAP32[$1 + 4 >> 2];
    label$8 : {
     if ($2 >>> 0 < HEAPU32[$1 + 104 >> 2]) {
      HEAP32[$1 + 4 >> 2] = $2 + 1;
      $2 = HEAPU8[$2 | 0];
      break label$8;
     }
     $2 = __shgetc($1);
    }
    $7 = $7 + -1 | 0;
    $8 = $8 + -1 | 0;
    if ($8 >>> 0 < 4294967295) {
     $7 = $7 + 1 | 0
    }
    if (($2 | 0) == 48) {
     continue
    }
    break;
   };
   $14 = 1;
  }
  HEAP32[$6 + 768 >> 2] = 0;
  label$10 : {
   label$11 : {
    $12 = ($2 | 0) == 46;
    $15 = $2 + -48 | 0;
    label$13 : {
     label$14 : {
      if ($12 | $15 >>> 0 <= 9) {
       while (1) {
        label$18 : {
         if ($12 & 1) {
          if (!$10) {
           $8 = $9;
           $7 = $11;
           $10 = 1;
           break label$18;
          }
          $14 = ($14 | 0) != 0;
          break label$14;
         }
         $9 = $9 + 1 | 0;
         if ($9 >>> 0 < 1) {
          $11 = $11 + 1 | 0
         }
         if (($13 | 0) <= 2044) {
          $17 = ($2 | 0) != 48 ? $9 : $17;
          $12 = ($6 + 768 | 0) + ($13 << 2) | 0;
          HEAP32[$12 >> 2] = $16 ? (Math_imul(HEAP32[$12 >> 2], 10) + $2 | 0) + -48 | 0 : $15;
          $14 = 1;
          $12 = $16 + 1 | 0;
          $2 = ($12 | 0) == 9;
          $16 = $2 ? 0 : $12;
          $13 = $2 + $13 | 0;
          break label$18;
         }
         if (($2 | 0) == 48) {
          break label$18
         }
         HEAP32[$6 + 8944 >> 2] = HEAP32[$6 + 8944 >> 2] | 1;
        }
        $2 = HEAP32[$1 + 4 >> 2];
        label$24 : {
         if ($2 >>> 0 < HEAPU32[$1 + 104 >> 2]) {
          HEAP32[$1 + 4 >> 2] = $2 + 1;
          $2 = HEAPU8[$2 | 0];
          break label$24;
         }
         $2 = __shgetc($1);
        }
        $12 = ($2 | 0) == 46;
        $15 = $2 + -48 | 0;
        if ($12 | $15 >>> 0 < 10) {
         continue
        }
        break;
       }
      }
      $8 = $10 ? $8 : $9;
      $7 = $10 ? $7 : $11;
      if (!(!$14 | ($2 & -33) != 69)) {
       $2 = scanexp($1);
       $12 = i64toi32_i32$HIGH_BITS;
       $10 = $12;
       label$27 : {
        if ($2 | ($10 | 0) != -2147483648) {
         break label$27
        }
        $2 = 0;
        $10 = 0;
        if (!HEAP32[$1 + 104 >> 2]) {
         break label$27
        }
        HEAP32[$1 + 4 >> 2] = HEAP32[$1 + 4 >> 2] + -1;
       }
       $7 = $7 + $10 | 0;
       $8 = $2 + $8 | 0;
       if ($8 >>> 0 < $2 >>> 0) {
        $7 = $7 + 1 | 0
       }
       break label$11;
      }
      $14 = ($14 | 0) != 0;
      if (($2 | 0) < 0) {
       break label$13
      }
     }
     if (!HEAP32[$1 + 104 >> 2]) {
      break label$13
     }
     HEAP32[$1 + 4 >> 2] = HEAP32[$1 + 4 >> 2] + -1;
    }
    if ($14) {
     break label$11
    }
    HEAP32[2892] = 28;
    $9 = 0;
    $11 = 0;
    __shlim($1);
    $2 = 0;
    $1 = 0;
    break label$10;
   }
   $1 = HEAP32[$6 + 768 >> 2];
   if (!$1) {
    __extenddftf2($6, +($5 | 0) * 0.0);
    $9 = HEAP32[$6 >> 2];
    $11 = HEAP32[$6 + 4 >> 2];
    $2 = HEAP32[$6 + 12 >> 2];
    $1 = HEAP32[$6 + 8 >> 2];
    break label$10;
   }
   if (!(($8 | 0) != ($9 | 0) | ($7 | 0) != ($11 | 0) | (($11 | 0) > 0 ? 1 : ($11 | 0) >= 0 ? ($9 >>> 0 <= 9 ? 0 : 1) : 0) | ($1 >>> $3 | 0 ? ($3 | 0) <= 30 : 0))) {
    __floatsitf($6 + 48 | 0, $5);
    __floatunsitf($6 + 32 | 0, $1);
    __multf3($6 + 16 | 0, HEAP32[$6 + 48 >> 2], HEAP32[$6 + 52 >> 2], HEAP32[$6 + 56 >> 2], HEAP32[$6 + 60 >> 2], HEAP32[$6 + 32 >> 2], HEAP32[$6 + 36 >> 2], HEAP32[$6 + 40 >> 2], HEAP32[$6 + 44 >> 2]);
    $9 = HEAP32[$6 + 16 >> 2];
    $11 = HEAP32[$6 + 20 >> 2];
    $2 = HEAP32[$6 + 28 >> 2];
    $1 = HEAP32[$6 + 24 >> 2];
    break label$10;
   }
   $1 = ($4 | 0) / -2 | 0;
   $2 = $8 >>> 0 <= $1 >>> 0 ? 0 : 1;
   $1 = $1 >> 31;
   if (($7 | 0) > ($1 | 0) ? 1 : ($7 | 0) >= ($1 | 0) ? $2 : 0) {
    HEAP32[2892] = 68;
    __floatsitf($6 + 96 | 0, $5);
    __multf3($6 + 80 | 0, HEAP32[$6 + 96 >> 2], HEAP32[$6 + 100 >> 2], HEAP32[$6 + 104 >> 2], HEAP32[$6 + 108 >> 2], -1, -1, -1, 2147418111);
    __multf3($6 - -64 | 0, HEAP32[$6 + 80 >> 2], HEAP32[$6 + 84 >> 2], HEAP32[$6 + 88 >> 2], HEAP32[$6 + 92 >> 2], -1, -1, -1, 2147418111);
    $9 = HEAP32[$6 + 64 >> 2];
    $11 = HEAP32[$6 + 68 >> 2];
    $2 = HEAP32[$6 + 76 >> 2];
    $1 = HEAP32[$6 + 72 >> 2];
    break label$10;
   }
   $1 = $4 + -226 | 0;
   $2 = $8 >>> 0 >= $1 >>> 0 ? 0 : 1;
   $1 = $1 >> 31;
   if (($7 | 0) < ($1 | 0) ? 1 : ($7 | 0) <= ($1 | 0) ? $2 : 0) {
    HEAP32[2892] = 68;
    __floatsitf($6 + 144 | 0, $5);
    __multf3($6 + 128 | 0, HEAP32[$6 + 144 >> 2], HEAP32[$6 + 148 >> 2], HEAP32[$6 + 152 >> 2], HEAP32[$6 + 156 >> 2], 0, 0, 0, 65536);
    __multf3($6 + 112 | 0, HEAP32[$6 + 128 >> 2], HEAP32[$6 + 132 >> 2], HEAP32[$6 + 136 >> 2], HEAP32[$6 + 140 >> 2], 0, 0, 0, 65536);
    $9 = HEAP32[$6 + 112 >> 2];
    $11 = HEAP32[$6 + 116 >> 2];
    $2 = HEAP32[$6 + 124 >> 2];
    $1 = HEAP32[$6 + 120 >> 2];
    break label$10;
   }
   if ($16) {
    if (($16 | 0) <= 8) {
     $2 = ($6 + 768 | 0) + ($13 << 2) | 0;
     $1 = HEAP32[$2 >> 2];
     while (1) {
      $1 = Math_imul($1, 10);
      $16 = $16 + 1 | 0;
      if (($16 | 0) != 9) {
       continue
      }
      break;
     };
     HEAP32[$2 >> 2] = $1;
    }
    $13 = $13 + 1 | 0;
   }
   label$35 : {
    $10 = $8;
    if (($17 | 0) > 8 | ($17 | 0) > ($8 | 0) | ($8 | 0) > 17) {
     break label$35
    }
    if (($10 | 0) == 9) {
     __floatsitf($6 + 192 | 0, $5);
     __floatunsitf($6 + 176 | 0, HEAP32[$6 + 768 >> 2]);
     __multf3($6 + 160 | 0, HEAP32[$6 + 192 >> 2], HEAP32[$6 + 196 >> 2], HEAP32[$6 + 200 >> 2], HEAP32[$6 + 204 >> 2], HEAP32[$6 + 176 >> 2], HEAP32[$6 + 180 >> 2], HEAP32[$6 + 184 >> 2], HEAP32[$6 + 188 >> 2]);
     $9 = HEAP32[$6 + 160 >> 2];
     $11 = HEAP32[$6 + 164 >> 2];
     $2 = HEAP32[$6 + 172 >> 2];
     $1 = HEAP32[$6 + 168 >> 2];
     break label$10;
    }
    if (($10 | 0) <= 8) {
     __floatsitf($6 + 272 | 0, $5);
     __floatunsitf($6 + 256 | 0, HEAP32[$6 + 768 >> 2]);
     __multf3($6 + 240 | 0, HEAP32[$6 + 272 >> 2], HEAP32[$6 + 276 >> 2], HEAP32[$6 + 280 >> 2], HEAP32[$6 + 284 >> 2], HEAP32[$6 + 256 >> 2], HEAP32[$6 + 260 >> 2], HEAP32[$6 + 264 >> 2], HEAP32[$6 + 268 >> 2]);
     __floatsitf($6 + 224 | 0, HEAP32[(0 - $10 << 2) + 10544 >> 2]);
     __divtf3($6 + 208 | 0, HEAP32[$6 + 240 >> 2], HEAP32[$6 + 244 >> 2], HEAP32[$6 + 248 >> 2], HEAP32[$6 + 252 >> 2], HEAP32[$6 + 224 >> 2], HEAP32[$6 + 228 >> 2], HEAP32[$6 + 232 >> 2], HEAP32[$6 + 236 >> 2]);
     $9 = HEAP32[$6 + 208 >> 2];
     $11 = HEAP32[$6 + 212 >> 2];
     $2 = HEAP32[$6 + 220 >> 2];
     $1 = HEAP32[$6 + 216 >> 2];
     break label$10;
    }
    $1 = (Math_imul($10, -3) + $3 | 0) + 27 | 0;
    $2 = HEAP32[$6 + 768 >> 2];
    if ($2 >>> $1 | 0 ? ($1 | 0) <= 30 : 0) {
     break label$35
    }
    __floatsitf($6 + 352 | 0, $5);
    __floatunsitf($6 + 336 | 0, $2);
    __multf3($6 + 320 | 0, HEAP32[$6 + 352 >> 2], HEAP32[$6 + 356 >> 2], HEAP32[$6 + 360 >> 2], HEAP32[$6 + 364 >> 2], HEAP32[$6 + 336 >> 2], HEAP32[$6 + 340 >> 2], HEAP32[$6 + 344 >> 2], HEAP32[$6 + 348 >> 2]);
    __floatsitf($6 + 304 | 0, HEAP32[($10 << 2) + 10472 >> 2]);
    __multf3($6 + 288 | 0, HEAP32[$6 + 320 >> 2], HEAP32[$6 + 324 >> 2], HEAP32[$6 + 328 >> 2], HEAP32[$6 + 332 >> 2], HEAP32[$6 + 304 >> 2], HEAP32[$6 + 308 >> 2], HEAP32[$6 + 312 >> 2], HEAP32[$6 + 316 >> 2]);
    $9 = HEAP32[$6 + 288 >> 2];
    $11 = HEAP32[$6 + 292 >> 2];
    $2 = HEAP32[$6 + 300 >> 2];
    $1 = HEAP32[$6 + 296 >> 2];
    break label$10;
   }
   $16 = 0;
   $1 = ($10 | 0) % 9 | 0;
   label$38 : {
    if (!$1) {
     $2 = 0;
     break label$38;
    }
    $12 = ($10 | 0) > -1 ? $1 : $1 + 9 | 0;
    label$40 : {
     if (!$13) {
      $2 = 0;
      $13 = 0;
      break label$40;
     }
     $8 = HEAP32[(0 - $12 << 2) + 10544 >> 2];
     $9 = 1e9 / ($8 | 0) | 0;
     $14 = 0;
     $1 = 0;
     $2 = 0;
     while (1) {
      $11 = ($6 + 768 | 0) + ($1 << 2) | 0;
      $15 = HEAP32[$11 >> 2];
      $17 = ($15 >>> 0) / ($8 >>> 0) | 0;
      $7 = $14 + $17 | 0;
      HEAP32[$11 >> 2] = $7;
      $7 = !$7 & ($1 | 0) == ($2 | 0);
      $2 = $7 ? $2 + 1 & 2047 : $2;
      $10 = $7 ? $10 + -9 | 0 : $10;
      $14 = Math_imul($9, $15 - Math_imul($8, $17) | 0);
      $1 = $1 + 1 | 0;
      if (($13 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     if (!$14) {
      break label$40
     }
     HEAP32[($6 + 768 | 0) + ($13 << 2) >> 2] = $14;
     $13 = $13 + 1 | 0;
    }
    $10 = ($10 - $12 | 0) + 9 | 0;
   }
   while (1) {
    $11 = ($6 + 768 | 0) + ($2 << 2) | 0;
    label$44 : {
     while (1) {
      if (($10 | 0) != 36 | HEAPU32[$11 >> 2] >= 10384593 ? ($10 | 0) >= 36 : 0) {
       break label$44
      }
      $15 = $13 + 2047 | 0;
      $14 = 0;
      $12 = $13;
      while (1) {
       $13 = $12;
       $9 = $15 & 2047;
       $12 = ($6 + 768 | 0) + ($9 << 2) | 0;
       $1 = HEAP32[$12 >> 2];
       $7 = $1 >>> 3 | 0;
       $8 = $1 << 29;
       $1 = $8 + $14 | 0;
       if ($1 >>> 0 < $8 >>> 0) {
        $7 = $7 + 1 | 0
       }
       $8 = $1;
       $14 = 0;
       label$48 : {
        if (!$7 & $1 >>> 0 < 1000000001 | $7 >>> 0 < 0) {
         break label$48
        }
        $1 = __wasm_i64_udiv($1, $7, 1e9);
        $8 = $8 - __wasm_i64_mul($1, i64toi32_i32$HIGH_BITS, 1e9, 0) | 0;
        $14 = $1;
       }
       HEAP32[$12 >> 2] = $8;
       $12 = ($9 | 0) != ($13 + -1 & 2047) ? $13 : ($2 | 0) == ($9 | 0) ? $13 : $8 ? $13 : $9;
       $15 = $9 + -1 | 0;
       if (($2 | 0) != ($9 | 0)) {
        continue
       }
       break;
      };
      $16 = $16 + -29 | 0;
      if (!$14) {
       continue
      }
      break;
     };
     $2 = $2 + -1 & 2047;
     if (($12 | 0) == ($2 | 0)) {
      $1 = ($6 + 768 | 0) + (($12 + 2046 & 2047) << 2) | 0;
      $13 = $12 + -1 & 2047;
      HEAP32[$1 >> 2] = HEAP32[$1 >> 2] | HEAP32[($6 + 768 | 0) + ($13 << 2) >> 2];
     }
     $10 = $10 + 9 | 0;
     HEAP32[($6 + 768 | 0) + ($2 << 2) >> 2] = $14;
     continue;
    }
    break;
   };
   label$50 : {
    label$51 : while (1) {
     $8 = $13 + 1 & 2047;
     $9 = ($6 + 768 | 0) + (($13 + -1 & 2047) << 2) | 0;
     while (1) {
      $7 = ($10 | 0) > 45 ? 9 : 1;
      label$53 : {
       while (1) {
        $12 = $2;
        $1 = 0;
        label$55 : {
         while (1) {
          label$57 : {
           $2 = $1 + $12 & 2047;
           if (($2 | 0) == ($13 | 0)) {
            break label$57
           }
           $2 = HEAP32[($6 + 768 | 0) + ($2 << 2) >> 2];
           $11 = HEAP32[($1 << 2) + 10496 >> 2];
           if ($2 >>> 0 < $11 >>> 0) {
            break label$57
           }
           if ($2 >>> 0 > $11 >>> 0) {
            break label$55
           }
           $1 = $1 + 1 | 0;
           if (($1 | 0) != 4) {
            continue
           }
          }
          break;
         };
         if (($10 | 0) != 36) {
          break label$55
         }
         $8 = 0;
         $7 = 0;
         $1 = 0;
         $9 = 0;
         $11 = 0;
         while (1) {
          $2 = $1 + $12 & 2047;
          if (($2 | 0) == ($13 | 0)) {
           $13 = $13 + 1 & 2047;
           HEAP32[(($13 << 2) + $6 | 0) + 764 >> 2] = 0;
          }
          __multf3($6 + 752 | 0, $8, $7, $9, $11, 0, 0, 1342177280, 1075633366);
          __floatunsitf($6 + 736 | 0, HEAP32[($6 + 768 | 0) + ($2 << 2) >> 2]);
          __addtf3($6 + 720 | 0, HEAP32[$6 + 752 >> 2], HEAP32[$6 + 756 >> 2], HEAP32[$6 + 760 >> 2], HEAP32[$6 + 764 >> 2], HEAP32[$6 + 736 >> 2], HEAP32[$6 + 740 >> 2], HEAP32[$6 + 744 >> 2], HEAP32[$6 + 748 >> 2]);
          $9 = HEAP32[$6 + 728 >> 2];
          $11 = HEAP32[$6 + 732 >> 2];
          $8 = HEAP32[$6 + 720 >> 2];
          $7 = HEAP32[$6 + 724 >> 2];
          $1 = $1 + 1 | 0;
          if (($1 | 0) != 4) {
           continue
          }
          break;
         };
         __floatsitf($6 + 704 | 0, $5);
         __multf3($6 + 688 | 0, $8, $7, $9, $11, HEAP32[$6 + 704 >> 2], HEAP32[$6 + 708 >> 2], HEAP32[$6 + 712 >> 2], HEAP32[$6 + 716 >> 2]);
         $9 = HEAP32[$6 + 696 >> 2];
         $11 = HEAP32[$6 + 700 >> 2];
         $8 = 0;
         $7 = 0;
         $2 = HEAP32[$6 + 688 >> 2];
         $10 = HEAP32[$6 + 692 >> 2];
         $21 = $16 + 113 | 0;
         $19 = $21 - $4 | 0;
         $22 = ($19 | 0) < ($3 | 0);
         $4 = $22 ? (($19 | 0) > 0 ? $19 : 0) : $3;
         if (($4 | 0) <= 112) {
          break label$53
         }
         $1 = 0;
         $3 = 0;
         $14 = 0;
         $15 = 0;
         $17 = 0;
         break label$50;
        }
        $16 = $7 + $16 | 0;
        $2 = $13;
        if (($12 | 0) == ($2 | 0)) {
         continue
        }
        break;
       };
       $11 = 1e9 >>> $7 | 0;
       $14 = -1 << $7 ^ -1;
       $1 = 0;
       $2 = $12;
       while (1) {
        $15 = ($6 + 768 | 0) + ($12 << 2) | 0;
        $17 = HEAP32[$15 >> 2];
        $1 = ($17 >>> $7 | 0) + $1 | 0;
        HEAP32[$15 >> 2] = $1;
        $1 = !$1 & ($2 | 0) == ($12 | 0);
        $2 = $1 ? $2 + 1 & 2047 : $2;
        $10 = $1 ? $10 + -9 | 0 : $10;
        $1 = Math_imul($11, $14 & $17);
        $12 = $12 + 1 & 2047;
        if (($12 | 0) != ($13 | 0)) {
         continue
        }
        break;
       };
       if (!$1) {
        continue
       }
       if (($2 | 0) != ($8 | 0)) {
        HEAP32[($6 + 768 | 0) + ($13 << 2) >> 2] = $1;
        $13 = $8;
        continue label$51;
       }
       HEAP32[$9 >> 2] = HEAP32[$9 >> 2] | 1;
       $2 = $8;
       continue;
      }
      break;
     };
     break;
    };
    __extenddftf2($6 + 640 | 0, scalbn(1.0, 225 - $4 | 0));
    copysignl($6 + 672 | 0, HEAP32[$6 + 640 >> 2], HEAP32[$6 + 644 >> 2], HEAP32[$6 + 648 >> 2], HEAP32[$6 + 652 >> 2], $2, $10, $9, $11);
    $17 = HEAP32[$6 + 680 >> 2];
    $23 = HEAP32[$6 + 684 >> 2];
    $14 = HEAP32[$6 + 672 >> 2];
    $15 = HEAP32[$6 + 676 >> 2];
    __extenddftf2($6 + 624 | 0, scalbn(1.0, 113 - $4 | 0));
    fmodl($6 + 656 | 0, $2, $10, $9, $11, HEAP32[$6 + 624 >> 2], HEAP32[$6 + 628 >> 2], HEAP32[$6 + 632 >> 2], HEAP32[$6 + 636 >> 2]);
    $8 = HEAP32[$6 + 656 >> 2];
    $7 = HEAP32[$6 + 660 >> 2];
    $1 = HEAP32[$6 + 664 >> 2];
    $3 = HEAP32[$6 + 668 >> 2];
    __subtf3($6 + 608 | 0, $2, $10, $9, $11, $8, $7, $1, $3);
    __addtf3($6 + 592 | 0, $14, $15, $17, $23, HEAP32[$6 + 608 >> 2], HEAP32[$6 + 612 >> 2], HEAP32[$6 + 616 >> 2], HEAP32[$6 + 620 >> 2]);
    $9 = HEAP32[$6 + 600 >> 2];
    $11 = HEAP32[$6 + 604 >> 2];
    $2 = HEAP32[$6 + 592 >> 2];
    $10 = HEAP32[$6 + 596 >> 2];
   }
   $18 = $12 + 4 & 2047;
   label$62 : {
    if (($18 | 0) == ($13 | 0)) {
     break label$62
    }
    $18 = HEAP32[($6 + 768 | 0) + ($18 << 2) >> 2];
    label$63 : {
     if ($18 >>> 0 <= 499999999) {
      if (($12 + 5 & 2047) == ($13 | 0) ? !$18 : 0) {
       break label$63
      }
      __extenddftf2($6 + 480 | 0, +($5 | 0) * .25);
      __addtf3($6 + 464 | 0, $8, $7, $1, $3, HEAP32[$6 + 480 >> 2], HEAP32[$6 + 484 >> 2], HEAP32[$6 + 488 >> 2], HEAP32[$6 + 492 >> 2]);
      $1 = HEAP32[$6 + 472 >> 2];
      $3 = HEAP32[$6 + 476 >> 2];
      $8 = HEAP32[$6 + 464 >> 2];
      $7 = HEAP32[$6 + 468 >> 2];
      break label$63;
     }
     if (($18 | 0) != 5e8) {
      __extenddftf2($6 + 576 | 0, +($5 | 0) * .75);
      __addtf3($6 + 560 | 0, $8, $7, $1, $3, HEAP32[$6 + 576 >> 2], HEAP32[$6 + 580 >> 2], HEAP32[$6 + 584 >> 2], HEAP32[$6 + 588 >> 2]);
      $1 = HEAP32[$6 + 568 >> 2];
      $3 = HEAP32[$6 + 572 >> 2];
      $8 = HEAP32[$6 + 560 >> 2];
      $7 = HEAP32[$6 + 564 >> 2];
      break label$63;
     }
     $24 = +($5 | 0);
     if (($12 + 5 & 2047) == ($13 | 0)) {
      __extenddftf2($6 + 512 | 0, $24 * .5);
      __addtf3($6 + 496 | 0, $8, $7, $1, $3, HEAP32[$6 + 512 >> 2], HEAP32[$6 + 516 >> 2], HEAP32[$6 + 520 >> 2], HEAP32[$6 + 524 >> 2]);
      $1 = HEAP32[$6 + 504 >> 2];
      $3 = HEAP32[$6 + 508 >> 2];
      $8 = HEAP32[$6 + 496 >> 2];
      $7 = HEAP32[$6 + 500 >> 2];
      break label$63;
     }
     __extenddftf2($6 + 544 | 0, $24 * .75);
     __addtf3($6 + 528 | 0, $8, $7, $1, $3, HEAP32[$6 + 544 >> 2], HEAP32[$6 + 548 >> 2], HEAP32[$6 + 552 >> 2], HEAP32[$6 + 556 >> 2]);
     $1 = HEAP32[$6 + 536 >> 2];
     $3 = HEAP32[$6 + 540 >> 2];
     $8 = HEAP32[$6 + 528 >> 2];
     $7 = HEAP32[$6 + 532 >> 2];
    }
    if (($4 | 0) > 111) {
     break label$62
    }
    fmodl($6 + 448 | 0, $8, $7, $1, $3, 0, 0, 0, 1073676288);
    if (__letf2(HEAP32[$6 + 448 >> 2], HEAP32[$6 + 452 >> 2], HEAP32[$6 + 456 >> 2], HEAP32[$6 + 460 >> 2], 0, 0, 0, 0)) {
     break label$62
    }
    __addtf3($6 + 432 | 0, $8, $7, $1, $3, 0, 0, 0, 1073676288);
    $1 = HEAP32[$6 + 440 >> 2];
    $3 = HEAP32[$6 + 444 >> 2];
    $8 = HEAP32[$6 + 432 >> 2];
    $7 = HEAP32[$6 + 436 >> 2];
   }
   __addtf3($6 + 416 | 0, $2, $10, $9, $11, $8, $7, $1, $3);
   __subtf3($6 + 400 | 0, HEAP32[$6 + 416 >> 2], HEAP32[$6 + 420 >> 2], HEAP32[$6 + 424 >> 2], HEAP32[$6 + 428 >> 2], $14, $15, $17, $23);
   $9 = HEAP32[$6 + 408 >> 2];
   $11 = HEAP32[$6 + 412 >> 2];
   $2 = HEAP32[$6 + 400 >> 2];
   $10 = HEAP32[$6 + 404 >> 2];
   label$67 : {
    if (($21 & 2147483647) <= (-2 - $20 | 0)) {
     break label$67
    }
    __multf3($6 + 384 | 0, $2, $10, $9, $11, 0, 0, 0, 1073610752);
    $3 = __letf2($8, $7, $1, $3, 0, 0, 0, 0);
    $1 = Math_abs(__trunctfdf2($2, $10, $9, $11)) >= 1038459371706965525706099.0e10;
    $9 = $1 ? HEAP32[$6 + 392 >> 2] : $9;
    $11 = $1 ? HEAP32[$6 + 396 >> 2] : $11;
    $2 = $1 ? HEAP32[$6 + 384 >> 2] : $2;
    $10 = $1 ? HEAP32[$6 + 388 >> 2] : $10;
    $16 = $1 + $16 | 0;
    if (($16 + 110 | 0) <= ($25 | 0) ? !($22 & ($1 ^ 1 | ($4 | 0) != ($19 | 0)) & ($3 | 0) != 0) : 0) {
     break label$67
    }
    HEAP32[2892] = 68;
   }
   scalbnl($6 + 368 | 0, $2, $10, $9, $11, $16);
   $9 = HEAP32[$6 + 368 >> 2];
   $11 = HEAP32[$6 + 372 >> 2];
   $2 = HEAP32[$6 + 380 >> 2];
   $1 = HEAP32[$6 + 376 >> 2];
  }
  HEAP32[$0 >> 2] = $9;
  HEAP32[$0 + 4 >> 2] = $11;
  HEAP32[$0 + 8 >> 2] = $1;
  HEAP32[$0 + 12 >> 2] = $2;
  global$0 = $6 + 8960 | 0;
 }
 
 function scanexp($0) {
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0;
  label$1 : {
   label$2 : {
    label$3 : {
     $3 = HEAP32[$0 + 4 >> 2];
     label$4 : {
      if ($3 >>> 0 < HEAPU32[$0 + 104 >> 2]) {
       HEAP32[$0 + 4 >> 2] = $3 + 1;
       $2 = HEAPU8[$3 | 0];
       break label$4;
      }
      $2 = __shgetc($0);
     }
     switch ($2 + -43 | 0) {
     case 0:
     case 2:
      break label$2;
     default:
      break label$3;
     };
    }
    $1 = $2 + -48 | 0;
    break label$1;
   }
   $5 = ($2 | 0) == 45;
   $3 = HEAP32[$0 + 4 >> 2];
   label$6 : {
    if ($3 >>> 0 < HEAPU32[$0 + 104 >> 2]) {
     HEAP32[$0 + 4 >> 2] = $3 + 1;
     $2 = HEAPU8[$3 | 0];
     break label$6;
    }
    $2 = __shgetc($0);
   }
   $1 = $2 + -48 | 0;
   if (!($1 >>> 0 < 10 | !HEAP32[$0 + 104 >> 2])) {
    HEAP32[$0 + 4 >> 2] = HEAP32[$0 + 4 >> 2] + -1
   }
  }
  label$9 : {
   if ($1 >>> 0 < 10) {
    $1 = 0;
    while (1) {
     $1 = Math_imul($1, 10) + $2 | 0;
     $3 = HEAP32[$0 + 4 >> 2];
     label$12 : {
      if ($3 >>> 0 < HEAPU32[$0 + 104 >> 2]) {
       HEAP32[$0 + 4 >> 2] = $3 + 1;
       $2 = HEAPU8[$3 | 0];
       break label$12;
      }
      $2 = __shgetc($0);
     }
     $4 = $2 + -48 | 0;
     $1 = $1 + -48 | 0;
     if (($1 | 0) < 214748364 ? $4 >>> 0 <= 9 : 0) {
      continue
     }
     break;
    };
    $3 = $1;
    $1 = $1 >> 31;
    label$14 : {
     if ($4 >>> 0 >= 10) {
      break label$14
     }
     while (1) {
      $1 = __wasm_i64_mul($3, $1, 10, 0);
      $3 = $1 + $2 | 0;
      $2 = i64toi32_i32$HIGH_BITS;
      $4 = $3 >>> 0 < $1 >>> 0 ? $2 + 1 | 0 : $2;
      $1 = HEAP32[$0 + 4 >> 2];
      label$16 : {
       if ($1 >>> 0 < HEAPU32[$0 + 104 >> 2]) {
        HEAP32[$0 + 4 >> 2] = $1 + 1;
        $2 = HEAPU8[$1 | 0];
        break label$16;
       }
       $2 = __shgetc($0);
      }
      $1 = $4 + -1 | 0;
      $3 = $3 + -48 | 0;
      if ($3 >>> 0 < 4294967248) {
       $1 = $1 + 1 | 0
      }
      $4 = $2 + -48 | 0;
      if ($4 >>> 0 > 9) {
       break label$14
      }
      if (($1 | 0) < 21474836 ? 1 : ($1 | 0) <= 21474836 ? ($3 >>> 0 >= 2061584302 ? 0 : 1) : 0) {
       continue
      }
      break;
     };
    }
    if ($4 >>> 0 < 10) {
     while (1) {
      $2 = HEAP32[$0 + 4 >> 2];
      label$20 : {
       if ($2 >>> 0 < HEAPU32[$0 + 104 >> 2]) {
        HEAP32[$0 + 4 >> 2] = $2 + 1;
        $2 = HEAPU8[$2 | 0];
        break label$20;
       }
       $2 = __shgetc($0);
      }
      if ($2 + -48 >>> 0 < 10) {
       continue
      }
      break;
     }
    }
    if (HEAP32[$0 + 104 >> 2]) {
     HEAP32[$0 + 4 >> 2] = HEAP32[$0 + 4 >> 2] + -1
    }
    $0 = $3;
    $3 = $5 ? 0 - $0 | 0 : $0;
    $1 = $5 ? 0 - ($1 + (0 < $0 >>> 0) | 0) | 0 : $1;
    break label$9;
   }
   $3 = 0;
   $1 = -2147483648;
   if (!HEAP32[$0 + 104 >> 2]) {
    break label$9
   }
   HEAP32[$0 + 4 >> 2] = HEAP32[$0 + 4 >> 2] + -1;
   i64toi32_i32$HIGH_BITS = -2147483648;
   return 0;
  }
  i64toi32_i32$HIGH_BITS = $1;
  return $3;
 }
 
 function strtox($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0;
  $2 = global$0 - 160 | 0;
  global$0 = $2;
  memset($2 + 16 | 0, 144);
  HEAP32[$2 + 92 >> 2] = -1;
  HEAP32[$2 + 60 >> 2] = $1;
  HEAP32[$2 + 24 >> 2] = -1;
  HEAP32[$2 + 20 >> 2] = $1;
  __shlim($2 + 16 | 0);
  __floatscan($2, $2 + 16 | 0);
  $1 = HEAP32[$2 + 8 >> 2];
  $3 = HEAP32[$2 + 12 >> 2];
  $4 = HEAP32[$2 + 4 >> 2];
  HEAP32[$0 >> 2] = HEAP32[$2 >> 2];
  HEAP32[$0 + 4 >> 2] = $4;
  HEAP32[$0 + 8 >> 2] = $1;
  HEAP32[$0 + 12 >> 2] = $3;
  global$0 = $2 + 160 | 0;
 }
 
 function strtod($0) {
  var $1 = 0, $2 = 0.0;
  $1 = global$0 - 16 | 0;
  global$0 = $1;
  strtox($1, $0);
  $2 = __trunctfdf2(HEAP32[$1 >> 2], HEAP32[$1 + 4 >> 2], HEAP32[$1 + 8 >> 2], HEAP32[$1 + 12 >> 2]);
  global$0 = $1 + 16 | 0;
  return $2;
 }
 
 function FLAC__stream_encoder_new() {
  var $0 = 0, $1 = 0, $2 = 0, $3 = 0;
  $1 = dlcalloc(1, 8);
  if (!$1) {
   return 0
  }
  $0 = dlcalloc(1, 1032);
  HEAP32[$1 >> 2] = $0;
  label$2 : {
   if (!$0) {
    break label$2
   }
   $3 = dlcalloc(1, 11856);
   HEAP32[$1 + 4 >> 2] = $3;
   if (!$3) {
    dlfree($0);
    break label$2;
   }
   $0 = dlcalloc(1, 20);
   $3 = HEAP32[$1 + 4 >> 2];
   HEAP32[$3 + 6856 >> 2] = $0;
   if (!$0) {
    dlfree($3);
    dlfree(HEAP32[$1 >> 2]);
    break label$2;
   }
   HEAP32[$3 + 7296 >> 2] = 0;
   $0 = HEAP32[$1 >> 2];
   HEAP32[$0 + 44 >> 2] = 13;
   HEAP32[$0 + 48 >> 2] = 1056964608;
   HEAP32[$0 + 36 >> 2] = 0;
   HEAP32[$0 + 40 >> 2] = 1;
   HEAP32[$0 + 28 >> 2] = 16;
   HEAP32[$0 + 32 >> 2] = 44100;
   HEAP32[$0 + 20 >> 2] = 0;
   HEAP32[$0 + 24 >> 2] = 2;
   HEAP32[$0 + 12 >> 2] = 1;
   HEAP32[$0 + 16 >> 2] = 0;
   HEAP32[$0 + 4 >> 2] = 0;
   HEAP32[$0 + 8 >> 2] = 1;
   $0 = HEAP32[$1 >> 2];
   HEAP32[$0 + 592 >> 2] = 0;
   HEAP32[$0 + 596 >> 2] = 0;
   HEAP32[$0 + 556 >> 2] = 0;
   HEAP32[$0 + 560 >> 2] = 0;
   HEAP32[$0 + 564 >> 2] = 0;
   HEAP32[$0 + 568 >> 2] = 0;
   HEAP32[$0 + 572 >> 2] = 0;
   HEAP32[$0 + 576 >> 2] = 0;
   HEAP32[$0 + 580 >> 2] = 0;
   HEAP32[$0 + 584 >> 2] = 0;
   HEAP32[$0 + 600 >> 2] = 0;
   HEAP32[$0 + 604 >> 2] = 0;
   $3 = HEAP32[$1 + 4 >> 2];
   $2 = $3;
   HEAP32[$2 + 7248 >> 2] = 0;
   HEAP32[$2 + 7252 >> 2] = 0;
   HEAP32[$2 + 7048 >> 2] = 0;
   $2 = $2 + 7256 | 0;
   HEAP32[$2 >> 2] = 0;
   HEAP32[$2 + 4 >> 2] = 0;
   $2 = $3 + 7264 | 0;
   HEAP32[$2 >> 2] = 0;
   HEAP32[$2 + 4 >> 2] = 0;
   $2 = $3 + 7272 | 0;
   HEAP32[$2 >> 2] = 0;
   HEAP32[$2 + 4 >> 2] = 0;
   $2 = $3 + 7280 | 0;
   HEAP32[$2 >> 2] = 0;
   HEAP32[$2 + 4 >> 2] = 0;
   HEAP32[$3 + 7288 >> 2] = 0;
   FLAC__ogg_encoder_aspect_set_defaults($0 + 632 | 0);
   $0 = HEAP32[$1 >> 2];
   label$5 : {
    if (HEAP32[$0 >> 2] != 1) {
     break label$5
    }
    HEAP32[$0 + 16 >> 2] = 1;
    HEAP32[$0 + 20 >> 2] = 0;
    FLAC__stream_encoder_set_apodization($1, 10761);
    $0 = HEAP32[$1 >> 2];
    if (HEAP32[$0 >> 2] != 1) {
     break label$5
    }
    HEAP32[$0 + 576 >> 2] = 0;
    HEAP32[$0 + 580 >> 2] = 5;
    HEAP32[$0 + 564 >> 2] = 0;
    HEAP32[$0 + 568 >> 2] = 0;
    HEAP32[$0 + 556 >> 2] = 8;
    HEAP32[$0 + 560 >> 2] = 0;
   }
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 11848 >> 2] = 0;
   HEAP32[$0 + 6176 >> 2] = $0 + 336;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6180 >> 2] = $0 + 628;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6184 >> 2] = $0 + 920;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6188 >> 2] = $0 + 1212;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6192 >> 2] = $0 + 1504;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6196 >> 2] = $0 + 1796;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6200 >> 2] = $0 + 2088;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6204 >> 2] = $0 + 2380;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6208 >> 2] = $0 + 2672;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6212 >> 2] = $0 + 2964;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6216 >> 2] = $0 + 3256;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6220 >> 2] = $0 + 3548;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6224 >> 2] = $0 + 3840;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6228 >> 2] = $0 + 4132;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6232 >> 2] = $0 + 4424;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6236 >> 2] = $0 + 4716;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6240 >> 2] = $0 + 5008;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6244 >> 2] = $0 + 5300;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6248 >> 2] = $0 + 5592;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6252 >> 2] = $0 + 5884;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6640 >> 2] = $0 + 6256;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6644 >> 2] = $0 + 6268;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6648 >> 2] = $0 + 6280;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6652 >> 2] = $0 + 6292;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6656 >> 2] = $0 + 6304;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6660 >> 2] = $0 + 6316;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6664 >> 2] = $0 + 6328;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6668 >> 2] = $0 + 6340;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6672 >> 2] = $0 + 6352;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6676 >> 2] = $0 + 6364;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6680 >> 2] = $0 + 6376;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6684 >> 2] = $0 + 6388;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6688 >> 2] = $0 + 6400;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6692 >> 2] = $0 + 6412;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6696 >> 2] = $0 + 6424;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6700 >> 2] = $0 + 6436;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6704 >> 2] = $0 + 6448;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6708 >> 2] = $0 + 6460;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6712 >> 2] = $0 + 6472;
   $0 = HEAP32[$1 + 4 >> 2];
   HEAP32[$0 + 6716 >> 2] = $0 + 6484;
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6256 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6268 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6280 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6292 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6304 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6316 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6328 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6340 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6352 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6364 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6376 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6388 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6400 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6412 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6424 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6436 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6448 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6460 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6472 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 6484 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 11724 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_init(HEAP32[$1 + 4 >> 2] + 11736 | 0);
   HEAP32[HEAP32[$1 >> 2] >> 2] = 1;
   return $1 | 0;
  }
  dlfree($1);
  return 0;
 }
 
 function FLAC__stream_encoder_set_apodization($0, $1) {
  var $2 = 0, $3 = 0, $4 = 0, $5 = Math_fround(0), $6 = 0, $7 = Math_fround(0), $8 = 0, $9 = 0, $10 = 0.0, $11 = Math_fround(0);
  $2 = HEAP32[$0 >> 2];
  label$1 : {
   if (HEAP32[$2 >> 2] != 1) {
    break label$1
   }
   HEAP32[$2 + 40 >> 2] = 0;
   while (1) {
    label$3 : {
     label$4 : {
      label$5 : {
       label$6 : {
        label$7 : {
         label$8 : {
          label$9 : {
           label$10 : {
            label$11 : {
             label$12 : {
              label$13 : {
               label$14 : {
                label$15 : {
                 label$16 : {
                  $9 = strchr($1, 59);
                  label$17 : {
                   if ($9) {
                    $4 = $9 - $1 | 0;
                    break label$17;
                   }
                   $4 = strlen($1);
                  }
                  $8 = ($4 | 0) != 8;
                  if (!$8) {
                   if (strncmp(10568, $1, 8)) {
                    break label$16
                   }
                   HEAP32[$2 + 40 >> 2] = $3 + 1;
                   HEAP32[(($3 << 4) + $2 | 0) + 44 >> 2] = 0;
                   break label$3;
                  }
                  label$20 : {
                   switch ($4 + -6 | 0) {
                   case 1:
                    break label$13;
                   case 0:
                    break label$14;
                   case 20:
                    break label$15;
                   case 7:
                    break label$20;
                   default:
                    break label$12;
                   };
                  }
                  $6 = 1;
                  if (strncmp(10577, $1, 13)) {
                   break label$11
                  }
                  HEAP32[$2 + 40 >> 2] = $3 + 1;
                  HEAP32[(($3 << 4) + $2 | 0) + 44 >> 2] = 1;
                  break label$3;
                 }
                 $6 = 0;
                 if (strncmp(10591, $1, 8)) {
                  break label$11
                 }
                 HEAP32[$2 + 40 >> 2] = $3 + 1;
                 HEAP32[(($3 << 4) + $2 | 0) + 44 >> 2] = 2;
                 break label$3;
                }
                $6 = 0;
                if (strncmp(10600, $1, 26)) {
                 break label$11
                }
                HEAP32[$2 + 40 >> 2] = $3 + 1;
                HEAP32[(($3 << 4) + $2 | 0) + 44 >> 2] = 3;
                break label$3;
               }
               if (strncmp(10627, $1, 6)) {
                break label$3
               }
               HEAP32[$2 + 40 >> 2] = $3 + 1;
               HEAP32[(($3 << 4) + $2 | 0) + 44 >> 2] = 4;
               break label$3;
              }
              if (strncmp(10634, $1, 7)) {
               break label$10
              }
              HEAP32[$2 + 40 >> 2] = $3 + 1;
              HEAP32[(($3 << 4) + $2 | 0) + 44 >> 2] = 5;
              break label$3;
             }
             $6 = 0;
             if ($4 >>> 0 < 8) {
              break label$9
             }
            }
            if (strncmp(10642, $1, 6)) {
             break label$8
            }
            $7 = Math_fround(strtod($1 + 6 | 0));
            if ($7 > Math_fround(0.0) ^ 1 | $7 <= Math_fround(.5) ^ 1) {
             break label$3
            }
            $4 = HEAP32[$0 >> 2];
            HEAPF32[((HEAP32[$4 + 40 >> 2] << 4) + $4 | 0) + 48 >> 2] = $7;
            $4 = HEAP32[$0 >> 2];
            $2 = HEAP32[$4 + 40 >> 2];
            HEAP32[$4 + 40 >> 2] = $2 + 1;
            HEAP32[($4 + ($2 << 4) | 0) + 44 >> 2] = 6;
            break label$3;
           }
           if (strncmp(10649, $1, 7)) {
            break label$7
           }
           HEAP32[$2 + 40 >> 2] = $3 + 1;
           HEAP32[(($3 << 4) + $2 | 0) + 44 >> 2] = 7;
           break label$3;
          }
          label$21 : {
           switch ($4 + -4 | 0) {
           case 0:
            break label$21;
           case 1:
            break label$5;
           default:
            break label$3;
           };
          }
          if (strncmp(10657, $1, 4)) {
           break label$3
          }
          HEAP32[$2 + 40 >> 2] = $3 + 1;
          HEAP32[(($3 << 4) + $2 | 0) + 44 >> 2] = 8;
          break label$3;
         }
         if (!$6) {
          break label$6
         }
         if (strncmp(10662, $1, 13)) {
          break label$6
         }
         HEAP32[$2 + 40 >> 2] = $3 + 1;
         HEAP32[(($3 << 4) + $2 | 0) + 44 >> 2] = 9;
         break label$3;
        }
        if (strncmp(10676, $1, 7)) {
         break label$3
        }
        HEAP32[$2 + 40 >> 2] = $3 + 1;
        HEAP32[(($3 << 4) + $2 | 0) + 44 >> 2] = 10;
        break label$3;
       }
       label$22 : {
        if (($4 | 0) != 9) {
         break label$22
        }
        if (strncmp(10684, $1, 9)) {
         break label$22
        }
        HEAP32[$2 + 40 >> 2] = $3 + 1;
        HEAP32[(($3 << 4) + $2 | 0) + 44 >> 2] = 11;
        break label$3;
       }
       if (!$8) {
        if (!strncmp(10694, $1, 8)) {
         HEAP32[$2 + 40 >> 2] = $3 + 1;
         HEAP32[(($3 << 4) + $2 | 0) + 44 >> 2] = 12;
         break label$3;
        }
        if (strncmp(10703, $1, 6)) {
         break label$3
        }
        break label$4;
       }
       if (!strncmp(10703, $1, 6)) {
        break label$4
       }
       if ($4 >>> 0 < 16) {
        break label$3
       }
       if (!strncmp(10710, $1, 14)) {
        $10 = strtod($1 + 14 | 0);
        label$26 : {
         if (Math_abs($10) < 2147483648.0) {
          $4 = ~~$10;
          break label$26;
         }
         $4 = -2147483648;
        }
        $2 = strchr($1, 47);
        $5 = Math_fround(.10000000149011612);
        label$28 : {
         if (!$2) {
          break label$28
         }
         $3 = $2 + 1 | 0;
         $5 = Math_fround(.9900000095367432);
         if (!(Math_fround(strtod($3)) < Math_fround(.9900000095367432))) {
          break label$28
         }
         $5 = Math_fround(strtod($3));
        }
        $2 = strchr($2 ? $2 + 1 | 0 : $1, 47);
        $7 = Math_fround(.20000000298023224);
        label$30 : {
         if (!$2) {
          break label$30
         }
         $7 = Math_fround(strtod($2 + 1 | 0));
        }
        $3 = HEAP32[$0 >> 2];
        $2 = HEAP32[$3 + 40 >> 2];
        if (($4 | 0) <= 1) {
         HEAPF32[(($2 << 4) + $3 | 0) + 48 >> 2] = $7;
         $4 = HEAP32[$0 >> 2];
         $2 = HEAP32[$4 + 40 >> 2];
         HEAP32[$4 + 40 >> 2] = $2 + 1;
         HEAP32[($4 + ($2 << 4) | 0) + 44 >> 2] = 13;
         break label$3;
        }
        if ($2 + $4 >>> 0 > 31) {
         break label$3
        }
        $11 = Math_fround(Math_fround(Math_fround(1.0) / Math_fround(Math_fround(1.0) - $5)) + Math_fround(-1.0));
        $5 = Math_fround($11 + Math_fround($4 | 0));
        $6 = 0;
        while (1) {
         HEAPF32[(($2 << 4) + $3 | 0) + 48 >> 2] = $7;
         $2 = HEAP32[$0 >> 2];
         HEAPF32[((HEAP32[$2 + 40 >> 2] << 4) + $2 | 0) + 52 >> 2] = Math_fround($6 | 0) / $5;
         $2 = HEAP32[$0 >> 2];
         $6 = $6 + 1 | 0;
         HEAPF32[((HEAP32[$2 + 40 >> 2] << 4) + $2 | 0) + 56 >> 2] = Math_fround($11 + Math_fround($6 | 0)) / $5;
         $3 = HEAP32[$0 >> 2];
         $8 = HEAP32[$3 + 40 >> 2];
         $2 = $8 + 1 | 0;
         HEAP32[$3 + 40 >> 2] = $2;
         HEAP32[(($8 << 4) + $3 | 0) + 44 >> 2] = 14;
         if (($4 | 0) != ($6 | 0)) {
          continue
         }
         break;
        };
        break label$3;
       }
       if ($4 >>> 0 < 17) {
        break label$3
       }
       if (strncmp(10725, $1, 15)) {
        break label$3
       }
       $10 = strtod($1 + 15 | 0);
       label$33 : {
        if (Math_abs($10) < 2147483648.0) {
         $4 = ~~$10;
         break label$33;
        }
        $4 = -2147483648;
       }
       $7 = Math_fround(.20000000298023224);
       $2 = strchr($1, 47);
       $5 = Math_fround(.20000000298023224);
       label$35 : {
        if (!$2) {
         break label$35
        }
        $3 = $2 + 1 | 0;
        $5 = Math_fround(.9900000095367432);
        if (!(Math_fround(strtod($3)) < Math_fround(.9900000095367432))) {
         break label$35
        }
        $5 = Math_fround(strtod($3));
       }
       $2 = strchr($2 ? $2 + 1 | 0 : $1, 47);
       if ($2) {
        $7 = Math_fround(strtod($2 + 1 | 0))
       }
       $3 = HEAP32[$0 >> 2];
       $2 = HEAP32[$3 + 40 >> 2];
       if (($4 | 0) <= 1) {
        HEAPF32[(($2 << 4) + $3 | 0) + 48 >> 2] = $7;
        $4 = HEAP32[$0 >> 2];
        $2 = HEAP32[$4 + 40 >> 2];
        HEAP32[$4 + 40 >> 2] = $2 + 1;
        HEAP32[($4 + ($2 << 4) | 0) + 44 >> 2] = 13;
        break label$3;
       }
       if ($2 + $4 >>> 0 > 31) {
        break label$3
       }
       $11 = Math_fround(Math_fround(Math_fround(1.0) / Math_fround(Math_fround(1.0) - $5)) + Math_fround(-1.0));
       $5 = Math_fround($11 + Math_fround($4 | 0));
       $6 = 0;
       while (1) {
        HEAPF32[(($2 << 4) + $3 | 0) + 48 >> 2] = $7;
        $2 = HEAP32[$0 >> 2];
        HEAPF32[((HEAP32[$2 + 40 >> 2] << 4) + $2 | 0) + 52 >> 2] = Math_fround($6 | 0) / $5;
        $2 = HEAP32[$0 >> 2];
        $6 = $6 + 1 | 0;
        HEAPF32[((HEAP32[$2 + 40 >> 2] << 4) + $2 | 0) + 56 >> 2] = Math_fround($11 + Math_fround($6 | 0)) / $5;
        $3 = HEAP32[$0 >> 2];
        $8 = HEAP32[$3 + 40 >> 2];
        $2 = $8 + 1 | 0;
        HEAP32[$3 + 40 >> 2] = $2;
        HEAP32[(($8 << 4) + $3 | 0) + 44 >> 2] = 15;
        if (($4 | 0) != ($6 | 0)) {
         continue
        }
        break;
       };
       break label$3;
      }
      if (strncmp(10741, $1, 5)) {
       break label$3
      }
      HEAP32[$2 + 40 >> 2] = $3 + 1;
      HEAP32[(($3 << 4) + $2 | 0) + 44 >> 2] = 16;
      break label$3;
     }
     $7 = Math_fround(strtod($1 + 6 | 0));
     if ($7 >= Math_fround(0.0) ^ 1 | $7 <= Math_fround(1.0) ^ 1) {
      break label$3
     }
     $4 = HEAP32[$0 >> 2];
     HEAPF32[((HEAP32[$4 + 40 >> 2] << 4) + $4 | 0) + 48 >> 2] = $7;
     $4 = HEAP32[$0 >> 2];
     $2 = HEAP32[$4 + 40 >> 2];
     HEAP32[$4 + 40 >> 2] = $2 + 1;
     HEAP32[($4 + ($2 << 4) | 0) + 44 >> 2] = 13;
    }
    $2 = HEAP32[$0 >> 2];
    $3 = HEAP32[$2 + 40 >> 2];
    if ($9) {
     $1 = ($3 | 0) == 32 ? $1 : $9 ? $9 + 1 | 0 : $1;
     if (($3 | 0) != 32) {
      continue
     }
    }
    break;
   };
   $4 = 1;
   if ($3) {
    break label$1
   }
   HEAP32[$2 + 40 >> 2] = 1;
   HEAP32[$2 + 44 >> 2] = 13;
   HEAP32[$2 + 48 >> 2] = 1056964608;
  }
  return $4;
 }
 
 function FLAC__stream_encoder_delete($0) {
  $0 = $0 | 0;
  var $1 = 0, $2 = 0;
  if ($0) {
   HEAP32[HEAP32[$0 + 4 >> 2] + 11848 >> 2] = 1;
   FLAC__stream_encoder_finish($0);
   $1 = HEAP32[$0 + 4 >> 2];
   $2 = HEAP32[$1 + 11752 >> 2];
   if ($2) {
    FLAC__stream_decoder_delete($2);
    $1 = HEAP32[$0 + 4 >> 2];
   }
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear($1 + 6256 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6268 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6280 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6292 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6304 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6316 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6328 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6340 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6352 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6364 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6376 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6388 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6400 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6412 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6424 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6436 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6448 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6460 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6472 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 6484 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 11724 | 0);
   FLAC__format_entropy_coding_method_partitioned_rice_contents_clear(HEAP32[$0 + 4 >> 2] + 11736 | 0);
   FLAC__bitwriter_delete(HEAP32[HEAP32[$0 + 4 >> 2] + 6856 >> 2]);
   dlfree(HEAP32[$0 + 4 >> 2]);
   dlfree(HEAP32[$0 >> 2]);
   dlfree($0);
  }
 }
 
 function FLAC__stream_encoder_finish($0) {
  $0 = $0 | 0;
  var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0;
  $7 = global$0 - 32 | 0;
  global$0 = $7;
  label$1 : {
   if (!$0) {
    break label$1
   }
   label$3 : {
    label$4 : {
     $5 = HEAP32[$0 >> 2];
     $1 = HEAP32[$5 >> 2];
     switch ($1 | 0) {
     case 1:
      break label$1;
     case 0:
      break label$4;
     default:
      break label$3;
     };
    }
    $2 = HEAP32[$0 + 4 >> 2];
    if (HEAP32[$2 + 11848 >> 2]) {
     break label$3
    }
    $2 = HEAP32[$2 + 7052 >> 2];
    if (!$2) {
     break label$3
    }
    $3 = HEAP32[$5 + 36 >> 2];
    HEAP32[$5 + 36 >> 2] = $2;
    $3 = !process_frame_($0, ($2 | 0) != ($3 | 0), 1);
    $5 = HEAP32[$0 >> 2];
   }
   if (HEAP32[$5 + 12 >> 2]) {
    $2 = HEAP32[$0 + 4 >> 2];
    FLAC__MD5Final($2 + 6928 | 0, $2 + 7060 | 0);
   }
   $5 = $0 + 4 | 0;
   $1 = HEAP32[$0 + 4 >> 2];
   label$6 : {
    if (HEAP32[$1 + 11848 >> 2]) {
     $2 = $3;
     break label$6;
    }
    $4 = HEAP32[$0 >> 2];
    label$8 : {
     if (HEAP32[$4 >> 2]) {
      break label$8
     }
     $11 = HEAP32[$1 + 7268 >> 2];
     if ($11) {
      label$10 : {
       if (HEAP32[$1 + 7260 >> 2]) {
        $13 = HEAP32[$1 + 6900 >> 2];
        $12 = HEAP32[$1 + 6896 >> 2];
        $2 = $1 + 6920 | 0;
        $8 = HEAP32[$2 >> 2];
        $9 = HEAP32[$2 + 4 >> 2];
        if ((FUNCTION_TABLE[$11]($0, 0, 0, HEAP32[$1 + 7288 >> 2]) | 0) == 2) {
         break label$10
        }
        simple_ogg_page__init($7);
        $2 = HEAP32[$0 >> 2];
        $4 = HEAP32[$2 + 608 >> 2];
        $6 = HEAP32[$2 + 612 >> 2];
        $2 = HEAP32[$0 + 4 >> 2];
        label$12 : {
         if (!simple_ogg_page__get_at($0, $4, $6, $7, HEAP32[$2 + 7268 >> 2], HEAP32[$2 + 7264 >> 2], HEAP32[$2 + 7288 >> 2])) {
          break label$12
         }
         $11 = HEAP32[1614] + HEAP32[1613] | 0;
         $14 = HEAP32[1619] + (HEAP32[1618] + (HEAP32[1617] + (HEAP32[1616] + ($11 + HEAP32[1615] | 0) | 0) | 0) | 0) | 0;
         $2 = $14 + HEAP32[1620] >>> 3 | 0;
         if ($2 + 33 >>> 0 > HEAPU32[$7 + 12 >> 2]) {
          HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
          simple_ogg_page__clear($7);
          break label$10;
         }
         $4 = $1 + 6936 | 0;
         $10 = HEAPU8[$4 + 4 | 0] | HEAPU8[$4 + 5 | 0] << 8 | (HEAPU8[$4 + 6 | 0] << 16 | HEAPU8[$4 + 7 | 0] << 24);
         $2 = $2 + HEAP32[$7 + 8 >> 2] | 0;
         $4 = HEAPU8[$4 | 0] | HEAPU8[$4 + 1 | 0] << 8 | (HEAPU8[$4 + 2 | 0] << 16 | HEAPU8[$4 + 3 | 0] << 24);
         HEAP8[$2 + 25 | 0] = $4;
         HEAP8[$2 + 26 | 0] = $4 >>> 8;
         HEAP8[$2 + 27 | 0] = $4 >>> 16;
         HEAP8[$2 + 28 | 0] = $4 >>> 24;
         HEAP8[$2 + 29 | 0] = $10;
         HEAP8[$2 + 30 | 0] = $10 >>> 8;
         HEAP8[$2 + 31 | 0] = $10 >>> 16;
         HEAP8[$2 + 32 | 0] = $10 >>> 24;
         $1 = $1 + 6928 | 0;
         $4 = HEAPU8[$1 + 4 | 0] | HEAPU8[$1 + 5 | 0] << 8 | (HEAPU8[$1 + 6 | 0] << 16 | HEAPU8[$1 + 7 | 0] << 24);
         $1 = HEAPU8[$1 | 0] | HEAPU8[$1 + 1 | 0] << 8 | (HEAPU8[$1 + 2 | 0] << 16 | HEAPU8[$1 + 3 | 0] << 24);
         HEAP8[$2 + 17 | 0] = $1;
         HEAP8[$2 + 18 | 0] = $1 >>> 8;
         HEAP8[$2 + 19 | 0] = $1 >>> 16;
         HEAP8[$2 + 20 | 0] = $1 >>> 24;
         HEAP8[$2 + 21 | 0] = $4;
         HEAP8[$2 + 22 | 0] = $4 >>> 8;
         HEAP8[$2 + 23 | 0] = $4 >>> 16;
         HEAP8[$2 + 24 | 0] = $4 >>> 24;
         $2 = $14 + -4 >>> 3 | 0;
         if ($2 + 22 >>> 0 > HEAPU32[$7 + 12 >> 2]) {
          HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
          simple_ogg_page__clear($7);
          break label$10;
         }
         $2 = $2 + HEAP32[$7 + 8 >> 2] | 0;
         HEAP8[$2 + 21 | 0] = $8;
         HEAP8[$2 + 20 | 0] = ($9 & 255) << 24 | $8 >>> 8;
         HEAP8[$2 + 19 | 0] = ($9 & 65535) << 16 | $8 >>> 16;
         HEAP8[$2 + 18 | 0] = ($9 & 16777215) << 8 | $8 >>> 24;
         $2 = $2 + 17 | 0;
         HEAP8[$2 | 0] = HEAPU8[$2 | 0] & 240 | $9 & 15;
         $2 = $11 >>> 3 | 0;
         if ($2 + 23 >>> 0 > HEAPU32[$7 + 12 >> 2]) {
          HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
          simple_ogg_page__clear($7);
          break label$10;
         }
         $2 = $2 + HEAP32[$7 + 8 >> 2] | 0;
         HEAP8[$2 + 22 | 0] = $13;
         HEAP8[$2 + 21 | 0] = $13 >>> 8;
         HEAP8[$2 + 20 | 0] = $13 >>> 16;
         HEAP8[$2 + 19 | 0] = $12;
         HEAP8[$2 + 18 | 0] = $12 >>> 8;
         HEAP8[$2 + 17 | 0] = $12 >>> 16;
         $2 = HEAP32[$0 >> 2];
         $4 = HEAP32[$2 + 608 >> 2];
         $1 = HEAP32[$2 + 612 >> 2];
         $2 = HEAP32[$0 + 4 >> 2];
         $2 = simple_ogg_page__set_at($0, $4, $1, $7, HEAP32[$2 + 7268 >> 2], HEAP32[$2 + 7276 >> 2], HEAP32[$2 + 7288 >> 2]);
         simple_ogg_page__clear($7);
         if (!$2) {
          break label$10
         }
         $2 = HEAP32[HEAP32[$5 >> 2] + 7048 >> 2];
         if (!$2 | !HEAP32[$2 >> 2]) {
          break label$10
         }
         $1 = HEAP32[$0 >> 2];
         if (!(HEAP32[$1 + 616 >> 2] | HEAP32[$1 + 620 >> 2])) {
          break label$10
         }
         FLAC__format_seektable_sort($2);
         simple_ogg_page__init($7);
         $2 = HEAP32[$0 >> 2];
         $4 = HEAP32[$2 + 616 >> 2];
         $1 = HEAP32[$2 + 620 >> 2];
         $2 = HEAP32[$0 + 4 >> 2];
         if (!simple_ogg_page__get_at($0, $4, $1, $7, HEAP32[$2 + 7268 >> 2], HEAP32[$2 + 7264 >> 2], HEAP32[$2 + 7288 >> 2])) {
          break label$12
         }
         $6 = HEAP32[$5 >> 2];
         $2 = HEAP32[$6 + 7048 >> 2];
         $1 = HEAP32[$2 >> 2];
         if (HEAP32[$7 + 12 >> 2] != (Math_imul($1, 18) + 4 | 0)) {
          HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
          simple_ogg_page__clear($7);
          break label$10;
         }
         if ($1) {
          $1 = HEAP32[$7 + 8 >> 2] + 4 | 0;
          $4 = 0;
          while (1) {
           $8 = HEAP32[$2 + 4 >> 2] + Math_imul($4, 24) | 0;
           $9 = HEAP32[$8 >> 2];
           $2 = HEAP32[$8 + 4 >> 2];
           $10 = HEAP32[$8 + 8 >> 2];
           $6 = HEAP32[$8 + 12 >> 2];
           $8 = HEAP32[$8 + 16 >> 2];
           HEAP8[$1 + 17 | 0] = $8;
           HEAP8[$1 + 15 | 0] = $10;
           HEAP8[$1 + 7 | 0] = $9;
           HEAP8[$1 + 16 | 0] = $8 >>> 8;
           HEAP8[$1 + 14 | 0] = ($6 & 255) << 24 | $10 >>> 8;
           HEAP8[$1 + 13 | 0] = ($6 & 65535) << 16 | $10 >>> 16;
           HEAP8[$1 + 12 | 0] = ($6 & 16777215) << 8 | $10 >>> 24;
           HEAP8[$1 + 11 | 0] = $6;
           HEAP8[$1 + 10 | 0] = $6 >>> 8;
           HEAP8[$1 + 9 | 0] = $6 >>> 16;
           HEAP8[$1 + 8 | 0] = $6 >>> 24;
           HEAP8[$1 + 6 | 0] = ($2 & 255) << 24 | $9 >>> 8;
           HEAP8[$1 + 5 | 0] = ($2 & 65535) << 16 | $9 >>> 16;
           HEAP8[$1 + 4 | 0] = ($2 & 16777215) << 8 | $9 >>> 24;
           HEAP8[$1 + 3 | 0] = $2;
           HEAP8[$1 + 2 | 0] = $2 >>> 8;
           HEAP8[$1 + 1 | 0] = $2 >>> 16;
           HEAP8[$1 | 0] = $2 >>> 24;
           $1 = $1 + 18 | 0;
           $4 = $4 + 1 | 0;
           $6 = HEAP32[$5 >> 2];
           $2 = HEAP32[$6 + 7048 >> 2];
           if ($4 >>> 0 < HEAPU32[$2 >> 2]) {
            continue
           }
           break;
          };
         }
         $2 = HEAP32[$0 >> 2];
         simple_ogg_page__set_at($0, HEAP32[$2 + 616 >> 2], HEAP32[$2 + 620 >> 2], $7, HEAP32[$6 + 7268 >> 2], HEAP32[$6 + 7276 >> 2], HEAP32[$6 + 7288 >> 2]);
        }
        simple_ogg_page__clear($7);
        break label$10;
       }
       $13 = HEAP32[$1 + 6912 >> 2];
       $8 = HEAP32[$1 + 6900 >> 2];
       $9 = HEAP32[$1 + 6896 >> 2];
       $6 = $1 + 6920 | 0;
       $2 = HEAP32[$6 >> 2];
       $6 = HEAP32[$6 + 4 >> 2];
       label$19 : {
        label$20 : {
         $16 = $0;
         $10 = HEAP32[$4 + 612 >> 2];
         $12 = HEAP32[1614] + HEAP32[1613] | 0;
         $14 = HEAP32[1619] + (HEAP32[1618] + (HEAP32[1617] + (HEAP32[1616] + ($12 + HEAP32[1615] | 0) | 0) | 0) | 0) | 0;
         $15 = ($14 + HEAP32[1620] >>> 3 | 0) + 4 | 0;
         $4 = $15 + HEAP32[$4 + 608 >> 2] | 0;
         if ($4 >>> 0 < $15 >>> 0) {
          $10 = $10 + 1 | 0
         }
         switch (FUNCTION_TABLE[$11]($16, $4, $10, HEAP32[$1 + 7288 >> 2]) | 0) {
         case 0:
          break label$19;
         case 1:
          break label$20;
         default:
          break label$10;
         };
        }
        HEAP32[HEAP32[$0 >> 2] >> 2] = 5;
        break label$10;
       }
       $4 = $1 + 6928 | 0;
       $1 = HEAP32[$0 + 4 >> 2];
       if (FUNCTION_TABLE[HEAP32[$1 + 7276 >> 2]]($0, $4, 16, 0, 0, HEAP32[$1 + 7288 >> 2])) {
        HEAP32[HEAP32[$0 >> 2] >> 2] = 5;
        break label$10;
       }
       HEAP8[$7 + 4 | 0] = $2;
       HEAP8[$7 + 3 | 0] = ($6 & 255) << 24 | $2 >>> 8;
       HEAP8[$7 + 2 | 0] = ($6 & 65535) << 16 | $2 >>> 16;
       HEAP8[$7 + 1 | 0] = ($6 & 16777215) << 8 | $2 >>> 24;
       HEAP8[$7 | 0] = ($6 & 15 | $13 << 4) + 240;
       label$22 : {
        label$23 : {
         $2 = ($14 + -4 >>> 3 | 0) + 4 | 0;
         $1 = HEAP32[$0 >> 2];
         $4 = $2 + HEAP32[$1 + 608 >> 2] | 0;
         $1 = HEAP32[$1 + 612 >> 2];
         $1 = $4 >>> 0 < $2 >>> 0 ? $1 + 1 | 0 : $1;
         $2 = HEAP32[$0 + 4 >> 2];
         switch (FUNCTION_TABLE[HEAP32[$2 + 7268 >> 2]]($0, $4, $1, HEAP32[$2 + 7288 >> 2]) | 0) {
         case 0:
          break label$22;
         case 1:
          break label$23;
         default:
          break label$10;
         };
        }
        HEAP32[HEAP32[$0 >> 2] >> 2] = 5;
        break label$10;
       }
       $2 = HEAP32[$0 + 4 >> 2];
       if (FUNCTION_TABLE[HEAP32[$2 + 7276 >> 2]]($0, $7, 5, 0, 0, HEAP32[$2 + 7288 >> 2])) {
        HEAP32[HEAP32[$0 >> 2] >> 2] = 5;
        break label$10;
       }
       HEAP8[$7 + 5 | 0] = $8;
       HEAP8[$7 + 4 | 0] = $8 >>> 8;
       HEAP8[$7 + 3 | 0] = $8 >>> 16;
       HEAP8[$7 + 2 | 0] = $9;
       HEAP8[$7 + 1 | 0] = $9 >>> 8;
       HEAP8[$7 | 0] = $9 >>> 16;
       label$25 : {
        label$26 : {
         $2 = ($12 >>> 3 | 0) + 4 | 0;
         $1 = HEAP32[$0 >> 2];
         $4 = $2 + HEAP32[$1 + 608 >> 2] | 0;
         $1 = HEAP32[$1 + 612 >> 2];
         $1 = $4 >>> 0 < $2 >>> 0 ? $1 + 1 | 0 : $1;
         $2 = HEAP32[$0 + 4 >> 2];
         switch (FUNCTION_TABLE[HEAP32[$2 + 7268 >> 2]]($0, $4, $1, HEAP32[$2 + 7288 >> 2]) | 0) {
         case 0:
          break label$25;
         case 1:
          break label$26;
         default:
          break label$10;
         };
        }
        HEAP32[HEAP32[$0 >> 2] >> 2] = 5;
        break label$10;
       }
       $2 = HEAP32[$0 + 4 >> 2];
       if (FUNCTION_TABLE[HEAP32[$2 + 7276 >> 2]]($0, $7, 6, 0, 0, HEAP32[$2 + 7288 >> 2])) {
        HEAP32[HEAP32[$0 >> 2] >> 2] = 5;
        break label$10;
       }
       $2 = HEAP32[HEAP32[$5 >> 2] + 7048 >> 2];
       if (!$2 | !HEAP32[$2 >> 2]) {
        break label$10
       }
       $1 = HEAP32[$0 >> 2];
       if (!(HEAP32[$1 + 616 >> 2] | HEAP32[$1 + 620 >> 2])) {
        break label$10
       }
       FLAC__format_seektable_sort($2);
       label$28 : {
        label$29 : {
         label$30 : {
          $2 = HEAP32[$0 >> 2];
          $1 = HEAP32[$2 + 616 >> 2] + 4 | 0;
          $2 = HEAP32[$2 + 620 >> 2];
          $4 = $1 >>> 0 < 4 ? $2 + 1 | 0 : $2;
          $2 = HEAP32[$0 + 4 >> 2];
          switch (FUNCTION_TABLE[HEAP32[$2 + 7268 >> 2]]($0, $1, $4, HEAP32[$2 + 7288 >> 2]) | 0) {
          case 1:
           break label$29;
          case 0:
           break label$30;
          default:
           break label$10;
          };
         }
         $4 = HEAP32[$5 >> 2];
         $1 = HEAP32[$4 + 7048 >> 2];
         if (!HEAP32[$1 >> 2]) {
          break label$10
         }
         $6 = 0;
         break label$28;
        }
        HEAP32[HEAP32[$0 >> 2] >> 2] = 5;
        break label$10;
       }
       while (1) {
        label$32 : {
         $9 = Math_imul($6, 24);
         $8 = $9 + HEAP32[$1 + 4 >> 2] | 0;
         $2 = HEAP32[$8 + 4 >> 2];
         $8 = HEAP32[$8 >> 2];
         $10 = $8 << 24 | $8 << 8 & 16711680;
         HEAP32[$7 >> 2] = (($2 & 255) << 24 | $8 >>> 8) & -16777216 | (($2 & 16777215) << 8 | $8 >>> 24) & 16711680 | ($2 >>> 8 & 65280 | $2 >>> 24);
         HEAP32[$7 + 4 >> 2] = ($2 << 24 | $8 >>> 8) & 65280 | ($2 << 8 | $8 >>> 24) & 255 | $10;
         $8 = $9 + HEAP32[$1 + 4 >> 2] | 0;
         $2 = HEAP32[$8 + 12 >> 2];
         $8 = HEAP32[$8 + 8 >> 2];
         $10 = $8 << 24 | $8 << 8 & 16711680;
         HEAP32[$7 + 8 >> 2] = (($2 & 255) << 24 | $8 >>> 8) & -16777216 | (($2 & 16777215) << 8 | $8 >>> 24) & 16711680 | ($2 >>> 8 & 65280 | $2 >>> 24);
         HEAP32[$7 + 12 >> 2] = ($2 << 24 | $8 >>> 8) & 65280 | ($2 << 8 | $8 >>> 24) & 255 | $10;
         $2 = HEAPU16[($9 + HEAP32[$1 + 4 >> 2] | 0) + 16 >> 1];
         HEAP16[$7 + 16 >> 1] = ($2 << 24 | $2 << 8 & 16711680) >>> 16;
         if (FUNCTION_TABLE[HEAP32[$4 + 7276 >> 2]]($0, $7, 18, 0, 0, HEAP32[$4 + 7288 >> 2])) {
          break label$32
         }
         $6 = $6 + 1 | 0;
         $4 = HEAP32[$5 >> 2];
         $1 = HEAP32[$4 + 7048 >> 2];
         if ($6 >>> 0 < HEAPU32[$1 >> 2]) {
          continue
         }
         break label$10;
        }
        break;
       };
       HEAP32[HEAP32[$0 >> 2] >> 2] = 5;
      }
      $1 = HEAP32[$0 + 4 >> 2];
      $4 = HEAP32[$0 >> 2];
      $3 = HEAP32[$4 >> 2] ? 1 : $3;
     }
     $2 = HEAP32[$1 + 7280 >> 2];
     if (!$2) {
      break label$8
     }
     FUNCTION_TABLE[$2]($0, $1 + 6872 | 0, HEAP32[$1 + 7288 >> 2]);
     $4 = HEAP32[$0 >> 2];
    }
    if (!HEAP32[$4 + 4 >> 2]) {
     $2 = $3;
     break label$6;
    }
    $2 = HEAP32[HEAP32[$5 >> 2] + 11752 >> 2];
    if (!$2) {
     $2 = $3;
     break label$6;
    }
    if (FLAC__stream_decoder_finish($2)) {
     $2 = $3;
     break label$6;
    }
    $2 = 1;
    if ($3) {
     break label$6
    }
    HEAP32[HEAP32[$0 >> 2] >> 2] = 4;
   }
   $1 = HEAP32[$5 >> 2];
   $3 = HEAP32[$1 + 7296 >> 2];
   if ($3) {
    if (($3 | 0) != HEAP32[1893]) {
     fclose($3);
     $1 = HEAP32[$5 >> 2];
    }
    HEAP32[$1 + 7296 >> 2] = 0;
   }
   if (HEAP32[$1 + 7260 >> 2]) {
    ogg_stream_clear(HEAP32[$0 >> 2] + 640 | 0)
   }
   $1 = HEAP32[$0 >> 2];
   $3 = HEAP32[$1 + 600 >> 2];
   if ($3) {
    dlfree($3);
    $1 = HEAP32[$0 >> 2];
    HEAP32[$1 + 600 >> 2] = 0;
    HEAP32[$1 + 604 >> 2] = 0;
   }
   if (HEAP32[$1 + 24 >> 2]) {
    $3 = 0;
    while (1) {
     $4 = HEAP32[$5 >> 2];
     $1 = $3 << 2;
     $6 = HEAP32[($4 + $1 | 0) + 7328 >> 2];
     if ($6) {
      dlfree($6);
      HEAP32[($1 + HEAP32[$5 >> 2] | 0) + 7328 >> 2] = 0;
      $4 = HEAP32[$5 >> 2];
     }
     $4 = HEAP32[($4 + $1 | 0) + 7368 >> 2];
     if ($4) {
      dlfree($4);
      HEAP32[($1 + HEAP32[$5 >> 2] | 0) + 7368 >> 2] = 0;
     }
     $3 = $3 + 1 | 0;
     if ($3 >>> 0 < HEAPU32[HEAP32[$0 >> 2] + 24 >> 2]) {
      continue
     }
     break;
    };
   }
   $1 = HEAP32[$5 >> 2];
   $3 = HEAP32[$1 + 7360 >> 2];
   if ($3) {
    dlfree($3);
    HEAP32[HEAP32[$5 >> 2] + 7360 >> 2] = 0;
    $1 = HEAP32[$5 >> 2];
   }
   $3 = HEAP32[$1 + 7400 >> 2];
   if ($3) {
    dlfree($3);
    HEAP32[HEAP32[$5 >> 2] + 7400 >> 2] = 0;
    $1 = HEAP32[$5 >> 2];
   }
   $3 = HEAP32[$1 + 7364 >> 2];
   if ($3) {
    dlfree($3);
    HEAP32[HEAP32[$5 >> 2] + 7364 >> 2] = 0;
    $1 = HEAP32[$5 >> 2];
   }
   $3 = HEAP32[$1 + 7404 >> 2];
   if ($3) {
    dlfree($3);
    HEAP32[HEAP32[$5 >> 2] + 7404 >> 2] = 0;
    $1 = HEAP32[$5 >> 2];
   }
   $4 = HEAP32[$0 >> 2];
   if (HEAP32[$4 + 40 >> 2]) {
    $3 = 0;
    while (1) {
     $6 = $3 << 2;
     $8 = HEAP32[($6 + $1 | 0) + 7408 >> 2];
     if ($8) {
      dlfree($8);
      HEAP32[($6 + HEAP32[$0 + 4 >> 2] | 0) + 7408 >> 2] = 0;
      $4 = HEAP32[$0 >> 2];
      $1 = HEAP32[$0 + 4 >> 2];
     }
     $3 = $3 + 1 | 0;
     if ($3 >>> 0 < HEAPU32[$4 + 40 >> 2]) {
      continue
     }
     break;
    };
   }
   $3 = HEAP32[$1 + 7536 >> 2];
   if ($3) {
    dlfree($3);
    $1 = HEAP32[$0 + 4 >> 2];
    HEAP32[$1 + 7536 >> 2] = 0;
    $4 = HEAP32[$0 >> 2];
   }
   if (HEAP32[$4 + 24 >> 2]) {
    $4 = 0;
    while (1) {
     $3 = $4 << 3;
     $6 = HEAP32[($3 + $1 | 0) + 7540 >> 2];
     if ($6) {
      dlfree($6);
      HEAP32[($3 + HEAP32[$5 >> 2] | 0) + 7540 >> 2] = 0;
      $1 = HEAP32[$5 >> 2];
     }
     $6 = HEAP32[($1 + $3 | 0) + 7544 >> 2];
     if ($6) {
      dlfree($6);
      HEAP32[($3 + HEAP32[$5 >> 2] | 0) + 7544 >> 2] = 0;
      $1 = HEAP32[$5 >> 2];
     }
     $4 = $4 + 1 | 0;
     if ($4 >>> 0 < HEAPU32[HEAP32[$0 >> 2] + 24 >> 2]) {
      continue
     }
     break;
    };
   }
   $3 = HEAP32[$1 + 7604 >> 2];
   if ($3) {
    dlfree($3);
    HEAP32[HEAP32[$5 >> 2] + 7604 >> 2] = 0;
    $1 = HEAP32[$5 >> 2];
   }
   $3 = HEAP32[$1 + 7608 >> 2];
   if ($3) {
    dlfree($3);
    HEAP32[HEAP32[$5 >> 2] + 7608 >> 2] = 0;
    $1 = HEAP32[$5 >> 2];
   }
   $3 = HEAP32[$1 + 7612 >> 2];
   if ($3) {
    dlfree($3);
    HEAP32[HEAP32[$5 >> 2] + 7612 >> 2] = 0;
    $1 = HEAP32[$5 >> 2];
   }
   $3 = HEAP32[$1 + 7616 >> 2];
   if ($3) {
    dlfree($3);
    HEAP32[HEAP32[$5 >> 2] + 7616 >> 2] = 0;
    $1 = HEAP32[$5 >> 2];
   }
   $3 = HEAP32[$1 + 7620 >> 2];
   if ($3) {
    dlfree($3);
    $1 = HEAP32[$5 >> 2];
    HEAP32[$1 + 7620 >> 2] = 0;
   }
   $3 = HEAP32[$1 + 7624 >> 2];
   if ($3) {
    dlfree($3);
    $1 = HEAP32[$5 >> 2];
    HEAP32[$1 + 7624 >> 2] = 0;
   }
   $3 = HEAP32[$0 >> 2];
   if (!(!HEAP32[$3 + 4 >> 2] | !HEAP32[$3 + 24 >> 2])) {
    $5 = 0;
    while (1) {
     $4 = $5 << 2;
     $6 = HEAP32[($4 + $1 | 0) + 11764 >> 2];
     if ($6) {
      dlfree($6);
      HEAP32[($4 + HEAP32[$0 + 4 >> 2] | 0) + 11764 >> 2] = 0;
      $1 = HEAP32[$0 + 4 >> 2];
      $3 = HEAP32[$0 >> 2];
     }
     $5 = $5 + 1 | 0;
     if ($5 >>> 0 < HEAPU32[$3 + 24 >> 2]) {
      continue
     }
     break;
    };
   }
   FLAC__bitwriter_free(HEAP32[$1 + 6856 >> 2]);
   $3 = HEAP32[$0 >> 2];
   HEAP32[$3 + 44 >> 2] = 13;
   HEAP32[$3 + 48 >> 2] = 1056964608;
   HEAP32[$3 + 36 >> 2] = 0;
   HEAP32[$3 + 40 >> 2] = 1;
   HEAP32[$3 + 28 >> 2] = 16;
   HEAP32[$3 + 32 >> 2] = 44100;
   HEAP32[$3 + 20 >> 2] = 0;
   HEAP32[$3 + 24 >> 2] = 2;
   HEAP32[$3 + 12 >> 2] = 1;
   HEAP32[$3 + 16 >> 2] = 0;
   HEAP32[$3 + 4 >> 2] = 0;
   HEAP32[$3 + 8 >> 2] = 1;
   $3 = HEAP32[$0 >> 2];
   HEAP32[$3 + 592 >> 2] = 0;
   HEAP32[$3 + 596 >> 2] = 0;
   HEAP32[$3 + 556 >> 2] = 0;
   HEAP32[$3 + 560 >> 2] = 0;
   HEAP32[$3 + 564 >> 2] = 0;
   HEAP32[$3 + 568 >> 2] = 0;
   HEAP32[$3 + 572 >> 2] = 0;
   HEAP32[$3 + 576 >> 2] = 0;
   HEAP32[$3 + 580 >> 2] = 0;
   HEAP32[$3 + 584 >> 2] = 0;
   HEAP32[$3 + 600 >> 2] = 0;
   HEAP32[$3 + 604 >> 2] = 0;
   $1 = HEAP32[$0 + 4 >> 2];
   HEAP32[$1 + 7248 >> 2] = 0;
   HEAP32[$1 + 7252 >> 2] = 0;
   HEAP32[$1 + 7048 >> 2] = 0;
   $5 = $1 + 7256 | 0;
   HEAP32[$5 >> 2] = 0;
   HEAP32[$5 + 4 >> 2] = 0;
   $5 = $1 + 7264 | 0;
   HEAP32[$5 >> 2] = 0;
   HEAP32[$5 + 4 >> 2] = 0;
   $5 = $1 + 7272 | 0;
   HEAP32[$5 >> 2] = 0;
   HEAP32[$5 + 4 >> 2] = 0;
   $5 = $1 + 7280 | 0;
   HEAP32[$5 >> 2] = 0;
   HEAP32[$5 + 4 >> 2] = 0;
   HEAP32[$1 + 7288 >> 2] = 0;
   FLAC__ogg_encoder_aspect_set_defaults($3 + 632 | 0);
   $1 = HEAP32[$0 >> 2];
   label$74 : {
    if (HEAP32[$1 >> 2] != 1) {
     break label$74
    }
    HEAP32[$1 + 16 >> 2] = 1;
    HEAP32[$1 + 20 >> 2] = 0;
    FLAC__stream_encoder_set_apodization($0, 10761);
    $1 = HEAP32[$0 >> 2];
    if (HEAP32[$1 >> 2] != 1) {
     break label$74
    }
    HEAP32[$1 + 576 >> 2] = 0;
    HEAP32[$1 + 580 >> 2] = 5;
    HEAP32[$1 + 564 >> 2] = 0;
    HEAP32[$1 + 568 >> 2] = 0;
    HEAP32[$1 + 556 >> 2] = 8;
    HEAP32[$1 + 560 >> 2] = 0;
   }
   if (!$2) {
    HEAP32[$1 >> 2] = 1
   }
   $1 = !$2;
  }
  global$0 = $7 + 32 | 0;
  return $1 | 0;
 }
 
 function process_frame_($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0;
  $7 = global$0 - 48 | 0;
  global$0 = $7;
  label$1 : {
   label$2 : {
    $4 = HEAP32[$0 >> 2];
    if (!HEAP32[$4 + 12 >> 2]) {
     break label$2
    }
    $3 = HEAP32[$0 + 4 >> 2];
    $3 = FLAC__MD5Accumulate($3 + 7060 | 0, $3 + 4 | 0, HEAP32[$4 + 24 >> 2], HEAP32[$4 + 36 >> 2], HEAP32[$4 + 28 >> 2] + 7 >>> 3 | 0);
    $4 = HEAP32[$0 >> 2];
    if ($3) {
     break label$2
    }
    HEAP32[$4 >> 2] = 8;
    $1 = 0;
    break label$1;
   }
   $15 = HEAP32[$4 + 576 >> 2];
   if ($1) {
    $12 = 0
   } else {
    $1 = FLAC__format_get_max_rice_partition_order_from_blocksize(HEAP32[$4 + 36 >> 2]);
    $4 = HEAP32[$0 >> 2];
    $3 = HEAP32[$4 + 580 >> 2];
    $12 = $1 >>> 0 < $3 >>> 0 ? $1 : $3;
   }
   $5 = HEAP32[$4 + 36 >> 2];
   HEAP32[$7 + 8 >> 2] = $5;
   HEAP32[$7 + 12 >> 2] = HEAP32[$4 + 32 >> 2];
   $1 = HEAP32[$4 + 24 >> 2];
   HEAP32[$7 + 20 >> 2] = 0;
   HEAP32[$7 + 16 >> 2] = $1;
   $1 = HEAP32[$4 + 28 >> 2];
   HEAP32[$7 + 28 >> 2] = 0;
   HEAP32[$7 + 24 >> 2] = $1;
   $6 = HEAP32[$0 + 4 >> 2];
   HEAP32[$7 + 32 >> 2] = HEAP32[$6 + 7056 >> 2];
   label$5 : {
    label$6 : {
     if (!HEAP32[$4 + 16 >> 2]) {
      break label$6
     }
     $14 = 1;
     if (!HEAP32[$4 + 20 >> 2] | !HEAP32[$6 + 6864 >> 2]) {
      break label$6
     }
     $1 = HEAP32[$6 + 6868 >> 2];
     $14 = ($1 | 0) != 0;
     if ($1) {
      break label$5
     }
    }
    if (!HEAP32[$4 + 24 >> 2]) {
     $10 = 1;
     break label$5;
    }
    while (1) {
     $10 = ($13 << 2) + $6 | 0;
     $1 = 0;
     $8 = 0;
     label$9 : {
      if (!$5) {
       break label$9
      }
      $11 = HEAP32[$10 + 4 >> 2];
      $3 = 0;
      while (1) {
       label$11 : {
        $1 = HEAP32[$11 + ($3 << 2) >> 2] | $1;
        $9 = $1 & 1;
        $3 = $3 + 1 | 0;
        if ($3 >>> 0 >= $5 >>> 0) {
         break label$11
        }
        if (!$9) {
         continue
        }
       }
       break;
      };
      $3 = 0;
      $8 = 0;
      if (!$1) {
       break label$9
      }
      $8 = 0;
      if ($9) {
       break label$9
      }
      while (1) {
       $3 = $3 + 1 | 0;
       $9 = $1 & 2;
       $1 = $1 >> 1;
       if (!$9) {
        continue
       }
       break;
      };
      $1 = 0;
      $8 = 0;
      if (!$3) {
       break label$9
      }
      while (1) {
       $9 = $11 + ($1 << 2) | 0;
       HEAP32[$9 >> 2] = HEAP32[$9 >> 2] >> $3;
       $1 = $1 + 1 | 0;
       if (($1 | 0) != ($5 | 0)) {
        continue
       }
       break;
      };
      $8 = $3;
     }
     $1 = $8;
     $5 = Math_imul($13, 584) + $6 | 0;
     $3 = HEAP32[$4 + 28 >> 2];
     $1 = $1 >>> 0 > $3 >>> 0 ? $3 : $1;
     HEAP32[$5 + 624 >> 2] = $1;
     HEAP32[$5 + 916 >> 2] = $1;
     HEAP32[$10 + 216 >> 2] = $3 - $1;
     $10 = 1;
     $13 = $13 + 1 | 0;
     if ($13 >>> 0 >= HEAPU32[$4 + 24 >> 2]) {
      break label$5
     }
     $5 = HEAP32[$4 + 36 >> 2];
     continue;
    };
   }
   if ($14) {
    $1 = 0;
    $5 = 0;
    $13 = HEAP32[$4 + 36 >> 2];
    label$15 : {
     if (!$13) {
      break label$15
     }
     $11 = HEAP32[$6 + 36 >> 2];
     $3 = 0;
     while (1) {
      label$17 : {
       $3 = HEAP32[$11 + ($5 << 2) >> 2] | $3;
       $9 = $3 & 1;
       $5 = $5 + 1 | 0;
       if ($5 >>> 0 >= $13 >>> 0) {
        break label$17
       }
       if (!$9) {
        continue
       }
      }
      break;
     };
     $5 = 0;
     if ($9 | !$3) {
      break label$15
     }
     while (1) {
      $5 = $5 + 1 | 0;
      $9 = $3 & 2;
      $3 = $3 >> 1;
      if (!$9) {
       continue
      }
      break;
     };
     $3 = 0;
     if (!$5) {
      $5 = 0;
      break label$15;
     }
     while (1) {
      $9 = $11 + ($3 << 2) | 0;
      HEAP32[$9 >> 2] = HEAP32[$9 >> 2] >> $5;
      $3 = $3 + 1 | 0;
      if (($13 | 0) != ($3 | 0)) {
       continue
      }
      break;
     };
    }
    $3 = HEAP32[$4 + 28 >> 2];
    $5 = $5 >>> 0 > $3 >>> 0 ? $3 : $5;
    HEAP32[$6 + 5296 >> 2] = $5;
    HEAP32[$6 + 5588 >> 2] = $5;
    HEAP32[$6 + 248 >> 2] = $3 - $5;
    $5 = HEAP32[$4 + 36 >> 2];
    label$21 : {
     if (!$5) {
      break label$21
     }
     $13 = HEAP32[$6 + 40 >> 2];
     $3 = 0;
     while (1) {
      label$23 : {
       $1 = HEAP32[$13 + ($3 << 2) >> 2] | $1;
       $11 = $1 & 1;
       $3 = $3 + 1 | 0;
       if ($3 >>> 0 >= $5 >>> 0) {
        break label$23
       }
       if (!$11) {
        continue
       }
      }
      break;
     };
     $3 = 0;
     if (!$1) {
      $1 = 0;
      break label$21;
     }
     if ($11) {
      $1 = 0;
      break label$21;
     }
     while (1) {
      $3 = $3 + 1 | 0;
      $11 = $1 & 2;
      $1 = $1 >> 1;
      if (!$11) {
       continue
      }
      break;
     };
     $1 = 0;
     if (!$3) {
      break label$21
     }
     while (1) {
      $11 = $13 + ($1 << 2) | 0;
      HEAP32[$11 >> 2] = HEAP32[$11 >> 2] >> $3;
      $1 = $1 + 1 | 0;
      if (($5 | 0) != ($1 | 0)) {
       continue
      }
      break;
     };
     $1 = $3;
    }
    $3 = HEAP32[$4 + 28 >> 2];
    $1 = $1 >>> 0 > $3 >>> 0 ? $3 : $1;
    HEAP32[$6 + 5880 >> 2] = $1;
    HEAP32[$6 + 6172 >> 2] = $1;
    HEAP32[$6 + 252 >> 2] = ($3 - $1 | 0) + 1;
   }
   $3 = $15 >>> 0 < $12 >>> 0 ? $15 : $12;
   if (!(!$10 | !HEAP32[$4 + 24 >> 2])) {
    $1 = 0;
    while (1) {
     $4 = ($1 << 2) + $6 | 0;
     $6 = ($1 << 3) + $6 | 0;
     process_subframe_($0, $3, $12, $7 + 8 | 0, HEAP32[$4 + 216 >> 2], HEAP32[$4 + 4 >> 2], $6 + 6176 | 0, $6 + 6640 | 0, $6 + 256 | 0, $4 + 6768 | 0, $4 + 6808 | 0);
     $6 = HEAP32[$0 + 4 >> 2];
     $1 = $1 + 1 | 0;
     if ($1 >>> 0 < HEAPU32[HEAP32[$0 >> 2] + 24 >> 2]) {
      continue
     }
     break;
    };
   }
   label$30 : {
    label$31 : {
     if ($14) {
      process_subframe_($0, $3, $12, $7 + 8 | 0, HEAP32[$6 + 248 >> 2], HEAP32[$6 + 36 >> 2], $6 + 6240 | 0, $6 + 6704 | 0, $6 + 320 | 0, $6 + 6800 | 0, $6 + 6840 | 0);
      $1 = HEAP32[$0 + 4 >> 2];
      process_subframe_($0, $3, $12, $7 + 8 | 0, HEAP32[$1 + 252 >> 2], HEAP32[$1 + 40 >> 2], $1 + 6248 | 0, $1 + 6712 | 0, $1 + 328 | 0, $1 + 6804 | 0, $1 + 6844 | 0);
      $8 = $7;
      $1 = HEAP32[$0 + 4 >> 2];
      label$33 : {
       if (!(!HEAP32[HEAP32[$0 >> 2] + 20 >> 2] | !HEAP32[$1 + 6864 >> 2])) {
        $3 = HEAP32[$1 + 6868 >> 2] ? 3 : 0;
        break label$33;
       }
       $3 = HEAP32[$1 + 6844 >> 2];
       $4 = HEAP32[$1 + 6808 >> 2];
       $6 = $3 + $4 | 0;
       $5 = HEAP32[$1 + 6812 >> 2];
       $4 = $4 + $5 | 0;
       $10 = $6 >>> 0 < $4 >>> 0;
       $5 = $3 + $5 | 0;
       $4 = $10 ? $6 : $4;
       $6 = $5 >>> 0 < $4 >>> 0;
       $3 = $3 + HEAP32[$1 + 6840 >> 2] >>> 0 < ($6 ? $5 : $4) >>> 0 ? 3 : $6 ? 2 : $10;
      }
      HEAP32[$8 + 20 >> 2] = $3;
      if (!FLAC__frame_add_header($7 + 8 | 0, HEAP32[$1 + 6856 >> 2])) {
       HEAP32[HEAP32[$0 >> 2] >> 2] = 7;
       $1 = 0;
       break label$1;
      }
      $8 = $0;
      $6 = HEAP32[$7 + 8 >> 2];
      label$36 : {
       label$37 : {
        switch ($3 | 0) {
        default:
         $1 = HEAP32[$0 + 4 >> 2];
         $5 = 0;
         $3 = 0;
         $10 = 0;
         $12 = 0;
         break label$36;
        case 0:
         $1 = HEAP32[$0 + 4 >> 2];
         $4 = $1 + 336 | 0;
         $3 = $4 + Math_imul(HEAP32[$1 + 6768 >> 2], 292) | 0;
         $5 = ($4 + Math_imul(HEAP32[$1 + 6772 >> 2], 292) | 0) + 584 | 0;
         $10 = HEAP32[$1 + 220 >> 2];
         $12 = HEAP32[$1 + 216 >> 2];
         break label$36;
        case 1:
         $1 = HEAP32[$0 + 4 >> 2];
         $3 = ($1 + Math_imul(HEAP32[$1 + 6768 >> 2], 292) | 0) + 336 | 0;
         $5 = (Math_imul(HEAP32[$1 + 6804 >> 2], 292) + $1 | 0) + 5592 | 0;
         $10 = HEAP32[$1 + 252 >> 2];
         $12 = HEAP32[$1 + 216 >> 2];
         break label$36;
        case 2:
         $1 = HEAP32[$0 + 4 >> 2];
         $5 = ($1 + Math_imul(HEAP32[$1 + 6772 >> 2], 292) | 0) + 920 | 0;
         $3 = (Math_imul(HEAP32[$1 + 6804 >> 2], 292) + $1 | 0) + 5592 | 0;
         $10 = HEAP32[$1 + 220 >> 2];
         $12 = HEAP32[$1 + 252 >> 2];
         break label$36;
        case 3:
         break label$37;
        };
       }
       $1 = HEAP32[$0 + 4 >> 2];
       $4 = $1 + 5008 | 0;
       $3 = $4 + Math_imul(HEAP32[$1 + 6800 >> 2], 292) | 0;
       $5 = ($4 + Math_imul(HEAP32[$1 + 6804 >> 2], 292) | 0) + 584 | 0;
       $10 = HEAP32[$1 + 252 >> 2];
       $12 = HEAP32[$1 + 248 >> 2];
      }
      if (!add_subframe_($8, $6, $12, $3, HEAP32[$1 + 6856 >> 2])) {
       break label$31
      }
      if (!add_subframe_($0, HEAP32[$7 + 8 >> 2], $10, $5, HEAP32[HEAP32[$0 + 4 >> 2] + 6856 >> 2])) {
       break label$31
      }
      $3 = HEAP32[$0 >> 2];
      break label$30;
     }
     $1 = FLAC__frame_add_header($7 + 8 | 0, HEAP32[$6 + 6856 >> 2]);
     $3 = HEAP32[$0 >> 2];
     if ($1) {
      if (!HEAP32[$3 + 24 >> 2]) {
       break label$30
      }
      $1 = 0;
      while (1) {
       $3 = HEAP32[$0 + 4 >> 2];
       $4 = $3 + ($1 << 2) | 0;
       if (!add_subframe_($0, HEAP32[$7 + 8 >> 2], HEAP32[$4 + 216 >> 2], (($3 + Math_imul($1, 584) | 0) + Math_imul(HEAP32[$4 + 6768 >> 2], 292) | 0) + 336 | 0, HEAP32[$3 + 6856 >> 2])) {
        break label$31
       }
       $1 = $1 + 1 | 0;
       $3 = HEAP32[$0 >> 2];
       if ($1 >>> 0 < HEAPU32[$3 + 24 >> 2]) {
        continue
       }
       break;
      };
      break label$30;
     }
     HEAP32[$3 >> 2] = 7;
    }
    $1 = 0;
    break label$1;
   }
   if (HEAP32[$3 + 20 >> 2]) {
    $1 = HEAP32[$0 + 4 >> 2];
    $3 = HEAP32[$1 + 6864 >> 2] + 1 | 0;
    HEAP32[$1 + 6864 >> 2] = $3 >>> 0 < HEAPU32[$1 + 6860 >> 2] ? $3 : 0;
   }
   $1 = HEAP32[$0 + 4 >> 2];
   HEAP32[$1 + 6868 >> 2] = HEAP32[$7 + 20 >> 2];
   $1 = HEAP32[$1 + 6856 >> 2];
   $3 = HEAP32[$1 + 16 >> 2] & 7;
   $8 = 1;
   __inlined_func$FLAC__bitwriter_zero_pad_to_byte_boundary : {
    if (!$3) {
     break __inlined_func$FLAC__bitwriter_zero_pad_to_byte_boundary
    }
    $8 = FLAC__bitwriter_write_zeroes($1, 8 - $3 | 0);
   }
   if (!$8) {
    HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
    $1 = 0;
    break label$1;
   }
   label$46 : {
    if (FLAC__bitwriter_get_write_crc16(HEAP32[HEAP32[$0 + 4 >> 2] + 6856 >> 2], $7 + 8 | 0)) {
     if (FLAC__bitwriter_write_raw_uint32(HEAP32[HEAP32[$0 + 4 >> 2] + 6856 >> 2], HEAPU16[$7 + 8 >> 1], HEAP32[1661])) {
      break label$46
     }
    }
    HEAP32[HEAP32[$0 >> 2] >> 2] = 8;
    $1 = 0;
    break label$1;
   }
   $1 = 0;
   if (!write_bitbuffer_($0, HEAP32[HEAP32[$0 >> 2] + 36 >> 2], $2)) {
    break label$1
   }
   $1 = HEAP32[$0 + 4 >> 2];
   HEAP32[$1 + 7052 >> 2] = 0;
   HEAP32[$1 + 7056 >> 2] = HEAP32[$1 + 7056 >> 2] + 1;
   $2 = $1 + 6920 | 0;
   $3 = $2;
   $8 = $3;
   $1 = HEAP32[$3 + 4 >> 2];
   $0 = HEAP32[HEAP32[$0 >> 2] + 36 >> 2];
   $2 = $0 + HEAP32[$3 >> 2] | 0;
   if ($2 >>> 0 < $0 >>> 0) {
    $1 = $1 + 1 | 0
   }
   HEAP32[$8 >> 2] = $2;
   HEAP32[$3 + 4 >> 2] = $1;
   $1 = 1;
  }
  $0 = $1;
  global$0 = $7 + 48 | 0;
  return $0;
 }
 
 function FLAC__stream_encoder_init_stream($0, $1, $2, $3, $4, $5) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $4 = $4 | 0;
  $5 = $5 | 0;
  return init_stream_internal__1($0, 0, $1, $2, $3, $4, $5, 0) | 0;
 }
 
 function init_stream_internal__1($0, $1, $2, $3, $4, $5, $6, $7) {
  var $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0.0, $17 = 0, $18 = 0, $19 = 0;
  $15 = global$0 - 176 | 0;
  global$0 = $15;
  $8 = 13;
  $9 = HEAP32[$0 >> 2];
  label$1 : {
   if (HEAP32[$9 >> 2] != 1) {
    break label$1
   }
   $8 = 3;
   if (!$2 | ($4 ? 0 : $3)) {
    break label$1
   }
   $8 = 4;
   $11 = HEAP32[$9 + 24 >> 2];
   if ($11 + -1 >>> 0 > 7) {
    break label$1
   }
   label$2 : {
    label$3 : {
     if (($11 | 0) != 2) {
      HEAP32[$9 + 16 >> 2] = 0;
      break label$3;
     }
     if (HEAP32[$9 + 16 >> 2]) {
      break label$2
     }
    }
    HEAP32[$9 + 20 >> 2] = 0;
   }
   $11 = HEAP32[$9 + 28 >> 2];
   if ($11 >>> 0 >= 32) {
    HEAP32[$9 + 16 >> 2] = 0;
    $8 = 5;
    break label$1;
   }
   $8 = 5;
   if ($11 + -4 >>> 0 > 20) {
    break label$1
   }
   if (HEAP32[$9 + 32 >> 2] + -1 >>> 0 >= 655350) {
    $8 = 6;
    break label$1;
   }
   $9 = HEAP32[$0 >> 2];
   $10 = HEAP32[$9 + 36 >> 2];
   label$7 : {
    if (!$10) {
     $10 = HEAP32[$9 + 556 >> 2] ? 4096 : 1152;
     HEAP32[$9 + 36 >> 2] = $10;
     break label$7;
    }
    $8 = 7;
    if ($10 + -16 >>> 0 > 65519) {
     break label$1
    }
   }
   $8 = 8;
   $11 = HEAP32[$9 + 556 >> 2];
   if ($11 >>> 0 > 32) {
    break label$1
   }
   $8 = 10;
   if ($10 >>> 0 < $11 >>> 0) {
    break label$1
   }
   $11 = HEAP32[$9 + 560 >> 2];
   label$9 : {
    if (!$11) {
     $13 = $9;
     $11 = HEAP32[$9 + 28 >> 2];
     label$11 : {
      if ($11 >>> 0 <= 15) {
       $11 = $11 >>> 0 > 5 ? ($11 >>> 1 | 0) + 2 | 0 : 5;
       break label$11;
      }
      if (($11 | 0) == 16) {
       $11 = 7;
       if ($10 >>> 0 < 193) {
        break label$11
       }
       $11 = 8;
       if ($10 >>> 0 < 385) {
        break label$11
       }
       $11 = 9;
       if ($10 >>> 0 < 577) {
        break label$11
       }
       $11 = 10;
       if ($10 >>> 0 < 1153) {
        break label$11
       }
       $11 = 11;
       if ($10 >>> 0 < 2305) {
        break label$11
       }
       $11 = $10 >>> 0 < 4609 ? 12 : 13;
       break label$11;
      }
      $11 = 13;
      if ($10 >>> 0 < 385) {
       break label$11
      }
      $11 = $10 >>> 0 < 1153 ? 14 : 15;
     }
     HEAP32[$13 + 560 >> 2] = $11;
     break label$9;
    }
    $8 = 9;
    if ($11 + -5 >>> 0 > 10) {
     break label$1
    }
   }
   label$14 : {
    if (!HEAP32[$9 + 8 >> 2]) {
     $10 = HEAP32[$9 + 580 >> 2];
     break label$14;
    }
    $8 = 11;
    if (!(($10 >>> 0 < 4609 | HEAPU32[$9 + 32 >> 2] > 48e3) & $10 >>> 0 < 16385)) {
     break label$1
    }
    if (!FLAC__format_sample_rate_is_subset(HEAP32[HEAP32[$0 >> 2] + 32 >> 2])) {
     break label$1
    }
    $9 = HEAP32[$0 >> 2];
    if (__wasm_rotl_i32(HEAP32[$9 + 28 >> 2] + -8 | 0, 30) >>> 0 > 4) {
     break label$1
    }
    $10 = HEAP32[$9 + 580 >> 2];
    if ($10 >>> 0 > 8) {
     break label$1
    }
    if (HEAPU32[$9 + 32 >> 2] > 48e3) {
     break label$14
    }
    if (HEAPU32[$9 + 36 >> 2] > 4608 | HEAPU32[$9 + 556 >> 2] > 12) {
     break label$1
    }
   }
   $11 = 1 << HEAP32[1663];
   if ($10 >>> 0 >= $11 >>> 0) {
    $10 = $11 + -1 | 0;
    HEAP32[$9 + 580 >> 2] = $10;
   }
   if (HEAPU32[$9 + 576 >> 2] >= $10 >>> 0) {
    HEAP32[$9 + 576 >> 2] = $10
   }
   label$18 : {
    if (!$7) {
     break label$18
    }
    $10 = HEAP32[$9 + 600 >> 2];
    if (!$10) {
     break label$18
    }
    $13 = HEAP32[$9 + 604 >> 2];
    if ($13 >>> 0 < 2) {
     break label$18
    }
    $8 = 1;
    while (1) {
     $11 = HEAP32[($8 << 2) + $10 >> 2];
     if (!(!$11 | HEAP32[$11 >> 2] != 4)) {
      while (1) {
       $9 = ($8 << 2) + $10 | 0;
       $8 = $8 + -1 | 0;
       HEAP32[$9 >> 2] = HEAP32[($8 << 2) + $10 >> 2];
       $10 = HEAP32[HEAP32[$0 >> 2] + 600 >> 2];
       if ($8) {
        continue
       }
       break;
      };
      HEAP32[$10 >> 2] = $11;
      $9 = HEAP32[$0 >> 2];
      break label$18;
     }
     $8 = $8 + 1 | 0;
     if (($13 | 0) != ($8 | 0)) {
      continue
     }
     break;
    };
   }
   $13 = HEAP32[$9 + 604 >> 2];
   label$22 : {
    label$23 : {
     $10 = HEAP32[$9 + 600 >> 2];
     if ($10) {
      $11 = 0;
      if (!$13) {
       break label$22
      }
      while (1) {
       $9 = HEAP32[($11 << 2) + $10 >> 2];
       if (!(!$9 | HEAP32[$9 >> 2] != 3)) {
        HEAP32[HEAP32[$0 + 4 >> 2] + 7048 >> 2] = $9 + 16;
        break label$23;
       }
       $11 = $11 + 1 | 0;
       if (($13 | 0) != ($11 | 0)) {
        continue
       }
       break;
      };
      break label$23;
     }
     $8 = 12;
     if ($13) {
      break label$1
     }
     $11 = 0;
     break label$22;
    }
    $9 = 0;
    $13 = 0;
    $11 = 0;
    while (1) {
     $8 = 12;
     label$28 : {
      label$29 : {
       label$30 : {
        label$31 : {
         label$32 : {
          $10 = HEAP32[($14 << 2) + $10 >> 2];
          switch (HEAP32[$10 >> 2]) {
          case 0:
           break label$1;
          case 6:
           break label$29;
          case 5:
           break label$30;
          case 4:
           break label$31;
          case 3:
           break label$32;
          default:
           break label$28;
          };
         }
         if ($18) {
          break label$1
         }
         $18 = 1;
         $11 = $13;
         $12 = $9;
         if (FLAC__format_seektable_is_legal($10 + 16 | 0)) {
          break label$28
         }
         break label$1;
        }
        $11 = 1;
        $12 = $9;
        if (!$13) {
         break label$28
        }
        break label$1;
       }
       $11 = $13;
       $12 = $9;
       if (FLAC__format_cuesheet_is_legal($10 + 16 | 0, HEAP32[$10 + 160 >> 2])) {
        break label$28
       }
       break label$1;
      }
      $17 = $10 + 16 | 0;
      if (!FLAC__format_picture_is_legal($17)) {
       break label$1
      }
      $11 = $13;
      $12 = $9;
      label$33 : {
       switch (HEAP32[$17 >> 2] + -1 | 0) {
       case 0:
        if ($19) {
         break label$1
        }
        $12 = HEAP32[$10 + 20 >> 2];
        if (strcmp($12, 10747)) {
         if (strcmp($12, 10757)) {
          break label$1
         }
        }
        if (HEAP32[$10 + 28 >> 2] != 32) {
         break label$1
        }
        $19 = 1;
        $11 = $13;
        $12 = $9;
        if (HEAP32[$10 + 32 >> 2] == 32) {
         break label$28
        }
        break label$1;
       case 1:
        break label$33;
       default:
        break label$28;
       };
      }
      $12 = 1;
      if ($9) {
       break label$1
      }
     }
     $14 = $14 + 1 | 0;
     $9 = HEAP32[$0 >> 2];
     if ($14 >>> 0 >= HEAPU32[$9 + 604 >> 2]) {
      break label$22
     }
     $10 = HEAP32[$9 + 600 >> 2];
     $9 = $12;
     $13 = $11;
     continue;
    };
   }
   $10 = 0;
   $14 = HEAP32[$0 + 4 >> 2];
   HEAP32[$14 >> 2] = 0;
   if (HEAP32[$9 + 24 >> 2]) {
    while (1) {
     $9 = $10 << 2;
     HEAP32[($9 + $14 | 0) + 4 >> 2] = 0;
     HEAP32[($9 + HEAP32[$0 + 4 >> 2] | 0) + 7328 >> 2] = 0;
     HEAP32[($9 + HEAP32[$0 + 4 >> 2] | 0) + 44 >> 2] = 0;
     HEAP32[($9 + HEAP32[$0 + 4 >> 2] | 0) + 7368 >> 2] = 0;
     $14 = HEAP32[$0 + 4 >> 2];
     $10 = $10 + 1 | 0;
     if ($10 >>> 0 < HEAPU32[HEAP32[$0 >> 2] + 24 >> 2]) {
      continue
     }
     break;
    }
   }
   $9 = 0;
   HEAP32[$14 + 36 >> 2] = 0;
   HEAP32[HEAP32[$0 + 4 >> 2] + 7360 >> 2] = 0;
   HEAP32[HEAP32[$0 + 4 >> 2] + 76 >> 2] = 0;
   HEAP32[HEAP32[$0 + 4 >> 2] + 7400 >> 2] = 0;
   HEAP32[HEAP32[$0 + 4 >> 2] + 40 >> 2] = 0;
   HEAP32[HEAP32[$0 + 4 >> 2] + 7364 >> 2] = 0;
   HEAP32[HEAP32[$0 + 4 >> 2] + 80 >> 2] = 0;
   HEAP32[HEAP32[$0 + 4 >> 2] + 7404 >> 2] = 0;
   $8 = HEAP32[$0 + 4 >> 2];
   $10 = HEAP32[$0 >> 2];
   if (HEAP32[$10 + 40 >> 2]) {
    while (1) {
     $12 = $9 << 2;
     HEAP32[($12 + $8 | 0) + 84 >> 2] = 0;
     HEAP32[($12 + HEAP32[$0 + 4 >> 2] | 0) + 7408 >> 2] = 0;
     $8 = HEAP32[$0 + 4 >> 2];
     $9 = $9 + 1 | 0;
     $10 = HEAP32[$0 >> 2];
     if ($9 >>> 0 < HEAPU32[$10 + 40 >> 2]) {
      continue
     }
     break;
    }
   }
   $9 = 0;
   HEAP32[$8 + 7536 >> 2] = 0;
   HEAP32[$8 + 212 >> 2] = 0;
   if (HEAP32[$10 + 24 >> 2]) {
    while (1) {
     $12 = $9 << 3;
     HEAP32[($12 + $8 | 0) + 256 >> 2] = 0;
     HEAP32[($12 + HEAP32[$0 + 4 >> 2] | 0) + 7540 >> 2] = 0;
     HEAP32[($12 + HEAP32[$0 + 4 >> 2] | 0) + 260 >> 2] = 0;
     HEAP32[($12 + HEAP32[$0 + 4 >> 2] | 0) + 7544 >> 2] = 0;
     $8 = HEAP32[$0 + 4 >> 2];
     HEAP32[($8 + ($9 << 2) | 0) + 6768 >> 2] = 0;
     $9 = $9 + 1 | 0;
     if ($9 >>> 0 < HEAPU32[HEAP32[$0 >> 2] + 24 >> 2]) {
      continue
     }
     break;
    }
   }
   HEAP32[$8 + 320 >> 2] = 0;
   HEAP32[HEAP32[$0 + 4 >> 2] + 7604 >> 2] = 0;
   HEAP32[HEAP32[$0 + 4 >> 2] + 324 >> 2] = 0;
   HEAP32[HEAP32[$0 + 4 >> 2] + 7608 >> 2] = 0;
   $9 = HEAP32[$0 + 4 >> 2];
   HEAP32[$9 + 6800 >> 2] = 0;
   HEAP32[$9 + 328 >> 2] = 0;
   HEAP32[HEAP32[$0 + 4 >> 2] + 7612 >> 2] = 0;
   HEAP32[HEAP32[$0 + 4 >> 2] + 332 >> 2] = 0;
   HEAP32[HEAP32[$0 + 4 >> 2] + 7616 >> 2] = 0;
   $9 = HEAP32[$0 + 4 >> 2];
   HEAP32[$9 + 7620 >> 2] = 0;
   HEAP32[$9 + 7624 >> 2] = 0;
   HEAP32[$9 + 6848 >> 2] = 0;
   HEAP32[$9 + 6852 >> 2] = 0;
   HEAP32[$9 + 6804 >> 2] = 0;
   $12 = HEAP32[$0 >> 2];
   $13 = HEAP32[$12 + 36 >> 2];
   $12 = HEAP32[$12 + 32 >> 2];
   HEAP32[$9 + 7052 >> 2] = 0;
   HEAP32[$9 + 7056 >> 2] = 0;
   HEAP32[$9 + 6864 >> 2] = 0;
   $8 = $9;
   $16 = +($12 >>> 0) * .4 / +($13 >>> 0) + .5;
   label$42 : {
    if ($16 < 4294967296.0 & $16 >= 0.0) {
     $12 = ~~$16 >>> 0;
     break label$42;
    }
    $12 = 0;
   }
   HEAP32[$8 + 6860 >> 2] = $12 ? $12 : 1;
   FLAC__cpu_info($9 + 7156 | 0);
   $8 = HEAP32[$0 + 4 >> 2];
   HEAP32[$8 + 7244 >> 2] = 12;
   HEAP32[$8 + 7240 >> 2] = 13;
   HEAP32[$8 + 7236 >> 2] = 12;
   HEAP32[$8 + 7228 >> 2] = 14;
   HEAP32[$8 + 7224 >> 2] = 15;
   HEAP32[$8 + 7220 >> 2] = 16;
   HEAP32[$8 + 7232 >> 2] = 17;
   $10 = HEAP32[$0 >> 2];
   HEAP32[$10 >> 2] = 0;
   HEAP32[$8 + 7260 >> 2] = $7;
   label$44 : {
    label$45 : {
     if ($7) {
      if (!FLAC__ogg_encoder_aspect_init($10 + 632 | 0)) {
       break label$45
      }
      $10 = HEAP32[$0 >> 2];
      $8 = HEAP32[$0 + 4 >> 2];
     }
     $7 = $0 + 4 | 0;
     HEAP32[$8 + 7276 >> 2] = $2;
     HEAP32[$8 + 7264 >> 2] = $1;
     HEAP32[$8 + 7288 >> 2] = $6;
     HEAP32[$8 + 7280 >> 2] = $5;
     HEAP32[$8 + 7272 >> 2] = $4;
     HEAP32[$8 + 7268 >> 2] = $3;
     $1 = HEAP32[$10 + 36 >> 2];
     if (HEAPU32[$8 >> 2] >= $1 >>> 0) {
      break label$44
     }
     $3 = $1 + 5 | 0;
     label$47 : {
      label$48 : {
       if (HEAP32[$10 + 24 >> 2]) {
        $2 = 0;
        while (1) {
         $5 = $2 << 2;
         $4 = $5 + HEAP32[$7 >> 2] | 0;
         $6 = FLAC__memory_alloc_aligned_int32_array($3, $4 + 7328 | 0, $4 + 4 | 0);
         $4 = HEAP32[($5 + HEAP32[$7 >> 2] | 0) + 4 >> 2];
         HEAP32[$4 >> 2] = 0;
         HEAP32[$4 + 4 >> 2] = 0;
         HEAP32[$4 + 8 >> 2] = 0;
         HEAP32[$4 + 12 >> 2] = 0;
         $4 = ($5 + HEAP32[$7 >> 2] | 0) + 4 | 0;
         HEAP32[$4 >> 2] = HEAP32[$4 >> 2] + 16;
         if (!$6) {
          break label$48
         }
         $2 = $2 + 1 | 0;
         if ($2 >>> 0 < HEAPU32[HEAP32[$0 >> 2] + 24 >> 2]) {
          continue
         }
         break;
        };
       }
       $2 = HEAP32[$7 >> 2];
       $4 = FLAC__memory_alloc_aligned_int32_array($3, $2 + 7360 | 0, $2 + 36 | 0);
       $2 = HEAP32[HEAP32[$7 >> 2] + 36 >> 2];
       HEAP32[$2 >> 2] = 0;
       HEAP32[$2 + 4 >> 2] = 0;
       HEAP32[$2 + 8 >> 2] = 0;
       HEAP32[$2 + 12 >> 2] = 0;
       $2 = HEAP32[$7 >> 2];
       HEAP32[$2 + 36 >> 2] = HEAP32[$2 + 36 >> 2] + 16;
       if ($4) {
        $2 = HEAP32[$7 >> 2];
        $3 = FLAC__memory_alloc_aligned_int32_array($3, $2 + 7364 | 0, $2 + 40 | 0);
        $2 = HEAP32[HEAP32[$7 >> 2] + 40 >> 2];
        HEAP32[$2 >> 2] = 0;
        HEAP32[$2 + 4 >> 2] = 0;
        HEAP32[$2 + 8 >> 2] = 0;
        HEAP32[$2 + 12 >> 2] = 0;
        $2 = HEAP32[$7 >> 2] + 40 | 0;
        HEAP32[$2 >> 2] = HEAP32[$2 >> 2] + 16;
        $2 = ($3 | 0) != 0;
       } else {
        $2 = ($4 | 0) != 0
       }
       if (!$2) {
        break label$48
       }
       $3 = HEAP32[$0 >> 2];
       if (HEAP32[$3 + 556 >> 2]) {
        $2 = HEAP32[$7 >> 2];
        if (HEAP32[$3 + 40 >> 2]) {
         $8 = 0;
         while (1) {
          $2 = ($8 << 2) + $2 | 0;
          if (!FLAC__memory_alloc_aligned_int32_array($1, $2 + 7408 | 0, $2 + 84 | 0)) {
           break label$48
          }
          $2 = HEAP32[$0 + 4 >> 2];
          $8 = $8 + 1 | 0;
          if ($8 >>> 0 < HEAPU32[HEAP32[$0 >> 2] + 40 >> 2]) {
           continue
          }
          break;
         };
        }
        if (!FLAC__memory_alloc_aligned_int32_array($1, $2 + 7536 | 0, $2 + 212 | 0)) {
         break label$48
        }
       }
       $2 = 0;
       $3 = 1;
       $8 = 0;
       while (1) {
        if ($8 >>> 0 >= HEAPU32[HEAP32[$0 >> 2] + 24 >> 2]) {
         while (1) {
          $5 = $3;
          $2 = $2 << 3;
          $3 = $2 + HEAP32[$7 >> 2] | 0;
          $3 = FLAC__memory_alloc_aligned_int32_array($1, $3 + 7604 | 0, $3 + 320 | 0);
          label$59 : {
           if (!$3) {
            $4 = ($3 | 0) != 0;
            break label$59;
           }
           $2 = $2 + HEAP32[$7 >> 2] | 0;
           $4 = (FLAC__memory_alloc_aligned_int32_array($1, $2 + 7608 | 0, $2 + 324 | 0) | 0) != 0;
          }
          $5 = $5 & $4;
          $2 = 1;
          $3 = 0;
          if ($5) {
           continue
          }
          break;
         };
         if (!$4) {
          break label$48
         }
         $3 = $1 << 1;
         $2 = HEAP32[$0 + 4 >> 2];
         $2 = FLAC__memory_alloc_aligned_uint64_array($3, $2 + 7620 | 0, $2 + 6848 | 0);
         $8 = HEAP32[$0 >> 2];
         $4 = HEAP32[$8 + 572 >> 2];
         label$61 : {
          if (!(!$4 | !$2)) {
           $2 = HEAP32[$7 >> 2];
           if (FLAC__memory_alloc_aligned_int32_array($3, $2 + 7624 | 0, $2 + 6852 | 0)) {
            break label$61
           }
           break label$48;
          }
          if ($4 | !$2) {
           break label$47
          }
         }
         $8 = HEAP32[$7 >> 2];
         label$63 : {
          if (($1 | 0) == HEAP32[$8 >> 2]) {
           break label$63
          }
          $2 = HEAP32[$0 >> 2];
          if (!HEAP32[$2 + 556 >> 2] | !HEAP32[$2 + 40 >> 2]) {
           break label$63
          }
          $8 = 0;
          while (1) {
           label$65 : {
            label$66 : {
             label$67 : {
              label$68 : {
               label$69 : {
                label$70 : {
                 label$71 : {
                  label$72 : {
                   label$73 : {
                    label$74 : {
                     label$75 : {
                      label$76 : {
                       label$77 : {
                        label$78 : {
                         label$79 : {
                          label$80 : {
                           label$81 : {
                            label$82 : {
                             label$83 : {
                              $2 = ($8 << 4) + $2 | 0;
                              switch (HEAP32[$2 + 44 >> 2]) {
                              case 16:
                               break label$67;
                              case 15:
                               break label$68;
                              case 14:
                               break label$69;
                              case 13:
                               break label$70;
                              case 12:
                               break label$71;
                              case 11:
                               break label$72;
                              case 10:
                               break label$73;
                              case 9:
                               break label$74;
                              case 8:
                               break label$75;
                              case 7:
                               break label$76;
                              case 6:
                               break label$77;
                              case 5:
                               break label$78;
                              case 4:
                               break label$79;
                              case 3:
                               break label$80;
                              case 2:
                               break label$81;
                              case 1:
                               break label$82;
                              case 0:
                               break label$83;
                              default:
                               break label$66;
                              };
                             }
                             FLAC__window_bartlett(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1);
                             break label$65;
                            }
                            FLAC__window_bartlett_hann(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1);
                            break label$65;
                           }
                           FLAC__window_blackman(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1);
                           break label$65;
                          }
                          FLAC__window_blackman_harris_4term_92db_sidelobe(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1);
                          break label$65;
                         }
                         FLAC__window_connes(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1);
                         break label$65;
                        }
                        FLAC__window_flattop(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1);
                        break label$65;
                       }
                       FLAC__window_gauss(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1, HEAPF32[$2 + 48 >> 2]);
                       break label$65;
                      }
                      FLAC__window_hamming(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1);
                      break label$65;
                     }
                     FLAC__window_hann(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1);
                     break label$65;
                    }
                    FLAC__window_kaiser_bessel(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1);
                    break label$65;
                   }
                   FLAC__window_nuttall(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1);
                   break label$65;
                  }
                  FLAC__window_rectangle(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1);
                  break label$65;
                 }
                 FLAC__window_triangle(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1);
                 break label$65;
                }
                FLAC__window_tukey(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1, HEAPF32[$2 + 48 >> 2]);
                break label$65;
               }
               FLAC__window_partial_tukey(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1, HEAPF32[$2 + 48 >> 2], HEAPF32[$2 + 52 >> 2], HEAPF32[$2 + 56 >> 2]);
               break label$65;
              }
              FLAC__window_punchout_tukey(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1, HEAPF32[$2 + 48 >> 2], HEAPF32[$2 + 52 >> 2], HEAPF32[$2 + 56 >> 2]);
              break label$65;
             }
             FLAC__window_welch(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1);
             break label$65;
            }
            FLAC__window_hann(HEAP32[(HEAP32[$7 >> 2] + ($8 << 2) | 0) + 84 >> 2], $1);
           }
           $8 = $8 + 1 | 0;
           $2 = HEAP32[$0 >> 2];
           if ($8 >>> 0 < HEAPU32[$2 + 40 >> 2]) {
            continue
           }
           break;
          };
          $8 = HEAP32[$7 >> 2];
         }
         HEAP32[$8 >> 2] = $1;
         break label$44;
        }
        $4 = $8 << 3;
        $5 = $4 + HEAP32[$7 >> 2] | 0;
        $5 = FLAC__memory_alloc_aligned_int32_array($1, $5 + 7540 | 0, $5 + 256 | 0);
        label$84 : {
         if (!$5) {
          $4 = ($5 | 0) != 0;
          break label$84;
         }
         $4 = $4 + HEAP32[$7 >> 2] | 0;
         $4 = (FLAC__memory_alloc_aligned_int32_array($1, $4 + 7544 | 0, $4 + 260 | 0) | 0) != 0;
        }
        $8 = $8 + 1 | 0;
        if ($4) {
         continue
        }
        break;
       };
      }
      $8 = HEAP32[$0 >> 2];
     }
     HEAP32[$8 >> 2] = 8;
     $8 = 1;
     break label$1;
    }
    HEAP32[HEAP32[$0 >> 2] >> 2] = 2;
    $8 = 1;
    break label$1;
   }
   $1 = FLAC__bitwriter_init(HEAP32[$8 + 6856 >> 2]);
   $3 = HEAP32[$0 >> 2];
   if (!$1) {
    HEAP32[$3 >> 2] = 8;
    $8 = 1;
    break label$1;
   }
   label$87 : {
    if (HEAP32[$3 + 4 >> 2]) {
     $8 = 1;
     $2 = HEAP32[$7 >> 2];
     $1 = HEAP32[$3 + 36 >> 2] + 1 | 0;
     HEAP32[$2 + 11796 >> 2] = $1;
     label$89 : {
      if (!HEAP32[$3 + 24 >> 2]) {
       break label$89
      }
      $1 = safe_malloc_mul_2op_p(4, $1);
      HEAP32[HEAP32[$0 + 4 >> 2] + 11764 >> 2] = $1;
      $3 = HEAP32[$0 >> 2];
      if ($1) {
       while (1) {
        $2 = HEAP32[$7 >> 2];
        if ($8 >>> 0 >= HEAPU32[$3 + 24 >> 2]) {
         break label$89
        }
        $1 = safe_malloc_mul_2op_p(4, HEAP32[$2 + 11796 >> 2]);
        HEAP32[(HEAP32[$0 + 4 >> 2] + ($8 << 2) | 0) + 11764 >> 2] = $1;
        $8 = $8 + 1 | 0;
        $3 = HEAP32[$0 >> 2];
        if ($1) {
         continue
        }
        break;
       }
      }
      HEAP32[$3 >> 2] = 8;
      $8 = 1;
      break label$1;
     }
     HEAP32[$2 + 11800 >> 2] = 0;
     label$92 : {
      $2 = HEAP32[$2 + 11752 >> 2];
      if ($2) {
       break label$92
      }
      $2 = FLAC__stream_decoder_new();
      HEAP32[HEAP32[$7 >> 2] + 11752 >> 2] = $2;
      if ($2) {
       break label$92
      }
      HEAP32[HEAP32[$0 >> 2] >> 2] = 3;
      $8 = 1;
      break label$1;
     }
     $1 = FLAC__stream_decoder_init_stream($2, 18, 0, 0, 0, 0, 19, 20, 21, $0);
     $3 = HEAP32[$0 >> 2];
     if ($1) {
      break label$87
     }
     $2 = !HEAP32[$3 + 4 >> 2];
    } else {
     $2 = 1
    }
    $1 = HEAP32[$7 >> 2];
    HEAP32[$1 + 7312 >> 2] = 0;
    HEAP32[$1 + 7316 >> 2] = 0;
    HEAP32[$1 + 7292 >> 2] = 0;
    $4 = $1 + 11816 | 0;
    HEAP32[$4 >> 2] = 0;
    HEAP32[$4 + 4 >> 2] = 0;
    $4 = $1 + 11824 | 0;
    HEAP32[$4 >> 2] = 0;
    HEAP32[$4 + 4 >> 2] = 0;
    $4 = $1 + 11832 | 0;
    HEAP32[$4 >> 2] = 0;
    HEAP32[$4 + 4 >> 2] = 0;
    HEAP32[$1 + 11840 >> 2] = 0;
    HEAP32[$3 + 624 >> 2] = 0;
    HEAP32[$3 + 628 >> 2] = 0;
    HEAP32[$3 + 616 >> 2] = 0;
    HEAP32[$3 + 620 >> 2] = 0;
    HEAP32[$3 + 608 >> 2] = 0;
    HEAP32[$3 + 612 >> 2] = 0;
    if (!$2) {
     HEAP32[$1 + 11756 >> 2] = 0
    }
    if (!FLAC__bitwriter_write_raw_uint32(HEAP32[$1 + 6856 >> 2], HEAP32[1611], HEAP32[1612])) {
     HEAP32[HEAP32[$0 >> 2] >> 2] = 7;
     $8 = 1;
     break label$1;
    }
    $8 = 1;
    if (!write_bitbuffer_($0, 0, 0)) {
     break label$1
    }
    $1 = HEAP32[$0 + 4 >> 2];
    $2 = HEAP32[$0 >> 2];
    if (HEAP32[$2 + 4 >> 2]) {
     HEAP32[$1 + 11756 >> 2] = 1
    }
    HEAP32[$1 + 6872 >> 2] = 0;
    HEAP32[$1 + 6876 >> 2] = 0;
    HEAP32[$1 + 6880 >> 2] = 34;
    HEAP32[$1 + 6888 >> 2] = HEAP32[$2 + 36 >> 2];
    HEAP32[HEAP32[$0 + 4 >> 2] + 6892 >> 2] = HEAP32[HEAP32[$0 >> 2] + 36 >> 2];
    HEAP32[HEAP32[$0 + 4 >> 2] + 6896 >> 2] = 0;
    HEAP32[HEAP32[$0 + 4 >> 2] + 6900 >> 2] = 0;
    HEAP32[HEAP32[$0 + 4 >> 2] + 6904 >> 2] = HEAP32[HEAP32[$0 >> 2] + 32 >> 2];
    HEAP32[HEAP32[$0 + 4 >> 2] + 6908 >> 2] = HEAP32[HEAP32[$0 >> 2] + 24 >> 2];
    HEAP32[HEAP32[$0 + 4 >> 2] + 6912 >> 2] = HEAP32[HEAP32[$0 >> 2] + 28 >> 2];
    $1 = HEAP32[$0 >> 2];
    $2 = HEAP32[$1 + 596 >> 2];
    $3 = HEAP32[$0 + 4 >> 2] + 6920 | 0;
    HEAP32[$3 >> 2] = HEAP32[$1 + 592 >> 2];
    HEAP32[$3 + 4 >> 2] = $2;
    $1 = HEAP32[$0 + 4 >> 2];
    $2 = $1 + 6936 | 0;
    HEAP32[$2 >> 2] = 0;
    HEAP32[$2 + 4 >> 2] = 0;
    $1 = $1 + 6928 | 0;
    HEAP32[$1 >> 2] = 0;
    HEAP32[$1 + 4 >> 2] = 0;
    if (HEAP32[HEAP32[$0 >> 2] + 12 >> 2]) {
     FLAC__MD5Init(HEAP32[$7 >> 2] + 7060 | 0)
    }
    $1 = HEAP32[$7 >> 2];
    if (!FLAC__add_metadata_block($1 + 6872 | 0, HEAP32[$1 + 6856 >> 2])) {
     HEAP32[HEAP32[$0 >> 2] >> 2] = 7;
     break label$1;
    }
    if (!write_bitbuffer_($0, 0, 0)) {
     break label$1
    }
    HEAP32[HEAP32[$7 >> 2] + 6896 >> 2] = -1 << HEAP32[1615] ^ -1;
    $1 = HEAP32[$7 >> 2] + 6920 | 0;
    HEAP32[$1 >> 2] = 0;
    HEAP32[$1 + 4 >> 2] = 0;
    if (!$11) {
     HEAP32[$15 >> 2] = 4;
     $2 = HEAP32[HEAP32[$0 >> 2] + 604 >> 2];
     $1 = $15;
     HEAP32[$1 + 24 >> 2] = 0;
     HEAP32[$1 + 28 >> 2] = 0;
     HEAP32[$1 + 16 >> 2] = 0;
     HEAP32[$1 + 20 >> 2] = 0;
     HEAP32[$1 + 8 >> 2] = 8;
     HEAP32[$1 + 4 >> 2] = !$2;
     if (!FLAC__add_metadata_block($1, HEAP32[HEAP32[$0 + 4 >> 2] + 6856 >> 2])) {
      HEAP32[HEAP32[$0 >> 2] >> 2] = 7;
      break label$1;
     }
     if (!write_bitbuffer_($0, 0, 0)) {
      break label$1
     }
    }
    label$100 : {
     $3 = HEAP32[$0 >> 2];
     $4 = HEAP32[$3 + 604 >> 2];
     if (!$4) {
      break label$100
     }
     $2 = 0;
     while (1) {
      $1 = HEAP32[HEAP32[$3 + 600 >> 2] + ($2 << 2) >> 2];
      HEAP32[$1 + 4 >> 2] = ($4 + -1 | 0) == ($2 | 0);
      if (!FLAC__add_metadata_block($1, HEAP32[HEAP32[$7 >> 2] + 6856 >> 2])) {
       HEAP32[HEAP32[$0 >> 2] >> 2] = 7;
       break label$1;
      }
      if (write_bitbuffer_($0, 0, 0)) {
       $2 = $2 + 1 | 0;
       $3 = HEAP32[$0 >> 2];
       $4 = HEAP32[$3 + 604 >> 2];
       if ($2 >>> 0 >= $4 >>> 0) {
        break label$100
       }
       continue;
      }
      break;
     };
     break label$1;
    }
    label$104 : {
     $1 = HEAP32[$7 >> 2];
     $2 = HEAP32[$1 + 7272 >> 2];
     if (!$2) {
      break label$104
     }
     $1 = FUNCTION_TABLE[$2]($0, $3 + 624 | 0, HEAP32[$1 + 7288 >> 2]) | 0;
     $3 = HEAP32[$0 >> 2];
     if (($1 | 0) != 1) {
      break label$104
     }
     HEAP32[$3 >> 2] = 5;
     break label$1;
    }
    $8 = 0;
    if (!HEAP32[$3 + 4 >> 2]) {
     break label$1
    }
    HEAP32[HEAP32[$7 >> 2] + 11756 >> 2] = 2;
    break label$1;
   }
   HEAP32[$3 >> 2] = 3;
   $8 = 1;
  }
  global$0 = $15 + 176 | 0;
  return $8;
 }
 
 function precompute_partition_info_sums_($0, $1, $2, $3, $4, $5, $6) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $4 = $4 | 0;
  $5 = $5 | 0;
  $6 = $6 | 0;
  var $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0;
  $11 = 1 << $5;
  $14 = $11 >>> 0 > 1 ? $11 : 1;
  $8 = 0 - $3 | 0;
  $12 = $2 + $3 >>> $5 | 0;
  $9 = $12 - $3 | 0;
  label$1 : {
   if ($6 + 4 >>> 0 < (Math_clz32($12) ^ -32) + 33 >>> 0) {
    $6 = 0;
    while (1) {
     $3 = 0;
     $8 = $8 + $12 | 0;
     if ($7 >>> 0 < $8 >>> 0) {
      while (1) {
       $2 = HEAP32[($7 << 2) + $0 >> 2];
       $10 = $2 >> 31;
       $3 = ($10 ^ $2 + $10) + $3 | 0;
       $7 = $7 + 1 | 0;
       if ($7 >>> 0 < $8 >>> 0) {
        continue
       }
       break;
      };
      $7 = $9;
     }
     $2 = ($6 << 3) + $1 | 0;
     HEAP32[$2 >> 2] = $3;
     HEAP32[$2 + 4 >> 2] = 0;
     $9 = $9 + $12 | 0;
     $6 = $6 + 1 | 0;
     if (($14 | 0) != ($6 | 0)) {
      continue
     }
     break;
    };
    break label$1;
   }
   $2 = 0;
   while (1) {
    $13 = 0;
    $3 = 0;
    $8 = $8 + $12 | 0;
    if ($7 >>> 0 < $8 >>> 0) {
     while (1) {
      $6 = HEAP32[($7 << 2) + $0 >> 2];
      $10 = $6 >> 31;
      $10 = $10 ^ $6 + $10;
      $6 = $10 + $13 | 0;
      if ($6 >>> 0 < $10 >>> 0) {
       $3 = $3 + 1 | 0
      }
      $13 = $6;
      $7 = $7 + 1 | 0;
      if ($7 >>> 0 < $8 >>> 0) {
       continue
      }
      break;
     };
     $7 = $9;
    }
    $6 = ($2 << 3) + $1 | 0;
    HEAP32[$6 >> 2] = $13;
    HEAP32[$6 + 4 >> 2] = $3;
    $9 = $9 + $12 | 0;
    $2 = $2 + 1 | 0;
    if (($14 | 0) != ($2 | 0)) {
     continue
    }
    break;
   };
  }
  if (($5 | 0) > ($4 | 0)) {
   $7 = 0;
   $0 = $11;
   while (1) {
    $5 = $5 + -1 | 0;
    $8 = 0;
    $0 = $0 >>> 1 | 0;
    if ($0) {
     while (1) {
      $3 = ($7 << 3) + $1 | 0;
      $2 = HEAP32[$3 + 8 >> 2];
      $9 = HEAP32[$3 + 12 >> 2] + HEAP32[$3 + 4 >> 2] | 0;
      $3 = HEAP32[$3 >> 2];
      $2 = $3 + $2 | 0;
      if ($2 >>> 0 < $3 >>> 0) {
       $9 = $9 + 1 | 0
      }
      $6 = ($11 << 3) + $1 | 0;
      HEAP32[$6 >> 2] = $2;
      HEAP32[$6 + 4 >> 2] = $9;
      $7 = $7 + 2 | 0;
      $11 = $11 + 1 | 0;
      $8 = $8 + 1 | 0;
      if (($8 | 0) != ($0 | 0)) {
       continue
      }
      break;
     }
    }
    if (($5 | 0) > ($4 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function verify_read_callback_($0, $1, $2, $3) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  var $4 = 0, $5 = 0;
  $5 = HEAP32[$3 + 4 >> 2];
  if (HEAP32[$5 + 11760 >> 2]) {
   HEAP32[$2 >> 2] = 4;
   $0 = HEAPU8[6439] | HEAPU8[6440] << 8 | (HEAPU8[6441] << 16 | HEAPU8[6442] << 24);
   HEAP8[$1 | 0] = $0;
   HEAP8[$1 + 1 | 0] = $0 >>> 8;
   HEAP8[$1 + 2 | 0] = $0 >>> 16;
   HEAP8[$1 + 3 | 0] = $0 >>> 24;
   HEAP32[HEAP32[$3 + 4 >> 2] + 11760 >> 2] = 0;
   return 0;
  }
  $0 = HEAP32[$5 + 11812 >> 2];
  if (!$0) {
   return 2
  }
  $4 = HEAP32[$2 >> 2];
  if ($0 >>> 0 < $4 >>> 0) {
   HEAP32[$2 >> 2] = $0;
   $4 = $0;
  }
  memcpy($1, HEAP32[$5 + 11804 >> 2], $4);
  $0 = HEAP32[$3 + 4 >> 2];
  $1 = $0 + 11804 | 0;
  $3 = $1;
  $4 = HEAP32[$1 >> 2];
  $1 = HEAP32[$2 >> 2];
  HEAP32[$3 >> 2] = $4 + $1;
  $0 = $0 + 11812 | 0;
  HEAP32[$0 >> 2] = HEAP32[$0 >> 2] - $1;
  return 0;
 }
 
 function verify_write_callback_($0, $1, $2, $3) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, wasm2js_i32$0 = 0, wasm2js_i32$1 = 0;
  $7 = HEAP32[$1 >> 2];
  $5 = HEAP32[$3 + 4 >> 2];
  $0 = HEAP32[$1 + 8 >> 2];
  if ($0) {
   $4 = $7 << 2;
   while (1) {
    $8 = $6 << 2;
    $9 = HEAP32[$8 + $2 >> 2];
    $10 = HEAP32[($5 + $8 | 0) + 11764 >> 2];
    if (memcmp($9, $10, $4)) {
     $4 = 0;
     label$4 : {
      if ($7) {
       $0 = 0;
       while (1) {
        $2 = $0 << 2;
        $8 = HEAP32[$2 + $9 >> 2];
        $2 = HEAP32[$2 + $10 >> 2];
        if (($8 | 0) != ($2 | 0)) {
         $4 = $0;
         break label$4;
        }
        $0 = $0 + 1 | 0;
        if (($7 | 0) != ($0 | 0)) {
         continue
        }
        break;
       };
      }
      $2 = 0;
      $8 = 0;
     }
     $9 = HEAP32[$1 + 28 >> 2];
     $0 = $4;
     $11 = $0 + HEAP32[$1 + 24 >> 2] | 0;
     if ($11 >>> 0 < $0 >>> 0) {
      $9 = $9 + 1 | 0
     }
     $10 = $5 + 11816 | 0;
     HEAP32[$10 >> 2] = $11;
     HEAP32[$10 + 4 >> 2] = $9;
     $0 = HEAP32[$1 + 28 >> 2];
     $1 = HEAP32[$1 + 24 >> 2];
     HEAP32[$5 + 11840 >> 2] = $8;
     HEAP32[$5 + 11836 >> 2] = $2;
     HEAP32[$5 + 11832 >> 2] = $4;
     HEAP32[$5 + 11828 >> 2] = $6;
     (wasm2js_i32$0 = $5 + 11824 | 0, wasm2js_i32$1 = __wasm_i64_udiv($1, $0, $7)), HEAP32[wasm2js_i32$0 >> 2] = wasm2js_i32$1;
     HEAP32[HEAP32[$3 >> 2] >> 2] = 4;
     return 1;
    }
    $6 = $6 + 1 | 0;
    if (($0 | 0) != ($6 | 0)) {
     continue
    }
    break;
   };
   $2 = $5 + 11800 | 0;
   $1 = HEAP32[$2 >> 2] - $7 | 0;
   HEAP32[$2 >> 2] = $1;
   label$8 : {
    if (!$0) {
     break label$8
    }
    $2 = HEAP32[$5 + 11764 >> 2];
    $4 = $2;
    $2 = $7 << 2;
    memmove($4, $4 + $2 | 0, $1 << 2);
    $6 = 1;
    if (($0 | 0) == 1) {
     break label$8
    }
    while (1) {
     $1 = HEAP32[$3 + 4 >> 2];
     $4 = HEAP32[($1 + ($6 << 2) | 0) + 11764 >> 2];
     memmove($4, $2 + $4 | 0, HEAP32[$1 + 11800 >> 2] << 2);
     $6 = $6 + 1 | 0;
     if (($0 | 0) != ($6 | 0)) {
      continue
     }
     break;
    };
   }
   return 0;
  }
  $0 = $5 + 11800 | 0;
  HEAP32[$0 >> 2] = HEAP32[$0 >> 2] - $7;
  return 0;
 }
 
 function verify_metadata_callback_($0, $1, $2) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
 }
 
 function verify_error_callback_($0, $1, $2) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  HEAP32[HEAP32[$2 >> 2] >> 2] = 3;
 }
 
 function write_bitbuffer_($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0;
  $5 = global$0 - 16 | 0;
  global$0 = $5;
  $4 = FLAC__bitwriter_get_buffer(HEAP32[HEAP32[$0 + 4 >> 2] + 6856 >> 2], $5 + 4 | 0, $5);
  $3 = HEAP32[$0 >> 2];
  label$1 : {
   label$2 : {
    if (!$4) {
     HEAP32[$3 >> 2] = 8;
     break label$2;
    }
    label$4 : {
     if (!HEAP32[$3 + 4 >> 2]) {
      break label$4
     }
     $3 = HEAP32[$0 + 4 >> 2];
     HEAP32[$3 + 11804 >> 2] = HEAP32[$5 + 4 >> 2];
     HEAP32[$3 + 11812 >> 2] = HEAP32[$5 >> 2];
     if (!HEAP32[$3 + 11756 >> 2]) {
      HEAP32[$3 + 11760 >> 2] = 1;
      break label$4;
     }
     if (FLAC__stream_decoder_process_single(HEAP32[$3 + 11752 >> 2])) {
      break label$4
     }
     FLAC__bitwriter_clear(HEAP32[HEAP32[$0 + 4 >> 2] + 6856 >> 2]);
     $0 = HEAP32[$0 >> 2];
     if (HEAP32[$0 >> 2] == 4) {
      break label$1
     }
     HEAP32[$0 >> 2] = 3;
     break label$1;
    }
    $12 = HEAP32[$5 >> 2];
    $14 = HEAP32[$5 + 4 >> 2];
    HEAP32[$5 + 8 >> 2] = 0;
    HEAP32[$5 + 12 >> 2] = 0;
    label$6 : {
     label$7 : {
      $3 = HEAP32[$0 + 4 >> 2];
      $4 = HEAP32[$3 + 7272 >> 2];
      if (!$4) {
       break label$7
      }
      if ((FUNCTION_TABLE[$4]($0, $5 + 8 | 0, HEAP32[$3 + 7288 >> 2]) | 0) != 1) {
       break label$7
      }
      break label$6;
     }
     label$8 : {
      if ($1) {
       break label$8
      }
      label$9 : {
       switch (HEAPU8[$14 | 0] & 127) {
       case 0:
        $3 = HEAP32[$5 + 12 >> 2];
        $4 = HEAP32[$0 >> 2];
        HEAP32[$4 + 608 >> 2] = HEAP32[$5 + 8 >> 2];
        HEAP32[$4 + 612 >> 2] = $3;
        break label$8;
       case 3:
        break label$9;
       default:
        break label$8;
       };
      }
      $3 = HEAP32[$0 >> 2];
      if (HEAP32[$3 + 616 >> 2] | HEAP32[$3 + 620 >> 2]) {
       break label$8
      }
      $4 = HEAP32[$5 + 12 >> 2];
      HEAP32[$3 + 616 >> 2] = HEAP32[$5 + 8 >> 2];
      HEAP32[$3 + 620 >> 2] = $4;
     }
     $6 = HEAP32[$0 + 4 >> 2];
     $7 = HEAP32[$6 + 7048 >> 2];
     label$11 : {
      if (!$7) {
       break label$11
      }
      $8 = HEAP32[$0 >> 2];
      $4 = $8;
      $3 = HEAP32[$4 + 628 >> 2];
      $15 = HEAP32[$4 + 624 >> 2];
      if (!($3 | $15)) {
       break label$11
      }
      $16 = HEAP32[$7 >> 2];
      if (!$16) {
       break label$11
      }
      $10 = HEAP32[$6 + 7292 >> 2];
      if ($10 >>> 0 >= $16 >>> 0) {
       break label$11
      }
      $13 = HEAP32[$6 + 7316 >> 2];
      $4 = $13;
      $17 = HEAP32[$6 + 7312 >> 2];
      $18 = HEAP32[$8 + 36 >> 2];
      $8 = $18;
      $9 = $17 + $8 | 0;
      if ($9 >>> 0 < $8 >>> 0) {
       $4 = $4 + 1 | 0
      }
      $4 = $4 + -1 | 0;
      $11 = $4 + 1 | 0;
      $8 = $4;
      $4 = $9 + -1 | 0;
      $8 = $4 >>> 0 < 4294967295 ? $11 : $8;
      $19 = HEAP32[$7 + 4 >> 2];
      while (1) {
       $7 = $19 + Math_imul($10, 24) | 0;
       $11 = HEAP32[$7 >> 2];
       $9 = HEAP32[$7 + 4 >> 2];
       if (($8 | 0) == ($9 | 0) & $11 >>> 0 > $4 >>> 0 | $9 >>> 0 > $8 >>> 0) {
        break label$11
       }
       if (($9 | 0) == ($13 | 0) & $11 >>> 0 >= $17 >>> 0 | $9 >>> 0 > $13 >>> 0) {
        HEAP32[$7 >> 2] = $17;
        HEAP32[$7 + 4 >> 2] = $13;
        $9 = HEAP32[$5 + 8 >> 2];
        $11 = HEAP32[$5 + 12 >> 2];
        HEAP32[$7 + 16 >> 2] = $18;
        HEAP32[$7 + 8 >> 2] = $9 - $15;
        HEAP32[$7 + 12 >> 2] = $11 - ($3 + ($9 >>> 0 < $15 >>> 0) | 0);
       }
       $10 = $10 + 1 | 0;
       HEAP32[$6 + 7292 >> 2] = $10;
       if (($10 | 0) != ($16 | 0)) {
        continue
       }
       break;
      };
     }
     label$14 : {
      if (HEAP32[$6 + 7260 >> 2]) {
       $2 = FLAC__ogg_encoder_aspect_write_callback_wrapper(HEAP32[$0 >> 2] + 632 | 0, $14, $12, $1, HEAP32[$6 + 7056 >> 2], $2, HEAP32[$6 + 7276 >> 2], $0, HEAP32[$6 + 7288 >> 2]);
       break label$14;
      }
      $2 = FUNCTION_TABLE[HEAP32[$6 + 7276 >> 2]]($0, $14, $12, $1, HEAP32[$6 + 7056 >> 2], HEAP32[$6 + 7288 >> 2]) | 0;
     }
     if (!$2) {
      $2 = HEAP32[$0 + 4 >> 2];
      $3 = $2;
      $8 = $3;
      $4 = HEAP32[$3 + 7308 >> 2];
      $6 = $12 + HEAP32[$3 + 7304 >> 2] | 0;
      if ($6 >>> 0 < $12 >>> 0) {
       $4 = $4 + 1 | 0
      }
      HEAP32[$8 + 7304 >> 2] = $6;
      HEAP32[$3 + 7308 >> 2] = $4;
      $3 = HEAP32[$2 + 7316 >> 2];
      $4 = HEAP32[$2 + 7312 >> 2] + $1 | 0;
      if ($4 >>> 0 < $1 >>> 0) {
       $3 = $3 + 1 | 0
      }
      HEAP32[$2 + 7312 >> 2] = $4;
      HEAP32[$2 + 7316 >> 2] = $3;
      $10 = 1;
      $4 = $2;
      $3 = HEAP32[$2 + 7320 >> 2];
      $2 = HEAP32[$2 + 7056 >> 2] + 1 | 0;
      HEAP32[$4 + 7320 >> 2] = $3 >>> 0 > $2 >>> 0 ? $3 : $2;
      FLAC__bitwriter_clear(HEAP32[HEAP32[$0 + 4 >> 2] + 6856 >> 2]);
      if (!$1) {
       break label$1
      }
      $1 = HEAP32[$0 + 4 >> 2] + 6896 | 0;
      $2 = HEAP32[$1 >> 2];
      $4 = $1;
      $1 = HEAP32[$5 >> 2];
      HEAP32[$4 >> 2] = $1 >>> 0 < $2 >>> 0 ? $1 : $2;
      $2 = HEAP32[$0 + 4 >> 2] + 6900 | 0;
      $0 = HEAP32[$2 >> 2];
      HEAP32[$2 >> 2] = $1 >>> 0 > $0 >>> 0 ? $1 : $0;
      break label$1;
     }
    }
    HEAP32[HEAP32[$0 >> 2] >> 2] = 5;
    FLAC__bitwriter_clear(HEAP32[HEAP32[$0 + 4 >> 2] + 6856 >> 2]);
    HEAP32[HEAP32[$0 >> 2] >> 2] = 5;
   }
   $10 = 0;
  }
  global$0 = $5 + 16 | 0;
  return $10;
 }
 
 function FLAC__stream_encoder_init_ogg_stream($0, $1, $2, $3, $4, $5, $6) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $4 = $4 | 0;
  $5 = $5 | 0;
  $6 = $6 | 0;
  return init_stream_internal__1($0, $1, $2, $3, $4, $5, $6, 1) | 0;
 }
 
 function process_subframe_($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10) {
  var $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0.0, $25 = 0, $26 = 0, $27 = 0.0, $28 = 0, $29 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = Math_fround(0), $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0, $41 = 0, $42 = Math_fround(0), $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
  $14 = global$0 - 576 | 0;
  global$0 = $14;
  $25 = HEAP32[(HEAPU32[HEAP32[$0 >> 2] + 28 >> 2] > 16 ? 6672 : 6668) >> 2];
  $12 = HEAP32[$3 >> 2];
  label$1 : {
   label$2 : {
    if (HEAP32[HEAP32[$0 + 4 >> 2] + 7256 >> 2]) {
     $11 = -1;
     if ($12 >>> 0 > 3) {
      break label$2
     }
    }
    $16 = HEAP32[$6 >> 2];
    HEAP32[$16 + 4 >> 2] = $5;
    HEAP32[$16 >> 2] = 1;
    $11 = HEAP32[$16 + 288 >> 2] + (HEAP32[1673] + (HEAP32[1672] + (HEAP32[1671] + Math_imul($4, $12) | 0) | 0) | 0) | 0;
    $12 = HEAP32[$3 >> 2];
    if ($12 >>> 0 < 4) {
     break label$1
    }
   }
   $13 = HEAP32[$0 + 4 >> 2];
   $16 = $12 + -4 | 0;
   label$4 : {
    if (((Math_clz32($16 | 1) ^ 31) + $4 | 0) + 4 >>> 0 <= 32) {
     $13 = FUNCTION_TABLE[HEAP32[$13 + 7224 >> 2]]($5 + 16 | 0, $16, $14 + 416 | 0) | 0;
     break label$4;
    }
    $13 = FUNCTION_TABLE[HEAP32[$13 + 7228 >> 2]]($5 + 16 | 0, $16, $14 + 416 | 0) | 0;
   }
   label$6 : {
    label$7 : {
     label$8 : {
      label$9 : {
       $15 = HEAP32[$0 + 4 >> 2];
       if (HEAP32[$15 + 7248 >> 2] | HEAPF32[$14 + 420 >> 2] != Math_fround(0.0)) {
        break label$9
       }
       $12 = 1;
       $17 = HEAP32[$5 >> 2];
       $16 = HEAP32[$3 >> 2];
       if ($16 >>> 0 <= 1) {
        break label$8
       }
       while (1) {
        if (($17 | 0) != HEAP32[($12 << 2) + $5 >> 2]) {
         break label$9
        }
        $12 = $12 + 1 | 0;
        if ($12 >>> 0 < $16 >>> 0) {
         continue
        }
        break;
       };
       break label$8;
      }
      $12 = HEAP32[$0 >> 2];
      if (!HEAP32[$15 + 7252 >> 2]) {
       $16 = $11;
       break label$7;
      }
      $16 = -1;
      if (($11 | 0) != -1) {
       $16 = $11;
       break label$6;
      }
      if (!HEAP32[$12 + 556 >> 2]) {
       break label$7
      }
      $16 = $11;
      break label$6;
     }
     $0 = HEAP32[$6 + 4 >> 2];
     HEAP32[$0 + 4 >> 2] = $17;
     HEAP32[$0 >> 2] = 0;
     $0 = HEAP32[$0 + 288 >> 2] + (HEAP32[1673] + (HEAP32[1672] + (HEAP32[1671] + $4 | 0) | 0) | 0) | 0;
     $19 = $0 >>> 0 < $11 >>> 0;
     $11 = $19 ? $0 : $11;
     break label$1;
    }
    $11 = HEAP32[$12 + 568 >> 2];
    $18 = $11 ? 0 : $13;
    $13 = $11 ? 4 : $13;
    $11 = HEAP32[$3 >> 2];
    $29 = $13 >>> 0 < $11 >>> 0 ? $13 : $11 + -1 | 0;
    if ($18 >>> 0 > $29 >>> 0) {
     break label$6
    }
    $32 = $25 + -1 | 0;
    $33 = HEAP32[1673];
    $30 = HEAP32[1672];
    $34 = HEAP32[1671];
    $42 = Math_fround($4 >>> 0);
    while (1) {
     $12 = $18 << 2;
     $35 = HEAPF32[$12 + ($14 + 416 | 0) >> 2];
     if (!($35 >= $42)) {
      $31 = !$19;
      $17 = $31 << 2;
      $36 = HEAP32[$17 + $7 >> 2];
      $21 = HEAP32[$6 + $17 >> 2];
      $23 = HEAP32[HEAP32[$0 >> 2] + 572 >> 2];
      $11 = HEAP32[$0 + 4 >> 2];
      $13 = HEAP32[$11 + 6852 >> 2];
      $15 = HEAP32[$11 + 6848 >> 2];
      $11 = $5 + $12 | 0;
      $12 = HEAP32[$3 >> 2] - $18 | 0;
      $17 = HEAP32[$8 + $17 >> 2];
      FLAC__fixed_compute_residual($11, $12, $18, $17);
      HEAP32[$21 + 36 >> 2] = $17;
      HEAP32[$21 + 12 >> 2] = $36;
      HEAP32[$21 >> 2] = 2;
      HEAP32[$21 + 4 >> 2] = 0;
      $37 = $35 > Math_fround(0.0);
      $26 = HEAP32[$0 + 4 >> 2];
      $22 = $18;
      $27 = +$35 + .5;
      label$15 : {
       if ($27 < 4294967296.0 & $27 >= 0.0) {
        $11 = ~~$27 >>> 0;
        break label$15;
       }
       $11 = 0;
      }
      $11 = $37 ? $11 + 1 | 0 : 1;
      $15 = find_best_partition_order_($26, $17, $15, $13, $12, $22, $11 >>> 0 < $25 >>> 0 ? $11 : $32, $25, $1, $2, $4, $23, $21 + 4 | 0);
      HEAP32[$21 + 16 >> 2] = $18;
      if ($18) {
       $13 = $21 + 20 | 0;
       $11 = 0;
       while (1) {
        $12 = $11 << 2;
        HEAP32[$12 + $13 >> 2] = HEAP32[$5 + $12 >> 2];
        $11 = $11 + 1 | 0;
        if (($18 | 0) != ($11 | 0)) {
         continue
        }
        break;
       };
      }
      $11 = HEAP32[$21 + 288 >> 2] + ($33 + ($30 + ($34 + ($15 + Math_imul($4, $18) | 0) | 0) | 0) | 0) | 0;
      $12 = $11 >>> 0 < $16 >>> 0;
      $19 = $12 ? $31 : $19;
      $16 = $12 ? $11 : $16;
     }
     $18 = $18 + 1 | 0;
     if ($18 >>> 0 <= $29 >>> 0) {
      continue
     }
     break;
    };
    $12 = HEAP32[$0 >> 2];
   }
   $13 = HEAP32[$12 + 556 >> 2];
   if (!$13) {
    $11 = $16;
    break label$1;
   }
   $11 = HEAP32[$3 >> 2];
   $13 = $13 >>> 0 < $11 >>> 0 ? $13 : $11 + -1 | 0;
   HEAP32[$14 + 12 >> 2] = $13;
   if (!$13) {
    $11 = $16;
    break label$1;
   }
   if (!HEAP32[$12 + 40 >> 2]) {
    $11 = $16;
    break label$1;
   }
   $40 = 33 - $4 | 0;
   $43 = $25 + -1 | 0;
   $44 = HEAP32[1670];
   $45 = HEAP32[1669];
   $46 = HEAP32[1673];
   $21 = HEAP32[1672];
   $47 = HEAP32[1671];
   $27 = +($4 >>> 0);
   $29 = $4 >>> 0 < 18;
   $32 = $4 >>> 0 > 16;
   $33 = $4 >>> 0 > 17;
   while (1) {
    $12 = HEAP32[$0 + 4 >> 2];
    FLAC__lpc_window_data($5, HEAP32[($12 + ($38 << 2) | 0) + 84 >> 2], HEAP32[$12 + 212 >> 2], $11);
    $11 = HEAP32[$0 + 4 >> 2];
    FUNCTION_TABLE[HEAP32[$11 + 7232 >> 2]](HEAP32[$11 + 212 >> 2], HEAP32[$3 >> 2], HEAP32[$14 + 12 >> 2] + 1 | 0, $14 + 272 | 0);
    label$23 : {
     if (HEAPF32[$14 + 272 >> 2] == Math_fround(0.0)) {
      break label$23
     }
     FLAC__lpc_compute_lp_coefficients($14 + 272 | 0, $14 + 12 | 0, HEAP32[$0 + 4 >> 2] + 7628 | 0, $14 + 16 | 0);
     $15 = 1;
     $12 = HEAP32[$14 + 12 >> 2];
     $17 = HEAP32[$0 >> 2];
     if (!HEAP32[$17 + 568 >> 2]) {
      $11 = $14;
      $12 = FLAC__lpc_compute_best_order($11 + 16 | 0, $12, HEAP32[$3 >> 2], (HEAP32[$17 + 564 >> 2] ? 5 : HEAP32[$17 + 560 >> 2]) + $4 | 0);
      HEAP32[$11 + 12 >> 2] = $12;
      $15 = $12;
     }
     $11 = HEAP32[$3 >> 2];
     if ($12 >>> 0 >= $11 >>> 0) {
      $12 = $11 + -1 | 0;
      HEAP32[$14 + 12 >> 2] = $12;
     }
     if ($15 >>> 0 > $12 >>> 0) {
      break label$23
     }
     while (1) {
      label$29 : {
       $30 = $15 + -1 | 0;
       $24 = FLAC__lpc_compute_expected_bits_per_residual_sample(HEAPF64[($14 + 16 | 0) + ($30 << 3) >> 3], $11 - $15 | 0);
       if ($24 >= $27) {
        break label$29
       }
       $11 = $24 > 0.0;
       $24 = $24 + .5;
       label$30 : {
        if ($24 < 4294967296.0 & $24 >= 0.0) {
         $13 = ~~$24 >>> 0;
         break label$30;
        }
        $13 = 0;
       }
       $13 = $11 ? $13 + 1 | 0 : 1;
       $11 = $13 >>> 0 < $25 >>> 0;
       $12 = HEAP32[$0 >> 2];
       label$32 : {
        if (HEAP32[$12 + 564 >> 2]) {
         $22 = 5;
         $26 = 15;
         if ($33) {
          break label$32
         }
         $17 = (Math_clz32($15) ^ -32) + $40 | 0;
         if ($17 >>> 0 > 14) {
          break label$32
         }
         $26 = $17 >>> 0 > 5 ? $17 : 5;
         break label$32;
        }
        $26 = HEAP32[$12 + 560 >> 2];
        $22 = $26;
       }
       $34 = $11 ? $13 : $43;
       $39 = ($15 << 2) + $5 | 0;
       $11 = Math_clz32($15);
       $31 = $11 ^ 31;
       $41 = ($11 ^ -32) + $40 | 0;
       while (1) {
        $23 = HEAP32[$3 >> 2];
        $13 = !$19;
        $11 = $13 << 2;
        $37 = HEAP32[$11 + $7 >> 2];
        $20 = HEAP32[$6 + $11 >> 2];
        $28 = HEAP32[$8 + $11 >> 2];
        $36 = HEAP32[$12 + 572 >> 2];
        $12 = HEAP32[$0 + 4 >> 2];
        $18 = HEAP32[$12 + 6852 >> 2];
        $17 = HEAP32[$12 + 6848 >> 2];
        $11 = 0;
        $48 = $19;
        $19 = ($12 + ($30 << 7) | 0) + 7628 | 0;
        $12 = $29 ? ($41 >>> 0 > $22 >>> 0 ? $22 : $41) : $22;
        if (!FLAC__lpc_quantize_coefficients($19, $15, $12, $14 + 448 | 0, $14 + 444 | 0)) {
         $23 = $23 - $15 | 0;
         $19 = $4 + $12 | 0;
         label$37 : {
          if ($19 + $31 >>> 0 <= 32) {
           $11 = HEAP32[$0 + 4 >> 2];
           if (!($12 >>> 0 > 16 | $32)) {
            FUNCTION_TABLE[HEAP32[$11 + 7244 >> 2]]($39, $23, $14 + 448 | 0, $15, HEAP32[$14 + 444 >> 2], $28);
            break label$37;
           }
           FUNCTION_TABLE[HEAP32[$11 + 7236 >> 2]]($39, $23, $14 + 448 | 0, $15, HEAP32[$14 + 444 >> 2], $28);
           break label$37;
          }
          FUNCTION_TABLE[HEAP32[HEAP32[$0 + 4 >> 2] + 7240 >> 2]]($39, $23, $14 + 448 | 0, $15, HEAP32[$14 + 444 >> 2], $28);
         }
         HEAP32[$20 >> 2] = 3;
         HEAP32[$20 + 4 >> 2] = 0;
         HEAP32[$20 + 284 >> 2] = $28;
         HEAP32[$20 + 12 >> 2] = $37;
         $18 = find_best_partition_order_(HEAP32[$0 + 4 >> 2], $28, $17, $18, $23, $15, $34, $25, $1, $2, $4, $36, $20 + 4 | 0);
         HEAP32[$20 + 20 >> 2] = $12;
         HEAP32[$20 + 16 >> 2] = $15;
         HEAP32[$20 + 24 >> 2] = HEAP32[$14 + 444 >> 2];
         memcpy($20 + 28 | 0, $14 + 448 | 0, 128);
         $11 = 0;
         if ($15) {
          while (1) {
           $17 = $11 << 2;
           HEAP32[($17 + $20 | 0) + 156 >> 2] = HEAP32[$5 + $17 >> 2];
           $11 = $11 + 1 | 0;
           if (($15 | 0) != ($11 | 0)) {
            continue
           }
           break;
          }
         }
         $11 = ((HEAP32[$20 + 288 >> 2] + (((($18 + Math_imul($15, $19) | 0) + $47 | 0) + $21 | 0) + $46 | 0) | 0) + $45 | 0) + $44 | 0;
        }
        $12 = ($11 | 0) != 0 & $11 >>> 0 < $16 >>> 0;
        $19 = $12 ? $13 : $48;
        $16 = $12 ? $11 : $16;
        $22 = $22 + 1 | 0;
        if ($22 >>> 0 > $26 >>> 0) {
         break label$29
        }
        $12 = HEAP32[$0 >> 2];
        continue;
       };
      }
      $15 = $15 + 1 | 0;
      if ($15 >>> 0 > HEAPU32[$14 + 12 >> 2]) {
       break label$23
      }
      $11 = HEAP32[$3 >> 2];
      continue;
     };
    }
    $38 = $38 + 1 | 0;
    if ($38 >>> 0 < HEAPU32[HEAP32[$0 >> 2] + 40 >> 2]) {
     $11 = HEAP32[$3 >> 2];
     continue;
    }
    break;
   };
   $11 = $16;
  }
  if (($11 | 0) == -1) {
   $0 = HEAP32[$3 >> 2];
   $1 = HEAP32[($19 << 2) + $6 >> 2];
   HEAP32[$1 + 4 >> 2] = $5;
   HEAP32[$1 >> 2] = 1;
   $11 = HEAP32[$1 + 288 >> 2] + (HEAP32[1673] + (HEAP32[1672] + (HEAP32[1671] + Math_imul($0, $4) | 0) | 0) | 0) | 0;
  }
  HEAP32[$9 >> 2] = $19;
  HEAP32[$10 >> 2] = $11;
  global$0 = $14 + 576 | 0;
 }
 
 function add_subframe_($0, $1, $2, $3, $4) {
  var $5 = 0;
  $5 = 1;
  label$1 : {
   label$2 : {
    label$3 : {
     switch (HEAP32[$3 >> 2]) {
     case 0:
      if (FLAC__subframe_add_constant($3 + 4 | 0, $2, HEAP32[$3 + 288 >> 2], $4)) {
       break label$1
      }
      break label$2;
     case 2:
      if (FLAC__subframe_add_fixed($3 + 4 | 0, $1 - HEAP32[$3 + 16 >> 2] | 0, $2, HEAP32[$3 + 288 >> 2], $4)) {
       break label$1
      }
      break label$2;
     case 3:
      if (FLAC__subframe_add_lpc($3 + 4 | 0, $1 - HEAP32[$3 + 16 >> 2] | 0, $2, HEAP32[$3 + 288 >> 2], $4)) {
       break label$1
      }
      break label$2;
     case 1:
      break label$3;
     default:
      break label$1;
     };
    }
    if (FLAC__subframe_add_verbatim($3 + 4 | 0, $1, $2, HEAP32[$3 + 288 >> 2], $4)) {
     break label$1
    }
   }
   HEAP32[HEAP32[$0 >> 2] >> 2] = 7;
   $5 = 0;
  }
  return $5;
 }
 
 function FLAC__stream_encoder_set_ogg_serial_number($0, $1) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $0 = HEAP32[$0 >> 2];
  if (HEAP32[$0 >> 2] == 1) {
   HEAP32[$0 + 632 >> 2] = $1;
   $0 = 1;
  } else {
   $0 = 0
  }
  return $0 | 0;
 }
 
 function FLAC__stream_encoder_set_verify($0, $1) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $0 = HEAP32[$0 >> 2];
  if (HEAP32[$0 >> 2] == 1) {
   HEAP32[$0 + 4 >> 2] = $1;
   $0 = 1;
  } else {
   $0 = 0
  }
  return $0 | 0;
 }
 
 function FLAC__stream_encoder_set_channels($0, $1) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $0 = HEAP32[$0 >> 2];
  if (HEAP32[$0 >> 2] == 1) {
   HEAP32[$0 + 24 >> 2] = $1;
   $0 = 1;
  } else {
   $0 = 0
  }
  return $0 | 0;
 }
 
 function FLAC__stream_encoder_set_bits_per_sample($0, $1) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $0 = HEAP32[$0 >> 2];
  if (HEAP32[$0 >> 2] == 1) {
   HEAP32[$0 + 28 >> 2] = $1;
   $0 = 1;
  } else {
   $0 = 0
  }
  return $0 | 0;
 }
 
 function FLAC__stream_encoder_set_sample_rate($0, $1) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $0 = HEAP32[$0 >> 2];
  if (HEAP32[$0 >> 2] == 1) {
   HEAP32[$0 + 32 >> 2] = $1;
   $0 = 1;
  } else {
   $0 = 0
  }
  return $0 | 0;
 }
 
 function FLAC__stream_encoder_set_compression_level($0, $1) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  var $2 = 0, $3 = 0, $4 = 0;
  $3 = HEAP32[$0 >> 2];
  if (HEAP32[$3 >> 2] == 1) {
   $2 = Math_imul($1 >>> 0 < 8 ? $1 : 8, 44);
   $1 = $2 + 11168 | 0;
   $4 = HEAP32[$1 + 4 >> 2];
   HEAP32[$3 + 16 >> 2] = HEAP32[$1 >> 2];
   HEAP32[$3 + 20 >> 2] = $4;
   $3 = FLAC__stream_encoder_set_apodization($0, HEAP32[$1 + 40 >> 2]);
   $1 = 0;
   $0 = HEAP32[$0 >> 2];
   if (HEAP32[$0 >> 2] == 1) {
    $1 = $2 + 11168 | 0;
    $2 = HEAP32[$1 + 32 >> 2];
    HEAP32[$0 + 576 >> 2] = HEAP32[$1 + 28 >> 2];
    HEAP32[$0 + 580 >> 2] = $2;
    HEAP32[$0 + 568 >> 2] = HEAP32[$1 + 24 >> 2];
    HEAP32[$0 + 564 >> 2] = HEAP32[$1 + 16 >> 2];
    $2 = HEAP32[$1 + 12 >> 2];
    HEAP32[$0 + 556 >> 2] = HEAP32[$1 + 8 >> 2];
    HEAP32[$0 + 560 >> 2] = $2;
    $1 = $3 & 1;
    $0 = 1;
   } else {
    $0 = 0
   }
   $0 = $0 & $1;
  } else {
   $0 = 0
  }
  return $0 | 0;
 }
 
 function FLAC__stream_encoder_set_blocksize($0, $1) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $0 = HEAP32[$0 >> 2];
  if (HEAP32[$0 >> 2] == 1) {
   HEAP32[$0 + 36 >> 2] = $1;
   $0 = 1;
  } else {
   $0 = 0
  }
  return $0 | 0;
 }
 
 function FLAC__stream_encoder_set_total_samples_estimate($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
  $0 = HEAP32[$0 >> 2];
  if (HEAP32[$0 >> 2] == 1) {
   $6 = $2;
   $7 = $0;
   $8 = $1;
   $4 = HEAP32[1620];
   $3 = $4 & 31;
   if (32 <= ($4 & 63) >>> 0) {
    $4 = -1 << $3;
    $3 = 0;
   } else {
    $4 = (1 << $3) - 1 & -1 >>> 32 - $3 | -1 << $3;
    $3 = -1 << $3;
   }
   $5 = $3 ^ -1;
   $3 = $4 ^ -1;
   $1 = ($2 | 0) == ($3 | 0) & $5 >>> 0 > $1 >>> 0 | $3 >>> 0 > $2 >>> 0;
   HEAP32[$7 + 592 >> 2] = $1 ? $8 : $5;
   HEAP32[$0 + 596 >> 2] = $1 ? $6 : $3;
   $0 = 1;
  } else {
   $0 = 0
  }
  return $0;
 }
 
 function FLAC__stream_encoder_process_interleaved($0, $1, $2) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0;
  $3 = HEAP32[$0 >> 2];
  $9 = HEAP32[$3 + 36 >> 2];
  $16 = $9 + 1 | 0;
  label$1 : {
   label$2 : {
    $10 = HEAP32[$3 + 24 >> 2];
    if (!(!HEAP32[$3 + 16 >> 2] | ($10 | 0) != 2)) {
     while (1) {
      $4 = HEAP32[$0 + 4 >> 2];
      if (HEAP32[$3 + 4 >> 2]) {
       $3 = HEAP32[$4 + 11800 >> 2];
       $5 = $16 - HEAP32[$4 + 7052 >> 2] | 0;
       $6 = $2 - $7 | 0;
       $8 = $5 >>> 0 < $6 >>> 0 ? $5 : $6;
       label$6 : {
        if (!$8) {
         break label$6
        }
        if (!$10) {
         $3 = $3 + $8 | 0;
         break label$6;
        }
        $5 = $7 << 1;
        $11 = HEAP32[$4 + 11768 >> 2];
        $15 = HEAP32[$4 + 11764 >> 2];
        $6 = 0;
        while (1) {
         $13 = $3 << 2;
         $14 = $5 << 2;
         HEAP32[$13 + $15 >> 2] = HEAP32[$14 + $1 >> 2];
         HEAP32[$11 + $13 >> 2] = HEAP32[($14 | 4) + $1 >> 2];
         $3 = $3 + 1 | 0;
         $5 = $5 + 2 | 0;
         $6 = $6 + 1 | 0;
         if (($8 | 0) != ($6 | 0)) {
          continue
         }
         break;
        };
       }
       HEAP32[$4 + 11800 >> 2] = $3;
      }
      $5 = $7 >>> 0 < $2 >>> 0;
      $3 = HEAP32[$4 + 7052 >> 2];
      label$9 : {
       if ($3 >>> 0 > $9 >>> 0 | $7 >>> 0 >= $2 >>> 0) {
        break label$9
       }
       $11 = HEAP32[$4 + 40 >> 2];
       $15 = HEAP32[$4 + 8 >> 2];
       $13 = HEAP32[$4 + 36 >> 2];
       $14 = HEAP32[$4 + 4 >> 2];
       while (1) {
        $5 = $3 << 2;
        $8 = ($12 << 2) + $1 | 0;
        $6 = HEAP32[$8 >> 2];
        HEAP32[$5 + $14 >> 2] = $6;
        $8 = HEAP32[$8 + 4 >> 2];
        HEAP32[$5 + $15 >> 2] = $8;
        HEAP32[$5 + $11 >> 2] = $6 - $8;
        HEAP32[$5 + $13 >> 2] = $6 + $8 >> 1;
        $3 = $3 + 1 | 0;
        $12 = $12 + 2 | 0;
        $7 = $7 + 1 | 0;
        $5 = $7 >>> 0 < $2 >>> 0;
        if ($7 >>> 0 >= $2 >>> 0) {
         break label$9
        }
        if ($3 >>> 0 <= $9 >>> 0) {
         continue
        }
        break;
       };
      }
      HEAP32[$4 + 7052 >> 2] = $3;
      if ($3 >>> 0 > $9 >>> 0) {
       $3 = 0;
       if (!process_frame_($0, 0, 0)) {
        break label$1
       }
       $3 = HEAP32[$0 + 4 >> 2];
       $6 = HEAP32[$3 + 4 >> 2];
       $4 = $6;
       $6 = $9 << 2;
       HEAP32[$4 >> 2] = HEAP32[$4 + $6 >> 2];
       $4 = HEAP32[$3 + 8 >> 2];
       HEAP32[$4 >> 2] = HEAP32[$4 + $6 >> 2];
       $4 = HEAP32[$3 + 36 >> 2];
       HEAP32[$4 >> 2] = HEAP32[$4 + $6 >> 2];
       $4 = HEAP32[$3 + 40 >> 2];
       HEAP32[$4 >> 2] = HEAP32[$4 + $6 >> 2];
       HEAP32[$3 + 7052 >> 2] = 1;
      }
      if (!$5) {
       break label$2
      }
      $3 = HEAP32[$0 >> 2];
      continue;
     }
    }
    while (1) {
     $7 = HEAP32[$0 + 4 >> 2];
     if (HEAP32[$3 + 4 >> 2]) {
      $6 = HEAP32[$7 + 11800 >> 2];
      $3 = $16 - HEAP32[$7 + 7052 >> 2] | 0;
      $5 = $2 - $4 | 0;
      $8 = $3 >>> 0 < $5 >>> 0 ? $3 : $5;
      label$14 : {
       if (!$8) {
        break label$14
       }
       if (!$10) {
        $6 = $6 + $8 | 0;
        break label$14;
       }
       $5 = Math_imul($4, $10);
       $11 = 0;
       while (1) {
        $3 = 0;
        while (1) {
         HEAP32[HEAP32[($7 + ($3 << 2) | 0) + 11764 >> 2] + ($6 << 2) >> 2] = HEAP32[($5 << 2) + $1 >> 2];
         $5 = $5 + 1 | 0;
         $3 = $3 + 1 | 0;
         if (($10 | 0) != ($3 | 0)) {
          continue
         }
         break;
        };
        $6 = $6 + 1 | 0;
        $11 = $11 + 1 | 0;
        if (($8 | 0) != ($11 | 0)) {
         continue
        }
        break;
       };
      }
      HEAP32[$7 + 11800 >> 2] = $6;
     }
     $6 = $4 >>> 0 < $2 >>> 0;
     $5 = HEAP32[$7 + 7052 >> 2];
     label$18 : {
      if ($5 >>> 0 > $9 >>> 0 | $4 >>> 0 >= $2 >>> 0) {
       break label$18
      }
      if ($10) {
       while (1) {
        $3 = 0;
        while (1) {
         HEAP32[HEAP32[($7 + ($3 << 2) | 0) + 4 >> 2] + ($5 << 2) >> 2] = HEAP32[($12 << 2) + $1 >> 2];
         $12 = $12 + 1 | 0;
         $3 = $3 + 1 | 0;
         if (($10 | 0) != ($3 | 0)) {
          continue
         }
         break;
        };
        $5 = $5 + 1 | 0;
        $4 = $4 + 1 | 0;
        $6 = $4 >>> 0 < $2 >>> 0;
        if ($4 >>> 0 >= $2 >>> 0) {
         break label$18
        }
        if ($5 >>> 0 <= $9 >>> 0) {
         continue
        }
        break label$18;
       }
      }
      while (1) {
       $5 = $5 + 1 | 0;
       $4 = $4 + 1 | 0;
       $6 = $4 >>> 0 < $2 >>> 0;
       if ($4 >>> 0 >= $2 >>> 0) {
        break label$18
       }
       if ($5 >>> 0 <= $9 >>> 0) {
        continue
       }
       break;
      };
     }
     HEAP32[$7 + 7052 >> 2] = $5;
     if ($5 >>> 0 > $9 >>> 0) {
      $3 = 0;
      if (!process_frame_($0, 0, 0)) {
       break label$1
      }
      $5 = HEAP32[$0 + 4 >> 2];
      if ($10) {
       $3 = 0;
       while (1) {
        $7 = HEAP32[($5 + ($3 << 2) | 0) + 4 >> 2];
        HEAP32[$7 >> 2] = HEAP32[$7 + ($9 << 2) >> 2];
        $3 = $3 + 1 | 0;
        if (($10 | 0) != ($3 | 0)) {
         continue
        }
        break;
       };
      }
      HEAP32[$5 + 7052 >> 2] = 1;
     }
     if (!$6) {
      break label$2
     }
     $3 = HEAP32[$0 >> 2];
     continue;
    };
   }
   $3 = 1;
  }
  return $3 | 0;
 }
 
 function find_best_partition_order_($0, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) {
  var $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $40 = 0;
  $26 = $4 + $5 | 0;
  $14 = FLAC__format_get_max_rice_partition_order_from_blocksize_limited_max_and_predictor_order($9, $26, $5);
  $22 = $14 >>> 0 > $8 >>> 0 ? $8 : $14;
  FUNCTION_TABLE[HEAP32[$0 + 7220 >> 2]]($1, $2, $4, $5, $22, $14, $10);
  label$1 : {
   if (!$11) {
    break label$1
   }
   $10 = 0;
   $8 = 0;
   if (($14 | 0) >= 0) {
    $8 = 1 << $14;
    $20 = $8 >>> 0 > 1 ? $8 : 1;
    $16 = $26 >>> $14 | 0;
    while (1) {
     $17 = 0;
     $9 = $13;
     $18 = 0;
     $27 = ($15 << 2) + $3 | 0;
     label$4 : {
      label$5 : {
       $23 = $15 ? 0 : $5;
       $19 = $16 - $23 | 0;
       if (!$19) {
        break label$5
       }
       while (1) {
        $21 = $17;
        $17 = HEAP32[($9 << 2) + $1 >> 2];
        $17 = $21 | $17 >> 31 ^ $17;
        $9 = $9 + 1 | 0;
        $18 = $18 + 1 | 0;
        if (($19 | 0) != ($18 | 0)) {
         continue
        }
        break;
       };
       $13 = ($13 + $16 | 0) - $23 | 0;
       if (!$17) {
        break label$5
       }
       $9 = (Math_clz32($17) ^ 31) + 2 | 0;
       break label$4;
      }
      $9 = 1;
     }
     HEAP32[$27 >> 2] = $9;
     $15 = $15 + 1 | 0;
     if (($20 | 0) != ($15 | 0)) {
      continue
     }
     break;
    };
   }
   if (($14 | 0) <= ($22 | 0)) {
    break label$1
   }
   $1 = $14;
   while (1) {
    $1 = $1 + -1 | 0;
    $9 = 0;
    while (1) {
     $13 = ($10 << 2) + $3 | 0;
     $15 = HEAP32[$13 >> 2];
     $13 = HEAP32[$13 + 4 >> 2];
     HEAP32[($8 << 2) + $3 >> 2] = $15 >>> 0 > $13 >>> 0 ? $15 : $13;
     $8 = $8 + 1 | 0;
     $10 = $10 + 2 | 0;
     $9 = $9 + 1 | 0;
     if (!($9 >>> $1)) {
      continue
     }
     break;
    };
    if (($1 | 0) > ($22 | 0)) {
     continue
    }
    break;
   };
  }
  label$9 : {
   if (($14 | 0) < ($22 | 0)) {
    HEAP32[$12 + 4 >> 2] = 0;
    $2 = 6;
    break label$9;
   }
   $28 = HEAP32[1664];
   $40 = $28 + (Math_imul($6 + 1 | 0, $4) - ($4 >>> 1 | 0) | 0) | 0;
   $35 = $7 + -1 | 0;
   $36 = HEAP32[1666] + HEAP32[1665] | 0;
   $23 = HEAP32[1663] + HEAP32[1662] | 0;
   $27 = $6 + -1 | 0;
   while (1) {
    label$12 : {
     $20 = $14;
     $37 = !$29;
     $1 = Math_imul($37, 12) + $0 | 0;
     $8 = $1 + 11724 | 0;
     FLAC__format_entropy_coding_method_partitioned_rice_contents_ensure_size($8, $14 >>> 0 > 6 ? $14 : 6);
     $38 = ($30 << 2) + $3 | 0;
     $25 = ($30 << 3) + $2 | 0;
     $39 = HEAP32[$1 + 11728 >> 2];
     $31 = HEAP32[$8 >> 2];
     label$13 : {
      if ($14) {
       $32 = $26 >>> $20 | 0;
       if ($32 >>> 0 <= $5 >>> 0) {
        break label$12
       }
       $18 = 0;
       $33 = 0;
       $21 = $23;
       if (!$11) {
        while (1) {
         $17 = $32 - ($18 ? 0 : $5) | 0;
         $1 = $25 + ($18 << 3) | 0;
         $13 = HEAP32[$1 + 4 >> 2];
         $16 = HEAP32[$1 >> 2];
         label$17 : {
          if (!$13 & $16 >>> 0 >= 268435457 | $13 >>> 0 > 0) {
           $1 = $17;
           $10 = 0;
           $8 = 0;
           label$19 : {
            if (($13 | 0) == 16777216 & $16 >>> 0 > 0 | $13 >>> 0 > 16777216) {
             $14 = $1;
             $9 = 0;
             break label$19;
            }
            $14 = $1;
            $9 = 0;
            $15 = $1 >>> 25 | 0;
            $19 = $1 << 7;
            if (($13 | 0) == ($15 | 0) & $19 >>> 0 >= $16 >>> 0 | $15 >>> 0 > $13 >>> 0) {
             break label$19
            }
            while (1) {
             $8 = $8 + 8 | 0;
             $15 = $10 << 15 | $1 >>> 17;
             $19 = $1 << 15;
             $9 = $10 << 8 | $1 >>> 24;
             $14 = $1 << 8;
             $1 = $14;
             $10 = $9;
             if (($13 | 0) == ($15 | 0) & $19 >>> 0 < $16 >>> 0 | $15 >>> 0 < $13 >>> 0) {
              continue
             }
             break;
            };
           }
           if (($9 | 0) == ($13 | 0) & $14 >>> 0 >= $16 >>> 0 | $9 >>> 0 > $13 >>> 0) {
            break label$17
           }
           while (1) {
            $8 = $8 + 1 | 0;
            $1 = $14;
            $15 = $9 << 1 | $1 >>> 31;
            $14 = $1 << 1;
            $1 = $14;
            $9 = $15;
            if (($13 | 0) == ($9 | 0) & $1 >>> 0 < $16 >>> 0 | $9 >>> 0 < $13 >>> 0) {
             continue
            }
            break;
           };
           break label$17;
          }
          $8 = 0;
          $10 = $17;
          $1 = $16;
          if ($10 << 3 >>> 0 < $1 >>> 0) {
           while (1) {
            $8 = $8 + 4 | 0;
            $9 = $10 << 7;
            $10 = $10 << 4;
            if ($9 >>> 0 < $1 >>> 0) {
             continue
            }
            break;
           }
          }
          if ($10 >>> 0 >= $1 >>> 0) {
           break label$17
          }
          while (1) {
           $8 = $8 + 1 | 0;
           $10 = $10 << 1;
           if ($10 >>> 0 < $1 >>> 0) {
            continue
           }
           break;
          };
         }
         $8 = $8 >>> 0 < $7 >>> 0 ? $8 : $35;
         $10 = $8 + -1 | 0;
         $1 = $10 & 31;
         $1 = (($28 - ($17 >>> 1 | 0) | 0) + Math_imul($17, $8 + 1 | 0) | 0) + ($8 ? (32 <= ($10 & 63) >>> 0 ? $13 >>> $1 | 0 : ((1 << $1) - 1 & $13) << 32 - $1 | $16 >>> $1) : $16 << 1) | 0;
         $33 = ($1 | 0) == -1 ? $33 : $8;
         HEAP32[$31 + ($18 << 2) >> 2] = $33;
         $21 = $1 + $21 | 0;
         $18 = $18 + 1 | 0;
         if (!($18 >>> $20)) {
          continue
         }
         break label$13;
        }
       }
       while (1) {
        $17 = $32 - ($18 ? 0 : $5) | 0;
        $1 = $25 + ($18 << 3) | 0;
        $13 = HEAP32[$1 + 4 >> 2];
        $16 = HEAP32[$1 >> 2];
        label$27 : {
         label$28 : {
          if (!$13 & $16 >>> 0 >= 268435457 | $13 >>> 0 > 0) {
           $1 = $17;
           $10 = 0;
           $8 = 0;
           if (($13 | 0) == 16777216 & $16 >>> 0 > 0 | $13 >>> 0 > 16777216) {
            break label$28
           }
           $14 = $1;
           $9 = 0;
           $15 = $1 >>> 25 | 0;
           $19 = $1 << 7;
           if (($13 | 0) == ($15 | 0) & $19 >>> 0 >= $16 >>> 0 | $15 >>> 0 > $13 >>> 0) {
            break label$28
           }
           while (1) {
            $8 = $8 + 8 | 0;
            $1 = $9;
            $10 = $14;
            $15 = $1 << 15 | $10 >>> 17;
            $19 = $10 << 15;
            $9 = $1 << 8;
            $1 = $10;
            $9 = $9 | $1 >>> 24;
            $1 = $1 << 8;
            $14 = $1;
            $10 = $9;
            if (($13 | 0) == ($15 | 0) & $19 >>> 0 < $16 >>> 0 | $15 >>> 0 < $13 >>> 0) {
             continue
            }
            break;
           };
           break label$28;
          }
          $8 = 0;
          $10 = $17;
          $1 = $16;
          if ($10 << 3 >>> 0 < $1 >>> 0) {
           while (1) {
            $8 = $8 + 4 | 0;
            $9 = $10 << 7;
            $10 = $10 << 4;
            if ($9 >>> 0 < $1 >>> 0) {
             continue
            }
            break;
           }
          }
          if ($10 >>> 0 >= $1 >>> 0) {
           break label$27
          }
          while (1) {
           $8 = $8 + 1 | 0;
           $10 = $10 << 1;
           if ($10 >>> 0 < $1 >>> 0) {
            continue
           }
           break;
          };
          break label$27;
         }
         if (($10 | 0) == ($13 | 0) & $1 >>> 0 >= $16 >>> 0 | $10 >>> 0 > $13 >>> 0) {
          break label$27
         }
         while (1) {
          $8 = $8 + 1 | 0;
          $15 = $10 << 1 | $1 >>> 31;
          $1 = $1 << 1;
          $10 = $15;
          if (($13 | 0) == ($10 | 0) & $1 >>> 0 < $16 >>> 0 | $10 >>> 0 < $13 >>> 0) {
           continue
          }
          break;
         };
        }
        $9 = $18 << 2;
        $1 = HEAP32[$9 + $38 >> 2];
        $19 = $1;
        $10 = Math_imul($1, $17) + $36 | 0;
        $8 = $8 >>> 0 < $7 >>> 0 ? $8 : $35;
        $15 = $8 + -1 | 0;
        $1 = $15 & 31;
        $14 = (($28 - ($17 >>> 1 | 0) | 0) + Math_imul($17, $8 + 1 | 0) | 0) + ($8 ? (32 <= ($15 & 63) >>> 0 ? $13 >>> $1 | 0 : ((1 << $1) - 1 & $13) << 32 - $1 | $16 >>> $1) : $16 << 1) | 0;
        $1 = $10 >>> 0 > $14 >>> 0;
        HEAP32[$9 + $39 >> 2] = $1 ? 0 : $19;
        HEAP32[$9 + $31 >> 2] = $1 ? $8 : 0;
        $21 = ($1 ? $14 : $10) + $21 | 0;
        $18 = $18 + 1 | 0;
        if (!($18 >>> $20)) {
         continue
        }
        break;
       };
       break label$13;
      }
      $9 = HEAP32[$25 + 4 >> 2];
      $1 = $27;
      $8 = $1 & 31;
      $10 = HEAP32[$25 >> 2];
      $8 = ($6 ? (32 <= ($1 & 63) >>> 0 ? $9 >>> $8 | 0 : ((1 << $8) - 1 & $9) << 32 - $8 | $10 >>> $8) : $10 << 1) + $40 | 0;
      $10 = ($8 | 0) == -1 ? 0 : $6;
      if ($11) {
       $9 = HEAP32[$38 >> 2];
       $14 = Math_imul($9, $4) + $36 | 0;
       $1 = $14 >>> 0 > $8 >>> 0;
       HEAP32[$39 >> 2] = $1 ? 0 : $9;
       $10 = $1 ? $10 : 0;
       $8 = $1 ? $8 : $14;
      }
      HEAP32[$31 >> 2] = $10;
      $21 = $8 + $23 | 0;
     }
     $1 = $34 + -1 >>> 0 >= $21 >>> 0;
     $24 = $1 ? $20 : $24;
     $29 = $1 ? $37 : $29;
     $34 = $1 ? $21 : $34;
     $14 = $20 + -1 | 0;
     $30 = (1 << $20) + $30 | 0;
     if (($20 | 0) > ($22 | 0)) {
      continue
     }
    }
    break;
   };
   HEAP32[$12 + 4 >> 2] = $24;
   $2 = $24 >>> 0 > 6 ? $24 : 6;
  }
  $1 = HEAP32[$12 + 8 >> 2];
  FLAC__format_entropy_coding_method_partitioned_rice_contents_ensure_size($1, $2);
  $2 = Math_imul($29, 12) + $0 | 0;
  $0 = 1 << $24;
  $3 = $0 << 2;
  memcpy(HEAP32[$1 >> 2], HEAP32[$2 + 11724 >> 2], $3);
  if ($11) {
   memcpy(HEAP32[$1 + 4 >> 2], HEAP32[$2 + 11728 >> 2], $3)
  }
  $0 = $0 >>> 0 > 1 ? $0 : 1;
  $2 = HEAP32[1667];
  $1 = HEAP32[$1 >> 2];
  $8 = 0;
  label$37 : {
   while (1) {
    if (HEAPU32[$1 + ($8 << 2) >> 2] < $2 >>> 0) {
     $8 = $8 + 1 | 0;
     if (($0 | 0) != ($8 | 0)) {
      continue
     }
     break label$37;
    }
    break;
   };
   HEAP32[$12 >> 2] = 1;
  }
  return $34;
 }
 
 function stackSave() {
  return global$0 | 0;
 }
 
 function stackRestore($0) {
  $0 = $0 | 0;
  global$0 = $0;
 }
 
 function stackAlloc($0) {
  $0 = $0 | 0;
  $0 = global$0 - $0 & -16;
  global$0 = $0;
  return $0 | 0;
 }
 
 function __growWasmMemory($0) {
  $0 = $0 | 0;
  return __wasm_memory_grow($0 | 0) | 0;
 }
 
 function dynCall_iii($0, $1, $2) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  return FUNCTION_TABLE[$0]($1, $2) | 0;
 }
 
 function dynCall_ii($0, $1) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  return FUNCTION_TABLE[$0]($1) | 0;
 }
 
 function dynCall_iiii($0, $1, $2, $3) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  return FUNCTION_TABLE[$0]($1, $2, $3) | 0;
 }
 
 function dynCall_viiiiii($0, $1, $2, $3, $4, $5, $6) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $4 = $4 | 0;
  $5 = $5 | 0;
  $6 = $6 | 0;
  FUNCTION_TABLE[$0]($1, $2, $3, $4, $5, $6);
 }
 
 function dynCall_iiiii($0, $1, $2, $3, $4) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $4 = $4 | 0;
  return FUNCTION_TABLE[$0]($1, $2, $3, $4) | 0;
 }
 
 function dynCall_viiiiiii($0, $1, $2, $3, $4, $5, $6, $7) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $4 = $4 | 0;
  $5 = $5 | 0;
  $6 = $6 | 0;
  $7 = $7 | 0;
  FUNCTION_TABLE[$0]($1, $2, $3, $4, $5, $6, $7);
 }
 
 function dynCall_viiii($0, $1, $2, $3, $4) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $4 = $4 | 0;
  FUNCTION_TABLE[$0]($1, $2, $3, $4);
 }
 
 function dynCall_viii($0, $1, $2, $3) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  FUNCTION_TABLE[$0]($1, $2, $3);
 }
 
 function legalstub$FLAC__stream_encoder_set_total_samples_estimate($0, $1, $2) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  return FLAC__stream_encoder_set_total_samples_estimate($0, $1, $2) | 0;
 }
 
 function legalstub$dynCall_jiji($0, $1, $2, $3, $4) {
  $0 = $0 | 0;
  $1 = $1 | 0;
  $2 = $2 | 0;
  $3 = $3 | 0;
  $4 = $4 | 0;
  $0 = FUNCTION_TABLE[$0]($1, $2, $3, $4) | 0;
  setTempRet0(i64toi32_i32$HIGH_BITS | 0);
  return $0 | 0;
 }
 
 function legalfunc$wasm2js_scratch_store_i64($0, $1) {
  legalimport$wasm2js_scratch_store_i64($0 | 0, $1 | 0);
 }
 
 function _ZN17compiler_builtins3int3mul3Mul3mul17h070e9a1c69faec5bE($0, $1, $2, $3) {
  var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
  $4 = $2 >>> 16 | 0;
  $5 = $0 >>> 16 | 0;
  $9 = Math_imul($4, $5);
  $6 = $2 & 65535;
  $7 = $0 & 65535;
  $8 = Math_imul($6, $7);
  $5 = ($8 >>> 16 | 0) + Math_imul($5, $6) | 0;
  $4 = ($5 & 65535) + Math_imul($4, $7) | 0;
  $0 = (Math_imul($1, $2) + $9 | 0) + Math_imul($0, $3) + ($5 >>> 16) + ($4 >>> 16) | 0;
  $1 = $8 & 65535 | $4 << 16;
  i64toi32_i32$HIGH_BITS = $0;
  return $1;
 }
 
 function _ZN17compiler_builtins3int4udiv10divmod_u6417h6026910b5ed08e40E($0, $1, $2) {
  var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $10 = 0, $11 = 0;
  label$1 : {
   label$2 : {
    label$3 : {
     label$4 : {
      label$5 : {
       label$6 : {
        label$7 : {
         label$9 : {
          label$11 : {
           $3 = $1;
           if ($3) {
            $4 = $2;
            if (!$4) {
             break label$11
            }
            break label$9;
           }
           $1 = $0;
           $0 = ($0 >>> 0) / ($2 >>> 0) | 0;
           legalfunc$wasm2js_scratch_store_i64($1 - Math_imul($0, $2) | 0, 0);
           i64toi32_i32$HIGH_BITS = 0;
           return $0;
          }
          if (!$0) {
           break label$7
          }
          break label$6;
         }
         $6 = $4 + -1 | 0;
         if (!($6 & $4)) {
          break label$5
         }
         $6 = (Math_clz32($4) + 33 | 0) - Math_clz32($3) | 0;
         $7 = 0 - $6 | 0;
         break label$3;
        }
        $0 = ($3 >>> 0) / 0 | 0;
        legalfunc$wasm2js_scratch_store_i64(0, $3 - Math_imul($0, 0) | 0);
        i64toi32_i32$HIGH_BITS = 0;
        return $0;
       }
       $3 = 32 - Math_clz32($3) | 0;
       if ($3 >>> 0 < 31) {
        break label$4
       }
       break label$2;
      }
      legalfunc$wasm2js_scratch_store_i64($0 & $6, 0);
      if (($4 | 0) == 1) {
       break label$1
      }
      $3 = __wasm_ctz_i32($4);
      $2 = $3 & 31;
      if (32 <= ($3 & 63) >>> 0) {
       $4 = 0;
       $0 = $1 >>> $2 | 0;
      } else {
       $4 = $1 >>> $2 | 0;
       $0 = ((1 << $2) - 1 & $1) << 32 - $2 | $0 >>> $2;
      }
      i64toi32_i32$HIGH_BITS = $4;
      return $0;
     }
     $6 = $3 + 1 | 0;
     $7 = 63 - $3 | 0;
    }
    $3 = $1;
    $4 = $6 & 63;
    $5 = $4 & 31;
    if (32 <= $4 >>> 0) {
     $4 = 0;
     $5 = $3 >>> $5 | 0;
    } else {
     $4 = $3 >>> $5 | 0;
     $5 = ((1 << $5) - 1 & $3) << 32 - $5 | $0 >>> $5;
    }
    $7 = $7 & 63;
    $3 = $7 & 31;
    if (32 <= $7 >>> 0) {
     $1 = $0 << $3;
     $0 = 0;
    } else {
     $1 = (1 << $3) - 1 & $0 >>> 32 - $3 | $1 << $3;
     $0 = $0 << $3;
    }
    if ($6) {
     $7 = -1;
     $3 = $2 + -1 | 0;
     if ($3 >>> 0 < 4294967295) {
      $7 = 0
     }
     while (1) {
      $8 = $5 << 1 | $1 >>> 31;
      $9 = $8;
      $4 = $4 << 1 | $5 >>> 31;
      $8 = $7 - ($4 + ($3 >>> 0 < $8 >>> 0) | 0) >> 31;
      $10 = $2 & $8;
      $5 = $9 - $10 | 0;
      $4 = $4 - ($9 >>> 0 < $10 >>> 0) | 0;
      $1 = $1 << 1 | $0 >>> 31;
      $0 = $11 | $0 << 1;
      $8 = $8 & 1;
      $11 = $8;
      $6 = $6 + -1 | 0;
      if ($6) {
       continue
      }
      break;
     };
    }
    legalfunc$wasm2js_scratch_store_i64($5, $4);
    i64toi32_i32$HIGH_BITS = $1 << 1 | $0 >>> 31;
    return $8 | $0 << 1;
   }
   legalfunc$wasm2js_scratch_store_i64($0, $1);
   $0 = 0;
   $1 = 0;
  }
  i64toi32_i32$HIGH_BITS = $1;
  return $0;
 }
 
 function __wasm_ctz_i32($0) {
  if ($0) {
   return 31 - Math_clz32($0 + -1 ^ $0) | 0
  }
  return 32;
 }
 
 function __wasm_i64_mul($0, $1, $2, $3) {
  $0 = _ZN17compiler_builtins3int3mul3Mul3mul17h070e9a1c69faec5bE($0, $1, $2, $3);
  return $0;
 }
 
 function __wasm_i64_udiv($0, $1, $2) {
  return _ZN17compiler_builtins3int4udiv10divmod_u6417h6026910b5ed08e40E($0, $1, $2);
 }
 
 function __wasm_i64_urem($0, $1) {
  _ZN17compiler_builtins3int4udiv10divmod_u6417h6026910b5ed08e40E($0, $1, 588);
  $0 = legalimport$wasm2js_scratch_load_i64() | 0;
  i64toi32_i32$HIGH_BITS = getTempRet0() | 0;
  return $0;
 }
 
 function __wasm_rotl_i32($0, $1) {
  var $2 = 0, $3 = 0;
  $2 = $1 & 31;
  $3 = (-1 >>> $2 & $0) << $2;
  $2 = $0;
  $0 = 0 - $1 & 31;
  return $3 | ($2 & -1 << $0) >>> $0;
 }
 
 // EMSCRIPTEN_END_FUNCS
;
 FUNCTION_TABLE[1] = seekpoint_compare_;
 FUNCTION_TABLE[2] = __stdio_close;
 FUNCTION_TABLE[3] = __stdio_read;
 FUNCTION_TABLE[4] = __stdio_seek;
 FUNCTION_TABLE[5] = FLAC__lpc_restore_signal;
 FUNCTION_TABLE[6] = FLAC__lpc_restore_signal_wide;
 FUNCTION_TABLE[7] = read_callback_;
 FUNCTION_TABLE[8] = read_callback_proxy_;
 FUNCTION_TABLE[9] = __emscripten_stdout_close;
 FUNCTION_TABLE[10] = __stdio_write;
 FUNCTION_TABLE[11] = __emscripten_stdout_seek;
 FUNCTION_TABLE[12] = FLAC__lpc_compute_residual_from_qlp_coefficients;
 FUNCTION_TABLE[13] = FLAC__lpc_compute_residual_from_qlp_coefficients_wide;
 FUNCTION_TABLE[14] = FLAC__fixed_compute_best_predictor_wide;
 FUNCTION_TABLE[15] = FLAC__fixed_compute_best_predictor;
 FUNCTION_TABLE[16] = precompute_partition_info_sums_;
 FUNCTION_TABLE[17] = FLAC__lpc_compute_autocorrelation;
 FUNCTION_TABLE[18] = verify_read_callback_;
 FUNCTION_TABLE[19] = verify_write_callback_;
 FUNCTION_TABLE[20] = verify_metadata_callback_;
 FUNCTION_TABLE[21] = verify_error_callback_;
 function __wasm_memory_size() {
  return buffer.byteLength / 65536 | 0;
 }
 
 function __wasm_memory_grow(pagesToAdd) {
  pagesToAdd = pagesToAdd | 0;
  var oldPages = __wasm_memory_size() | 0;
  var newPages = oldPages + pagesToAdd | 0;
  if ((oldPages < newPages) && (newPages < 65536)) {
   var newBuffer = new ArrayBuffer(Math_imul(newPages, 65536));
   var newHEAP8 = new global.Int8Array(newBuffer);
   newHEAP8.set(HEAP8);
   HEAP8 = newHEAP8;
   HEAP8 = new global.Int8Array(newBuffer);
   HEAP16 = new global.Int16Array(newBuffer);
   HEAP32 = new global.Int32Array(newBuffer);
   HEAPU8 = new global.Uint8Array(newBuffer);
   HEAPU16 = new global.Uint16Array(newBuffer);
   HEAPU32 = new global.Uint32Array(newBuffer);
   HEAPF32 = new global.Float32Array(newBuffer);
   HEAPF64 = new global.Float64Array(newBuffer);
   buffer = newBuffer;
   memory.buffer = newBuffer;
  }
  return oldPages;
 }
 
 return {
  "__wasm_call_ctors": __wasm_call_ctors, 
  "FLAC__stream_decoder_new": FLAC__stream_decoder_new, 
  "FLAC__stream_decoder_delete": FLAC__stream_decoder_delete, 
  "FLAC__stream_decoder_finish": FLAC__stream_decoder_finish, 
  "FLAC__stream_decoder_init_stream": FLAC__stream_decoder_init_stream, 
  "FLAC__stream_decoder_reset": FLAC__stream_decoder_reset, 
  "FLAC__stream_decoder_init_ogg_stream": FLAC__stream_decoder_init_ogg_stream, 
  "FLAC__stream_decoder_set_ogg_serial_number": FLAC__stream_decoder_set_ogg_serial_number, 
  "FLAC__stream_decoder_set_md5_checking": FLAC__stream_decoder_set_md5_checking, 
  "FLAC__stream_decoder_get_state": FLAC__stream_decoder_get_state, 
  "FLAC__stream_decoder_get_md5_checking": FLAC__stream_decoder_get_md5_checking, 
  "FLAC__stream_decoder_process_single": FLAC__stream_decoder_process_single, 
  "FLAC__stream_decoder_process_until_end_of_metadata": FLAC__stream_decoder_process_until_end_of_metadata, 
  "FLAC__stream_decoder_process_until_end_of_stream": FLAC__stream_decoder_process_until_end_of_stream, 
  "FLAC__stream_encoder_new": FLAC__stream_encoder_new, 
  "FLAC__stream_encoder_delete": FLAC__stream_encoder_delete, 
  "FLAC__stream_encoder_finish": FLAC__stream_encoder_finish, 
  "FLAC__stream_encoder_init_stream": FLAC__stream_encoder_init_stream, 
  "FLAC__stream_encoder_init_ogg_stream": FLAC__stream_encoder_init_ogg_stream, 
  "FLAC__stream_encoder_set_ogg_serial_number": FLAC__stream_encoder_set_ogg_serial_number, 
  "FLAC__stream_encoder_set_verify": FLAC__stream_encoder_set_verify, 
  "FLAC__stream_encoder_set_channels": FLAC__stream_encoder_set_channels, 
  "FLAC__stream_encoder_set_bits_per_sample": FLAC__stream_encoder_set_bits_per_sample, 
  "FLAC__stream_encoder_set_sample_rate": FLAC__stream_encoder_set_sample_rate, 
  "FLAC__stream_encoder_set_compression_level": FLAC__stream_encoder_set_compression_level, 
  "FLAC__stream_encoder_set_blocksize": FLAC__stream_encoder_set_blocksize, 
  "FLAC__stream_encoder_set_total_samples_estimate": legalstub$FLAC__stream_encoder_set_total_samples_estimate, 
  "FLAC__stream_encoder_get_state": FLAC__stream_decoder_get_state, 
  "FLAC__stream_encoder_process_interleaved": FLAC__stream_encoder_process_interleaved, 
  "__errno_location": __errno_location, 
  "stackSave": stackSave, 
  "stackRestore": stackRestore, 
  "stackAlloc": stackAlloc, 
  "malloc": dlmalloc, 
  "free": dlfree, 
  "__growWasmMemory": __growWasmMemory, 
  "dynCall_iii": dynCall_iii, 
  "dynCall_ii": dynCall_ii, 
  "dynCall_iiii": dynCall_iiii, 
  "dynCall_jiji": legalstub$dynCall_jiji, 
  "dynCall_viiiiii": dynCall_viiiiii, 
  "dynCall_iiiii": dynCall_iiiii, 
  "dynCall_viiiiiii": dynCall_viiiiiii, 
  "dynCall_viiii": dynCall_viiii, 
  "dynCall_viii": dynCall_viii
 };
}

for (var base64ReverseLookup = new Uint8Array(123/*'z'+1*/), i = 25; i >= 0; --i) {
    base64ReverseLookup[48+i] = 52+i; // '0-9'
    base64ReverseLookup[65+i] = i; // 'A-Z'
    base64ReverseLookup[97+i] = 26+i; // 'a-z'
  }
  base64ReverseLookup[43] = 62; // '+'
  base64ReverseLookup[47] = 63; // '/'
  /** @noinline Inlining this function would mean expanding the base64 string 4x times in the source code, which Closure seems to be happy to do. */
  function base64DecodeToExistingUint8Array(uint8Array, offset, b64) {
    var b1, b2, i = 0, j = offset, bLength = b64.length, end = offset + (bLength*3>>2) - (b64[bLength-2] == '=') - (b64[bLength-1] == '=');
    for (; i < bLength; i += 4) {
      b1 = base64ReverseLookup[b64.charCodeAt(i+1)];
      b2 = base64ReverseLookup[b64.charCodeAt(i+2)];
      uint8Array[j++] = base64ReverseLookup[b64.charCodeAt(i)] << 2 | b1 >> 4;
      if (j < end) uint8Array[j++] = b1 << 4 | b2 >> 2;
      if (j < end) uint8Array[j++] = b2 << 6 | base64ReverseLookup[b64.charCodeAt(i+3)];
    }
  }
var bufferView = new Uint8Array(wasmMemory.buffer);
base64DecodeToExistingUint8Array(bufferView, 1025, "Bw4JHBsSFTg/NjEkIyotcHd+eWxrYmVIT0ZBVFNaXeDn7un8+/L12N/W0cTDys2Ql56ZjIuChaivpqG0s7q9x8DJztvc1dL/+PH24+Tt6rewub6rrKWij4iBhpOUnZonICkuOzw1Mh8YERYDBA0KV1BZXktMRUJvaGFmc3R9eomOh4CVkpucsba/uK2qo6T5/vfw5eLr7MHGz8jd2tPUaW5nYHVye3xRVl9YTUpDRBkeFxAFAgsMISYvKD06MzROSUBHUlVcW3ZxeH9qbWRjPjkwNyIlLCsGAQgPGh0UE66poKeytby7lpGYn4qNhIPe2dDXwsXMy+bh6O/6/fTzAAAFgA+ACgAbgB4AFAARgDOANgA8ADmAKAAtgCeAIgBjgGYAbABpgHgAfYB3gHIAUABVgF+AWgBLgE4ARABBgMOAxgDMAMmA2ADdgNeA0gDwAPWA/4D6AOuA7gDkAOGAoAClgK+AqgC7gL4AtACxgJOAlgCcAJmAiACNgIeAggCDgYYBjAGJgZgBnYGXgZIBsAG1gb+BugGrga4BpAGhgeAB5YHvgeoB+4H+AfQB8YHTgdYB3AHZgcgBzYHHgcIBQAFFgU+BSgFbgV4BVAFRgXOBdgF8AXmBaAFtgWeBYgEjgSYBLAEpgTgBPYE3gTIBEAEVgR+BGgELgQ4BBAEBgQODBgMMAwmDGAMdgxeDEgMwAzWDP4M6AyuDLgMkAyGDYANlg2+DagN7g34DdANxg1ODVgNcA1mDSANNg0eDQgPAA8WDz4PKA9uD3gPUA9GD84P2A/wD+YPoA+2D54PiA6ODpgOsA6mDuAO9g7eDsgOQA5WDn4OaA4uDjgOEA4GDgAKFgo+CigKbgp4ClAKRgrOCtgK8ArmCqAKtgqeCogLjguYC7ALpgvgC/YL3gvIC0ALVgt+C2gLLgs4CxALBgkOCRgJMAkmCWAJdgleCUgJwAnWCf4J6AmuCbgJkAmGCIAIlgi+CKgI7gj4CNAIxghOCFgIcAhmCCAINggeCAgIAAAOGA4wACgOYAB4AFAOSA7AANgA8A7oAKAOuA6QAIgPgAGYAbAPqAHgD/gP0AHIAUAPWA9wAWgPIAE4ARAPCA0AAxgDMA0oA2ANeA1QA0gDwA3YDfAD6A2gA7gDkA2IAoAMmAywAqgM4AL4AtAMyAxAAlgCcAxoAiAMOAwQAggaABQYFDAaKBRgGngaUBRIFMAa2BrwFOgaoBS4FJAaiBWAG5gbsBWoG+AV+BXQG8gbQBVYFXAbaBUgGzgbEBUIFwAZGBkwFygZYBd4F1AZSBnAF9gX8BnoF6AZuBmQF4gYgBaYFrAYqBbgGPgY0BbIFkAYWBhwFmgYIBY4FhAYCCYAKBgoMCYoKGAmeCZQKEgowCbYJvAo6CagKLgokCaIKYAnmCewKagn4Cn4KdAnyCdAKVgpcCdoKSAnOCcQKQgrACUYJTArKCVgK3grUCVIJcAr2CvwJegroCW4JZAriCSAKpgqsCSoKuAk+CTQKsgqQCRYJHAqaCQgKjgqECQIPAAyGDIwPCgyYDx4PFAySDLAPNg88DLoPKAyuDKQPIgzgD2YPbAzqD3gM/gz0D3IPUAzWDNwPWgzID04PRAzCDEAPxg/MDEoP2AxeDFQP0g/wDHYMfA/6DGgP7g/kDGIPoAwmDCwPqgw4D74PtAwyDBAPlg+cDBoPiAwODAQPggAAF4ArgDwAU4BEAHgAb4CjgLQAiACfgPAA54DbgMwAQ4FUAWgBf4EQAQeBO4EsAeAB94HLgdwBs4GkAZgBj4GDgpQCqAK/gtACx4L7guwCIAI3gguCHAJzgmQCWAJPgsAD14Prg/wDk4OEA7gDr4Njg3QDSANfgzADJ4MbgwwDA4UUBSgFP4VQBUeFe4VsBaAFt4WLhZwF84XkBdgFz4VABFeEa4R8BBOEBAQ4BC+E44T0BMgE34SwBKeEm4SMBIAHl4erh7wH04fEB/gH74cjhzQHCAcfh3AHZ4dbh0wHw4bUBugG/4aQBoeGu4asBmAGd4ZLhlwGM4YkBhgGD4YDihQKKAo/ilAKR4p7imwKoAq3iouKnArziuQK2ArPikALV4tri3wLE4sECzgLL4vji/QLyAvfi7ALp4ubi4wLgAiXiKuIvAjTiMQI+AjviCOINAgICB+IcAhniFuITAjDidQJ6An/iZAJh4m7iawJYAl3iUuJXAkziSQJGAkPiQAPF48rjzwPU49ED3gPb4+jj7QPiA+fj/AP54/bj8wPQ45UDmgOf44QDgeOO44sDuAO947LjtwOs46kDpgOj46DjZQNqA2/jdANx437jewNIA03jQuNHA1zjWQNWA1PjcAM14zrjPwMk4yEDLgMr4xjjHQMSAxfjDAMJ4wbjAwMAAADlAOoADwD0ABEAHgD7AMgALQAiAMcAPADZANYAMwGQAXUBegGfAWQBgQGOAWsBWAG9AbIBVwGsAUkBRgGjAyADxQPKAy8D1AMxAz4D2wPoAw0DAgPnAxwD+QP2AxMCsAJVAloCvwJEAqECrgJLAngCnQKSAncCjAJpAmYCgwdgB4UHigdvB5QHcQd+B5sHqAdNB0IHpwdcB7kHtgdTBvAGFQYaBv8GBAbhBu4GCwY4Bt0G0gY3BswGKQYmBsMEQASlBKoETwS0BFEEXgS7BIgEbQRiBIcEfASZBJYEcwXQBTUFOgXfBSQFwQXOBSsFGAX9BfIFFwXsBQkFBgXjD+APBQ8KD+8PFA/xD/4PGw8oD80Pwg8nD9wPOQ82D9MOcA6VDpoOfw6EDmEObg6LDrgOXQ5SDrcOTA6pDqYOQwzADCUMKgzPDDQM0QzeDDsMCAztDOIMBwz8DBkMFgzzDVANtQ26DV8NpA1BDU4Nqw2YDX0Ncg2XDWwNiQ2GDWMIgAhlCGoIjwh0CJEIngh7CEgIrQiiCEcIvAhZCFYIswkQCfUJ+gkfCeQJAQkOCesJ2Ak9CTIJ1wksCckJxgkjC6ALRQtKC68LVAuxC74LWwtoC40LggtnC5wLeQt2C5MKMArVCtoKPwrECiEKLgrLCvgKHQoSCvcKDArpCuYKAwAAHuA84CIAOOBmAEQAWuBw4O4AzADS4MgAluC04KoAoOH+AdwBwuHYAYbhpOG6AZABDuEs4TIBKOF2AVQBSuFA494D/APi4/gDpuOE45oDsAMu4wzjEgMI41YDdANq42ACPuIc4gICGOJGAmQCeuJQ4s4C7ALy4ugCtuKU4ooCgOeeB7wHoue4B+bnxOfaB/AHbudM51IHSOcWBzQHKucgBn7mXOZCBljmBgYkBjrmEOaOBqwGsuaoBvbm1ObKBsAEXuR85GIEeOQmBAQEGuQw5K4EjASS5IgE1uT05OoE4OW+BZwFguWYBcbl5OX6BdAFTuVs5XIFaOU2BRQFCuUA7x4PPA8i7zgPZu9E71oPcA/u78zv0g/I75YPtA+q76AO/u7c7sIO2O6GDqQOuu6Q7g4OLA4y7igOdu5U7koOQAze7Pzs4gz47KYMhAya7LDsLgwMDBLsCAxW7HTsagxg7T4NHA0C7RgNRu1k7XoNUA3O7ezt8g3o7bYNlA2K7YAInui86KIIuOjmCMQI2ujw6G4ITAhS6EgIFug06CoIIOl+CVwJQulYCQbpJOk6CRAJjums6bIJqOn2CdQJyunA614LfAti63gLJusE6xoLMAuu64zrkguI69YL9Avq6+AKvuqc6oIKmOrGCuQK+urQ6k4KbApy6mgKNuoU6goKAAAA/gDcACIBuAFGAWQBmgJQAq4CjAJyA+gDFgM0A8oEoAReBHwEggUYBeYFxAU6BvAGDgYsBtIHSAe2B5QHaghgCJ4IvAhCCdgJJgkECfoKMArOCuwKEguIC3YLVAuqDMAMPgwcDOINeA2GDaQNWg6QDm4OTA6yDygP1g/0DwoR4BEeETwRwhBYEKYQhBB6E7ATThNsE5ISCBL2EtQSKhVAFb4VnBViFPgUBhQkFNoXEBfuF8wXMhaoFlYWdBaKGYAZfhlcGaIYOBjGGOQYGhvQGy4bDBvyGmgalhq0GkodIB3eHfwdAhyYHGYcRBy6H3Afjh+sH1IeyB42HhQe6iLgIh4iPCLCI1gjpiOEI3ogsCBOIGwgkiEIIfYh1CEqJkAmviacJmIn+CcGJyQn2iQQJO4kzCQyJaglViV0JYoqgCp+Klwqois4K8Yr5CsaKNAoLigMKPIpaCmWKbQpSi4gLt4u/C4CL5gvZi9EL7oscCyOLKwsUi3ILTYtFC3qMwAz/jPcMyIyuDJGMmQymjFQMa4xjDFyMOgwFjA0MMo3oDdeN3w3gjYYNuY2xDY6NfA1DjUsNdI0SDS2NJQ0ajtgO547vDtCOtg6JjoEOvo5MDnOOew5EjiIOHY4VDiqP8A/Pj8cP+I+eD6GPqQ+Wj2QPW49TD2yPCg81jz0PAoAAATgSOCMANDhFAFYAZzh4OIkAmgCrOLwAzTjeOO8A8DkRAQIBMzkkAVU5Rjl3AWgBmTmKObsBrDndAc4B/zngOiECMgIDOhQCZTp2OkcCWAKpOro6iwKcOu0C/gLPOtADMTsiOxMDBDt1A2YDVztIO7kDqgObO4wD/TvuO98DwDxBBFIEYzx0BAU8FjwnBDgEyTzaPOsE/DyNBJ4ErzywBVE9Qj1zBWQ9FQUGBTc9KD3ZBcoF+z3sBZ09jj2/BaAGYT5yPkMGVD4lBjYGBz4YPukG+gbLPtwGrT6+Po8GkD9xB2IHUz9EBzU/Jj8XBwgH+T/qP9sHzD+9B64Hnz+AMIEIkgijMLQIxTDWMOcI+AgJMBowKwg8ME0IXghvMHAJkTGCMbMJpDHVCcYJ9zHoMRkJCgk7MSwJXTFOMX8JYAqhMrIygwqUMuUK9grHMtgyKQo6CgsyHAptMn4yTwpQM7ELoguTM4QL9TPmM9cLyAs5MyozGwsMM30LbgtfM0AMwTTSNOMM9DSFDJYMpzS4NEkMWgxrNHwMDTQeNC8MMDXRDcIN8zXkDZU1hjW3DagNWTVKNXsNbDUdDQ4NPzUgNuEO8g7DNtQOpTa2NocOmA5pNno2Sw5cNi0OPg4PNhAP8TfiN9MPxDe1D6YPlzeIN3kPag9bN0wPPTcuNx8PAAAAYQDCAKMBhAHlAUYBJwMIA2kDygOrAowC7QJOAi8GWAY5BpoG+wfcB70HHgd/BVAFMQWSBfME1AS1BBYEdwz4DJkMOgxbDXwNHQ2+Dd8P8A+RDzIPUw50DhUOtg7XCqAKwQpiCgMLJAtFC+YLhwmoCckJagkLCCwITQjuCI8JuBnZGXoZGxg8GF0Y/hifGrAa0RpyGhMbNBtVG/Yblx/gH4EfIh9DHmQeBR6mHscc6ByJHCocSx1sHQ0drh3PFUAVIRWCFeMUxBSlFAYUZxZIFikWihbrF8wXrRcOF28TGBN5E9oTuxKcEv0SXhI/EBAQcRDSELMRlBH1EVYRNxM4M1kz+jObMrwy3TJ+Mh8wMDBRMPIwkzG0MdUxdjEXNWA1ATWiNcM05DSFNCY0RzZoNgk2qjbLN+w3jTcuN08/wD+hPwI/Yz5EPiU+hj7nPMg8qTwKPGs9TD0tPY497zmYOfk5Wjk7OBw4fTjeOL86kDrxOlI6MzsUO3U71ju3OoAq4SpCKiMrBCtlK8YrpymIKekpSikrKAwobSjOKK8s2Cy5LBosey1cLT0tni3/L9AvsS8SL3MuVC41LpYu9yZ4JhkmuibbJ/wnnSc+J18lcCURJbIl0yT0JJUkNiRXICAgQSDiIIMhpCHFIWYhByMoI0kj6iOLIqwizSJuIg8gAAAAC3HcEEbjuCCdkmQw3cdgQTa2vFF7JNhhoFUEceuO0IJg/wySLW1oovYctLK2SbDDXThs0xCqCOPL29Tzhw2xFMx8bQSB7gk0Wp/VJBrK0VXxuw1FvClpdWdYtWUsg2GWp/K9hupg2bYxEQWmcUQB15o13cfXp7n3DNZl504LYjmFer4pyOjaGROZBglTzAJ4uL3eaPUvulguXmZIZYWyu+70bqujZgqbeBfWizhC0vrTMw7qnqFq2kXQtsoJBtMtQncPPQ/law3UlLcdlMGzbH+wb3wyIgtM6VPXXKKIA68p+d+/ZGu7j78aZ5//T2PuFD6//lms286C3Qfex3cIY0wG1HMBlLBD2uVsU5qwaCJxwbQyPFPQAuciDBKs+djhJ4gE8WoaYMGxa7zR8T64oBpPZLBX3QCAjKzckMB6uXeLC2VnxpkBVx3o3Uddvdk2tswFJvteYRYgL70Ga/Rp9eCFteWtF9HVdmYNxTYzCbTdQtWkkNCxlEuhbYQJfGpawg22So+f0npU7g5qFLsKG//K1guyWLI7aSluKyLyutipg2bI5BEC+D9g3uh/NdqZlEQGidnWYrkCp76pTnHbTgUAB15IkmNuk+O/ftO2uw84x2cfdVUDL64k3z/l/wvMbo7X3CMcs+z4bW/8uDhrjVNJt50e29OtxaoPvY7uAMaVn9zW2A245gN8ZPZDKWCHqFi8l+XK2Kc+uwS3dWDQRP4RDFSzg2hkaPK0dCinsAXD1mwVjkQIJVU11DUZ47HSUpJtwh8ACfLEcdXihCTRk29VDYMix2mz+ba1o7JtYVA5HL1AdI7ZcK//BWDvqgERBNvdAUlJuTGSOGUh0OVi/xuUvu9WBtrfjXcGz80iAr4mU96ua8G6nrCwZo77a7J9cBpubT2ICl3m+dZNpqzSPE3dDiwAT2oc2z62DJfo0+vcmQ/7kQtry0p6t9sKL7Oq4V5vuqzMC4p3vdeaPGYDabcX33n6hbtJIfRnWWGhYyiK0L84x0LbCBwzBxhZmQil0ujUtZ96sIVEC2yVBF5o5O8vtPSivdDEecwM1DIX2Ce5ZgQ39PRgBy+FvBdv0LhmhKFkdskzAEYSQtxWXpS5sRXlZaFYdwGRgwbdgcNT2fAoIgXgZbBh0L7BvcD1Gmkzfmu1IzP50RPoiA0DqN0JckOs1WIOPrFS1U9tQpeSapxc47aMEXHSvMoADqyKVQrdYSTWzSy2sv33x27tvBy6HjdtZg56/wI+oY7eLuHb2l8KqgZPRzhif5xJvm/Qn9uIm+4HmNZ8Y6gNDb+4TVi7yaYpZ9nruwPpMMrf+XsRCwrwYNcavfKzKmaDbzom1mtLzae3W4A102tbRA97F/RkxBQwByZWZlcmVuY2UgbGliRkxBQyAxLjMuMyAyMDE5MDgwNABmTGFDAENhTGYgAAAAEAAAABAAAAAYAAAAGAAAABQAAAADAAAABQAAACQAAAAgAAAAQAAAAEAAAAAQAAAAQAAAAAgAAAAYAAAAQAAAAAgAAABgAAAAAQAAAAEAAABuAAAACAAAAAAEAABAAAAAAQAAABcIAAAIAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAABAAAABwAAABgAAAD+PwAADgAAAAEAAAABAAAABAAAAAQAAAAEAAAAAwAAAAEAAAAIAAAAEAAAAAIAAAAEAAAABAAAAAUAAAAFAAAADwAAAB8AAAAEAAAABQAAAAEAAAAGAAAAAQAAAAAAAAACAAAAEAAAAEAAAABDRC1EQSBjdWUgc2hlZXQgbXVzdCBoYXZlIGEgbGVhZC1pbiBsZW5ndGggb2YgYXQgbGVhc3QgMiBzZWNvbmRzAENELURBIGN1ZSBzaGVldCBsZWFkLWluIGxlbmd0aCBtdXN0IGJlIGV2ZW5seSBkaXZpc2libGUgYnkgNTg4IHNhbXBsZXMAY3VlIHNoZWV0IG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgdHJhY2sgKHRoZSBsZWFkLW91dCkAQ0QtREEgY3VlIHNoZWV0IG11c3QgaGF2ZSBhIGxlYWQtb3V0IHRyYWNrIG51bWJlciAxNzAgKDB4QUEpAGN1ZSBzaGVldCBtYXkgbm90IGhhdmUgYSB0cmFjayBudW1iZXIgMABDRC1EQSBjdWUgc2hlZXQgdHJhY2sgbnVtYmVyIG11c3QgYmUgMS05OSBvciAxNzAAQ0QtREEgY3VlIHNoZWV0IGxlYWQtb3V0IG9mZnNldCBtdXN0IGJlIGV2ZW5seSBkaXZpc2libGUgYnkgNTg4IHNhbXBsZXMAQ0QtREEgY3VlIHNoZWV0IHRyYWNrIG9mZnNldCBtdXN0IGJlIGV2ZW5seSBkaXZpc2libGUgYnkgNTg4IHNhbXBsZXMAY3VlIHNoZWV0IHRyYWNrIG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgaW5kZXggcG9pbnQAY3VlIHNoZWV0IHRyYWNrJ3MgZmlyc3QgaW5kZXggbnVtYmVyIG11c3QgYmUgMCBvciAxAENELURBIGN1ZSBzaGVldCB0cmFjayBpbmRleCBvZmZzZXQgbXVzdCBiZSBldmVubHkgZGl2aXNpYmxlIGJ5IDU4OCBzYW1wbGVzAGN1ZSBzaGVldCB0cmFjayBpbmRleCBudW1iZXJzIG11c3QgaW5jcmVhc2UgYnkgMQBNSU1FIHR5cGUgc3RyaW5nIG11c3QgY29udGFpbiBvbmx5IHByaW50YWJsZSBBU0NJSSBjaGFyYWN0ZXJzICgweDIwLTB4N2UpAGRlc2NyaXB0aW9uIHN0cmluZyBtdXN0IGJlIHZhbGlkIFVURi04AAAAAHgqAABJRDM=");
base64DecodeToExistingUint8Array(bufferView, 7564, "AQAAAAUAAAAIKw==");
base64DecodeToExistingUint8Array(bufferView, 7584, "AwAAAAQAAAAEAAAABgAAAIP5ogBETm4A/CkVANFXJwDdNPUAYtvAADyZlQBBkEMAY1H+ALveqwC3YcUAOm4kANJNQgBJBuAACeouAByS0QDrHf4AKbEcAOg+pwD1NYIARLsuAJzphAC0JnAAQX5fANaROQBTgzkAnPQ5AItfhAAo+b0A+B87AN7/lwAPmAUAES/vAApaiwBtH20Az342AAnLJwBGT7cAnmY/AC3qXwC6J3UA5evHAD178QD3OQcAklKKAPtr6gAfsV8ACF2NADADVgB7/EYA8KtrACC8zwA29JoA46kdAF5hkQAIG+YAhZllAKAUXwCNQGgAgNj/ACdzTQAGBjEAylYVAMmocwB74mAAa4zAABnERwDNZ8MACejcAFmDKgCLdsQAphyWAESv3QAZV9EApT4FAAUH/wAzfj8AwjLoAJhP3gC7fTIAJj3DAB5r7wCf+F4ANR86AH/yygDxhx0AfJAhAGokfADVbvoAMC13ABU7QwC1FMYAwxmdAK3EwgAsTUEADABdAIZ9RgDjcS0Am8aaADNiAAC00nwAtKeXADdV1QDXPvYAoxAYAE12/ABknSoAcNerAGN8+AB6sFcAFxXnAMBJVgA71tkAp4Q4ACQjywDWincAWlQjAAAfuQDxChsAGc7fAJ8x/wBmHmoAmVdhAKz7RwB+f9gAImW3ADLoiQDmv2AA78TNAGw2CQBdP9QAFt7XAFg73gDem5IA0iIoACiG6ADiWE0AxsoyAAjjFgDgfcsAF8BQAPMdpwAY4FsALhM0AIMSYgCDSAEA9Y5bAK2wfwAe6fIASEpDABBn0wCq3dgArl9CAGphzgAKKKQA05m0AAam8gBcd38Ao8KDAGE8iACKc3gAr4xaAG/XvQAtpmMA9L/LAI2B7wAmwWcAVcpFAMrZNgAoqNIAwmGNABLJdwAEJhQAEkabAMRZxADIxUQATbKRAAAX8wDUQ60AKUnlAP3VEAAAvvwAHpTMAHDO7gATPvUA7PGAALPnwwDH+CgAkwWUAMFxPgAuCbMAC0XzAIgSnACrIHsALrWfAEeSwgB7Mi8ADFVtAHKnkABr5x8AMcuWAHkWSgBBeeIA9N+JAOiUlwDi5oQAmTGXAIjtawBfXzYAu/0OAEiatABnpGwAcXJCAI1dMgCfFbgAvOUJAI0xJQD3dDkAMAUcAA0MAQBLCGgALO5YAEeqkAB05wIAvdYkAPd9pgBuSHIAnxbvAI6UpgC0kfYA0VNRAM8K8gAgmDMA9Ut+ALJjaADdPl8AQF0DAIWJfwBVUikAN2TAAG3YEAAySDIAW0x1AE5x1ABFVG4ACwnBACr1aQAUZtUAJwedAF0EUAC0O9sA6nbFAIf5FwBJa30AHSe6AJZpKQDGzKwArRRUAJDiagCI2YkALHJQAASkvgB3B5QA8zBwAAD8JwDqcagAZsJJAGTgPQCX3YMAoz+XAEOU/QANhowAMUHeAJI5nQDdcIwAF7fnAAjfOwAVNysAXICgAFqAkwAQEZIAD+jYAGyArwDb/0sAOJAPAFkYdgBipRUAYcu7AMeJuQAQQL0A0vIEAEl1JwDrtvYA2yK7AAoUqgCJJi8AZIN2AAk7MwAOlBoAUTqqAB2jwgCv7a4AXCYSAG3CTQAtepwAwFaXAAM/gwAJ8PYAK0CMAG0xmQA5tAcADCAVANjDWwD1ksQAxq1LAE7KpQCnN80A5qk2AKuSlADdQmgAGWPeAHaM7wBoi1IA/Ns3AK6hqwDfFTEAAK6hAAz72gBkTWYA7QW3ACllMABXVr8AR/86AGr5uQB1vvMAKJPfAKuAMABmjPYABMsVAPoiBgDZ5B0APbOkAFcbjwA2zQkATkLpABO+pAAzI7UA8KoaAE9lqADSwaUACz8PAFt4zQAj+XYAe4sEAIkXcgDGplMAb27iAO/rAACbSlgAxNq3AKpmugB2z88A0QIdALHxLQCMmcEAw613AIZI2gD3XaAAxoD0AKzwLwDd7JoAP1y8ANDebQCQxx8AKtu2AKMlOgAAr5oArVOTALZXBAApLbQAS4B+ANoHpwB2qg4Ae1mhABYSKgDcty0A+uX9AInb/gCJvv0A5HZsAAap/AA+gHAAhW4VAP2H/wAoPgcAYWczACoYhgBNveoAs+evAI9tbgCVZzkAMb9bAITXSAAw3xYAxy1DACVhNQDJcM4AMMu4AL9s/QCkAKIABWzkAFrdoAAhb0cAYhLSALlchABwYUkAa1bgAJlSAQBQVTcAHtW3ADPxxAATbl8AXTDkAIUuqQAdssMAoTI2AAi3pADqsdQAFvchAI9p5AAn/3cADAOAAI1ALQBPzaAAIKWZALOi0wAvXQoAtPlCABHaywB9vtAAm9vBAKsXvQDKooEACGpcAC5VFwAnAFUAfxTwAOEHhgAUC2QAlkGNAIe+3gDa/SoAayW2AHuJNAAF8/4Aub+eAGhqTwBKKqgAT8RaAC34vADXWpgA9MeVAA1NjQAgOqYApFdfABQ/sQCAOJUAzCABAHHdhgDJ3rYAv2D1AE1lEQABB2sAjLCsALLA0ABRVUgAHvsOAJVywwCjBjsAwEA1AAbcewDgRcwATin6ANbKyADo80EAfGTeAJtk2ADZvjEApJfDAHdY1ABp48UA8NoTALo6PABGGEYAVXVfANK99QBuksYArC5dAA5E7QAcPkIAYcSHACn96QDn1vMAInzKAG+RNQAI4MUA/9eNAG5q4gCw/cYAkwjBAHxddABrrbIAzW6dAD5yewDGEWoA98+pAClz3wC1yboAtwBRAOKyDQB0uiQA5X1gAHTYigANFSwAgRgMAH5mlAABKRYAn3p2AP39vgBWRe8A2X42AOzZEwCLurkAxJf8ADGoJwDxbsMAlMU2ANioVgC0qLUAz8wOABKJLQBvVzQALFaJAJnO4wDWILkAa16qAD4qnAARX8wA/QtKAOH0+wCOO20A4oYsAOnUhAD8tKkA7+7RAC41yQAvOWEAOCFEABvZyACB/AoA+0pqAC8c2ABTtIQATpmMAFQizAAqVdwAwMbWAAsZlgAacLgAaZVkACZaYAA/Uu4AfxEPAPS1EQD8y/UANLwtADS87gDoXcwA3V5gAGeOmwCSM+8AyRe4AGFYmwDhV7wAUYPGANg+EADdcUgALRzdAK8YoQAhLEYAWfPXANl6mACeVMAAT4b6AFYG/ADlea4AiSI2ADitIgBnk9wAVeiqAIImOADK55sAUQ2kAJkzsQCp1w4AaQVIAGWy8AB/iKcAiEyXAPnRNgAhkrMAe4JKAJjPIQBAn9wA3EdVAOF0OgBn60IA/p3fAF7UXwB7Z6QAuqx6AFX2ogAriCMAQbpVAFluCAAhKoYAOUeDAInj5gDlntQASftAAP9W6QAcD8oAxVmKAJT6KwDTwcUAD8XPANtargBHxYYAhUNiACGGOwAseZQAEGGHACpMewCALBoAQ78SAIgmkAB4PIkAqMTkAOXbewDEOsIAJvTqAPdnigANkr8AZaMrAD2TsQC9fAsApFHcACfdYwBp4d0AmpQZAKgplQBozigACe20AESfIABOmMoAcIJjAH58IwAPuTIAp/WOABRW5wAh8QgAtZ0qAG9+TQClGVEAtfmrAILf1gCW3WEAFjYCAMQ6nwCDoqEAcu1tADmNegCCuKkAazJcAEYnWwAANO0A0gB3APz0VQABWU0A4HGA");
base64DecodeToExistingUint8Array(bufferView, 10371, "QPsh+T8AAAAALUR0PgAAAICYRvg8AAAAYFHMeDsAAACAgxvwOQAAAEAgJXo4AAAAgCKC4zYAAAAAHfNpNQAAAAAAAOA/AAAAAAAA4L8BAAAAAgAAAAQAAAAFAAAABgAAAGluZmluaXR5AG5hbg==");
base64DecodeToExistingUint8Array(bufferView, 10496, "0XSeAFedvSqAcFIP//8+JwoAAABkAAAA6AMAABAnAACghgEAQEIPAICWmAAA4fUFGAAAADUAAABxAAAAa////877//+Sv///YmFydGxldHQAYmFydGxldHRfaGFubgBibGFja21hbgBibGFja21hbl9oYXJyaXNfNHRlcm1fOTJkYgBjb25uZXMAZmxhdHRvcABnYXVzcygAaGFtbWluZwBoYW5uAGthaXNlcl9iZXNzZWwAbnV0dGFsbAByZWN0YW5nbGUAdHJpYW5nbGUAdHVrZXkoAHBhcnRpYWxfdHVrZXkoAHB1bmNob3V0X3R1a2V5KAB3ZWxjaABpbWFnZS9wbmcALS0+AHR1a2V5KDVlLTEpAHR1a2V5KDVlLTEpO3BhcnRpYWxfdHVrZXkoMikAdHVrZXkoNWUtMSk7cGFydGlhbF90dWtleSgyKTtwdW5jaG91dF90dWtleSgzKQ==");
base64DecodeToExistingUint8Array(bufferView, 10864, "ARkAAAYZAAAJ");
base64DecodeToExistingUint8Array(bufferView, 10884, "Ag==");
base64DecodeToExistingUint8Array(bufferView, 10904, "AwAAAAAAAAAEAAAAOC8AAAAE");
base64DecodeToExistingUint8Array(bufferView, 10948, "/////w==");
base64DecodeToExistingUint8Array(bufferView, 11016, "BQ==");
base64DecodeToExistingUint8Array(bufferView, 11028, "CQ==");
base64DecodeToExistingUint8Array(bufferView, 11052, "CgAAAAsAAABIMwAAAAQ=");
base64DecodeToExistingUint8Array(bufferView, 11076, "AQ==");
base64DecodeToExistingUint8Array(bufferView, 11091, "Cv////8=");
base64DecodeToExistingUint8Array(bufferView, 11160, "CCs=");
base64DecodeToExistingUint8Array(bufferView, 11200, "AwAAAAAAAAAJKgAAAQAAAAE=");
base64DecodeToExistingUint8Array(bufferView, 11244, "AwAAAAAAAAAJKgAAAQ==");
base64DecodeToExistingUint8Array(bufferView, 11288, "AwAAAAAAAAAJKg==");
base64DecodeToExistingUint8Array(bufferView, 11308, "Bg==");
base64DecodeToExistingUint8Array(bufferView, 11332, "BAAAAAAAAAAJKgAAAQAAAAEAAAAI");
base64DecodeToExistingUint8Array(bufferView, 11376, "BAAAAAAAAAAJKgAAAQAAAAAAAAAI");
base64DecodeToExistingUint8Array(bufferView, 11420, "BQAAAAAAAAAJKgAAAQAAAAAAAAAI");
base64DecodeToExistingUint8Array(bufferView, 11464, "BgAAAAAAAAAVKgAAAQAAAAAAAAAM");
base64DecodeToExistingUint8Array(bufferView, 11508, "BgAAAAAAAAAVKgAAAQAAAAAAAAAM");
base64DecodeToExistingUint8Array(bufferView, 11552, "BgAAAAAAAAAyKg==");
return asmFunc({
    'Int8Array': Int8Array,
    'Int16Array': Int16Array,
    'Int32Array': Int32Array,
    'Uint8Array': Uint8Array,
    'Uint16Array': Uint16Array,
    'Uint32Array': Uint32Array,
    'Float32Array': Float32Array,
    'Float64Array': Float64Array,
    'NaN': NaN,
    'Infinity': Infinity,
    'Math': Math
  },
  asmLibraryArg,
  wasmMemory.buffer
)

}
)(asmLibraryArg, wasmMemory, wasmTable);
    return {
      'exports': exports
    };
  },

  instantiate: /** @suppress{checkTypes} */ function(binary, info) {
    return {
      then: function(ok) {
        ok({
          'instance': new WebAssembly.Instance(new WebAssembly.Module(binary))
        });
      }
    };
  },

  RuntimeError: Error
};

// We don't need to actually download a wasm binary, mark it as present but empty.
wasmBinary = [];



if (typeof WebAssembly !== 'object') {
  err('no native wasm support detected');
}




// In MINIMAL_RUNTIME, setValue() and getValue() are only available when building with safe heap enabled, for heap safety checking.
// In traditional runtime, setValue() and getValue() are always available (although their use is highly discouraged due to perf penalties)

/** @param {number} ptr
    @param {number} value
    @param {string} type
    @param {number|boolean=} noSafe */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}

/** @param {number} ptr
    @param {string} type
    @param {number|boolean=} noSafe */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for getValue: ' + type);
    }
  return null;
}






// Wasm globals

var wasmMemory;

// In fastcomp asm.js, we don't need a wasm Table at all.
// In the wasm backend, we polyfill the WebAssembly object,
// so this creates a (non-native-wasm) table for us.
var wasmTable = new WebAssembly.Table({
  'initial': 22,
  'maximum': 22 + 5,
  'element': 'anyfunc'
});


//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS = 0;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

// C calling interface.
/** @param {string|null=} returnType
    @param {Array=} argTypes
    @param {Arguments|Array=} args
    @param {Object=} opts */
function ccall(ident, returnType, argTypes, args, opts) {
  // For fast lookup of conversion functions
  var toC = {
    'string': function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    },
    'array': function(arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };

  function convertReturnValue(ret) {
    if (returnType === 'string') return UTF8ToString(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);

  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}

/** @param {string=} returnType
    @param {Array=} argTypes
    @param {Object=} opts */
function cwrap(ident, returnType, argTypes, opts) {
  argTypes = argTypes || [];
  // When the function takes numbers and returns a number, we can just return
  // the original function
  var numericArgs = argTypes.every(function(type){ return type === 'number'});
  var numericRet = returnType !== 'string';
  if (numericRet && numericArgs && !opts) {
    return getCFunc(ident);
  }
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_DYNAMIC = 2; // Cannot be freed except through sbrk
var ALLOC_NONE = 3; // Do not allocate

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc,
    stackAlloc,
    dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var stop;
    ptr = ret;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!runtimeInitialized) return dynamicAlloc(size);
  return _malloc(size);
}




// runtime_strings.js: Strings related runtime functions that are part of both MINIMAL_RUNTIME and regular runtime.

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;

/**
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(heap, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
  while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(heap.subarray(idx, endPtr));
  } else {
    var str = '';
    // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
    while (idx < endPtr) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = heap[idx++];
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = heap[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      var u2 = heap[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heap[idx++] & 63);
      }

      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
  return str;
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
// copy of that string as a Javascript String object.
// maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
//                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
//                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
//                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
//                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
//                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
//                 throw JS JIT optimizations off, so it is worth to consider consistently using one
//                 style or the other.
/**
 * @param {number} ptr
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   heap: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 0xC0 | (u >> 6);
      heap[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 0xE0 | (u >> 12);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      heap[outIdx++] = 0xF0 | (u >> 18);
      heap[outIdx++] = 0x80 | ((u >> 12) & 63);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  heap[outIdx] = 0;
  return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) ++len;
    else if (u <= 0x7FF) len += 2;
    else if (u <= 0xFFFF) len += 3;
    else len += 4;
  }
  return len;
}





// runtime_strings_extra.js: Strings related runtime functions that are available only in regular runtime.

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAPU8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;

function UTF16ToString(ptr, maxBytesToRead) {
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  var maxIdx = idx + maxBytesToRead / 2;
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0 || i == maxBytesToRead / 2) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr, maxBytesToRead) {
  var i = 0;

  var str = '';
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  while (!(i >= maxBytesToRead / 4)) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0) break;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
  return str;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated
    @param {boolean=} dontAddNull */
function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer);
}

/** @param {boolean=} dontAddNull */
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}



// Memory management

var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  Module['HEAP8'] = HEAP8 = new Int8Array(buf);
  Module['HEAP16'] = HEAP16 = new Int16Array(buf);
  Module['HEAP32'] = HEAP32 = new Int32Array(buf);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
}

var STATIC_BASE = 1024,
    STACK_BASE = 5257200,
    STACKTOP = STACK_BASE,
    STACK_MAX = 14320,
    DYNAMIC_BASE = 5257200,
    DYNAMICTOP_PTR = 14160;



var TOTAL_STACK = 5242880;

var INITIAL_INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 16777216;









// In non-standalone/normal mode, we create the memory here.



// Create the main memory. (Note: this isn't used in STANDALONE_WASM mode since the wasm
// memory is created in the wasm, not in JS.)

  if (Module['wasmMemory']) {
    wasmMemory = Module['wasmMemory'];
  } else
  {
    wasmMemory = new WebAssembly.Memory({
      'initial': INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE
      ,
      'maximum': 2147483648 / WASM_PAGE_SIZE
    });
  }


if (wasmMemory) {
  buffer = wasmMemory.buffer;
}

// If the user provides an incorrect length, just use that length instead rather than providing the user to
// specifically provide the memory length with Module['INITIAL_MEMORY'].
INITIAL_INITIAL_MEMORY = buffer.byteLength;
updateGlobalBufferAndViews(buffer);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;














function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback(Module); // Pass the module as the first argument.
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func);
      } else {
        Module['dynCall_vi'](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {

  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  runtimeInitialized = true;
  if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
TTY.init();
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  FS.ignorePermissions = false;
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  runtimeExited = true;
}

function postRun() {

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

/** @param {number|boolean=} ignore */
function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
/** @param {number|boolean=} ignore */
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}




// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_max = Math.max;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;



// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function getUniqueRunDependency(id) {
  return id;
}

function addRunDependency(id) {
  runDependencies++;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

}

function removeRunDependency(id) {
  runDependencies--;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data

/** @param {string|number=} what */
function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  what += '';
  out(what);
  err(what);

  ABORT = true;
  EXITSTATUS = 1;

  what = 'abort(' + what + '). Build with -s ASSERTIONS=1 for more info.';

  // Throw a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  throw new WebAssembly.RuntimeError(what);
}


var memoryInitializer = null;












function hasPrefix(str, prefix) {
  return String.prototype.startsWith ?
      str.startsWith(prefix) :
      str.indexOf(prefix) === 0;
}

// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  return hasPrefix(filename, dataURIPrefix);
}

var fileURIPrefix = "file://";

// Indicates whether filename is delivered via file protocol (as opposed to http/https)
function isFileURI(filename) {
  return hasPrefix(filename, fileURIPrefix);
}




var wasmBinaryFile = 'libflac.wasm';
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary() {
  try {
    if (wasmBinary) {
      return new Uint8Array(wasmBinary);
    }

    var binary = tryParseAsDataURI(wasmBinaryFile);
    if (binary) {
      return binary;
    }
    if (readBinary) {
      return readBinary(wasmBinaryFile);
    } else {
      throw "both async and sync fetching of the wasm failed";
    }
  }
  catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  // If we don't have the binary yet, and have the Fetch api, use that;
  // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function'
      // Let's not use fetch to get objects over file:// as it's most likely Cordova which doesn't support fetch for file://
      && !isFileURI(wasmBinaryFile)
      ) {
    return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
      if (!response['ok']) {
        throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
      }
      return response['arrayBuffer']();
    }).catch(function () {
      return getBinary();
    });
  }
  // Otherwise, getBinary should be able to get it synchronously
  return new Promise(function(resolve, reject) {
    resolve(getBinary());
  });
}



// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1': asmLibraryArg
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    var exports = instance.exports;
    Module['asm'] = exports;
    removeRunDependency('wasm-instantiate');
  }
  // we can't run yet (except in a pthread, where we have a custom sync instantiator)
  addRunDependency('wasm-instantiate');


  function receiveInstantiatedSource(output) {
    // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
    receiveInstance(output['instance']);
  }


  function instantiateArrayBuffer(receiver) {
    return getBinaryPromise().then(function(binary) {
      return WebAssembly.instantiate(binary, info);
    }).then(receiver, function(reason) {
      err('failed to asynchronously prepare wasm: ' + reason);
      abort(reason);
    });
  }

  // Prefer streaming instantiation if available.
  function instantiateAsync() {
    if (!wasmBinary &&
        typeof WebAssembly.instantiateStreaming === 'function' &&
        !isDataURI(wasmBinaryFile) &&
        // Don't use streaming for file:// delivered objects in a webview, fetch them synchronously.
        !isFileURI(wasmBinaryFile) &&
        typeof fetch === 'function') {
      fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function (response) {
        var result = WebAssembly.instantiateStreaming(response, info);
        return result.then(receiveInstantiatedSource, function(reason) {
            // We expect the most common failure cause to be a bad MIME type for the binary,
            // in which case falling back to ArrayBuffer instantiation should work.
            err('wasm streaming compile failed: ' + reason);
            err('falling back to ArrayBuffer instantiation');
            return instantiateArrayBuffer(receiveInstantiatedSource);
          });
      });
    } else {
      return instantiateArrayBuffer(receiveInstantiatedSource);
    }
  }
  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
  // to any other async startup actions they are performing.
  if (Module['instantiateWasm']) {
    try {
      var exports = Module['instantiateWasm'](info, receiveInstance);
      return exports;
    } catch(e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
      return false;
    }
  }

  instantiateAsync();
  return {}; // no exports yet; we'll fill them in later
}


// Globals used by JS i64 conversions
var tempDouble;
var tempI64;

// === Body ===

var ASM_CONSTS = {
  
};




// STATICTOP = STATIC_BASE + 13296;
/* global initializers */  __ATINIT__.push({ func: function() { ___wasm_call_ctors() } });




/* no memory initializer */
// {{PRE_LIBRARY}}


  function demangle(func) {
      return func;
    }

  function demangleAll(text) {
      var regex =
        /\b_Z[\w\d_]+/g;
      return text.replace(regex,
        function(x) {
          var y = demangle(x);
          return x === y ? x : (y + ' [' + x + ']');
        });
    }

  function jsStackTrace() {
      var err = new Error();
      if (!err.stack) {
        // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
        // so try that as a special-case.
        try {
          throw new Error();
        } catch(e) {
          err = e;
        }
        if (!err.stack) {
          return '(no stack trace available)';
        }
      }
      return err.stack.toString();
    }

  function stackTrace() {
      var js = jsStackTrace();
      if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
      return demangleAll(js);
    }

  function _emscripten_get_sbrk_ptr() {
      return 14160;
    }

  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }

  
  function _emscripten_get_heap_size() {
      return HEAPU8.length;
    }
  
  function emscripten_realloc_buffer(size) {
      try {
        // round size grow request up to wasm page size (fixed 64KB per spec)
        wasmMemory.grow((size - buffer.byteLength + 65535) >>> 16); // .grow() takes a delta compared to the previous size
        updateGlobalBufferAndViews(wasmMemory.buffer);
        return 1 /*success*/;
      } catch(e) {
      }
    }function _emscripten_resize_heap(requestedSize) {
      requestedSize = requestedSize >>> 0;
      var oldSize = _emscripten_get_heap_size();
      // With pthreads, races can happen (another thread might increase the size in between), so return a failure, and let the caller retry.
  
  
      var PAGE_MULTIPLE = 65536;
  
      // Memory resize rules:
      // 1. When resizing, always produce a resized heap that is at least 16MB (to avoid tiny heap sizes receiving lots of repeated resizes at startup)
      // 2. Always increase heap size to at least the requested size, rounded up to next page multiple.
      // 3a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap geometrically: increase the heap size according to 
      //                                         MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%),
      //                                         At most overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
      // 3b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap linearly: increase the heap size by at least MEMORY_GROWTH_LINEAR_STEP bytes.
      // 4. Max size for the heap is capped at 2048MB-PAGE_MULTIPLE, or by MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
      // 5. If we were unable to allocate as much memory, it may be due to over-eager decision to excessively reserve due to (3) above.
      //    Hence if an allocation fails, cut down on the amount of excess growth, in an attempt to succeed to perform a smaller allocation.
  
      // A limit was set for how much we can grow. We should not exceed that
      // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
      var maxHeapSize = 2147483648;
      if (requestedSize > maxHeapSize) {
        return false;
      }
  
      var minHeapSize = 16777216;
  
      // Loop through potential heap size increases. If we attempt a too eager reservation that fails, cut down on the
      // attempted size and reserve a smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
      for(var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown); // ensure geometric growth
        // but limit overreserving (default to capping at +96MB overgrowth at most)
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296 );
  
  
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(minHeapSize, requestedSize, overGrownHeapSize), PAGE_MULTIPLE));
  
        var replacement = emscripten_realloc_buffer(newSize);
        if (replacement) {
  
          return true;
        }
      }
      return false;
    }

  
  
  var PATH={splitPath:function(filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function(parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function(path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function(path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function(path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function(path) {
        return PATH.splitPath(path)[3];
      },join:function() {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function(l, r) {
        return PATH.normalize(l + '/' + r);
      }};
  
  
  function setErrNo(value) {
      HEAP32[((___errno_location())>>2)]=value;
      return value;
    }
  
  var PATH_FS={resolve:function() {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function(from, to) {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function(stream) {
          // flush any pending line data
          stream.tty.ops.flush(stream.tty);
        },flush:function(stream) {
          stream.tty.ops.flush(stream.tty);
        },read:function(stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function(tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              // we will read data by chunks of BUFSIZE
              var BUFSIZE = 256;
              var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
              var bytesRead = 0;
  
              try {
                bytesRead = nodeFS.readSync(process.stdin.fd, buf, 0, BUFSIZE, null);
              } catch(e) {
                // Cross-platform differences: on Windows, reading EOF throws an exception, but on other OSes,
                // reading EOF returns 0. Uniformize behavior by treating the EOF exception to return 0.
                if (e.toString().indexOf('EOF') != -1) bytesRead = 0;
                else throw e;
              }
  
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }
            } else
            if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },flush:function(tty) {
          if (tty.output && tty.output.length > 0) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }},default_tty1_ops:{put_char:function(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },flush:function(tty) {
          if (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }}};
  
  var MEMFS={ops_table:null,mount:function(mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(63);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap,
                msync: MEMFS.stream_ops.msync
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },getFileDataAsRegularArray:function(node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
      },getFileDataAsTypedArray:function(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
        // avoid overshooting the allocation cap by a very large margin.
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
        return;
      },resizeFileStorage:function(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
          return;
        }
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
          var oldContents = node.contents;
          node.contents = new Uint8Array(newSize); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
          return;
        }
        // Backing with a JS array.
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },node_ops:{getattr:function(node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function(node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function(parent, name) {
          throw FS.genericErrors[44];
        },mknod:function(parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function(old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function(parent, name) {
          delete parent.contents[name];
        },rmdir:function(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
        },readdir:function(node) {
          var entries = ['.', '..'];
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        }},stream_ops:{read:function(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },write:function(stream, buffer, offset, length, position, canOwn) {
          // If the buffer is located in main memory (HEAP), and if
          // memory can grow, we can't hold on to references of the
          // memory buffer, as they may get invalidated. That means we
          // need to do copy its contents.
          if (buffer.buffer === HEAP8.buffer) {
            canOwn = false;
          }
  
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) {
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = buffer.slice(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
          else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position + length);
          return length;
        },llseek:function(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },allocate:function(stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function(stream, address, length, position, prot, flags) {
          // We don't currently support location hints for the address of the mapping
          assert(address === 0);
  
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if (!(flags & 2) && contents.buffer === buffer) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            HEAP8.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        },msync:function(stream, buffer, offset, length, mmapFlags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          if (mmapFlags & 2) {
            // MAP_PRIVATE calls need not to be synced back to underlying fs
            return 0;
          }
  
          var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        }}};var FS={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,handleFSError:function(e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return setErrNo(e.errno);
      },lookupPath:function(path, opts) {
        path = PATH_FS.resolve(FS.cwd(), path);
        opts = opts || {};
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(32);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
  
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(32);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function(node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function(parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function(parent, name, mode, rdev) {
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function(node) {
        FS.hashRemoveNode(node);
      },isRoot:function(node) {
        return node === node.parent;
      },isMountpoint:function(node) {
        return !!node.mounted;
      },isFile:function(mode) {
        return (mode & 61440) === 32768;
      },isDir:function(mode) {
        return (mode & 61440) === 16384;
      },isLink:function(mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function(mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function(mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function(mode) {
        return (mode & 61440) === 4096;
      },isSocket:function(mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function(str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function(flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function(node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return 2;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return 2;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },mayLookup:function(dir) {
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },mayCreate:function(dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function(dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return 31;
          }
        }
        return 0;
      },mayOpen:function(node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
              (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
            return 31;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function(fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },getStream:function(fd) {
        return FS.streams[fd];
      },createStream:function(stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = /** @constructor */ function(){};
          FS.FSStream.prototype = {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          };
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function(fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function(stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function() {
          throw new FS.ErrnoError(70);
        }},major:function(dev) {
        return ((dev) >> 8);
      },minor:function(dev) {
        return ((dev) & 0xff);
      },makedev:function(ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function(dev) {
        return FS.devices[dev];
      },getMounts:function(mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function(populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          err('warning: ' + FS.syncFSRequests + ' FS.syncfs operations in flight at once, probably just doing extra work');
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(errCode) {
          FS.syncFSRequests--;
          return callback(errCode);
        }
  
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function(type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1);
      },lookup:function(parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function(path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function(path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdirTree:function(path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += '/' + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != 20) throw e;
          }
        }
      },mkdev:function(path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(10);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(28);
        }
        // new path should not be an ancestor of the old path
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(55);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        errCode = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(10);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, 'w');
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          err("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          err("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          err("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          err("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(54);
        }
        return node.node_ops.readdir(node);
      },unlink:function(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          err("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          err("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      },stat:function(path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(63);
        }
        return node.node_ops.getattr(node);
      },lstat:function(path) {
        return FS.stat(path, true);
      },chmod:function(path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function(path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function(fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        FS.chmod(stream.node, mode);
      },chown:function(path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function(path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function(fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function(path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function(fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
      },utime:function(path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function(path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(44);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(20);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512 | 131072);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            err("FS.trackingDelegate error on read file: " + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          err("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function(stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },isClosed:function(stream) {
        return stream.fd === null;
      },llseek:function(stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },read:function(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          err("FS.trackingDelegate['onWriteToFile']('"+stream.path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function(stream, offset, length) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function(stream, address, length, position, prot, flags) {
        // User requests writing to file (prot & PROT_WRITE != 0).
        // Checking if we have permissions to write to the file unless
        // MAP_PRIVATE flag is set. According to POSIX spec it is possible
        // to write to file opened in read-only mode with MAP_PRIVATE flag,
        // as all modifications will be visible only in the memory of
        // the current process.
        if ((prot & 2) !== 0
            && (flags & 2) === 0
            && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        return stream.stream_ops.mmap(stream, address, length, position, prot, flags);
      },msync:function(stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },munmap:function(stream) {
        return 0;
      },ioctl:function(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function(path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function(path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === 'string') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          throw new Error('Unsupported data type');
        }
        FS.close(stream);
      },cwd:function() {
        return FS.currentPath;
      },chdir:function(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function() {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:function() {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function(stream, buffer, offset, length, pos) { return length; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device;
        if (typeof crypto === 'object' && typeof crypto['getRandomValues'] === 'function') {
          // for modern web browsers
          var randomBuffer = new Uint8Array(1);
          random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
        } else
        if (ENVIRONMENT_IS_NODE) {
          // for nodejs with or without crypto support included
          try {
            var crypto_module = require('crypto');
            // nodejs has crypto support
            random_device = function() { return crypto_module['randomBytes'](1)[0]; };
          } catch (e) {
            // nodejs doesn't have crypto support
          }
        } else
        {}
        if (!random_device) {
          // we couldn't find a proper implementation, as Math.random() is not suitable for /dev/random, see emscripten-core/emscripten/pull/7096
          random_device = function() { abort("random_device"); };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createSpecialDirectories:function() {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount: function() {
            var node = FS.createNode('/proc/self', 'fd', 16384 | 511 /* 0777 */, 73);
            node.node_ops = {
              lookup: function(parent, name) {
                var fd = +name;
                var stream = FS.getStream(fd);
                if (!stream) throw new FS.ErrnoError(8);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: function() { return stream.path } }
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },createStandardStreams:function() {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        var stdout = FS.open('/dev/stdout', 'w');
        var stderr = FS.open('/dev/stderr', 'w');
      },ensureErrnoError:function() {
        if (FS.ErrnoError) return;
        FS.ErrnoError = /** @this{Object} */ function ErrnoError(errno, node) {
          this.node = node;
          this.setErrno = /** @this{Object} */ function(errno) {
            this.errno = errno;
          };
          this.setErrno(errno);
          this.message = 'FS error';
  
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [44].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function() {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
        };
      },init:function(input, output, error) {
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function() {
        FS.init.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        var fflush = Module['_fflush'];
        if (fflush) fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function(canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function(parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function(relative, base) {
        return PATH_FS.resolve(base, relative);
      },standardizePath:function(path) {
        return PATH.normalize(path);
      },findObject:function(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          setErrNo(ret.error);
          return null;
        }
      },analyzePath:function(path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function(parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function(parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function(parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function(parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function(parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (read_) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(read_(obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) setErrNo(29);
        return success;
      },createLazyFile:function(parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        /** @constructor */
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = /** @this{Object} */ function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
  
          var chunkSize = 1024*1024; // Chunk size in bytes
  
          if (!hasByteServing) chunkSize = datalength;
  
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(/** @type{Array<number>} */(xhr.response || []));
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = this;
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
  
          if (usesGzip || !datalength) {
            // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
            chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
            datalength = this.getter(0).length;
            chunkSize = datalength;
            out("LazyFiles on gzip forces download of the whole file when length is accessed");
          }
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        };
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperties(lazyArray, {
            length: {
              get: /** @this{Object} */ function() {
                if(!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._length;
              }
            },
            chunkSize: {
              get: /** @this{Object} */ function() {
                if(!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._chunkSize;
              }
            }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: /** @this {FSNode} */ function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(29);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(29);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init(); // XXX perhaps this method should move onto Browser?
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
        function processData(byteArray) {
          function finish(byteArray) {
            if (preFinish) preFinish();
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency(dep);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency(dep);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function() {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function() {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function(paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          out('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function(paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var SYSCALLS={mappings:{},DEFAULT_POLLMASK:5,umask:511,calculateAt:function(dirfd, path) {
        if (path[0] !== '/') {
          // relative path
          var dir;
          if (dirfd === -100) {
            dir = FS.cwd();
          } else {
            var dirstream = FS.getStream(dirfd);
            if (!dirstream) throw new FS.ErrnoError(8);
            dir = dirstream.path;
          }
          path = PATH.join2(dir, path);
        }
        return path;
      },doStat:function(func, path, buf) {
        try {
          var stat = func(path);
        } catch (e) {
          if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
            // an error occurred while trying to look up the path; we should just report ENOTDIR
            return -54;
          }
          throw e;
        }
        HEAP32[((buf)>>2)]=stat.dev;
        HEAP32[(((buf)+(4))>>2)]=0;
        HEAP32[(((buf)+(8))>>2)]=stat.ino;
        HEAP32[(((buf)+(12))>>2)]=stat.mode;
        HEAP32[(((buf)+(16))>>2)]=stat.nlink;
        HEAP32[(((buf)+(20))>>2)]=stat.uid;
        HEAP32[(((buf)+(24))>>2)]=stat.gid;
        HEAP32[(((buf)+(28))>>2)]=stat.rdev;
        HEAP32[(((buf)+(32))>>2)]=0;
        (tempI64 = [stat.size>>>0,(tempDouble=stat.size,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(40))>>2)]=tempI64[0],HEAP32[(((buf)+(44))>>2)]=tempI64[1]);
        HEAP32[(((buf)+(48))>>2)]=4096;
        HEAP32[(((buf)+(52))>>2)]=stat.blocks;
        HEAP32[(((buf)+(56))>>2)]=(stat.atime.getTime() / 1000)|0;
        HEAP32[(((buf)+(60))>>2)]=0;
        HEAP32[(((buf)+(64))>>2)]=(stat.mtime.getTime() / 1000)|0;
        HEAP32[(((buf)+(68))>>2)]=0;
        HEAP32[(((buf)+(72))>>2)]=(stat.ctime.getTime() / 1000)|0;
        HEAP32[(((buf)+(76))>>2)]=0;
        (tempI64 = [stat.ino>>>0,(tempDouble=stat.ino,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(80))>>2)]=tempI64[0],HEAP32[(((buf)+(84))>>2)]=tempI64[1]);
        return 0;
      },doMsync:function(addr, stream, len, flags, offset) {
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      },doMkdir:function(path, mode) {
        // remove a trailing slash, if one - /a/b/ has basename of '', but
        // we want to create b in the context of this function
        path = PATH.normalize(path);
        if (path[path.length-1] === '/') path = path.substr(0, path.length-1);
        FS.mkdir(path, mode, 0);
        return 0;
      },doMknod:function(path, mode, dev) {
        // we don't want this in the JS API as it uses mknod to create all nodes.
        switch (mode & 61440) {
          case 32768:
          case 8192:
          case 24576:
          case 4096:
          case 49152:
            break;
          default: return -28;
        }
        FS.mknod(path, mode, dev);
        return 0;
      },doReadlink:function(path, buf, bufsize) {
        if (bufsize <= 0) return -28;
        var ret = FS.readlink(path);
  
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf+len];
        stringToUTF8(ret, buf, bufsize+1);
        // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
        // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
        HEAP8[buf+len] = endChar;
  
        return len;
      },doAccess:function(path, amode) {
        if (amode & ~7) {
          // need a valid mode
          return -28;
        }
        var node;
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
        if (!node) {
          return -44;
        }
        var perms = '';
        if (amode & 4) perms += 'r';
        if (amode & 2) perms += 'w';
        if (amode & 1) perms += 'x';
        if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
          return -2;
        }
        return 0;
      },doDup:function(path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
      },doReadv:function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.read(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
          if (curr < len) break; // nothing more to read
        }
        return ret;
      },doWritev:function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.write(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
        }
        return ret;
      },varargs:undefined,get:function() {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },getStreamFromFD:function(fd) {
        var stream = FS.getStream(fd);
        if (!stream) throw new FS.ErrnoError(8);
        return stream;
      },get64:function(low, high) {
        return low;
      }};function _fd_close(fd) {try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
  }

  function _fd_read(fd, iov, iovcnt, pnum) {try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = SYSCALLS.doReadv(stream, iov, iovcnt);
      HEAP32[((pnum)>>2)]=num
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
  }

  function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {try {
  
      
      var stream = SYSCALLS.getStreamFromFD(fd);
      var HIGH_OFFSET = 0x100000000; // 2^32
      // use an unsigned operator on low and shift high by 32-bits
      var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
  
      var DOUBLE_LIMIT = 0x20000000000000; // 2^53
      // we also check for equality since DOUBLE_LIMIT + 1 == DOUBLE_LIMIT
      if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
        return -61;
      }
  
      FS.llseek(stream, offset, whence);
      (tempI64 = [stream.position>>>0,(tempDouble=stream.position,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((newOffset)>>2)]=tempI64[0],HEAP32[(((newOffset)+(4))>>2)]=tempI64[1]);
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
  }

  function _fd_write(fd, iov, iovcnt, pnum) {try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = SYSCALLS.doWritev(stream, iov, iovcnt);
      HEAP32[((pnum)>>2)]=num
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return e.errno;
  }
  }

  
  function _round(d) {
      d = +d;
      return d >= +0 ? +Math_floor(d + +0.5) : +Math_ceil(d - +0.5);
    }

  function _setTempRet0($i) {
      setTempRet0(($i) | 0);
    }
var FSNode = /** @constructor */ function(parent, name, mode, rdev) {
    if (!parent) {
      parent = this;  // root node sets parent to itself
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev;
  };
  var readMode = 292/*292*/ | 73/*73*/;
  var writeMode = 146/*146*/;
  Object.defineProperties(FSNode.prototype, {
   read: {
    get: /** @this{FSNode} */function() {
     return (this.mode & readMode) === readMode;
    },
    set: /** @this{FSNode} */function(val) {
     val ? this.mode |= readMode : this.mode &= ~readMode;
    }
   },
   write: {
    get: /** @this{FSNode} */function() {
     return (this.mode & writeMode) === writeMode;
    },
    set: /** @this{FSNode} */function(val) {
     val ? this.mode |= writeMode : this.mode &= ~writeMode;
    }
   },
   isFolder: {
    get: /** @this{FSNode} */function() {
     return FS.isDir(this.mode);
    }
   },
   isDevice: {
    get: /** @this{FSNode} */function() {
     return FS.isChrdev(this.mode);
    }
   }
  });
  FS.FSNode = FSNode;
  FS.staticInit();;
var ASSERTIONS = false;



/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}


// Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

/**
 * Decodes a base64 string.
 * @param {string} input The string to decode.
 */
var decodeBase64 = typeof atob === 'function' ? atob : function (input) {
  var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  var output = '';
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  do {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);
  return output;
};

// Converts a string of base64 into a byte array.
// Throws error on invalid input.
function intArrayFromBase64(s) {
  if (typeof ENVIRONMENT_IS_NODE === 'boolean' && ENVIRONMENT_IS_NODE) {
    var buf;
    try {
      // TODO: Update Node.js externs, Closure does not recognize the following Buffer.from()
      /**@suppress{checkTypes}*/
      buf = Buffer.from(s, 'base64');
    } catch (_) {
      buf = new Buffer(s, 'base64');
    }
    return new Uint8Array(buf['buffer'], buf['byteOffset'], buf['byteLength']);
  }

  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0 ; i < decoded.length ; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error('Converting base64 string to bytes failed.');
  }
}

// If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }

  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}


// ASM_LIBRARY EXTERN PRIMITIVES: Math_floor,Math_ceil

var asmGlobalArg = {};
var asmLibraryArg = { "emscripten_get_sbrk_ptr": _emscripten_get_sbrk_ptr, "emscripten_memcpy_big": _emscripten_memcpy_big, "emscripten_resize_heap": _emscripten_resize_heap, "fd_close": _fd_close, "fd_read": _fd_read, "fd_seek": _fd_seek, "fd_write": _fd_write, "getTempRet0": getTempRet0, "memory": wasmMemory, "round": _round, "setTempRet0": setTempRet0, "table": wasmTable };
var asm = createWasm();
/** @type {function(...*):?} */
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
  return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["__wasm_call_ctors"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_decoder_new = Module["_FLAC__stream_decoder_new"] = function() {
  return (_FLAC__stream_decoder_new = Module["_FLAC__stream_decoder_new"] = Module["asm"]["FLAC__stream_decoder_new"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_decoder_delete = Module["_FLAC__stream_decoder_delete"] = function() {
  return (_FLAC__stream_decoder_delete = Module["_FLAC__stream_decoder_delete"] = Module["asm"]["FLAC__stream_decoder_delete"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_decoder_finish = Module["_FLAC__stream_decoder_finish"] = function() {
  return (_FLAC__stream_decoder_finish = Module["_FLAC__stream_decoder_finish"] = Module["asm"]["FLAC__stream_decoder_finish"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_decoder_init_stream = Module["_FLAC__stream_decoder_init_stream"] = function() {
  return (_FLAC__stream_decoder_init_stream = Module["_FLAC__stream_decoder_init_stream"] = Module["asm"]["FLAC__stream_decoder_init_stream"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_decoder_reset = Module["_FLAC__stream_decoder_reset"] = function() {
  return (_FLAC__stream_decoder_reset = Module["_FLAC__stream_decoder_reset"] = Module["asm"]["FLAC__stream_decoder_reset"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_decoder_init_ogg_stream = Module["_FLAC__stream_decoder_init_ogg_stream"] = function() {
  return (_FLAC__stream_decoder_init_ogg_stream = Module["_FLAC__stream_decoder_init_ogg_stream"] = Module["asm"]["FLAC__stream_decoder_init_ogg_stream"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_decoder_set_ogg_serial_number = Module["_FLAC__stream_decoder_set_ogg_serial_number"] = function() {
  return (_FLAC__stream_decoder_set_ogg_serial_number = Module["_FLAC__stream_decoder_set_ogg_serial_number"] = Module["asm"]["FLAC__stream_decoder_set_ogg_serial_number"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_decoder_set_md5_checking = Module["_FLAC__stream_decoder_set_md5_checking"] = function() {
  return (_FLAC__stream_decoder_set_md5_checking = Module["_FLAC__stream_decoder_set_md5_checking"] = Module["asm"]["FLAC__stream_decoder_set_md5_checking"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_decoder_get_state = Module["_FLAC__stream_decoder_get_state"] = function() {
  return (_FLAC__stream_decoder_get_state = Module["_FLAC__stream_decoder_get_state"] = Module["asm"]["FLAC__stream_decoder_get_state"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_decoder_get_md5_checking = Module["_FLAC__stream_decoder_get_md5_checking"] = function() {
  return (_FLAC__stream_decoder_get_md5_checking = Module["_FLAC__stream_decoder_get_md5_checking"] = Module["asm"]["FLAC__stream_decoder_get_md5_checking"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_decoder_process_single = Module["_FLAC__stream_decoder_process_single"] = function() {
  return (_FLAC__stream_decoder_process_single = Module["_FLAC__stream_decoder_process_single"] = Module["asm"]["FLAC__stream_decoder_process_single"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_decoder_process_until_end_of_metadata = Module["_FLAC__stream_decoder_process_until_end_of_metadata"] = function() {
  return (_FLAC__stream_decoder_process_until_end_of_metadata = Module["_FLAC__stream_decoder_process_until_end_of_metadata"] = Module["asm"]["FLAC__stream_decoder_process_until_end_of_metadata"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_decoder_process_until_end_of_stream = Module["_FLAC__stream_decoder_process_until_end_of_stream"] = function() {
  return (_FLAC__stream_decoder_process_until_end_of_stream = Module["_FLAC__stream_decoder_process_until_end_of_stream"] = Module["asm"]["FLAC__stream_decoder_process_until_end_of_stream"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_new = Module["_FLAC__stream_encoder_new"] = function() {
  return (_FLAC__stream_encoder_new = Module["_FLAC__stream_encoder_new"] = Module["asm"]["FLAC__stream_encoder_new"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_delete = Module["_FLAC__stream_encoder_delete"] = function() {
  return (_FLAC__stream_encoder_delete = Module["_FLAC__stream_encoder_delete"] = Module["asm"]["FLAC__stream_encoder_delete"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_finish = Module["_FLAC__stream_encoder_finish"] = function() {
  return (_FLAC__stream_encoder_finish = Module["_FLAC__stream_encoder_finish"] = Module["asm"]["FLAC__stream_encoder_finish"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_init_stream = Module["_FLAC__stream_encoder_init_stream"] = function() {
  return (_FLAC__stream_encoder_init_stream = Module["_FLAC__stream_encoder_init_stream"] = Module["asm"]["FLAC__stream_encoder_init_stream"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_init_ogg_stream = Module["_FLAC__stream_encoder_init_ogg_stream"] = function() {
  return (_FLAC__stream_encoder_init_ogg_stream = Module["_FLAC__stream_encoder_init_ogg_stream"] = Module["asm"]["FLAC__stream_encoder_init_ogg_stream"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_set_ogg_serial_number = Module["_FLAC__stream_encoder_set_ogg_serial_number"] = function() {
  return (_FLAC__stream_encoder_set_ogg_serial_number = Module["_FLAC__stream_encoder_set_ogg_serial_number"] = Module["asm"]["FLAC__stream_encoder_set_ogg_serial_number"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_set_verify = Module["_FLAC__stream_encoder_set_verify"] = function() {
  return (_FLAC__stream_encoder_set_verify = Module["_FLAC__stream_encoder_set_verify"] = Module["asm"]["FLAC__stream_encoder_set_verify"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_set_channels = Module["_FLAC__stream_encoder_set_channels"] = function() {
  return (_FLAC__stream_encoder_set_channels = Module["_FLAC__stream_encoder_set_channels"] = Module["asm"]["FLAC__stream_encoder_set_channels"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_set_bits_per_sample = Module["_FLAC__stream_encoder_set_bits_per_sample"] = function() {
  return (_FLAC__stream_encoder_set_bits_per_sample = Module["_FLAC__stream_encoder_set_bits_per_sample"] = Module["asm"]["FLAC__stream_encoder_set_bits_per_sample"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_set_sample_rate = Module["_FLAC__stream_encoder_set_sample_rate"] = function() {
  return (_FLAC__stream_encoder_set_sample_rate = Module["_FLAC__stream_encoder_set_sample_rate"] = Module["asm"]["FLAC__stream_encoder_set_sample_rate"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_set_compression_level = Module["_FLAC__stream_encoder_set_compression_level"] = function() {
  return (_FLAC__stream_encoder_set_compression_level = Module["_FLAC__stream_encoder_set_compression_level"] = Module["asm"]["FLAC__stream_encoder_set_compression_level"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_set_blocksize = Module["_FLAC__stream_encoder_set_blocksize"] = function() {
  return (_FLAC__stream_encoder_set_blocksize = Module["_FLAC__stream_encoder_set_blocksize"] = Module["asm"]["FLAC__stream_encoder_set_blocksize"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_set_total_samples_estimate = Module["_FLAC__stream_encoder_set_total_samples_estimate"] = function() {
  return (_FLAC__stream_encoder_set_total_samples_estimate = Module["_FLAC__stream_encoder_set_total_samples_estimate"] = Module["asm"]["FLAC__stream_encoder_set_total_samples_estimate"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_get_state = Module["_FLAC__stream_encoder_get_state"] = function() {
  return (_FLAC__stream_encoder_get_state = Module["_FLAC__stream_encoder_get_state"] = Module["asm"]["FLAC__stream_encoder_get_state"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _FLAC__stream_encoder_process_interleaved = Module["_FLAC__stream_encoder_process_interleaved"] = function() {
  return (_FLAC__stream_encoder_process_interleaved = Module["_FLAC__stream_encoder_process_interleaved"] = Module["asm"]["FLAC__stream_encoder_process_interleaved"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var ___errno_location = Module["___errno_location"] = function() {
  return (___errno_location = Module["___errno_location"] = Module["asm"]["__errno_location"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var stackSave = Module["stackSave"] = function() {
  return (stackSave = Module["stackSave"] = Module["asm"]["stackSave"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var stackRestore = Module["stackRestore"] = function() {
  return (stackRestore = Module["stackRestore"] = Module["asm"]["stackRestore"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var stackAlloc = Module["stackAlloc"] = function() {
  return (stackAlloc = Module["stackAlloc"] = Module["asm"]["stackAlloc"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _malloc = Module["_malloc"] = function() {
  return (_malloc = Module["_malloc"] = Module["asm"]["malloc"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _free = Module["_free"] = function() {
  return (_free = Module["_free"] = Module["asm"]["free"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var __growWasmMemory = Module["__growWasmMemory"] = function() {
  return (__growWasmMemory = Module["__growWasmMemory"] = Module["asm"]["__growWasmMemory"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var dynCall_iii = Module["dynCall_iii"] = function() {
  return (dynCall_iii = Module["dynCall_iii"] = Module["asm"]["dynCall_iii"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var dynCall_ii = Module["dynCall_ii"] = function() {
  return (dynCall_ii = Module["dynCall_ii"] = Module["asm"]["dynCall_ii"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var dynCall_iiii = Module["dynCall_iiii"] = function() {
  return (dynCall_iiii = Module["dynCall_iiii"] = Module["asm"]["dynCall_iiii"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var dynCall_jiji = Module["dynCall_jiji"] = function() {
  return (dynCall_jiji = Module["dynCall_jiji"] = Module["asm"]["dynCall_jiji"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var dynCall_viiiiii = Module["dynCall_viiiiii"] = function() {
  return (dynCall_viiiiii = Module["dynCall_viiiiii"] = Module["asm"]["dynCall_viiiiii"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var dynCall_iiiii = Module["dynCall_iiiii"] = function() {
  return (dynCall_iiiii = Module["dynCall_iiiii"] = Module["asm"]["dynCall_iiiii"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = function() {
  return (dynCall_viiiiiii = Module["dynCall_viiiiiii"] = Module["asm"]["dynCall_viiiiiii"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var dynCall_viiii = Module["dynCall_viiii"] = function() {
  return (dynCall_viiii = Module["dynCall_viiii"] = Module["asm"]["dynCall_viiii"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var dynCall_viii = Module["dynCall_viii"] = function() {
  return (dynCall_viii = Module["dynCall_viii"] = Module["asm"]["dynCall_viii"]).apply(null, arguments);
};





// === Auto-generated postamble setup entry stuff ===




Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
Module["setValue"] = setValue;
Module["getValue"] = getValue;



































































































































var calledRun;

/**
 * @constructor
 * @this {ExitStatus}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}

var calledMain = false;


dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};





/** @type {function(Array=)} */
function run(args) {
  args = args || arguments_;

  if (runDependencies > 0) {
    return;
  }


  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    preMain();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();


    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
}
Module['run'] = run;


/** @param {boolean|number=} implicit */
function exit(status, implicit) {

  // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)
  if (implicit && noExitRuntime && status === 0) {
    return;
  }

  if (noExitRuntime) {
  } else {

    ABORT = true;
    EXITSTATUS = status;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  quit_(status, new ExitStatus(status));
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}


  noExitRuntime = true;

run();






// {{MODULE_ADDITIONS}}



//libflac function wrappers

/**
 * HELPER read/extract stream info meta-data from frame header / meta-data
 * @param {POINTER} p_streaminfo
 * @returns StreamInfo
 */
function _readStreamInfo(p_streaminfo){//-> FLAC__StreamMetadata.type (FLAC__MetadataType) === FLAC__METADATA_TYPE_STREAMINFO (0)

	/*
	typedef struct {
		unsigned min_blocksize, max_blocksize;
		unsigned min_framesize, max_framesize;
		unsigned sample_rate;
		unsigned channels;
		unsigned bits_per_sample;
		FLAC__uint64 total_samples;
		FLAC__byte md5sum[16];
	} FLAC__StreamMetadata_StreamInfo;
	 */

	var min_blocksize = Module.getValue(p_streaminfo,'i32');//4 bytes
	var max_blocksize = Module.getValue(p_streaminfo+4,'i32');//4 bytes

	var min_framesize = Module.getValue(p_streaminfo+8,'i32');//4 bytes
	var max_framesize = Module.getValue(p_streaminfo+12,'i32');//4 bytes

	var sample_rate = Module.getValue(p_streaminfo+16,'i32');//4 bytes
	var channels = Module.getValue(p_streaminfo+20,'i32');//4 bytes

	var bits_per_sample = Module.getValue(p_streaminfo+24,'i32');//4 bytes

	//FIXME should be at p_streaminfo+28, but seems to be at p_streaminfo+32
	var total_samples = Module.getValue(p_streaminfo+32,'i64');//8 bytes

	var md5sum = _readMd5(p_streaminfo+40);//16 bytes

	return {
		min_blocksize: min_blocksize,
		max_blocksize: max_blocksize,
		min_framesize: min_framesize,
		max_framesize: max_framesize,
		sampleRate: sample_rate,
		channels: channels,
		bitsPerSample: bits_per_sample,
		total_samples: total_samples,
		md5sum: md5sum
	};
}

/**
 * read MD5 checksum
 * @param {POINTER} p_md5
 * @returns {String} as HEX string representation
 */
function _readMd5(p_md5){

	var sb = [], v, str;
	for(var i=0, len = 16; i < len; ++i){
		v = Module.getValue(p_md5+i,'i8');//1 byte
		if(v < 0) v = 256 + v;//<- "convert" to uint8, if necessary
		str = v.toString(16);
		if(str.length < 2) str = '0' + str;//<- add padding, if necessary
		sb.push(str);
	}
	return sb.join('');
}

/**
 * HELPER: read frame data
 *
 * @param {POINTER} p_frame
 * @param {CodingOptions} [enc_opt]
 * @returns FrameHeader
 */
function _readFrameHdr(p_frame, enc_opt){

	/*
	typedef struct {
		unsigned blocksize;
		unsigned sample_rate;
		unsigned channels;
		FLAC__ChannelAssignment channel_assignment;
		unsigned bits_per_sample;
		FLAC__FrameNumberType number_type;
		union {
			FLAC__uint32 frame_number;
			FLAC__uint64 sample_number;
		} number;
		FLAC__uint8 crc;
	} FLAC__FrameHeader;
	 */

	var blocksize = Module.getValue(p_frame,'i32');//4 bytes
	var sample_rate = Module.getValue(p_frame+4,'i32');//4 bytes
	var channels = Module.getValue(p_frame+8,'i32');//4 bytes

	// 0: FLAC__CHANNEL_ASSIGNMENT_INDEPENDENT	independent channels
	// 1: FLAC__CHANNEL_ASSIGNMENT_LEFT_SIDE 	left+side stereo
	// 2: FLAC__CHANNEL_ASSIGNMENT_RIGHT_SIDE 	right+side stereo
	// 3: FLAC__CHANNEL_ASSIGNMENT_MID_SIDE 	mid+side stereo
	var channel_assignment = Module.getValue(p_frame+12,'i32');//4 bytes

	var bits_per_sample = Module.getValue(p_frame+16,'i32');

	// 0: FLAC__FRAME_NUMBER_TYPE_FRAME_NUMBER 	number contains the frame number
	// 1: FLAC__FRAME_NUMBER_TYPE_SAMPLE_NUMBER	number contains the sample number of first sample in frame
	var number_type = Module.getValue(p_frame+20,'i32');

	// union {} number: The frame number or sample number of first sample in frame; use the number_type value to determine which to use.
	var frame_number = Module.getValue(p_frame+24,'i32');
	var sample_number = Module.getValue(p_frame+24,'i64');

	var number = number_type === 0? frame_number : sample_number;
	var numberType = number_type === 0? 'frames' : 'samples';

	var crc = Module.getValue(p_frame+36,'i8');

	var subframes;
	if(enc_opt && enc_opt.analyseSubframes){
		var subOffset = {offset: 40};
		subframes = [];
		for(var i=0; i < channels; ++i){
			subframes.push(_readSubFrameHdr(p_frame, subOffset, blocksize, enc_opt));
		}
		//TODO read footer
		// console.log('  footer crc ', Module.getValue(p_frame + subOffset.offset,'i16'));
	}

	return {
		blocksize: blocksize,
		sampleRate: sample_rate,
		channels: channels,
		channelAssignment: channel_assignment,
		bitsPerSample: bits_per_sample,
		number: number,
		numberType: numberType,
		crc: crc,
		subframes: subframes
	};
}


function _readSubFrameHdr(p_subframe, subOffset, block_size, enc_opt){
	/*
	FLAC__SubframeType 	type
	union {
	   FLAC__Subframe_Constant   constant
	   FLAC__Subframe_Fixed   fixed
	   FLAC__Subframe_LPC   lpc
	   FLAC__Subframe_Verbatim   verbatim
	} 	data
	unsigned 	wasted_bits
	*/

	var type = Module.getValue(p_subframe + subOffset.offset, 'i32');
	subOffset.offset += 4;

	var data;
	switch(type){
		case 0:	//FLAC__SUBFRAME_TYPE_CONSTANT
			data = {value: Module.getValue(p_subframe + subOffset.offset, 'i32')};
			subOffset.offset += 284;//4;
			break;
		case 1:	//FLAC__SUBFRAME_TYPE_VERBATIM
			data = Module.getValue(p_subframe + subOffset.offset, 'i32');
			subOffset.offset += 284;//4;
			break;
		case 2:	//FLAC__SUBFRAME_TYPE_FIXED
			data = _readSubFrameHdrFixedData(p_subframe, subOffset, block_size, false, enc_opt);
			break;
		case 3:	//FLAC__SUBFRAME_TYPE_LPC
			data = _readSubFrameHdrFixedData(p_subframe, subOffset, block_size, true, enc_opt);
			break;
	}

	var offset =  subOffset.offset;
	var wasted_bits = Module.getValue(p_subframe + offset, 'i32');
	subOffset.offset += 4;

	return {
		type: type,//['CONSTANT', 'VERBATIM', 'FIXED', 'LPC'][type],
		data: data,
		wastedBits: wasted_bits
	}
}

function _readSubFrameHdrFixedData(p_subframe_data, subOffset, block_size, is_lpc, enc_opt){

	var offset = subOffset.offset;

	var data = {order: -1, contents: {parameters: [], rawBits: []}};
	//FLAC__Subframe_Fixed:
	// FLAC__EntropyCodingMethod 	entropy_coding_method
	// unsigned 	order
	// FLAC__int32 	warmup [FLAC__MAX_FIXED_ORDER]
	// const FLAC__int32 * 	residual

	//FLAC__EntropyCodingMethod:
	// FLAC__EntropyCodingMethodType 	type
	// union {
	//    FLAC__EntropyCodingMethod_PartitionedRice   partitioned_rice
	// } 	data

	//FLAC__ENTROPY_CODING_METHOD_PARTITIONED_RICE	0		Residual is coded by partitioning into contexts, each with it's own 4-bit Rice parameter.
	//FLAC__ENTROPY_CODING_METHOD_PARTITIONED_RICE2 1	Residual is coded by partitioning into contexts, each with it's own 5-bit Rice parameter.
	var entropyType = Module.getValue(p_subframe_data, 'i32');
	offset += 4;

	//FLAC__EntropyCodingMethod_PartitionedRice:
	//	unsigned 	order
	var entropyOrder = Module.getValue(p_subframe_data + offset, 'i32');
	data.order = entropyOrder;
	offset += 4;

	//FLAC__EntropyCodingMethod_PartitionedRice:
	//	FLAC__EntropyCodingMethod_PartitionedRiceContents * 	contents
	var partitions = 1 << entropyOrder, params = data.contents.parameters, raws = data.contents.rawBits;
	//FLAC__EntropyCodingMethod_PartitionedRiceContents
	// unsigned * 	parameters
	// unsigned * 	raw_bits
	// unsigned 	capacity_by_order
	var ppart = Module.getValue(p_subframe_data + offset, 'i32');
	var pparams = Module.getValue(ppart, 'i32');
	var praw = Module.getValue(ppart + 4, 'i32');
	data.contents.capacityByOrder = Module.getValue(ppart + 8, 'i32');
	for(var i=0; i < partitions; ++i){
		params.push(Module.getValue(pparams + (i*4), 'i32'));
		raws.push(Module.getValue(praw + (i*4), 'i32'));
	}
	offset += 4;

	//FLAC__Subframe_Fixed:
	//	unsigned 	order
	var order = Module.getValue(p_subframe_data + offset, 'i32');
	offset += 4;

	var warmup = [], res;

	if(is_lpc){
		//FLAC__Subframe_LPC

		// unsigned 	qlp_coeff_precision
		var qlp_coeff_precision = Module.getValue(p_subframe_data + offset, 'i32');
		offset += 4;
		// int 	quantization_level
		var quantization_level = Module.getValue(p_subframe_data + offset, 'i32');
		offset += 4;

		//FLAC__Subframe_LPC :
		// FLAC__int32 	qlp_coeff [FLAC__MAX_LPC_ORDER]
		var qlp_coeff = [];
		for(var i=0; i < order; ++i){
			qlp_coeff.push(Module.getValue(p_subframe_data + offset, 'i32'));
			offset += 4;
		}
		data.qlp_coeff = qlp_coeff;
		data.qlp_coeff_precision = qlp_coeff_precision;
		data.quantization_level = quantization_level;

		//FLAC__Subframe_LPC:
		// FLAC__int32 	warmup [FLAC__MAX_LPC_ORDER]
		offset = subOffset.offset + 152;
		offset = _readSubFrameHdrWarmup(p_subframe_data, offset, warmup, order);

		//FLAC__Subframe_LPC:
		// const FLAC__int32 * 	residual
		if(enc_opt && enc_opt.analyseResiduals){
			offset = subOffset.offset + 280;
			res = _readSubFrameHdrResidual(p_subframe_data + offset, block_size, order);
		}

	} else {

		//FLAC__Subframe_Fixed:
		// FLAC__int32 	warmup [FLAC__MAX_FIXED_ORDER]
		offset = _readSubFrameHdrWarmup(p_subframe_data, offset, warmup, order);

		//FLAC__Subframe_Fixed:
		// const FLAC__int32 * 	residual
		offset = subOffset.offset + 32;
		if(enc_opt && enc_opt.analyseResiduals){
			res = _readSubFrameHdrResidual(p_subframe_data + offset, block_size, order);
		}
	}

	subOffset.offset += 284;
	return {
		partition: {
			type: entropyType,
			data: data
		},
		order: order,
		warmup: warmup,
		residual: res
	}
}


function _readSubFrameHdrWarmup(p_subframe_data, offset, warmup, order){

	// FLAC__int32 	warmup [FLAC__MAX_FIXED_ORDER | FLAC__MAX_LPC_ORDER]
	for(var i=0; i < order; ++i){
		warmup.push(Module.getValue(p_subframe_data + offset, 'i32'));
		offset += 4;
	}
	return offset;
}


function _readSubFrameHdrResidual(p_subframe_data_res, block_size, order){
	// const FLAC__int32 * 	residual
	var pres = Module.getValue(p_subframe_data_res, 'i32');
	var res = [];//Module.getValue(pres, 'i32');
	//TODO read residual all values(?)
	// -> "The residual signal, length == (blocksize minus order) samples.
	for(var i=0, size = block_size - order; i < size; ++i){
		res.push(Module.getValue(pres + (i*4), 'i32'));
	}
	return res;
}


/**
 * HELPER workaround / fix for returned write-buffer when decoding FLAC
 *
 * @param {number} heapOffset
 * 				the offset for the data on HEAPU8
 * @param {Uint8Array} newBuffer
 * 				the target buffer into which the data should be written -- with the correct (block) size
 * @param {boolean} applyFix
 * 				whether or not to apply the data repair heuristics
 * 				(handling duplicated/triplicated values in raw data)
 */
function __fix_write_buffer(heapOffset, newBuffer, applyFix){

	var dv = new DataView(newBuffer.buffer);
	var targetSize = newBuffer.length;

	var increase = !applyFix? 1 : 2;//<- for FIX/workaround, NOTE: e.g. if 24-bit padding occurres, there is no fix/increase needed (more details comment below)
	var buffer = HEAPU8.subarray(heapOffset, heapOffset + targetSize * increase);

	// FIXME for some reason, the bytes values 0 (min) and 255 (max) get "triplicated",
	//		or inserted "doubled" which should be ignored, i.e.
	//		x x x	-> x
	//		x x		-> <ignored>
	//		where x is 0 or 255
	// -> HACK for now: remove/"over-read" 2 of the values, for each of these triplets/doublications
	var jump, isPrint;
	for(var i=0, j=0, size = buffer.length; i < size && j < targetSize; ++i, ++j){

		if(i === size-1 && j < targetSize - 1){
			//increase heap-view, in order to read more (valid) data into the target buffer
			buffer = HEAPU8.subarray(heapOffset, size + targetSize);
			size = buffer.length;
		}

		// NOTE if e.g. 24-bit padding occurres, there does not seem to be no duplication/triplication of 255 or 0, so must not try to fix!
		if(applyFix && (buffer[i] === 0 || buffer[i] === 255)){

			jump = 0;
			isPrint = true;

			if(i + 1 < size && buffer[i] === buffer[i+1]){

				++jump;

				if(i + 2 < size){
					if(buffer[i] === buffer[i+2]){
						++jump;
					} else {
						//if only 2 occurrences: ignore value
						isPrint = false;
					}
				}
			}//else: if single value: do print (an do not jump)


			if(isPrint){
				dv.setUint8(j, buffer[i]);
				if(jump === 2 && i + 3 < size && buffer[i] === buffer[i+3]){
					//special case for reducing triples in case the following value is also the same
					// (ie. something like: x x x |+ x)
					// -> then: do write the value one more time, and jump one further ahead
					// i.e. if value occurs 4 times in a row, write 2 values
					++jump;
					dv.setUint8(++j, buffer[i]);
				}
			} else {
				--j;
			}

			i += jump;//<- apply jump, if there were value duplications

		} else {
			dv.setUint8(j, buffer[i]);
		}

	}
}


// FLAC__STREAM_DECODER_READ_STATUS_CONTINUE     	The read was OK and decoding can continue.
// FLAC__STREAM_DECODER_READ_STATUS_END_OF_STREAM   The read was attempted while at the end of the stream. Note that the client must only return this value when the read callback was called when already at the end of the stream. Otherwise, if the read itself moves to the end of the stream, the client should still return the data and FLAC__STREAM_DECODER_READ_STATUS_CONTINUE, and then on the next read callback it should return FLAC__STREAM_DECODER_READ_STATUS_END_OF_STREAM with a byte count of 0.
// FLAC__STREAM_DECODER_READ_STATUS_ABORT       	An unrecoverable error occurred. The decoder will return from the process call.
var FLAC__STREAM_DECODER_READ_STATUS_CONTINUE = 0;
var FLAC__STREAM_DECODER_READ_STATUS_END_OF_STREAM = 1;
var FLAC__STREAM_DECODER_READ_STATUS_ABORT = 2;

// FLAC__STREAM_DECODER_WRITE_STATUS_CONTINUE   The write was OK and decoding can continue.
// FLAC__STREAM_DECODER_WRITE_STATUS_ABORT     	An unrecoverable error occurred. The decoder will return from the process call.
var FLAC__STREAM_DECODER_WRITE_STATUS_CONTINUE = 0;
var FLAC__STREAM_DECODER_WRITE_STATUS_ABORT = 1;

/**
 * @interface FLAC__StreamDecoderInitStatus
 * @memberOf Flac
 *
 * @property {"FLAC__STREAM_DECODER_INIT_STATUS_OK"}						0 	Initialization was successful.
 * @property {"FLAC__STREAM_DECODER_INIT_STATUS_UNSUPPORTED_CONTAINER"}		1 	The library was not compiled with support for the given container format.
 * @property {"FLAC__STREAM_DECODER_INIT_STATUS_INVALID_CALLBACKS"}			2 	A required callback was not supplied.
 * @property {"FLAC__STREAM_DECODER_INIT_STATUS_MEMORY_ALLOCATION_ERROR"}	3 	An error occurred allocating memory.
 * @property {"FLAC__STREAM_DECODER_INIT_STATUS_ERROR_OPENING_FILE"}		4 	fopen() failed in FLAC__stream_decoder_init_file() or FLAC__stream_decoder_init_ogg_file().
 * @property {"FLAC__STREAM_DECODER_INIT_STATUS_ALREADY_INITIALIZED"}		5 	FLAC__stream_decoder_init_*() was called when the decoder was already initialized, usually because FLAC__stream_decoder_finish() was not called.
 */
var FLAC__STREAM_DECODER_INIT_STATUS_OK	= 0;
var FLAC__STREAM_DECODER_INIT_STATUS_UNSUPPORTED_CONTAINER	= 1;
var FLAC__STREAM_DECODER_INIT_STATUS_INVALID_CALLBACKS	= 2;
var FLAC__STREAM_DECODER_INIT_STATUS_MEMORY_ALLOCATION_ERROR = 3;
var FLAC__STREAM_DECODER_INIT_STATUS_ERROR_OPENING_FILE = 4;
var FLAC__STREAM_DECODER_INIT_STATUS_ALREADY_INITIALIZED = 5;

/**
 * @interface FLAC__StreamEncoderInitStatus
 * @memberOf Flac
 *
 * @property {"FLAC__STREAM_ENCODER_INIT_STATUS_OK"}									0 	Initialization was successful.
 * @property {"FLAC__STREAM_ENCODER_INIT_STATUS_ENCODER_ERROR"}							1 	General failure to set up encoder; call FLAC__stream_encoder_get_state() for cause.
 * @property {"FLAC__STREAM_ENCODER_INIT_STATUS_UNSUPPORTED_CONTAINER"}					2 	The library was not compiled with support for the given container format.
 * @property {"FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_CALLBACKS"}						3 	A required callback was not supplied.
 * @property {"FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_NUMBER_OF_CHANNELS"}			4 	The encoder has an invalid setting for number of channels.
 * @property {"FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_BITS_PER_SAMPLE"}				5 	The encoder has an invalid setting for bits-per-sample. FLAC supports 4-32 bps but the reference encoder currently supports only up to 24 bps.
 * @property {"FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_SAMPLE_RATE"}					6 	The encoder has an invalid setting for the input sample rate.
 * @property {"FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_BLOCK_SIZE"}					7 	The encoder has an invalid setting for the block size.
 * @property {"FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_MAX_LPC_ORDER"}					8 	The encoder has an invalid setting for the maximum LPC order.
 * @property {"FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_QLP_COEFF_PRECISION"}			9 	The encoder has an invalid setting for the precision of the quantized linear predictor coefficients.
 * @property {"FLAC__STREAM_ENCODER_INIT_STATUS_BLOCK_SIZE_TOO_SMALL_FOR_LPC_ORDER"}	10 	The specified block size is less than the maximum LPC order.
 * @property {"FLAC__STREAM_ENCODER_INIT_STATUS_NOT_STREAMABLE"}						11 	The encoder is bound to the Subset but other settings violate it.
 * @property {"FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_METADATA"}						12 	The metadata input to the encoder is invalid, in one of the following ways:
 *																						      FLAC__stream_encoder_set_metadata() was called with a null pointer but a block count > 0
 *																						      One of the metadata blocks contains an undefined type
 *																						      It contains an illegal CUESHEET as checked by FLAC__format_cuesheet_is_legal()
 *																						      It contains an illegal SEEKTABLE as checked by FLAC__format_seektable_is_legal()
 *																						      It contains more than one SEEKTABLE block or more than one VORBIS_COMMENT block
 * @property {"FLAC__STREAM_ENCODER_INIT_STATUS_ALREADY_INITIALIZED"}					13 	FLAC__stream_encoder_init_*() was called when the encoder was already initialized, usually because FLAC__stream_encoder_finish() was not called.
 */
var FLAC__STREAM_ENCODER_INIT_STATUS_OK = 0;
var FLAC__STREAM_ENCODER_INIT_STATUS_ENCODER_ERROR = 1;
var FLAC__STREAM_ENCODER_INIT_STATUS_UNSUPPORTED_CONTAINER = 2;
var FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_CALLBACKS = 3;
var FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_NUMBER_OF_CHANNELS = 4;
var FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_BITS_PER_SAMPLE = 5;
var FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_SAMPLE_RATE = 6;
var FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_BLOCK_SIZE = 7;
var FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_MAX_LPC_ORDER = 8;
var FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_QLP_COEFF_PRECISION = 9;
var FLAC__STREAM_ENCODER_INIT_STATUS_BLOCK_SIZE_TOO_SMALL_FOR_LPC_ORDER = 10;
var FLAC__STREAM_ENCODER_INIT_STATUS_NOT_STREAMABLE = 11;
var FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_METADATA = 12;
var FLAC__STREAM_ENCODER_INIT_STATUS_ALREADY_INITIALIZED = 13;

//FLAC__STREAM_ENCODER_WRITE_STATUS_OK 				The write was OK and encoding can continue.
//FLAC__STREAM_ENCODER_WRITE_STATUS_FATAL_ERROR		An unrecoverable error occurred. The encoder will return from the process call
var FLAC__STREAM_ENCODER_WRITE_STATUS_OK = 0;
var FLAC__STREAM_ENCODER_WRITE_STATUS_FATAL_ERROR = 1;


/**
 * Map for encoder/decoder callback functions
 *
 * <pre>[ID] -> {function_type: FUNCTION}</pre>
 *
 * type: {[id: number]: {[callback_type: string]: function}}
 * @private
 */
var coders = {};

/**
 * Get a registered callback for the encoder / decoder instance
 *
 * @param {Number} p_coder
 * 			the encoder/decoder pointer (ID)
 * @param {String} func_type
 * 			the callback type, one of
 * 				"write" | "read" | "error" | "metadata"
 * @returns {Function} the callback (or VOID if there is no callback registered)
 * @private
 */
function getCallback(p_coder, func_type){
	if(coders[p_coder]){
		return coders[p_coder][func_type];
	}
}

/**
 * Register a callback for an encoder / decoder instance (will / should be deleted, when finish()/delete())
 *
 * @param {Number} p_coder
 * 			the encoder/decoder pointer (ID)
 * @param {String} func_type
 * 			the callback type, one of
 * 				"write" | "read" | "error" | "metadata"
 * @param {Function} callback
 * 			the callback function
 * @private
 */
function setCallback(p_coder, func_type, callback){
	if(!coders[p_coder]){
		coders[p_coder] = {};
	}
	coders[p_coder][func_type] = callback;
}

/**
 * Get coding options for the encoder / decoder instance:
 * returns FALSY when not set.
 *
 * @param {Number} p_coder
 * 			the encoder/decoder pointer (ID)
 * @returns {CodingOptions} the coding options
 * @private
 * @memberOf Flac
 */
function _getOptions(p_coder){
	if(coders[p_coder]){
		return coders[p_coder]["options"];
	}
}

/**
 * Set coding options for an encoder / decoder instance (will / should be deleted, when finish()/delete())
 *
 * @param {Number} p_coder
 * 			the encoder/decoder pointer (ID)
 * @param {CodingOptions} options
 * 			the coding options
 * @private
 * @memberOf Flac
 */
function _setOptions(p_coder, options){
	if(!coders[p_coder]){
		coders[p_coder] = {};
	}
	coders[p_coder]["options"] = options;
}

//(const FLAC__StreamEncoder *encoder, const FLAC__byte buffer[], size_t bytes, unsigned samples, unsigned current_frame, void *client_data)
// -> FLAC__StreamEncoderWriteStatus
var enc_write_fn_ptr = addFunction(function(p_encoder, buffer, bytes, samples, current_frame, p_client_data){
	var retdata = new Uint8Array(bytes);
	retdata.set(HEAPU8.subarray(buffer, buffer + bytes));
	var write_callback_fn = getCallback(p_encoder, 'write');
	try{
		write_callback_fn(retdata, bytes, samples, current_frame, p_client_data);
	} catch(err) {
		console.error(err);
		return FLAC__STREAM_ENCODER_WRITE_STATUS_FATAL_ERROR;
	}
	return FLAC__STREAM_ENCODER_WRITE_STATUS_OK;
}, 'iiiiiii');

//(const FLAC__StreamDecoder *decoder, FLAC__byte buffer[], size_t *bytes, void *client_data)
// -> FLAC__StreamDecoderReadStatus
var dec_read_fn_ptr = addFunction(function(p_decoder, buffer, bytes, p_client_data){
	//FLAC__StreamDecoderReadCallback, see https://xiph.org/flac/api/group__flac__stream__decoder.html#ga7a5f593b9bc2d163884348b48c4285fd

	var len = Module.getValue(bytes, 'i32');

	if(len === 0){
		return FLAC__STREAM_DECODER_READ_STATUS_ABORT;
	}

	var read_callback_fn = getCallback(p_decoder, 'read');

	//callback must return object with: {buffer: TypedArray, readDataLength: number, error: boolean}
	var readResult = read_callback_fn(len, p_client_data);
	//in case of END_OF_STREAM or an error, readResult.readDataLength must be returned with 0

	var readLen = readResult.readDataLength;
	Module.setValue(bytes, readLen, 'i32');

	if(readResult.error){
		return FLAC__STREAM_DECODER_READ_STATUS_ABORT;
	}

	if(readLen === 0){
		return FLAC__STREAM_DECODER_READ_STATUS_END_OF_STREAM;
	}

	var readBuf = readResult.buffer;

	var dataHeap = new Uint8Array(Module.HEAPU8.buffer, buffer, readLen);
	dataHeap.set(new Uint8Array(readBuf));

	return FLAC__STREAM_DECODER_READ_STATUS_CONTINUE;
}, 'iiiii');

//(const FLAC__StreamDecoder *decoder, const FLAC__Frame *frame, const FLAC__int32 *const buffer[], void *client_data)
// -> FLAC__StreamDecoderWriteStatus
var dec_write_fn_ptr = addFunction(function(p_decoder, p_frame, p_buffer, p_client_data){

	// var dec = Module.getValue(p_decoder,'i32');
	// var clientData = Module.getValue(p_client_data,'i32');

	var dec_opts = _getOptions(p_decoder);
	var frameInfo = _readFrameHdr(p_frame, dec_opts);

//	console.log(frameInfo);//DEBUG

	var channels = frameInfo.channels;
	var block_size = frameInfo.blocksize * (frameInfo.bitsPerSample / 8);

	//whether or not to apply data fixing heuristics (e.g. not needed for 24-bit samples)
	var isFix = frameInfo.bitsPerSample !== 24;

	//take padding bits into account for calculating buffer size
	// -> seems to be done for uneven byte sizes, i.e. 1 (8 bits) and 3 (24 bits)
	var padding = (frameInfo.bitsPerSample / 8)%2;
	if(padding > 0){
		block_size += frameInfo.blocksize * padding;
	}

	var data = [];//<- array for the data of each channel
	var bufferOffset, _buffer;

	for(var i=0; i < channels; ++i){

		bufferOffset = Module.getValue(p_buffer + (i*4),'i32');

		_buffer = new Uint8Array(block_size);
		//FIXME HACK for "strange" data (see helper function __fix_write_buffer)
		__fix_write_buffer(bufferOffset, _buffer, isFix);

		data.push(_buffer.subarray(0, block_size));
	}

	var write_callback_fn = getCallback(p_decoder, 'write');
	var res = write_callback_fn(data, frameInfo);//, clientData);

	// FLAC__STREAM_DECODER_WRITE_STATUS_CONTINUE	The write was OK and decoding can continue.
	// FLAC__STREAM_DECODER_WRITE_STATUS_ABORT     	An unrecoverable error occurred. The decoder will return from the process call.

	return res !== false? FLAC__STREAM_DECODER_WRITE_STATUS_CONTINUE : FLAC__STREAM_DECODER_WRITE_STATUS_ABORT;
}, 'iiiii');

/**
 * Decoding error codes.
 *
 * <br>
 * If the error code is not known, value <code>FLAC__STREAM_DECODER_ERROR__UNKNOWN__</code> is used.
 *
 * @property {"FLAC__STREAM_DECODER_ERROR_STATUS_LOST_SYNC"}			0   An error in the stream caused the decoder to lose synchronization.
 * @property {"FLAC__STREAM_DECODER_ERROR_STATUS_BAD_HEADER"}  			1   The decoder encountered a corrupted frame header.
 * @property {"FLAC__STREAM_DECODER_ERROR_STATUS_FRAME_CRC_MISMATCH"}	2   The frame's data did not match the CRC in the footer.
 * @property {"FLAC__STREAM_DECODER_ERROR_STATUS_UNPARSEABLE_STREAM"}	3   The decoder encountered reserved fields in use in the stream.
 *
 *
 * @interface FLAC__StreamDecoderErrorStatus
 * @memberOf Flac
 */
var DecoderErrorCode = {
	0: 'FLAC__STREAM_DECODER_ERROR_STATUS_LOST_SYNC',
	1: 'FLAC__STREAM_DECODER_ERROR_STATUS_BAD_HEADER',
	2: 'FLAC__STREAM_DECODER_ERROR_STATUS_FRAME_CRC_MISMATCH',
	3: 'FLAC__STREAM_DECODER_ERROR_STATUS_UNPARSEABLE_STREAM'
}

//(const FLAC__StreamDecoder *decoder, FLAC__StreamDecoderErrorStatus status, void *client_data)
// -> void
var dec_error_fn_ptr = addFunction(function(p_decoder, err, p_client_data){

	//err:
	var msg = DecoderErrorCode[err] || 'FLAC__STREAM_DECODER_ERROR__UNKNOWN__';//<- this should never happen;

	var error_callback_fn = getCallback(p_decoder, 'error');
	error_callback_fn(err, msg, p_client_data);
}, 'viii');

//(const FLAC__StreamDecoder *decoder, const FLAC__StreamMetadata *metadata, void *client_data) -> void
//(const FLAC__StreamEncoder *encoder, const FLAC__StreamMetadata *metadata, void *client_data) -> void
var metadata_fn_ptr = addFunction(function(p_coder, p_metadata, p_client_data){
	/*
	 typedef struct {
		FLAC__MetadataType type;
		FLAC__bool is_last;
		unsigned length;
		union {
			FLAC__StreamMetadata_StreamInfo stream_info;
			FLAC__StreamMetadata_Padding padding;
			FLAC__StreamMetadata_Application application;
			FLAC__StreamMetadata_SeekTable seek_table;
			FLAC__StreamMetadata_VorbisComment vorbis_comment;
			FLAC__StreamMetadata_CueSheet cue_sheet;
			FLAC__StreamMetadata_Picture picture;
			FLAC__StreamMetadata_Unknown unknown;
		} data;
	} FLAC__StreamMetadata;
	 */

	/*
	FLAC__METADATA_TYPE_STREAMINFO 		STREAMINFO block
	FLAC__METADATA_TYPE_PADDING 		PADDING block
	FLAC__METADATA_TYPE_APPLICATION 	APPLICATION block
	FLAC__METADATA_TYPE_SEEKTABLE 		SEEKTABLE block
	FLAC__METADATA_TYPE_VORBIS_COMMENT 	VORBISCOMMENT block (a.k.a. FLAC tags)
	FLAC__METADATA_TYPE_CUESHEET 		CUESHEET block
	FLAC__METADATA_TYPE_PICTURE 		PICTURE block
	FLAC__METADATA_TYPE_UNDEFINED 		marker to denote beginning of undefined type range; this number will increase as new metadata types are added
	FLAC__MAX_METADATA_TYPE 			No type will ever be greater than this. There is not enough room in the protocol block.
	 */

	var type = Module.getValue(p_metadata,'i32');//4 bytes
	var is_last = Module.getValue(p_metadata+4,'i32');//4 bytes
	var length = Module.getValue(p_metadata+8,'i64');//8 bytes

	var metadata_callback_fn = getCallback(p_coder, 'metadata');
	var meta_data;
	if(type === 0){// === FLAC__METADATA_TYPE_STREAMINFO
		meta_data = _readStreamInfo(p_metadata+16);

		metadata_callback_fn(meta_data);
	}
	//TODO handle other meta data too

}, 'viii');


////////////// helper fields and functions for event handling
// see exported on()/off() functions
var listeners = {};
var persistedEvents = [];
var add_event_listener = function (eventName, listener){
	var list = listeners[eventName];
	if(!list){
		list = [listener];
		listeners[eventName] = list;
	} else {
		list.push(listener);
	}
	check_and_trigger_persisted_event(eventName, listener);
};
var check_and_trigger_persisted_event = function(eventName, listener){
	var activated;
	for(var i=persistedEvents.length-1; i >= 0; --i){
		activated = persistedEvents[i];
		if(activated && activated.event === eventName){
			listener.apply(null, activated.args);
			break;
		}
	}
};
var remove_event_listener = function (eventName, listener){
	var list = listeners[eventName];
	if(list){
		for(var i=list.length-1; i >= 0; --i){
			if(list[i] === listener){
				list.splice(i, 1);
			}
		}
	}
};
/**
 * HELPER: fire an event
 * @param  {string} eventName
 * 										the event name
 * @param  {any[]} [args] OPITIONAL
 * 										the arguments when triggering the listeners
 * @param  {boolean} [isPersist] OPTIONAL (positinal argument!)
 * 										if TRUE, handlers for this event that will be registered after this will get triggered immediately
 * 										(i.e. event is "persistent": once triggered it stays "active")
 *
 */
var do_fire_event = function (eventName, args, isPersist){
	if(_exported['on'+eventName]){
		_exported['on'+eventName].apply(null, args);
	}
	var list = listeners[eventName];
	if(list){
		for(var i=0, size=list.length; i < size; ++i){
			list[i].apply(null, args)
		}
	}
	if(isPersist){
		persistedEvents.push({event: eventName, args: args});
	}
}

/////////////////////////////////////    export / public: /////////////////////////////////////////////
/**
 * The <code>Flac</code> module that provides functionality
 * for encoding WAV/PCM audio to Flac and decoding Flac to PCM.
 *
 * <br/><br/>
 * <p>
 * NOTE most functions are named analogous to the original C library functions,
 *      so that its documentation may be used for further reading.
 * </p>
 *
 * @see https://xiph.org/flac/api/group__flac__stream__encoder.html
 * @see https://xiph.org/flac/api/group__flac__stream__decoder.html
 *
 * @class Flac
 * @namespace Flac
 */
var _exported = {
	_module: Module,//internal: reference to Flac module
	_clear_enc_cb: function(enc_ptr){//internal function: remove reference to encoder instance and its callbacks
		delete coders[enc_ptr];
	},
	_clear_dec_cb: function(dec_ptr){//internal function: remove reference to decoder instance and its callbacks
		delete coders[dec_ptr];
	},
	/**
	 * Additional options for encoding or decoding
	 * @interface CodingOptions
	 * @memberOf Flac
	 * @property {boolean}  [analyseSubframes] for decoding: include subframes metadata in write-callback metadata, DEFAULT: false
	 * @property {boolean}  [analyseResiduals] for decoding: include residual data in subframes metadata in write-callback metadata, NOTE {@link #analyseSubframes} muste also be enabled, DEFAULT: false
	 *
	 * @see Flac#setOptions
	 */
	/**
	 * @function
	 * @public
	 * @memberOf Flac#
	 * @copydoc Flac._setOptions
	 */
	setOptions: _setOptions,
	/**
	 * @function
	 * @public
	 * @memberOf Flac#
	 * @copydoc Flac._getOptions
	 */
	getOptions: _getOptions,
	/**
	 * Returns if Flac has been initialized / is ready to be used.
	 *
	 * @returns {boolean} <code>true</code>, if Flac is ready to be used
	 *
	 * @memberOf Flac#
	 * @function
	 * @see #onready
	 * @see #on
	 */
	isReady: function() { return _flac_ready; },
	/**
	 * Hook for handler function that gets called, when asynchronous initialization has finished.
	 *
	 * NOTE that if the execution environment does not support <code>Object#defineProperty</code>, then
	 *      this function is not called, after {@link #isReady} is <code>true</code>.
	 *      In this case, {@link #isReady} should be checked, before setting <code>onready</code>
	 *      and if it is <code>true</code>, handler should be executed immediately instead of setting <code>onready</code>.
	 *
	 * @memberOf Flac#
	 * @function
	 * @param {Flac.event:ReadyEvent} event the ready-event object
	 * @see #isReady
	 * @see #on
	 * @default undefined
	 * @example
	 *  // [1] if Object.defineProperty() IS supported:
	 *  Flac.onready = function(event){
	 *     //gets executed when library becomes ready, or immediately, if it already is ready...
	 *	   doSomethingWithFlac();
	 *  };
	 *
	 *  // [2] if Object.defineProperty() is NOT supported:
	 *	// do check Flac.isReady(), and only set handler, if not ready yet
	 *  // (otherwise immediately excute handler code)
	 *  if(!Flac.isReady()){
	 *    Flac.onready = function(event){
	 *       //gets executed when library becomes ready...
	 *		 doSomethingWithFlac();
	 *    };
	 *  } else {
	 * 		// Flac is already ready: immediately start processing
	 *		doSomethingWithFlac();
	 *	}
	 */
	onready: void(0),
	/**
	 * Ready event: is fired when the library has been initialized and is ready to be used
	 * (e.g. asynchronous loading of binary / WASM modules has been completed).
	 *
	 * Before this event is fired, use of functions related to encoding and decoding may
	 * cause errors.
	 *
	 * @event ReadyEvent
	 * @memberOf Flac
	 * @type {object}
	 * @property {"ready"} type 	the type of the event <code>"ready"</code>
	 * @property {Flac} target 	the initalized FLAC library instance
	 *
	 * @see #isReady
	 * @see #on
	 */
	/**
	 * Created event: is fired when an encoder or decoder was created.
	 *
	 * @event CreatedEvent
	 * @memberOf Flac
	 * @type {object}
	 * @property {"created"} type 	the type of the event <code>"created"</code>
	 * @property {Flac.CoderChangedEventData} target 	the information for the created encoder or decoder
	 *
	 * @see #on
	 */
	/**
	 * Destroyed event: is fired when an encoder or decoder was destroyed.
	 *
	 * @event DestroyedEvent
	 * @memberOf Flac
	 * @type {object}
	 * @property {"destroyed"} type 	the type of the event <code>"destroyed"</code>
	 * @property {Flac.CoderChangedEventData} target 	the information for the destroyed encoder or decoder
	 *
	 * @see #on
	 */
	/**
	 * Life cycle event data for signaling life cycle changes of encoder or decoder instances
	 * @interface CoderChangedEventData
	 * @memberOf Flac
	 * @property {number}  id  the ID for the encoder or decoder instance
	 * @property {"encoder" | "decoder"}  type  signifies whether the event is for an encoder or decoder instance
	 * @property {any}  [data]  specific data for the life cycle change
	 *
	 * @see Flac.event:CreatedEvent
	 * @see Flac.event:DestroyedEvent
	 */
	/**
	 * Add an event listener for module-events.
	 * Supported events:
	 * <ul>
	 *  <li> <code>"ready"</code> &rarr; {@link Flac.event:ReadyEvent}: emitted when module is ready for usage (i.e. {@link #isReady} is true)<br/>
	 *             <em>NOTE listener will get immediately triggered if module is already <code>"ready"</code></em>
	 *  </li>
	 *  <li> <code>"created"</code> &rarr; {@link Flac.event:CreatedEvent}: emitted when an encoder or decoder instance was created<br/>
	 *  </li>
	 *  <li> <code>"destroyed"</code> &rarr; {@link Flac.event:DestroyedEvent}: emitted when an encoder or decoder instance was destroyed<br/>
	 *  </li>
	 * </ul>
	 *
	 * @param {string} eventName
	 * @param {Function} listener
	 *
	 * @memberOf Flac#
	 * @function
	 * @see #off
	 * @see #onready
	 * @see Flac.event:ReadyEvent
	 * @see Flac.event:CreatedEvent
	 * @see Flac.event:DestroyedEvent
	 * @example
	 *  Flac.on('ready', function(event){
	 *     //gets executed when library is ready, or becomes ready...
	 *  });
	 */
	on: add_event_listener,
	/**
	 * Remove an event listener for module-events.
	 * @param {string} eventName
	 * @param {Function} listener
	 *
	 * @memberOf Flac#
	 * @function
	 * @see #on
	 */
	off: remove_event_listener,

	/**
	 * Set the "verify" flag. If true, the encoder will verify it's own encoded output by feeding it through an internal decoder and comparing the original signal against the decoded signal. If a mismatch occurs, the process call will return false. Note that this will slow the encoding process by the extra time required for decoding and comparison.
	 *
	 * <p>
	 * NOTE: only use on un-initilized encoder instances!
	 *
	 * @param {number} encoder
	 * 				the ID of the encoder instance
	 *
	 * @param {boolean} is_verify enable/disable checksum verification during encoding
	 *
	 * @returns {boolean} <code>false</code> if the encoder is already initialized, else <code>true</code>
	 *
	 * @see #create_libflac_encoder
	 *
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_encoder_set_verify: Module.cwrap('FLAC__stream_encoder_set_verify', 'number', [ 'number', 'number' ]),
	/**
	 * Set the compression level
	 *
	 * The compression level is roughly proportional to the amount of effort the encoder expends to compress the file. A higher level usually means more computation but higher compression. The default level is suitable for most applications.
	 *
	 * Currently the levels range from 0 (fastest, least compression) to 8 (slowest, most compression). A value larger than 8 will be treated as 8.
	 *
	 *
	 * <p>
	 * NOTE: only use on un-initilized encoder instances!
	 *
	 * @param {number} encoder
	 * 				the ID of the encoder instance
	 *
	 * @param {number} compression_level the desired Flac compression level: [0, 8]
	 *
	 * @returns {boolean} <code>false</code> if the encoder is already initialized, else <code>true</code>
	 *
	 * @see #create_libflac_encoder
	 * @see <a href="https://xiph.org/flac/api/group__flac__stream__encoder.html#gae49cf32f5256cb47eecd33779493ac85">FLAC API for FLAC__stream_encoder_set_compression_level()</a>
	 *
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_encoder_set_compression_level: Module.cwrap('FLAC__stream_encoder_set_compression_level', 'number', [ 'number', 'number' ]),
	/**
	 * Set the blocksize to use while encoding.
	 * The number of samples to use per frame. Use 0 to let the encoder estimate a blocksize; this is usually best.
	 *
	 * <p>
	 * NOTE: only use on un-initilized encoder instances!
	 *
	 * @param {number} encoder
	 * 				the ID of the encoder instance
	 *
	 * @param {number} block_size  the number of samples to use per frame
	 *
	 * @returns {boolean} <code>false</code> if the encoder is already initialized, else <code>true</code>
	 *
	 * @see #create_libflac_encoder
	 *
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_encoder_set_blocksize: Module.cwrap('FLAC__stream_encoder_set_blocksize', 'number', [ 'number', 'number']),
/*

TODO export other encoder API functions?:

FLAC__StreamEncoder * 	FLAC__stream_encoder_new (void)

FLAC__bool 	FLAC__stream_encoder_set_channels (FLAC__StreamEncoder *encoder, unsigned value)

FLAC__bool 	FLAC__stream_encoder_set_bits_per_sample (FLAC__StreamEncoder *encoder, unsigned value)

FLAC__bool 	FLAC__stream_encoder_set_sample_rate (FLAC__StreamEncoder *encoder, unsigned value)

FLAC__bool 	FLAC__stream_encoder_set_do_mid_side_stereo (FLAC__StreamEncoder *encoder, FLAC__bool value)

FLAC__bool 	FLAC__stream_encoder_set_loose_mid_side_stereo (FLAC__StreamEncoder *encoder, FLAC__bool value)

FLAC__bool 	FLAC__stream_encoder_set_apodization (FLAC__StreamEncoder *encoder, const char *specification)

FLAC__bool 	FLAC__stream_encoder_set_max_lpc_order (FLAC__StreamEncoder *encoder, unsigned value)

FLAC__bool 	FLAC__stream_encoder_set_qlp_coeff_precision (FLAC__StreamEncoder *encoder, unsigned value)

FLAC__bool 	FLAC__stream_encoder_set_do_qlp_coeff_prec_search (FLAC__StreamEncoder *encoder, FLAC__bool value)

FLAC__bool 	FLAC__stream_encoder_set_do_escape_coding (FLAC__StreamEncoder *encoder, FLAC__bool value)

FLAC__bool 	FLAC__stream_encoder_set_do_exhaustive_model_search (FLAC__StreamEncoder *encoder, FLAC__bool value)

FLAC__bool 	FLAC__stream_encoder_set_min_residual_partition_order (FLAC__StreamEncoder *encoder, unsigned value)

FLAC__bool 	FLAC__stream_encoder_set_max_residual_partition_order (FLAC__StreamEncoder *encoder, unsigned value)

FLAC__bool 	FLAC__stream_encoder_set_rice_parameter_search_dist (FLAC__StreamEncoder *encoder, unsigned value)


FLAC__StreamDecoderState 	FLAC__stream_encoder_get_verify_decoder_state (const FLAC__StreamEncoder *encoder)

FLAC__bool 	FLAC__stream_encoder_get_verify (const FLAC__StreamEncoder *encoder)

FLAC__bool 	FLAC__stream_encoder_get_streamable_subset (const FLAC__StreamEncoder *encoder)

unsigned 	FLAC__stream_encoder_get_channels (const FLAC__StreamEncoder *encoder)

unsigned 	FLAC__stream_encoder_get_bits_per_sample (const FLAC__StreamEncoder *encoder)

unsigned 	FLAC__stream_encoder_get_sample_rate (const FLAC__StreamEncoder *encoder)

unsigned 	FLAC__stream_encoder_get_blocksize (const FLAC__StreamEncoder *encoder)

FLAC__bool 	FLAC__stream_encoder_get_do_mid_side_stereo (const FLAC__StreamEncoder *encoder)

FLAC__bool 	FLAC__stream_encoder_get_loose_mid_side_stereo (const FLAC__StreamEncoder *encoder)

unsigned 	FLAC__stream_encoder_get_max_lpc_order (const FLAC__StreamEncoder *encoder)

unsigned 	FLAC__stream_encoder_get_qlp_coeff_precision (const FLAC__StreamEncoder *encoder)

FLAC__bool 	FLAC__stream_encoder_get_do_qlp_coeff_prec_search (const FLAC__StreamEncoder *encoder)

FLAC__bool 	FLAC__stream_encoder_get_do_escape_coding (const FLAC__StreamEncoder *encoder)

FLAC__bool 	FLAC__stream_encoder_get_do_exhaustive_model_search (const FLAC__StreamEncoder *encoder)

unsigned 	FLAC__stream_encoder_get_min_residual_partition_order (const FLAC__StreamEncoder *encoder)

unsigned 	FLAC__stream_encoder_get_max_residual_partition_order (const FLAC__StreamEncoder *encoder)

unsigned 	FLAC__stream_encoder_get_rice_parameter_search_dist (const FLAC__StreamEncoder *encoder)

FLAC__uint64 	FLAC__stream_encoder_get_total_samples_estimate (const FLAC__StreamEncoder *encoder)



TODO export other decoder API functions?:

FLAC__StreamDecoder * 	FLAC__stream_decoder_new (void)

FLAC__bool 	FLAC__stream_decoder_set_md5_checking (FLAC__StreamDecoder *decoder, FLAC__bool value)

FLAC__bool 	FLAC__stream_decoder_set_metadata_respond (FLAC__StreamDecoder *decoder, FLAC__MetadataType type)

FLAC__bool 	FLAC__stream_decoder_set_metadata_respond_application (FLAC__StreamDecoder *decoder, const FLAC__byte id[4])

FLAC__bool 	FLAC__stream_decoder_set_metadata_respond_all (FLAC__StreamDecoder *decoder)

FLAC__bool 	FLAC__stream_decoder_set_metadata_ignore (FLAC__StreamDecoder *decoder, FLAC__MetadataType type)

FLAC__bool 	FLAC__stream_decoder_set_metadata_ignore_application (FLAC__StreamDecoder *decoder, const FLAC__byte id[4])

FLAC__bool 	FLAC__stream_decoder_set_metadata_ignore_all (FLAC__StreamDecoder *decoder)


const char * 	FLAC__stream_decoder_get_resolved_state_string (const FLAC__StreamDecoder *decoder)

FLAC__uint64 	FLAC__stream_decoder_get_total_samples (const FLAC__StreamDecoder *decoder)

unsigned 	FLAC__stream_decoder_get_channels (const FLAC__StreamDecoder *decoder)

unsigned 	FLAC__stream_decoder_get_bits_per_sample (const FLAC__StreamDecoder *decoder)

unsigned 	FLAC__stream_decoder_get_sample_rate (const FLAC__StreamDecoder *decoder)

unsigned 	FLAC__stream_decoder_get_blocksize (const FLAC__StreamDecoder *decoder)


FLAC__bool 	FLAC__stream_decoder_flush (FLAC__StreamDecoder *decoder)

FLAC__bool 	FLAC__stream_decoder_skip_single_frame (FLAC__StreamDecoder *decoder)

 */

	/**
	 * Create an encoder.
	 *
	 * @param {number} sample_rate
	 * 					the sample rate of the input PCM data
	 * @param {number} channels
	 * 					the number of channels of the input PCM data
	 * @param {number} bps
	 * 					bits per sample of the input PCM data
	 * @param {number} compression_level
	 * 					the desired Flac compression level: [0, 8]
	 * @param {number} [total_samples] OPTIONAL
	 * 					the number of total samples of the input PCM data:<br>
	 * 					 Sets an estimate of the total samples that will be encoded.
	 * 					 This is merely an estimate and may be set to 0 if unknown.
	 * 					 This value will be written to the STREAMINFO block before encoding,
	 * 					 and can remove the need for the caller to rewrite the value later if
	 * 					 the value is known before encoding.<br>
	 * 					If specified, the it will be written into metadata of the FLAC header.<br>
	 * 					DEFAULT: 0 (i.e. unknown number of samples)
	 * @param {boolean} [is_verify] OPTIONAL
	 * 					enable/disable checksum verification during encoding<br>
	 * 					DEFAULT: true<br>
	 * 					NOTE: this argument is positional (i.e. total_samples must also be given)
	 * @param {number} [block_size] OPTIONAL
	 * 					the number of samples to use per frame.<br>
	 * 					DEFAULT: 0 (i.e. encoder sets block size automatically)
	 * 					NOTE: this argument is positional (i.e. total_samples and is_verify must also be given)
	 *
	 *
	 * @returns {number} the ID of the created encoder instance (or 0, if there was an error)
	 *
	 * @memberOf Flac#
	 * @function
	 */
	create_libflac_encoder: function(sample_rate, channels, bps, compression_level, total_samples, is_verify, block_size){
		is_verify = typeof is_verify === 'undefined'? 1 : is_verify + 0;
		total_samples = typeof total_samples === 'number'? total_samples : 0;
		block_size = typeof block_size === 'number'? block_size : 0;
		var ok = true;
		var encoder = Module.ccall('FLAC__stream_encoder_new', 'number', [ ], [ ]);
		ok &= Module.ccall('FLAC__stream_encoder_set_verify', 'number', ['number', 'number'], [ encoder, is_verify ]);
		ok &= Module.ccall('FLAC__stream_encoder_set_compression_level', 'number', ['number', 'number'], [ encoder, compression_level ]);
		ok &= Module.ccall('FLAC__stream_encoder_set_channels', 'number', ['number', 'number'], [ encoder, channels ]);
		ok &= Module.ccall('FLAC__stream_encoder_set_bits_per_sample', 'number', ['number', 'number'], [ encoder, bps ]);
		ok &= Module.ccall('FLAC__stream_encoder_set_sample_rate', 'number', ['number', 'number'], [ encoder, sample_rate ]);
		ok &= Module.ccall('FLAC__stream_encoder_set_blocksize', 'number', [ 'number', 'number'], [ encoder, block_size ]);
		ok &= Module.ccall('FLAC__stream_encoder_set_total_samples_estimate', 'number', ['number', 'number'], [ encoder, total_samples ]);
		if (ok){
			do_fire_event('created', [{type: 'created', target: {id: encoder, type: 'encoder'}}], false);
			return encoder;
		}
		return 0;
	},
	/**
	 * @deprecated use {@link #create_libflac_encoder} instead
	 * @memberOf Flac#
	 * @function
	 */
	init_libflac_encoder: function(){
		console.warn('Flac.init_libflac_encoder() is deprecated, use Flac.create_libflac_encoder() instead!');
		return this.create_libflac_encoder.apply(this, arguments);
	},

	/**
	 * Create a decoder.
	 *
	 * @param {boolean} [is_verify]
	 * 				enable/disable checksum verification during decoding<br>
	 * 				DEFAULT: true
	 *
	 * @returns {number} the ID of the created decoder instance (or 0, if there was an error)
	 *
	 * @memberOf Flac#
	 * @function
	 */
	create_libflac_decoder: function(is_verify){
		is_verify = typeof is_verify === 'undefined'? 1 : is_verify + 0;
		var ok = true;
		var decoder = Module.ccall('FLAC__stream_decoder_new', 'number', [ ], [ ]);
		ok &= Module.ccall('FLAC__stream_decoder_set_md5_checking', 'number', ['number', 'number'], [ decoder, is_verify ]);
		if (ok){
			do_fire_event('created', [{type: 'created', target: {id: decoder, type: 'decoder'}}], false);
			return decoder;
		}
		return 0;
	},
	/**
	 * @deprecated use {@link #create_libflac_decoder} instead
	 * @memberOf Flac#
	 * @function
	 */
	init_libflac_decoder: function(){
		console.warn('Flac.init_libflac_decoder() is deprecated, use Flac.create_libflac_decoder() instead!');
		return this.create_libflac_decoder.apply(this, arguments);
	},
	/**
	 * the callback for writing the encoded FLAC data.
	 *
	 * @callback Flac~encoder_write_callback_fn
	 * @param {Uint8Array} data the encoded FLAC data
	 * @param {number} numberOfBytes the number of bytes in data
	 * @param {number} samples the number of samples encoded in data
	 * @param {number} currentFrame the number of the (current) encoded frame in data
	 * @returns {undefined | false} returning <code>false</code> indicates that an
	 * 								unrecoverable error occurred and decoding should be aborted
	 */
	/**
	 * the callback for the metadata of the encoded/decoded Flac data.
	 * @callback Flac~metadata_callback_fn
	 * @param {Flac.StreamMetadata} metadata the FLAC meta data
	 */
	/**
	 * FLAC meta data
	 * @interface Metadata
	 * @memberOf Flac
	 * @property {number}  sampleRate the sample rate (Hz)
	 * @property {number}  channels the number of channels
	 * @property {number}  bitsPerSample bits per sample
	 */
	/**
	 * FLAC stream meta data
	 * @interface StreamMetadata
	 * @memberOf Flac
	 * @augments Flac.Metadata
	 * @property {number}  min_blocksize the minimal block size (bytes)
	 * @property {number}  max_blocksize the maximal block size (bytes)
	 * @property {number}  min_framesize the minimal frame size (bytes)
	 * @property {number}  max_framesize the maximal frame size (bytes)
	 * @property {number}  total_samples the total number of (encoded/decoded) samples
	 * @property {string}  md5sum  the MD5 checksum for the decoded data (if validation is active)
	 */
	/**
	 * Initialize the encoder.
	 *
	 * @param {number} encoder
	 * 				the ID of the encoder instance that has not been initialized (or has been reset)
	 *
	 * @param {Flac~encoder_write_callback_fn} write_callback_fn
	 * 				the callback for writing the encoded Flac data:
	 * 				<pre>write_callback_fn(data: Uint8Array, numberOfBytes: Number, samples: Number, currentFrame: Number)</pre>
	 *
	 * @param {Flac~metadata_callback_fn} [metadata_callback_fn] OPTIONAL
	 * 				the callback for the metadata of the encoded Flac data:
	 * 				<pre>metadata_callback_fn(metadata: StreamMetadata)</pre>
	 *
	 * @param {number|boolean} [ogg_serial_number] OPTIONAL
	 * 				if number or <code>true</code> is specified, the encoder will be initialized to
	 * 				write to an OGG container, see {@link Flac.init_encoder_ogg_stream}:
	 * 				<code>true</code> will set a default serial number (<code>1</code>),
	 * 				if specified as number, it will be used as the stream's serial number within the ogg container.
	 *
	 * @returns {Flac.FLAC__StreamEncoderInitStatus} the encoder status (<code>0</code> for <code>FLAC__STREAM_ENCODER_INIT_STATUS_OK</code>)
	 *
	 * @memberOf Flac#
	 * @function
	 */
	init_encoder_stream: function(encoder, write_callback_fn, metadata_callback_fn, ogg_serial_number, client_data){

		var is_ogg = (ogg_serial_number === true);
		client_data = client_data|0;

		if(typeof write_callback_fn !== 'function'){
			return FLAC__STREAM_ENCODER_INIT_STATUS_INVALID_CALLBACKS;
		}
		setCallback(encoder, 'write', write_callback_fn);

		var __metadata_callback_fn_ptr = 0;
		if(typeof metadata_callback_fn === 'function'){
			setCallback(encoder, 'metadata', metadata_callback_fn);
			__metadata_callback_fn_ptr = metadata_fn_ptr;
		}

		//NOTE the following comments are used for auto-detecting exported functions (only change if ccall function name(s) change!):
		//	Module.ccall('FLAC__stream_encoder_init_stream'
		var func_name = 'FLAC__stream_encoder_init_stream';
		var args_types = ['number', 'number', 'number', 'number', 'number', 'number'];
		var args = [
			encoder,
			enc_write_fn_ptr,
			0,//	FLAC__StreamEncoderSeekCallback
			0,//	FLAC__StreamEncoderTellCallback
			__metadata_callback_fn_ptr,
			client_data
		];

		if(typeof ogg_serial_number === 'number'){

			is_ogg = true;

		} else if(is_ogg){//else: set default serial number for stream in OGG container

			//NOTE from FLAC docs: "It is recommended to set a serial number explicitly as the default of '0' may collide with other streams."
			ogg_serial_number = 1;
		}

		if(is_ogg){
			//NOTE the following comments are used for auto-detecting exported functions (only change if ccall function name(s) change!):
			//	Module.ccall('FLAC__stream_encoder_init_ogg_stream'
			func_name = 'FLAC__stream_encoder_init_ogg_stream';

			//2nd arg: FLAC__StreamEncoderReadCallback ptr -> duplicate first entry & insert at [1]
			args.unshift(args[0]);
			args[1] = 0;//	FLAC__StreamEncoderReadCallback

			args_types.unshift(args_types[0]);
			args_types[1] = 'number';


			//NOTE ignore BOOL return value when setting serial number, since init-call's returned
			//     status will also indicate, if encoder already has been initialized
			Module.ccall(
				'FLAC__stream_encoder_set_ogg_serial_number', 'number',
				['number', 'number'],
				[ encoder, ogg_serial_number ]
			);
		}

		var init_status = Module.ccall(func_name, 'number', args_types, args);

		return init_status;
	},
	/**
	 * Initialize the encoder for writing to an OGG container.
	 *
	 * @param {number} [ogg_serial_number] OPTIONAL
	 * 				the serial number for the stream in the OGG container
	 * 				DEFAULT: <code>1</code>
	 *
	 * @memberOf Flac#
	 * @function
	 * @copydoc #init_encoder_stream
	 */
	init_encoder_ogg_stream: function(encoder, write_callback_fn, metadata_callback_fn, ogg_serial_number, client_data){

		if(typeof ogg_serial_number !== 'number'){
			ogg_serial_number = true;
		}
		return this.init_encoder_stream(encoder, write_callback_fn, metadata_callback_fn, ogg_serial_number, client_data);
	},
	/**
	 * Result / return value for {@link Flac~decoder_read_callback_fn} callback function
	 *
	 * @interface ReadResult
	 * @memberOf Flac
	 * @property {TypedArray}  buffer  a TypedArray (e.g. Uint8Array) with the read data
	 * @property {number}  readDataLength the number of read data bytes. A number of <code>0</code> (zero) indicates that the end-of-stream is reached.
	 * @property {boolean}  [error] OPTIONAL value of <code>true</code> indicates that an error occured (decoding will be aborted)
	 */
	/**
	 * The callback for reading the FLAC data that will be decoded.
	 *
	 * @callback Flac~decoder_read_callback_fn
	 * @param {number} numberOfBytes the maximal number of bytes that the read callback can return
	 * @returns {Flac.ReadResult} the result of the reading action/request
	 */
	/**
	 * The callback for writing the decoded FLAC data.
	 *
	 * @callback Flac~decoder_write_callback_fn
	 * @param {Uint8Array[]} data array of the channels with the decoded PCM data as <code>Uint8Array</code>s
	 * @param {Flac.BlockMetadata} frameInfo the metadata information for the decoded data
	 */
	/**
	 * The callback for reporting decoding errors.
	 *
	 * @callback Flac~decoder_error_callback_fn
	 * @param {number} errorCode the error code
	 * @param {Flac.FLAC__StreamDecoderErrorStatus} errorDescription the string representation / description of the error
	 */
	/**
	 * FLAC block meta data
	 * @interface BlockMetadata
	 * @augments Flac.Metadata
	 * @memberOf Flac
	 *
	 * @property {number}  blocksize the block size (bytes)
	 * @property {number}  number the number of the decoded samples or frames
	 * @property {string}  numberType the type to which <code>number</code> refers to: either <code>"frames"</code> or <code>"samples"</code>
	 * @property {Flac.FLAC__ChannelAssignment} channelAssignment the channel assignment
	 * @property {string}  crc the MD5 checksum for the decoded data, if validation is enabled
	 * @property {Flac.SubFrameMetadata[]}  [subframes] the metadata of the subframes. The array length corresponds to the number of channels. NOTE will only be included if {@link Flac.CodingOptions CodingOptions.analyseSubframes} is enabled for the decoder.
	 *
	 * @see Flac.CodingOptions
	 * @see Flac#setOptions
	 */
	/**
	 * FLAC subframe metadata
	 * @interface SubFrameMetadata
	 * @memberOf Flac
	 *
	 * @property {Flac.FLAC__SubframeType}  type the type of the subframe
	 * @property {number|Flac.FixedSubFrameData|Flac.LPCSubFrameData}  data the type specific metadata for subframe
	 * @property {number}  wastedBits the wasted bits-per-sample
	 */
	/**
	 * metadata for FIXED subframe type
	 * @interface FixedSubFrameData
	 * @memberOf Flac
	 *
	 * @property {number}  order  The polynomial order.
	 * @property {number[]}  warmup  Warmup samples to prime the predictor, length == order.
	 * @property {Flac.SubFramePartition}  partition  The residual coding method.
	 * @property {number[]}  [residual]  The residual signal, length == (blocksize minus order) samples.
	 * 									NOTE will only be included if {@link Flac.CodingOptions CodingOptions.analyseSubframes} is enabled for the decoder.
	 */
	/**
	 * metadata for LPC subframe type
	 * @interface LPCSubFrameData
	 * @augments Flac.FixedSubFrameData
	 * @memberOf Flac
	 *
	 * @property {number}  order  The FIR order.
	 * @property {number[]}  qlp_coeff  FIR filter coefficients.
	 * @property {number}  qlp_coeff_precision  Quantized FIR filter coefficient precision in bits.
	 * @property {number}  quantization_level The qlp coeff shift needed.
	 */
	/**
	 * metadata for FIXED or LPC subframe partitions
	 * @interface SubFramePartition
	 * @memberOf Flac
	 *
	 * @property {Flac.FLAC__EntropyCodingMethodType}  type  the entropy coding method
	 * @property {Flac.SubFramePartitionData}  data  metadata for a Rice partitioned residual
	 */
	/**
	 * metadata for FIXED or LPC subframe partition data
	 * @interface SubFramePartitionData
	 * @memberOf Flac
	 *
	 * @property {number}  order  The partition order, i.e. # of contexts = 2 ^ order.
	 * @property {Flac.SubFramePartitionContent}  contents  The context's Rice parameters and/or raw bits.
	 */
	/**
	 * metadata for FIXED or LPC subframe partition data content
	 * @interface SubFramePartitionContent
	 * @memberOf Flac
	 *
	 * @property {number[]}  parameters  The Rice parameters for each context.
	 * @property {number[]}  rawBits  Widths for escape-coded partitions. Will be non-zero for escaped partitions and zero for unescaped partitions.
	 * @property {number}  capacityByOrder  The capacity of the parameters and raw_bits arrays specified as an order, i.e. the number of array elements allocated is 2 ^ capacity_by_order.
	 */
	/**
	 * The types for FLAC subframes
	 *
	 * @interface FLAC__SubframeType
	 * @memberOf Flac
	 *
	 * @property {"FLAC__SUBFRAME_TYPE_CONSTANT"} 	0	constant signal
	 * @property {"FLAC__SUBFRAME_TYPE_VERBATIM"} 	1	uncompressed signal
	 * @property {"FLAC__SUBFRAME_TYPE_FIXED"} 		2	fixed polynomial prediction
	 * @property {"FLAC__SUBFRAME_TYPE_LPC"} 		3	linear prediction
	 */
	/**
	 * The channel assignment for the (decoded) frame.
	 *
	 * @interface FLAC__ChannelAssignment
	 * @memberOf Flac
	 *
	 * @property {"FLAC__CHANNEL_ASSIGNMENT_INDEPENDENT"} 		0	independent channels
	 * @property {"FLAC__CHANNEL_ASSIGNMENT_LEFT_SIDE"}  		1	left+side stereo
	 * @property {"FLAC__CHANNEL_ASSIGNMENT_RIGHT_SIDE"} 		2	right+side stereo
	 * @property {"FLAC__CHANNEL_ASSIGNMENT_MID_SIDE"}			3	mid+side stereo
	 */
	/**
	 * entropy coding methods
	 *
	 * @interface FLAC__EntropyCodingMethodType
	 * @memberOf Flac
	 *
	 * @property {"FLAC__ENTROPY_CODING_METHOD_PARTITIONED_RICE"} 	0	Residual is coded by partitioning into contexts, each with it's own 4-bit Rice parameter.
	 * @property {"FLAC__ENTROPY_CODING_METHOD_PARTITIONED_RICE2"} 	1	Residual is coded by partitioning into contexts, each with it's own 5-bit Rice parameter.
	 */
	/**
	 * Initialize the decoder.
	 *
	 * @param {number} decoder
	 * 				the ID of the decoder instance that has not been initialized (or has been reset)
	 *
	 * @param {Flac~decoder_read_callback_fn} read_callback_fn
	 * 				the callback for reading the Flac data that should get decoded:
	 * 				<pre>read_callback_fn(numberOfBytes: Number) : {buffer: ArrayBuffer, readDataLength: number, error: boolean}</pre>
	 *
	 * @param {Flac~decoder_write_callback_fn} write_callback_fn
	 * 				the callback for writing the decoded data:
	 * 				<pre>write_callback_fn(data: Uint8Array[], frameInfo: Metadata)</pre>
	 *
	 * @param {Flac~decoder_error_callback_fn} [error_callback_fn] OPTIONAL
	 * 				the error callback:
	 * 				<pre>error_callback_fn(errorCode: Number, errorDescription: String)</pre>
	 *
	 * @param {Flac~metadata_callback_fn} [metadata_callback_fn] OPTIONAL
	 * 				callback for receiving the metadata of FLAC data that will be decoded:
	 * 				<pre>metadata_callback_fn(metadata: StreamMetadata)</pre>
	 *
	 * @param {number|boolean} [ogg_serial_number] OPTIONAL
	 * 				if number or <code>true</code> is specified, the decoder will be initilized to
	 * 				read from an OGG container, see {@link Flac.init_decoder_ogg_stream}:<br/>
	 * 				<code>true</code> will use the default serial number, if specified as number the
	 * 				corresponding stream with the serial number from the ogg container will be used.
	 *
	 * @returns {Flac.FLAC__StreamDecoderInitStatus} the decoder status(<code>0</code> for <code>FLAC__STREAM_DECODER_INIT_STATUS_OK</code>)
	 *
	 * @memberOf Flac#
	 * @function
	 */
	init_decoder_stream: function(decoder, read_callback_fn, write_callback_fn, error_callback_fn, metadata_callback_fn, ogg_serial_number, client_data){

		client_data = client_data|0;

		if(typeof read_callback_fn !== 'function'){
			return FLAC__STREAM_DECODER_INIT_STATUS_INVALID_CALLBACKS;
		}
		setCallback(decoder, 'read', read_callback_fn);

		if(typeof write_callback_fn !== 'function'){
			return FLAC__STREAM_DECODER_INIT_STATUS_INVALID_CALLBACKS;
		}
		setCallback(decoder, 'write', write_callback_fn);

		var __error_callback_fn_ptr = 0;
		if(typeof error_callback_fn === 'function'){
			setCallback(decoder, 'error', error_callback_fn);
			__error_callback_fn_ptr = dec_error_fn_ptr;
		}

		var __metadata_callback_fn_ptr = 0;
		if(typeof metadata_callback_fn === 'function'){
			setCallback(decoder, 'metadata', metadata_callback_fn);
			__metadata_callback_fn_ptr = metadata_fn_ptr;
		}

		var is_ogg = (ogg_serial_number === true);
		if(typeof ogg_serial_number === 'number'){

			is_ogg = true;

			//NOTE ignore BOOL return value when setting serial number, since init-call's returned
			//     status will also indicate, if decoder already has been initialized
			Module.ccall(
				'FLAC__stream_decoder_set_ogg_serial_number', 'number',
				['number', 'number'],
				[ decoder, ogg_serial_number ]
			);
		}

		//NOTE the following comments are used for auto-detecting exported functions (only change if ccall function name(s) change!):
		//	Module.ccall('FLAC__stream_decoder_init_stream'
		//	Module.ccall('FLAC__stream_decoder_init_ogg_stream'
		var init_func_name = !is_ogg? 'FLAC__stream_decoder_init_stream' : 'FLAC__stream_decoder_init_ogg_stream';

		var init_status = Module.ccall(
				init_func_name, 'number',
				[ 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
				[
					 decoder,
					 dec_read_fn_ptr,
					 0,// 	FLAC__StreamDecoderSeekCallback
					 0,// 	FLAC__StreamDecoderTellCallback
					 0,//	FLAC__StreamDecoderLengthCallback
					 0,//	FLAC__StreamDecoderEofCallback
					 dec_write_fn_ptr,
					 __metadata_callback_fn_ptr,
					 __error_callback_fn_ptr,
					 client_data
				]
		);

		return init_status;
	},
	/**
	 * Initialize the decoder for writing to an OGG container.
	 *
	 * @param {number} [ogg_serial_number] OPTIONAL
	 * 				the serial number for the stream in the OGG container that should be decoded.<br/>
	 * 				The default behavior is to use the serial number of the first Ogg page. Setting a serial number here will explicitly specify which stream is to be decoded.
	 *
	 * @memberOf Flac#
	 * @function
	 * @copydoc #init_decoder_stream
	 */
	init_decoder_ogg_stream: function(decoder, read_callback_fn, write_callback_fn, error_callback_fn, metadata_callback_fn, ogg_serial_number, client_data){

		if(typeof ogg_serial_number !== 'number'){
			ogg_serial_number = true;
		}
		return this.init_decoder_stream(decoder, read_callback_fn, write_callback_fn, error_callback_fn, metadata_callback_fn, ogg_serial_number, client_data);
	},
	/**
	 * Encode / submit data for encoding.
	 *
	 * This version allows you to supply the input data where the channels are interleaved into a
	 * single array (i.e. channel0_sample0, channel1_sample0, ... , channelN_sample0, channel0_sample1, ...).
	 *
	 * The samples need not be block-aligned but they must be sample-aligned, i.e. the first value should be
	 * channel0_sample0 and the last value channelN_sampleM.
	 *
	 * Each sample should be a signed integer, right-justified to the resolution set by bits-per-sample.
	 *
	 * For example, if the resolution is 16 bits per sample, the samples should all be in the range [-32768,32767].
	 *
	 *
	 * For applications where channel order is important, channels must follow the order as described in the frame header.
	 *
	 * @param {number} encoder
	 * 				the ID of the encoder instance
	 *
	 * @param {TypedArray} buffer
	 * 				the audio data in a typed array with signed integers (and size according to the set bits-per-sample setting)
	 *
	 * @param {number} num_of_samples
	 * 				the number of samples in buffer
	 *
	 * @returns {boolean} true if successful, else false; in this case, check the encoder state with FLAC__stream_encoder_get_state() to see what went wrong.
	 *
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_encoder_process_interleaved: function(encoder, buffer, num_of_samples){
		// get the length of the data in bytes
		var numBytes = buffer.length * buffer.BYTES_PER_ELEMENT;
		// console.log("DEBUG numBytes: " + numBytes);
		// malloc enough space for the data
		var ptr = Module._malloc(numBytes);
		// get a bytes-wise view on the newly allocated buffer
		var heapBytes= new Uint8Array(Module.HEAPU8.buffer, ptr, numBytes);
		// console.log("DEBUG heapBytes: " + heapBytes);
		// copy data into heapBytes
		heapBytes.set(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength));// issue #11 (2): do use byteOffset and byteLength for copying the data in case the underlying buffer/ArrayBuffer of the TypedArray view is larger than the TypedArray
		var status = Module.ccall('FLAC__stream_encoder_process_interleaved', 'number',
				['number', 'number', 'number'],
				[encoder, heapBytes.byteOffset, num_of_samples]
		);
		Module._free(ptr);
		return status;
	},

	/**
	 * Decodes a single frame.
	 *
	 * To check decoding progress, use {@link #FLAC__stream_decoder_get_state}.
	 *
	 * @param {number} decoder
	 * 				the ID of the decoder instance
	 *
	 * @returns {boolean} FALSE if an error occurred
	 *
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_decoder_process_single: Module.cwrap('FLAC__stream_decoder_process_single', 'number', ['number']),

	/**
	 * Decodes data until end of stream.
	 *
	 * @param {number} decoder
	 * 				the ID of the decoder instance
	 *
	 * @returns {boolean} FALSE if an error occurred
	 *
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_decoder_process_until_end_of_stream: Module.cwrap('FLAC__stream_decoder_process_until_end_of_stream', 'number', ['number']),

	/**
	 * Decodes data until end of metadata.
	 *
	 * @param {number} decoder
	 * 				the ID of the decoder instance
	 *
	 * @returns {boolean} false if any fatal read, write, or memory allocation error occurred (meaning decoding must stop), else true.
	 *
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_decoder_process_until_end_of_metadata: Module.cwrap('FLAC__stream_decoder_process_until_end_of_metadata', 'number', ['number']),

	/**
	 * Decoder state code.
	 *
	 * @interface FLAC__StreamDecoderState
	 * @memberOf Flac
	 *
	 * @property {"FLAC__STREAM_DECODER_SEARCH_FOR_METADATA"} 		0	The decoder is ready to search for metadata
	 * @property {"FLAC__STREAM_DECODER_READ_METADATA"}  			1	The decoder is ready to or is in the process of reading metadata
	 * @property {"FLAC__STREAM_DECODER_SEARCH_FOR_FRAME_SYNC"} 	2	The decoder is ready to or is in the process of searching for the frame sync code
	 * @property {"FLAC__STREAM_DECODER_READ_FRAME"}				3	The decoder is ready to or is in the process of reading a frame
	 * @property {"FLAC__STREAM_DECODER_END_OF_STREAM"}				4	The decoder has reached the end of the stream
	 * @property {"FLAC__STREAM_DECODER_OGG_ERROR"}					5	An error occurred in the underlying Ogg layer
	 * @property {"FLAC__STREAM_DECODER_SEEK_ERROR"}				6	An error occurred while seeking. The decoder must be flushed with FLAC__stream_decoder_flush() or reset with FLAC__stream_decoder_reset() before decoding can continue
	 * @property {"FLAC__STREAM_DECODER_ABORTED"}					7	The decoder was aborted by the read callback
	 * @property {"FLAC__STREAM_DECODER_MEMORY_ALLOCATION_ERROR"}	8	An error occurred allocating memory. The decoder is in an invalid state and can no longer be used
	 * @property {"FLAC__STREAM_DECODER_UNINITIALIZED"}				9	The decoder is in the uninitialized state; one of the FLAC__stream_decoder_init_*() functions must be called before samples can be processed.
	 *
	 */
	/**
	 *
	 * @param {number} decoder
	 * 				the ID of the decoder instance
	 *
	 * @returns {Flac.FLAC__StreamDecoderState} the decoder state
	 *
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_decoder_get_state: Module.cwrap('FLAC__stream_decoder_get_state', 'number', ['number']),

	/**
	 * Encoder state code.
	 *
	 * @interface FLAC__StreamEncoderState
	 * @memberOf Flac
	 *
	 * @property {"FLAC__STREAM_ENCODER_OK"}								0 	The encoder is in the normal OK state and samples can be processed.
	 * @property {"FLAC__STREAM_ENCODER_UNINITIALIZED"}						1 	The encoder is in the uninitialized state; one of the FLAC__stream_encoder_init_*() functions must be called before samples can be processed.
	 * @property {"FLAC__STREAM_ENCODER_OGG_ERROR"}							2 	An error occurred in the underlying Ogg layer.
	 * @property {"FLAC__STREAM_ENCODER_VERIFY_DECODER_ERROR"}				3 	An error occurred in the underlying verify stream decoder; check FLAC__stream_encoder_get_verify_decoder_state().
	 * @property {"FLAC__STREAM_ENCODER_VERIFY_MISMATCH_IN_AUDIO_DATA"}		4 	The verify decoder detected a mismatch between the original audio signal and the decoded audio signal.
	 * @property {"FLAC__STREAM_ENCODER_CLIENT_ERROR"}						5 	One of the callbacks returned a fatal error.
	 * @property {"FLAC__STREAM_ENCODER_IO_ERROR"}							6 	An I/O error occurred while opening/reading/writing a file. Check errno.
	 * @property {"FLAC__STREAM_ENCODER_FRAMING_ERROR"}						7 	An error occurred while writing the stream; usually, the write_callback returned an error.
	 * @property {"FLAC__STREAM_ENCODER_MEMORY_ALLOCATION_ERROR"}			8 	Memory allocation failed.
	 *
	 */
	/**
	 *
	 * @param {number} encoder
	 * 				the ID of the encoder instance
	 *
	 * @returns {Flac.FLAC__StreamEncoderState} the encoder state
	 *
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_encoder_get_state:  Module.cwrap('FLAC__stream_encoder_get_state', 'number', ['number']),

	/**
	 * Get if MD5 verification is enabled for decoder
	 *
	 * @param {number} decoder
	 * 				the ID of the decoder instance
	 *
	 * @returns {boolean} <code>true</code> if MD5 verification is enabled
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_decoder_get_md5_checking: Module.cwrap('FLAC__stream_decoder_get_md5_checking', 'number', ['number']),

//	/** @returns {boolean} FALSE if the decoder is already initialized, else TRUE. */
//	FLAC__stream_decoder_set_md5_checking: Module.cwrap('FLAC__stream_decoder_set_md5_checking', 'number', ['number', 'number']),

	/**
	 * Finish the encoding process.
	 *
	 * @param {number} encoder
	 * 				the ID of the encoder instance
	 *
	 * @returns {boolean} <code>false</code> if an error occurred processing the last frame;
	 * 					 or if verify mode is set, there was a verify mismatch; else <code>true</code>.
	 * 					 If <code>false</code>, caller should check the state with {@link Flac#FLAC__stream_encoder_get_state}
	 * 					 for more information about the error.
	 *
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_encoder_finish: Module.cwrap('FLAC__stream_encoder_finish', 'number', [ 'number' ]),
	/**
	 * Finish the decoding process.
	 *
	 * The decoder can be reused, after initializing it again.
	 *
	 * @param {number} decoder
	 * 				the ID of the decoder instance
	 *
	 * @returns {boolean} <code>false</code> if MD5 checking is on AND a STREAMINFO block was available AND the MD5 signature in
	 * 						 the STREAMINFO block was non-zero AND the signature does not match the one computed by the decoder;
	 * 						 else <code>true</code>.
	 *
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_decoder_finish: Module.cwrap('FLAC__stream_decoder_finish', 'number', [ 'number' ]),
	/**
	 * Reset the decoder for reuse.
	 *
	 * <p>
	 * NOTE: Needs to be re-initialized, before it can be used again
	 *
	 * @param {number} decoder
	 * 				the ID of the decoder instance
	 *
	 * @returns {boolean} true if successful
	 *
	 * @see #init_decoder_stream
	 * @see #init_decoder_ogg_stream
	 *
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_decoder_reset: Module.cwrap('FLAC__stream_decoder_reset', 'number', [ 'number' ]),
	/**
	 * Delete the encoder instance, and free up its resources.
	 *
	 * @param {number} encoder
	 * 				the ID of the encoder instance
	 *
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_encoder_delete: function(encoder){
		this._clear_enc_cb(encoder);//<- remove callback references
		Module.ccall('FLAC__stream_encoder_delete', 'number', [ 'number' ], [encoder]);
		do_fire_event('destroyed', [{type: 'destroyed', target: {id: encoder, type: 'encoder'}}], false);
	},
	/**
	 * Delete the decoder instance, and free up its resources.
	 *
	 * @param {number} decoder
	 * 				the ID of the decoder instance
	 *
	 * @memberOf Flac#
	 * @function
	 */
	FLAC__stream_decoder_delete: function(decoder){
		this._clear_dec_cb(decoder);//<- remove callback references
		Module.ccall('FLAC__stream_decoder_delete', 'number', [ 'number' ], [decoder]);
		do_fire_event('destroyed', [{type: 'destroyed', target: {id: decoder, type: 'decoder'}}], false);
	}

};//END: var _exported = {

//if Properties are supported by JS execution environment:
// support "immediate triggering" onready function, if library is already initialized when setting onready callback
if(typeof Object.defineProperty === 'function'){
	//add internal field for storing onready callback:
	_exported._onready = void(0);
	//define getter & define setter with "immediate trigger" functionality:
	Object.defineProperty(_exported, 'onready', {
		get() { return this._onready; },
		set(newValue) {
			this._onready = newValue;
			if(this.isReady()){
				check_and_trigger_persisted_event('ready', newValue);
			}
		}
	});
} else {
	//if Properties are NOTE supported by JS execution environment:
	// pring usage warning for onready hook instead
	console.warn('WARN: note that setting Flac.onready handler after Flac.isReady() is already true, will have no effect, that is, the handler function will not be triggered!');
}

if(expLib && expLib.exports){
	expLib.exports = _exported;
}
return _exported;

}));//END: UMD wrapper

