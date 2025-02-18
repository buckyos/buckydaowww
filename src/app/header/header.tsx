import Link from 'next/link'
import Image from 'next/image'
import Nav from './nav'
import dynamic from 'next/dynamic'
import images from '@images'
import { Suspense } from 'react'
const HeaderRight = dynamic(() => import('@components/header/HeaderRight'), {
  ssr: false,
  suspense: true,
})

export default function Header() {
  return (
    <header className='max-w-[90%] mx-auto h-24 flex'>
      <div className='w-full flex items-center gap-10'>
        <Link className='flex-center gap-2 no-underline text-black' href='/'>
          <Image src={images.iconDan} width={36} height={36} alt='' />
          <div className='text-xl'>BuckyDAO</div>
        </Link>
        <Nav />
        <div className='flex-1'></div>
        <Suspense fallback={<div>Loading...</div>}>
          <HeaderRight />
        </Suspense>
      </div>
    </header>
  )
}
