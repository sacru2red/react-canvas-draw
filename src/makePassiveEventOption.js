"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Determines if the browser supprots passive events
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
var passiveSupported = false;
try {
    var options = {
        get passive() {
            passiveSupported = true;
            return false;
        }
    };
    // @ts-ignore
    window.addEventListener("test", options, options);
    // @ts-ignore
    window.removeEventListener("test", options, options);
}
catch (e) {
    passiveSupported = false;
}
function makePassiveEventOption(passive) {
    return passiveSupported ? { passive: passive } : passive;
}
exports.default = makePassiveEventOption;
