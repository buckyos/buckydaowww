import Link from 'next/link'
import Nav from './nav'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
const HeaderLogin = dynamic(() => import('./HeaderLogin'), {
  ssr: false,
  suspense: true,
})

export default function Header() {
  return (
    <header className='max-w-[90%] mx-auto h-24 flex'>
      <div className='w-full flex items-center gap-10'>
        <Link href='/'>
          <div className='text-4xl no-underline text-black'>BuckyDAO</div>
        </Link>
        <Nav />
        <div className='flex-1'></div>
        <Suspense fallback={<div>Loading...</div>}>
          <HeaderLogin />
        </Suspense>
      </div>
    </header>
  )
}
