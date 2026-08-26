"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  CAMPAIGN_PACK_FORMATS,
  loadCampaign,
  saveCampaign,
  validateCampaign,
  validateDecodedImage,
  validateImageMetadata,
} from "./studio-core.mjs";

type TemplateId = "menu" | "dish" | "event" | "visit" | "hours";
type FormatId = "square" | "post" | "story" | "reel" | "a4" | "a3";
type PaletteId = "terracota" | "piedra" | "rio";
type Dish = { id: string; name: string; category: string; price: number; description: string; source: string };
type CampaignId = "weekend" | "seasonal" | "event" | "product" | "tourism" | "community";

const CAMPAIGNS: Record<CampaignId, { label: string; objective: string; title: string; subtitle: string; hook: string; detail: string; cta: string; template: TemplateId }> = {
  weekend: { label: "Tracción del fin de semana", objective: "Aumentar visitas y reservas", title: "Este fin de semana, escápate a Rumi Wawqi", subtitle: "Naturaleza, cocina campestre y tiempo para compartir", hook: "Caraz · Áncash", detail: "Sábado y domingo · Atención desde las 11:00 a. m.", cta: "Reserva por WhatsApp", template: "visit" },
  seasonal: { label: "Campaña estacional", objective: "Capturar demanda de una fecha o temporada", title: "Una temporada para volver a encontrarnos", subtitle: "Celebra esta fecha especial entre naturaleza", hook: "Edición temporal", detail: "Completa las fechas y condiciones antes de publicar", cta: "Consulta disponibilidad", template: "event" },
  event: { label: "Eventos y celebraciones", objective: "Generar consultas y reservas de eventos", title: "Tu celebración, entre naturaleza", subtitle: "Espacios para encuentros familiares y corporativos", hook: "Hasta 450 personas", detail: "Atención integral · Cocina · Espacios abiertos", cta: "Cotiza tu evento", template: "event" },
  product: { label: "Plato o propuesta destacada", objective: "Impulsar un producto concreto", title: "Trucha Frita Entera", subtitle: "Crujiente, fresca y servida al momento", hook: "S/ 35", detail: "Precio verificado en el catálogo operativo", cta: "Ven a probarla", template: "dish" },
  tourism: { label: "Destino y experiencia", objective: "Atraer público local y turístico", title: "Descubre Rumi Wawqi", subtitle: "Río, paisaje andino y cocina de nuestra tierra", hook: "Caraz · Áncash", detail: "Un lugar para comer, encontrarse y celebrar", cta: "Planifica tu visita", template: "visit" },
  community: { label: "Comunidad y recordación", objective: "Mantener presencia y vínculo con la audiencia", title: "Aquí se comparte más que la mesa", subtitle: "Historias, familia y sabores de nuestra tierra", hook: "Rumi Wawqi", detail: "Recreo campestre · Caraz, Áncash", cta: "Comparte tu experiencia", template: "visit" },
};

const DISHES: Dish[] = [
  { id: "tarwi", name: "Ensalada de Tarwi", category: "Entradas", price: 10, description: "Entrada fresca de la casa", source: "POS verificado" },
  { id: "chancho", name: "Chancho al Palo", category: "Fondos", price: 35, description: "Cocción lenta y sabor campestre", source: "POS verificado" },
  { id: "ceviche", name: "Ceviche de Trucha", category: "Fondos", price: 35, description: "Trucha fresca con preparación de la casa", source: "POS verificado" },
  { id: "trucha", name: "Trucha Frita Entera", category: "Fondos", price: 35, description: "Crujiente, fresca y servida al momento", source: "POS verificado" },
  { id: "pachamanca", name: "Pachamanca", category: "Fondos", price: 40, description: "Sabores tradicionales de nuestra tierra", source: "POS verificado" },
  { id: "pollo", name: "Pollo a la Plancha", category: "Fondos", price: 30, description: "Preparado al momento", source: "POS verificado" },
  { id: "lomo", name: "Lomo Saltado", category: "Fondos", price: 40, description: "Clásico peruano al wok", source: "POS verificado" },
];

const TEMPLATES: Array<[TemplateId, string, string]> = [
  ["menu", "Menú del fin de semana", "CARTA"], ["dish", "Plato destacado", "SABOR DE ÁNCASH"],
  ["event", "Eventos y celebraciones", "CELEBRA AQUÍ"], ["visit", "Ven y visita", "CARAZ · ÁNCASH"],
  ["hours", "Horario y ubicación", "TE ESPERAMOS"],
];

const FORMATS: Record<FormatId, { label: string; width: number; height: number }> = {
  square: { label: "Feed 1:1", width: 1080, height: 1080 }, post: { label: "Post 4:5", width: 1080, height: 1350 },
  story: { label: "Story 9:16", width: 1080, height: 1920 }, reel: { label: "Portada Reel", width: 1080, height: 1920 },
  a4: { label: "A4 impresión", width: 2480, height: 3508 }, a3: { label: "A3 impresión", width: 3508, height: 4961 },
};

const PALETTES: Record<PaletteId, { label: string; ink: string; accent: string; base: string; deep: string }> = {
  terracota: { label: "Terracota", ink: "#f7eddb", accent: "#de7b45", base: "#19362e", deep: "#0b201b" },
  piedra: { label: "Piedra", ink: "#f3efe5", accent: "#baa377", base: "#3b3d38", deep: "#20211e" },
  rio: { label: "Río", ink: "#eef3ed", accent: "#d99a4e", base: "#204b51", deep: "#0d292d" },
};

const DEFAULTS: Record<TemplateId, [string, string, string, string]> = {
  menu: ["Menú del fin de semana", "Cocina campestre para compartir", "Carta vigente", "Precios sincronizados con el catálogo"],
  dish: [DISHES[3].name, DISHES[3].description, `S/ ${DISHES[3].price}`, "Ficha vinculada al catálogo operativo"],
  event: ["Tu celebración, entre naturaleza", "Eventos familiares y corporativos", "Hasta 450 personas", "Espacios abiertos · Cocina · Atención integral"],
  visit: ["Ven y visita Rumi Wawqi", "Naturaleza, río y cocina de nuestra tierra", "Caraz · Áncash", "Un lugar para comer, encontrarse y celebrar"],
  hours: ["Este fin de semana te esperamos", "Sábado y domingo", "Desde las 11:00 a. m.", "Caraz, Áncash · Reservas por WhatsApp"],
};

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const lines: string[] = []; let line = "";
  for (const word of text.trim().split(/\s+/)) { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > max && line) { lines.push(line); line = word; } else line = test; }
  if (line) lines.push(line); return lines;
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("El navegador no pudo codificar la pieza como PNG."));
    }, "image/png");
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null); const imageRef = useRef<HTMLImageElement | null>(null);
  const [template, setTemplate] = useState<TemplateId>("dish"); const [format, setFormat] = useState<FormatId>("post");
  const [paletteId, setPaletteId] = useState<PaletteId>("terracota"); const [dishId, setDishId] = useState("trucha");
  const [campaignId, setCampaignId] = useState<CampaignId>("weekend"); const [objective, setObjective] = useState(CAMPAIGNS.weekend.objective); const [cta, setCta] = useState(CAMPAIGNS.weekend.cta); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState("");
  const [title, setTitle] = useState(DEFAULTS.dish[0]); const [subtitle, setSubtitle] = useState(DEFAULTS.dish[1]);
  const [price, setPrice] = useState(DEFAULTS.dish[2]); const [details, setDetails] = useState(DEFAULTS.dish[3]);
  const [photoName, setPhotoName] = useState("Falta fotografía real"); const [photoDishId, setPhotoDishId] = useState<string | null>(null); const [photoVersion, setPhotoVersion] = useState(0); const [notice, setNotice] = useState<string | null>(null); const [exporting, setExporting] = useState(false);
  const selectedDish = DISHES.find((d) => d.id === dishId) ?? DISHES[0];
  const campaignState = { campaignId, objective, cta, startDate, endDate, template, format, paletteId, dishId, title, subtitle, price, details, photoDishId };
  const campaignErrors = validateCampaign(campaignState);
  const photoRequired = template === "dish" && photoDishId !== dishId;

  const render = useCallback((output: FormatId, canvas: HTMLCanvasElement, atomic = true) => {
    const { width, height } = FORMATS[output]; const buffer = atomic ? document.createElement("canvas") : canvas; buffer.width = width; buffer.height = height; const ctx = buffer.getContext("2d"); if (!ctx) return;
    const p = PALETTES[paletteId], u = width / 1080, m = 76 * u, lower = Math.ceil(height * (output === "square" ? .49 : .56)), g = ctx.createLinearGradient(0, 0, width, height);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    g.addColorStop(0, p.base); g.addColorStop(1, p.deep); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
    if (imageRef.current) { const img = imageRef.current, s = Math.max(width / img.naturalWidth, lower / img.naturalHeight), dw = Math.ceil(img.naturalWidth * s), dh = Math.ceil(img.naturalHeight * s), dx = Math.floor((width - dw) / 2), dy = Math.floor((lower - dh) / 2); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, width, lower); ctx.clip(); ctx.drawImage(img, dx, dy, dw, dh); ctx.restore(); const o = ctx.createLinearGradient(0, 0, 0, lower); o.addColorStop(0, "rgba(7,22,18,.08)"); o.addColorStop(.68, "rgba(7,22,18,.22)"); o.addColorStop(1, p.deep); ctx.fillStyle = o; ctx.fillRect(0, 0, width, lower + Math.ceil(8 * u)); }
    else { ctx.globalAlpha = .13; ctx.strokeStyle = p.ink; ctx.lineWidth = 2 * u; for (let i = -2; i < 8; i++) { ctx.beginPath(); ctx.moveTo(-100 * u, (170 + i * 72) * u); ctx.bezierCurveTo(width * .28, (40 + i * 86) * u, width * .62, (300 + i * 48) * u, width + 80 * u, (120 + i * 76) * u); ctx.stroke(); } ctx.globalAlpha = 1; }
    ctx.fillStyle = p.accent; ctx.fillRect(m, 58 * u, 74 * u, 7 * u); ctx.fillStyle = p.ink; ctx.font = `600 ${24 * u}px Arial`; ctx.fillText(TEMPLATES.find((t) => t[0] === template)?.[2] ?? "RUMI WAWQI", m, 112 * u);
    let y = lower + 52 * u; ctx.font = `700 ${28 * u}px Georgia`; ctx.fillStyle = p.accent; ctx.fillText("RUMI WAWQI", m, y); ctx.font = `400 ${18 * u}px Arial`; ctx.fillStyle = p.ink; ctx.globalAlpha = .72; ctx.fillText("RECREO CAMPESTRE", m, y + 28 * u); ctx.globalAlpha = 1; y += 102 * u;
    const titleSize = output === "square" ? 61 : 74; ctx.font = `700 ${titleSize * u}px Georgia`; for (const line of wrap(ctx, title, width - m * 2).slice(0, 3)) { ctx.fillText(line, m, y); y += (titleSize + 8) * u; }
    y += 18 * u; ctx.font = `400 ${30 * u}px Arial`; ctx.globalAlpha = .82; for (const line of wrap(ctx, subtitle, width - m * 2).slice(0, 2)) { ctx.fillText(line, m, y); y += 39 * u; } ctx.globalAlpha = 1; y += 30 * u;
    ctx.fillStyle = p.accent; ctx.font = `700 ${46 * u}px Arial`; ctx.fillText(price, m, y); y += 56 * u; ctx.fillStyle = p.ink; ctx.font = `400 ${22 * u}px Arial`; ctx.globalAlpha = .7; wrap(ctx, details, width - m * 2).slice(0, 2).forEach((line, i) => ctx.fillText(line, m, y + i * 30 * u));
    const fy = height - 60 * u; ctx.globalAlpha = .82; ctx.font = `500 ${18 * u}px Arial`; ctx.fillText("CARAZ · ÁNCASH", m, fy); ctx.textAlign = "right"; ctx.fillText(cta.toUpperCase(), width - m, fy); ctx.textAlign = "left"; ctx.globalAlpha = 1;
    if (atomic) { canvas.width = width; canvas.height = height; const target = canvas.getContext("2d"); if (!target) return; target.globalCompositeOperation = "copy"; target.drawImage(buffer, 0, 0); target.globalCompositeOperation = "source-over"; }
  }, [cta, details, paletteId, price, subtitle, template, title]);

  useEffect(() => { if (canvasRef.current) render(format, canvasRef.current); }, [format, photoVersion, render]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const loaded = loadCampaign(localStorage);
      if (loaded.error) { setNotice("La campaña guardada está dañada o es incompatible; no fue sobrescrita."); return; }
      const saved = loaded.campaign;
      if (!saved) return;
      setCampaignId(saved.campaignId as CampaignId); setObjective(saved.objective); setCta(saved.cta); setStartDate(saved.startDate); setEndDate(saved.endDate);
      setTemplate(saved.template as TemplateId); setFormat(saved.format as FormatId); setPaletteId(saved.paletteId as PaletteId); setDishId(saved.dishId);
      setTitle(saved.title); setSubtitle(saved.subtitle); setPrice(saved.price); setDetails(saved.details);
      setNotice("Campaña guardada recuperada. Vuelve a vincular la fotografía antes de exportar.");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const applyTemplate = (id: TemplateId) => { setTemplate(id); const d = DEFAULTS[id]; setTitle(d[0]); setSubtitle(d[1]); setPrice(d[2]); setDetails(d[3]); setNotice(null); };
  const applyCampaign = (id: CampaignId) => { const c = CAMPAIGNS[id]; setCampaignId(id); setObjective(c.objective); setTitle(c.title); setSubtitle(c.subtitle); setPrice(c.hook); setDetails(c.detail); setCta(c.cta); setTemplate(c.template); setNotice("Estructura de campaña cargada. Ajusta fechas y contenido antes de publicar."); };
  const applyDish = (id: string) => { const d = DISHES.find((x) => x.id === id); if (!d) return; setDishId(id); setTemplate("dish"); setTitle(d.name); setSubtitle(d.description); setPrice(`S/ ${d.price}`); setDetails(`${d.category} · ${d.source}`); setNotice(photoDishId && photoDishId !== id ? "Plato cambiado: vincula su fotografía antes de exportar." : "Ficha cargada desde el catálogo verificado."); };
  const loadPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
    try { validateImageMetadata(file); } catch (error) { setNotice(error instanceof Error ? error.message : "Imagen no válida."); return; }
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => { try { validateDecodedImage(img.naturalWidth, img.naturalHeight); imageRef.current = img; setPhotoName(file.name); setPhotoDishId(dishId); setPhotoVersion((version) => version + 1); setNotice("Fotografía real vinculada a esta ficha."); } catch (error) { setNotice(error instanceof Error ? error.message : "Imagen no válida."); } finally { URL.revokeObjectURL(url); } };
    img.onerror = () => { URL.revokeObjectURL(url); setNotice("El navegador no pudo decodificar la imagen."); }; img.src = url;
  };
  const download = async (output: FormatId): Promise<boolean> => { const errors = validateCampaign(campaignState); if (errors.length) { setNotice(errors[0]); return false; } const canvas = document.createElement("canvas"); render(output, canvas, false); const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); try { const blob = await canvasToPng(canvas); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.download = `rumi-wawqi_${template}_${output}_${slug || "pieza"}.png`; a.href = url; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 10_000); return true; } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo exportar la pieza."); return false; } };
  const exportCurrent = async () => { if (exporting) return; setExporting(true); try { await download(format); } finally { setExporting(false); } };
  const exportPack = async () => { if (exporting) return; const errors = validateCampaign(campaignState); if (errors.length) { setNotice(errors[0]); return; } setExporting(true); setNotice("Generando campaña en secuencia…"); try { for (const output of CAMPAIGN_PACK_FORMATS as readonly FormatId[]) { if (!(await download(output))) return; await wait(650); } setNotice("Archivos solicitados: feed 1:1, post 4:5, story, portada de Reel y A4. Verifica las descargas del navegador."); } finally { setExporting(false); } };
  const save = () => { try { saveCampaign(localStorage, campaignState); setNotice("Campaña guardada en este dispositivo."); } catch (error) { setNotice(error instanceof Error ? error.message : "No se pudo guardar la campaña."); } };

  return <main className="app-shell">
    <header className="topbar"><div className="brand-lockup"><span className="brand-mark">RW</span><div><strong>Rumi Wawqi</strong><small>Estudio de campañas</small></div></div><div className="top-actions"><span className="status-dot">{exporting ? "Generando archivos…" : "Campaña activa"}</span><button className="button secondary" onClick={save} disabled={exporting}>Guardar</button><button className="button secondary" onClick={exportPack} disabled={exporting}>{exporting ? "Generando…" : "Generar campaña"}</button><button className="button primary" onClick={exportCurrent} disabled={exporting}>Exportar {FORMATS[format].label}</button></div></header>
    <div className="workspace">
      <aside className="panel editor-panel"><div className="panel-heading"><p>ESTRATEGIA</p><h1>Campaña y contenido</h1></div>
        <label className="field campaign-field"><span>Tipo de esfuerzo</span><select value={campaignId} onChange={(e) => applyCampaign(e.target.value as CampaignId)}>{Object.entries(CAMPAIGNS).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}</select><small>Define el objetivo y la estructura, no solo el diseño.</small></label>
        <label className="field"><span>Objetivo</span><input value={objective} maxLength={70} onChange={(e) => setObjective(e.target.value)} /></label>
        <div className="date-grid"><label className="field"><span>Inicio</span><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label><label className="field"><span>Fin</span><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label></div>
        <details className="optional-source"><summary>Vincular plato del catálogo <span>Opcional</span></summary><label className="field catalog-field"><select value={dishId} onChange={(e) => applyDish(e.target.value)}>{DISHES.map((d) => <option key={d.id} value={d.id}>{d.name} · S/ {d.price}</option>)}</select><small>Solo se usa cuando la campaña necesita un producto.</small></label></details>
        <label className="field"><span>Composición visual</span><select value={template} onChange={(e) => applyTemplate(e.target.value as TemplateId)}>{TEMPLATES.map((t) => <option key={t[0]} value={t[0]}>{t[1]}</option>)}</select></label>
        <label className="field"><span>Formato</span><select value={format} onChange={(e) => setFormat(e.target.value as FormatId)}>{Object.entries(FORMATS).map(([id, f]) => <option key={id} value={id}>{f.label} · {f.width}×{f.height}</option>)}</select></label>
        <label className="field"><span>Título</span><textarea rows={2} maxLength={72} value={title} onChange={(e) => setTitle(e.target.value)} /><em>{title.length}/72</em></label>
        <label className="field"><span>Descripción editorial</span><textarea rows={2} maxLength={90} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /><em>{subtitle.length}/90</em></label>
        <label className="field"><span>Precio / dato clave</span><input maxLength={32} value={price} disabled={template === "dish"} onChange={(e) => setPrice(e.target.value)} />{template === "dish" && <small className="locked">🔒 Controlado por el catálogo</small>}</label>
        <label className="field"><span>Detalle</span><input maxLength={100} value={details} onChange={(e) => setDetails(e.target.value)} /></label>
        <label className="field"><span>Llamada a la acción</span><input maxLength={38} value={cta} onChange={(e) => setCta(e.target.value)} /></label>
        <div className="field"><span>Fotografía real {template === "dish" ? "· obligatoria" : ""}</span><label className={`upload ${photoRequired ? "required" : ""}`}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={loadPhoto} /><b>＋</b><div><strong>Cargar fotografía</strong><small>{photoName}</small></div></label></div>
        <div className="field"><span>Paleta</span><div className="palette-list">{Object.entries(PALETTES).map(([id, p]) => <button aria-label={`Usar paleta ${p.label}`} key={id} className={`palette ${paletteId === id ? "active" : ""}`} onClick={() => setPaletteId(id as PaletteId)}><i style={{ background: p.base }} /><i style={{ background: p.accent }} /><small>{p.label}</small></button>)}</div></div>
      </aside>
      <section className="stage"><div className="stage-head"><div><p>VISTA PREVIA</p><strong>{FORMATS[format].label}</strong></div><span>{FORMATS[format].width} × {FORMATS[format].height} px</span></div><div className="canvas-frame"><canvas ref={canvasRef} aria-label="Vista previa de la pieza gráfica" /></div><p className="hint">Una ficha alimenta todas las salidas. La exportación conserva la resolución completa.</p></section>
      <aside className="panel inspector-panel"><div className="panel-heading"><p>PLAN DE CAMPAÑA</p><h2>Preparación de salida</h2></div>
        <div className={`quality-card ${campaignErrors.length ? "warning" : ""}`}><div className="quality-score">{campaignErrors.length ? "!" : "✓"}</div><div><strong>{campaignErrors.length ? "Pieza incompleta" : "Pieza lista"}</strong><small>{campaignErrors[0] ?? "Cumple las reglas activas."}</small></div></div>
        <div className="dish-card campaign-card"><span>CAMPAÑA ACTIVA</span><strong>{CAMPAIGNS[campaignId].label}</strong><dl><div><dt>Objetivo</dt><dd>{objective}</dd></div><div><dt>Vigencia</dt><dd>{startDate || endDate ? `${startDate || "—"} → ${endDate || "—"}` : "Por definir"}</dd></div><div><dt>CTA</dt><dd>{cta}</dd></div></dl></div>
        <div className="checks">{[["Objetivo", objective.trim() ? "Definido" : "Pendiente"], ["Temporalidad", startDate && endDate && startDate <= endDate ? "Definida" : "Pendiente"], ["Llamada a la acción", cta.trim() ? "Definida" : "Pendiente"], ["Fotografía", photoRequired ? "Pendiente" : "Correcta"]].map((x) => <div key={x[0]}><span>{x[1] === "Pendiente" ? "○" : "✓"}</span><p><strong>{x[0]}</strong><small>{x[1]}</small></p></div>)}</div>
        <div className="rule-card"><span>SISTEMA DE CAMPAÑA</span><p>Un mismo esfuerzo genera feed, story y pieza imprimible. El catálogo solo interviene cuando la campaña incluye un plato o precio.</p></div>
        <div className="format-card"><span>APOYO OPERATIVO</span><p className="catalog-count"><b>7</b> fichas verificadas</p><small>Plato vinculado actualmente: {selectedDish.name}. No limita las campañas institucionales, estacionales o de eventos.</small></div>
        {notice && <p className="notice" role="status">{notice}</p>}
      </aside>
    </div>
  </main>;
}
