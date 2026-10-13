---
title: Estabilidad y capacidades
order: 12
category: guide
---
# Oroya JS 1.2 — capacidades y aceptación

La entrega objetivo es 1.2.0. Compilar correctamente no equivale a haber publicado en npm ni completado las comprobaciones en dispositivos físicos.

| Área | Garantía | Límites y evidencia |
| --- | --- | --- |
| Core | Grafo sin ciclos ni IDs duplicados, componentes con propietario, Transform obligatorio y setters con invalidación | Mutar arrays/mapas directamente evita los métodos de validación. Pruebas Node, Stability y RuntimeRegression |
| Renderers | `advanceScene: false` sincroniza y dibuja sin avanzar de nuevo; capacidades y diagnósticos públicos | Three.js: 3D/Buffer/CSG, sin Path2D/Text. SVG: vectores y eventos DOM, sin efectos GPU. Canvas2D: formas 2D, texto, paths, gradientes y opacidad, sin picking/filtros SVG. Pruebas Parity, renderSVG y Lifecycle |
| Persistencia | JSON histórico compatible, buffers tipados, datos declarativos y validación antes de crear objetos | Scripts, InstancedMesh y componentes desconocidos requieren adaptadores. No empaqueta assets externos, callbacks ni instante exacto de reproducción/simulación. Pruebas SerializationRoundtrip, RuntimeRegression y Stability |
| glTF/GLB | Jerarquía, buffers, valores PBR, clips de transforms y skeletons | Texturas requieren adaptador; no se promete conservar morph targets, materiales múltiples ni extensiones con decodificadores. Fixtures locales y prueba de skinning WebGL |
| Assets/input/física/inspector | Reintentos, cancelación y referencias; acciones y limpieza de gamepad; cuerpos, constraints y dispose; cambio de escena y DOM del inspector | Física: hijos directos de raíz sin escala; traslación/rotación de raíz admitidas. Gamepad necesita polling. Pruebas Recovery, Gamepad, Physics Lifecycle e Inspector Lifecycle |
| React/Vue/plugins | Contratos `@public` desde 1.2: props tras commit, cámaras explícitas, resize, callbacks, montaje/desmontaje y ownership | Wrappers WebGL; plugins poseen sus recursos. React 18/19 StrictMode, Vue y pruebas reales de navegador |
| Editor | Grupos/primitivas, selección, jerarquía, transforms Euler, materiales, gizmos W/E/R, duplicar/eliminar, undo/redo y guardar/cargar | Autoría básica en escritorio; sin timeline, assets empaquetados ni remapeo automático de referencias de animación al duplicar. Pruebas EditorController y navegador |

## Uso compartido y errores

Un renderer avanza la escena una vez; los demás usan `advanceScene: false`. Los setters `setPosition`, `setRotation` y `setScale` copian valores y marcan el Transform como sucio. Las escrituras directas conservan su requisito de `updateLocalMatrix()` o `isDirty = true`.

Las cámaras conservan su proyección manual; `autoAspect: true` o `adjustCameraToViewport: true` activan el ajuste. React/Vue lo activan en cámaras automáticas; `active: true` da prioridad a una cámara explícita. La navegación del editor usa una cámara del viewport independiente de las cámaras guardadas.

`validateSceneJSON(json)` devuelve `{ valid, diagnostics }`. `deserialize()` lanza `SceneValidationError` antes de reemplazar la escena si hay errores. Las opciones `{ onDiagnostic }` de persistencia y render comunican código, severidad, mensaje, nodo y ruta cuando corresponden. Los huesos aún no resueltos y triángulos incompletos generan avisos compatibles con datos antiguos; IDs duplicados, buffers fuera de rango y definiciones inválidas son errores.

En plugins, gana el último handler registrado; retirarlo restaura el anterior. Los hooks corren tras actualizar la escena y antes de sincronizar matrices, con delta cero al desactivar avance. El dispose del objeto ocurre antes del dispose del plugin. El registro de una clave no añade por sí solo un ComponentType al core.

## Validación y publicación

Node 24 y pnpm 9.1.0 para desarrollo; bibliotecas compatibles con Node 18/20. Build debe preceder a las comprobaciones de aplicaciones que consumen `dist`. CI incluye Windows/Linux, auditoría de exports y `pnpm api:compat`; `pnpm verify:packages` instala los tarballs en un consumidor externo y prueba ESM/CJS y tipos.

`pnpm perf:record` establece una referencia explícita; `pnpm perf:check` bloquea regresiones superiores al 10 % de las medianas de CPU/frame en el mismo equipo, navegador, Node, viewport y DPR. Escenarios: 1.000 nodos, 10.000 instancias, 100 cuerpos y skinning. La transferencia medida pertenece al harness de desarrollo y no representa gzip de producción.

`pnpm test:endurance` comprueba 30 minutos, 100 ciclos de montaje, progreso de frames, recursos constantes y liberación final. Los informes JSON de `validation/` incluyen un digest SHA-256 de los artefactos ESM compilados; la evidencia obsoleta bloquea la entrega.

Chromium, Firefox y WebKit, incluidos perfiles móviles, se comprueban automáticamente. Safari/iOS y Chrome/Android físicos requieren dispositivo, versión de navegador, versión probada, evidencia y digest en `validation/physical-devices.json`. La emulación no completa esas comprobaciones.

Se prepara primero `1.2.0-rc.0` bajo `next`, mediante el workflow de publicación, que valida todos los paquetes antes de publicar tarballs y actualiza los tags al terminar. `latest` exige también aceptación física. IK, vehículos y hooks WASM siguen siendo experimentales.
