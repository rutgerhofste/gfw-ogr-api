'use strict';

var Router = require('koa-router');
var logger = require('logger');
var ogr2ogr = require('ogr2ogr');
var fs = require('fs');
var path     = require('path');
var koaBody = require('koa-body')({
    multipart: true,
    formidable: {
        uploadDir: '/tmp',
        onFileBegin: function(name, file) {
          var folder = path.dirname(file.path);
          file.path = path.join(folder, file.name);
        }
      }
});


var router = new Router({
    prefix: '/ogr'
});

var ogrExec = function(ogr){
    return function(callback){
        ogr.exec(callback);
    };
};


class OGRRouter {
    static * convert() {
        console.log(this.request.body.fields);
        // => {username: ""} - if empty

        console.log(this.request.body.files.file);
        var ogr = ogr2ogr(this.request.body.files.file.path);
        try{
            var result = yield ogrExec(ogr);
            fs.unlink(this.request.body.files.file.path);
            this.body = result;
        }catch(e){
            logger.error(e);

        }

        // ogr.exec(function(er, data) {
        //
        //
        //     if (req.body.callback) {
        //         res.write(req.body.callback + '(');
        //     }
        //     res.write(JSON.stringify(data))
        //     if (req.body.callback) res.write(')')
        //     res.end()
        // })
        // this.body = 'Entra';
    }

    static * index() {
        this.response.type = 'text/html; charset=utf-8';
        this.body = '<html><body><form action="/api/v1/ogr/convert" method="POST" enctype="multipart/form-data"><input type="file" name="file"><input type="submit"/></form></body></html>';
    }
}

router.get('/convert', OGRRouter.index);
router.post('/convert', koaBody, OGRRouter.convert);


module.exports = router;
