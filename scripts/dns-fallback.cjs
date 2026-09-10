/* eslint-disable @typescript-eslint/no-require-imports */
// @ts-check
const dns = require('node:dns');

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const origLookup = dns.lookup;
const resolver = new dns.promises.Resolver();
try {
  resolver.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

/** @type {Map<string, string[]>} */
const cache = new Map();

/**
 * Fallback lookup handler that queries public DNS when the local OS resolver drops queries or fails.
 */
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  origLookup(hostname, options, async (err, address, family) => {
    if (err && (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN' || err.code === 'SERVFAIL')) {
      try {
        let addresses = cache.get(hostname);
        if (!addresses) {
          addresses = await resolver.resolve4(hostname);
          if (addresses && addresses.length > 0) {
            cache.set(hostname, addresses);
          }
        }
        if (addresses && addresses.length > 0) {
          if (options && typeof options === 'object' && options.all) {
            return callback(null, addresses.map((a) => ({ address: a, family: 4 })));
          }
          return callback(null, addresses[0], 4);
        }
      } catch {
        return callback(err);
      }
    }
    return callback(err, address, family);
  });
};
