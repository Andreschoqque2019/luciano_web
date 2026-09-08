import SolicitudForm from '../components/SolicitudForm.jsx'

export default function SolicitudPage() {
  return (
    <main className="solicitud-page">
      <div className="solicitud-card">
        <header className="solicitud-header">
          <h1>Enviar solicitud</h1>
          <p className="solicitud-subtitle">
            Completá el formulario y te contactaremos por WhatsApp a la brevedad.
          </p>
        </header>
        <SolicitudForm />
      </div>
    </main>
  )
}
