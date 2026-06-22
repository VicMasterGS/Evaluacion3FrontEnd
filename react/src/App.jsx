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

  useEffect(() => {
    setLoading(true)
    fetch('http://localhost:3001/desembarques')
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se pudo leer el servicio de desembarques')
        }
        return response.json()
      })
      .then((data) => {
        const listado = data.map((item) => ({ ...item, prioridad: false }))
        setDesembarques(listado)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
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
        <div className="panel__message">Cargando desembarques...</div>
      ) : error ? (
        <div className="panel__message panel__message--error">Error: {error}</div>
      ) : (
        <section className="panel__table-container">
          <ListaDesembarques resultados={resultados} onTogglePrioridad={togglePrioridad} />
        </section>
      )}
    </main>
  )
}

export default App
