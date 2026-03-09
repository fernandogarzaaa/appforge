const getGlobal = (key) => {
  if (typeof globalThis !== 'undefined' && key in globalThis) {
    return globalThis[key];
  }
  return undefined;
};

module.exports = {
  ReadableStream: getGlobal('ReadableStream'),
  WritableStream: getGlobal('WritableStream'),
  TransformStream: getGlobal('TransformStream'),
  TextEncoderStream: getGlobal('TextEncoderStream'),
  TextDecoderStream: getGlobal('TextDecoderStream'),
  CompressionStream: getGlobal('CompressionStream'),
  DecompressionStream: getGlobal('DecompressionStream'),
};
