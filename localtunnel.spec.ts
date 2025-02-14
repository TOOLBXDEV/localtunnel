/* eslint-disable no-console */

import crypto from 'crypto';
import http from 'http';
import https from 'https';
import localtunnel from './localtunnel';

let fakePort: number;

beforeAll(done => {
  const server = http.createServer();
  server.on('request', (req, res) => {
    res.write(req.headers.host);
    res.end();
  });
  server.listen(() => {
    const address = server.address();
    if (address && typeof address === 'object') {
      fakePort = address.port;
    }
    done();
  });
});

test('query localtunnel server w/ ident', async () => {
  const tunnel = await localtunnel({ port: fakePort });
  expect(tunnel.url! && new RegExp('^https://.*$').test(tunnel.url!)).toBeTruthy();

  const parsed = new URL(tunnel.url!);
  const opt = {
    host: parsed.host,
    port: 443,
    headers: { host: parsed.hostname },
    path: '/'
  };

  const req = https.request(opt, res => {
    res.setEncoding('utf8');
    let body = '';

    res.on('data', chunk => {
      body += chunk;
    });

    res.on('end', () => {
      expect(/.*[.]localtunnel[.]me/.test(body)).toBeTruthy();
      tunnel.close();
    });
  });

  req.end();
});

test('request specific domain', async () => {
  const subdomain = Math.random().toString(36).substr(2);
  const tunnel = await localtunnel({ port: fakePort, subdomain });
  expect(new RegExp(`^https://${subdomain}\..*$`).test(tunnel.url!)).toBeTruthy();
  tunnel.close();
});

describe('--local-host localhost', () => {
  test('override Host header with local-host', async () => {
    const tunnel = await localtunnel({ port: fakePort, local_host: 'localhost' });
    expect(new RegExp('^https://.*$').test(tunnel.url!)).toBeTruthy();

    const parsed = new URL(tunnel.url!);
    const opt = {
      host: parsed.host,
      port: 443,
      headers: { host: parsed.hostname },
      path: '/'
    };

    const req = https.request(opt, res => {
      res.setEncoding('utf8');
      let body = '';

      res.on('data', chunk => {
        body += chunk;
      });

      res.on('end', () => {
        expect(body).toBe('localhost');
        tunnel.close();
      });
    });

    req.end();
  });
});

describe('--local-host 127.0.0.1', () => {
  test('override Host header with local-host', async () => {
    const tunnel = await localtunnel({ port: fakePort, local_host: '127.0.0.1' });
    expect(new RegExp('^https://.*$').test(tunnel.url!)).toBeTruthy();

    const parsed = new URL(tunnel.url!);
    const opt = {
      host: parsed.host,
      port: 443,
      headers: {
        host: parsed.hostname
      },
      path: '/'
    };

    const req = https.request(opt, res => {
      res.setEncoding('utf8');
      let body = '';

      res.on('data', chunk => {
        body += chunk;
      });

      res.on('end', () => {
        expect(body).toBe('127.0.0.1');
        tunnel.close();
      });
    });

    req.end();
  });

  test('send chunked request', async () => {
    const tunnel = await localtunnel({ port: fakePort, local_host: '127.0.0.1' });
    expect(new RegExp('^https://.*$').test(tunnel.url!)).toBeTruthy();

    const parsed = new URL(tunnel.url!);
    const opt = {
      host: parsed.host,
      port: 443,
      headers: {
        host: parsed.hostname,
        'Transfer-Encoding': 'chunked'
      },
      path: '/'
    };

    const req = https.request(opt, res => {
      res.setEncoding('utf8');
      let body = '';

      res.on('data', chunk => {
        body += chunk;
      });

      res.on('end', () => {
        expect(body).toBe('127.0.0.1');
        tunnel.close();
      });
    });

    req.end(crypto.randomBytes(1024 * 8).toString('base64'));
  });
});
