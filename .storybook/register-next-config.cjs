/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Preload script injected via NODE_OPTIONS=--require.
 * Patches the Node.js module registry so that any require('next/config')
 * returns a harmless shim instead of throwing.
 *
 * This is needed because @storybook/nextjs 8.6.x calls require('next/config')
 * during preset initialisation, BEFORE webpack's alias map is applied.
 * Next.js 15+ / 16 removed next/config entirely.
 */
const Module = require('module');
const original = Module._resolveFilename.bind(Module);

Module._resolveFilename = function (request, ...rest) {
  if (request === 'next/config') {
    // Resolve to our shim instead of crashing
    return require.resolve('./next-config-mock.js');
  }
  return original(request, ...rest);
};
