import { describe, it, expect } from 'vitest';
import { storageFromCookieJar, verificationHeaders } from '../deployment-auth.js';
const deployment = 'https://example-deployment.vercel.app';
describe('deployment verification authentication', () => {
  it('parses session and HttpOnly cookies and scopes them to the deployment host', () => {
    const state = storageFromCookieJar('# Netscape cookie file\n#HttpOnly_.vercel.app\tTRUE\t/\tTRUE\t0\t_vercel_jwt\tfixture-cookie\n', deployment);
    expect(state.cookies).toEqual([{ name: '_vercel_jwt', value: 'fixture-cookie', domain: 'example-deployment.vercel.app',
      path: '/', secure: true, expires: -1, httpOnly: true, sameSite: 'Lax' }]);
  });
  it('sends authorization only to the deployment, leaving the public domain and third parties anonymous', () => {
    const state = { cookies: [{ name: '_vercel_jwt', value: 'fixture-cookie' }] };
    expect(verificationHeaders(deployment + '/docs/serialization', deployment, state)).toEqual({ cookie: '_vercel_jwt=fixture-cookie' });
    expect(verificationHeaders('https://oroya-animate.oroyajs.com', deployment, state)).toEqual({});
    expect(verificationHeaders('https://cdn.jsdelivr.net', deployment, state)).toEqual({});
  });
  it('rejects cookie jars for unrelated domains and accepts unprotected deployments without cookies', () => {
    expect(() => storageFromCookieJar('other.example\tFALSE\t/\tTRUE\t0\tkey\tvalue', deployment)).toThrow('domain');
    expect(storageFromCookieJar('# Empty jar\n', deployment).cookies).toEqual([]);
  });
});
