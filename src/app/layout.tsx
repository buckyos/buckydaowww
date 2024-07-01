import './globals.css'
import Header from './header/header'
import Fetcher from 'header/Fetcher'
import Footer from './footer'
import localFont from 'next/font/local'

// Font files can be colocated inside of `app`
const font = localFont({
  src: '../public/Poppins.ttf',
  display: 'swap',
})

export const metadata = {
  title: 'Bucky DAO (power by CYFS source DAO)',
  description: 'Bucky DAO (power by CYFS source DAO)',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body className={font.className}>
        <Fetcher />
        <Header />
        <main className='max-w-[1260px] mx-auto min-h-[calc(100vh-180px)]'>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
