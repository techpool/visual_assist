var fs = require('fs');
var path = require('path');
var http = require('http');
var express = require('express');
var alexa = require('alexa-app');
var Promise = require('bluebird');
var defaults = require("lodash.defaults");
var utils = require("./utils");

var appServer = function(config) {
    var self = {};
    config = config || {};

    var defaultOptions = {
        log: true,
        debug: true,
        verify: false,
        port: process.env.port || 8080,
        httpEnabled: true,
        httpsEnabled: false,
        public_html: 'public_html',
        server_dir: 'server',
        server_root: '.',
        app_root: 'alexa',
        app_dir: 'apps'
    };

    self.config = defaults(config, defaultOptions);

    if (self.config.verify && self.config.debug) {
        throw new Error("invalid configuration: the verify and debug options cannot be both enabled");
    }

    self.apps = {};

    self.log = function(msg) {
        if (self.config.log) {
            console.log(msg);
        }
    };

    self.error = function(msg) {
        console.error(msg);
    };

    // load application modules
    self.load_apps = function(app_dir, root) {
        // set up a router to hang all alexa apps off of
        var alexaRouter = express.Router();

        var normalizedRoot = utils.normalizeApiPath(root);
        self.express.use(normalizedRoot, alexaRouter);

        var app_directories = function(srcpath) {
            return fs.readdirSync(srcpath).filter(function(file) {
                return utils.isValidDirectory(path.join(srcpath, file));
            });
        };

        app_directories(app_dir).forEach(function(dir) {
            var package_json = path.join(app_dir, dir, "package.json");
            if (!utils.isValidFile(package_json)) {
                self.error("   package.json not found in directory " + dir);
                return;
            }

            var pkg = utils.readJsonFile(package_json);
            if (!pkg || !pkg.main || !pkg.name) {
                self.error("   failed to load " + package_json);
                return;
            }

            var main = fs.realpathSync(path.join(app_dir, dir, pkg.main));
            if (!utils.isValidFile(main)) {
                self.error("   main file not found for app [" + pkg.name + "]: " + main);
                return;
            }

            var app;
            try {
                app = require(main);
            } catch (e) {
                self.error("   error loading app [" + main + "]: " + e);
                return;
            }

            self.apps[pkg.name] = pkg;
            self.apps[pkg.name].exports = app;
            if (typeof app.express != "function") {
                self.error("   app [" + pkg.name + "] is not an instance of alexa-app");
                return;
            }

            // extract Alexa-specific attributes from package.json, if they exist
            if (typeof pkg.alexa == "object") {
                app.id = pkg.alexa.applicationId;
            }

            // attach the alexa-app instance to the alexa router
            app.express({
                expressApp: alexaRouter,
                debug: self.config.debug,
                checkCert: self.config.verify,
                preRequest: self.config.preRequest,
                postRequest: self.config.postRequest
            });

            var endpoint = path.posix.join(normalizedRoot, app.name);
            self.log("   loaded app [" + pkg.name + "] at endpoint: " + endpoint);
        });

        return self.apps;
    };

    // load server modules, eg. code that processes forms, anything that wants to hook into express
    self.load_server_modules = function(server_dir) {
        var server_files = function(srcpath) {
            return fs.readdirSync(srcpath).filter(function(file) {
                return utils.isValidFile(path.join(srcpath, file));
            });
        };
        server_files(server_dir).forEach(function(file) {
            file = fs.realpathSync(path.join(server_dir, file));
            self.log("   loaded " + file);
            var func = require(file);
            if (typeof func == "function") {
                func(self.express, self);
            }
        });
    };

    // start the server
    self.start = function() {
        self.express = express();

        self.express.set('views', path.join(__dirname, 'views'));
        self.express.set('view engine', 'ejs');
        self.express.use(express.static(path.join(__dirname, 'views')));

        if (typeof self.config.pre == "function") {
            self.config.pre(self);
        }

        // serve static content
        var static_dir = path.join(self.config.server_root, self.config.public_html);
        if (utils.isValidDirectory(static_dir)) {
            self.log("serving static content from: " + static_dir);
            self.express.use(express.static(static_dir));
        } else {
            self.log("not serving static content because directory [" + static_dir + "] does not exist");
        }

        // find any server-side processing modules and let them hook in
        var server_dir = path.join(self.config.server_root, self.config.server_dir);
        if (utils.isValidDirectory(server_dir)) {
            self.log("loading server-side modules from: " + server_dir);
            self.load_server_modules(server_dir);
        } else {
            self.log("no server modules loaded because directory [" + server_dir + "] does not exist");
        }

        // find and load alexa-app modules
        var app_dir = path.join(self.config.server_root, self.config.app_dir);
        if (utils.isValidDirectory(app_dir)) {
            self.log("loading apps from: " + app_dir);
            self.load_apps(app_dir, self.config.app_root);
        } else {
            self.log("apps not loaded because directory [" + app_dir + "] does not exist");
        }

        if (typeof config.host === 'string') {
            self.instance = self.express.listen(self.config.port, self.config.host);
            self.log("listening on http://" + self.config.host + ":" + self.config.port);
        } else {
            self.instance = self.express.listen(self.config.port);
            self.log("listening on http port " + self.config.port);
        }

        if (typeof self.config.post == "function") {
            self.config.post(self);
        }

        return this;
    };

    // close all server instances
    self.stop = function() {
        if (typeof self.instance !== "undefined") {
            self.instance.close();
        }
    };

    return self;
};

// a shortcut start(config) method to avoid creating an instance if not needed
appServer.start = function(config) {
    var appServerInstance = new appServer(config);
    appServerInstance.start();
    return appServerInstance;
};

module.exports = appServer;
