'use strict';

// Load modules

const Assert = require('assert');
const Crypto = require('crypto');
const Fs = require('fs');
const Qs = require('querystring');
const Bounce = require('bounce');
const Cryptiles = require('cryptiles');
const Hoek = require('hoek');
const Wreck = require('wreck');


module.exports = class SSO {
  constructor (options) {
    this._settings = Hoek.clone(options);
    this._settings.privateKey = Fs.readFileSync(this._settings.keyPath);
    this._wreck = Wreck.defaults({ baseUrl: this._settings.apiBaseUrl, json: true, rejectUnauthorized: false });
  }

  async _authenticate (request, h) {
    let state = request.state[this._settings.cookieName];

    // We might have a token coming in from a redirect from SSO
    if ((request.query.token || this._settings.isDev) && !state) {
      try {
        const token = request.query.token;
        const profile = await this.getProfile(token);
        state = { token, profile: { id: profile.id, login: profile.login } };
        h.state(this._settings.cookieName, state);
      } catch (ex) {
        request.log(['error', 'auth', 'get-profile'], ex);
        Bounce.rethrow(ex, 'system');
      }
    }

    if (!state) {
      const ssoUrl = this.getSsoUrl(request.url.path);
      return h.response().takeover().redirect(ssoUrl);
    }

    return h.authenticated({ credentials: state });
  }

  async getProfile (token) {
    Assert(token || this._settings.isDev, 'token is required for production');

    const now = new Date().toUTCString();
    const signer = Crypto.createSign('sha256');
    signer.update(now);

    const signature = signer.sign(this._settings.privateKey, 'base64');
    const options = {
      headers: {
        Accept: 'application/json',
        'x-api-version': '~8',
        Date: now,
        Authorization: `Signature keyId="${this._settings.keyId}",algorithm="rsa-sha256" ${signature}`
      }
    };

    if (token) {
      options.headers['X-Auth-Token'] = token;
    }

    const { payload } = await this._wreck.get('/my', options);
    return payload;
  }

  scheme () {
    return {
      authenticate: (request, h) => {
        return this._authenticate(request, h);
      }
    };
  }

  getSsoUrl (returnto, ssoPath = '') {
    const now = new Date();
    const signer = Crypto.createSign('sha256');

    const query = Qs.stringify({
      cid: '',
      company: '',
      country: '',
      email: '',
      firstName: '',
      keyid: this._settings.keyId,
      lastName: '',
      nonce: Cryptiles.randomString(7),
      now: now.toUTCString(),
      permissions: this._settings.permissions,
      returnto: `${this._settings.baseUrl}${returnto}`,
      state: ''
    });
    const url = `${this._settings.ssoUrl}${ssoPath}?${query}`;

    signer.update(encodeURIComponent(url.toString()));
    const signature = signer.sign(this._settings.privateKey, 'base64');

    return `${url}&sig=${encodeURIComponent(signature)}`;
  }
};
