var mongoose = require('mongoose'),
  bcrypt = require('bcryptjs'),
  UserSchema = new mongoose.Schema({
    avatar: {
      type: String,
      required: false
    },
    creation_date: {
      type: Date,
      required: true,
      default: Date.now
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      index: {
        unique: true
      }
    },
    pass: {
      type: String,
      required: false
    },
    type: {
      type: Number,
      required: true
    }
  });

UserSchema.method('auth', function(pass, cb) {
  var user = this;
  bcrypt.compare(pass, user.pass, function(err, isMatch) {
    if (!isMatch) {
      cb(false);
    } else {
      cb(user);
    }
  });
});

UserSchema.pre('save', function(next) {
  var user = this;

  if (!user.isModified('pass')) {
    next();
  } else {
    bcrypt.hash(user.pass, 10, function(err, _hash) {
      user.pass = _hash;
      next();
    });
  }
});

module.exports = mongoose.model('User', UserSchema);
