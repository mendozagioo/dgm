var request = require('request'),
  schedule = require('node-schedule')
  express = require('express'),
  router = express.Router();

/*
  redirect engine
*/
var organizations;
router.all("/", function(req, res, next){
  var originUrl = req.get("referer");

  if(originUrl && originUrl.match(/.*gob.mx.*/gi)){
    var match = originUrl.match(/.*www\.(\w*)?\.?(?:gob\.mx\/)(\w*)?/i);
    var organization = match==null ? null:match[1] ? match[1]:match[2];

    if (organization && organizations.indexOf(organization) > -1) {
      res.redirect("busca/organization/" + organization);
      return;
    }
  }

  next();
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

/*
  redirect engine env variable
  From this env the function validates if is a valid organization
*/
function buildDGMOrganizationsVar(){
  request.get("https://api.datos.gob.mx/v1/ckan-organizations?pageSize=9999", function(error, response, body){

    if(error){
      console.log("Error updating DGM_ORGANIZATIONS_REDIRECT_ENGINE");
    }else{
      body = JSON.parse(body);
      organizations = [];
      for(var result of body.results ){
        organizations.push(result.name);
      }
    }
  });
}

// update the var each day
schedule.scheduleJob('15 1 * * *', function(){
  buildDGMOrganizationsVar();
});

buildDGMOrganizationsVar();
module.exports = router;
