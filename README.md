# SITIO-67 · Mapa de dirección

Web estática para dirigir la exploración de SITIO-67 y transmitir el plano a los jugadores por videollamada. Sin cuentas, sin servidor y sin servicios externos: todo ocurre en el navegador del director.

Dirección prevista al activar GitHub Pages: **https://tiburoncctv.github.io/sitio-67-mapa/**

## Arranque

La aplicación usa módulos JavaScript y carga los planos con `fetch`, así que **debe servirse por HTTP/HTTPS**. Abrirla con doble clic (`file://`) no funciona.

- **Local:** desde la carpeta que *contiene* este repositorio, ejecuta `python3 -m http.server 8000` y abre `http://localhost:8000/sitio-67-mapa/`.
- **GitHub Pages:** ver la sección siguiente.

## Publicación en GitHub Pages

1. En GitHub: *Settings → Pages → Build and deployment → Source: Deploy from a branch*.
2. Elige la rama `main` y la carpeta `/ (root)`; guarda.
3. Tras uno o dos minutos, el mapa queda en `https://tiburoncctv.github.io/sitio-67-mapa/`.

Todas las rutas son relativas: funciona bajo la subruta del proyecto sin asumir la raíz `/`. El archivo `.nojekyll` evita que Jekyll procese el sitio. Si más adelante quieres moverlo a otro repositorio con una introducción, copia los archivos de la web a una carpeta aislada (p. ej. `mapa/`) y enlázala con `<a href="mapa/">`.

## Vista de jugadores: comparte la ventana correcta

1. Abre el mapa (vista de dirección).
2. Pulsa **«Abrir vista para transmitir»**. Se abre otra pestaña o ventana con `?view=player`, de solo lectura.
3. En Discord/Meet/Zoom, **comparte esa ventana, no el escritorio completo**. Mantén el panel de dirección en otra ventana o monitor.
4. En la vista de jugadores, el botón discreto «⛶ Pantalla completa» (arriba a la derecha) desaparece al usarlo; **Escape** sale de pantalla completa.

Los cambios se reflejan al instante (mismo navegador y perfil). Pueden coexistir varias vistas de jugadores. No es multijugador: los jugadores no abren nada.

**Si el navegador bloquea la ventana:** aparece un aviso en el panel. Permite ventanas emergentes para el sitio (icono en la barra de direcciones) o abre el enlace del aviso. Alternativa: **«Usar modo limpio en esta ventana»**, que oculta toda la edición en la pestaña actual. Para salir: **Escape** o el botón casi transparente «Salir del modo limpio» (abajo a la derecha).

**Qué ven los jugadores:** la planta, el encuadre y la ficha que publicas; leyenda; marcador de Beta-7; estados y anotaciones. Nunca ven barras de edición, importación ni avisos de guardado.

Opciones del panel (sección *Transmisión*):
- **Los jugadores siguen mi encuadre**: si se desactiva, ven siempre el plano completo.
- **Retener la vista de jugadores**: congela planta, encuadre y ficha publicados para que puedas consultar otra planta en privado. Los cambios de estado sí se siguen viendo.
- **Leyenda en transmisión.**
- **Mostrar ficha en transmisión** (sección *Selección*): sin activarlo, seleccionar algo no muestra ficha a los jugadores.

> El modo de transmisión evita exponer controles por accidente, **pero no es una frontera de seguridad**: todo lo que se publica en un sitio estático es inspeccionable. No guardes secretos narrativos en estos archivos.

## Uso del mapa

- **Planta:** pestañas S / −1 / −2 / −3 (también con flechas ← →). Cambiar de planta ajusta el encuadre y limpia una selección de otra planta.
- **Zoom:** botones − / +, rueda sobre el mapa (mantiene el punto bajo el cursor), de 0.75× a 3×. **Ajustar** encaja el plano completo, también tras cambiar el tamaño de la ventana. Arrastrar desplaza; un clic sin arrastrar selecciona.
- **Selección:** clic en cualquier punto de una sala, tramo o conexión; o usa la lista del panel; o Tab + Enter sobre el plano.

### Estados

Cada sala y tramo tiene dos propiedades independientes:

| Propiedad | Valores | En el mapa |
|---|---|---|
| Paso actual | ? Sin verificar · ✓ Transitable · ✕ Bloqueado | sin marca · contorno verde + «✓ TRANSITABLE» · rayado rojo + «✕ BLOQUEADO» |
| Contaminación confirmada | – No registrada · ◆ Sí | — · punteado magenta + «◆ CONTAMINADO» |

Todo empieza **sin verificar** (el plano es la distribución original). «No registrada» no significa segura. Una zona puede estar contaminada y ser transitable. Nada cambia solo: cada estado es una decisión del director. La **etiqueta pública** (máx. 120 caracteres, Enter para aplicar) aparece en el mapa y en la ficha.

Los núcleos **A** y **B** tienen indicadores separados: A · escalera, A · ascensor de personal, B · escalera protegida, B · montacargas. Bloquear uno no bloquea los demás. El pasillo principal, el pasillo de mantenimiento (PM), el vial perimetral, los accesos de cada sala, las entradas a A/B, PT y E están segmentados en tramos con su propio estado. C1/C2 son solo referencia.

### Anotaciones

- **Bloqueo:** pulsa *Bloqueo* y haz clic en el plano. Etiqueta opcional. Arrástralo para moverlo; bórralo desde el panel.
- **Paso descubierto:** pulsa *Paso descubierto* y marca dos puntos de la misma planta. Arrastra un extremo para ajustarlo o la línea para moverla; bórralo desde el panel. No redibuja salas ni calcula rutas.
- **Beta-7:** *Ubicar Beta-7* y clic en cualquier punto del plano (sala, pasillo, patio, PM). *Ocultar/Mostrar Beta-7*. La cabecera indica en qué planta está si consultas otra; púlsala para ir allí.
- **Escape** cancela cualquier herramienta pendiente.

### Deshacer

**Deshacer** (o Ctrl/Cmd+Z fuera de campos de texto) revierte hasta 20 cambios de estados, etiquetas, anotaciones, marcador, importación o reinicio. Zoom, planta y selección no consumen historial. El historial no se conserva al recargar.

## Guardado, respaldo y reinicio

- Guardado automático en `localStorage`, clave exclusiva `sitio67:mapa:v1` (no toca otras páginas del dominio). Se guardan datos, no HTML.
- **Borrar los datos del navegador elimina la sesión.** El respaldo portable es el JSON exportado.
- **Exportar respaldo JSON** descarga la sesión. **Importar respaldo…** valida versión, IDs, tipos, valores y coordenadas, muestra un resumen y pide confirmación. Un archivo inválido no cambia nada.
- Si el navegador no permite guardar, la app sigue funcionando en memoria y avisa en el panel (nunca en la vista de jugadores): exporta antes de cerrar.
- Si se encuentra un guardado dañado o incompatible, **no se sobrescribe**: el panel ofrece descargar su contenido, exportar la sesión actual o descartarlo con confirmación.
- **Nueva sesión…** explica qué se borrará, ofrece exportar y pide confirmación.

## Estructura

```
(raíz del repositorio)
  index.html, styles.css, .nojekyll
  js/main.js       arranque (dirección o ?view=player)
  js/state.js      modelo, validación, deshacer (sin DOM)
  js/storage.js    localStorage + BroadcastChannel
  js/data.js       carga de datos y planos
  js/mapview.js    plano SVG, zoom, capas e interacción
  js/director.js   panel de dirección
  js/player.js     vista de jugadores
  js/describe.js   fichas públicas
  js/ui.js         utilidades DOM (solo texto, sin innerHTML)
  data/rooms.json  38 salas: código, nombre, descripción literal y área
  data/routes.json tramos y conexiones con ID y geometría
  assets/maps/     los cuatro planos SVG originales sin modificar
  tests/           pruebas de unidad del modelo: node --test tests/state.test.mjs
  pruebas/         pruebas de aceptación en navegador (Playwright)
  herramientas/    gen_data.py: regenera data/*.json desde los SVG y la referencia
  capturas/        vistas de dirección y transmisión
```

## Limitaciones conocidas

- Requiere un navegador actual (Chrome, Edge, Firefox o Safari recientes). Probado solo en Chrome (headless) durante el desarrollo; ver `PRUEBAS-RESULTADOS.md`.
- Las dos ventanas deben estar en el mismo navegador y perfil. No hay sincronización por internet.
- En móvil funciona, pero el diseño está pensado para escritorio.
- Los glifos ✓ ✕ ◆ dependen de las fuentes del sistema; todos los estados llevan además texto.

Créditos y licencia: ver `CREDITS.md`.
