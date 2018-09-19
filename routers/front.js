var request = require('request'),
  schedule = require('node-schedule'),
  express = require('express'),
  router = express.Router();

var REDIRECT_ENGINE_BASE = process.env.REDIRECT_ENGINE_BASE || "https://datos.gob.mx/busca/organization"

function printLog(referer, _match, _description){
  console.log(JSON.stringify({"date": new Date().toISOString(), "referer": referer, "match": _match, "description": _description}));
}

/*
  redirect engine
*/
router.all("/", function(req, res, next){
  var originUrl = req.get("referer") || "";

  var _match = originUrl.match(/.*www\.(\w*)?\.?(?:gob\.mx\/)(\w*)?/i) || [];

  if( !_match[1] && !_match[2] ){
    printLog(originUrl, "", "organization not identified");
    next();
    return;
  }

  var refererOrganization = _match[1] ? _match[1]:_match[2];
  request({method:"HEAD", uri: REDIRECT_ENGINE_BASE + "/" + refererOrganization}, function(_error, response, _body){
    if(!_error && response.statusCode != 404){
      printLog(originUrl, refererOrganization, "organization found")

      res.redirect(REDIRECT_ENGINE_BASE + "/" + refererOrganization);
      return;
    }

    printLog(originUrl, refererOrganization, "organization not found");
    next();
  });
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
