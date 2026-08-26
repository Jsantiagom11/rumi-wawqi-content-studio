export const STORAGE_KEY = "rumi-wawqi-studio-v4";
export const LEGACY_STORAGE_KEY = "rumi-wawqi-studio-v3";
export const STORAGE_SCHEMA = 4;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 40_000_000;
export const MAX_IMAGE_DIMENSION = 10_000;
export const ACCEPTED_IMAGE_TYPES = Object.freeze(["image/jpeg", "image/png", "image/webp"]);
export const CAMPAIGN_PACK_FORMATS = Object.freeze(["square", "post", "story", "reel", "a4"]);

const CAMPAIGNS = new Set(["weekend", "seasonal", "event", "product", "tourism", "community"]);
const TEMPLATES = new Set(["menu", "dish", "event", "visit", "hours"]);
const FORMATS = new Set(["square", "post", "story", "reel", "a4", "a3"]);
const PALETTES = new Set(["terracota", "piedra", "rio"]);
const DISHES = new Set(["tarwi", "chancho", "ceviche", "trucha", "pachamanca", "pollo", "lomo"]);

function requiredString(value, field, maxLength) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  if (value.length > maxLength) throw new Error(`${field} exceeds ${maxLength} characters`);
  return value;
}

function allowed(value, values, field) {
  if (typeof value !== "string" || !values.has(value)) throw new Error(`${field} is invalid`);
  return value;
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`));
}

export function validateCampaign(input) {
  const errors = [];
  if (!String(input.objective ?? "").trim()) errors.push("Define el objetivo de la campaña.");
  if (!String(input.cta ?? "").trim()) errors.push("Define la llamada a la acción.");
  if (!String(input.title ?? "").trim()) errors.push("Completa el título.");
  if (!String(input.subtitle ?? "").trim()) errors.push("Completa la descripción editorial.");
  if (!validDate(String(input.startDate ?? "")) || !validDate(String(input.endDate ?? ""))) {
    errors.push("Define una fecha de inicio y fin válidas.");
  } else if (input.startDate > input.endDate) {
    errors.push("La fecha de inicio no puede ser posterior a la fecha de fin.");
  }
  if (input.template === "dish" && input.photoDishId !== input.dishId) {
    errors.push("Carga una fotografía correspondiente al plato seleccionado.");
  }
  return errors;
}

export function serializeCampaign(input) {
  return {
    schemaVersion: STORAGE_SCHEMA,
    campaignId: allowed(input.campaignId, CAMPAIGNS, "campaignId"),
    objective: requiredString(input.objective, "objective", 70),
    cta: requiredString(input.cta, "cta", 38),
    startDate: typeof input.startDate === "string" ? input.startDate : "",
    endDate: typeof input.endDate === "string" ? input.endDate : "",
    template: allowed(input.template, TEMPLATES, "template"),
    format: allowed(input.format, FORMATS, "format"),
    paletteId: allowed(input.paletteId, PALETTES, "paletteId"),
    dishId: allowed(input.dishId, DISHES, "dishId"),
    title: requiredString(input.title, "title", 72),
    subtitle: requiredString(input.subtitle, "subtitle", 90),
    price: requiredString(input.price, "price", 32),
    details: requiredString(input.details, "details", 100),
  };
}

export function saveCampaign(storage, input) {
  const serialized = JSON.stringify(serializeCampaign(input));
  try {
    storage.setItem(STORAGE_KEY, serialized);
    if (storage.getItem(STORAGE_KEY) !== serialized) throw new Error("read-back mismatch");
  } catch (error) {
    throw new Error("No se pudo guardar la campaña en este dispositivo.", { cause: error });
  }
}

export function loadCampaign(storage) {
  const current = storage.getItem(STORAGE_KEY);
  const raw = current ?? storage.getItem(LEGACY_STORAGE_KEY);
  if (raw == null) return { campaign: null, error: null };
  try {
    const parsed = JSON.parse(raw);
    if (current !== null && parsed.schemaVersion !== STORAGE_SCHEMA) throw new Error("unsupported schema");
    return { campaign: serializeCampaign(parsed), error: null };
  } catch (error) {
    return {
      campaign: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function validateImageMetadata(file) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Usa una imagen JPEG, PNG o WebP.");
  }
  if (!Number.isFinite(file.size) || file.size <= 0) throw new Error("El archivo está vacío.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("La imagen supera el límite de 15 MB.");
}

export function validateDecodedImage(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error("No se pudieron leer las dimensiones de la imagen.");
  }
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION || width * height > MAX_IMAGE_PIXELS) {
    throw new Error("La imagen es demasiado grande; usa un máximo de 40 MP y 10 000 px por lado.");
  }
}

export function canvasBytes(width, height, surfaces = 1) {
  if (![width, height, surfaces].every(Number.isFinite) || width <= 0 || height <= 0 || surfaces <= 0) {
    throw new Error("canvas dimensions must be positive");
  }
  return width * height * 4 * surfaces;
}
