# Resultados de las pruebas de aceptación

Fecha: 5 de noviembre de 2026; repetidas el 7 de noviembre de 2026 tras el rediseño táctico y la integración de escenarios (25/25 de nuevo, más 16/16 de `pruebas/tactico.mjs` y 13/13 pruebas de unidad tras el modo transmisión). Entorno: Google Chrome (headless, Linux) controlado con Playwright 1.63, servido con `python3 -m http.server` bajo las subrutas `/repositorio/mapa/` y `/sitio-67-mapa/` (la de este repositorio) para imitar GitHub Pages; 25/25 comprobaciones en ambas. Pruebas de unidad del modelo con `node --test` (7/7 aprobadas).

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


## Escenarios tácticos (`pruebas/tactico.mjs`)

7 de noviembre de 2026 · Chrome headless (Playwright) · servido bajo `/sitio-67-mapa/`. 16/16 aprobadas (repetidas tras añadir el modo transmisión H, E/R por lados, Mayús/Alt + número y el arreglo del arrastre).

| # | Comprobación | Resultado |
|---|---|---|
| 1 | Siete escenarios cargan sin errores | Aprobado |
| 2 | Beta-7 se inserta a mano: 0 al abrir, 6 tras insertar (incluye TE y D) | Aprobado |
| 3 | Los iconos se arrastran por casillas (agente y amenaza 4 × 4) | Aprobado |
| 4 | Las flechas mueven el icono enfocado | Aprobado |
| 5 | La transmisión muestra el escenario y solo los contactos revelados | Aprobado |
| 6 | Atajo L oculta y muestra toda la leyenda (dirección y transmisión) | Aprobado |
| 7 | Atajo E oculta y muestra la capa Contactos (dirección y transmisión) | Aprobado |
| 8 | Armería: 14 grupos, ÍGNEO presente y retirada manual | Aprobado |
| 9 | Patio: Mayús+3 pasa al jefe final sin que el panel delate las otras escenas | Aprobado |
| 10 | El escenario activo y su estado sobreviven a la recarga | Aprobado |
| 11 | Pulsar una planta vuelve al plano general en dirección y transmisión | Aprobado |
| 12 | Un icono seleccionado se arrastra y arrastrar no selecciona | Aprobado |
| 13 | Alt+1 añade un Errante bajo el cursor (visible en transmisión), Alt+4 un Ariete y Supr lo borra | Aprobado |
| 14 | H: modo transmisión sin interfaz, sin amenazas ocultas y con arrastre | Aprobado |
| 15 | 203/204: E muestra los contactos del lado de entrada y R los del otro lado | Aprobado |
| 16 | Sin errores de consola | Aprobado |
