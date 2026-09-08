import SolicitudForm from './SolicitudForm.jsx'

export default function AgendarPage() {
  return (
    <main className="agendar-page">
      <div className="agendar-banner" aria-hidden="false">
        <img src="/FOTO2.jpg" alt="Dragón rojo protagonista" loading="eager" decoding="async" />
      </div>

      <div className="solicitud-card">
        <header className="solicitud-header">
          <h1>AGENDA TU SOLICITUD DRAGONERO</h1>
          <p className="solicitud-subtitle">
            Completá el formulario y te contactaremos por WhatsApp para coordinar tu solicitud.
          </p>
        </header>
        <SolicitudForm />
      </div>

      <div className="agendar-banner agendar-banner--secondary" aria-hidden="false">
        <img src="/FOTO5.jpg" alt="Dragón en penumbra dorada" loading="lazy" decoding="async" />
      </div>
    </main>
  )
}
