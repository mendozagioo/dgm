'use strict';

define(function() {
  return function($scope, events, Categories) {
    $scope.configCover = {
      fileName: 'cover_photo',
      url: 'cms-api/categories'
    };
    $scope.configGrid = {
      fileName: 'grid_photo',
      url: 'cms-api/categories'
    };
    $scope.category = {
      name: ''
    };
    $scope.create = function() {
      Categories.create($scope.category);
    };
    $scope.sections = Categories.query({
      page: 1,
      per_page: 9999,
      type: 'SECTION'
    });

    $scope.$on(events.FILEUPLOADER_DONE, function(e, data) {
      $scope.category[Object.keys(data)[0]] = data[Object.keys(data)[0]];
    });
    $scope.$on('CREATE_CATEGORY', function() {
      $scope.create();
    });
    $scope.$on(Categories.getEvent('CREATED'), function() {
      $scope.$state.go('categories.list');
    });
    $scope.$watch('category.name', function(_name) {
      $scope.category.slug = slug($scope.category.name, {
        lower: true
      });
    });
  };
});
