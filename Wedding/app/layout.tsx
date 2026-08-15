export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ background: '#050505', color: 'white' }}>
        {children}
      </body>
    </html>
  )
}
