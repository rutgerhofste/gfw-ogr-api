'use strict';


var Router = require('koa-router');
var logger = require('logger');
var ogr2ogr = require('ogr2ogr');
var gdal = require('gdal');
var geojsonMerge = require('@mapbox/geojson-merge');
var toGeoJson = require('@mapbox/togeojson');
var unzip = require('unzip');
var AdmZip = require('adm-zip');
var DOMParser = require('xmldom').DOMParser;
var GeoJSONSerializer = require('serializers/geoJSONSerializer');
var fs = require('fs');
var path = require('path');
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

var ogrExec = function(ogr) {
    return function(callback) {
        ogr.exec(callback);
    };
};

var unlink = function(file) {
    return function(callback) {
        fs.unlink(file, callback);
    };
};


class OGRRouter {
    static * convert() {
        logger.debug('Converting file...');
        this.assert(this.request.body.files.file, 400, 'File required');

        try {

            if (this.request.body.files.file.name.indexOf('.zip') > -1 || this.request.body.files.file.name.indexOf('.kmz') > -1) {
                logger.debug(gdal.drivers);
                var dataset = gdal.open('/vsizip/' + this.request.body.files.file.path);
                logger.debug(dataset);
                var layer = dataset.layers.get(0);
                logger.debug(dataset.layers);
                // var mergedStream = geojsonMerge.mergeFeatureCollectionStream([dataset.layers]);
            }

            var ogr = ogr2ogr(this.request.body.files.file.path);
            ogr.project('EPSG:4326');
            ogr.options(['-dim', '2']);
            var result = yield ogrExec(ogr);
            // logger.debug(result);
            this.body = GeoJSONSerializer.serialize(result);
        } catch (e) {
            logger.error('Error convert file', e);
            this.throw(400, 'File not valid');
        } finally {
            logger.debug('Removing file');
            yield unlink(this.request.body.files.file.path);
        }
    }
}

router.post('/convert', koaBody, OGRRouter.convert);


module.exports = router;
