const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readPublicConfig } = require('./public-config.cjs');

test('runtime network changes without a rebuild and secrets are rejected', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sourcedao-config-'));
  const file = path.join(directory, 'public.json');
  const config = { CHAIN: 'USDB Testnet', NETWORK_ID: '202608250', RPC_URL: 'https://explorer.example/rpc',
    ADDRESS_LINK: 'https://explorer.example/address/', TOKEN_ADDRESS_LINK: 'https://explorer.example/token/',
    LOCAL_AUTH_MODE: 'github', CURRENCY_NAME: 'USDB', CURRENCY_SYMBOL: 'USDB' };
  for (const name of ['MAIN', 'COMMITTEE', 'PROJECT', 'DEV_TOKEN', 'NORMAL_TOKEN', 'LOCKUP', 'DIVIDEND', 'ACQUIRED']) {
    config[name] = '0x' + '1'.repeat(40);
  }
  try {
    fs.writeFileSync(file, JSON.stringify(config));
    assert.equal(readPublicConfig(file).NETWORK_ID, '202608250');
    config.CHAIN = 'Another deployment';
    fs.writeFileSync(file, JSON.stringify(config));
    assert.equal(readPublicConfig(file).CHAIN, 'Another deployment');
    fs.writeFileSync(file, JSON.stringify({ ...config, github_client_secret: 'must-not-reach-browser' }));
    assert.throws(() => readPublicConfig(file), /public fields/);
    fs.writeFileSync(file, JSON.stringify({ ...config, RPC_URL: 'javascript:alert(1)' }));
    assert.throws(() => readPublicConfig(file), /Invalid public URL/);
    assert.equal(readPublicConfig(undefined), null);
  } finally { fs.rmSync(directory, { recursive: true }); }
});
