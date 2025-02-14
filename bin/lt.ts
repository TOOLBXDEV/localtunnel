#!/usr/bin/env node
import { readFileSync } from 'fs';
import openurl from 'openurl';
import { join } from 'path';
import Yargs from 'yargs';
import localtunnel from '../localtunnel';

const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;

const yargs = Yargs(process.argv.slice(2))
  .usage('Usage: lt --port [num] <options>')
  .env(true)
  .option('port', {
    alias: 'p',
    describe: 'Internal HTTP server port',
    type: 'number'
  })
  .option('host', {
    alias: 'h',
    describe: 'Upstream server providing forwarding',
    default: 'https://localtunnel.me',
    type: 'string'
  })
  .option('subdomain', {
    alias: 's',
    describe: 'Request this subdomain',
    type: 'string'
  })
  .option('local-host', {
    alias: 'l',
    describe: 'Tunnel traffic to this host instead of localhost, override Host header to this host',
    type: 'string'
  })
  .option('local-https', {
    alias: 'local-https',
    describe: 'Tunnel traffic to a local HTTPS server',
    type: 'boolean'
  })
  .option('local-cert', {
    alias: 'local-cert',
    describe: 'Path to certificate PEM file for local HTTPS server',
    type: 'string'
  })
  .option('local-key', {
    alias: 'local-key',
    describe: 'Path to certificate key file for local HTTPS server',
    type: 'string'
  })
  .option('local-ca', {
    alias: 'local-ca',
    describe: 'Path to certificate authority file for self-signed certificates',
    type: 'string'
  })
  .option('allow-invalid-cert', {
    alias: 'allow-invalid-cert',
    describe: 'Disable certificate checks for your local HTTPS server (ignore cert/key/ca options)',
    type: 'boolean'
  })
  .option('open', {
    alias: 'o',
    describe: 'Opens the tunnel URL in your browser',
    type: 'boolean'
  })
  .option('print-requests', {
    alias: 'print-requests',
    describe: 'Print basic request info',
    type: 'boolean'
  })
  .demandOption('port')
  .boolean('local-https')
  .boolean('allow-invalid-cert')
  .boolean('print-requests')
  .help('help', 'Show this help and exit')
  .version(version);

(async () => {
  const argv = await yargs.argv;

  if (typeof argv.port !== 'number') {
    yargs.showHelp();
    console.error('\nInvalid argument: `port` must be a number');
    process.exit(1);
  }

  try {
    const tunnel = await localtunnel({
      port: argv.port,
      host: argv.host,
      subdomain: argv.subdomain,
      local_host: argv.localHost,
      local_https: argv.localHttps,
      local_cert: argv.localCert,
      local_key: argv.localKey,
      local_ca: argv.localCa,
      allow_invalid_cert: argv.allowInvalidCert
    });

    tunnel.on('error', (err: Error) => {
      throw err;
    });

    console.log('your url is: %s', tunnel.url);

    /**
     * `cachedUrl` is set when using a proxy server that support resource caching.
     * This URL generally remains available after the tunnel itself has closed.
     * @see https://github.com/localtunnel/localtunnel/pull/319#discussion_r319846289
     */
    if (tunnel.cachedUrl) {
      console.log('your cachedUrl is: %s', tunnel.cachedUrl);
    }

    if (argv.open && tunnel.url) {
      openurl.open(tunnel.url);
    }

    if (argv['print-requests']) {
      tunnel.on('request', (info: { method: string; path: string }) => {
        console.log(new Date().toString(), info.method, info.path);
      });
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
