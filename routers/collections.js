var async = require('async'),
  express = require('express'),
  fs = require('fs'),
  jsonfile = require('jsonfile'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  config = require('../config/app'),
  Category = require('../models/category'),
  Post = require('../models/post'),
  User = require('../models/user'),
  nodeZip = require('node-zip'),
  router = express.Router(),
  compressCategories = function(req, zip, settings, cb) {
    var params = JSON.parse(req.query.categories),
      filters = {
        $or: []
      };

    if (params.sections || params.categories || params.tags) {
      if (params.sections == true) {
        filters.$or.push({
          type: 'SECTION'
        });
      }
      if (params.categories == true) {
        filters.$or.push({
          type: 'CATEGORY'
        });
      }
      if (params.tags == true) {
        filters.$or.push({
          type: 'TAG'
        });
      }

      Category.find(filters, function(err, categories) {
        if (err || !categories) {
          cb(true);
        } else {
          var categoriesFile = path.join(config.uploads_tmp_path, 'categories.json');

          jsonfile.writeFile(categoriesFile, categories, {
            spaces: 2
          }, function() {
            zip.file('data/categories.json', fs.readFileSync(categoriesFile));

            for (var i = 0; i < categories.length; i++) {
              if (categories[i].type == 'TAG') {
                if (categories[i].cover_photo && categories[i].cover_photo.path) {
                  zip.file(path.join('data/images/', categories[i].id, categories[i].cover_photo.name), fs.readFileSync(categories[i].cover_photo.path));
                }

                if (categories[i].grid_photo && categories[i].grid_photo.path) {
                  zip.file(path.join('data/images/', categories[i].id, categories[i].grid_photo.name), fs.readFileSync(categories[i].grid_photo.path));
                }
              }
            }

            fs.unlinkSync(categoriesFile);
            cb(null, settings, zip);
          });
        }
      });
    } else {
      settings.categories = false;
      cb(null, settings, zip);
    }
  },
  compressPosts = function(req, zip, settings, cb) {
    var params = JSON.parse(req.query.posts),
      filters = {
        $or: []
      };

    if (params.archived || params.drafts || params.published) {
      if (params.archived == true) {
        filters.$or.push({
          status: 'ARCHIVED'
        });
      }
      if (params.drafts == true) {
        filters.$or.push({
          status: 'DRAFT'
        });
      }
      if (params.published == true) {
        filters.$or.push({
          status: 'PUBLISHED'
        });
      }

      Post.find(filters, function(err, posts) {
        if (err || !posts) {
          cb(true);
        } else {
          var postsFile = path.join(config.uploads_tmp_path, 'posts.json');

          jsonfile.writeFile(postsFile, posts, {
            spaces: 2
          }, function() {
            zip.file('data/posts.json', fs.readFileSync(postsFile));

            for (var i = 0; i < posts.length; i++) {
              if (posts[i].cover_photo && posts[i].cover_photo.path) {
                zip.file(path.join('data/images/', posts[i].id, posts[i].cover_photo.name), fs.readFileSync(posts[i].cover_photo.path));
              }

              if (posts[i].grid_photo && posts[i].grid_photo.path) {
                zip.file(path.join('data/images/', posts[i].id, posts[i].grid_photo.name), fs.readFileSync(posts[i].grid_photo.path));
              }

              if (posts[i].slider_photos && Array.isArray(posts[i].slider_photos)) {
                for (var j = 0; j < posts[i].slider_photos.length; j++) {
                  if (posts[i].slider_photos[j] && posts[i].slider_photos[j].path) {
                    zip.file(path.join('data/images/', posts[i].id, posts[i].slider_photos[j].name), fs.readFileSync(posts[i].slider_photos[j].path));
                  }
                }
              }
            }

            fs.unlinkSync(postsFile);
            cb(null, settings, zip);
          });
        }
      });
    } else {
      settings.posts = false;
      cb(null, settings, zip);
    }
  },
  compressUsers = function(req, zip, settings, cb) {
    var params = JSON.parse(req.query.users),
      filters = {
        $or: []
      };

    if (params.admin || params.author || params.editor || params.super) {
      if (params.admin == true) {
        filters.$or.push({
          type: 1
        });
      }
      if (params.author == true) {
        filters.$or.push({
          type: 3
        });
      }
      if (params.editor == true) {
        filters.$or.push({
          type: 2
        });
      }
      if (params.super == true) {
        filters.$or.push({
          type: 0
        });
      }

      User.find(filters, function(err, users) {
        if (err || !users) {
          cb(true);
        } else {
          var usersFile = path.join(config.uploads_tmp_path, 'users.json');

          jsonfile.writeFile(usersFile, users, {
            spaces: 2
          }, function() {
            zip.file('data/users.json', fs.readFileSync(usersFile));

            fs.unlinkSync(usersFile);
            cb(null, settings, zip);
          });
        }
      });
    } else {
      settings.users = false;
      cb(null, settings, zip);
    }
  },
  loadCategories = function(req, zip, cb) {
    var filePath = path.join(config.uploads_tmp_path, 'categories_import.json'),
      file = fs.writeFileSync(filePath, zip.files['data/categories.json']._data, 'binary'),
      categories = jsonfile.readFileSync(filePath),
      ids = Array(),
      photos = Array();
    fs.unlinkSync(filePath);

    for (var i = 0; i < categories.length; i++) {
      ids.push({
        original: categories[i]._id
      });

      photos.push({
        cover_photo: categories[i].cover_photo,
        grid_photo: categories[i].grid_photo
      });

      delete categories[i]._id;
      delete categories[i].cover_photo;
      delete categories[i].grid_photo;
    }

    Category.create(categories, function(err, records) {
      if (err) {
        err = new Error('Invalid categories data');
        err.status = 403;

        cb(err);
      } else {
        for (var j = 0; j < records.length; j++) {
          ids[j].created = records[j].id;
        }

        var k = 0;
        async.each(records, function(category, done) {
          if (category.type == 'TAG') {
            var dir = path.join(config.uploads_path, category.id);
            mkdirp.sync(dir);

            if (photos[k].cover_photo != undefined) {
              fs.writeFileSync(path.join(dir, photos[k].cover_photo.name), zip.files['data/images/' + ids[k].original + '/' + photos[k].cover_photo.name]._data, 'binary');
              category.cover_photo = {
                path: path.join(dir, photos[k].cover_photo.name),
                name: photos[k].cover_photo.name
              };
            }

            if (photos[k].grid_photo != undefined) {
              fs.writeFileSync(path.join(dir, photos[k].grid_photo.name), zip.files['data/images/' + ids[k].original + '/' + photos[k].grid_photo.name]._data, 'binary');
              category.grid_photo = {
                path: path.join(dir, photos[k].grid_photo.name),
                name: photos[k].grid_photo.name
              };
            }

            k++;
            category.save(function() {
              done(null);
            });
          } else {
            k++;
            done(null);
          }
        }, function(err) {
          cb(null, ids);
        });
      }
    });
  },
  loadPosts = function(req, zip, usersIds, categoriesIds, cb) {
    var filePath = path.join(config.uploads_tmp_path, 'posts_import.json'),
      file = fs.writeFileSync(filePath, zip.files['data/posts.json']._data, 'binary'),
      posts = jsonfile.readFileSync(filePath),
      ids = Array(),
      photos = Array();
    fs.unlinkSync(filePath);

    for (var i = 0; i < posts.length; i++) {
      var author = false,
        category = false,
        editor = false,
        publisher = false,
        section = false,
        tag = false;

      ids.push(posts[i]._id);
      photos.push({
        cover_photo: posts[i].cover_photo,
        grid_photo: posts[i].grid_photo,
        slider_photos: posts[i].slider_photos
      });

      delete posts[i]._id;
      delete posts[i].cover_photo;
      delete posts[i].grid_photo;
      delete posts[i].slider_photos;

      if (usersIds) {
        for (var j = 0; j < usersIds.length; j++) {
          if (!author && (posts[i].created_by && posts[i].created_by == usersIds[j].original)) {
            posts[i].created_by = usersIds[j].created;
            author = true;
          }

          if (!editor && (posts[i].edited_by && posts[i].edited_by == usersIds[j].original)) {
            posts[i].edited_by = usersIds[j].created;
            editor = true;
          }

          if (!publisher && (posts[i].published_by && posts[i].published_by == usersIds[j].original)) {
            posts[i].published_by = usersIds[j].created;
            publisher = true;
          }

          if (author && editor && publisher) {
            break;
          }
        }
      }

      if (categoriesIds) {
        for (var k = 0; k < categoriesIds.length; k++) {
          if (!category && posts[i].category == categoriesIds[k].original) {
            posts[i].category = categoriesIds[k].created;
            category = true;
          }

          if (!section && posts[i].section == categoriesIds[k].original) {
            posts[i].section = categoriesIds[k].created;
            section = true;
          }

          if (!tag && posts[i].tag == categoriesIds[k].original) {
            posts[i].tag = categoriesIds[k].created;
            tag = true;
          }

          if (category && section && tag) {
            break;
          }
        }
      }
    }

    Post.create(posts, function(err, records) {
      if (err) {
        err = new Error('Invalid posts data');
        err.status = 403;

        cb(err);
      } else {
        var i = 0;
        async.each(records, function(post, done) {
          var dir = path.join(config.uploads_path, post.id);

          mkdirp.sync(dir);

          if (photos[i].cover_photo != undefined) {
            fs.writeFileSync(path.join(dir, photos[i].cover_photo.name), zip.files['data/images/' + ids[i] + '/' + photos[i].cover_photo.name]._data, 'binary');
            post.cover_photo = {
              path: path.join(dir, photos[i].cover_photo.name),
              name: photos[i].cover_photo.name
            };
          }

          if (photos[i].grid_photo != undefined) {
            fs.writeFileSync(path.join(dir, photos[i].grid_photo.name), zip.files['data/images/' + ids[i] + '/' + photos[i].grid_photo.name]._data, 'binary');
            post.grid_photo = {
              path: path.join(dir, photos[i].grid_photo.name),
              name: photos[i].grid_photo.name
            };
          }

          if (photos[i].slider_photos != undefined && Array.isArray(photos[i].slider_photos)) {
            post.slider_photos = Array();
            for (var j = 0; j < photos[i].slider_photos.length; j++) {
              fs.writeFileSync(path.join(dir, photos[i].slider_photos[j].name), zip.files['data/images/' + ids[i] + '/' + photos[i].slider_photos[j].name]._data, 'binary');
              post.slider_photos.push({
                path: path.join(dir, photos[i].slider_photos[j].name),
                name: photos[i].slider_photos[j].name
              });
            }
          }

          i++;
          post.save(function() {
            done(null);
          });
        }, function(err) {
          cb(null);
        });
      }
    });
  },
  loadUsers = function(req, zip, cb) {
    var filePath = path.join(config.uploads_tmp_path, 'users_import.json'),
      file = fs.writeFileSync(filePath, zip.files['data/users.json']._data, 'binary'),
      users = jsonfile.readFileSync(filePath),
      ids = Array();
    fs.unlinkSync(filePath);

    for (var i = 0; i < users.length; i++) {
      ids.push({
        original: users[i]._id
      });
      delete users[i]._id;
    }

    User.create(users, function(err, records) {
      if (err) {
        err = new Error('Invalid users data');
        err.status = 403;

        cb(err);
      } else {
        for (var i = 0; i < records.length; i++) {
          ids[i].created = records[i].id;
        }

        cb(null, ids);
      }
    });
  };

router.get('/', function(req, res, next) {
  var zip = new nodeZip(),
    settings = {
      categories: true,
      posts: true,
      users: true
    };

  async.waterfall([
    function(cb) {
      compressCategories(req, zip, settings, function(err, settings, zip) {
        if (err) {
          cb(true);
        } else {
          cb(null, settings, zip);
        }
      });
    },
    function(settings, zip, cb) {
      compressPosts(req, zip, settings, function(err, settings, zip) {
        if (err) {
          cb(true);
        } else {
          cb(null, settings, zip);
        }
      });
    },
    function(settings, zip, cb) {
      compressUsers(req, zip, settings, function(err, settings, zip) {
        if (err) {
          cb(true);
        } else {
          cb(null, {
            settings: settings,
            zip: zip
          });
        }
      });
    }
  ], function(err, result) {
    if (err) {
      err = new Error('Invalid query');
      err.status = 401;

      cb(err);
    } else {
      var zipFile = path.join(config.uploads_tmp_path, 'data.zip'),
        settingsFile = path.join(config.uploads_tmp_path, 'settings.json');

      jsonfile.writeFileSync(settingsFile, settings, {
        spaces: 2
      });
      zip.file('data/settings.json', fs.readFileSync(settingsFile));

      fs.unlinkSync(settingsFile);
      fs.writeFileSync(zipFile, result.zip.generate({
        base64: false,
        compression: 'DEFLATE'
      }), 'binary');

      var filename = path.basename(zipFile),
        stats = fs.statSync(zipFile);

      res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Type', 'application/zip');

      var filestream = fs.createReadStream(zipFile),
        stream = filestream.pipe(res);

      stream.on('finish', function() {
        fs.unlinkSync(zipFile);
      });
    }
  });
});

router.post('/', function(req, res, next) {
  if (!req.uploading || !req.body.files.data) {
    var err = new Error('Invalid request');
    err.status = 400;

    next(err);
  } else {
    var zipFile = fs.readFileSync(req.body.files.data[0].path),
      zip = new nodeZip(zipFile, {
        base64: false,
        checkCRC32: true
      }),
      settings = JSON.parse(zip.files['data/settings.json']._data);
    fs.unlinkSync(req.body.files.data[0].path);

    async.waterfall([
      function(cb) {
        if (settings.users) {
          loadUsers(req, zip, function(err, usersIds) {
            if (err) {
              cb(err);
            } else {
              cb(null, usersIds);
            }
          });
        } else {
          cb(null, null);
        }
      },
      function(usersIds, cb) {
        if (settings.categories) {
          loadCategories(req, zip, function(err, categoriesIds) {
            if (err) {
              cb(err);
            } else {
              cb(null, usersIds, categoriesIds);
            }
          });
        } else {
          cb(null, usersIds, null);
        }
      },
      function(usersIds, categoriesIds, cb) {
        if (settings.posts) {
          loadPosts(req, zip, usersIds, categoriesIds, function(err) {
            if (err) {
              cb(err);
            } else {
              cb();
            }
          });
        } else {
          cb();
        }
      }
    ], function(err, result) {
      if (err) {
        next(err);
      } else {
        res.json({
          message: 'Import complete'
        });
      }
    });
  }
});

module.exports = router;
