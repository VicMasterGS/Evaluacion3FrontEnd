export default function FilaDesembarque({ item, onTogglePrioridad }) {
  return (
    <tr className={item.prioridad ? 'panel__row--priority' : ''}>
      <td>{item.prioridad ? '⭐' : ''}</td>
      <td>{item.id}</td>
      <td>{item.especie}</td>
      <td>{item.embarcacion}</td>
      <td>{item.fecha}</td>
      <td>{item.kilos.toLocaleString('es-CL')}</td>
      <td>{item.estado}</td>
      <td>
        <button
          type="button"
          className="panel__button"
          onClick={() => onTogglePrioridad(item.id)}
        >
          {item.prioridad ? 'Quitar prioridad' : 'Marcar prioritario'}
        </button>
      </td>
    </tr>
  )
}
