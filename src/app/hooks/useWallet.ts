import { create } from 'zustand'

export const useWalletStore = create<WalletStoreDefine>((set, get) => ({
  activeAddress: '',
  chainId: '',
  hasWallet: false,
  initialized: false,
  updateWalletState(payload) {
    set({
      activeAddress: payload.activeAddress ?? get().activeAddress,
      chainId: payload.chainId ?? get().chainId,
      hasWallet: payload.hasWallet ?? get().hasWallet,
      initialized: payload.initialized ?? get().initialized,
    })
  },
  resetWalletState() {
    set({
      activeAddress: '',
      chainId: '',
      hasWallet: false,
      initialized: true,
    })
  },
}))
