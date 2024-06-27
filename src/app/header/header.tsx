import images from '@images'
import Image from 'next/image'
import Link from 'next/link'
import Nav from './nav'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
// import HeaderLogin from './HeaderLogin'
const HeaderLogin = dynamic(() => import('./HeaderLogin'), {
  ssr: false,
  suspense: true,
})

export default function Header() {
  return (
    <header className='max-w-[90%] mx-auto h-24 flex'>
      <div className='w-full flex items-center gap-10'>
        <Link href='/'>
          <Image src={images.iconDan} width={48} height={48} alt='' />
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
