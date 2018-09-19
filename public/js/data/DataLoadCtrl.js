'use strict';

define(function() {
  return function($scope, $stateParams, CkanService, Datasets, Apis) {
    var downloaded = [
        'concesiones-mineras',
        'directorio-registro-federal-de-las-organizaciones-de-la-sociedad-civil',
        'proyecciones-de-la-poblacion-de-mexico',
        'catalogo-de-centros-de-trabajo',
        'catalogo-de-nucleos-agrarios'
      ],
      query = function(_type) {
        switch (_type) {
          case 0:
            $scope.datasets = Array();
            Apis.query({
              order: 'DESC',
              page: 1,
              per_page: 5,
              sort: 'creation_date',
              type: 'RECOMMENDED'
            }).$promise.then(function(data) {
              for (var i = 0; i < data.length; i++) {
                $scope.datasets.push({
                  link: data[i].link,
                  organization: {
                    title: data[i].organization
                  },
                  name: data[i].title,
                  resources: [{
                    format: data[i].format
                  }],
                  title: data[i].title
                });
              }
            });
          break;
          case 1:
            $scope.datasets = Array();
            Datasets.query({
              order: 'DESC',
              page: 1,
              per_page: 5,
              sort: 'creation_date',
              type: 'RECOMMENDED'
            }).$promise.then(function(data) {
              for (var i = 0; i < data.length; i++) {
                $scope.datasets.push({
                  link: data[i].link,
                  organization: {
                    title: data[i].organization
                  },
                  name: data[i].title,
                  resources: [{
                    format: data[i].format
                  }],
                  title: data[i].title
                });
              }
            });
            break;
          case 2:
            var q = ($stateParams.category) ? 'tags:' + $stateParams.category : '';

            $scope.datasets = CkanService.datasets(q, 5, 'metadata_modified desc');
            break;
          case 3:
            $scope.datasets = Array();
            for (var i = 0; i < downloaded.length; i++) {
              $scope.datasets.push(CkanService.dataset(downloaded[i]));
            }
            break;
        }
      };

    $scope.load = function(e, _type) {
      var el = $(e.currentTarget);
      if (!el.hasClass('active')) {
        $('.active', '.section-data .data-list').removeClass('active');
        el.addClass('active');

        query(_type);
      }
    };
    $scope.select = function(dataset, _link) {
      if (_link) {
        window.open(_link, '_blank');
      } else {
        window.open('busca/dataset/' + dataset, '_blank');
      }
    };

    query(1);
  };
});
