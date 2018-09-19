'use strict';

define(function () {
  return function($scope) {
    var $ = angular.element;

    // Activa los tooltips
    $('[data-toggle="tooltip"]').tooltip();
    $('#calendar').datepicker();
    $('#calendarYear').datepicker({changeYear: true});

    // Desabilita la propagación de todos los anchors de panel
    $('.panel a').on('click', function(e) { e.preventDefault() });

    // Crea la animación del scroll para el submenú
    $('.right-side-menu a').on('click', function(e) {
      var _selected = $(this).attr('href');
  
      if (_selected === '#objetivo') {
        $('html, body').animate({scrollTop:0}, 700);
      } else {
        $('html, body').animate({
          scrollTop: $(_selected).offset().top - 125
        }, 500);
      }
    });
  }
});