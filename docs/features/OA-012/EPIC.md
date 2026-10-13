# OA-012 — Animaciones didácticas de programación en SVG

Estado: requisitos definidos y renderer persistente implementado para la versión 1.3.0. El mantenedor solicitó publicación estable directa por GitHub Actions, usando la excepción explícita para pruebas físicas pendientes; todas las demás validaciones siguen siendo obligatorias. La integración del bloque en la plataforma sigue pendiente. Los paquetes públicos `@joroya/core` y `@joroya/renderer-svg` 1.2.0 se comprobaron contra sus tarballs oficiales; sus builds coincidían con el checkout antes de esta ampliación.

## Objetivo

Permitir que OroyaJS explique programación mediante escenas SVG reproducibles, con pasos comprensibles y controles del alumno. El resultado debe mostrar cómo cambia el estado de un programa, no solamente objetos que se mueven. La misma posición de reproducción debe producir el mismo texto, valores, objetos, flechas y resaltado, incluso después de retroceder o reiniciar.

## Evaluación de 1.2.0

La librería proporciona escenas y jerarquías, cajas/círculos/paths/texto, materiales, SVG estático y DOM, eventos de puntero, serialización, clips de transformación, interpolación y `AnimationMixer.seek`, `pause`, `resume`, `sampleAt` y eventos. `advanceScene: false` permite dibujar después de posicionar el reloj sin avanzar una segunda vez. El paquete SVG depende del core; no necesita Three.js.

Los tracks de clips públicos animan posición, rotación y escala. Los cambios de texto, color y datos requieren una capa de aplicación o futuras extensiones tipadas. `renderToSVGElement` devuelve una instantánea nueva por llamada; no tiene actualización persistente. `@joroya/react` 1.2.0 monta `ThreeRenderer` sobre canvas, por lo que no es el adaptador adecuado para un bloque SVG. La serialización preserva definiciones y clips; no guarda el playhead como progreso del alumno.

La prueba del paquete publicado verificó seek hacia delante y atrás, muestreo sin efectos, pausa/reanudación, scrubbing sin eventos, eventos opcionales, dibujo sin avance, texto escapado y serialización. Los tiempos obtenidos con Node/JSDOM son evidencia de comparación local, no cifras de FPS ni garantías para móviles.

Fuentes verificadas: [core 1.2.0 en el registry oficial](https://registry.npmjs.org/@joroya%2Fcore/1.2.0), [renderer-svg 1.2.0](https://registry.npmjs.org/@joroya%2Frenderer-svg/1.2.0) y los archivos distribuidos dentro de sus tarballs. La comparación del build se realizó antes de modificar el renderer local.

### Evidencia del prototipo (13 de octubre de 2026)

Se construyó un prototipo aislado con `@joroya/core` instalado desde npm 1.2.0 y el nuevo renderer compilado desde este repositorio. Incluye las cuatro familias de ejemplos, controles manuales y reproducción, seis métodos de arrays, resaltado de código y movimiento reducido. Los estados finales de los iteradores se contrastaron con los métodos nativos de JavaScript; también se comprobaron límites 0/1/3 del ciclo, terminación anticipada, retorno de función, alias/reasignación y SVG idéntico al volver al mismo paso.

| Nodos de escena (cajas) | Mediana de instantánea nueva | Mediana de actualización persistente |
| --- | --- | --- |
| 50 | 0.2 ms | 0.1 ms |
| 100 | 0.4 ms | 0.1 ms |
| 300 | 1.0 ms | 0.3 ms |

Medición local en el navegador integrado de Codex: 50 dibujados por tamaño, descartando los primeros 5, modificando la posición de una caja. Los SVG de la medición están desconectados del documento: incluye trabajo JavaScript/DOM y excluye layout/pintado. La identidad del root y del grupo del nodo se conservó en los tres tamaños. No equivale a FPS, no acredita el presupuesto móvil y no sustituye la medición de escenas educativas completas.

El bundle del prototipo, con cuatro ejemplos, seis métodos, core y renderer, mide 48,604 bytes minificados / 16,443 bytes gzip, sin Three.js; no es una medida del core aislado. Validación del motor: 258 pruebas en 43 archivos, typecheck y build de todos los paquetes, API pública/compatibilidad y reglas de arquitectura. El prototipo no es todavía un bloque persistido del editor ni implementa todas las variantes de la tabla de aceptación.

## División de responsabilidades

| Responsabilidad | Ubicación |
| --- | --- |
| Escena, geometría, transformación, interpolación y serialización | `@joroya/core` |
| DOM SVG persistente, reconciliación, recursos y exportación | `@joroya/renderer-svg` |
| Ejecución semántica de los ejemplos, estados, explicaciones y resaltado | Plantillas didácticas de OroyaJS; posibles utilidades de dominio en un paquete separado |
| Controles, código, inspector del autor, idioma y accesibilidad del lector | Bloque de animación de la plataforma |
| Borradores, versiones, permisos y progreso del alumno | Plataforma; nunca el motor gráfico |

No introducir intérpretes JavaScript, UI del CMS, Supabase, React, Three.js ni lógica de cursos en el core. No representar la identidad de un objeto mediante la identidad de un elemento DOM: heap y variables pertenecen al estado semántico.

## P0 — Renderer persistente (implementado localmente)

API aditiva `SvgRenderer` con constructor, `mount`, `render`, `getNodeElement`, `setSize`, `setViewBox`, `setAccessibleDescription` y `dispose`. Debe conservar el root SVG, grupos por ID y geometrías del mismo tipo; actualizar posiciones, texto, dimensiones y material; quitar atributos que ya no correspondan; reconciliar altas/bajas/reordenamientos/reparentado; aislar IDs de gradients/filtros/clip-paths/máscaras por instancia; conservar animaciones SMIL que no hayan cambiado; y entregar cada interacción una sola vez.

Un frame idéntico no debe crear elementos ni escribir atributos. El renderer no debe iniciar RAF ni temporizadores. `mount` no avanza el reloj. `render(dt)` avanza una vez; `render(0, { advanceScene: false })` permite scrubbing. Libera solamente sus listeners, DOM y bindings de Animator propios; un mixer vinculado por la aplicación permanece bajo su responsabilidad. Para escenas compartidas entre backends, la aplicación debe poseer el Animator y avanzar la escena una sola vez.

El título/descripción SVG se introducen como texto. El grupo obtenido con `getNodeElement` conserva anotaciones ARIA, tabindex y foco entre frames. La aplicación sigue siendo responsable del teclado y de narrar el paso actual fuera del SVG. Las funciones históricas `renderToSVG` y `renderToSVGElement` conservan sus contratos de instantánea/exportación.

## P0 — Reproductor didáctico de la plataforma (pendiente)

Crear un bloque independiente «Animación de programación», usable en cursos, lecciones, artículos y presentaciones. Debe cargar el motor bajo demanda y ofrecer:

- Reproducir, pausa, reinicio, paso anterior/siguiente, posición en la línea de tiempo y velocidad 0.5×/1×/2×.
- Estado inicial pausado, incluso al publicar. No iniciar reproducción por aparecer en viewport.
- Pausa al ocultarse la pestaña o salir de viewport; cancelar RAF al desmontarse. Al reanudar no recuperar el tiempo transcurrido en segundo plano.
- Movimiento reducido: mantener pasos manuales y estados completos; evitar interpolaciones automáticas innecesarias.
- Texto explicativo, línea de código activa, variables, resultado, heap/stack cuando corresponda y leyenda de colores.
- Controles con botones HTML y etiquetas accesibles. El significado no debe depender solamente del color. Narración `aria-live` al cambiar de paso, sin anunciar 60 veces por segundo.
- SVG con viewBox, tamaño adaptable y zoom/desplazamiento si se necesita conservar legibilidad; lista textual equivalente en móvil y para lectores de pantalla.
- Exportación SVG del estado seleccionado, explicación y fragmento de código. No exportar callbacks ni progreso privado.

El autor selecciona una plantilla y sus entradas; modifica explicación, nombres, valores, colores del tema y duración de transiciones. La previsualización usa el mismo reproductor del lector. Inserción, duplicado, orden, deshacer, guardado y publicación deben seguir el contrato actual del editor.

## Estado y tiempo

La traza debe ser finita y verificable. Cada paso contiene una fase, línea de código, variables, salida y estructuras semánticas. Cada frame se deriva de `stateAt(time)` o de snapshots inmutables, no de callbacks acumulativos de reproducción. El algoritmo se evalúa una vez al construir la traza; scrubbing nunca vuelve a ejecutar efectos de programa. Las transiciones gráficas interpolan entre estados consecutivos, pero el texto y la explicación se seleccionan a partir del estado semántico.

Los eventos de clips sirven para notificaciones opcionales; no deben ser la única fuente del estado, porque `seek` es deliberadamente libre de eventos por defecto. Usar `setPosition`, `setRotation`, `setScale` o actualizar explícitamente la matriz al mutar campos de Transform; una mutación `position.x` por sí sola no invalida un frame previamente dibujado en 1.2.0.

## Plantillas y aceptación semántica

| Plantilla | Estados visibles | Casos obligatorios |
| --- | --- | --- |
| `for` | Inicialización, condición, cuerpo, incremento, fin; índice, iteraciones y salida | Límite 0, 1 y N; no ejecutar cuerpo con condición falsa; mostrar la condición final; variantes break/continue sin saltos incorrectos |
| `map` | Elemento e índice actual, callback y array resultante | Callback una vez por elemento visitado; mismo orden; array vacío; distinguir original y resultado |
| `filter` | Predicado, aceptación/rechazo y resultado acumulado | Todos/ninguno/algunos; preservar orden; no reemplazar el array original |
| `reduce` | Acumulador previo, elemento, callback y acumulador nuevo | Con/sin valor inicial; vacío sin inicial debe representar error; usar el primer elemento como acumulador cuando no hay inicial |
| `find`, `some`, `every` | Predicado, valor retornado y terminación anticipada | No visitar elementos posteriores al resultado decisivo; `every([]) === true`, `some([]) === false`, `find` sin coincidencia produce undefined |
| Funciones | Argumentos, parámetros locales, stack de llamadas, retorno y reanudación | Dos llamadas anidadas; argumentos por valor; no confundir el frame local con el caller; incluir ejemplo con objeto compartido |
| Referencias a objetos | Variables, IDs de heap, propiedades y flechas | `const a = {n:1}; let b = a; b.n = 2;` modifica un único objeto; reasignar b a otro objeto no cambia a; spread copia superficial y conserva referencias anidadas |

Definir el subconjunto soportado: no afirmar equivalencia con JavaScript completo si se usan plantillas. La primera versión puede aceptar arrays densos de números/strings/booleanos. Si se amplía a huecos, mutación durante callbacks, closures o recursión, deben existir trazas y pruebas dedicadas antes de ofrecer esas variantes.

## Persistencia y límites

Contrato versionado del bloque: `version`, `templateId`, `templateVersion`, entradas tipadas, explicación por paso, configuración visual y duración. Las versiones de plantilla y de engine son independientes: una actualización no debe cambiar silenciosamente una explicación ya publicada. Guardar definiciones; reconstruir Scene/Mixer/DOM al leer. Progreso del alumno, si se incorpora, se guarda por separado.

No aceptar JavaScript/HTML/SVG arbitrarios ni nombres de callback ejecutables como entradas del editor. Las plantillas pertenecen al código de aplicación. Validar entradas, número de elementos/pasos, longitud de texto, duración finita y profundidad de objetos antes de generar escenas. Propuesta inicial: hasta 20 elementos, 200 pasos, texto de 500 caracteres por explicación y hasta 300 nodos renderizados, con diagnóstico si se excede el presupuesto. Ajustar estos límites con mediciones reales, no con una promesa de rendimiento.

## P1 — Primitivas y authoring del motor (pendientes)

- Conectores 2D con punta de flecha, etiquetas y extremos anclados a nodos, considerando transformaciones de sus padres; comportamiento definido para distancia cero.
- Utilidades de layout para filas de tarjetas y diagramas; medición de texto y ajuste/multilínea con una estrategia que preserve exportación y fallback de fuentes.
- Canales tipados para propiedades escalares de material (opacity/color) y estados discretos, si las aplicaciones necesitan interoperabilidad de esas animaciones entre renderers. Mantener tracks de transformación existentes compatibles.
- Marcas con IDs estables y helpers de pasos sobre AnimationMixer, sin introducir semántica de programación en el core.
- Adaptador React SVG opcional que gestione mount/dispose en Strict Mode, sin cargar Three.js. Mientras tanto el bloque puede usar un wrapper React pequeño sobre `SvgRenderer`.

## Verificación y entrega

Para el motor: pruebas de identidad DOM, atributos y texto, estructura dinámica, aislamiento de defs, listeners, foco, Animator/clock, disposal, API, tipos, ESM/CJS, snapshot SVG y build. Para la plataforma: semántica de cada plantilla, ida/vuelta JSON, selección/duplicado/deshacer, frame idéntico después de seek ida y vuelta, exportación, teclado, contraste, movimiento reducido y móvil.

Medir carga, nodos, frames y long tasks en navegador para 50/100/300 nodos, varias animaciones simultáneas y pestaña oculta. Objetivo inicial de evaluación: frames de aplicación por debajo de 16.7 ms en un escritorio de referencia, informando hardware/navegador y percentiles; medir móvil antes de prometer 60 FPS. Comparar contra snapshot/recreación y comprobar que no se pierden foco ni listeners.

La publicación de la ampliación fue autorizada después de la evaluación y utiliza el flujo de GitHub Actions del repositorio. La integración de plataforma requiere una versión publicada con la nueva API o una dependencia de desarrollo explícita; no presentar `SvgRenderer` como API disponible en npm 1.2.0. La validación de plataforma no debe insertar fixtures, resetear ni modificar el Supabase remoto compartido.

## Orden de implementación

1. Motor: revisar y entregar el renderer persistente con documentación, pruebas y una publicación explícitamente autorizada. La evaluación y la implementación local están completas.
2. Plataforma: definir el contrato versionado e integrar el bloque y sus controles, comenzando por `for` y referencias compartidas. Validar guardado y reproducción con la misma plantilla; ampliar a iteradores y funciones con sus casos de aceptación.
3. Authoring avanzado: incorporar conectores, layout, marcas y tracks tipados conforme lo requieran las plantillas, manteniendo las dependencias y API existentes compatibles.
