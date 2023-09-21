// @ts-nocheck
var mongo = require("mongodb");

module.exports = class API {
    constructor(adapter, database) {
        this.adapter = adapter;
        this.logger = adapter.log;
        this.devices = database.collection("devices");
        this.scenes = database.collection("scenes");
    }

    getObjects(request, response) {
        this._init(request, response);

        this._getDevices().then((devices) => {
            response.json(devices);
        });
    }

    getStateReport(request, response) {
        this._init(request, response);

        const id = request.params.id;
        const statenames = request.body.states;

        this._getDevice(id)
            .then((device) => {
                const promises = [];
                // create a promise for each statename
                statenames
                    .map((s) => s.toLowerCase())
                    .forEach((statename) => {
                        promises.push(
                            this._getState(device, statename).then((state) => {
                                const stateResult = {};
                                stateResult[statename] = state;
                                return stateResult;
                            }),
                        );
                    });

                return Promise.all(promises);
            })
            .then((states) => {
                const result = {};
                states.forEach((state) => {
                    const statename = Object.keys(state)[0];
                    if (state[statename].val !== null) {
                        result[statename] = state[statename];
                    }
                });
                response.json(result);
            })
            .catch((err) => {
                this._handleErorr(err);
            });
    }

    getState(request, response) {
        this._init(request, response);

        const id = request.params.id;
        const statename = request.params.statename;

        this._getDevice(id)
            .then((device) => {
                return this._getState(device, statename);
            })
            .then((result) => {
                response.json({ value: result });
            })
            .catch((err) => {
                this._handleErorr(err);
            });
    }

    setState(request, response) {
        this._init(request, response);

        const id = request.params.id;
        const statename = request.params.statename;

        this._getDevice(id)
            .then((device) => {
                const StateHandler = require(`./statehandler/${statename}`);
                const handler = new StateHandler(this.adapter, device, statename);
                return handler.set(request.body.value);
            })
            .then((result) => {
                response.status(204).end();
            })
            .catch((err) => {
                this._handleErorr(err);
            });
    }

    handleScene(request, response) {
        this._init(request, response);

        const id = request.params.id;
        const val = request.params.action === "activate";

        this._getDevice(id)
            .then((device) => {
                const dp = device.capabilities["SceneController"].targetState;
                this.logger.debug(`setting scene ${dp} to ${val}...`);
                this.adapter.setForeignState(dp, val, (err) => {
                    if (err) {
                        this._handleErorr(err);
                    } else {
                        response.status(204).end();
                    }
                });
            })
            .catch((err) => {
                this._handleErorr(err);
            });
    }

    _init(request, response) {
        this.request = request;
        this.response = response;
        this.adapter = request.adapter;
    }

    _getDevices() {
        return this._findAll(this.devices);
    }

    _getScenes() {
        return this._findAll(this.scenes);
    }

    _findAll(collection) {
        return new Promise((resolve, reject) => {
            collection.find({}).toArray((err, docs) => {
                if (!err) {
                    resolve(docs);
                } else {
                    reject(err);
                }
            });
        });
    }

    _getDevice(id) {
        return new Promise((resolve, reject) => {
            this.devices.findOne({ _id: new mongo.ObjectID(id) }, (err, device) => {
                if (device) {
                    resolve(device);
                } else {
                    reject(err ? err : `device with id ${id} not found`);
                }
            });
        });
    }

    _getState(device, statename) {
        return new Promise((resolve, reject) => {
            try {
                const StateHandler = require(`./statehandler/${statename}`);
                const handler = new StateHandler(this.adapter, device, statename);
                resolve(handler.get());
            } catch (err) {
                reject(err);
            }
        });
    }

    _handleErorr(error) {
        if (!error) {
            this.response.status(500).send("unknwon error");
        } else {
            const statusCode = error.status_code || 500;
            let errMsg = "";
            if (error.status_text) {
                errMsg = error.status_text;
            } else if (error instanceof Error) {
                errMsg = error.message;
            } else if (error instanceof String) {
                errMsg = error;
            } else {
                errMsg = JSON.stringify(error);
            }

            this.logger.error(error.stack);
            this.logger.error(errMsg);
            this.response.status(statusCode).send(errMsg);
        }
    }
};
