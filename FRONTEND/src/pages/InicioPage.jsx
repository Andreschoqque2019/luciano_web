import { Link } from 'react-router-dom'

export default function InicioPage() {
  return (
    <main className="page-container">
      <div className="inicio-wrap">
        <section className="hero hero--dragon" aria-labelledby="hero-title">
          <h1 id="hero-title">BIENVENIDO A LUCIANO_WEB</h1>
          <p className="hero-subtitle">
            REALIZA TUS SOLICITUDES DE FORMA RÁPIDA Y SIMPLE MAESTRO DRAGONERO ESTAMOS LISTOS PARA AYUDARTE.
          </p>
          <Link to="/agendar" className="btn-primary hero-cta">
            AGENDAR SOLICITUD
          </Link>
        </section>

        <section className="inicio-gallery" aria-label="Galería dragón">
          <figure className="inicio-gallery__card">
            <img src="/FOTO1.jpg" alt="Dragón dorado sobre fondo oscuro" loading="eager" decoding="async" />
          </figure>
          <figure className="inicio-gallery__card">
            <img src="/FOTO2.jpg" alt="Detalle del dragón rojo" loading="lazy" decoding="async" />
          </figure>
          <figure className="inicio-gallery__card">
            <img src="/FOTO5.jpg" alt="Dragón majestuoso en penumbra" loading="lazy" decoding="async" />
          </figure>
          <figure className="inicio-gallery__card">
            <img src="/Dragon10.jpg" alt="Dragón — FOTO10 protagonista" loading="lazy" decoding="async" />
          </figure>
        </section>
      </div>
    </main>
  )
}
