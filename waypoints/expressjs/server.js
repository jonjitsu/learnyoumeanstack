
var express = require('express'),
    jade = require('jade'),
    path = require('path'),
    l = console.log.bind(console),
    argv = process.argv,
    proot = path.join.bind(path, __dirname)
;


function hello_world(port) {
    express()
        .get('/home', function(req, res) {
            res.end('Hello World!');
        })
        .listen(port);
}
//hello_world(argv[2]);


function static2(port, where) {
    l(__dirname);
    where = where || path.join(__dirname, 'public'); 
    express()
        .use(express.static(where))
        .listen(port);
}
//static2(argv[2], argv[3]);


function jade_server(port, template) {
    template = template || proot('templates');

    express()
        .set('view engine', 'jade')
        .set('views', template)
        .get('/home', function(req, res){
            res.render('index', {date: new Date().toDateString()})
        })
        .listen(port); 
}

//jade_server(argv[2], argv[3]);

function good_ol_form(port) {
    var bodyparser = require('body-parser'),
        formPostAction = function(req, res) {
            res.end(req.body.str.split('').reverse().join(''));
        }
    ;

    express()
        .use(bodyparser.urlencoded({extended: false}))
        .post('/form', formPostAction)
        .listen(port);
}
//good_ol_form(argv[2]);


function stylish_css(port, dir) {
    var stylus = require('stylus'),
        publicRoot = proot('public');

    dir = dir || publicRoot;
//    l(publicRoot('*.styl'));
    express()
        .use(express.static(dir))
        // .use(stylus.middleware({
        //     src: dir,
        //     dest: dir,
        //     debug: true,
        //     force: true
        // }))
        .use(stylus.middleware(dir))
        .listen(port)
}
//stylish_css(argv[2], argv[3]);

function param_pam_pam(port) {
    var crypto = require('crypto'),
        hasher = function(id) {
            return crypto
                .createHash('sha1')
                .update(new Date().toDateString() + id)
                .digest('hex');
        }
    ;
    express()
        .put('/message/:id', function(req, res) {
            var params = req.params;
            res.end(hasher(params.id));
        })
        .listen(port);
}
// param_pam_pam(argv[2]);

function whats_in_query(port) {

    express()
        .get('/search', function(req, res) {
            res.send(req.query);
            
        })
        .listen(port);
}
//whats_in_query(argv[2]);

function json_me(port, file) {
    var fs = require('fs'),
        fileData = function() {
            return JSON.parse(fs.readFileSync(file).toString());
        }
    ;
    express()
        .get('/books', function(req, res) {
            res.json(fileData());
        })
        .listen(port);
}
json_me(argv[2], argv[3]);
