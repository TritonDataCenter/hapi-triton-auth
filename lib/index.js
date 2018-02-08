'use strict';

// Load modules

const Cryptiles = require('cryptiles');
const Hoek = require('hoek');
const SSO = require('./sso');


const internals = {
  defaults: {
    cookieName: 'sso',
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
    },
    sso: {}
  }
};

exports.register = function (plugin, options) {
  const settings = Hoek.applyToDefaults(internals.defaults, options);

  plugin.state(settings.cookieName, settings.cookie);
  settings.sso.cookieName = settings.cookieName;

  const sso = new SSO(settings.sso);
  plugin.auth.scheme('sso', sso.scheme.bind(sso));
  plugin.auth.strategy('sso', 'sso');
};


exports.pkg = require('../package.json');
