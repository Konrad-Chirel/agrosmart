// Polyfill: DOMException n'existe pas dans Hermes/React Native
// On utilise 'global' (garanti dans RN) au lieu de 'globalThis'
var g = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
if (typeof g.DOMException === 'undefined') {
  function DOMExceptionPolyfill(message, name) {
    var err = new Error(message);
    err.name = name || 'DOMException';
    err.code = 0;
    return err;
  }
  DOMExceptionPolyfill.prototype = Object.create(Error.prototype);
  g.DOMException = DOMExceptionPolyfill;
}

// Maintenant on charge l'application
require('expo/AppEntry');
