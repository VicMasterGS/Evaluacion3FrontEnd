import FilaDesembarque from './FilaDesembarque'

export default function ListaDesembarques({ resultados, onTogglePrioridad }) {
  if (resultados.length === 0) {
    return <div className="panel__message">No hay lotes que coincidan con el filtro.</div>
  }

  return (
    <table className="panel__table" style={{ color: '#0b1220' }}>
      <thead>
        <tr>
          <th>Prioridad</th>
          <th>ID</th>
          <th>Especie</th>
          <th>Embarcación</th>
          <th>Fecha</th>
          <th>Kilos</th>
          <th>Estado</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        {resultados.map((item) => (
          <FilaDesembarque
            key={item.id}
            item={item}
            onTogglePrioridad={onTogglePrioridad}
          />
        ))}
      </tbody>
    </table>
  )
}
