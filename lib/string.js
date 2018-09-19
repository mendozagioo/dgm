var crypto = require('crypto');

exports.random = function(longitud, tipo) {
  var chars = "";
  switch (tipo) {
    case "alnum":
      chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      break;
    case "alpha":
      chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
      break;
    case "numeric":
      chars = "0123456789";
      break;
  }

  var rnd = crypto.randomBytes(longitud),
    valor = new Array(longitud),
    len = chars.length;

  for (var i = 0; i < longitud; i++) {
    valor[i] = chars[rnd[i] % len];
  }

  return valor.join('');
};
