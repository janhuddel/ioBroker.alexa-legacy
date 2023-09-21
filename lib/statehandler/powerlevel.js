// @ts-nocheck
const StateHandler = require("./statehandler");

module.exports = class PowerLevelHandler extends StateHandler {
    constructor(adapter, device, statename) {
        super(adapter, device, statename, "PowerLevelController");
    }
};
