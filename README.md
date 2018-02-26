# hapi Triton auth

hapi plugin for Triton authentication.

[![Build Status](https://secure.travis-ci.org/joyent/hapi-triton-auth.svg)](http://travis-ci.org/joyent/hapi-triton-auth)

## Options

- `cookieName`: name of session cookie, default is 'sso'
- `baseUrl`: required setting used to construct `returnTo` URL from SSO. Set to the base part of the URL that your site is running under (e.g. http://site.com).
- `ssoUrl`: required URL to SSO login page
- `apiBaseUrl`: required URL to Triton cloud API to retrieve profile data from
- `keyId`: required `user/keys/ID` formatted key identifier
- `keyPath`: required full path to private key file thats associated with the keyId
- `permissions`: optional object with permissions that the user will need. Defaults to an empty object.
- `isDev`: optional boolean used for development, will prevent users from logging in and every request is authenticated. Default is `false`, _do not set to true in production_.
- `cookie`: object with the following settings
  - `encoding`: default is 'iron'
  - `path`: optional cookie path to scope to
  - `isHttpOnly`: boolean, defaults to true
  - `isSecure`: boolean, defaults to true
  - `password`: 32+ character key to secure the cookie, defaults to random 32 characters. Set to the same value for each server in rotation together.
  - `ttl`: number of milliseconds until the cookie and token expires, default is 14400000 (4 hours)
  - `domain`: origin of the cookie, default is 'localhost'


