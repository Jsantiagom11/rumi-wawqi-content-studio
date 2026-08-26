import assert from "node:assert/strict";
import test from "node:test";

import {
  CAMPAIGN_PACK_FORMATS,
  LEGACY_STORAGE_KEY,
  MAX_IMAGE_BYTES,
  STORAGE_KEY,
  canvasBytes,
  loadCampaign,
  saveCampaign,
  validateCampaign,
  validateDecodedImage,
  validateImageMetadata,
} from "../app/studio-core.mjs";

class MemoryStorage {
  constructor(initial = {}) { this.values = new Map(Object.entries(initial)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

function campaign(overrides = {}) {
  return {
    campaignId: "product",
    objective: "Promocionar un plato",
    cta: "Reserva por WhatsApp",
    startDate: "2026-08-27",
    endDate: "2026-08-30",
    template: "dish",
    format: "post",
    paletteId: "terracota",
    dishId: "trucha",
    title: "Trucha Frita Entera",
    subtitle: "Crujiente y servida al momento",
    price: "S/ 35",
    details: "Ficha de campaña",
    photoDishId: "trucha",
    ...overrides,
  };
}

test("complete campaign passes editorial validation", () => {
  assert.deepEqual(validateCampaign(campaign()), []);
});

test("missing objective, CTA and dates all block export", () => {
  const errors = validateCampaign(campaign({ objective: " ", cta: "", startDate: "", endDate: "" }));
  assert.equal(errors.length, 3);
  assert.match(errors.join(" "), /objetivo/);
  assert.match(errors.join(" "), /llamada/);
  assert.match(errors.join(" "), /fecha/);
});

test("inverted campaign dates are rejected", () => {
  assert.match(
    validateCampaign(campaign({ startDate: "2026-09-01", endDate: "2026-08-01" }))[0],
    /posterior/,
  );
});

test("dish photo belongs to the selected dish", () => {
  assert.match(validateCampaign(campaign({ photoDishId: "pollo" }))[0], /plato seleccionado/);
  assert.deepEqual(validateCampaign(campaign({ template: "event", photoDishId: null })), []);
});

test("save performs read-back and load restores validated fields", () => {
  const storage = new MemoryStorage();
  saveCampaign(storage, campaign());
  const result = loadCampaign(storage);
  assert.equal(result.error, null);
  assert.equal(result.campaign.title, "Trucha Frita Entera");
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).schemaVersion, 4);
  assert.equal("photoDishId" in result.campaign, false, "photos are intentionally not persisted");
});

test("legacy v3 draft loads without destructive overwrite", () => {
  const legacy = campaign(); delete legacy.photoDishId;
  const storage = new MemoryStorage({ [LEGACY_STORAGE_KEY]: JSON.stringify(legacy) });
  const result = loadCampaign(storage);
  assert.equal(result.campaign.dishId, "trucha");
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test("corrupt saved JSON is reported and preserved", () => {
  const storage = new MemoryStorage({ [STORAGE_KEY]: "{broken" });
  const result = loadCampaign(storage);
  assert.equal(result.campaign, null);
  assert.ok(result.error);
  assert.equal(storage.getItem(STORAGE_KEY), "{broken");
});

test("quota and read-back failures surface as save errors", () => {
  const quota = new MemoryStorage();
  quota.setItem = () => { throw new Error("quota"); };
  assert.throws(() => saveCampaign(quota, campaign()), /No se pudo guardar/);

  const mismatch = new MemoryStorage();
  mismatch.getItem = () => "different";
  assert.throws(() => saveCampaign(mismatch, campaign()), /No se pudo guardar/);
});

test("image metadata rejects unsupported, empty and oversized files", () => {
  assert.throws(() => validateImageMetadata({ type: "image/svg+xml", size: 100 }), /JPEG/);
  assert.throws(() => validateImageMetadata({ type: "image/jpeg", size: 0 }), /vacío/);
  assert.throws(
    () => validateImageMetadata({ type: "image/png", size: MAX_IMAGE_BYTES + 1 }),
    /15 MB/,
  );
  assert.doesNotThrow(() => validateImageMetadata({ type: "image/webp", size: 1024 }));
});

test("decoded-image limits protect the iPad memory budget", () => {
  assert.doesNotThrow(() => validateDecodedImage(6000, 6000));
  assert.throws(() => validateDecodedImage(10_001, 100), /demasiado grande/);
  assert.throws(() => validateDecodedImage(8000, 6000), /demasiado grande/);
});

test("campaign pack includes 4:5 but excludes high-memory A3", () => {
  assert.deepEqual(CAMPAIGN_PACK_FORMATS, ["square", "post", "story", "reel", "a4"]);
  assert.ok(!CAMPAIGN_PACK_FORMATS.includes("a3"));
});

test("direct A3 rendering halves the prior two-surface canvas allocation", () => {
  const oneSurface = canvasBytes(3508, 4961);
  assert.ok(oneSurface < 70 * 1024 * 1024);
  assert.equal(canvasBytes(3508, 4961, 2), oneSurface * 2);
});
