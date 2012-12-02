# jsonpatch.js

Library to apply JSON Patches in JavaScript
http://tools.ietf.org/html/draft-ietf-appsawg-json-patch-03

jsonpatch.js works as in the browser as a script, as a Node module and as an
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

For convenience, `jsonpatch.apply` can take a patch as an object
or an array of objects. The spec states the latter as being the official
patch syntax.

Note: all operations are applied in-place.

## Methods

**`jsonpatch.apply(document, patch)`**

:   Applies a patch to the document

**`jsonpatch.compile(patch)`**

:   Compiles a patch and returns a function that takes a document to apply the patch to.

## Patch Operations

### Add

Patch syntax: `{add: <path>, value: <value>}`

```javascript
// Add property, result: {foo: 'bar'}
jsonpatch.apply({}, [{add: '/foo', value: 'bar'}]);

// Add array element, result: {foo: [1, 2, 3]}
jsonpatch.apply({foo: [1, 3]}, [{add: '/foo/1', value: 2}]);

// Complex, result: {foo: [{bar: 'baz'}]}
jsonpatch.apply({foo: [{}]}, [{add: '/foo/0/bar', value: 'baz'}]);
```

### Remove

Patch syntax: `{remove: <path>}`

```javascript
// Remove property, result: {}
jsonpatch.apply({foo: 'bar'}, [{remove: '/foo'}]);

// Remove array element, result: {foo: [1, 3]}
jsonpatch.apply({foo: [1, 2, 3]}, [{remove: '/foo/1'}]);

// Complex, result: {foo: [{}]}
jsonpatch.apply({foo: [{bar: 'baz'}]}, [{remove: '/foo/0/bar'}]);
```

### Replace

Patch syntax: `{replace: <path>, value: <value>}`

```javascript
// Replace property, result: {foo: 1}
jsonpatch.apply({foo: 'bar'}, [{replace: '/foo', value: 1}]);

// Repalce array element, result: {foo: [1, 4, 3]}
jsonpatch.apply({foo: [1, 2, 3]}, [{replace: '/foo/1', value: 4}]);

// Complex, result: {foo: [{bar: 1}]}
jsonpatch.apply({foo: [{bar: 'baz'}]}, [{replace: '/foo/0/bar', value: 1}]);
```

### Move

Patch syntax: `{move: <path>, to: <path>}`

```javascript
// Move property, result {bar: [1, 2, 3]}
jsonpatch.apply({foo: [1, 2, 3]}, [{move: '/foo', to: '/bar'}]);
```

### Copy

Patch syntax: `{copy: <path>, to: <path>}`

```javascript
// Copy property, result {foo: [1, 2, 3], bar: 2}
jsonpatch.apply({foo: [1, 2, 3]}, [{copy: '/foo/1', to: '/bar'}]);
```

### Test

Patch syntax: `{test: <path>, value: <value>}`

```javascript
// Test property, result: true
jsonpatch.apply({foo: 'bar'}, [{test: '/foo', value: 'bar'}]
```

## Error Types

**`JSONPatchError`**

:   Base error type which all patch errors extend from.

**`InvalidPatchError`**

:   Thrown when the patch itself has an invalid syntax.

**`PatchConflictError`**

:   Thrown when there is a conflic with applying the patch to the document.


