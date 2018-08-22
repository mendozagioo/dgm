'use strict';

define( function () {
    return function ( $scope, $sce, Categories, Posts ) {
        $scope.trustSrc = function(_src) {
          var url = _src.split("v=");
          var new_url = "https://www.youtube.com/embed/" + url[1];
          return $sce.trustAsResourceUrl(new_url);
        }

        Categories.get( 'desarrolladores' ).$promise.then( function ( data ) {
            Posts.query({
                expanded    : true,
                section     : data._id
            }).$promise.then( function ( posts ) {
                $scope.intro    = _.findWhere( posts, {
                    slug    : 'desarrolladores-intro'
                }).content;

                $scope.catalog  = _.findWhere( posts, {
                    slug    : 'codigo-abierto'
                }).content;

                $scope.cdn_apis = _.filter( posts, function ( el ) {
                    return el.category.slug == 'api-cdn'
                });

                $scope.ext_apis = _.filter( posts, function ( el ) {
                    return el.category.slug == 'api-external'
                });

                $scope.media_dev = _.filter( posts, function ( el ) {
                    return el.category.slug == 'media-desarrolladores'
                });
            });
        });
    };
});
