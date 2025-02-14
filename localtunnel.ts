import Tunnel from './lib/Tunnel';

interface LocalTunnelOptions {
  port: number;
  host?: string;
  subdomain?: string;
  local_host?: string;
  local_https?: boolean;
  local_cert?: string;
  local_key?: string;
  local_ca?: string;
  allow_invalid_cert?: boolean;
}

export default function localtunnel(
  arg1: number | LocalTunnelOptions,
  arg2?: LocalTunnelOptions | ((err: Error | null, tunnel?: Tunnel) => void),
  arg3?: (err: Error | null, tunnel?: Tunnel) => void
): Promise<Tunnel> | Tunnel {
  const options = typeof arg1 === 'object' ? arg1 : { ...arg2, port: arg1 };
  const callback = typeof arg1 === 'object' ? arg2 : arg3;
  const client = new Tunnel(options);
  if (typeof callback === 'function') {
    client.open(err => (err ? callback(err) : callback(null, client)));
    return client;
  }
  return new Promise((resolve, reject) =>
    client.open(err => (err ? reject(err) : resolve(client)))
  );
}
