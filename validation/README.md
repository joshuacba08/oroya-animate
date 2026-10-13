# Evidencia local de Oroya JS 1.2

Validación realizada en Windows x64, Node 24.19.0 y pnpm 9.1.0. Los paquetes están alineados en 1.2.0; no se ha publicado esta versión.
El [resumen legible por herramientas](local-summary.json) reúne los resultados finales del mismo conjunto de artefactos.

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| Instalación reproducible | `pnpm install --frozen-lockfile` pasa | Lockfile del repositorio |
| Tests Node 24 | 242 tests, 41 archivos, sin fallos | [unit-tests.json](unit-tests.json) |
| Compatibilidad Node 18.20.8 / 20.20.2 | Los mismos 242 tests y tipos de paquetes pasan | [Node 18](unit-node18.json), [Node 20](unit-node20.json) |
| React 18 / 19 | StrictMode, actualizaciones tras commit y desmontaje pasan con ambas versiones | [React 18](react18.json), suite React incluida en unit-tests.json para React 19 |
| Tipos, lint, build | Paquetes y las cuatro aplicaciones pasan | Scripts de validación y CI |
| Arquitectura / API | 0 violaciones; 239 exports resueltos; 0 cambios incompatibles detectados | `architecture:check`, `api:check:strict`, `api:compat` |
| Documentación | 60 documentos canónicos sincronizados; 106 enlaces y 25 ejemplos comprobados | `docs:check`, `docs:validate` |
| Navegador | 37 pruebas pasan: Chromium, Firefox, WebKit y perfiles móviles Chromium/WebKit | [browser.json](browser.json), tests/browser |
| Distribución | 11 tarballs instalados fuera del monorepo; ESM, CJS y declaraciones NodeNext pasan | [package-consumers.json](package-consumers.json) |
| Manifiestos y declaraciones | publint 0.3.18 y ATTW 0.18.3: sin problemas en 11 paquetes | [package-checks.json](package-checks.json) |
| Rendimiento | Gate del 10 % pasa en el entorno registrado | [Referencia](performance-baseline.json), [medición](performance-latest.json) |
| Ejecución continua | 30 minutos, 100 ciclos y 108.004 frames; 0 errores, contadores finales de nodos/geometrías/texturas/programas en cero | [endurance-latest.json](endurance-latest.json) |
| Aceptación de entrega | `release:check --candidate` pasa; aceptación estable devuelve únicamente los 2 dispositivos físicos pendientes | [local-summary.json](local-summary.json), [physical-devices.json](physical-devices.json) |

La [matriz de capacidades](../docs/stability-1.2-es.md) documenta los contratos y límites. Los fixtures de rendimiento son 1.000 nodos, 10.000 instancias, 100 cuerpos y skinning. La ejecución continua usa el fixture del harness; sus contadores no prueban ausencia de fugas en cualquier escena, driver o componente de terceros.

Las mediciones de paquetes, rendimiento y ejecución continua llevan un digest de los artefactos compilados; `release:check` rechaza evidencia obsoleta. La referencia de rendimiento se registró explícitamente sobre la implementación corregida y se conservó durante la comparación.

Pendientes de cierre de entrega:

- Ejecutar la matriz configurada en GitHub Actions sobre Linux y Windows; Linux no fue ejecutado desde este equipo.
- Completar Safari/iOS y Chrome/Android físicos en [physical-devices.json](physical-devices.json). Los perfiles móviles automatizados no sustituyen esas pruebas.
- Configurar autenticación y permisos npm para los 11 paquetes. La comprobación local de credenciales devuelve HTTP 401.
- Publicar primero 1.2.0-rc.0 bajo `next`, verificar registro y después promover la entrega aprobada a `latest`. No se han publicado paquetes, creado tags ni desplegado documentación en esta sesión.

El workflow coordinado valida todo antes de publicar y modifica los dist-tags tras verificar todas las versiones. La aceptación estable sigue bloqueada mientras falten los dispositivos físicos. El despliegue documental conserva sus verificaciones y rollback existentes.
