import RuntimeConfigGate from './RuntimeConfigGate'
import { readPublicConfig } from '../../scripts/public-config.cjs'

// Runtime configuration is read on each request, never frozen into static HTML.
export const dynamic = 'force-dynamic'
import './globals.css'
import Header from './header/header'
import Fetcher from 'header/Fetcher'
import Footer from './footer'
import LocalChainTimeNotice from './header/LocalChainTimeNotice'
import localFont from 'next/font/local'

// Font files can be colocated inside of `app`
const font = localFont({
  src: '../public/Poppins.ttf',
  display: 'swap',
})

export const metadata = {
  title: 'BuckyDAO',
  description: 'BuckyDAO governance, projects, funding, and token operations for BuckyOS.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body className={font.className}>
        <RuntimeConfigGate config={readPublicConfig(process.env.SOURCEDAO_PUBLIC_CONFIG)}>
          <Fetcher />
          <Header />
          <LocalChainTimeNotice />
          <main className='max-w-[1260px] mx-auto min-h-[calc(100vh-180px)]'>
            {children}
          </main>
          <Footer />
        </RuntimeConfigGate>
      </body>
    </html>
  )
}
