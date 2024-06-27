import { create } from 'zustand'

interface VersionSettlementModalProps {
  visible: boolean
  version?: ProjectVersionProps
  show: (version: ProjectVersionProps) => void
  close: () => void
}

const useVersionSettlementModalStore = create<VersionSettlementModalProps>(
  (set) => ({
    visible: false,
    version: undefined,
    show: (version: ProjectVersionProps) =>
      set({
        version: version,
        visible: true,
      }),
    close: () =>
      set({
        version: undefined,
        visible: false,
      }),
  }),
)

export { useVersionSettlementModalStore }
