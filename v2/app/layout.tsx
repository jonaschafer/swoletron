import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './components/ThemeProvider'
import { ThemeToggle } from './components/ThemeToggle'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Swoletron v2 - Training Calendar',
  description: 'Your personal training calendar and workout tracker',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('swoletron-theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const shouldBeDark = theme === 'dark' || (theme === 'system' && systemPrefersDark) || (!theme && systemPrefersDark);
                if (shouldBeDark) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <ThemeToggle />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}