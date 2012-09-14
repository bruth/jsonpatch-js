var obj, compiled;

// QUnit
test('general', function() {
    raises(function() {
        jsonpatch.apply({}, [{foo: '/bar'}]);
    }, jsonpatch.InvalidPatchError, 'Bad operation');

    raises(function() {
        jsonpatch.apply({}, [{add: ''}]);
    }, jsonpatch.InvalidPatchError, 'Path must start with a /');
});

test('add', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

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

    raises(function() {
        jsonpatch.apply(obj, [{add: '/bar/8', value: undefined}]);
    }, jsonpatch.InvalidPatchError, 'Patch member value not defined');

    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{add: '/bar', value: true}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}], bar: true});

    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{add: '/bar', value: false}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}], bar: false});

    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{add: '/bar', value: null}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}], bar: null});
});


test('remove', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    jsonpatch.apply(obj, [{remove: '/bar'}]);
    deepEqual(obj, {foo: 1, baz: [{qux: 'hello'}]});

    jsonpatch.apply(obj, [{remove: '/baz/0/qux'}]);
    deepEqual(obj, {foo: 1, baz: [{}]});
});


test('replace', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

    jsonpatch.apply(obj, [{replace: '/foo', value: [1, 2, 3, 4]}]);
    deepEqual(obj, {foo: [1, 2, 3, 4], baz: [{qux: 'hello'}]});

    jsonpatch.apply(obj, [{replace: '/baz/0/qux', value: 'world'}]);
    deepEqual(obj, {foo: [1, 2, 3, 4], baz: [{qux: 'world'}]});
});


test('test', function() {
    obj = {foo: {bar: [1, 2, 5, 4]}};
    ok(jsonpatch.apply(obj, [{test: '/foo', value: {bar: [1, 2, 5, 4]}}]));
    ok(!jsonpatch.apply(obj, [{test: '/foo', value: [1, 2]}]));
});


test('move', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};

    jsonpatch.apply(obj, [{move: '/foo', to: '/bar'}]);
    deepEqual(obj, {baz: [{qux: 'hello'}], bar: 1});

    jsonpatch.apply(obj, [{move: '/baz/0/qux', to: '/baz/1'}]);
    deepEqual(obj, {baz: [{}, 'hello'], bar: 1});
});
   

// JSLitmus
JSLitmus.test('Add Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{add: '/bar', value: [1, 2, 3, 4]}]);
});

JSLitmus.test('Remove Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    jsonpatch.apply(obj, [{remove: '/bar'}]);
});

JSLitmus.test('Replace Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{replace: '/foo', value: [1, 2, 3, 4]}]);
});

JSLitmus.test('Move Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    jsonpatch.apply(obj, [{move: '/baz/0', to: '/bar/0'}]);
});

JSLitmus.test('Test Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    jsonpatch.apply(obj, [{test: '/baz', value: [{qux: 'hello'}]}]);
});

var addCompiled = jsonpatch.compile([{add: '/bar', value: [1, 2, 3, 4]}]);
JSLitmus.test('Compiled Add Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    addCompiled(obj);
});

var removeCompiled = jsonpatch.compile([{remove: '/bar'}]);
JSLitmus.test('Compiled Remove Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    removeCompiled(obj);
});

var replaceCompiled = jsonpatch.compile([{replace: '/foo', value: [1, 2, 3, 4]}]);
JSLitmus.test('Compiled Replace Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    replaceCompiled(obj);
});

var moveCompiled = jsonpatch.compile([{move: '/baz/0', to: '/bar/0'}]);
JSLitmus.test('Compiled Move Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}], bar: [1, 2, 3, 4]};
    moveCompiled(obj);
});

var testCompiled = jsonpatch.compile([{test: '/baz', value: [{qux: 'hello'}]}]);
JSLitmus.test('Compiled Test Operation', function() {
    obj = {foo: 1, baz: [{qux: 'hello'}]};
    testCompiled(obj);
});
