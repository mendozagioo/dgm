var mongoose = require('mongoose'),
  db = require('./config/db'),
  User = require('./models/user'),
  _name = (process.argv[2]) ? process.argv[2] : process.env.USER_NAME,
  email = (process.argv[3]) ? process.argv[3] : process.env.USER_EMAIL,
  pass = (process.argv[4]) ? process.argv[4] : process.env.USER_PASS,
  type = (process.argv[5]) ? process.argv[5] : 0,
  conn_str = 'mongodb://';

if (db.user) {
  conn_str += db.user;
  if (db.pass) {
    conn_str += ':' + db.pass;
  }

  conn_str += '@';
}
conn_str += db.host + ':' + db.port + '/' + db.database;

mongoose.connect(conn_str);
console.log('conn_str', conn_str);
User.create({
  email: email,
  name: _name,
  pass: pass,
  type: type
}, function(err, user) {
  if (err || !user) {
    console.log('============= ERROR ==============');
    console.log(err);
  } else {
    console.log('============= USER ==============');
    console.log('Name - ' + user.name);
    console.log('Email - ' + user.email);
    console.log('Pass - ' + pass);
    console.log('Type - ' + user.type);
  }

  process.exit();
});
