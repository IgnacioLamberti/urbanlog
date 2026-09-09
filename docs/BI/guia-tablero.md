# Guía de construcción del tablero

Tres páginas, una por rol. El criterio de cada una es responder **una pregunta
concreta** que la aplicación no puede responder, no repetir lo que ya muestra.

Para crear una página: el **+** al lado de "Página 1", abajo. Para renombrarla:
doble clic sobre la pestaña.

---

## Ajustes previos (una sola vez)

**Ordenar la prioridad por urgencia y no alfabéticamente**
Panel Datos → columna `Prioridad` de `DIM_Prioridad` → cinta *Herramientas de
columnas* → **Ordenar por columna** → `Nivel`.

**Lo mismo con el estado**
Columna `Estado` de `DIM_Estado` → Ordenar por columna → `Orden`.

**Marcar la tabla de fechas** (necesario para las medidas de tiempo)
Panel Datos → clic derecho sobre `DIM_Calendario` → **Marcar como tabla de
fechas** → columna `FechaKey`.

**Categorizar las coordenadas** (necesario para el mapa)
Columna `Latitud` → *Herramientas de columnas* → Categoría de datos → **Latitud**.
Repetir con `Longitud` → **Longitud**.

---

## Página 1 · Operador

> **Pregunta que responde:** ¿sobre qué tengo que trabajar ahora y en qué orden?

| Visual | Tipo | Campos |
|---|---|---|
| Tarjetas (4) | Tarjeta | `Incidentes Abiertos`, `Incidentes En Proceso`, `Críticos Sin Resolver`, `Horas Promedio hasta Atención` |
| Mapa de pendientes | Mapa | Latitud, Longitud; Leyenda: `Prioridad`; Tamaño: `Total Incidentes` |
| Pendientes por categoría | Barras agrupadas | Eje: `Categoria`; Valor: `Total Incidentes`; Leyenda: `Prioridad` |
| Cola de trabajo | Tabla | `Titulo`, `Direccion`, `Prioridad`, `FechaCreacion`, `CantidadReportes` |

**Filtros de página** (arrastrar al panel Filtros → "Filtros en esta página"):
`Estado`, `Prioridad`, `Categoria`, `Zona`.

**Filtro fijo importante:** en el panel Filtros agregá `Estado` y dejá
seleccionados solo `Abierto` y `En Proceso`. Un operador no necesita ver lo ya
resuelto.

**Detalle que aporta valor:** ordená la tabla por `FechaCreacion` ascendente.
Así lo más viejo queda arriba y se ven los reportes que quedaron olvidados.

---

## Página 2 · Moderador

> **Pregunta que responde:** ¿funciona bien la detección de duplicados y dónde
> se concentran?

| Visual | Tipo | Campos |
|---|---|---|
| Tarjetas (3) | Tarjeta | `Total Incidentes`, `Incidentes Únicos`, `Tasa de Duplicación` |
| Distribución de reportes | Columnas agrupadas | Eje: `TramoReportes`; Valor: `Total Incidentes` |
| Duplicados por categoría | Barras apiladas | Eje: `Categoria`; Valor: `Total Incidentes`; Leyenda: `EsDuplicado` |
| Concentración geográfica | Mapa | Lat/Long; Tamaño: `Total Incidentes`; Leyenda: `EsDuplicado` |
| Los más reportados | Tabla | `Titulo`, `Categoria`, `Prioridad`, `CantidadReportes` — filtrada a `CantidadReportes >= 4`, ordenada descendente |

**La comparación que importa:** las tarjetas de `Total Incidentes` (533) contra
`Incidentes Únicos` (306) muestran de un vistazo que el municipio recibe un 74%
más de reportes que problemas reales tiene para resolver.

---

## Página 3 · Administrador

> **Pregunta que responde:** ¿cómo evoluciona la ciudad y dónde conviene poner
> recursos?

| Visual | Tipo | Campos |
|---|---|---|
| Tarjetas (4) | Tarjeta | `Tasa de Resolución`, `Días Promedio hasta Resolución`, `Variación Mensual %`, `Incidentes Incoherentes` |
| Creados vs resueltos | Líneas | Eje: `AnioMes`; Valores: `Total Incidentes` y `Incidentes Resueltos` |
| Tasa de resolución por categoría | Barras | Eje: `Categoria`; Valor: `Tasa de Resolución` |
| Tiempos por prioridad | Columnas | Eje: `Prioridad`; Valor: `Horas Promedio hasta Resolución` |
| **Análisis de prioridad** | Dispersión | Eje X: `Nivel`; Eje Y: `Reportes Promedio por Incidente`; Detalles: `Categoria`; Tamaño: `Total Incidentes` |
| Mapa de calor | Mapa | Lat/Long; Tamaño: `Total Incidentes`; Leyenda: `Zona` |

**Filtros de página:** `AnioMes`, `Zona`, `Categoria`.

**El detalle que cierra el análisis:** poné como título del gráfico de
dispersión la medida `Título Análisis Prioridad`. Formato → Título → activá
`fx` → *Basado en el campo* → elegí esa medida. El título va a mostrar la
correlación calculada y su interpretación, y se recalcula solo al filtrar.

---

## Hallazgos que el tablero debería dejar ver

Estos son los que sostienen las conclusiones del informe. Si alguno no se ve,
revisá el visual correspondiente.

1. **La correlación entre prioridad y cantidad de reportes es nula** (r = 0,026).
2. **La relación es inversa en los extremos:** residuos promedia 2,41 reportes y
   es la categoría menos urgente; seguridad promedia 1,43 y es la más crítica.
3. **Lo más reclamado es lo menos resuelto:** residuos tiene 111 incidentes y
   solo 14% de resolución, contra 37% en seguridad.
4. **La prioridad sí ordena la operación:** los tiempos de resolución crecen de
   37 h en críticos a 319 h en prioridad baja.
5. **El 60% permanece abierto**, lo que indica que la capacidad de resolución no
   acompaña el volumen de ingreso.

---

## Al terminar

Guardá el archivo como `UrbanLog.pbix` dentro de la carpeta compartida
(`UrbanLog-BI`), para que quede accesible desde macOS y se pueda versionar
junto al resto del proyecto.
