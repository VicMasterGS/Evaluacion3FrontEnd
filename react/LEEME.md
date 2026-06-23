### PARA USAR: ###
cd react
npx json-server --watch db.json --port 3001

# Para usar la interfaz mejorada (se pueden usar las 2)
cd react
npm run dev

# Sugerencia por parte de Copilot:
de mejora: podrías considerar agregar propTypes para validar las props que recibe el componente FilaDesembarque, lo que ayudaría a prevenir errores y mejorar la mantenibilidad del código.
La descarte porque considero funcionamiento por encima de seguridad ademas que practicamente todo funciono hasta ahora, y no me gustaria jugarmela para que se rompa de nuevo el codigo de la aplicación, si fuera un sistema más serio con registros mas personales ahi si.


# R1. Identificación de elementos de React #
App (componente funcional):

Componente raíz de la aplicación.
Gestiona la carga de datos, el filtrado, el estado de prioridad y el renderizado de la UI.

ListaDesembarques (componente funcional):

Recibe resultados y onTogglePrioridad como props.
Renderiza la tabla de lotes y delega cada fila a FilaDesembarque.

FilaDesembarque (componente funcional):

Renderiza una fila de la tabla con los datos del desembarque.
Incluye botón para alternar prioridad y evita HTML no saneado usando contenido de texto.
useState

Manejan estados locales en App:
desembarques
filterText
filterTextError
filterEstado
loading
error

useEffect:

Ejecuta la carga inicial de datos al montar el componente.
Valida la configuración de VITE_API_URL y comprueba la disponibilidad del servicio antes de fetch.

useMemo:

Calcula los resultados filtrados (resultados) de forma eficiente.
Evita recalcular el filtro en cada render si los datos y filtros no cambiaron.

JSX:

Define la estructura de la UI con etiquetas como main, header, section, table, input, select, button, etc.
Usa renderizado condicional para mostrar carga, errores o la tabla.

Props:

App pasa resultados y onTogglePrioridad a ListaDesembarques.
ListaDesembarques pasa cada item y el manejador onTogglePrioridad a FilaDesembarque.

Inputs controlados:

El campo de búsqueda input y el selector select mantienen su valor en el estado React y aplican saneamiento/validación antes de usarlo.

## R7. Análisis con herramienta de IA ##
En FilaDesembarque de components tanto item como onTogglePrioridad estan marcados por sonarqube, indicando que falta la propiedad item en la validación de props de los componentes, faltando a la seguridad usando any. Considero que es opcional corregirlos ya que funcionan correctamente, aunque es una mala practica.