// jsonpatch.js 0.1
// (c) 2011 Byron Ruth
// jsonpatch may be freely distributed under the MIT license

// Run-anywhere Javascript Boilerplate Code
// http://www.sitepen.com/blog/2010/09/30/run-anywhere-javascript-modules-boilerplate-code/
(function(name, factory) {
    typeof required == 'undefined' ?
        (typeof dojo != 'undefined' && dojo.provide(name)) &
            // direct script
            factory(this[name] = {}) :
        typeof exports == 'undefined' ?
            // browser transport/C loader or RequireJS
            define(name, ['exports'], factory) :
            // CommonJS environment
            factory(exports);
})('jsonpatch', function(exports) {

    var toString = Object.prototype.toString,

        isArray = Array.isArray || function(obj) {
            return toString.call(obj) === '[object Array]';
        },

        isObject = function(obj) {
            return obj === Object(obj);
        },

        isString = function(obj) {
            return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
        };

    // Gets thrown if the patch cannot be applied due to processing issues
    // such as a bad operation.
    function PatchApplyError(message) {
        this.name = 'PatchApplyError';
        this.message = message || 'The patch could not be applied';
    }

    PatchApplyError.prototype = new Error;
    PatchApplyError.prototype.constructor = PatchApplyError;

    // Gets thrown if the patch cannot be applied due to a conflict with the
    // target object.
    function PatchConflictError(message) {
        this.name = 'PatchConflictError';
        this.message = message || 'The patch could not be applied due to a conflict';
    }

    PatchConflictError.prototype = new PatchApplyError;
    PatchConflictError.prototype.constructor = PatchConflictError;

    // Returns an object and key or array and index of the target location for the
    // patch operation.
    function walk(obj, path, exists) {
        var steps = path.split('/');
        if (!path || steps.shift() !== '') {
            throw new PatchApplyError('Path must start with /');
        }

        var idx = 0, len = steps.length-1;
        for (; idx < len; idx++) {
            if ((obj = step(obj, steps[idx])) && !isObject(obj)) {
                throw new PatchConflictError('Bad path');
            }
        }
        // final step acts as a existential check which is dependent on the
        // upstream operation being performed.
        step(obj, steps[len], exists);
        return [obj, steps[len]];
    }

    // Attempts to return the part of the object relative to ``step`` which may
    // be a key or array index.
    function step(obj, step, exists) {
        exists !== false && (exists = true);
        if (isArray(obj)) {
            if (obj.length > (step = parseInt(step, 10)) && step > -1) {
                return obj.slice(step, step+1)[0];
            } else if (exists) {
                throw new PatchConflictError('Node does not exist at the location "' + step + '"');
            } else {
                throw new PatchConflictError('Array location "' + step + '" is out of bounds');
            }
        }
        var prop = obj.hasOwnProperty(step);
        if (exists && !prop) {
            throw new PatchConflictError('Node does not exist at the location "' + step + '"');
        } else if (!exists && prop) {
            throw new PatchConflictError('Node exists at the location "' + step + '"');
        }
        return obj[step];
    }

    function add(obj, path, value, func) {
        var parts = walk(obj, path, false),
            obj = parts[0], step = parts[1];

        return function() {
            func && func();
            if (isArray(obj)) {
                step = parseInt(step, 10)
                obj.splice(step, 0, value);
            } else {
                obj[step] = value;
            }
            return obj;
        }
    }

    function remove(obj, path, value, func) {
        var parts = walk(obj, path),
            obj = parts[0], step = parts[1];

        return function() {
            func && func()
            if (isArray(obj)) {
                step = parseInt(step, 10)
                obj.splice(step, 1);
            } else {
                delete obj[step];
            }
            return obj;
        }
    }

    function replace(obj, path, value, func) {
        var parts = walk(obj, path),
            obj = parts[0], step = parts[1];

        return function() {
            func && func()
            if (isArray(obj)) {
                step = parseInt(step, 10)
                obj.splice(step, 1, value);
            } else {
                obj[step] = value;
            }
            return obj;
        }
    }

    var operations = {
        add: add,
        remove: remove,
        replace: replace
    };

    function apply(obj, patches) {
        if (!isArray(patches)) {
            patches = [patches];
        }

        var patch, func, key, idx = 0, len = patches.length;
        for (; idx < len; idx++) {
            patch = patches[idx];
            for (key in patch) {
                if (key === 'value') { continue; }
                if (patcher = operations[key]) {
                    func = patcher(obj, patch[key], patch.value, func);
                } else {
                    throw new PatchApplyError('Invalid patch operation');
                }
            }
        }
        // applies the patch at the end to ensure no partial patching occurs
        // due to errors while applying the patches.
        func();
        return obj;
    }

    // expose to exports
    exports.apply = apply;
    exports.PatchApplyError = PatchApplyError;
    exports.PatchConflictError = PatchConflictError;
});
