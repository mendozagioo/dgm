var sm = require('sitemap'),
    config = require('../config/app'),
    express = require('express'),
    Post = require('../models/post')
    

var router = express();

router.get('/', function(req, res){
    var urls = [
        { url: '/',  changefreq: 'never', priority: 0.7, lastmodISO: '2016-06-22T00:00:00-00:00' },
        { url: '/blog/',  changefreq: 'never', priority: 0.7, lastmodISO: '2016-06-22T00:00:00-00:00' },
        { url: '/herramientas/',  changefreq: 'never', priority: 0.7, lastmodISO: '2016-06-22T00:00:00-00:00' },
        { url: '/desarrolladores/',  changefreq: 'never', priority: 0.7, lastmodISO: '2016-06-22T00:00:00-00:00' }
    ];

    Post.find({status: 'PUBLISHED'})
    .populate('section')
    .sort('-section')
    .select('slug section creation_date')
    .then((posts) => {
        posts.forEach( post => {
            if ( post.section.slug == 'blog' || post.section.slug == 'herramientas' || post.section.slug == 'api-cdn') { 
                urls.push({ 
                    url: '/' + post.section.slug + '/' + post.slug,  
                    changefreq: 'never', 
                    priority: 0.5,
                    lastmodISO: post.creation_date
                });
            }
        });

        sitemap = sm.createSitemap ({
            hostname: config.host_name,
            cacheTime: 600000,
            urls: urls
        });

        sitemap.toXML( function(err, xml) {
            if ( err ) {
                return res.status(500).end();
            }
            res.header('Content-Type', 'application/xml');
            res.send(xml);
        });

    });
});



module.exports = router;