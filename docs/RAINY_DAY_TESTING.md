# Rainy-day testing

La suite protege la validez editorial de la campaña y la estabilidad del navegador,
especialmente en iPadOS.

## Matriz automatizada

| Escenario | Comportamiento esperado |
|---|---|
| Objetivo o CTA vacío | La exportación queda bloqueada |
| Fecha ausente o rango invertido | La exportación queda bloqueada |
| Foto vinculada a otro plato | La exportación del nuevo plato queda bloqueada |
| Borrador v3 | Se recupera sin sobrescribirlo automáticamente |
| JSON local corrupto | Se informa el error y se conserva el valor original |
| Cuota o read-back de almacenamiento fallido | Guardar muestra un error verificable |
| SVG, archivo vacío o imagen mayor de 15 MB | La carga se rechaza antes de decodificar |
| Más de 40 MP o 10 000 px por lado | La imagen decodificada se rechaza |
| Error del decodificador del navegador | Se libera el object URL y se informa al usuario |
| Cambio repetido de fotografía | La vista previa reemplaza el canvas de forma atómica |
| Exportación A3 | Usa una superficie (~66 MB), no dos (~133 MB) |
| Paquete de campaña | Incluye 1:1, 4:5, Story, Reel y A4; excluye A3 |
| Build de producción | La ruta principal responde HTML con identidad correcta |

## Pase manual recomendado en iPad

1. Completa una campaña con fechas válidas y fotografía JPEG.
2. Guarda, recarga la aplicación y confirma que los campos regresan, pero la foto debe
   vincularse nuevamente.
3. Cambia de Trucha a Pollo y confirma que la foto anterior ya no habilita exportación.
4. Intenta cargar SVG, archivo vacío y una foto mayor de 15 MB.
5. Genera el paquete y confirma cinco descargas: Feed 1:1, Post 4:5, Story, Reel y A4.
6. Exporta A3 por separado y confirma que Safari no recarga la pestaña por memoria.
7. Bloquea descargas múltiples en Safari y verifica que el aviso final pide comprobarlas.

## Límites conocidos

- La API web no confirma que una descarga terminó en disco; solo puede confirmar que el
  navegador aceptó la solicitud.
- JPEG, PNG y WebP son los formatos portables garantizados. HEIC debe convertirse desde
  Fotos cuando el selector no lo entregue como JPEG.
- Las fotografías no se persisten para evitar llenar `localStorage` y exponer imágenes
  privadas en un borrador compartido.
