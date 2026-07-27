import { anthropic, anthropicConfigured, AI_MODEL } from "../config/anthropic.js";
import { CATEGORIES, PRIORITIES } from "../models/Incident.js";
import { logger } from "../utils/logger.js";

const FALLBACK_ENRICHMENT = (title, description) => ({
  category: "otro",
  priority: "media",
  normalizedDescription: description,
  aiSummary: title,
});

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("La IA no devolvió un JSON válido");
  return JSON.parse(match[0]);
}

// Cubre clasificación + normalización + priorización en una sola llamada
export async function classifyAndEnrichIncident(title, description) {
  if (!anthropicConfigured) {
    logger.warn("ANTHROPIC_API_KEY no configurada, usando fallback determinista");
    return FALLBACK_ENRICHMENT(title, description);
  }

  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Sos un sistema de clasificación de incidentes urbanos para una ciudad de Argentina.

Dado el siguiente reporte ciudadano:
Título: "${title}"
Descripción original: "${description}"

Analizalo y respondé ÚNICAMENTE con un JSON con este formato exacto (sin markdown, sin explicaciones):
{"category": "CATEGORIA", "priority": "PRIORIDAD", "normalizedDescription": "descripción reescrita, clara y profesional, en 1-2 oraciones", "aiSummary": "resumen en una línea, máximo 15 palabras"}

Categorías posibles: ${CATEGORIES.join(", ")}
Prioridades posibles: ${PRIORITIES.join(", ")}

La prioridad "critica" es solo para riesgos inmediatos a la seguridad de las personas.`,
        },
      ],
    });

    const parsed = extractJson(response.content[0].text.trim());

    return {
      category: CATEGORIES.includes(parsed.category) ? parsed.category : "otro",
      priority: PRIORITIES.includes(parsed.priority) ? parsed.priority : "media",
      normalizedDescription: parsed.normalizedDescription || description,
      aiSummary: parsed.aiSummary || title,
    };
  } catch (err) {
    logger.error("Error en classifyAndEnrichIncident:", err.message);
    return FALLBACK_ENRICHMENT(title, description);
  }
}

// Compara un incidente nuevo contra candidatos cercanos (ya filtrados por geo+tiempo)
// para decidir si es un posible duplicado. Devuelve el _id del candidato o null.
export async function compareDuplicates(newIncident, candidates) {
  if (!anthropicConfigured || candidates.length === 0) return null;

  try {
    const list = candidates
      .map((c, i) => `${i}. [id:${c._id}] "${c.title}" — ${c.description}`)
      .join("\n");

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `Un ciudadano reportó este incidente urbano:
"${newIncident.title}" — ${newIncident.description}

Hay reportes cercanos (mismo radio y ventana de tiempo) que podrían ser el mismo problema:
${list}

¿Alguno de esos reportes describe el MISMO problema? Respondé ÚNICAMENTE con un JSON:
{"duplicateId": "id del candidato o null", "confidence": "alta|media|baja"}`,
        },
      ],
    });

    const parsed = extractJson(response.content[0].text.trim());
    if (parsed.duplicateId && parsed.duplicateId !== "null" && parsed.confidence !== "baja") {
      return parsed.duplicateId;
    }
    return null;
  } catch (err) {
    logger.error("Error en compareDuplicates:", err.message);
    return null;
  }
}

let insightsCache = { text: null, generatedAt: 0 };
const INSIGHTS_CACHE_MS = 10 * 60 * 1000;

// Genera insights en texto para el dashboard de admin. Cacheado ~10min.
export async function generateCityInsights(stats, recentIncidents) {
  const now = Date.now();
  if (insightsCache.text && now - insightsCache.generatedAt < INSIGHTS_CACHE_MS) {
    return insightsCache.text;
  }

  if (!anthropicConfigured) {
    return "Configurá ANTHROPIC_API_KEY para habilitar los insights automáticos de IA.";
  }

  try {
    const recentSummary = recentIncidents
      .slice(0, 15)
      .map((i) => `- [${i.category}/${i.priority}] ${i.title} (${i.status})`)
      .join("\n");

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 350,
      messages: [
        {
          role: "user",
          content: `Sos un analista para el equipo de gestión urbana de una ciudad. Con estos datos:

Estadísticas generales: ${JSON.stringify(stats)}

Incidentes recientes:
${recentSummary}

Escribí un resumen ejecutivo breve (máximo 4 oraciones) en español para un administrador de la ciudad, destacando tendencias, zonas o categorías problemáticas y prioridades de atención. Sin markdown, texto plano.`,
        },
      ],
    });

    const text = response.content[0].text.trim();
    insightsCache = { text, generatedAt: now };
    return text;
  } catch (err) {
    logger.error("Error en generateCityInsights:", err.message);
    return "No se pudieron generar los insights de IA en este momento.";
  }
}
