jsonpatch.js
============
Library to apply JSON Patches in JavaScript
http://tools.ietf.org/html/draft-pbryan-json-patch-01

Note: all operations are applied in-place.

View tests and litmus: http://bruth.github.com/jsonpatch-js/

Add
---
Patch syntax: ``{add: <path>, value: <value>}``

```javascript
// Add property, result: {foo: 'bar'}
jsonpatch.apply({}, [{add: '/foo', value: 'bar'}]);

// Add array element, result: {foo: [1, 2, 3]}
jsonpatch.apply({foo: [1, 3]}, [{add: '/foo/1', value: 2}]);

// Complex, result: {foo: [{bar: 'baz'}]}
jsonpatch.apply({foo: [{}]}, [{add: '/foo/0/bar', value: 'baz'}]);
```

Remove
------
Patch syntax: ``{remove: <path>}``

```javascript
// Remove property, result: {}
jsonpatch.apply({foo: 'bar'}, [{remove: '/foo'}]);

// Remove array element, result: {foo: [1, 3]}
jsonpatch.apply({foo: [1, 2, 3]}, [{remove: '/foo/1'}]);

// Complex, result: {foo: [{}]}
jsonpatch.apply({foo: [{bar: 'baz'}]}, [{remove: '/foo/0/bar'}]);
```

Replace
------
Patch syntax: ``{replace: <path>, value: <value>}``

```javascript
// Replace property, result: {foo: 1}
jsonpatch.apply({foo: 'bar'}, [{replace: '/foo', value: 1}]);

// Repalce array element, result: {foo: [1, 4, 3]}
jsonpatch.apply({foo: [1, 2, 3]}, [{replace: '/foo/1', value: 4}]);

// Complex, result: {foo: [{bar: 1}]}
jsonpatch.apply({foo: [{bar: 'baz'}]}, [{replace: '/foo/0/bar', value: 1}]);
```
