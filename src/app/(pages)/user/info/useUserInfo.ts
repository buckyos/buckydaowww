import { create } from 'zustand'



export const useUserinfo = create<{
  job: string
  desc: string
  isEdit: boolean
  setIsEdit: (isEdit: boolean) => void
  setJob: (job: string) => void
  setDesc: (desc: string) => void
}>((set) => ({
  job: '',
  desc: '',
  isEdit: false,
  setIsEdit: (isEdit: boolean) => set({ isEdit }),
  setJob: (job: string) => set({ job }),
  setDesc: (desc: string) => set({ desc }),
}))

