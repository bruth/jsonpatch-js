// QUnit
test('general', function() {
    raises(function() {
        jsonpatch.apply({}, [{foo: '/bar'}]);
    }, jsonpatch.PatchApplyError, 'Bad operation');

    raises(function() {
        jsonpatch.apply({}, [{add: ''}]);
    }, jsonpatch.PatchApplyError, 'Path must start with a /');

    var obj = {};
    raises(function() {
        jsonpatch.apply(obj, [{add: '/foo', value: 'bar'}, {add: '/bar/0', value: 'baz'}]);
    }, jsonpatch.PatchConflictError, 'Failed patch');

    deepEqual(obj, {}, 'Object has not changed during partial patching');
});

test('add', function() {
    var obj = {foo: 1, baz: [{qux: 'hello'}]};

    jsonpatch.apply(obj, [{add: '/bar', value: [1, 2, 3, 4]}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]});

    jsonpatch.apply(obj, [{add: '/baz/0/foo', value: 'world'}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello', foo: 'world'}], bar: [1, 2, 3, 4]});

    raises(function() {
        jsonpatch.apply(obj, [{add: '/bar/8', value: '5'}]);
    }, jsonpatch.PatchConflictError, 'Out of bounds (upper)');

    raises(function() {
        jsonpatch.apply(obj, [{add: '/bar/-1', value: '5'}]);
    }, jsonpatch.PatchConflictError, 'Out of bounds (lower)');
});


test('remove', function() {
    var obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    jsonpatch.apply(obj, [{remove: '/bar'}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}]});

    jsonpatch.apply(obj, [{remove: '/baz/0/qux'}]);
    deepEqual(obj, {foo: 1, baz: [{}]});
});


test('replace', function() {
    var obj = {foo: 1, baz: [{qux: 'hello'}]};

    jsonpatch.apply(obj, [{replace: '/foo', value: [1, 2, 3, 4]}]);
    deepEqual(obj, {foo: [1, 2, 3, 4], baz: [{qux: 'hello'}]});

    jsonpatch.apply(obj, [{replace: '/baz/0/qux', value: 'world'}]);
    deepEqual(obj, {foo: [1, 2, 3, 4], baz: [{qux: 'world'}]});
});


// JSLitmus
JSLitmus.test('Add Operation', function() {
    var obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{add: '/bar', value: [1, 2, 3, 4]}]);
});

JSLitmus.test('Remove Operation', function() {
    var obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    jsonpatch.apply(obj, [{remove: '/bar'}]);
});

JSLitmus.test('Replace Operation', function() {
    var obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{replace: '/foo', value: [1, 2, 3, 4]}]);
});

JSLitmus.test('@dharmafly - Add Operation', function() {
    var obj = {foo: 1, baz: [{qux: 'hello'}]};
    djsonpatch.apply_patch(obj, [{add: '/bar', value: [1, 2, 3, 4]}]);
});

JSLitmus.test('@dharmafly - Remove Operation', function() {
    var obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    djsonpatch.apply_patch(obj, [{remove: '/bar'}]);
});

JSLitmus.test('@dharmafly - Replace Operation', function() {
    var obj = {foo: 1, baz: [{qux: 'hello'}]};
    djsonpatch.apply_patch(obj, [{replace: '/foo', value: [1, 2, 3, 4]}]);
});

var addPatch = new djsonpatch.JSONPatch([{add: '/bar', value: [1, 2, 3, 4]}]);
JSLitmus.test('@dharmafly - Compiled Add Operation', function() {
    var obj = {foo: 1, baz: [{qux: 'hello'}]};
    addPatch.apply(obj);
});

var removePatch = new djsonpatch.JSONPatch([{remove: '/bar'}]);
JSLitmus.test('@dharmafly - Compiled Remove Operation', function() {
    var obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    removePatch.apply(obj);
});

var replacePatch = new djsonpatch.JSONPatch([{replace: '/foo', value: [1, 2, 3, 4]}]);
JSLitmus.test('@dharmafly - Compiled Replace Operation', function() {
    var obj = {foo: 1, baz: [{qux: 'hello'}]};
    replacePatch.apply(obj);
});
