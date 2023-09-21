// @ts-nocheck
module.exports = class StateHandler {
    constructor(adapter, device, statename, capability) {
        this.adapter = adapter;
        this.device = device;
        this.statename = statename;
        this.capability = capability;
    }

    set(newValue) {
        return new Promise((resolve, reject) => {
            const dp = this.device.capabilities[this.capability].targetState;
            if (dp) {
                const native = this.convertToNative(newValue);
                this.adapter.log.debug(`setting state for ${dp} to ${native}...`);
                this.setDesiredState(dp, native)
                    .then(() => resolve())
                    .catch((err) => reject(err));
            } else {
                reject(`${this.objectId} has no datapoint for '${this.statename}'`);
            }
        });
    }

    get() {
        return new Promise((resolve, reject) => {
            const dp = this.device.capabilities[this.capability].targetState;
            if (dp) {
                this.adapter.log.debug(`reading state for ${dp}...`);
                this.getCurrentState(dp)
                    .then((state) => {
                        this.adapter.log.debug(`state [native]: ${state.val}`);
                        state.val = this.convertFromNative(state.val);
                        this.adapter.log.debug(`state [converted]: ${state.val}`);
                        resolve(state);
                    })
                    .catch((err) => reject(err));
            } else {
                reject(`${this.objectId} has no datapoint for '${this.statename}'`);
            }
        });
    }

    setDesiredState(datapoint, nativeValue) {
        return new Promise((resolve, reject) => {
            this.adapter.setForeignState(datapoint, nativeValue, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(); // nothing to return
                }
            });
        });
    }

    getCurrentState(datapoint) {
        return new Promise((resolve, reject) => {
            this.adapter.getForeignState(datapoint, (err, state) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(state);
                }
            });
        });
    }

    convertToNative(val) {
        return val;
    }

    convertFromNative(val) {
        return val;
    }
};
