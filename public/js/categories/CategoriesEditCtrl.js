'use strict';

define(function() {
  return function($scope, $stateParams, events, Categories) {
    var uploading = false;

    $scope.configCover = {
      fileName: 'cover_photo',
      url: 'cms-api/categories'
    };
    $scope.configGrid = {
      fileName: 'grid_photo',
      url: 'cms-api/categories'
    };
    $scope.category = Categories.get($stateParams.id, true);
    $scope.sections = Categories.query({
      page: 1,
      per_page: 9999,
      type: 'SECTION'
    });
    $scope.create = function() {
      if (!uploading) {
        delete $scope.category.cover_photo;
        delete $scope.category.grid_photo;
      }

      Categories.update($stateParams.id, $scope.category);
    };

    $scope.$on(events.FILEUPLOADER_DONE, function(e, data) {
      $scope.category[Object.keys(data)[0]] = data[Object.keys(data)[0]];

      uploading = true;
      $scope.update();
    });
    $scope.$on(Categories.getEvent('DELETED'), function() {
      $scope.$state.go('categories.list');
    });
    $scope.$on(Categories.getEvent('UPDATED'), function(e, data) {
      if (!uploading) {
        $scope.$state.go('categories.list');
      } else {
        $scope.category.cover_photo = data.cover_photo;
        $scope.category.grid_photo = data.grid_photo;
        uploading = false;
      }
    });
    $scope.$on('REMOVE_CATEGORY', function() {
      Categories.remove($stateParams.id);
    });
    $scope.$on('UPDATE_CATEGORY', function() {
      $scope.create();
    });
    $scope.$watch('category.name', function(_name) {
      if (_name) {
        $scope.category.slug = slug($scope.category.name, {
          lower: true
        });
      }
    });
  };
});
