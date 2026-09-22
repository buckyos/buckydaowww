const fs = require('node:fs');

const keys = ['CHAIN', 'NETWORK_ID', 'RPC_URL', 'MAIN', 'COMMITTEE', 'PROJECT',
  'DEV_TOKEN', 'NORMAL_TOKEN', 'LOCKUP', 'DIVIDEND', 'ACQUIRED', 'ADDRESS_LINK',
  'TOKEN_ADDRESS_LINK', 'LOCAL_AUTH_MODE', 'CURRENCY_NAME', 'CURRENCY_SYMBOL'];

function readPublicConfig(file) {
  if (!file) return null;
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!config || Array.isArray(config) || Object.keys(config).length !== keys.length ||
      keys.some(key => typeof config[key] !== 'string') ||
      Object.keys(config).some(key => !keys.includes(key))) {
    throw new Error('Invalid public network configuration; only the documented public fields are allowed');
  }
  if (!/^[1-9][0-9]*$/.test(config.NETWORK_ID) || config.LOCAL_AUTH_MODE !== 'github') {
    throw new Error('Public deployment requires a chain ID and GitHub authentication');
  }
  for (const key of ['MAIN', 'COMMITTEE', 'PROJECT', 'DEV_TOKEN', 'NORMAL_TOKEN', 'LOCKUP', 'DIVIDEND', 'ACQUIRED']) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(config[key]) || /^0x0{40}$/.test(config[key])) throw new Error('Invalid contract: ' + key);
  }
  for (const key of ['RPC_URL', 'ADDRESS_LINK', 'TOKEN_ADDRESS_LINK']) {
    const url = new URL(config[key]);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid public URL: ' + key);
  }
  return config;
}
module.exports = { readPublicConfig };
