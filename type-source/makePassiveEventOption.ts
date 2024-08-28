// Determines if the browser supprots passive events
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
let passiveSupported = false;
try {
  const options = {
    get passive() {
      passiveSupported = true;
      return false;
    }
  };
  // @ts-ignore
  window.addEventListener("test", options, options);
  // @ts-ignore
  window.removeEventListener("test", options, options);
} catch(e) {
  passiveSupported = false;
}

export default function makePassiveEventOption(passive?: boolean) {
  return passiveSupported ? { passive } : passive;
}
