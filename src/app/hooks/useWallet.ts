import _ from 'lodash'
import { create } from 'zustand'

export const useWalletStore = create<WalletStoreDefine>((set, get) => ({
  defaultChannelIdentifier: '',
  connectingChannelIdentifier: '',
  isConnecting: () => {
    const sound = get().connectingChannelIdentifier
    return sound !== ''
  },
  setConnectingChannel(channel) {
    set({ connectingChannelIdentifier: channel })
  },
}))
