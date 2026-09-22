// Public configuration only. Server credentials must never enter this object.
export const publicConfig: Record<string, string> = {
  CHAIN: process.env.NEXT_PUBLIC_CHAIN || '',
  NETWORK_ID: process.env.NEXT_PUBLIC_NETWORK_ID || '10',
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || '',
  MAIN: process.env.NEXT_PUBLIC_MAIN || '',
  COMMITTEE: process.env.NEXT_PUBLIC_COMMITTEE || '',
  PROJECT: process.env.NEXT_PUBLIC_PROJECT || '',
  DEV_TOKEN: process.env.NEXT_PUBLIC_DEV_TOKEN || '',
  NORMAL_TOKEN: process.env.NEXT_PUBLIC_NORMAL_TOKEN || '',
  LOCKUP: process.env.NEXT_PUBLIC_LOCKUP || '',
  DIVIDEND: process.env.NEXT_PUBLIC_DIVIDEND || '',
  ACQUIRED: process.env.NEXT_PUBLIC_ACQUIRED || '',
  ADDRESS_LINK: process.env.NEXT_PUBLIC_ADDRESS_LINK || '',
  TOKEN_ADDRESS_LINK: process.env.NEXT_PUBLIC_TOKEN_ADDRESS_LINK || '',
  LOCAL_AUTH_MODE: process.env.NEXT_PUBLIC_LOCAL_AUTH_MODE || '',
  CURRENCY_NAME: 'Ether',
  CURRENCY_SYMBOL: 'ETH',
}

export function installPublicConfig(value: Record<string, string> | null) {
  if (value) Object.assign(publicConfig, value)
}
