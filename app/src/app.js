'use strict';
//load modules

require('newrelic');
var config = require('config');
var logger = require('logger');
var path = require('path');
var koa = require('koa');
var koaLogger = require('koa-logger');
var loader = require('loader');
var validate = require('koa-validate');
var ErrorSerializer = require('serializers/errorSerializer');


// instance of koa
var app = koa();

//if environment is dev then load koa-logger
if (process.env.NODE_ENV === 'dev') {
    logger.debug('Use logger');
    app.use(koaLogger());
}

//catch errors and send in jsonapi standard. Always return vnd.api+json
app.use(function*(next) {
    try {
        yield next;
    } catch (err) {
        this.status = err.status || 500;
        this.body = ErrorSerializer.serializeError(this.status, err.message);
        if (process.env.NODE_ENV === 'prod' && this.status === 500) {
            this.body = 'Unexpected error';
        }
    }
    // this.response.type = 'application/vnd.api+json';
});

//load custom validator
app.use(validate());

//load routes
loader.loadRoutes(app);

//Instance of http module
var server = require('http').Server(app.callback());

// get port of environment, if not exist obtain of the config.
// In production environment, the port must be declared in environment variable
var port = process.env.PORT || config.get('service.port');


server.listen(port, function () {    
    const microserviceClient = require('vizz.microservice-client');
    
    microserviceClient.register({
        id: config.get('service.id'),
        name: config.get('service.name'),
        dirConfig: path.join(__dirname, '../microservice'),
        dirPackage: path.join(__dirname, '../../'),
        logger: logger,
        app: app
    });
    if (process.env.CT_REGISTER_MODE && process.env.CT_REGISTER_MODE === 'auto') {
        microserviceClient.autoDiscovery(config.get('service.name')).then(() => {}, (err) => {
            logger.error('Error registering');
            process.exit(1);
        });
    }
});

logger.info('Server started in port:' + port);
