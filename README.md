# Rumi Wawqi Content Studio

Motor web para diseñar campañas y exportar piezas gráficas consistentes para **Rumi Wawqi**, recreo campestre de Caraz, Áncash.

Convierte una ficha de campaña en salidas listas para redes sociales e impresión sin depender de una herramienta de diseño distinta para cada formato.

## Capacidades

- Campañas de fin de semana, temporada, eventos, productos, turismo y comunidad.
- Catálogo operativo de platos y precios verificados.
- Plantillas para menú, plato destacado, eventos, visitas y horarios.
- Formatos Feed 1:1, Post 4:5, Story 9:16, portada Reel, A4 y A3.
- Vista previa en `canvas` con fotografía real, paleta, jerarquía tipográfica y CTA.
- Exportación PNG individual o campaña completa.
- Validaciones de fotografía, temporalidad, objetivo y llamada a la acción.
- Persistencia local de la campaña en el navegador.

## Integridad de exportación

La campaña completa se codifica y descarga de forma secuencial. Cada PNG termina antes de iniciar el siguiente, evitando artefactos transparentes y desajustes por presión de memoria. El recorte fotográfico usa límites explícitos y coordenadas enteras para conservar bordes consistentes en resoluciones altas.

## Privacidad y datos públicos

Este repositorio contiene únicamente información comercial destinada a publicación, como identidad de marca, ubicación general, carta y precios. No deben versionarse teléfonos personales, correos privados, credenciales, rutas locales, datos de clientes, inventario interno ni métricas operativas no destinadas al público.

Las fotografías aportadas por el usuario se procesan localmente en el navegador y no se almacenan en un backend del proyecto.

## Stack

- TypeScript 5
- React 19
- Next.js 16 sobre Vinext/Vite
- Canvas API
- Cloudflare Workers
- Node.js 22+

## Desarrollo local

```bash
npm ci
npm run dev
```

## Validación

```bash
npm test
npm run lint
```

`npm test` ejecuta el build de producción y verifica la identidad y superficie principal renderizada.

## Flujo principal

1. Elegir el tipo de campaña.
2. Ajustar objetivo, vigencia, composición y contenido.
3. Vincular una fotografía real cuando la pieza incluye un plato.
4. Revisar el estado de preparación.
5. Exportar un formato o generar el paquete completo.

## Estado

MVP funcional desplegado y validado. La publicación operativa se gestiona mediante ChatGPT Sites; este repositorio mantiene el espejo público y auditable del código.

## Alcance y limitaciones

- Los datos se mantienen localmente en el navegador; todavía no hay colaboración multiusuario.
- Algunos navegadores solicitan permiso para descargar varios archivos al generar una campaña completa.
- Las fotografías son aportadas por el usuario y no se almacenan en un backend.
- El catálogo incluido es una base controlada y requiere sincronización manual cuando cambia la carta.

## Autor

Desarrollado por [Jorge Santiago](https://github.com/Jsantiagom11) para la operación y comunicación de Rumi Wawqi.
