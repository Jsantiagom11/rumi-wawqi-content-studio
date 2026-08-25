import assert from "node:assert/strict";
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
