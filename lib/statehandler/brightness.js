// @ts-nocheck
const StateHandler = require("./statehandler");

module.exports = class BrightnessHandler extends StateHandler {
    constructor(adapter, objectId, statename) {
        super(adapter, objectId, statename, {
            hue: "bri",
        });
    }
};
