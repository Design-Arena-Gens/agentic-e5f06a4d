import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Luxury Lifestyle Automation',
  description: 'Automated Pexels to Instagram video posting',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
