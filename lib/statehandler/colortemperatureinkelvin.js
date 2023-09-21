// @ts-nocheck
const StateHandler = require("./statehandler");

module.exports = class ColorTemperatureHandler extends StateHandler {
    constructor(adapter, objectId, statename) {
        super(adapter, objectId, statename, "ColorTemperatureController");
    }

    /**
     * kelvin -> mired (https://en.wikipedia.org/wiki/Mired)
     */
    convertToNative(val) {
        const mired = Math.trunc(1000000 / val);
        return mired;
    }

    /**
     * mired -> kelvin (https://en.wikipedia.org/wiki/Mired)
     */
    convertFromNative(val) {
        const kelvin = Math.trunc(1000000 / val);
        return Math.round(kelvin / 100) * 100;
    }
};
