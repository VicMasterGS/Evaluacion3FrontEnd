import { useEffect, useMemo, useState } from 'react'
import ListaDesembarques from './components/ListaDesembarques'
import './App.css'

const estados = ['todos', 'pendiente', 'procesado', 'rechazado']

function App() {
  const [desembarques, setDesembarques] = useState([])
  const [filterText, setFilterText] = useState('')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarDesembarques = async () => {
    setLoading(true)
    setError(null)
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
      const listado = data.map((item) => ({ ...item, prioridad: false }))
      setDesembarques(listado)
      setError(null)
    } catch (err) {
      setError(err.message || 'Error desconocido al conectar con el servicio')
      setDesembarques([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDesembarques()
  }, [])

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

  const togglePrioridad = (id) => {
    setDesembarques((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, prioridad: !item.prioridad } : item,
      ),
    )
  }

  const prioridadCount = desembarques.filter((item) => item.prioridad).length

  return (
    <main className="panel">
      <header className="panel__header">
        <div>
          <h1>Panel de Desembarques</h1>
          <p>Visor de lotes cargados desde el servicio de la empresa.</p>
        </div>
        <div className="panel__status">
          <strong>{desembarques.length}</strong> lotes cargados · <strong>{prioridadCount}</strong> prioritarios
        </div>
      </header>

      <section className="panel__filters">
        <label>
          Buscar especie, barco o fecha:
          <input
            type="search"
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
            placeholder="Ej. Jurel, Don Lorenzo, 2026-06-15"
          />
        </label>

        <label>
          Estado:
          <select value={filterEstado} onChange={(event) => setFilterEstado(event.target.value)}>
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado === 'todos' ? 'Todos' : estado}
              </option>
            ))}
          </select>
        </label>
      </section>

      {loading ? (
        <section className="panel__state panel__state--loading">
          <div className="panel__spinner"></div>
          <p>Cargando desembarques desde el servicio...</p>
        </section>
      ) : error ? (
        <section className="panel__state panel__state--error">
          <svg className="panel__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p><strong>Error al conectar:</strong> {error}</p>
          <button type="button" className="panel__button-retry" onClick={cargarDesembarques}>
            Reintentar
          </button>
        </section>
      ) : (
        <section className="panel__table-container">
          <ListaDesembarques resultados={resultados} onTogglePrioridad={togglePrioridad} />
        </section>
      )}
    </main>
  )
}

export default App
