'use strict';

// Load modules

const Cryptiles = require('cryptiles');
const Hoek = require('hoek');
const SSO = require('./sso');


const internals = {
  defaults: {
    cookieName: 'sso',
    ssoUrl: '',
    baseUrl: '',
    apiBaseUrl: '',
    keyId: '',
    keyPath: '',
    permissions: {},
    isDev: false,        // the keyId user will be logged in
    cookie: {
      encoding: 'iron',
      path: '/',
      isHttpOnly: true,
      isSecure: true,
      password: Cryptiles.randomString(32),
      ttl: 10000,
      domain: 'localhost',
      ignoreErrors: true,
      clearInvalid: true
    }
  }
};

exports.register = function (plugin, options) {
  const settings = Hoek.applyToDefaults(internals.defaults, options);

  Hoek.assert(settings.baseUrl, 'baseUrl is required');
  Hoek.assert(settings.ssoUrl, 'ssoUrl is required');
  Hoek.assert(settings.apiBaseUrl, 'apiBaseUrl is required');
  Hoek.assert(settings.keyId, 'keyId is required');
  Hoek.assert(settings.keyPath, 'keyId is required');
  Hoek.assert(typeof settings.permissions === 'object', 'permissions must be an object');
  Hoek.assert(typeof settings.isDev === 'boolean', 'isDev must be true or false');
  Hoek.assert(process.env.NODE_ENV !== 'production' || !settings.isDev, 'isDev must be false in production');

  try {
    const permissions = JSON.stringify(settings.permissions);
    settings.permissions = permissions;
  } catch (ex) {
    throw new Error('Unable to JSON.stringify permissions');
  }

  plugin.state(settings.cookieName, settings.cookie);

  const sso = new SSO(settings);
  plugin.auth.scheme('sso', sso.scheme.bind(sso));
  plugin.auth.strategy('sso', 'sso');
};


exports.pkg = require('../package.json');
