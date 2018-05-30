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

        $scope.ignoreAccents = function(item) {          
            var text = $scope.removeAccents(item.toString()); 
            window.location.href = "https://datos.gob.mx/busca/dataset?theme="+text;
        };

        $scope.removeAccents = function(value) {
          return value.toString()
              .replace(/á/g, '%C3%A1')    
              .replace(/é/g, '%C3%A9')
              .replace(/í/g, '%C3%AD')
              .replace(/ó/g, '%C3%B3')
              .replace(/ú/g, '%C3%BA');
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

