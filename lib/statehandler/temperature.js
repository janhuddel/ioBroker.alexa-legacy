// @ts-nocheck
const StateHandler = require("./statehandler");

module.exports = class TemperatureHandler extends StateHandler {
    constructor(adapter, device, statename) {
        super(adapter, device, statename, "TemperatureSensor");
    }
};
