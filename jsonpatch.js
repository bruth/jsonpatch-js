(function() {
  var __hasProp = Object.prototype.hasOwnProperty, __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (__hasProp.call(this, i) && this[i] === item) return i; } return -1; }, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  (function(name, factory) {
    if (typeof required === 'undefined') {
      return factory(this[name] = {});
    } else if (typeof exports === 'undefined') {
      return define(name, ['exports'], factory);
    } else {
      return factory(exports);
    }
  })('jsonpatch', function(exports) {
    var InvalidPatchError, JSONPatch, JSONPatchError, JSONPointer, PatchApplyError, PatchConflictError, add, apply, compile, hasOwnProperty, isArray, isEqual, isObject, isString, methodMap, move, operationMembers, remove, replace, test, toString, _isEqual;
    toString = Object.prototype.toString;
    hasOwnProperty = Object.prototype.hasOwnProperty;
    isArray = function(obj) {
      return toString.call(obj) === '[object Array]';
    };
    isObject = function(obj) {
      return obj === Object(obj);
    };
    isString = function(obj) {
      return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
    };
    _isEqual = function(a, b, stack) {
      var className, key, length, result, size;
      if (a === b) return a !== 0 || 1 / a === 1 / b;
      if (a === null || b === null) return a === b;
      className = toString.call(a);
      if (className !== toString.call(b)) return false;
      switch (className) {
        case '[object String]':
          String(a) === String(b);
          break;
        case '[object Number]':
          a = +a;
          b = +b;
          if (a !== a) {
            b !== b;
          } else {
            if (a === 0) {
              1 / a === 1 / b;
            } else {
              a === b;
            }
          }
          break;
        case '[object Boolean]':
          +a === +b;
      }
      if (typeof a !== 'object' || typeof b !== 'object') return false;
      length = stack.length;
      while (length--) {
        if (stack[length] === a) return true;
      }
      stack.push(a);
      size = 0;
      result = true;
      if (className === '[object Array]') {
        size = a.length;
        result = size === b.length;
        if (result) {
          while (size--) {
            if (!(result = __indexOf.call(a, size) >= 0 === __indexOf.call(b, size) >= 0 && _isEqual(a[size], b[size], stack))) {
              break;
            }
          }
        }
      } else {
        if (__indexOf.call(a, "constructor") >= 0 !== __indexOf.call(b, "constructor") >= 0 || a.constructor !== b.constructor) {
          return false;
        }
        for (key in a) {
          if (hasOwnProperty.call(a, key)) {
            size++;
            if (!(result = hasOwnProperty.call(b, key) && _isEqual(a[key], b[key], stack))) {
              break;
            }
          }
        }
        if (result) {
          for (key in b) {
            if (hasOwnProperty.call(b, key) && !size--) break;
          }
          result = !size;
        }
      }
      stack.pop();
      return result;
    };
    isEqual = function(a, b) {
      return _isEqual(a, b, []);
    };
    JSONPatchError = (function() {

      __extends(JSONPatchError, Error);

      function JSONPatchError(message) {
        this.name = 'JSONPatchError';
        this.message = message || 'JSON patch error';
      }

      return JSONPatchError;

    })();
    InvalidPatchError = (function() {

      __extends(InvalidPatchError, JSONPatchError);

      function InvalidPatchError(message) {
        this.name = 'InvalidPatch';
        this.message = message || 'Invalid patch';
      }

      return InvalidPatchError;

    })();
    PatchApplyError = (function() {

      __extends(PatchApplyError, JSONPatchError);

      function PatchApplyError(message) {
        this.name = 'PatchApplyError';
        this.message = message || 'Patch could not be applied';
      }

      return PatchApplyError;

    })();
    PatchConflictError = (function() {

      __extends(PatchConflictError, JSONPatchError);

      function PatchConflictError(message) {
        this.name = 'PatchConflictError';
        this.message = message || 'Patch conflict';
      }

      return PatchConflictError;

    })();
    JSONPointer = (function() {

      function JSONPointer(path, shouldExist) {
        var i, loc, steps, _len;
        if (shouldExist == null) shouldExist = true;
        if (path && (steps = path.split('/')).shift() !== '') {
          throw new InvalidPatchError();
        }
        for (i = 0, _len = steps.length; i < _len; i++) {
          loc = steps[i];
          steps[i] = decodeURIComponent(loc);
        }
        this.accessor = steps.pop();
        this.path = steps;
      }

      JSONPointer.prototype.getObject = function(obj) {
        var loc, _i, _len, _ref;
        _ref = this.path;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          loc = _ref[_i];
          if (isArray(obj)) loc = parseInt(loc, 10);
          if (!hasOwnProperty.call(obj, loc)) {
            throw new PatchConflictError('Array location out of bounds or not an instance property');
          }
          obj = obj[loc];
        }
        return obj;
      };

      return JSONPointer;

    })();
    JSONPatch = (function() {

      function JSONPatch(patch) {
        var key, member, method;
        for (key in patch) {
          if (!(method = methodMap[key])) continue;
          if (this.operation) throw new InvalidPatchError();
          if ((member = operationMembers[key]) && !patch[member]) {
            throw new InvalidPatchError("Patch member " + member + " not defined");
          }
          this.operation = methodMap[key];
          this.pointer = new JSONPointer(patch[key]);
          this.supplement = patch[member];
        }
        if (!this.operation) throw new InvalidPatchError();
      }

      JSONPatch.prototype.apply = function(obj) {
        return this.operation(obj, this.pointer, this.supplement);
      };

      return JSONPatch;

    })();
    add = function(root, pointer, value) {
      var acc, obj;
      obj = pointer.getObject(root);
      acc = pointer.accessor;
      if (isArray(obj)) {
        acc = parseInt(acc, 10);
        if (acc < 0 || acc > obj.length) {
          throw new PatchConflictError("Index " + acc + " out of bounds");
        }
        obj.splice(acc, 0, value);
      } else {
        if (hasOwnProperty.call(obj, acc)) {
          throw new PatchConflictError("Value at " + acc + " exists");
        }
        obj[acc] = value;
      }
    };
    remove = function(root, pointer) {
      var acc, obj;
      obj = pointer.getObject(root);
      acc = pointer.accessor;
      if (isArray(obj)) {
        acc = parseInt(acc, 10);
        if (!hasOwnProperty.call(obj, acc)) {
          throw new PatchConflictError("Value at " + acc + " does not exist");
        }
        obj.splice(acc, 1);
      } else {
        if (!hasOwnProperty.call(obj, acc)) {
          throw new PatchConflictError("Value at " + acc + " does not exist");
        }
        delete obj[acc];
      }
    };
    replace = function(root, pointer, value) {
      var acc, obj;
      obj = pointer.getObject(root);
      acc = pointer.accessor;
      if (isArray(obj)) {
        acc = parseInt(acc, 10);
        if (!hasOwnProperty.call(obj, acc)) {
          throw new PatchConflictError("Value at " + acc + " does not exist");
        }
        obj.splice(acc, 1, value);
      } else {
        if (!hasOwnProperty.call(obj, acc)) {
          throw new PatchConflictError("Value at " + acc + " does not exist");
        }
        obj[acc] = value;
      }
    };
    test = function(root, pointer, value) {
      var acc, obj;
      obj = pointer.getObject(root);
      acc = pointer.accessor;
      if (isArray(obj)) acc = parseInt(acc, 10);
      return isEqual(obj[acc], value);
    };
    move = function(root, from, to) {
      var acc, obj, value;
      obj = from.getObject(root);
      acc = from.accessor;
      if (isArray(obj)) {
        acc = parseInt(acc, 10);
        if (!hasOwnProperty.call(obj, acc)) {
          throw new PatchConflictError("Value at " + acc + " does not exist");
        }
        value = obj.splice(acc, 1);
      } else {
        if (!hasOwnProperty.call(obj, acc)) {
          throw new PatchConflictError("Value at " + acc + " does not exist");
        }
        value = obj[acc];
        delete obj[acc];
      }
      to = new JSONPointer(to);
      obj = to.getObject(root);
      acc = to.accessor;
      if (isArray(obj)) {
        acc = parseInt(acc, 10);
        if (acc < 0 || acc > obj.length) {
          throw new PatchConflictError("Index " + acc + " out of bounds");
        }
        obj.splice(acc, 0, value);
      } else {
        if (hasOwnProperty.call(obj, acc)) {
          throw new PatchConflictError("Value at " + acc + " exists");
        }
        obj[acc] = value;
      }
    };
    methodMap = {
      add: add,
      remove: remove,
      replace: replace,
      move: move,
      test: test
    };
    operationMembers = {
      add: 'value',
      remove: null,
      replace: 'value',
      test: 'value',
      move: 'to'
    };
    apply = function(root, patchDocument) {
      return compile(patchDocument)(root);
    };
    compile = function(patchDocument) {
      var operations, patch, _i, _len;
      operations = [];
      for (_i = 0, _len = patchDocument.length; _i < _len; _i++) {
        patch = patchDocument[_i];
        operations.push(new JSONPatch(patch));
      }
      return function(root) {
        var op, result, _j, _len2;
        for (_j = 0, _len2 = operations.length; _j < _len2; _j++) {
          op = operations[_j];
          result = op.apply(root);
        }
        return result;
      };
    };
    exports.apply = apply;
    exports.compile = compile;
    exports.PatchApplyError = PatchApplyError;
    return exports.PatchConflictError = PatchConflictError;
  });

}).call(this);
