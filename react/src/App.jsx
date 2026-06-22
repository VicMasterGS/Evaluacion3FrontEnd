import { useEffect, useMemo, useState } from 'react'
import ListaDesembarques from './components/ListaDesembarques'
import './App.css'

const estados = ['todos', 'pendiente', 'procesado', 'rechazado']

const STORAGE_KEY = 'desembarques-prioridad'

function App() {
  const [desembarques, setDesembarques] = useState([])
  const [filterText, setFilterText] = useState('')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarDesembarques = async () => {
    setLoading(true)
    setError(null)

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
      const response = await fetch('http://localhost:3001/desembarques')
      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? 'Recurso no encontrado en el servicio'
            : `Error ${response.status}: No se pudo leer el servicio de desembarques`
        )
      }
      const data = await response.json()
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
      // small request to validate service availability
      const res = await fetch('http://localhost:3001/desembarques?_limit=1', { signal: controller.signal })
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
  const isNetworkError = (msg) => {
    if (!msg) return false
    return /failed to fetch/i.test(msg) || /network/i.test(msg)
  }

  const resultados = useMemo(() => {
    return desembarques.filter((item) => {
      const texto = filterText.trim().toLowerCase()
      const matchesText =
        item.especie.toLowerCase().includes(texto) ||
        item.embarcacion.toLowerCase().includes(texto) ||
        item.fecha.includes(texto)
      const matchesEstado = filterEstado === 'todos' || item.estado === filterEstado
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
          Buscar especie, barco o fecha:
        </label>
        <input
          id="search-desembarques"
          type="search"
          value={filterText}
          onChange={(event) => setFilterText(event.target.value)}
          placeholder="Ej. Jurel, Don Lorenzo, 2026-06-15"
          style={{ color: '#0b1220' }}
        />

        <label htmlFor="estado-desembarques" style={{ color: '#0b1220' }}>Estado:</label>
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
              {isNetworkError(error) && (
                <div className="panel__help" style={{ background: '#ffffff', color: '#0b1220' }}>
                  <div>Comprueba que el servicio JSON está levantado en tu máquina. Ejecuta en la carpeta del proyecto:</div>
                  <pre><code>{serverCommand}</code></pre>
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
