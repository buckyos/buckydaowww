import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 过期时间 12小时
const EXPIRATION_DURATION = 12 * 60 * 60 * 1000

const useUserStore = create<UserStoreDefine>()(
  persist(
    (set, get) => ({
      user: {
        address: '',
        nickname: '',
        avatar: '',
        github_account: '',
        job: '',
        desc: '',
      },
      jwt: '',
      expiration: 0,
      updateUser: async () => {
        const jwt = get().jwt
        const resp = await fetch('/api/user/info', {
          headers: {
            'DAO-TOKEN': jwt,
          },
        })
        const result = (await resp.json()) as UserinfoResponse

        console.log('Store fetch and update user info', result)
        if (result.code == 0) {
          const user = result.data as User
          set({
            user: user,
          })
        }
        return result.code
      },
      updateJwt: (jwt: string) => {
        set({
          jwt: jwt,
          expiration: Date.now() + EXPIRATION_DURATION,
        })
      },
      // login: async (data) => {
      //   const resp = await fetch('/api/user/login', {
      //     method: 'POST', // or 'PUT'
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify(data),
      //   })
      //   const result = await resp.json()
      //   console.log('after user store login', result)
      //   set({ user: { address: data.address } })
      // },
      isConnect() {
        // console.log('get().user.address', get().user.address)
        return !!get().user.address
      },
      isLogin() {
        const expiration = get().expiration

        // console.log('isLogin', dayjs(Date.now()).format('YYYY-MM-DD HH:mm:ss'))
        // if (expiration) {
        //   console.log(
        //     'expiration date',
        //     dayjs(expiration).format('YYYY-MM-DD HH:mm:ss'),
        //   )
        // }

        // check expiration
        if (Date.now() > expiration) {
          return false
        }

        const jwt = !!get().jwt
        const nickname = !!get().user.nickname
        return jwt && nickname
      },
      logout() {
        set({
          user: {
            address: '',
            nickname: '',
            avatar: '',
            github_account: '',
            job: '',
            desc: '',
          },
          jwt: '',
        })
        localStorage.removeItem('committee-type')
      },
    }),
    { name: 'user-store' },
  ),
)

export default useUserStore
