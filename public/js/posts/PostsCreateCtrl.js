'use strict';

define(function() {
  return function($scope, events, Posts, Categories, Users) {
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
    $scope.post = {
      datasets: [''],
      datasets_ext: [''],
      slider_photos: [''],
      name: '',
      section: ''
    };
    $scope.sections = Categories.query({
      page: 1,
      per_page: 99999,
      select: 'name',
      type: 'SECTION'
    });
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

    $scope.create = function() {
      if ($scope.postForm.$valid && $scope.post.author && $scope.post.name && $scope.post.content) {
        console.log('ess', $scope.postForm.$valid);
        $scope.post.author = $scope.post.author.replace(/<br>/g, '');
        $scope.post.content = $scope.post.content.replace(/<br>/g, '');
        $scope.post.name = $scope.post.name.replace(/<br>/g, '');
        $scope.post.slug = slug($scope.post.name, {
          lower: true
        });
        var result = Posts.create($scope.post);
        result.$promise.then(function (data) {
          alert('Registro guardado.')
        },
        function(err) {
          if(err.status === 403) {
            alert('El título del contenido ya existe.');
          }
        });
      } else {
        alert('Datos Incompletos');
      }
    };
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
    });
    $scope.$on(Posts.getEvent('CREATED'), function() {
      $scope.$state.go('posts.list');
    });
    $scope.$on('POST_SAVE', function() {
      $scope.create();
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

    if ($scope.user.type > 1) {
      $scope.post.created_by = $scope.user._id;
    }
  };
});
