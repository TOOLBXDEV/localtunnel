import { Transform, TransformCallback } from 'stream';

interface HeaderHostTransformerOptions {
  host?: string;
}

export default class HeaderHostTransformer extends Transform {
  host: string;
  replaced: boolean;

  constructor(opts: HeaderHostTransformerOptions = {}) {
    super();
    this.host = opts.host || 'localhost';
    this.replaced = false;
  }

  _transform(data: any, encoding: BufferEncoding, callback: TransformCallback) {
    callback(
      null,
      this.replaced // after replacing the first instance of the Host header we just become a regular passthrough
        ? data
        : data.toString().replace(/(\r\n[Hh]ost: )\S+/, (_match: any, $1: string) => {
            this.replaced = true;
            return $1 + this.host;
          })
    );
  }
}
