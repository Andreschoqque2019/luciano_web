export default function ContactosPage() {
  return (
    <main className="page-container">
      <section className="contactos-card" aria-labelledby="contactos-title">
        <img
          src="/FOTO4.jpg"
          alt="Contacto dragón — FOTO 4 protagonista"
          className="contactos-banner-img"
          loading="eager"
          decoding="async"
        />
        <h1 id="contactos-title">Contactos</h1>
        <p className="contactos-subtitle">Ponete en contacto con nosotros por los siguientes medios.</p>
        <ul className="contactos-list">
          <li>
            <span className="contactos-label">WhatsApp:</span>{' '}
            <a href="https://wa.me/543516776923" target="_blank" rel="noopener noreferrer">
              +54 3516776923
            </a>
          </li>
          <li>
            <span className="contactos-label">Link de grupo de WhatsApp:</span>{' '}
            <a
              href="https://chat.whatsapp.com/CLlURKI1Pa5K7eVABDOO96?s=cl&p=a&ilr=0"
              target="_blank"
              rel="noopener noreferrer"
            >
              VISITAR GRUPO
            </a>
          </li>
        </ul>
        <p className="contactos-nota">
          Horario de atención: Desde las 11 am hora argentina, Hasta las 3 am hora argentina.
        </p>
        <img
          src="/FOTO12.jpg"
          alt="Contacto dragón — FOTO12 protagonista"
          className="contactos-banner-img contactos-banner-img--secondary"
          loading="lazy"
          decoding="async"
        />
      </section>
    </main>
  )
}
