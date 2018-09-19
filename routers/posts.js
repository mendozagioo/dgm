var express = require('express'),
  fs = require('fs'),
  mongoose = require('mongoose'),
  path = require('path'),
  rimraf = require('rimraf'),
  config = require('../config/app'),
  Post = require('../models/post'),
  Session = require('../lib/session'),
  Utils = require('../lib/utils'),
  router = express.Router(),
  _getRefs = function() {
    return [{
        field: 'category',
        select: 'name slug'
      },
      {
        field: 'created_by',
        select: 'avatar name email'
      },
      {
        field: 'edited_by',
        select: 'avatar name email'
      },
      {
        field: 'published_by',
        select: 'avatar name email'
      },
      {
        field: 'section',
        select: 'name slug'
      },
      {
        field: 'tag',
        select: 'name slug'
      }
    ];
  };

router.get('', function(req, res, next) {
  var filters = ['author', 'category', 'created_by', 'creation_date', 'edited_by', 'edition_date', 'featured', 'name', 'published_by', 'published_date', 'section', 'status', 'tag'];
  Utils.paginate(Post, filters, _getRefs(), req, res, next);
});

router.get('/paginated', function(req, res, next){
  var cursor = Post.find(),
  callback = function(err, docs){
    console.log(docs);
    res.json(docs);
  };
  cursor.exec(callback)
});

router.get('/:id', function(req, res, next) {
  var query = (/^[a-fA-F0-9]{24}$/.test(req.params.id)) ? {
      _id: mongoose.Types.ObjectId(req.params.id)
    } : {
      slug: req.params.id
    },
    cursor = Post.findOne(query),
    callback = function(err, post) {
      if (err || !post) {
        err = new Error('Invalid post id');
        err.status = 404;
        next(err);
      } else {
        res.json(post);
      }
    };

  if (req.query.expanded && req.query.expanded === 'true') {
    var refs = _getRefs();
    for (var i = 0; i < refs.length; i++) {
      cursor.populate(refs[i].field, refs[i].select);
    }

    cursor.exec(callback);
  } else {
    cursor.exec(callback)
  }
});

router.post('/', Session.validate, function(req, res, next) {
  var cover = false,
    grid = false,
    newContent = '',
    moveFile = function(field, post) {
      if (field == 'slider_photos') {
        var j = 0;
        post.slider_photos = Array();

        for (var i = 0; i < req.body.slider_photos.length; i++) {
          Utils.move(req.body.slider_photos[i], path.join(config.uploads_path, post.id), function(e, file, index) {
            post.slider_photos[index] = file;

            if (++j >= req.body.slider_photos.length) {
              post.markModified('slider_photos');
              post.save();
            }
          }, i);
        }
      } else {
        Utils.move(req.body[field], path.join(config.uploads_path, post.id), function(e, file) {
          post[field] = file;
          post.save();
        });
      }
    },
    getImagesFromContent = function(content, post) {
      var imagesFromContent = Utils.getImagesFromContent(content);
      if (imagesFromContent.length > 0) {
        var imagesUrls = Utils.saveImagesFromContent(imagesFromContent, post.id, path.join(config.uploads_path, post.id));
        newContent = Utils.returnContentWithUrls(content, imagesFromContent, imagesUrls);
      } else {
        newContent = content;
      }
    },
    changeFeatured = function(section){
      Post.find({
          section: section,
          featured: true
        })
        .then(sectionPosts => {
          sectionPosts.forEach(spost => {
            if (spost.featured) {
              spost.featured = false;
              spost.save();
            }
          });
        });
    };

  if (req.uploading) {
    Utils.upload(req, req.body.file, path.join(config.uploads_tmp_path), function(e, file) {
      if (e) {
        next(e);
      } else {
        res.json(file);
      }
    });
  } else {
    if (req.session.access_level == 3 && req.body.status != 'DRAFT') {
      var err = new Error('Permission denied');
      err.status = 401;
      next(err);
    } else {
      if (req.body.featured) {
        changeFeatured(req.body.section);
      }
      Post.create({
        apple_store: req.body.apple_store,
        author: req.body.author,
        category: req.body.category,
        content: req.body.content,
        created_by: req.body.created_by,
        creation_date: req.body.creation_date,
        datasets: req.body.datasets,
        datasets_ext: req.body.datasets_ext,
        edited_by: req.body.edited_by,
        edition_date: req.body.edition_date,
        external_link: req.body.external_link,
        featured: req.body.featured,
        google_play: req.body.google_play,
        iframe: req.body.iframe,
        name: req.body.name,
        published_by: req.body.published_by,
        published_date: req.body.published_date,
        section: req.body.section,
        slug: req.body.slug,
        status: req.body.status,
        tag: req.body.tag,
        web_link: req.body.web_link
      }, function(err, post) {
        if (err || !post) {
          err = new Error('Invalid post data');
          err.status = 403;
          next(err);
        } else {
          getImagesFromContent(req.body.content, post);
          post.content = newContent;
          post.save();
          if (req.body.cover_photo || req.body.grid_photo || req.body.slider_photos) {
            if (req.body.cover_photo) {
              moveFile('cover_photo', post);
            }

            if (req.body.grid_photo) {
              moveFile('grid_photo', post);
            }

            if (req.body.slider_photos && req.body.slider_photos[0].path) {
              moveFile('slider_photos', post);
            }
          }

          res.json(post);
        }
      });
    }
  }
});

router.put('/:id', Session.validate, function(req, res, next) {
  var uploading = {
      cover_photo: false,
      grid_photo: false,
      slider_photos: false
    },
    newContent = '',
    moveImg = function(field, post) {
      if (field == 'slider_photos') {
        var j = 0;

        for (var i = 0; i < req.body.slider_photos.length; i++) {
          if (post.slider_photos[i] && post.slider_photos[i].path != req.body.slider_photos[i].path) {
            fs.unlink(post.slider_photos[i].path);
          }

          Utils.move(req.body.slider_photos[i], path.join(config.uploads_path, post.id), function(e, file, index) {
            post.slider_photos[index] = file;

            if (++j >= req.body.slider_photos.length) {
              if (post.slider_photos.length > req.body.slider_photos.length) {
                for (var k = j; k < post.slider_photos.length; k++) {
                  fs.unlink(post.slider_photos[k].path);
                  post.update({
                    $pull: {
                      slider_photos: post.slider_photos[k]
                    }
                  }, function() {
                    post.slider_photos.pop();
                    updated(null, post);
                  });
                }
              } else {
                post.markModified('slider_photos');
                post.save(updated);
              }
            }
          }, i);
        }
      } else {
        Utils.move(req.body[field], path.join(config.uploads_path, post.id), function(e, file) {
          post[field] = file;
          post.save(updated);
        });
      }
    },
    updated = function(err, post) {
      if (err || !post) {
        err = new Error('Name of the Post already exists in the database');
        err.status = 404;
        next(err);
      } else {
        res.json(post);
      }
    },
    changeFeatured = function(section){
      Post.find({
          section: section,
          featured: true
        })
        .then(sectionPosts => {
          sectionPosts.forEach(spost => {
            if (spost.featured) {
              spost.featured = false;
              spost.save();
            }
          });
        });
    },
    getImagesFromContent = function(content, post) {
      var imagesFromContent = Utils.getImagesFromContent(content);
      if (imagesFromContent.length > 0) {
        var imagesUrls = Utils.saveImagesFromContent(imagesFromContent, post.id, path.join(config.uploads_path, post.id));
        newContent = Utils.returnContentWithUrls(content, imagesFromContent, imagesUrls);
      } else {
        newContent = content;
      }
    };
  Post.findById(req.params.id, function(err, post) {
    if (err || !post) {
      err = new Error('Invalid post id');
      err.status = 404;
      next(err);
    } else {
      getImagesFromContent(req.body.content, post);
      req.body.content = newContent;
      for (var key in req.body) {
        if (req.session.access_level == 3) {
          if (key == 'edited_by' || key == 'edition_date' || key == 'published_by' || key == 'published_date' || key == 'status')
            continue;
        }

        if (key == 'cover_photo' || key == 'grid_photo' || key == 'slider_photos') {
          if (post[key] == undefined || post[key].path != req.body[key].path || Array.isArray(req.body[key])) {
            uploading[key] = true;
          }
          continue;
        }

        post[key] = req.body[key];
      }

      if (uploading.cover_photo || uploading.grid_photo || uploading.slider_photos) {
        if (uploading.cover_photo) {
          if (post.cover_photo) {
            fs.unlink(post.cover_photo.path, function() {
              moveImg('cover_photo', post);
            });
          } else {
            moveImg('cover_photo', post);
          }
        }

        if (uploading.grid_photo) {
          if (post.grid_photo) {
            fs.unlink(post.grid_photo.path, function() {
              moveImg('grid_photo', post);
            });
          } else {
            moveImg('grid_photo', post);
          }
        }

        if (uploading.slider_photos) {
          moveImg('slider_photos', post);
        }
      } else {
        if (req.body.featured) {
          changeFeatured(req.body.section);
        }
        post.save(updated);
      }
    }
  });
});

router.delete('/:id', Session.validate, function(req, res, next) {
  if (req.session.access_level > 2) {
    var err = new Error('Permission denied');
    err.status = 401;
    next(err);
  } else {
    var removed = function(err, post) {
      res.json(post);
    };

    Post.findById(req.params.id, function(err, post) {
      if (err || !post) {
        err = new Error('Invalid post id');
        err.status = 404;
        next(err);
      } else {
        rimraf(path.join(config.uploads_path, post.id), function() {
          post.remove(removed);
        });
      }
    });
  }
});

module.exports = router;
