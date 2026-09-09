// ═══════════════════════════════════════════════════════════════════════════
// UrbanLog — Consultas de Power Query (lenguaje M)
//
// CÓMO USARLO
// 1. En Power BI Desktop: Inicio → Transformar datos → abre el editor.
// 2. Antes que nada creá los DOS PARÁMETROS (Inicio → Administrar parámetros):
//       BaseUrl  (Texto)  = https://urbanlog-api.onrender.com
//       ApiKey   (Texto)  = la clave del scope público (backend/.env → PUBLIC_API_KEY)
//    Se usan parámetros y no valores fijos para no dejar la credencial escrita
//    dentro del archivo .pbix.
// 3. Para cada bloque de abajo: Inicio → Nueva consulta → Consulta en blanco →
//    Editor avanzado → pegar el bloque → renombrar la consulta con el nombre
//    indicado en el título.
// 4. Al primer refresco Power BI va a preguntar el tipo de autenticación:
//    elegí ANÓNIMO. La clave viaja en el encabezado, no en la autenticación.
// ═══════════════════════════════════════════════════════════════════════════


// ───────────────────────────────────────────────────────────────────────────
// CONSULTA 1 · FACT_Incidentes
// Tabla de hechos principal: un incidente por fila.
// ───────────────────────────────────────────────────────────────────────────
let
    // RelativePath y Query se separan de la URL base a propósito: si se
    // concatenara todo en un solo texto, Power BI lo trataría como origen
    // dinámico y bloquearía la actualización programada.
    Origen = Json.Document(
        Web.Contents(
            BaseUrl,
            [
                RelativePath = "api/public/v1/incidents",
                Query        = [ limit = "1000" ],
                Headers      = [ #"x-api-key" = ApiKey ]
            ]
        )
    ),

    Datos      = Origen[data],
    ATabla     = Table.FromList(Datos, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    Expandida  = Table.ExpandRecordColumn(
        ATabla, "Column1",
        {
            "id", "title", "category", "priority", "status",
            "address", "latitude", "longitude",
            "duplicateOfId", "isDuplicate", "reportCount",
            "createdAt", "inProgressAt", "resolvedAt",
            "hoursToFirstResponse", "hoursToResolution",
            "isResolved", "hasImages"
        },
        {
            "IncidenteID", "Titulo", "CategoriaKey", "PrioridadKey", "EstadoKey",
            "Direccion", "Latitud", "Longitud",
            "DuplicadoDeID", "EsDuplicado", "CantidadReportes",
            "FechaCreacion", "FechaAtencion", "FechaResolucion",
            "HorasHastaAtencion", "HorasHastaResolucion",
            "EstaResuelto", "TieneImagenes"
        }
    ),

    // Las fechas llegan como texto ISO 8601 en UTC.
    Tipos = Table.TransformColumnTypes(
        Expandida,
        {
            {"IncidenteID", type text}, {"Titulo", type text},
            {"CategoriaKey", type text}, {"PrioridadKey", type text}, {"EstadoKey", type text},
            {"Direccion", type text},
            {"Latitud", type number}, {"Longitud", type number},
            {"DuplicadoDeID", type text}, {"EsDuplicado", type logical},
            {"CantidadReportes", Int64.Type},
            {"FechaCreacion", type datetimezone},
            {"FechaAtencion", type datetimezone},
            {"FechaResolucion", type datetimezone},
            {"HorasHastaAtencion", type number}, {"HorasHastaResolucion", type number},
            {"EstaResuelto", type logical}, {"TieneImagenes", type logical}
        }
    ),

    // Se pasa a hora local para que los análisis por día y mes no queden
    // corridos respecto del huso de Argentina.
    ALocal = Table.TransformColumns(
        Tipos,
        {
            {"FechaCreacion",   each DateTimeZone.ToLocal(_), type datetime},
            {"FechaAtencion",   each if _ = null then null else DateTimeZone.ToLocal(_), type datetime},
            {"FechaResolucion", each if _ = null then null else DateTimeZone.ToLocal(_), type datetime}
        }
    ),

    // Clave hacia DIM_Calendario.
    ConFecha = Table.AddColumn(ALocal, "FechaKey", each DateTime.Date([FechaCreacion]), type date),

    // El barrio viene embebido en la dirección con el formato
    // "Calle 123, Barrio, Ciudad": se extrae el segundo segmento.
    ConBarrio = Table.AddColumn(
        ConFecha, "Barrio",
        each let partes = Text.Split([Direccion], ", ")
             in  if List.Count(partes) >= 2 then Text.Trim(partes{1}) else "Sin especificar",
        type text
    ),

    // Agrupar la cantidad de reportes en tramos evita que el gráfico del
    // análisis de prioridad quede dominado por los casos de un solo reporte.
    ConTramo = Table.AddColumn(
        ConBarrio, "TramoReportes",
        each if [CantidadReportes] = 1 then "1 reporte"
             else if [CantidadReportes] <= 3 then "2 a 3"
             else if [CantidadReportes] <= 5 then "4 a 5"
             else "6 o más",
        type text
    ),

    Final = Table.SelectColumns(ConTramo, {
        "IncidenteID", "Titulo", "CategoriaKey", "PrioridadKey", "EstadoKey",
        "Direccion", "Barrio", "Latitud", "Longitud",
        "DuplicadoDeID", "EsDuplicado", "CantidadReportes", "TramoReportes",
        "FechaCreacion", "FechaKey", "FechaAtencion", "FechaResolucion",
        "HorasHastaAtencion", "HorasHastaResolucion", "EstaResuelto", "TieneImagenes"
    })
in
    Final


// ───────────────────────────────────────────────────────────────────────────
// CONSULTA 2 · FACT_CambiosEstado
// Segunda tabla de hechos: una fila por transición de estado.
// ───────────────────────────────────────────────────────────────────────────
let
    Origen = Json.Document(
        Web.Contents(
            BaseUrl,
            [
                RelativePath = "api/public/v1/status-changes",
                Headers      = [ #"x-api-key" = ApiKey ]
            ]
        )
    ),

    Datos     = Origen[data],
    ATabla    = Table.FromList(Datos, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    Expandida = Table.ExpandRecordColumn(
        ATabla, "Column1",
        {"incidentId", "sequence", "fromStatus", "toStatus", "changedAt", "category", "priority", "hoursSinceCreated"},
        {"IncidenteID", "Secuencia", "EstadoOrigen", "EstadoDestino", "FechaCambio", "CategoriaKey", "PrioridadKey", "HorasDesdeCreacion"}
    ),

    Tipos = Table.TransformColumnTypes(
        Expandida,
        {
            {"IncidenteID", type text}, {"Secuencia", Int64.Type},
            {"EstadoOrigen", type text}, {"EstadoDestino", type text},
            {"FechaCambio", type datetimezone},
            {"CategoriaKey", type text}, {"PrioridadKey", type text},
            {"HorasDesdeCreacion", type number}
        }
    ),

    ALocal   = Table.TransformColumns(Tipos, {{"FechaCambio", each DateTimeZone.ToLocal(_), type datetime}}),
    ConFecha = Table.AddColumn(ALocal, "FechaKey", each DateTime.Date([FechaCambio]), type date)
in
    ConFecha


// ───────────────────────────────────────────────────────────────────────────
// CONSULTA 3 · DIM_Categoria
// ───────────────────────────────────────────────────────────────────────────
let
    Origen = Json.Document(
        Web.Contents(
            BaseUrl,
            [
                RelativePath = "api/public/v1/catalogs",
                Headers      = [ #"x-api-key" = ApiKey ]
            ]
        )
    ),

    Datos     = Origen[data][categories],
    ATabla    = Table.FromList(Datos, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    Expandida = Table.ExpandRecordColumn(ATabla, "Column1", {"key", "label"}, {"CategoriaKey", "Categoria"}),
    Tipos     = Table.TransformColumnTypes(Expandida, {{"CategoriaKey", type text}, {"Categoria", type text}})
in
    Tipos


// ───────────────────────────────────────────────────────────────────────────
// CONSULTA 4 · DIM_Prioridad
// Incluye un nivel numérico para poder ordenar de menor a mayor urgencia.
// ───────────────────────────────────────────────────────────────────────────
let
    Origen = Json.Document(
        Web.Contents(
            BaseUrl,
            [
                RelativePath = "api/public/v1/catalogs",
                Headers      = [ #"x-api-key" = ApiKey ]
            ]
        )
    ),

    Datos     = Origen[data][priorities],
    ATabla    = Table.FromList(Datos, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    Expandida = Table.ExpandRecordColumn(ATabla, "Column1", {"key", "label", "level"}, {"PrioridadKey", "Prioridad", "Nivel"}),
    Tipos     = Table.TransformColumnTypes(Expandida, {{"PrioridadKey", type text}, {"Prioridad", type text}, {"Nivel", Int64.Type}})
in
    Tipos


// ───────────────────────────────────────────────────────────────────────────
// CONSULTA 5 · DIM_Estado
// ───────────────────────────────────────────────────────────────────────────
let
    Origen = Json.Document(
        Web.Contents(
            BaseUrl,
            [
                RelativePath = "api/public/v1/catalogs",
                Headers      = [ #"x-api-key" = ApiKey ]
            ]
        )
    ),

    Datos     = Origen[data][statuses],
    ATabla    = Table.FromList(Datos, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    Expandida = Table.ExpandRecordColumn(ATabla, "Column1", {"key", "label", "order"}, {"EstadoKey", "Estado", "Orden"}),
    Tipos     = Table.TransformColumnTypes(Expandida, {{"EstadoKey", type text}, {"Estado", type text}, {"Orden", Int64.Type}})
in
    Tipos


// ───────────────────────────────────────────────────────────────────────────
// CONSULTA 6 · MAP_Duplicados
// Resuelve qué reportes corresponden al mismo problema físico.
//
// Por qué existe esta tabla: Power BI no admite una relación activa de una
// tabla consigo misma, que es lo que haría falta para vincular un incidente
// con su original. Extraer esa correspondencia a una tabla aparte es la forma
// habitual de resolverlo.
//
// Se construye como REFERENCIA de FACT_Incidentes (clic derecho sobre esa
// consulta → Referencia), para no volver a pedir los datos a la API.
// ───────────────────────────────────────────────────────────────────────────
let
    Origen     = FACT_Incidentes,
    SoloDups   = Table.SelectRows(Origen, each [EsDuplicado] = true),
    Columnas   = Table.SelectColumns(SoloDups, {"IncidenteID", "DuplicadoDeID"}),
    Renombrada = Table.RenameColumns(Columnas, {{"DuplicadoDeID", "IncidenteOriginalID"}})
in
    Renombrada


// ───────────────────────────────────────────────────────────────────────────
// CONSULTA 7 · MAP_Barrio
// Agrupa los barrios en zonas de la ciudad. Permite analizar a un nivel
// geográfico más alto que el barrio individual, sin depender de que la API
// devuelva esa clasificación.
//
// Es una tabla escrita a mano: si mañana se incorporan barrios nuevos, hay que
// agregarlos acá. Se documenta como una limitación conocida del modelo.
// ───────────────────────────────────────────────────────────────────────────
let
    Origen = Table.FromRows(
        {
            {"Centro",              "Centro"},
            {"Barrio Belgrano",     "Norte"},
            {"Barrio Las Playas",   "Norte"},
            {"Barrio Rivadavia",    "Norte"},
            {"Barrio San Nicolás",  "Sur"},
            {"Villa Nueva",         "Sur"},
            {"Barrio Palermo",      "Sur"},
            {"Barrio Industrial",   "Sur"},
            {"Sin especificar",     "Sin clasificar"}
        },
        {"Barrio", "Zona"}
    ),
    Tipos = Table.TransformColumnTypes(Origen, {{"Barrio", type text}, {"Zona", type text}})
in
    Tipos


// ───────────────────────────────────────────────────────────────────────────
// CONSULTA 8 · DIM_Calendario
// Se genera localmente, no viene de la API: es la práctica habitual para la
// dimensión de tiempo, porque debe ser continua aunque no haya incidentes
// todos los días.
// ───────────────────────────────────────────────────────────────────────────
let
    // Se apoya en el rango real de los datos para no inventar períodos vacíos.
    FechaMin = List.Min(FACT_Incidentes[FechaKey]),
    FechaMax = List.Max(FACT_Incidentes[FechaKey]),
    Dias     = Duration.Days(FechaMax - FechaMin) + 1,
    Lista    = List.Dates(FechaMin, Dias, #duration(1, 0, 0, 0)),

    ATabla = Table.FromList(Lista, Splitter.SplitByNothing(), {"FechaKey"}, null, ExtraValues.Error),
    Tipos  = Table.TransformColumnTypes(ATabla, {{"FechaKey", type date}}),

    NombresMes = {"Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"},
    NombresDia = {"Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"},

    Ampliada =
        Table.AddColumn(
        Table.AddColumn(
        Table.AddColumn(
        Table.AddColumn(
        Table.AddColumn(
        Table.AddColumn(
        Table.AddColumn(Tipos,
            "Anio",        each Date.Year([FechaKey]), Int64.Type),
            "NumeroMes",   each Date.Month([FechaKey]), Int64.Type),
            "Mes",         each NombresMes{Date.Month([FechaKey]) - 1}, type text),
            "AnioMes",     each Date.ToText([FechaKey], "yyyy-MM"), type text),
            "Trimestre",   each "T" & Text.From(Date.QuarterOfYear([FechaKey])), type text),
            "DiaSemana",   each NombresDia{Date.DayOfWeek([FechaKey], Day.Monday)}, type text),
            "EsFinDeSemana", each Date.DayOfWeek([FechaKey], Day.Monday) >= 5, type logical)
in
    Ampliada
