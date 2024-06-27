'use client'
import { Suspense } from 'react'
import { useAsyncEffect } from 'ahooks'
import { useSearchParams, useRouter } from 'next/navigation'
import useUserStore from '@hooks/useUserStore'
import { message } from 'antd'

function LoginPageInner() {
  const params = useSearchParams()
  const router = useRouter()
  const code = params.get('code')
  const user = useUserStore()

  useAsyncEffect(async () => {
    if (code) {
      // fetch token
      const resp = await fetch(`/api/user/githublogin?code=${code}`)
      const result = await resp.json()
      if (result.code != 0) {
        message.error(result.msg)
        return
      }
      const jwt = result.data
      user.updateJwt(jwt)

      // fetch user info
      {
        const code = await user.updateUser()
        if (code == 0) {
          message.success('login successfully')
          const redirect = params.get('redirect')
          if (redirect) {
            console.log('🍻 redirect :', redirect)
            router.push(decodeURIComponent(redirect))
          } else {
            router.push('/')
          }
        }
      }
    }
  }, [code])

  return (
    <div className='flex-center'>
      <div>Logging in, please wait</div>
    </div>
  )
}

const LoginPage = () => {
  return (
    <Suspense fallback={<div>loading...</div>}>
      <LoginPageInner />
    </Suspense>
  )
}

export default LoginPage
