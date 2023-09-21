// @ts-nocheck
const StateHandler = require("./statehandler");

module.exports = class TargetSetpointHandler extends StateHandler {
    constructor(adapter, device, statename) {
        super(adapter, device, statename, "ThermostatController");
    }
};
