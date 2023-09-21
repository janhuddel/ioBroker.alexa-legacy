// @ts-nocheck
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const API = require("./api");
const MongoClient = require("mongodb").MongoClient;

module.exports = class Alexa {
    constructor(adapter, logger) {
        this.adapter = adapter;
        this.logger = logger;
    }

    async startServer() {
        if (this.server) {
            return Promise.reject("server is already running");
        } else {
            const mongoConnectionString = this.adapter.config.mongodb;

            // connect to mongodb
            this.logger.debug(`connecting to mongodb ${mongoConnectionString}...`);
            this.mongoClient = await MongoClient.connect(mongoConnectionString);
            this.logger.info("connection to mongodb established");

            // create api-server
            this.logger.debug("starting server...");
            this.api = new API(this.adapter, this.mongoClient.db("alexa"));
            const app = this._createApplication();
            this.server = app.listen(app.get("port"), () => {
                this.logger.info("server listening on port " + this.server.address().port);
            });
        }
    }

    stopServer() {
        this.logger.debug("stopping server...");
        if (this.server) {
            this.server.close();
            this.server = undefined;
            this.mongoClient.close();
            this.mongoClient = undefined;
        }
    }

    _createApplication() {
        const app = express();
        app.use(bodyParser.json());

        // inject adapter
        app.use((req, res, next) => {
            req.adapter = this.adapter;
            next();
        });

        // access-log
        this._applyAccessLogging(app);

        // authentication
        this._applyAuthentication(app);

        // routing to main application
        this._initRouting(app);

        // if no route is matched by now, it must be a 404
        app.use((req, res, next) => {
            const err = new Error("Not Found");
            err.status = 404;
            next(err);
        });

        const port = this.adapter.config.port;
        app.set("port", port);

        return app;
    }

    _initRouting(app) {
        // ping
        app.get("/api/v1/ping", (req, res) => {
            return res.send("pong");
        });

        // discovery
        app.get("/api/v1/objects", (req, res) => {
            this.api.getObjects(req, res);
        });

        // state-report
        app.post("/api/v1/objects/:id/states", (req, res) => {
            this.api.getStateReport(req, res);
        });

        // get & set state
        app.route("/api/v1/objects/:id/states/:statename")
            .get((req, res) => {
                this.api.getState(req, res);
            })
            .put((req, res) => {
                this.api.setState(req, res);
            });

        // scenes
        app.put("/api/v1/scene/:id/:action", (req, res) => {
            this.api.handleScene(req, res);
        });
    }

    _applyAuthentication(app) {
        const self = this;

        app.use((req, res, next) => {
            const user = req.headers["x-iobroker-user"];
            const password = req.headers["x-iobroker-password"];

            this.adapter.checkPassword(user, password, (result) => {
                if (result) {
                    next();
                } else {
                    self.logger.warn(`authorization for user ${user} failed`);
                    res.status(401).end();
                }
            });
        });
    }

    _applyAccessLogging(app) {
        morgan.token("aws-requestid", (req, res) => req.headers["x-aws-requestid"]);
        morgan.token("forwarded-for", (req, res) => req.headers["x-forwarded-for"]);

        const morganLogFormat = ":remote-addr :forwarded-for :aws-requestid :method :url :status :response-time ms";
        const self = this;
        app.use(
            morgan(morganLogFormat, {
                stream: {
                    write: function (message, encoding) {
                        self.logger.debug(message.trim());
                    },
                },
            }),
        );
    }
};
