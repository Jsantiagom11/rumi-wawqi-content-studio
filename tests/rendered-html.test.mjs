import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("renders production identity and campaign workspace", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<title>Rumi Wawqi Estudio Gráfico<\/title>/i);
  assert.match(html, /Generador de piezas gráficas consistentes para Rumi Wawqi\./i);
  assert.match(html, /Generar campaña/i);
  assert.match(html, /Vista previa de la pieza gráfica/i);
});

test("date controls remain inside the responsive editor grid", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(
    css,
    /\.date-grid\{[^}]*grid-template-columns:repeat\(auto-fit,minmax\(132px,1fr\)\)/,
  );
  assert.match(css, /\.date-grid input\[type=date\]\{[^}]*min-width:0/);
  assert.match(css, /\.date-grid input\[type=date\]\{[^}]*max-width:100%/);
});

test("canvas preview is replaced atomically after photo loading", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(source, /const buffer = document\.createElement\("canvas"\)/);
  assert.match(source, /target\.globalCompositeOperation = "copy"/);
  assert.match(source, /setPhotoVersion\(\(version\) => version \+ 1\)/);
  assert.doesNotMatch(
    source,
    /img\.onload = \(\) => \{[^}]*render\(format, canvasRef\.current\)/,
  );
});
