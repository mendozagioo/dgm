'use strict';

define( function () {
    return function ( $scope, $http, Categories ) {

        $scope.numberOrganizations = undefined;
        $scope.numberData = undefined;

        var query       = '';
        $scope.tags     = Categories.query({
            slug        : {
                $ne     : 'nula'
            },
            page        : 1,
            per_page    : 99,
            type        : 'TAG'
        });
        $scope.search   = function () {
            query       = '';
            if ( $scope.keyword ) {
                query   += 'q=' + $scope.keyword + '&';
            }

            if ( $scope.category ) {
                query   += 'tags=' + $scope.category;
            }

            window.open( 'busca/dataset?' + query, '_self' );
        };

        $http.get('https://api.datos.gob.mx/v2/resources?pageSize=1')
        .then(function(response){
          if( response.data.pagination != undefined )
            $scope.numberData = response.data.pagination.total;
        });

        $http.get('https://api.datos.gob.mx/v2/ckan-organizations?pageSize=1 ')
        .then( function( response ) {
          if( response.data.pagination != undefined )
            $scope.numberOrganizations = response.data.pagination.total;
        });
    };
});
