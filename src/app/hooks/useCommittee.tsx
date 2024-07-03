import { create } from 'zustand'

enum CommitteeType {
  unknown = 0,
  committee = 1,
  normal = 2,
}

interface useCommitteeStoreStruct {
  state: CommitteeType
  update: (state: CommitteeType) => void
  isCommittee: () => boolean
  isUnknown: () => boolean
  ensureFetched: () => boolean
}

const useCommitteeStore = create<useCommitteeStoreStruct>((set, get) => ({
  state: CommitteeType.unknown,
  update(state: CommitteeType) {
    set({ state })
  },
  ensureFetched() {
    return get().state !== CommitteeType.unknown
  },
  isCommittee() {
    return get().state === CommitteeType.committee
  },
  isUnknown() {
    return get().state === CommitteeType.unknown
  },
}))

export { useCommitteeStore, CommitteeType }
