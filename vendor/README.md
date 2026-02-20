# Vendor: libpgn

The [libpgn](https://github.com/fwttnnn/libpgn) C library is used by the N-API addon and is **statically linked** into the native module.

## Automatic setup

Running `npm install` runs `scripts/install-libpgn.js`, which clones libpgn into **`vendor/libpgn`** if missing, then runs `node-gyp rebuild` to build the addon. If the clone or build fails, the package still installs and the JS stub parser is used.

## Manual setup

To clone libpgn yourself (e.g. for a submodule):

```bash
git clone https://github.com/fwttnnn/libpgn.git vendor/libpgn
```

Then run `npm run rebuild` to build the native addon.
