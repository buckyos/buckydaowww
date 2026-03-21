import { create } from 'zustand'



export const useUserinfo = create<{
  nickname: string
  job: string
  desc: string
  isEdit: boolean
  setIsEdit: (isEdit: boolean) => void
  setNickname: (nickname: string) => void
  setJob: (job: string) => void
  setDesc: (desc: string) => void
}>((set) => ({
  nickname: '',
  job: '',
  desc: '',
  isEdit: false,
  setIsEdit: (isEdit: boolean) => set({ isEdit }),
  setNickname: (nickname: string) => set({ nickname }),
  setJob: (job: string) => set({ job }),
  setDesc: (desc: string) => set({ desc }),
}))
