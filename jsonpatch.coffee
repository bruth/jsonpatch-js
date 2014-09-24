# jsonpatch.js 0.5.0
# (c) 2011-2012 Byron Ruth
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
        length = stack.length
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
        constructor: (@message='JSON patch error') ->
            @name = 'JSONPatchError'

    class InvalidPointerError extends Error
        constructor: (@message='Invalid pointer') ->
            @name = 'InvalidPointer'

    class InvalidPatchError extends JSONPatchError
        constructor: (@message='Invalid patch') ->
            @name = 'InvalidPatch'

    class PatchConflictError extends JSONPatchError
        constructor: (@message='Patch conflict') ->
            @name = 'PatchConflictError'

    class PatchTestFailed extends Error
        constructor: (@message='Patch test failed') ->
            @name = 'PatchTestFailed'


    escapedSlash = /~1/g
    escapedTilde = /~0/g

    # Spec: http://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-05
    class JSONPointer
        constructor: (path) ->
            steps = []
            # If a path is specified, it must start with a /
            if path and (steps = path.split '/').shift() isnt ''
                throw new InvalidPointerError()

            # Decode each component, decode JSON Pointer specific syntax ~0 and ~1
            for step, i in steps
                steps[i] = step.replace(escapedSlash, '/')
                               .replace(escapedTilde, '~')

            # The final segment is the accessor (property/index) of the object
            # the pointer ultimately references
            @accessor = steps.pop()
            @steps = steps
            @path = path

        # Returns an object with the object reference and the accessor
        getReference: (parent) ->
            for step in @steps
                if isArray parent then step = parseInt(step, 10)
                if step not of parent
                    throw new PatchConflictError('Array location out of
                        bounds or not an instance property')
                parent = parent[step]
            return parent

        # Checks and coerces the accessor relative to the reference
        # object it will be applied to.
        coerce: (reference, accessor) ->
            if isArray(reference)
                if isString(accessor)
                    if accessor is '-'
                        accessor = reference.length
                    else if /^[-+]?\d+$/.test(accessor)
                        accessor = parseInt(accessor, 10)
                    else
                        throw new InvalidPointerError('Invalid array index number')

            return accessor


    # Interface for patch operation classes
    class JSONPatch
        constructor: (patch) ->
            # All patches required a 'path' member
            if 'path' not of patch
                throw new InvalidPatchError()

            # Validates the patch based on the requirements of this operation
            @validate(patch)
            @patch = patch
            # Create the primary pointer for this operation
            @path = new JSONPointer(patch.path)
            # Call for operation-specific setup
            @initialize(patch)

        initialize: ->

        validate: (patch) ->

        apply: (document) -> throw new Error('Method not implemented')


    class AddPatch extends JSONPatch
        validate: (patch) ->
            if 'value' not of patch then throw new InvalidPatchError()

        apply: (document) ->
            reference = @path.getReference(document)
            accessor = @path.accessor
            value = @patch.value

            if isArray(reference)
                accessor = @path.coerce(reference, accessor)
                if accessor < 0 or accessor > reference.length
                    throw new PatchConflictError("Index #{accessor} out of bounds")
                reference.splice(accessor, 0, value)
            else if not accessor?
                document = value
            else
                reference[accessor] = value
            return document


    class RemovePatch extends JSONPatch
        apply: (document) ->
            reference = @path.getReference(document)
            accessor = @path.accessor

            if isArray(reference)
                accessor = @path.coerce(reference, accessor)
                if accessor not of reference
                    throw new PatchConflictError("Value at #{accessor} does not exist")
                reference.splice(accessor, 1)
            else
                if accessor not of reference
                    throw new PatchConflictError("Value at #{accessor} does not exist")
                delete reference[accessor]
            return document


    class ReplacePatch extends JSONPatch
        validate: (patch) ->
            if 'value' not of patch then throw new InvalidPatchError()

        apply: (document) ->
            reference = @path.getReference(document)
            accessor = @path.accessor
            value = @patch.value

            # Replace whole document
            if not accessor?
                return value

            if isArray(reference)
                accessor = @path.coerce(reference, accessor)
                if accessor not of reference
                    throw new PatchConflictError("Value at #{accessor} does not exist")
                reference.splice(accessor, 1, value)
            else
                if accessor not of reference
                    throw new PatchConflictError("Value at #{accessor} does not exist")
                reference[accessor] = value

            return document


    class TestPatch extends JSONPatch
        validate: (patch) ->
            if 'value' not of patch
                throw new InvalidPatchError("'value' member is required")

        apply: (document) ->
            reference = @path.getReference(document)
            accessor = @path.accessor
            value = @patch.value

            if isArray(reference)
                accessor = @path.coerce(reference, accessor)

            if not isEqual(reference[accessor], value)
                throw new PatchTestFailed()

            return document


    class MovePatch extends JSONPatch
        initialize: (patch) ->
            @from = new JSONPointer(patch.from)
            len = @from.steps.length

            within = true
            for i in [0..len]
                if @from.steps[i] isnt @path.steps[i]
                    within = false
                    break

            if within
                if @path.steps.length isnt len
                    throw new InvalidPatchError("'to' member cannot be a descendent of 'path'")
                if @from.accessor is @path.accessor
                    # The path and to pointers reference the same location,
                    # therefore apply can be a no-op
                    @apply = (document) -> document

        validate: (patch) ->
            if 'from' not of patch
                throw new InvalidPatchError("'from' member is required")

        apply: (document) ->
            reference = @from.getReference(document)
            accessor = @from.accessor

            if isArray(reference)
                accessor = @from.coerce(reference, accessor)
                if accessor not of reference
                    throw new PatchConflictError("Value at #{accessor} does not exist")
                value = reference.splice(accessor, 1)[0]
            else
                if accessor not of reference
                    throw new PatchConflictError("Value at #{accessor} does not exist")
                value = reference[accessor]
                delete reference[accessor]

            reference = @path.getReference(document)
            accessor = @path.accessor

            # Add to object
            if isArray(reference)
                accessor = @path.coerce(reference, accessor)
                if accessor < 0 or accessor > reference.length
                    throw new PatchConflictError("Index #{accessor} out of bounds")
                reference.splice(accessor, 0, value)
            else
                if accessor of reference
                    throw new PatchConflictError("Value at #{accessor} exists")
                reference[accessor] = value
            return document


    class CopyPatch extends MovePatch
        apply: (document) ->
            reference = @from.getReference(document)
            accessor = @from.accessor

            if isArray(reference)
                accessor = @from.coerce(reference, accessor)
                if accessor not of reference
                    throw new PatchConflictError("Value at #{accessor} does not exist")
                value = reference.slice(accessor, accessor + 1)[0]
            else
                if accessor not of reference
                    throw new PatchConflictError("Value at #{accessor} does not exist")
                value = reference[accessor]

            reference = @path.getReference(document)
            accessor = @path.accessor

            # Add to object
            if isArray(reference)
                accessor = @path.coerce(reference, accessor)
                if accessor < 0 or accessor > reference.length
                    throw new PatchConflictError("Index #{accessor} out of bounds")
                reference.splice(accessor, 0, value)
            else
                if accessor of reference
                    throw new PatchConflictError("Value at #{accessor} exists")
                reference[accessor] = value
            return document


    # Map of operation classes
    operationMap =
        add: AddPatch
        remove: RemovePatch
        replace: ReplacePatch
        move: MovePatch
        copy: CopyPatch
        test: TestPatch


    # Validates and compiles a patch document and returns a function to apply
    # to multiple documents
    compile = (patch) ->
        if not isArray(patch)
            if isObject(path)
                patch = [patch]
            else
                throw new InvalidPatchError('patch must be an object or array')

        ops = []

        for p in patch
            # Not a valid operation
            if not (klass = operationMap[p.op])
                throw new InvalidPatchError('invalid operation: ' + p.op)

            ops.push new klass(p)

        return (document) ->
            result = document

            for op in ops
                result = op.apply(document)

            return result


    # Applies a patch to a document
    apply = (document, patch) ->
        compile(patch)(document)


    # Export to root
    root.apply = apply
    root.compile = compile
    root.JSONPointer = JSONPointer
    root.JSONPatch = JSONPatch
    root.JSONPatchError = JSONPatchError
    root.InvalidPointerError = InvalidPointerError
    root.InvalidPatchError = InvalidPatchError
    root.PatchConflictError = PatchConflictError
    root.PatchTestFailed = PatchTestFailed

    return root
