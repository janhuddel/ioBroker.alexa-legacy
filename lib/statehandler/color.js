// @ts-nocheck
const StateHandler = require("./statehandler");
const Color = require("color");
const hueconv = require("@q42philips/hue-color-converter");

module.exports = class ColorHandler extends StateHandler {
    constructor(adapter, objectId, statename) {
        super(adapter, objectId, statename, "ColorController");
    }

    /**
     * HSV/B -> RGB
     */
    convertToNative(val) {
        const rgb = Color.hsv(
            parseFloat(val.hue),
            parseFloat(val.saturation) * 100,
            parseFloat(val.brightness) * 100,
        ).rgb();

        const xy = hueconv.calculateXY(rgb.red(), rgb.green(), rgb.blue());
        return `${xy[0]},${xy[1]}`;
    }

    convertFromNative(val) {
        return null;
    }
};
