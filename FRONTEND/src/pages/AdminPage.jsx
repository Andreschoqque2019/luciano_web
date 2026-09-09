import { useState, useEffect, useCallback } from 'react'
import { getSolicitudesAdmin, actualizarEstadoSolicitud } from '../utils/api.js'

const STORAGE_KEY = 'admin_password'

function formatFecha(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    return d.toLocaleString('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return String(value)
  }
}

function getEstado(solicitud) {
  const raw = (solicitud.status || 'pendiente').toString().trim().toLowerCase()
  return raw === 'terminada' ? 'terminada' : 'pendiente'
}

function badgeStyle(estado) {
  if (estado === 'terminada') {
    return { background: '#dcfce7', border: '1px solid #86efac', color: '#166534' }
  }
  return { background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e' }
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthed, setIsAuthed] = useState(() => {
    try {
      return Boolean(sessionStorage.getItem(STORAGE_KEY))
    } catch {
      return false
    }
  })
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginError, setLoginError] = useState('')
  const [updatingIds, setUpdatingIds] = useState(() => new Set())
  const [itemErrors, setItemErrors] = useState({})

  const fetchList = useCallback(async (pwd) => {
    const pass = pwd ?? (() => {
      try {
        return sessionStorage.getItem(STORAGE_KEY) || ''
      } catch {
        return ''
      }
    })()
    if (!pass) {
      setError('Falta credencial de administrador.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await getSolicitudesAdmin(pass)
      setSolicitudes(Array.isArray(data) ? data : [])
    } catch (err) {
      const msg = err.message || 'Error al cargar solicitudes.'
      if (msg.includes('401') || msg.toLowerCase().includes('no autorizado')) {
        setError('Credencial incorrecta o expirada. Iniciá sesión de nuevo.')
        try {
          sessionStorage.removeItem(STORAGE_KEY)
        } catch {}
        setIsAuthed(false)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthed) {
      fetchList()
    }
  }, [isAuthed, fetchList])

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setError('')
    const pwd = password.trim()
    if (!pwd) {
      setLoginError('Ingresá la contraseña de administrador.')
      return
    }
    setLoading(true)
    try {
      const data = await getSolicitudesAdmin(pwd)
      try {
        sessionStorage.setItem(STORAGE_KEY, pwd)
      } catch {}
      setSolicitudes(Array.isArray(data) ? data : [])
      setIsAuthed(true)
      setPassword('')
    } catch (err) {
      const msg = err.message || 'Error de autenticación.'
      if (msg.includes('401') || msg.toLowerCase().includes('no autorizado')) {
        setLoginError('Contraseña incorrecta. Verificá ADMIN_PASSWORD del backend.')
      } else {
        setLoginError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {}
    setIsAuthed(false)
    setSolicitudes([])
    setPassword('')
    setError('')
    setLoginError('')
  }

  async function handleMarcarRealizada(id) {
    const sid = String(id)
    setItemErrors((prev) => {
      const next = { ...prev }
      delete next[sid]
      return next
    })
    setUpdatingIds((prev) => {
      const next = new Set(prev)
      next.add(sid)
      return next
    })

    // optimistic: keep previous for rollback
    let prevEstado = null
    setSolicitudes((prev) =>
      prev.map((s) => {
        if (String(s._id) === sid) {
          prevEstado = s.status
          return s
        }
        return s
      }),
    )

    try {
      const pwd = (() => {
        try {
          return sessionStorage.getItem(STORAGE_KEY) || ''
        } catch {
          return ''
        }
      })()
      const updated = await actualizarEstadoSolicitud(sid, pwd, 'terminada')
      const nuevoEstado = (updated.status || 'terminada').toString().toLowerCase()
      setSolicitudes((prev) =>
        prev.map((s) => (String(s._id) === sid ? { ...s, status: nuevoEstado, updatedAt: updated.updatedAt || s.updatedAt } : s)),
      )
    } catch (err) {
      const msg = err.message || 'Error al actualizar estado.'
      if (msg.includes('401') || msg.toLowerCase().includes('no autorizado')) {
        setError('Credencial incorrecta o expirada. Iniciá sesión de nuevo.')
        try {
          sessionStorage.removeItem(STORAGE_KEY)
        } catch {}
        setIsAuthed(false)
      } else {
        setItemErrors((prev) => ({ ...prev, [sid]: msg }))
      }
      // rollback optimistic not needed because we did not mutate before success
      if (prevEstado !== null) {
        // ensure status stays as before (no change)
        setSolicitudes((prev) =>
          prev.map((s) => (String(s._id) === sid ? { ...s, status: prevEstado } : s)),
        )
      }
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(sid)
        return next
      })
    }
  }

  // ── No autenticado: login ──
  if (!isAuthed) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-card--login">
          <header className="admin-header">
            <p className="admin-kicker">Panel privado</p>
            <h1>Administrar solicitudes</h1>
            <p className="admin-subtitle">
              Ingresá la contraseña configurada en <code>ADMIN_PASSWORD</code> del backend para ver las solicitudes sin usar Atlas ni Compass.
            </p>
          </header>

          <form className="admin-login-form" onSubmit={handleLogin} noValidate>
            <div className="form-field">
              <label htmlFor="admin-password">Contraseña de administrador</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder="ADMIN_PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
                aria-invalid={Boolean(loginError)}
                aria-describedby={loginError ? 'error-admin-password' : undefined}
              />
              {loginError && (
                <p id="error-admin-password" className="field-error" role="alert">
                  {loginError}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verificando…' : 'Entrar'}
            </button>

            <p className="admin-hint">
              La sesión se guarda en <code>sessionStorage</code> y se borra al cerrar la pestaña. En desarrollo local sin <code>ADMIN_PASSWORD</code> podés dejar cualquier valor y el backend deja pasar.
            </p>
          </form>
        </div>
      </div>
    )
  }

  // ── Autenticado: lista ──
  return (
    <div className="admin-page">
      <div className="admin-shell">
        <header className="admin-toolbar">
          <div>
            <p className="admin-kicker">Panel privado</p>
            <h1>Solicitudes</h1>
            <p className="admin-subtitle">
              {solicitudes.length === 0 && !loading ? 'Aún no hay solicitudes.' : `${solicitudes.length} solicitud(es) registrada(s).`}
            </p>
          </div>
          <div className="admin-actions">
            <button type="button" className="btn-secondary" onClick={() => fetchList()} disabled={loading}>
              {loading ? 'Cargando…' : 'Recargar'}
            </button>
            <button type="button" className="btn-ghost" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </header>

        {error && (
          <p className="field-error" role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 12px', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        {loading && solicitudes.length === 0 ? (
          <p className="admin-empty" aria-live="polite">Cargando solicitudes…</p>
        ) : solicitudes.length === 0 ? (
          <div className="admin-empty-card">
            <p>No hay solicitudes para mostrar.</p>
            <p className="admin-hint">Cuando un cliente envíe el formulario en /agendar, aparecerá acá con tipo, país, pago, cantidad, WhatsApp y nota.</p>
          </div>
        ) : (
          <>
            {/* Tabla desktop */}
            <div className="admin-table-wrap" role="region" aria-label="Tabla de solicitudes" tabIndex={0}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>País</th>
                    <th>Método de pago</th>
                    <th>Cant.</th>
                    <th>WhatsApp</th>
                    <th>Nota</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((s) => {
                    const estado = getEstado(s)
                    const sid = String(s._id || '')
                    const isUpdating = updatingIds.has(sid)
                    return (
                      <tr key={s._id || `${s.numero_wasap}-${s.createdAt}`}>
                        <td>{formatFecha(s.createdAt)}</td>
                        <td><span className="admin-badge">{s.tipo || '—'}</span></td>
                        <td>{s.pais || '—'}</td>
                        <td>{s.metodoPago || '—'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{s.cantidad ?? '—'}</td>
                        <td>
                          <a href={`https://wa.me/${String(s.numero_wasap || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="admin-wasap">
                            {s.numero_wasap || '—'}
                          </a>
                        </td>
                        <td style={{ maxWidth: '22ch', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.nota_adicional || s.nota || ''}>
                          {s.nota_adicional || s.nota || <span style={{ color: 'var(--stone-400)' }}>—</span>}
                        </td>
                        <td>
                          <span className="admin-badge" style={{ ...badgeStyle(estado), fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '4px 8px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                            {estado}
                          </span>
                        </td>
                        <td>
                          {estado !== 'terminada' ? (
                            <>
                              <button
                                type="button"
                                className="btn-primary"
                                style={{ fontSize: '0.75rem', padding: '6px 10px', whiteSpace: 'nowrap' }}
                                onClick={() => handleMarcarRealizada(s._id)}
                                disabled={isUpdating}
                                aria-busy={isUpdating}
                              >
                                {isUpdating ? 'Actualizando…' : 'SOLICITUD REALIZADA'}
                              </button>
                              {itemErrors[sid] && (
                                <p className="field-error" role="alert" style={{ marginTop: '6px', fontSize: '0.75rem' }}>{itemErrors[sid]}</p>
                              )}
                            </>
                          ) : (
                            <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.8rem' }}>✓ Terminada</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards mobile */}
            <ul className="admin-cards" aria-label="Listado de solicitudes">
              {solicitudes.map((s) => {
                const estado = getEstado(s)
                const sid = String(s._id || '')
                const isUpdating = updatingIds.has(sid)
                return (
                  <li key={s._id || `${s.numero_wasap}-${s.createdAt}-card`} className="admin-card-item">
                    <div className="admin-card-item__head">
                      <span className="admin-badge">{s.tipo || '—'}</span>
                      <span className="admin-card-item__date">{formatFecha(s.createdAt)}</span>
                    </div>
                    <div style={{ margin: '8px 0' }}>
                      <span className="admin-badge" style={{ ...badgeStyle(estado), fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '4px 8px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                        {estado}
                      </span>
                    </div>
                    <dl className="admin-card-item__meta">
                      <div><dt>País</dt><dd>{s.pais || '—'}</dd></div>
                      <div><dt>Pago</dt><dd>{s.metodoPago || '—'}</dd></div>
                      <div><dt>Cant.</dt><dd>{s.cantidad ?? '—'}</dd></div>
                      <div><dt>WhatsApp</dt><dd><a href={`https://wa.me/${String(s.numero_wasap || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">{s.numero_wasap || '—'}</a></dd></div>
                    </dl>
                    {(s.nota_adicional || s.nota) && (
                      <p className="admin-card-item__nota">{s.nota_adicional || s.nota}</p>
                    )}
                    <div style={{ marginTop: '12px' }}>
                      {estado !== 'terminada' ? (
                        <>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px' }}
                            onClick={() => handleMarcarRealizada(s._id)}
                            disabled={isUpdating}
                            aria-busy={isUpdating}
                          >
                            {isUpdating ? 'Actualizando…' : 'SOLICITUD REALIZADA'}
                          </button>
                          {itemErrors[sid] && (
                            <p className="field-error" role="alert" style={{ marginTop: '6px', fontSize: '0.75rem' }}>{itemErrors[sid]}</p>
                          )}
                        </>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.85rem' }}>✓ Terminada</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
