# Resultados de las pruebas de aceptación

Fecha: 5 de noviembre de 2026. Entorno: Google Chrome (headless, Linux) controlado con Playwright 1.63, servido con `python3 -m http.server` bajo las subrutas `/repositorio/mapa/` y `/sitio-67-mapa/` (la de este repositorio) para imitar GitHub Pages; 25/25 comprobaciones en ambas. Pruebas de unidad del modelo con `node --test` (7/7 aprobadas).

Cada caso se ejecutó en el navegador mediante interacción real (clics, arrastres, rueda, teclado, ventanas, archivos), no por revisión de código. Script: `pruebas/acceptance.mjs`.

| # | Comprobación | Resultado | Detalle medido |
|---|---|---|---|
| 1 | Cuatro plantas y 38 salas (10+10+10+8) | Aprobado | {"S":10,"N1":10,"N2":10,"N3":8} |
| 2 | Código, nombre y descripción literales; −3 = 301–307 y 310 | Aprobado | n3=301,302,303,304,305,306,307,310, discrepancias=0 |
| 3 | Armería 207 en −2 con su acceso | Aprobado |  |
| 4 | A/B en posición; PM, PT, E, C1/C2; escalera B y carga separadas | Aprobado | ["60","805"] |
| 5 | Planos completos, «pasillo de mantenimiento», sin spoilers | Aprobado |  |
| 6 | Selección por superficie interior | Aprobado | 307 · Cámara de contención / S01 · Control exterior |
| 7 | Capas alineadas con zoom, desplazamiento y redimensionado | Aprobado | d=0.00,0.00,0.00 rueda=0.18 |
| 8 | Transitable y contaminado a la vez; sin verificar ≠ bloqueado | Aprobado |  |
| 9 | Bloquear un tramo aislado; bloqueo libre movible y borrable | Aprobado | mov=(300,300)→(342.1,328.1) |
| 10 | Paso descubierto: añadir, ajustar, borrar | Aprobado |  |
| 11 | Beta-7 en sala, pasillo, patio y PM; no se transporta al consultar otra planta | Aprobado | Beta-7: Nivel −1 |
| 12 | Deshacer; no intercepta en texto; Escape cancela | Aprobado | undoCount 14/14 |
| 13 | Vista de jugadores con un clic; alternativa si se bloquea | Aprobado |  |
| 14 | Diez cambios sucesivos en la vista de jugadores | Aprobado | latencias ms: 6,3,6,3,10,3,3,58,62,5 |
| 15 | Ficha pública solo si se activa; legible a 1920 y 1366 | Aprobado | legendFits=true fullFits=true |
| 16 | Sin controles ni avisos internos en jugadores; pantalla completa | Aprobado | botones=btn-fullscreen fullscreen=true |
| 17 | Recargar y reabrir el navegador conserva la sesión | Aprobado |  |
| 18 | Exportar → modificar → importar; cancelar no cambia | Aprobado |  |
| 19 | Rechazo de JSON inválido; etiquetas como texto | Aprobado | true,true,true,true,true (corrupto, versión, ID desconocido, coordenadas, enumeración); `<script>`/`<img onerror>` mostrados como texto, sin ejecutarse |
| 20 | Fallo de almacenamiento y guardado dañado | Aprobado |  |
| 21 | Reinicio con confirmación; no toca otras claves | Aprobado |  |
| 22 | Subruta de proyecto sin errores ni servicios externos | Aprobado |  |
| 23 | Teclado, foco visible y estados sin depender del color | Aprobado | foco=S01 trazo=rgb(56, 225, 255) |
| 24 | README, créditos y resultados | Aprobado |  |

## Matices y lo que no se verificó

- **Navegadores:** solo Chrome. Firefox, Safari y Edge no se probaron; la app usa APIs estándar (módulos ES, `BroadcastChannel`, `localStorage`, `<dialog>`, Fullscreen API).
- **Bloqueo de ventanas (13):** se simuló forzando `window.open` a devolver `null`; no se probó con el bloqueador real de cada navegador.
- **Latencia (14):** medida desde que termina la acción del director hasta que la vista de jugadores muestra el cambio, en la misma máquina: 3–62 ms en la ejecución registrada (máximo ~75 ms en ejecuciones previas). No se midió dentro de una videollamada real.
- **Legibilidad (15):** comprobada por capturas a 1920 × 1080 y 1366 × 768 y por geometría (leyenda y ficha dentro de la ventana; plano completo sin recortar). No se evaluó con compresión de vídeo de Discord/Meet.
- **Pantalla completa (16):** funcionó en Chrome headless (el botón desaparece y reaparece al salir). La salida con la tecla Escape es nativa del navegador; se probó con `document.exitFullscreen()`.
- **Fallo de almacenamiento (20):** simulado haciendo que `localStorage.setItem` lance una excepción.
- **Publicación:** no se desplegó en GitHub Pages; la subruta se imitó en local. No hay URL publicada.
- **Accesibilidad:** navegación por teclado y foco comprobados; no se probó con lector de pantalla.
- **Móvil:** el diseño se adapta, pero no se probó en dispositivos táctiles.
