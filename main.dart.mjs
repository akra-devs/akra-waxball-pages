// Compiles a dart2wasm-generated main module from `source` which can then
// instantiatable via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm modules from `bytes` which is then
// instantiatable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export async function instantiate(modulePromise, importObjectPromise) {
  var moduleOrCompiledApp = await modulePromise;
  if (!(moduleOrCompiledApp instanceof CompiledApp)) {
    moduleOrCompiledApp = new CompiledApp(moduleOrCompiledApp);
  }
  const instantiatedApp = await moduleOrCompiledApp.instantiate(await importObjectPromise);
  return instantiatedApp.instantiatedModule;
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export const invoke = (moduleInstance, ...args) => {
  moduleInstance.exports.$invokeMain(args);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arugments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `load-ids` option is passed. Each load ID maps to one
  //   or more wasm files as specified in the emitted JSON file. It also takes a
  //   callback that should be invoked for each loaded module with 2 arugments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDynamicModule` is a JS function that takes two string names matching,
  //   in order, a wasm file produced by the dart2wasm compiler during dynamic
  //   module compilation and a corresponding js file produced by the same
  //   compilation. It also takes a callback that should be invoked with the
  //   loaded module in a format supported by `WebAssembly.compile` or
  //   `WebAssembly.compileStreaming` and the result of using the JS 'import'
  //   API on the js file path. It should return a Promise that resolves when
  //   all the modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports,
      {loadDeferredModules, loadDynamicModule, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            _1: (decoder, codeUnits) => decoder.decode(codeUnits),
      _2: () => new TextDecoder("utf-8", {fatal: true}),
      _3: () => new TextDecoder("utf-8", {fatal: false}),
      _4: (s) => +s,
      _5: x0 => new Uint8Array(x0),
      _6: (x0,x1,x2) => x0.set(x1,x2),
      _7: (x0,x1) => x0.transferFromImageBitmap(x1),
      _9: (x0,x1,x2) => x0.slice(x1,x2),
      _10: (x0,x1) => x0.decode(x1),
      _11: (x0,x1) => x0.segment(x1),
      _12: () => new TextDecoder(),
      _14: x0 => x0.buffer,
      _15: x0 => x0.wasmMemory,
      _16: () => globalThis.window._flutter_skwasmInstance,
      _17: x0 => x0.rasterStartMilliseconds,
      _18: x0 => x0.rasterEndMilliseconds,
      _19: x0 => x0.imageBitmaps,
      _135: (x0,x1) => x0.appendChild(x1),
      _166: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _167: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      _168: (x0,x1) => new OffscreenCanvas(x0,x1),
      _169: x0 => x0.remove(),
      _170: (x0,x1) => x0.append(x1),
      _172: x0 => x0.unlock(),
      _173: x0 => x0.getReader(),
      _174: (x0,x1) => x0.item(x1),
      _175: x0 => x0.next(),
      _176: x0 => x0.now(),
      _177: (x0,x1) => x0.revokeObjectURL(x1),
      _178: x0 => x0.close(),
      _179: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      _180: x0 => new window.ImageDecoder(x0),
      _181: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      _182: (x0,x1) => x0.decode(x1),
      _183: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._183(f,arguments.length,x0) }),
      _184: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _186: (x0,x1) => x0.getModifierState(x1),
      _187: x0 => x0.preventDefault(),
      _188: x0 => x0.stopPropagation(),
      _189: (x0,x1) => x0.removeProperty(x1),
      _190: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._190(f,arguments.length,x0) }),
      _191: x0 => new window.FinalizationRegistry(x0),
      _192: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      _194: (x0,x1) => x0.unregister(x1),
      _195: (x0,x1) => x0.prepend(x1),
      _196: x0 => new Intl.Locale(x0),
      _197: (x0,x1) => x0.observe(x1),
      _198: x0 => x0.disconnect(),
      _199: (x0,x1) => x0.getAttribute(x1),
      _200: (x0,x1) => x0.contains(x1),
      _201: (x0,x1) => x0.querySelector(x1),
      _202: (x0,x1) => x0.matchMedia(x1),
      _203: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._203(f,arguments.length,x0) }),
      _204: (x0,x1,x2) => x0.call(x1,x2),
      _205: x0 => x0.blur(),
      _206: x0 => x0.hasFocus(),
      _207: (x0,x1) => x0.removeAttribute(x1),
      _208: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _209: (x0,x1) => x0.hasAttribute(x1),
      _210: (x0,x1) => x0.getModifierState(x1),
      _211: (x0,x1) => x0.createTextNode(x1),
      _212: x0 => x0.getBoundingClientRect(),
      _213: (x0,x1) => x0.replaceWith(x1),
      _214: (x0,x1) => x0.contains(x1),
      _215: (x0,x1) => x0.closest(x1),
      _653: x0 => new Uint8Array(x0),
      _656: () => globalThis.window.flutterConfiguration,
      _658: x0 => x0.assetBase,
      _663: x0 => x0.canvasKitMaximumSurfaces,
      _664: x0 => x0.debugShowSemanticsNodes,
      _665: x0 => x0.hostElement,
      _666: x0 => x0.multiViewEnabled,
      _667: x0 => x0.nonce,
      _669: x0 => x0.fontFallbackBaseUrl,
      _679: x0 => x0.console,
      _680: x0 => x0.devicePixelRatio,
      _681: x0 => x0.document,
      _682: x0 => x0.history,
      _683: x0 => x0.innerHeight,
      _684: x0 => x0.innerWidth,
      _685: x0 => x0.location,
      _686: x0 => x0.navigator,
      _687: x0 => x0.visualViewport,
      _688: x0 => x0.performance,
      _689: x0 => x0.parent,
      _691: x0 => x0.URL,
      _693: (x0,x1) => x0.getComputedStyle(x1),
      _694: x0 => x0.screen,
      _695: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._695(f,arguments.length,x0) }),
      _696: (x0,x1) => x0.requestAnimationFrame(x1),
      _700: (x0,x1) => x0.warn(x1),
      _702: (x0,x1) => x0.debug(x1),
      _703: x0 => globalThis.parseFloat(x0),
      _704: () => globalThis.window,
      _705: () => globalThis.Intl,
      _706: () => globalThis.Symbol,
      _707: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      _709: x0 => x0.clipboard,
      _710: x0 => x0.maxTouchPoints,
      _711: x0 => x0.vendor,
      _712: x0 => x0.language,
      _713: x0 => x0.platform,
      _714: x0 => x0.userAgent,
      _715: (x0,x1) => x0.vibrate(x1),
      _716: x0 => x0.languages,
      _717: x0 => x0.documentElement,
      _718: (x0,x1) => x0.querySelector(x1),
      _719: (x0,x1) => x0.querySelectorAll(x1),
      _721: (x0,x1) => x0.createElement(x1),
      _724: (x0,x1) => x0.createEvent(x1),
      _725: x0 => x0.activeElement,
      _728: x0 => x0.head,
      _729: x0 => x0.body,
      _731: (x0,x1) => { x0.title = x1 },
      _734: x0 => x0.visibilityState,
      _735: () => globalThis.document,
      _736: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._736(f,arguments.length,x0) }),
      _737: (x0,x1) => x0.dispatchEvent(x1),
      _745: x0 => x0.target,
      _747: x0 => x0.timeStamp,
      _748: x0 => x0.type,
      _750: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      _757: x0 => x0.firstChild,
      _761: x0 => x0.parentElement,
      _763: (x0,x1) => { x0.textContent = x1 },
      _764: x0 => x0.parentNode,
      _765: x0 => x0.nextSibling,
      _766: (x0,x1) => x0.removeChild(x1),
      _767: x0 => x0.isConnected,
      _775: x0 => x0.clientHeight,
      _776: x0 => x0.clientWidth,
      _777: x0 => x0.offsetHeight,
      _778: x0 => x0.offsetWidth,
      _779: x0 => x0.id,
      _780: (x0,x1) => { x0.id = x1 },
      _783: (x0,x1) => { x0.spellcheck = x1 },
      _784: x0 => x0.tagName,
      _785: x0 => x0.style,
      _787: (x0,x1) => x0.querySelectorAll(x1),
      _788: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _789: x0 => x0.tabIndex,
      _790: (x0,x1) => { x0.tabIndex = x1 },
      _791: (x0,x1) => x0.focus(x1),
      _792: x0 => x0.scrollTop,
      _793: (x0,x1) => { x0.scrollTop = x1 },
      _794: (x0,x1) => { x0.scrollLeft = x1 },
      _795: x0 => x0.scrollLeft,
      _796: x0 => x0.classList,
      _797: (x0,x1) => x0.scrollIntoView(x1),
      _800: (x0,x1) => { x0.className = x1 },
      _802: (x0,x1) => x0.getElementsByClassName(x1),
      _803: x0 => x0.click(),
      _804: (x0,x1) => x0.attachShadow(x1),
      _807: x0 => x0.computedStyleMap(),
      _808: (x0,x1) => x0.get(x1),
      _814: (x0,x1) => x0.getPropertyValue(x1),
      _815: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      _816: x0 => x0.offsetLeft,
      _817: x0 => x0.offsetTop,
      _818: x0 => x0.offsetParent,
      _820: (x0,x1) => { x0.name = x1 },
      _821: x0 => x0.content,
      _822: (x0,x1) => { x0.content = x1 },
      _826: (x0,x1) => { x0.src = x1 },
      _827: x0 => x0.naturalWidth,
      _828: x0 => x0.naturalHeight,
      _832: (x0,x1) => { x0.crossOrigin = x1 },
      _834: (x0,x1) => { x0.decoding = x1 },
      _835: x0 => x0.decode(),
      _840: (x0,x1) => { x0.nonce = x1 },
      _845: (x0,x1) => { x0.width = x1 },
      _847: (x0,x1) => { x0.height = x1 },
      _850: (x0,x1) => x0.getContext(x1),
      _918: x0 => x0.width,
      _919: x0 => x0.height,
      _921: (x0,x1) => x0.fetch(x1),
      _922: x0 => x0.status,
      _924: x0 => x0.body,
      _925: x0 => x0.arrayBuffer(),
      _928: x0 => x0.read(),
      _929: x0 => x0.value,
      _930: x0 => x0.done,
      _937: x0 => x0.name,
      _938: x0 => x0.x,
      _939: x0 => x0.y,
      _942: x0 => x0.top,
      _943: x0 => x0.right,
      _944: x0 => x0.bottom,
      _945: x0 => x0.left,
      _955: x0 => x0.height,
      _956: x0 => x0.width,
      _957: x0 => x0.scale,
      _958: (x0,x1) => { x0.value = x1 },
      _961: (x0,x1) => { x0.placeholder = x1 },
      _963: (x0,x1) => { x0.name = x1 },
      _964: x0 => x0.selectionDirection,
      _965: x0 => x0.selectionStart,
      _966: x0 => x0.selectionEnd,
      _969: x0 => x0.value,
      _971: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _972: x0 => x0.readText(),
      _973: (x0,x1) => x0.writeText(x1),
      _975: x0 => x0.altKey,
      _976: x0 => x0.code,
      _977: x0 => x0.ctrlKey,
      _978: x0 => x0.key,
      _979: x0 => x0.keyCode,
      _980: x0 => x0.location,
      _981: x0 => x0.metaKey,
      _982: x0 => x0.repeat,
      _983: x0 => x0.shiftKey,
      _984: x0 => x0.isComposing,
      _986: x0 => x0.state,
      _987: (x0,x1) => x0.go(x1),
      _989: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      _990: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      _991: x0 => x0.pathname,
      _992: x0 => x0.search,
      _993: x0 => x0.hash,
      _997: x0 => x0.state,
      _1000: (x0,x1) => x0.createObjectURL(x1),
      _1002: x0 => new Blob(x0),
      _1012: x0 => x0.matches,
      _1016: x0 => x0.matches,
      _1020: x0 => x0.relatedTarget,
      _1022: x0 => x0.clientX,
      _1023: x0 => x0.clientY,
      _1024: x0 => x0.offsetX,
      _1025: x0 => x0.offsetY,
      _1028: x0 => x0.button,
      _1029: x0 => x0.buttons,
      _1030: x0 => x0.ctrlKey,
      _1034: x0 => x0.pointerId,
      _1035: x0 => x0.pointerType,
      _1036: x0 => x0.pressure,
      _1037: x0 => x0.tiltX,
      _1038: x0 => x0.tiltY,
      _1039: x0 => x0.getCoalescedEvents(),
      _1042: x0 => x0.deltaX,
      _1043: x0 => x0.deltaY,
      _1044: x0 => x0.wheelDeltaX,
      _1045: x0 => x0.wheelDeltaY,
      _1046: x0 => x0.deltaMode,
      _1053: x0 => x0.changedTouches,
      _1056: x0 => x0.clientX,
      _1057: x0 => x0.clientY,
      _1060: x0 => x0.data,
      _1063: (x0,x1) => { x0.disabled = x1 },
      _1065: (x0,x1) => { x0.type = x1 },
      _1066: (x0,x1) => { x0.max = x1 },
      _1067: (x0,x1) => { x0.min = x1 },
      _1068: x0 => x0.value,
      _1069: (x0,x1) => { x0.value = x1 },
      _1070: x0 => x0.disabled,
      _1071: (x0,x1) => { x0.disabled = x1 },
      _1073: (x0,x1) => { x0.placeholder = x1 },
      _1075: (x0,x1) => { x0.name = x1 },
      _1076: (x0,x1) => { x0.autocomplete = x1 },
      _1078: x0 => x0.selectionDirection,
      _1079: x0 => x0.selectionStart,
      _1081: x0 => x0.selectionEnd,
      _1084: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _1085: (x0,x1) => x0.add(x1),
      _1087: (x0,x1) => { x0.noValidate = x1 },
      _1088: (x0,x1) => { x0.method = x1 },
      _1089: (x0,x1) => { x0.action = x1 },
      _1114: x0 => x0.orientation,
      _1115: x0 => x0.width,
      _1116: x0 => x0.height,
      _1117: (x0,x1) => x0.lock(x1),
      _1136: x0 => new ResizeObserver(x0),
      _1139: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1139(f,arguments.length,x0,x1) }),
      _1147: x0 => x0.length,
      _1148: x0 => x0.iterator,
      _1149: x0 => x0.Segmenter,
      _1150: x0 => x0.v8BreakIterator,
      _1151: (x0,x1) => new Intl.Segmenter(x0,x1),
      _1154: x0 => x0.language,
      _1155: x0 => x0.script,
      _1156: x0 => x0.region,
      _1174: x0 => x0.done,
      _1175: x0 => x0.value,
      _1176: x0 => x0.index,
      _1180: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      _1181: (x0,x1) => x0.adoptText(x1),
      _1182: x0 => x0.first(),
      _1183: x0 => x0.next(),
      _1184: x0 => x0.current(),
      _1186: () => globalThis.window.FinalizationRegistry,
      _1197: x0 => x0.hostElement,
      _1198: x0 => x0.viewConstraints,
      _1201: x0 => x0.maxHeight,
      _1202: x0 => x0.maxWidth,
      _1203: x0 => x0.minHeight,
      _1204: x0 => x0.minWidth,
      _1205: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1205(f,arguments.length,x0) }),
      _1206: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1206(f,arguments.length,x0) }),
      _1207: (x0,x1) => ({addView: x0,removeView: x1}),
      _1210: x0 => x0.loader,
      _1211: () => globalThis._flutter,
      _1212: (x0,x1) => x0.didCreateEngineInitializer(x1),
      _1213: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1213(f,arguments.length,x0) }),
      _1214: (module,f) => finalizeWrapper(f, function() { return module.exports._1214(f,arguments.length) }),
      _1215: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      _1218: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1218(f,arguments.length,x0) }),
      _1219: x0 => ({runApp: x0}),
      _1221: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1221(f,arguments.length,x0,x1) }),
      _1222: x0 => new Promise(x0),
      _1223: x0 => x0.length,
      _1224: () => globalThis.window.ImageDecoder,
      _1225: x0 => x0.tracks,
      _1227: x0 => x0.completed,
      _1229: x0 => x0.image,
      _1235: x0 => x0.displayWidth,
      _1236: x0 => x0.displayHeight,
      _1237: x0 => x0.duration,
      _1240: x0 => x0.ready,
      _1241: x0 => x0.selectedTrack,
      _1242: x0 => x0.repetitionCount,
      _1243: x0 => x0.frameCount,
      _1298: x0 => globalThis.URL.createObjectURL(x0),
      _1299: x0 => new Blob(x0),
      _1301: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _1302: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      _1303: (x0,x1) => x0.createElement(x1),
      _1310: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1311: x0 => globalThis.glGetError(x0),
      _1312: (x0,x1) => globalThis.glCanvas(x0,x1),
      _1313: (x0,x1,x2,x3,x4) => globalThis.glScissor(x0,x1,x2,x3,x4),
      _1314: (x0,x1,x2,x3,x4) => globalThis.glViewport(x0,x1,x2,x3,x4),
      _1315: (x0,x1) => globalThis.glGetExtension(x0,x1),
      _1318: x0 => globalThis.glCreateTexture(x0),
      _1319: (x0,x1,x2) => globalThis.glBindTexture(x0,x1,x2),
      _1320: (x0,x1,x2,x3,x4,x5) => globalThis.glDrawElementsInstanced(x0,x1,x2,x3,x4,x5),
      _1321: (x0,x1) => globalThis.glActiveTexture(x0,x1),
      _1322: (x0,x1,x2,x3) => globalThis.glTexParameteri(x0,x1,x2,x3),
      _1323: (x0,x1) => globalThis.glGetParameter(x0,x1),
      _1324: (x0,x1,x2,x3,x4,x5,x6) => globalThis.glTexImage2D_NOSIZE(x0,x1,x2,x3,x4,x5,x6),
      _1325: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => globalThis.glTexImage2D(x0,x1,x2,x3,x4,x5,x6,x7,x8,x9),
      _1326: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10) => globalThis.glTexImage3D(x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10),
      _1327: (x0,x1) => globalThis.glDepthFunc(x0,x1),
      _1328: (x0,x1) => globalThis.glDepthMask(x0,x1),
      _1329: (x0,x1) => globalThis.glEnable(x0,x1),
      _1330: (x0,x1) => globalThis.glDisable(x0,x1),
      _1331: (x0,x1) => globalThis.glBlendEquation(x0,x1),
      _1332: (x0,x1) => globalThis.glUseProgram(x0,x1),
      _1333: (x0,x1,x2,x3,x4) => globalThis.glBlendFuncSeparate(x0,x1,x2,x3,x4),
      _1334: (x0,x1,x2) => globalThis.glBlendFunc(x0,x1,x2),
      _1335: (x0,x1,x2) => globalThis.glBlendEquationSeparate(x0,x1,x2),
      _1336: (x0,x1) => globalThis.glFrontFace(x0,x1),
      _1337: (x0,x1) => globalThis.glCullFace(x0,x1),
      _1338: (x0,x1) => globalThis.glLineWidth(x0,x1),
      _1339: (x0,x1,x2) => globalThis.glPolygonOffset(x0,x1,x2),
      _1340: (x0,x1) => globalThis.glStencilMask(x0,x1),
      _1341: (x0,x1,x2,x3) => globalThis.glStencilFunc(x0,x1,x2,x3),
      _1342: (x0,x1,x2,x3) => globalThis.glStencilOp(x0,x1,x2,x3),
      _1343: (x0,x1) => globalThis.glClearStencil(x0,x1),
      _1344: (x0,x1) => globalThis.glClearDepth(x0,x1),
      _1345: (x0,x1,x2,x3,x4) => globalThis.glColorMask(x0,x1,x2,x3,x4),
      _1346: (x0,x1,x2,x3,x4) => globalThis.glClearColor(x0,x1,x2,x3,x4),
      _1348: (x0,x1) => globalThis.glGenerateMipmap(x0,x1),
      _1349: (x0,x1) => globalThis.glDeleteTexture(x0,x1),
      _1350: (x0,x1) => globalThis.glDeleteFramebuffer(x0,x1),
      _1351: (x0,x1) => globalThis.glDeleteRenderbuffer(x0,x1),
      _1352: (x0,x1,x2,x3) => globalThis.glTexParameterf(x0,x1,x2,x3),
      _1353: (x0,x1,x2) => globalThis.glPixelStorei(x0,x1,x2),
      _1355: (x0,x1,x2) => globalThis.glGetProgramParameter(x0,x1,x2),
      _1356: (x0,x1,x2) => globalThis.glGetActiveUniform(x0,x1,x2),
      _1357: (x0,x1,x2) => globalThis.glGetActiveAttrib(x0,x1,x2),
      _1358: (x0,x1,x2) => globalThis.glGetUniformLocation(x0,x1,x2),
      _1359: (x0,x1) => globalThis.glClear(x0,x1),
      _1360: x0 => globalThis.glCreateBuffer(x0),
      _1361: (x0,x1,x2,x3) => globalThis.glClearBufferuiv(x0,x1,x2,x3),
      _1362: (x0,x1,x2,x3) => globalThis.glClearBufferiv(x0,x1,x2,x3),
      _1363: (x0,x1,x2) => globalThis.glBindBuffer(x0,x1,x2),
      _1366: (x0,x1,x2,x3) => globalThis.glBufferData(x0,x1,x2,x3),
      _1367: (x0,x1,x2,x3,x4,x5,x6) => globalThis.glVertexAttribPointer(x0,x1,x2,x3,x4,x5,x6),
      _1368: (x0,x1,x2,x3) => globalThis.glDrawArrays(x0,x1,x2,x3),
      _1369: (x0,x1,x2,x3,x4) => globalThis.glDrawArraysInstanced(x0,x1,x2,x3,x4),
      _1370: (x0,x1,x2) => globalThis.glBindFramebuffer(x0,x1,x2),
      _1372: (x0,x1,x2,x3,x4,x5) => globalThis.glFramebufferTextureLayer(x0,x1,x2,x3,x4,x5),
      _1373: (x0,x1,x2,x3,x4,x5) => globalThis.glFramebufferTexture2D(x0,x1,x2,x3,x4,x5),
      _1379: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => globalThis.glTexSubImage2D(x0,x1,x2,x3,x4,x5,x6,x7,x8,x9),
      _1380: (x0,x1,x2,x3,x4,x5,x6,x7) => globalThis.glTexSubImage2D_NOSIZE(x0,x1,x2,x3,x4,x5,x6,x7),
      _1381: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11) => globalThis.glTexSubImage3D(x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11),
      _1385: (x0,x1,x2) => globalThis.glBindRenderbuffer(x0,x1,x2),
      _1386: (x0,x1,x2,x3,x4,x5) => globalThis.glRenderbufferStorageMultisample(x0,x1,x2,x3,x4,x5),
      _1387: (x0,x1,x2,x3,x4) => globalThis.glRenderbufferStorage(x0,x1,x2,x3,x4),
      _1388: (x0,x1,x2,x3,x4) => globalThis.glFramebufferRenderbuffer(x0,x1,x2,x3,x4),
      _1389: x0 => globalThis.glCreateRenderbuffer(x0),
      _1390: x0 => globalThis.glCreateFramebuffer(x0),
      _1391: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10) => globalThis.glBlitFramebuffer(x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10),
      _1392: (x0,x1,x2,x3) => globalThis.glBufferSubData(x0,x1,x2,x3),
      _1393: x0 => globalThis.glCreateVertexArray(x0),
      _1394: x0 => globalThis.glCreateProgram(x0),
      _1395: (x0,x1,x2) => globalThis.glAttachShader(x0,x1,x2),
      _1396: (x0,x1,x2,x3) => globalThis.glBindAttribLocation(x0,x1,x2,x3),
      _1397: (x0,x1) => globalThis.glLinkProgram(x0,x1),
      _1398: (x0,x1) => globalThis.glGetProgramInfoLog(x0,x1),
      _1399: (x0,x1) => globalThis.glGetShaderInfoLog(x0,x1),
      _1400: (x0,x1) => globalThis.glDeleteShader(x0,x1),
      _1401: (x0,x1) => globalThis.glDeleteProgram(x0,x1),
      _1402: (x0,x1) => globalThis.glDeleteBuffer(x0,x1),
      _1403: (x0,x1) => globalThis.glBindVertexArray(x0,x1),
      _1404: (x0,x1) => globalThis.glDeleteVertexArray(x0,x1),
      _1405: (x0,x1) => globalThis.glEnableVertexAttribArray(x0,x1),
      _1406: (x0,x1) => globalThis.glDisableVertexAttribArray(x0,x1),
      _1407: (x0,x1,x2,x3,x4,x5) => globalThis.glVertexAttribIPointer(x0,x1,x2,x3,x4,x5),
      _1408: (x0,x1,x2) => globalThis.glVertexAttrib2fv(x0,x1,x2),
      _1409: (x0,x1,x2) => globalThis.glVertexAttrib3fv(x0,x1,x2),
      _1410: (x0,x1,x2) => globalThis.glVertexAttrib4fv(x0,x1,x2),
      _1411: (x0,x1,x2) => globalThis.glVertexAttrib1fv(x0,x1,x2),
      _1412: (x0,x1,x2,x3,x4) => globalThis.glDrawElements(x0,x1,x2,x3,x4),
      _1413: (x0,x1) => globalThis.glDrawBuffers(x0,x1),
      _1414: (x0,x1) => globalThis.glCreateShader(x0,x1),
      _1415: (x0,x1,x2) => globalThis.glShaderSource(x0,x1,x2),
      _1416: (x0,x1) => globalThis.glCompileShader(x0,x1),
      _1417: (x0,x1,x2) => globalThis.glGetShaderParameter(x0,x1,x2),
      _1418: (x0,x1) => globalThis.glGetShaderSource(x0,x1),
      _1419: (x0,x1,x2) => globalThis.glUniform1i(x0,x1,x2),
      _1420: (x0,x1,x2,x3,x4) => globalThis.glUniform3f(x0,x1,x2,x3,x4),
      _1421: (x0,x1,x2,x3,x4,x5) => globalThis.glUniform4f(x0,x1,x2,x3,x4,x5),
      _1422: (x0,x1,x2) => globalThis.glUniform1fv(x0,x1,x2),
      _1423: (x0,x1,x2) => globalThis.glUniform2fv(x0,x1,x2),
      _1424: (x0,x1,x2) => globalThis.glUniform3fv(x0,x1,x2),
      _1425: (x0,x1,x2) => globalThis.glUniform1f(x0,x1,x2),
      _1426: (x0,x1,x2,x3) => globalThis.glUniformMatrix2fv(x0,x1,x2,x3),
      _1427: (x0,x1,x2,x3) => globalThis.glUniformMatrix3fv(x0,x1,x2,x3),
      _1428: (x0,x1,x2,x3) => globalThis.glUniformMatrix4fv(x0,x1,x2,x3),
      _1429: (x0,x1,x2) => globalThis.glGetAttribLocation(x0,x1,x2),
      _1430: (x0,x1,x2,x3) => globalThis.glUniform2f(x0,x1,x2,x3),
      _1431: (x0,x1,x2) => globalThis.glUniform1iv(x0,x1,x2),
      _1432: (x0,x1,x2) => globalThis.glUniform2iv(x0,x1,x2),
      _1433: (x0,x1,x2) => globalThis.glUniform3iv(x0,x1,x2),
      _1434: (x0,x1,x2) => globalThis.glUniform4iv(x0,x1,x2),
      _1435: (x0,x1,x2) => globalThis.glUniform1uiv(x0,x1,x2),
      _1436: (x0,x1,x2) => globalThis.glUniform2uiv(x0,x1,x2),
      _1437: (x0,x1,x2) => globalThis.glUniform3uiv(x0,x1,x2),
      _1438: (x0,x1,x2) => globalThis.glUniform4uiv(x0,x1,x2),
      _1439: (x0,x1,x2) => globalThis.glUniform1ui(x0,x1,x2),
      _1443: (x0,x1,x2) => globalThis.glUniform4fv(x0,x1,x2),
      _1444: (x0,x1,x2) => globalThis.glVertexAttribDivisor(x0,x1,x2),
      _1445: x0 => globalThis.glFlush(x0),
      _1447: (x0,x1,x2,x3,x4,x5) => globalThis.glTexStorage2D(x0,x1,x2,x3,x4,x5),
      _1448: (x0,x1,x2,x3,x4,x5,x6) => globalThis.glTexStorage3D(x0,x1,x2,x3,x4,x5,x6),
      _1459: (x0,x1,x2) => globalThis.glInvalidateFramebuffer(x0,x1,x2),
      _1461: (x0,x1) => globalThis.glDrawingBufferColorSpace(x0,x1),
      _1462: (x0,x1) => globalThis.glUnpackColorSpace(x0,x1),
      _1470: () => new AudioContext(),
      _1471: (x0,x1) => x0.createMediaElementSource(x1),
      _1472: x0 => x0.createGain(),
      _1473: x0 => x0.createStereoPanner(),
      _1474: (x0,x1) => x0.connect(x1),
      _1475: x0 => x0.load(),
      _1476: x0 => x0.disconnect(),
      _1477: x0 => x0.remove(),
      _1478: x0 => x0.resume(),
      _1479: x0 => x0.play(),
      _1480: x0 => x0.pause(),
      _1481: x0 => x0.close(),
      _1490: (x0,x1) => x0.getItem(x1),
      _1491: (x0,x1) => x0.removeItem(x1),
      _1492: (x0,x1,x2) => x0.setItem(x1,x2),
      _1493: () => globalThis.firebase_core.getApps(),
      _1496: x0 => globalThis.firebase_core.getApp(x0),
      _1497: () => globalThis.firebase_core.getApp(),
      _1498: (x0,x1,x2) => globalThis.firebase_core.registerVersion(x0,x1,x2),
      _1500: () => globalThis.firebase_core.SDK_VERSION,
      _1506: x0 => x0.apiKey,
      _1508: x0 => x0.authDomain,
      _1510: x0 => x0.databaseURL,
      _1512: x0 => x0.projectId,
      _1514: x0 => x0.storageBucket,
      _1516: x0 => x0.messagingSenderId,
      _1518: x0 => x0.measurementId,
      _1520: x0 => x0.appId,
      _1522: x0 => x0.name,
      _1523: x0 => x0.options,
      _1526: (x0,x1) => x0.debug(x1),
      _1527: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1527(f,arguments.length,x0) }),
      _1528: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1528(f,arguments.length,x0,x1) }),
      _1529: (x0,x1) => ({createScript: x0,createScriptURL: x1}),
      _1530: (x0,x1,x2) => x0.createPolicy(x1,x2),
      _1531: (x0,x1) => x0.createScriptURL(x1),
      _1532: (x0,x1,x2) => x0.createScript(x1,x2),
      _1533: (x0,x1) => x0.appendChild(x1),
      _1534: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1534(f,arguments.length,x0) }),
      _1536: Date.now,
      _1538: s => new Date(s * 1000).getTimezoneOffset() * 60,
      _1539: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      _1540: () => typeof dartUseDateNowForTicks !== "undefined",
      _1541: () => 1000 * performance.now(),
      _1542: () => Date.now(),
      _1543: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      _1544: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      _1545: () => new WeakMap(),
      _1546: (map, o) => map.get(o),
      _1547: (map, o, v) => map.set(o, v),
      _1548: x0 => new WeakRef(x0),
      _1549: x0 => x0.deref(),
      _1556: () => globalThis.WeakRef,
      _1560: s => JSON.stringify(s),
      _1561: s => printToConsole(s),
      _1562: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      _1563: (o, p, r) => o.replaceAll(p, () => r),
      _1564: (o, p, r) => o.replace(p, () => r),
      _1565: Function.prototype.call.bind(String.prototype.toLowerCase),
      _1566: s => s.toUpperCase(),
      _1567: s => s.trim(),
      _1568: s => s.trimLeft(),
      _1569: s => s.trimRight(),
      _1570: (string, times) => string.repeat(times),
      _1571: Function.prototype.call.bind(String.prototype.indexOf),
      _1572: (s, p, i) => s.lastIndexOf(p, i),
      _1573: (string, token) => string.split(token),
      _1574: Object.is,
      _1579: (o, c) => o instanceof c,
      _1580: o => Object.keys(o),
      _1582: (o) => {
        const typeofValue = typeof o;
        return (typeofValue === 'object') ||
            typeofValue === 'function';
      },
      _1634: x0 => new Array(x0),
      _1636: x0 => x0.length,
      _1638: (x0,x1) => x0[x1],
      _1639: (x0,x1,x2) => { x0[x1] = x2 },
      _1642: (x0,x1,x2) => new DataView(x0,x1,x2),
      _1644: x0 => new Int8Array(x0),
      _1645: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      _1647: x0 => new Uint8ClampedArray(x0),
      _1649: x0 => new Int16Array(x0),
      _1651: x0 => new Uint16Array(x0),
      _1653: x0 => new Int32Array(x0),
      _1655: x0 => new Uint32Array(x0),
      _1657: x0 => new Float32Array(x0),
      _1659: x0 => new Float64Array(x0),
      _1683: x0 => x0.random(),
      _1684: (x0,x1) => x0.getRandomValues(x1),
      _1685: () => globalThis.crypto,
      _1686: () => globalThis.Math,
      _1699: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      _1700: (handle) => clearTimeout(handle),
      _1701: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      _1702: (handle) => clearInterval(handle),
      _1703: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      _1704: () => Date.now(),
      _1705: () => new Error().stack,
      _1706: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      _1707: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      _1708: (x0,x1) => x0.exec(x1),
      _1709: (x0,x1) => x0.test(x1),
      _1710: x0 => x0.pop(),
      _1712: o => o === undefined,
      _1714: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      _1716: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      _1717: o => o instanceof RegExp,
      _1718: (l, r) => l === r,
      _1719: o => o,
      _1720: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      _1721: o => o,
      _1722: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      _1723: o => o,
      _1724: b => !!b,
      _1725: o => o.length,
      _1727: (o, i) => o[i],
      _1728: f => f.dartFunction,
      _1729: () => ({}),
      _1730: () => [],
      _1732: () => globalThis,
      _1733: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      _1735: (o, p) => o[p],
      _1736: (o, p, v) => o[p] = v,
      _1737: (o, m, a) => o[m].apply(o, a),
      _1739: o => String(o),
      _1740: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      _1741: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1741(f,arguments.length,x0) }),
      _1742: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1742(f,arguments.length,x0,x1) }),
      _1743: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      _1744: o => [o],
      _1745: (o0, o1) => [o0, o1],
      _1746: (o0, o1, o2) => [o0, o1, o2],
      _1747: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      _1748: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      _1749: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1750: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1751: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1752: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1753: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1754: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1755: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1756: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1757: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _1758: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _1759: x0 => new ArrayBuffer(x0),
      _1760: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      _1762: x0 => x0.index,
      _1764: x0 => x0.flags,
      _1765: x0 => x0.multiline,
      _1766: x0 => x0.ignoreCase,
      _1767: x0 => x0.unicode,
      _1768: x0 => x0.dotAll,
      _1769: (x0,x1) => { x0.lastIndex = x1 },
      _1770: (o, p) => p in o,
      _1771: (o, p) => o[p],
      _1772: (o, p, v) => o[p] = v,
      _1773: (o, p) => delete o[p],
      _1782: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1782(f,arguments.length,x0) }),
      _1783: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1783(f,arguments.length,x0) }),
      _1788: () => new AbortController(),
      _1789: x0 => x0.abort(),
      _1790: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      _1791: (x0,x1) => globalThis.fetch(x0,x1),
      _1792: (x0,x1) => x0.get(x1),
      _1793: (module,f) => finalizeWrapper(f, function(x0,x1,x2) { return module.exports._1793(f,arguments.length,x0,x1,x2) }),
      _1794: (x0,x1) => x0.forEach(x1),
      _1795: x0 => x0.getReader(),
      _1796: x0 => x0.cancel(),
      _1797: x0 => x0.read(),
      _1798: (x0,x1) => x0.key(x1),
      _1799: x0 => x0.trustedTypes,
      _1800: (x0,x1) => { x0.text = x1 },
      _1806: x0 => ({name: x0}),
      _1823: o => o instanceof Array,
      _1824: (a, i) => a.splice(i, 1)[0],
      _1826: (a, l) => a.length = l,
      _1827: a => a.pop(),
      _1828: (a, i) => a.splice(i, 1),
      _1829: (a, s) => a.join(s),
      _1830: (a, s, e) => a.slice(s, e),
      _1831: (a, s, e) => a.splice(s, e),
      _1832: (a, b) => a == b ? 0 : (a > b ? 1 : -1),
      _1833: a => a.length,
      _1834: (a, l) => a.length = l,
      _1835: (a, i) => a[i],
      _1836: (a, i, v) => a[i] = v,
      _1837: (a, t) => a.concat(t),
      _1838: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      _1839: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      _1841: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      _1842: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      _1843: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      _1844: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      _1845: o => o instanceof Uint8ClampedArray,
      _1846: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      _1847: o => o instanceof Uint16Array,
      _1848: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      _1849: o => o instanceof Int16Array,
      _1850: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      _1851: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      _1852: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      _1853: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      _1854: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      _1856: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      _1857: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      _1858: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      _1859: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      _1860: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      _1861: (a, i) => a.push(i),
      _1862: (t, s) => t.set(s),
      _1863: l => new DataView(new ArrayBuffer(l)),
      _1864: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      _1865: o => o.byteLength,
      _1866: o => o.buffer,
      _1867: o => o.byteOffset,
      _1868: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      _1869: (b, o) => new DataView(b, o),
      _1870: (b, o, l) => new DataView(b, o, l),
      _1871: Function.prototype.call.bind(DataView.prototype.getUint8),
      _1872: Function.prototype.call.bind(DataView.prototype.setUint8),
      _1873: Function.prototype.call.bind(DataView.prototype.getInt8),
      _1874: Function.prototype.call.bind(DataView.prototype.setInt8),
      _1875: Function.prototype.call.bind(DataView.prototype.getUint16),
      _1876: Function.prototype.call.bind(DataView.prototype.setUint16),
      _1877: Function.prototype.call.bind(DataView.prototype.getInt16),
      _1878: Function.prototype.call.bind(DataView.prototype.setInt16),
      _1879: Function.prototype.call.bind(DataView.prototype.getUint32),
      _1880: Function.prototype.call.bind(DataView.prototype.setUint32),
      _1881: Function.prototype.call.bind(DataView.prototype.getInt32),
      _1882: Function.prototype.call.bind(DataView.prototype.setInt32),
      _1885: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      _1886: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      _1887: Function.prototype.call.bind(DataView.prototype.getFloat32),
      _1888: Function.prototype.call.bind(DataView.prototype.setFloat32),
      _1889: Function.prototype.call.bind(DataView.prototype.getFloat64),
      _1890: Function.prototype.call.bind(DataView.prototype.setFloat64),
      _1891: Function.prototype.call.bind(Number.prototype.toString),
      _1892: Function.prototype.call.bind(BigInt.prototype.toString),
      _1893: Function.prototype.call.bind(Number.prototype.toString),
      _1894: (d, digits) => d.toFixed(digits),
      _1933: () => globalThis.window.isSecureContext,
      _1934: () => globalThis.crypto.subtle,
      _1938: (x0,x1) => globalThis.crypto.subtle.digest(x0,x1),
      _1942: (x0,x1,x2,x3,x4) => globalThis.crypto.subtle.importKey(x0,x1,x2,x3,x4),
      _1944: (x0,x1,x2,x3) => globalThis.crypto.subtle.verify(x0,x1,x2,x3),
      _2559: (x0,x1) => { x0.src = x1 },
      _2565: (x0,x1) => { x0.crossOrigin = x1 },
      _2570: x0 => x0.width,
      _2571: (x0,x1) => { x0.width = x1 },
      _2572: x0 => x0.height,
      _2573: (x0,x1) => { x0.height = x1 },
      _2730: x0 => x0.error,
      _2732: (x0,x1) => { x0.src = x1 },
      _2737: (x0,x1) => { x0.crossOrigin = x1 },
      _2740: (x0,x1) => { x0.preload = x1 },
      _2744: x0 => x0.currentTime,
      _2745: (x0,x1) => { x0.currentTime = x1 },
      _2746: x0 => x0.duration,
      _2751: (x0,x1) => { x0.playbackRate = x1 },
      _2760: (x0,x1) => { x0.loop = x1 },
      _2781: x0 => x0.code,
      _2782: x0 => x0.message,
      _3363: (x0,x1) => { x0.type = x1 },
      _3371: (x0,x1) => { x0.crossOrigin = x1 },
      _3373: (x0,x1) => { x0.text = x1 },
      _3407: (x0,x1) => { x0.width = x1 },
      _3409: (x0,x1) => { x0.height = x1 },
      _3830: () => globalThis.window,
      _3892: x0 => x0.navigator,
      _4154: x0 => x0.trustedTypes,
      _4155: x0 => x0.sessionStorage,
      _4156: x0 => x0.localStorage,
      _4281: x0 => x0.userAgent,
      _4489: x0 => x0.length,
      _5876: x0 => x0.destination,
      _5880: x0 => x0.state,
      _5971: (x0,x1) => { x0.value = x1 },
      _6120: x0 => x0.gain,
      _6429: x0 => x0.signal,
      _6503: () => globalThis.document,
      _6587: x0 => x0.head,
      _6918: (x0,x1) => { x0.id = x1 },
      _8264: x0 => x0.value,
      _8266: x0 => x0.done,
      _8967: x0 => x0.url,
      _8969: x0 => x0.status,
      _8971: x0 => x0.statusText,
      _8972: x0 => x0.headers,
      _8973: x0 => x0.body,
      _12601: x0 => x0.name,
      _13318: () => globalThis.console,
      _13344: () => globalThis.console,
      _13383: (x0,x1) => x0.error(x1),
      _13396: x0 => x0.name,
      _13397: x0 => x0.message,
      _13398: x0 => x0.code,

    };

    const baseImports = {
      dart2wasm: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });
    dartInstance.exports.$setThisModule(dartInstance);

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
