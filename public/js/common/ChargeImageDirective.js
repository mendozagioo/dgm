'use strict';

define(function () {
  return function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.bind('load', function () {
          element.removeClass('loading-content');
        });
        element.bind('error', function () {
          // alert('image could not be loaded');
        });
      }
    };
  }
});