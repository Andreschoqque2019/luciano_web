import { useState } from 'react'
import { TIPOS_SOLICITUD } from '../data/solicitudTipos.js'
import { PAISES, PAGOS_POR_PAIS } from '../data/pagosPorPais.js'
import { crearSolicitud } from '../utils/api.js'

const WHATSAPP_PATTERN = /^\+?[0-9\s\-()]{7,20}$/

export default function SolicitudForm() {
  const [tipo, setTipo] = useState('')
  const [pais, setPais] = useState('')
  const [metodoPago, setMetodoPago] = useState('')
  const [numeroWasap, setNumeroWasap] = useState('')
  const [notaAdicional, setNotaAdicional] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState('')

  const metodosDisponibles = pais ? PAGOS_POR_PAIS[pais] || [] : []

  function handlePaisChange(e) {
    const nextPais = e.target.value
    setPais(nextPais)
    setMetodoPago('')
  }

  function validate() {
    const next = {}
    if (!tipo) next.tipo = 'ESTIMADO DRAGONERO , DEBE SELECCIONAR UN TIPO DE SOLICITUD.'
    if (!pais) next.pais = 'SELECCIONÁ UN PAÍS DRAGONERO.'
    if (!metodoPago) {
      next.metodoPago = 'SELECCIONÁ UN MÉTODO DE PAGO DRAGONERO.'
    } else if (pais && !(PAGOS_POR_PAIS[pais] || []).includes(metodoPago)) {
      next.metodoPago = 'EL MÉTODO DE PAGO NO CORRESPONDE AL PAÍS SELECCIONADO DRAGONERO.'
    }
    if (!numeroWasap.trim()) {
      next.numero_wasap = 'EL NUMERO DE WHATSAPP ES OBLIGATORIO DRAGONERO.'
    } else if (!WHATSAPP_PATTERN.test(numeroWasap.trim())) {
      next.numero_wasap = 'EL NUMERO DE WHATSAPP ES OBLIGATORIO DRAGONERO.'
    }
    if (notaAdicional.length > 500) {
      next.nota_adicional = 'LA NOTA ADICIONAL NO PUEDE EXCEDER LOS 500 CARACTERES DRAGONERO.'
    }
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    setSuccess('')
    const validation = validate()
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setLoading(true)
    try {
      const payload = {
        tipo,
        pais,
        metodoPago,
        numero_wasap: numeroWasap.trim(),
        nota_adicional: notaAdicional.trim(),
      }
      const result = await crearSolicitud(payload)
      console.log('[luciano_web] solicitud creada', result)
      setSuccess(`¡Solicitud enviada con éxito! Te contactaremos por WhatsApp. País: ${pais} — Método: ${metodoPago}`)
      setTipo('')
      setPais('')
      setMetodoPago('')
      setNumeroWasap('')
      setNotaAdicional('')
      setErrors({})
    } catch (err) {
      setApiError(err.message || 'Error al enviar la solicitud. Intentá nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="solicitud-form" onSubmit={handleSubmit} noValidate aria-label="Formulario de solicitud">
      {apiError && (
        <p className="field-error" role="alert" aria-live="assertive">
          {apiError}
        </p>
      )}
      {success && (
        <p className="field-success" role="status" aria-live="polite" style={{ color: '#2e7d32', background: '#e8f5e9', padding: '10px', borderRadius: '6px', marginBottom: '12px' }}>
          {success}
        </p>
      )}

      <div className="form-field">
        <label htmlFor="tipo">TIPO DE SOLICITUD</label>
        <select
          id="tipo"
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          required
          aria-required="true"
          aria-invalid={Boolean(errors.tipo)}
          aria-describedby={errors.tipo ? 'error-tipo' : undefined}
        >
          <option value="" disabled>
            Seleccioná una opción
          </option>
          {TIPOS_SOLICITUD.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {errors.tipo && (
          <p id="error-tipo" className="field-error" role="alert">
            {errors.tipo}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="pais">PAÍS</label>
        <select
          id="pais"
          name="pais"
          value={pais}
          onChange={handlePaisChange}
          required
          aria-required="true"
          aria-invalid={Boolean(errors.pais)}
          aria-describedby={errors.pais ? 'error-pais' : undefined}
        >
          <option value="" disabled>
            Seleccioná tu país
          </option>
          {PAISES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errors.pais && (
          <p id="error-pais" className="field-error" role="alert">
            {errors.pais}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="metodoPago">MÉTODO DE PAGO</label>
        <select
          id="metodoPago"
          name="metodoPago"
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          required
          aria-required="true"
          aria-invalid={Boolean(errors.metodoPago)}
          aria-describedby={errors.metodoPago ? 'error-metodoPago' : undefined}
          disabled={!pais}
        >
          <option value="" disabled>
            {pais ? 'Seleccioná un método de pago' : 'Primero seleccioná un país'}
          </option>
          {metodosDisponibles.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {errors.metodoPago && (
          <p id="error-metodoPago" className="field-error" role="alert">
            {errors.metodoPago}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="numero_wasap">NÚMERO DE WHATSAPP</label>
        <input
          id="numero_wasap"
          name="numero_wasap"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="ejemplo: 969 441 234"
          value={numeroWasap}
          onChange={(e) => setNumeroWasap(e.target.value)}
          required
          aria-required="true"
          aria-invalid={Boolean(errors.numero_wasap)}
          aria-describedby={errors.numero_wasap ? 'error-numero_wasap' : undefined}
          pattern="\+?[0-9\s\-()]{7,20}"
        />
        {errors.numero_wasap && (
          <p id="error-numero_wasap" className="field-error" role="alert">
            {errors.numero_wasap}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="NOTA_ADICIONAL">Nota adicional</label>
        <textarea
          id="NOTA_ADICIONAL"
          name="NOTA_ADICIONAL"
          placeholder="Brindanos el detalle especifico de la solicitud maestro dragonero"
          value={notaAdicional}
          onChange={(e) => setNotaAdicional(e.target.value)}
          maxLength={500}
          rows={4}
          aria-describedby="hint-nota"
        />
        <span id="hint-nota" className="field-hint">
          {notaAdicional.length}/500 caracteres
        </span>
        {errors.nota_adicional && (
          <p className="field-error" role="alert">
            {errors.nota_adicional}
          </p>
        )}
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'ENVIANDO...' : 'MANDAR SOLICITUD'}
      </button>
    </form>
  )
}
