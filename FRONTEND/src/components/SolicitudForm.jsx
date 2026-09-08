import { useState } from 'react'
import { TIPOS_SOLICITUD } from '../data/solicitudTipos.js'
import { PAISES, PAGOS_POR_PAIS, PREFIJOS, getPrefijo } from '../data/pagosPorPais.js'
import { crearSolicitud } from '../utils/api.js'

const WHATSAPP_LOCAL_PATTERN = /^[0-9]{7,12}$/
const WHATSAPP_FULL_PATTERN = /^\+[0-9]{7,15}$/

export default function SolicitudForm() {
  const [tipo, setTipo] = useState('')
  const [pais, setPais] = useState('')
  const [metodoPago, setMetodoPago] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [numeroWasap, setNumeroWasap] = useState('')
  const [notaAdicional, setNotaAdicional] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState('')

  const metodosDisponibles = pais ? PAGOS_POR_PAIS[pais] || [] : []
  const prefijo = getPrefijo(pais)

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
    if (!String(cantidad).trim()) {
      next.cantidad = 'LA CANTIDAD ES OBLIGATORIA DRAGONERO.'
    } else {
      const num = Number(cantidad)
      if (!Number.isInteger(num) || num < 1 || num > 100) {
        next.cantidad = 'LA CANTIDAD DEBE SER UN NÚMERO ENTERO ENTRE 1 Y 100 DRAGONERO.'
      }
    }
    const wasapRaw = numeroWasap.trim()
    if (!wasapRaw) {
      next.numero_wasap = 'EL NUMERO DE WHATSAPP ES OBLIGATORIO DRAGONERO.'
    } else {
      let normalized = wasapRaw.replace(/[\s\-()]/g, '')
      if (normalized.startsWith('+')) {
        if (prefijo && normalized.startsWith(prefijo)) {
          const localPart = normalized.slice(prefijo.length)
          if (!WHATSAPP_LOCAL_PATTERN.test(localPart)) {
            next.numero_wasap = 'EL NUMERO DE WHATSAPP DEBE TENER ENTRE 7 Y 12 DÍGITOS NUMÉRICOS (SIN CONTAR PREFIJO) DRAGONERO.'
          }
        } else if (WHATSAPP_FULL_PATTERN.test(normalized)) {
          // Usuario pegó número con prefijo de otro país: aceptar si formato total es válido
          // Verificar que el resto sin prefijo tenga al menos 7 dígitos
          const withoutPlus = normalized.slice(1)
          // Intentar detectar prefijo conocido para validar local 7-12, si no, validar total 7-15
          const matchedPrefijo = Object.values(PREFIJOS).find((p) => normalized.startsWith(p))
          if (matchedPrefijo) {
            const localPart = normalized.slice(matchedPrefijo.length)
            if (!WHATSAPP_LOCAL_PATTERN.test(localPart)) {
              next.numero_wasap = 'EL NUMERO DE WHATSAPP DEBE TENER ENTRE 7 Y 12 DÍGITOS NUMÉRICOS (SIN CONTAR PREFIJO) DRAGONERO.'
            }
          } else if (withoutPlus.length < 7 || withoutPlus.length > 15) {
            next.numero_wasap = 'EL NUMERO DE WHATSAPP DEBE TENER ENTRE 7 Y 12 DÍGITOS NUMÉRICOS DRAGONERO.'
          }
        } else {
          next.numero_wasap = 'EL NUMERO DE WHATSAPP DEBE TENER ENTRE 7 Y 12 DÍGITOS NUMÉRICOS DRAGONERO.'
        }
      } else if (normalized.startsWith('00')) {
        const withPlus = `+${normalized.slice(2)}`
        if (!WHATSAPP_FULL_PATTERN.test(withPlus)) {
          next.numero_wasap = 'EL NUMERO DE WHATSAPP DEBE TENER ENTRE 7 Y 12 DÍGITOS NUMÉRICOS DRAGONERO.'
        }
      } else {
        // Sin prefijo: validar solo dígitos locales 7-12
        if (!WHATSAPP_LOCAL_PATTERN.test(normalized)) {
          next.numero_wasap = 'EL NUMERO DE WHATSAPP DEBE TENER ENTRE 7 Y 12 DÍGITOS NUMÉRICOS DRAGONERO.'
        }
      }
    }
    if (notaAdicional.length > 500) {
      next.nota_adicional = 'LA NOTA ADICIONAL NO PUEDE EXCEDER LOS 500 CARACTERES DRAGONERO.'
    }
    return next
  }

  function buildNumeroWasapConPrefijo() {
    const raw = numeroWasap.trim().replace(/[\s\-()]/g, '')
    if (!raw) return ''
    if (raw.startsWith('+')) return raw
    if (raw.startsWith('00')) return `+${raw.slice(2)}`
    return `${prefijo}${raw}`
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
      const numeroConPrefijo = buildNumeroWasapConPrefijo()
      const payload = {
        tipo,
        pais,
        metodoPago,
        numero_wasap: numeroConPrefijo,
        cantidad: Number(cantidad),
        nota_adicional: notaAdicional.trim(),
      }
      const result = await crearSolicitud(payload)
      console.log('[luciano_web] solicitud creada', result)
      setSuccess(`¡Solicitud enviada con éxito! Te contactaremos por WhatsApp. País: ${pais} — Método: ${metodoPago}`)
      setTipo('')
      setPais('')
      setMetodoPago('')
      setCantidad('')
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
        <label htmlFor="cantidad">Cantidad</label>
        <input
          id="cantidad"
          name="cantidad"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          step={1}
          placeholder="1"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          required
          aria-required="true"
          aria-invalid={Boolean(errors.cantidad)}
          aria-describedby={errors.cantidad ? 'error-cantidad' : undefined}
        />
        {errors.cantidad && (
          <p id="error-cantidad" className="field-error" role="alert">
            {errors.cantidad}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="numero_wasap">NÚMERO DE WHATSAPP</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '56px',
              padding: '8px 10px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              background: pais ? '#f5f5f5' : '#eee',
              color: pais ? '#333' : '#999',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {prefijo || '+--'}
          </span>
          <input
            id="numero_wasap"
            name="numero_wasap"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="ejemplo: 969441234"
            value={numeroWasap}
            onChange={(e) => setNumeroWasap(e.target.value.replace(/[^0-9\s\-()+]/g, ''))}
            required
            aria-required="true"
            aria-invalid={Boolean(errors.numero_wasap)}
            aria-describedby={errors.numero_wasap ? 'error-numero_wasap' : undefined}
            pattern="[0-9]{7,12}"
            style={{ flex: 1 }}
          />
        </div>
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
