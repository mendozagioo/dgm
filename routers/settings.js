var express = require('express'),
  fs = require('fs'),
  mongoose = require('mongoose'),
  config = require('../config/app'),
  path = require('path'),
  Setting = require('../models/setting'),
  Utils = require('../lib/utils'),
  Session = require('../lib/session'),
  router = express.Router();
var _getRefs = function() {
  return [{
    field: 'name',
    select: 'name setting'
  }];
};
router.get('', function(req, res, next) {
  var filters = ['name'];

  Utils.paginate(Setting, filters, _getRefs(), req, res, next);
});

router.get('/:id', function(req, res, next) {
  var cursor = Setting.findOne({
      name: req.params.id
    });
  var callback = function(err, setting) {
      if (err || !setting) {
        err = new Error('Invalid setting name');
        err.status = 404;
        next(err);
      } else {
        res.json(setting);
      }
    };

  cursor.exec(callback);
});

router.post('/', Session.validate, function(req, res, next) {
  var moveImg = function(field, setting) {
    Utils.move(req.body[field], path.join(config.uploads_path, setting.id), function(e, file) {
      setting[field] = file;
      setting.save(updated);
    });
  }

  if (req.session.access_level > 2) {
    var err = new Error('Permission denied');
    err.status = 401;
    next(err);
  } else {
    if (req.uploading) {
      Utils.upload(req, req.body.file, path.join(config.uploads_tmp_path), function(e, file) {
        if (e) {
          next(e);
        } else {
          res.json(file);
        }
      });
    } else {

      Setting.create({
        name: req.body.name,
        edit_by: req.body.edit_by,
        edit_date: req.body.edit_date,
        value: req.body.value
      }, function(err, setting) {
        if (err || !setting) {
          err = new Error('Invalid setting data');
          err.status = 403;
          next(err);
        } else {
          if (req.body.cover_photo) {
            moveFile('cover_photo', setting);
          }

          res.json(setting);
        }
      });
    }
  }
});

router.put('/:id', Session.validate, function(req, res, next) {
  var moveImg = function(field, setting) {
      Utils.move(req.body[field], path.join(config.uploads_path, setting.id), function(e, file) {
        setting[field] = file;
        setting.save(updated);
      });
    },
    updated = function(err, setting) {
      res.json(setting)
    };

  Setting.findById(req.params.id, function(err, setting) {
    if (err || !setting) {
      err = new Error('Invalid setting id');
      err.status = 404;
      next(err);
    } else {
      setting.edit_date = new Date();
      setting.value = req.body['cover_photo'].path

      if (setting.image_upload) {
        fs.unlink(setting.image_upload.path, function() {
          moveImg('cover_photo', setting);
        });
      } else {
        moveImg('cover_photo', setting);
      }
    }
  });
});

module.exports = router;
