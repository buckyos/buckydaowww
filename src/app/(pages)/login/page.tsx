'use client'
import { Suspense } from 'react'
import { useAsyncEffect } from 'ahooks'
import { useSearchParams, useRouter } from 'next/navigation'
import useUserStore from '@hooks/useUserStore'
import { message } from 'antd'
import { completeGithubLogin } from '@services/index'

function LoginPageInner() {
  const params = useSearchParams()
  const router = useRouter()
  const code = params.get('code')
  const state = params.get('state')
  const user = useUserStore()

  useAsyncEffect(async () => {
    if (code) {
      if (!state) {
        message.error('Missing GitHub OAuth state')
        return
      }

      const result = await completeGithubLogin(code, state)
      if (result.code != 0) {
        message.error(result.msg || 'GitHub login failed')
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
  }, [code, state])

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
