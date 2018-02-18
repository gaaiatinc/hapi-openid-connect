"use strict";

const promiseSequencer = (promiseGenArray, initialValue) => {
    let initialValuePromise = Promise.resolve(initialValue);
    return promiseGenArray.reduce((promAccumulator, promGenFn) => {
        return promAccumulator = promAccumulator.then(promGenFn);
    }, initialValuePromise);
};


module.exports = {
    promiseSequencer
};
