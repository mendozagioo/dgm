'use strict';

define(function() {
  return function($scope, $stateParams, events, Posts, Categories, Users) {
    var uploading = false;

    Categories.query({
      page: 1,
      per_page: 99999,
      select: 'name',
      type: 'SECTION'
    }).$promise.then(function(data) {
      $scope.sections = data;
      $scope.post = Posts.get($stateParams.id);
    });

    $scope.configCover = {
      fileName: 'cover_photo',
      url: 'cms-api/posts'
    };
    $scope.configGallery = {
      fileName: 'slider_photos',
      url: 'cms-api/posts'
    };
    $scope.configGrid = {
      fileName: 'grid_photo',
      url: 'cms-api/posts'
    };
    $scope.dpOpen = false;
    $scope.dpOptions = {
      showWeeks: false
    };
    $scope.tags = Categories.query({
      page: 1,
      per_page: 99999,
      select: 'name',
      type: 'TAG'
    });
    $scope.authors = Users.query({
      page: 1,
      per_page: 9999,
      type: {
        $gte: 1
      }
    });

    $scope.datasetAdd = function() {
      $scope.post.datasets.push('');
    };
    $scope.datasetRemove = function(i) {
      $scope.post.datasets.splice(i, 1);
    };
    $scope.datasetExtAdd = function() {
      $scope.post.datasets_ext.push('');
    };
    $scope.datasetExtRemove = function(i) {
      $scope.post.datasets_ext.splice(i, 1);
    };
    $scope.photoAdd = function() {
      $scope.post.slider_photos.push('');
    };
    $scope.photoRemove = function() {
      $scope.post.slider_photos.pop();

      delete $scope.post.cover_photo;
      delete $scope.post.grid_photo;
      uploading = true;
      $scope.update();
    };
    $scope.update = function() {
 
      var d = document.createElement('div');
          d.innerHTML = $scope.post.content;   
          if ($scope.postForm.$valid && $scope.post.author && $scope.post.name && d.innerText.trim() !== "") {

              $scope.post.author = $scope.post.author.replace(/<br>/g, '');
              $scope.post.content = $scope.post.content.replace(/<br>/g, '');
              $scope.post.name = $scope.post.name.replace(/<br>/g, '');
              $scope.post.slug = slug($scope.post.name, {
                lower: true
              });

              if (!uploading) {
                delete $scope.post.cover_photo;
                delete $scope.post.grid_photo;
                delete $scope.post.slider_photos;
              }

              var result =  Posts.update($stateParams.id, $scope.post);
              result.$promise.then(function (data) {
                alert('Registro actualizado.')
              },
              function(err) {
                if(err.status === 404) {
                  alert('El título del contenido ya existe.');
                }
              })
      } else {
        alert('Datos Incompletos');
      }  

    };
    $scope.open = function() {
      $scope.dpOpen = true;
    };

    $scope.$on(events.FILEUPLOADER_DONE, function(e, data) {
      if (Object.keys(data)[0] == 'slider_photos') {
        $scope.post.slider_photos[parseInt(data.index)] = data[Object.keys(data)[0]];
      } else {
        $scope.post[Object.keys(data)[0]] = data[Object.keys(data)[0]];
      }

      switch (Object.keys(data)[0]) {
        case 'cover_photo':
          delete $scope.post.grid_photo;
          delete $scope.post.slider_photos;
          break;
        case 'grid_photo':
          delete $scope.post.cover_photo;
          delete $scope.post.slider_photos;
          break;
        case 'slider_photos':
          delete $scope.post.cover_photo;
          delete $scope.post.grid_photo;
          break;
      }

      uploading = true;
    });
    $scope.$on(Posts.getEvent('RETRIEVED'), function() {
      $scope.post.creation_date = new Date($scope.post.creation_date);
      if (!$scope.post.datasets || $scope.post.datasets.length == 0) {
        $scope.post.datasets = [''];
      }

      if (!$scope.post.datasets_ext || $scope.post.datasets_ext.length == 0) {
        $scope.post.datasets_ext = [''];
      }

      if (!$scope.post.slider_photos || $scope.post.slider_photos.length == 0) {
        $scope.post.slider_photos = [''];
      }
    });
    $scope.$on(Posts.getEvent('DELETED'), function(e, data) {
      $scope.$state.go('posts.list');
    });
    $scope.$on(Posts.getEvent('UPDATED'), function(e, data) {
        $scope.post.cover_photo = data.cover_photo;
        $scope.post.grid_photo = data.grid_photo;
        $scope.post.slider_photos = data.slider_photos;
        uploading = false;
        $scope.$state.go('posts.list');
    });
    $scope.$on('POST_REMOVE', function() {
      Posts.remove($stateParams.id);
    });
    $scope.$on('POST_UPDATE', function() {
      $scope.update();
    });
    $scope.$watch('post.section', function(section) {
      if (section) {
        $scope.categories = Categories.query({
          page: 1,
          per_page: 99999,
          section: section,
          select: 'name',
          type: 'CATEGORY'
        });

        for (var i = 0; i < $scope.sections.length; i++) {
          if (section == $scope.sections[i]._id) {
            $scope.sectionName = $scope.sections[i].name;
          }
        }
      }
    });
  };
});
