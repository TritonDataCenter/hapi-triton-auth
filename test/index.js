'use strict';

const Path = require('path');
const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const SSO = require('../');


const lab = exports.lab = Lab.script();
const it = lab.it;
const expect = Code.expect;

const keyPath = Path.join(__dirname, '/test.key');
const keyId = 'blah/keys/key:id';


it('can be registered with hapi', async () => {
  const options = {
    baseUrl: 'http://localhost',
    ssoUrl: 'http://localhost',
    apiBaseUrl: 'http://localhost',
    permissions: { portal: true },
    keyPath,
    keyId
  };

  const server = Hapi.server();
  await server.register({ plugin: SSO, options });
  await server.initialize();
});

it('will protect a route', async () => {
  const account = {
    id: 'b89d9dd3-62ce-4f6f-eb0d-f78e57d515d9',
    login: 'barbar',
    email: 'barbar@example.com',
    companyName: 'Example Inc',
    firstName: 'BarBar',
    lastName: 'Jinks',
    phone: '123-456-7890',
    updated: '2015-12-21T11:48:54.884Z',
    created: '2015-12-21T11:48:54.884Z'
  };

  const apiServer = Hapi.server();
  apiServer.route({
    method: 'GET',
    path: '/my',
    handler: function (request, h) {
      return account;
    }
  });

  await apiServer.start();

  const sdcServer = Hapi.server();
  sdcServer.route({
    method: 'GET',
    path: '/session',
    handler: (request, h) => {
      return { uuid: 'foo' };
    }
  });
  await sdcServer.start();

  const server = Hapi.server();
  const options = {
    baseUrl: 'http://localhost',
    ssoUrl: `http://localhost:${sdcServer.info.port}`,
    apiBaseUrl: `http://localhost:${apiServer.info.port}`,
    permissions: { portal: true },
    keyPath,
    keyId
  };

  await server.register({ plugin: SSO, options });

  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: 'sso',
      handler: function (request, h) {
        return request.auth.credentials.profile.id;
      }
    }
  });

  await server.initialize();
  const res = await server.inject('/');
  expect(res.statusCode).to.equal(302);
  expect(res.headers.location).to.contain('sig=');

  const authRes = await server.inject('/?token=something');
  expect(authRes.payload).to.equal(account.id);
  await sdcServer.stop();
  await apiServer.stop();
});

it('will login the local user if in dev mode', async () => {
  const account = {
    id: 'b89d9dd3-62ce-4f6f-eb0d-f78e57d515d9',
    login: 'barbar',
    email: 'barbar@example.com',
    companyName: 'Example Inc',
    firstName: 'BarBar',
    lastName: 'Jinks',
    phone: '123-456-7890',
    updated: '2015-12-21T11:48:54.884Z',
    created: '2015-12-21T11:48:54.884Z'
  };

  const apiServer = Hapi.server();
  apiServer.route({
    method: 'GET',
    path: '/my',
    handler: function (request, h) {
      return account;
    }
  });

  await apiServer.start();
  const server = Hapi.server();

  const options = {
    baseUrl: 'http://localhost',
    ssoUrl: 'http://localhost',
    apiBaseUrl: `http://localhost:${apiServer.info.port}`,
    isDev: true,
    keyPath,
    keyId
  };

  await server.register({ plugin: SSO, options });

  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: 'sso',
      handler: function (request, h) {
        return request.auth.credentials.profile;
      }
    }
  });

  await server.initialize();
  const res = await server.inject('/');
  expect(res.statusCode).to.equal(200);
  expect(res.payload).to.contain(account.id);
  await apiServer.stop();
});

it('handles errors when not in dev mode not able to connect to sso service', async () => {
  const server = Hapi.server();

  const options = {
    baseUrl: 'http://localhost',
    ssoUrl: 'http://localhost',
    apiBaseUrl: 'http://localhost',
    isDev: false,
    keyPath,
    keyId
  };

  await server.register({ plugin: SSO, options });

  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: 'sso',
      handler: function (request, h) {
        return request.auth.credentials.profile;
      }
    }
  });

  await server.initialize();
  const res = await server.inject('/');
  expect(res.statusCode).to.equal(302);
});

it('will handle error when trying to sign with a malformed key', async () => {
  const server = Hapi.server();
  const options = {
    baseUrl: 'http://localhost',
    ssoUrl: 'http://localhost',
    apiBaseUrl: 'http://localhost',
    keyPath: Path.join(__dirname, '/bad.key'),
    keyId
  };

  await server.register({ plugin: SSO, options });

  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: 'sso',
      handler: function (request, h) {
        return request.auth.credentials.profile.id;
      }
    }
  });

  await server.initialize();
  const res = await server.inject('/?token=something');
  expect(res.statusCode).to.equal(500);
});

it('will set the correct cookie and token expiration time based on cookie.ttl', async () => {
  const account = {
    id: 'b89d9dd3-62ce-4f6f-eb0d-f78e57d515d9',
    login: 'barbar',
    email: 'barbar@example.com',
    companyName: 'Example Inc',
    firstName: 'BarBar',
    lastName: 'Jinks',
    phone: '123-456-7890',
    updated: '2015-12-21T11:48:54.884Z',
    created: '2015-12-21T11:48:54.884Z'
  };

  const apiServer = Hapi.server();
  apiServer.route({
    method: 'GET',
    path: '/my',
    handler: function (request, h) {
      return account;
    }
  });

  await apiServer.start();

  const ssoServer = Hapi.server();
  ssoServer.route({
    method: 'GET',
    path: '/session',
    handler: (request, h) => {
      return { uuid: 'foo' };
    }
  });
  await ssoServer.start();

  const server = Hapi.server();
  const options = {
    cookie: {
      ttl: 12000   // 2 minutes
    },
    baseUrl: 'http://localhost',
    ssoUrl: `http://localhost:${ssoServer.info.port}`,
    apiBaseUrl: `http://localhost:${apiServer.info.port}`,
    keyPath,
    keyId
  };

  await server.register({ plugin: SSO, options });

  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: 'sso',
      handler: function (request, h) {
        return request.auth.credentials.profile.id;
      }
    }
  });

  const expires = new Date(new Date() + 12000).toUTCString();
  await server.initialize();
  const res = await server.inject('/');
  expect(res.statusCode).to.equal(302);
  expect(res.headers.location).to.contain('expires=');

  const authRes = await server.inject('/?token=something');
  expect(authRes.payload).to.equal(account.id);
  // ignore the milliseconds and GMT part
  expect(authRes.headers['set-cookie'][0]).to.contain(`Expires=${expires.substr(0, expires.length - 8)}`);
  await ssoServer.stop();
  await apiServer.stop();
});

it('throws when permissions isn\'t an object', async () => {
  const options = {
    baseUrl: 'http://localhost',
    ssoUrl: 'http://localhost',
    apiBaseUrl: 'http://localhost',
    permissions: false,
    keyPath,
    keyId
  };

  const server = Hapi.server();
  let thrown = false;
  try {
    await server.register({ plugin: SSO, options });
  } catch (ex) {
    thrown = true;
  }
  expect(thrown).to.be.true();
});

it('throws when permissions cannot be stringified', async () => {
  const options = {
    baseUrl: 'http://localhost',
    ssoUrl: 'http://localhost',
    apiBaseUrl: 'http://localhost',
    permissions: {},
    keyPath,
    keyId
  };

  options.permissions.permissions = options.permissions;

  const server = Hapi.server();
  let thrown = false;
  try {
    await server.register({ plugin: SSO, options });
  } catch (ex) {
    thrown = true;
  }
  expect(thrown).to.be.true();
});

it('throws isDev is true in production', async () => {
  const options = {
    baseUrl: 'http://localhost',
    ssoUrl: 'http://localhost',
    apiBaseUrl: 'http://localhost',
    isDev: true,
    keyPath,
    keyId
  };

  const currentEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const server = Hapi.server();
  let thrown = false;
  try {
    await server.register({ plugin: SSO, options });
  } catch (ex) {
    thrown = true;
  }
  process.env.NODE_ENV = currentEnv;
  expect(thrown).to.be.true();
});
