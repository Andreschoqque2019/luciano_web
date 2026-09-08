import { NavLink } from 'react-router-dom'

export default function Navigation() {
  return (
    <nav className="nav" aria-label="Navegación principal">
      <div className="nav-inner">
        <NavLink to="/" className="nav-brand" aria-label="Ir al inicio">
          <img
            src="/LUCI_WEB_LOGO.jpg"
            alt="luciano_web"
            className="nav-logo"
            loading="eager"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <span>luciano_web</span>
        </NavLink>
        <div className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
          >
            INICIO
          </NavLink>
          <NavLink
            to="/agendar"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
          >
            AGENDAR
          </NavLink>
          <NavLink
            to="/contactos"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
          >
            CONTACTOS
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
