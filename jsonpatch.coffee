# jsonpatch.js 0.2.2
# (c) 2011 Byron Ruth
# jsonpatch may be freely distributed under the BSD license

((root, factory) ->
    if typeof exports isnt 'undefined'
        # Node/CommonJS
        factory(root, exports)
    else if typeof define is 'function' and define.amd
        # AMD
        define ['exports'], (exports) ->
            root.jsonpatch = factory(root, exports)
    else
        # Browser globals
        root.jsonpatch = factory(root, {})
) @, (root) ->

    # Utilities
    toString = Object.prototype.toString
    hasOwnProperty = Object.prototype.hasOwnProperty

    # Define a few helper functions taken from the awesome underscore library
    isArray = (obj) -> toString.call(obj) is '[object Array]'
    isObject = (obj) -> toString.call(obj) is '[object Object]'
    isString = (obj) -> toString.call(obj) is '[object String]'

    # Limited Underscore.js implementation, internal recursive comparison function.
    _isEqual = (a, b, stack) ->
        # Identical objects are equal. `0 === -0`, but they aren't identical.
        # See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
        if a is b then return a isnt 0 or 1 / a == 1 / b
        # A strict comparison is necessary because `null == undefined`.
        if a == null or b == null then return a is b
        # Compare `[[Class]]` names.
        className = toString.call(a)
        if className isnt toString.call(b) then return false
        switch className
            # Strings, numbers, and booleans are compared by value.
            when '[object String]'
                # Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                # equivalent to `new String("5")`.
                String(a) is String(b)
            when '[object Number]'
                a = +a
                b = +b
                # `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
                # other numeric values.
                if a isnt a
                    b isnt b
                else
                    if a is 0
                        1 / a is 1 / b
                    else
                        a is b
            when '[object Boolean]'
                # Coerce dates and booleans to numeric primitive values. Dates are compared by their
                # millisecond representations. Note that invalid dates with millisecond representations
                # of `NaN` are not equivalent.
                +a is +b

        if typeof a isnt 'object' or typeof b isnt 'object' then return false
        # Assume equality for cyclic structures. The algorithm for detecting cyclic
        # structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
        length = stack.length;
        while length--
            # Linear search. Performance is inversely proportional to the number of
            # unique nested structures.
            if stack[length] is a then return true

        # Add the first object to the stack of traversed objects.
        stack.push(a)
        size = 0
        result = true
        # Recursively compare objects and arrays.
        if className is '[object Array]'
            # Compare array lengths to determine if a deep comparison is necessary.
            size = a.length
            result = size is b.length
            if result
                # Deep compare the contents, ignoring non-numeric properties.
                while size--
                    # Ensure commutative equality for sparse arrays.
                    if not (result = size in a is size in b and _isEqual(a[size], b[size], stack)) then break
        else
            # Objects with different constructors are not equivalent.
            if "constructor" in a isnt "constructor" in b or a.constructor isnt b.constructor then return false
            # Deep compare objects.
            for key of a
                if hasOwnProperty.call(a, key)
                    # Count the expected number of properties.
                    size++
                    # Deep compare each member.
                    if not (result = hasOwnProperty.call(b, key) and _isEqual(a[key], b[key], stack)) then break

            # Ensure that both objects contain the same number of properties.
            if result
                for key of b
                    if hasOwnProperty.call(b, key) and not size-- then break
                result = not size
        # Remove the first object from the stack of traversed objects.
        stack.pop()
        return result

    # Perform a deep comparison to check if two objects are equal.
    isEqual = (a, b) -> _isEqual(a, b, [])


    # Various error constructors
    class JSONPatchError extends Error
        constructor: (message) ->
            @name = 'JSONPatchError'
            @message = message or 'JSON patch error'

    class InvalidPatchError extends JSONPatchError
        constructor: (message) ->
            @name = 'InvalidPatch'
            @message = message or 'Invalid patch'

    class PatchConflictError extends JSONPatchError
        constructor: (message) ->
            @name = 'PatchConflictError'
            @message = message or 'Patch conflict'


    # Spec: http://tools.ietf.org/html/draft-pbryan-zyp-json-pointer-02
    class JSONPointer
        constructor: (path, shouldExist=true) ->
            # If a path is specified, it must start with a /
            if path and (steps = path.split '/').shift() isnt ''
                throw new InvalidPatchError()

            # Decode each component
            for loc, i in steps
                steps[i] = decodeURIComponent(loc)

            # The final segment is the accessor (property/index) of the object
            # the pointer ultimately references
            @accessor = steps.pop()
            @path = steps

        # Returns a reference of the object that the pointer represents
        getObject: (obj) ->
            for loc in @path
                if isArray obj then loc = parseInt(loc, 10)
                if loc not of obj
                    throw new PatchConflictError('Array location out of bounds or not an instance property')
                obj = obj[loc]
            return obj


    class JSONPatch
        constructor: (patch) ->
            for key of patch
                # Ensure this is a valid operation
                if not (method = methodMap[key]) then continue
                # A patch operation has already been defined
                if @operation then throw new InvalidPatchError()
                # If a supplementary member is required (not null), ensure it exists
                if (member = operationMembers[key]) and patch[member] is undefined
                    throw new InvalidPatchError("Patch member #{member} not defined")

                # Store reference to operation function
                @operation = methodMap[key]
                # This will always be a pointer
                @pointer = new JSONPointer(patch[key])

                supp = patch[member]
                if (preproc = memberProcessors[key])
                    supp = preproc(supp)
                @supplement = supp

            if not @operation then throw new InvalidPatchError()

        apply: (obj) -> @operation(obj, @pointer, @supplement)

    # Patch functions
    add = (root, pointer, value) ->
        obj = pointer.getObject(root)
        acc = pointer.accessor

        if isArray(obj)
            acc = parseInt(acc, 10)
            if acc < 0 or acc > obj.length
                throw new PatchConflictError("Index #{acc} out of bounds")
            obj.splice(acc, 0, value)
        else
            if acc of obj
                throw new PatchConflictError("Value at #{acc} exists")
            obj[acc] = value
        return

    remove = (root, pointer) ->
        obj = pointer.getObject(root)
        acc = pointer.accessor

        if isArray(obj)
            acc = parseInt(acc, 10)
            if acc not of obj
                throw new PatchConflictError("Value at #{acc} does not exist")
            obj.splice(acc, 1)
        else
            if acc not of obj
                throw new PatchConflictError("Value at #{acc} does not exist")
            delete obj[acc]
        return

    replace = (root, pointer, value) ->
        obj = pointer.getObject(root)
        acc = pointer.accessor

        if isArray(obj)
            acc = parseInt(acc, 10)
            if acc not of obj
                throw new PatchConflictError("Value at #{acc} does not exist")
            obj.splice(acc, 1, value)
        else
            if acc not of obj
                throw new PatchConflictError("Value at #{acc} does not exist")
            obj[acc] = value
        return


    test = (root, pointer, value) ->
        obj = pointer.getObject(root)
        acc = pointer.accessor

        if isArray(obj)
            acc = parseInt(acc, 10)
        return isEqual(obj[acc], value)


    move = (root, from, to) ->
        # Get value
        obj = from.getObject(root)
        acc = from.accessor

        if isArray(obj)
            acc = parseInt(acc, 10)
            if acc not of obj
                throw new PatchConflictError("Value at #{acc} does not exist")
            value = obj.splice(acc, 1)[0]
        else
            if acc not of obj
                throw new PatchConflictError("Value at #{acc} does not exist")
            value = obj[acc]
            delete obj[acc]

        obj = to.getObject(root)
        acc = to.accessor

        # Add to object
        if isArray(obj)
            acc = parseInt(acc, 10)
            if acc < 0 or acc > obj.length
                throw new PatchConflictError("Index #{acc} out of bounds")
            obj.splice(acc, 0, value)
        else
            if acc of obj
                throw new PatchConflictError("Value at #{acc} exists")
            obj[acc] = value
        return

    
    # Map of API functions
    methodMap =
        add: add
        remove: remove
        replace: replace
        move: move
        test: test

    # Map of operations and their supplemtary member
    operationMembers =
        add: 'value'
        remove: null
        replace: 'value'
        test: 'value'
        move: 'to'

    # Map of operation member pre-processors
    memberProcessors =
        move: (to) -> new JSONPointer(to)

    apply = (root, patchDocument) ->
        compile(patchDocument)(root)

    compile = (patchDocument) ->
        operations = []
        for patch in patchDocument
            operations.push new JSONPatch(patch)

        return (root) ->
            for op in operations
                result = op.apply(root)
            return result

    # Export to root
    root.apply = apply
    root.compile = compile
    root.JSONPatchError = JSONPatchError
    root.InvalidPatchError = InvalidPatchError
    root.PatchConflictError = PatchConflictError
    return root
