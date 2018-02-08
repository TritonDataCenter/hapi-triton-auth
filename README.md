# hapi Triton auth

hapi plugin for Triton authentication.

[![Build Status](https://secure.travis-ci.org/joyent/hapi-triton-auth.svg)](http://travis-ci.org/joyent/hapi-triton-auth)

## Options

- `cookieName`: name of session cookie, default is 'sso'
- `sso`: object with the following settings
  - `url`: URL to SSO login page
  - `keyId`: user/keys/ID formatted key identifier
  - `keyPath`: full path to read private key from thats associated with the keyId
  - `apiBaseUrl`: URL to Triton cloud API to retrieve profile data from
- `cookie`: object with the following settings
  - `encoding`: default is 'iron'
  - `path`: optional cookie path to scope to
  - `isHttpOnly`: boolean, defaults to true
  - `isSecure`: boolean, defaults to true
  - `password`: 32+ character key to secure the cookie, defaults to random 32 characters
  - `ttl`: number of seconds until cookie expires, default is 10000
  - `domain`: origin of the cookie, default is 'localhost'


