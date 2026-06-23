import { useEffect, useMemo, useState } from 'react'
import ListaDesembarques from './components/ListaDesembarques'
import './App.css'

const estados = ['todos', 'pendiente', 'procesado', 'rechazado']

const STORAGE_KEY = 'desembarques-prioridad'

const normalizeApiBaseUrl = (value) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('La variable VITE_API_URL no está configurada.')
  }

  try {
    const url = new URL(value.trim())
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
  } catch {
    throw new Error('VITE_API_URL no contiene una URL válida.')
  }
}

const getApiBaseUrl = () => normalizeApiBaseUrl(import.meta.env.VITE_API_URL)

const validateApiConfig = () => {
  try {
    getApiBaseUrl()
    return ''
  } catch (err) {
    return err instanceof Error ? err.message : 'Error en configuración de API.'
  }
}

const buildApiUrl = (endpoint) => {
  const base = getApiBaseUrl()
  return `${base.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`
}

const sanitizeFilterText = (value) => {
  const normalized = value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s._-]/g, '')
  return normalized.slice(0, 50)
}

const validateFilterText = (value) => {
  if (value.length > 50) {
    return 'Máximo 50 caracteres.'
  }
  if (!/^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s._-]*$/.test(value)) {
    return 'Solo letras, números y los símbolos , . _ - son válidos.'
  }
  return ''
}

function App() {
  const [desembarques, setDesembarques] = useState([])
  const [filterText, setFilterText] = useState('')
  const [filterTextError, setFilterTextError] = useState('')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarDesembarques = async () => {
    setLoading(true)
    setError(null)

    const configError = validateApiConfig()
    if (configError) {
      setLoading(false)
      setError(configError)
      return
    }

    let savedPriorities = {}
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        savedPriorities = JSON.parse(saved)
      } catch {
        savedPriorities = {}
      }
    }

    try {
      const url = buildApiUrl('desembarques')
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? 'Recurso no encontrado en el servicio'
            : `Error ${response.status}: No se pudo leer el servicio de desembarques`
        )
      }
      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('application/json')) {
        throw new Error('El servicio no devolvió contenido JSON válido.')
      }
      const data = await response.json()
      if (!Array.isArray(data)) {
        throw new TypeError('La respuesta del servicio no tiene el formato esperado.')
      }
      const listado = data.map((item) => ({
        ...item,
        prioridad: Boolean(savedPriorities[item.id]),
      }))
      setDesembarques(listado)
      setError(null)
    } catch (err) {
      setError(err.message || 'Error desconocido al conectar con el servicio')
      setDesembarques([])
    } finally {
      setLoading(false)
    }
  }

  const guardarPrioridades = (lista) => {
    const prioridades = Object.fromEntries(
      lista.map((item) => [item.id, item.prioridad]),
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prioridades))
  }

  const togglePrioridad = (id) => {
    setDesembarques((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, prioridad: !item.prioridad } : item,
      )
      guardarPrioridades(next)
      return next
    })
  }

  const comprobarServicio = async (timeout = 3000) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    try {
      const url = `${buildApiUrl('desembarques')}?_limit=1`
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(id)
      return res.ok
    } catch (err) {
      clearTimeout(id)
      // debug the ping failure for diagnostics
      // eslint-disable-next-line no-console
      console.debug('ping failed', err)
      return false
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      const configError = validateApiConfig()
      if (!mounted) return
      if (configError) {
        setLoading(false)
        setError(configError)
        return
      }
      const ok = await comprobarServicio(3000)
      if (!mounted) return
      if (!ok) {
        setLoading(false)
        setError('failed to fetch')
        return
      }
      await cargarDesembarques()
    })()
    return () => {
      mounted = false
    }
  }, [])

  const serverCommand = `cd react && npx json-server --watch db.json --port 3001`
  const envInstructions = 'Crea react/.env con:\nVITE_API_URL=http://localhost:3001'
  const isNetworkError = (msg) => {
    if (!msg) return false
    return /failed to fetch/i.test(msg) || /network/i.test(msg)
  }

  const resultados = useMemo(() => {
    const texto = sanitizeFilterText(filterText).toLowerCase()
    const estadoValido = estados.includes(filterEstado) ? filterEstado : 'todos'

    return desembarques.filter((item) => {
      const matchesText =
        texto === '' ||
        item.especie.toLowerCase().includes(texto) ||
        item.estado.toLowerCase().includes(texto) ||
        item.embarcacion.toLowerCase().includes(texto) ||
        item.fecha.includes(texto)
      const matchesEstado = estadoValido === 'todos' || item.estado === estadoValido
      return matchesText && matchesEstado
    })
  }, [desembarques, filterEstado, filterText])

  const prioridadCount = desembarques.filter((item) => item.prioridad).length
 

  return (
    <main className="panel">
      <header className="panel__header">
        <div>
          <h1>Panel de Desembarques</h1>
          <p>Visor de lotes cargados desde el servicio de la empresa.</p>
        </div>
        <div>
          <div className="panel__status">
            <strong>{desembarques.length}</strong> lotes cargados · <strong>{prioridadCount}</strong> prioritarios
          </div>
        </div>
      </header>

      <section className="panel__filters">
        <label htmlFor="search-desembarques" style={{ color: '#0b1220' }}>
          Buscar por especie o estado:
        </label>
        <input
          id="search-desembarques"
          type="search"
          value={filterText}
          maxLength={50}
          onChange={(event) => {
            const rawValue = event.target.value
            const sanitized = sanitizeFilterText(rawValue)
            setFilterText(sanitized)
            setFilterTextError(validateFilterText(rawValue))
          }}
          placeholder="Ej. Jurel, pendiente, rechazado"
          style={{ color: '#0b1220' }}
          aria-describedby="search-error"
        />
        {filterTextError && (
          <div id="search-error" className="panel__field-error">
            {filterTextError}
          </div>
        )}

        <label htmlFor="estado-desembarques" style={{ color: '#0b1220' }}>
          Estado:
        </label>
        <select
          id="estado-desembarques"
          value={filterEstado}
          onChange={(event) => setFilterEstado(event.target.value)}
          style={{ color: '#0b1220' }}
        >
          {estados.map((estado) => (
            <option key={estado} value={estado}>
              {estado === 'todos' ? 'Todos' : estado}
            </option>
          ))}
        </select>
      </section>

      <section className="panel__content">
        {loading && (
          <section className="panel__state panel__state--loading">
            <div className="panel__spinner"></div>
            <p>Cargando desembarques desde el servicio...</p>
          </section>
        )}

        {!loading && error && (
          <section className="panel__state panel__state--error">
            <svg className="panel__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
              <p>
                <strong>Error al conectar:</strong> {error}
              </p>
              <button type="button" className="panel__button-retry" onClick={cargarDesembarques}>
                Reintentar
              </button>
              {(isNetworkError(error) || /VITE_API_URL/i.test(error)) && (
                <div className="panel__help" style={{ background: '#ffffff', color: '#0b1220' }}>
                  <div>Comprueba que el servicio JSON está levantado en tu máquina. Ejecuta en la carpeta del proyecto:</div>
                  <pre><code>{serverCommand}</code></pre>
                  <div>Además, asegúrate de configurar <code>VITE_API_URL</code> en <code>react/.env</code> como:</div>
                  <pre><code>{envInstructions}</code></pre>
                  <div>Después vuelve a cargar la página.</div>
                </div>
              )}
          </section>
        )}

        {!loading && !error && (
          <section className="panel__table-container">
            <ListaDesembarques resultados={resultados} onTogglePrioridad={togglePrioridad} />
          </section>
        )}
      </section>
    </main>
  )
}

export default App
