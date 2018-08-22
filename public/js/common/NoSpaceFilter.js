'use strict';

define( function () {
    return function () {
        return function ( _value ) {
            return !_value ? '' : _value.replace( / /g, '' );
        };
    };
});