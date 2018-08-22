'use strict';

define( function () {
    return function () {
        return function ( _value ) {
            var paragraph   = _value.match( /<p[^>]*>(.*?)<\/p>/ )[1];

            return paragraph.replace( /(<([^>]+)>)/ig, '' );
        };
    };
});