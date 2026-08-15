export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050505',
      color: 'white',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h1 style={{
        fontSize: '72px',
        fontWeight: 900,
        letterSpacing: '-0.05em'
      }}>
        Wedding OS
      </h1>

      <p style={{
        color: 'rgba(255,255,255,0.65)',
        maxWidth: '700px',
        textAlign: 'center',
        lineHeight: 1.7
      }}>
        Cinematic multi-tenant wedding experience platform.
      </p>
    </main>
  )
}
