var request = require('request'),
  schedule = require('node-schedule')
  express = require('express'),
  router = express.Router();

/*
  redirect engine
*/
router.all("/", function(req, res, next){
  var originUrl = req.get("referer") || "";

  var match = originUrl.match(/.*www\.(\w*)?\.?(?:gob\.mx\/)(\w*)?/i);
  if(match){
    var refererOrganization = match[1] ? match[1]: match[2] ? match[2]:"undefined";

    request({method:"HEAD", uri: "https://datos.gob.mx/busca/organization/" + refererOrganization}, function(error, response, body){
      if(!error && response.statusCode != 404){
        res.redirect("busca/organization/" + refererOrganization);
        return;
      }

      console.log("Organización no encontrada: ", refererOrganization, " | ", originUrl);
      next();
    });

  }else{
    console.log("Organización no encontrada en el referer", originUrl);
    next();
  }
});

router.get('/', function(req, res) {
  res.render('index');
});

router.get('/partials/:module/:view', function(req, res) {
  res.render('partials/' + req.params.module + '/' + req.params.view);
});

router.get('*', function(req, res) {
  res.render('index');
});

module.exports = router;
