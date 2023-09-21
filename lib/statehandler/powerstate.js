// @ts-nocheck
const StateHandler = require("./statehandler");

module.exports = class PowerStateHandler extends StateHandler {
    constructor(adapter, device, statename) {
        super(adapter, device, statename, "PowerController");
    }
};
