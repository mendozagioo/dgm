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

    if(organization){
      if(organizations.length == 0){
        console.log("Error: array de organizaciones vacio.");
      } else (organizations.indexOf(organization) > -1) {
        res.redirect("busca/organization/" + organization);
        return;
      }
      console.log("Organización no encontrada.", organization, originUrl);
    }else{
      console.log("URL no valida para redirección.", originUrl);
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
    console.log("Iniciando actualización de la variable del motor de redirección.");

    if(error){
      console.log("Error en la respuesta del servidor.", error);
    }else{
      body = JSON.parse(body);

      if(body.results.length == 0){
        console.log("Error: resultado del servidor vacio");
      }else{
        organizations = [];
        for(var result of body.results ){
          organizations.push(result.name);
        }

        console.log("Variable actualizada.", organizations);
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
