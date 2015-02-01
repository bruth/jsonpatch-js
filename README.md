# jsonpatch-js

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/bruth/jsonpatch-js/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

Library to apply JSON Patches in JavaScript

- JSON Patch - http://tools.ietf.org/html/rfc6902
- JSON Pointer - http://tools.ietf.org/html/rfc6901

jsonpatch-js works as in the browser as a script, as a Node module and as an
AMD module.

## Install

**Bower**

```
bower install json-patch
```

**NPM**

```
npm install json-patch
```

**Note: at this time, all operations are applied in-place.**

## Methods

**`jsonpatch.apply(document, patch)`**

Applies a patch to the document

**`jsonpatch.compile(patch)`**

Compiles a patch and returns a function that takes a document to apply the patch to.

## Patch Operations

### Add

Patch syntax: `{op: 'add', path: <path>, value: <value>}`

```javascript
// Add property, result: {foo: 'bar'}
jsonpatch.apply({}, [{op: 'add', path: '/foo', value: 'bar'}]);

// Add array element, result: {foo: [1, 2, 3]}
jsonpatch.apply({foo: [1, 3]}, [{op: 'add', path: '/foo/1', value: 2}]);

// Complex, result: {foo: [{bar: 'baz'}]}
jsonpatch.apply({foo: [{}]}, [{op: 'add', path: '/foo/0/bar', value: 'baz'}]);
```

### Remove

Patch syntax: `{op: 'remove', path: <path>}`

```javascript
// Remove property, result: {}
jsonpatch.apply({foo: 'bar'}, [{op: 'remove', path: '/foo'}]);

// Remove array element, result: {foo: [1, 3]}
jsonpatch.apply({foo: [1, 2, 3]}, [{op: 'remove', path: '/foo/1'}]);

// Complex, result: {foo: [{}]}
jsonpatch.apply({foo: [{bar: 'baz'}]}, [{op: 'remove', path: '/foo/0/bar'}]);
```

### Replace

Patch syntax: `{op: 'replace', path: <path>, value: <value>}`

```javascript
// Replace property, result: {foo: 1}
jsonpatch.apply({foo: 'bar'}, [{op: 'replace', path: '/foo', value: 1}]);

// Replace array element, result: {foo: [1, 4, 3]}
jsonpatch.apply({foo: [1, 2, 3]}, [{op: 'replace', path: '/foo/1', value: 4}]);

// Complex, result: {foo: [{bar: 1}]}
jsonpatch.apply({foo: [{bar: 'baz'}]}, [{op: 'replace', path: '/foo/0/bar', value: 1}]);
```

### Move

Patch syntax: `{op: 'move', from: <path>, path: <path>}`

```javascript
// Move property, result {bar: [1, 2, 3]}
jsonpatch.apply({foo: [1, 2, 3]}, [{op: 'move', from: '/foo', path: '/bar'}]);
```

### Copy

Patch syntax: `{op: 'copy', from: <path>, path: <path>}`

```javascript
// Copy property, result {foo: [1, 2, 3], bar: 2}
jsonpatch.apply({foo: [1, 2, 3]}, [{op: 'copy', from: '/foo/1', path: '/bar'}]);
```

### Test

Patch syntax: `{op: 'test', path: <path>, value: <value>}`

```javascript
// Test equality of property to value, result: true
jsonpatch.apply({foo: 'bar'}, [{op: 'test', path: '/foo', value: 'bar'}]
```

*Changed in 0.5.0*

The return value is no longer a boolean, but now the the document itself which adheres correctly to the specification. It the test fails, a `PatchTestFailed` error will be thrown.

## Error Types

**`JSONPatchError`**

Base error type which all patch errors extend from.

**`InvalidPointerError`**

Thrown when the pointer is invalid.

**`InvalidPatchError`**

Thrown when the patch itself has an invalid syntax.

**`PatchConflictError`**

Thrown when there is a conflic with applying the patch to the document.

**`PatchTestFailed`**

Thrown when a test operation is applied and fails.
