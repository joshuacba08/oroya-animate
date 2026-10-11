# Revisión de mantenimiento de Oroya Animate
Fecha: 11 de octubre de 2026.

## Hallazgos resueltos
| Hallazgo | Corrección y evidencia |
| --- | --- |
| Animator enlazado produce JSON circular | Adaptadores internos guardan datos declarativos; tests después de bind, play y pause |
| Pérdida del estado de la raíz | Scene(root?: Node) conserva raíz completa y valida ausencia de padre; lectura compatible de JSON antiguo |
| Transforms anidados aplicados dos veces | Matrices locales en la jerarquía Three.js; comparación de matrices mundiales con traslación, rotación y escala no uniforme |
| Eliminación y reparentado no reconciliados | Reconciliación por frame de altas, bajas, padres, mapas, cámara e interacción |
| Liberación incompleta | Rutina compartida para eliminación/remount/dispose; recursos compartidos se liberan tras el último usuario; hooks una vez; cargas pendientes invalidadas |
| Invalidación de transforms | Setters que copian valores, devuelven void y marcan isDirty; escrituras directas compatibles |
| Auditoría API incompleta | AST/resolvedor de TypeScript, aliases, tipos, exports directos y cadenas con ciclos; 223 exports con etiquetas, modo estricto obligatorio |
| Apps excluidas de CI | Tipos y lint en cuatro apps; biblioteca Node 18/20, apps Node 24 con build previo de paquetes |
| Copias de documentación independientes | Manifiesto de 57 fuentes canónicas, frontmatter y slugs conservados; tutoriales por tema |
| Carga anticipada de ejemplos | Metadatos sin fábricas; cada fábrica y renderer se importan al visualizar/seleccionar; editor Monaco diferido |

## Limitaciones vigentes
- InstancedMesh, Script y componentes desconocidos requieren adaptadores de aplicación y se excluyen de la persistencia.
- Se guardan definiciones de animación, sin restaurar el instante exacto de reproducción.
- Callbacks, listeners de aplicación, recursos externos y estado físico en ejecución deben reconstruirse.
- No hay validación completa de esquemas JSON; la aplicación valida datos externos.
- Los IDs conservados pueden colisionar al importar copias de la misma escena.
- Las escrituras directas de transforms requieren updateLocalMatrix() o isDirty = true.
- setSize() no actualiza la proyección de la cámara.
- Los plugins son responsables de liberar sus recursos mediante hooks. El renderer no destruye recursos que el plugin posee.
- Las traducciones de tutoriales anteriores conservan el fallback a inglés.
- Las guías con diagramas siguen cargando Mermaid desde CDN; no descargan los motores Three.js, física ni Monaco.
- La publicación de paquetes npm no forma parte de esta entrega.

## Validación
Se mantienen los 175 tests originales: 206 tests en 30 archivos, incluidos los nuevos de runtime, auditoría, sincronización y extracción de ejemplos. Se comprueban 95 enlaces locales y se compilan 25 ejemplos completos de guías y tutoriales; lint incluye aplicaciones. Siete pruebas de navegador verifican guías en español, inglés y japonés, portada, galería con ciclos de montaje, interacción SVG y playground.

Las mediciones de transferencia están en validation/transfer-before.json y validation/transfer-after.json. Miden bytes del JavaScript recibido descomprimido durante los primeros tres segundos, en un viewport de 1280×800 y una página nueva por ruta; no representan bytes comprimidos en producción.

| Ruta | Antes (bytes) | Después (bytes) | Cambio |
| --- | ---: | ---: | ---: |
| /docs/serialization | 3.619.677 | 3.619.677 | 0 % |
| /examples | 1.088.292 | 948.622 | −12,8 % |
| / | 950.236 | 958.569 | +0,9 % |

La portada mantiene la demo inicial, por lo que carga el renderer. La galería importa solo las fábricas visibles y libera las demos que salen del viewport. Los diagramas Mermaid dominan la transferencia de las guías; esa carga sigue siendo una oportunidad de mejora separada.

## Despliegue
GitHub Actions es la única vía de despliegue (git.deploymentEnabled=false). El workflow exige toda la validación, admite previews y verifica HTTP tras producción, con rollback automático al despliegue capturado antes de publicar ante fallo. El workflow registra el commit y la URL en su resumen y artifact. Verifica esa identidad por HTTP en las guías de los tres idiomas y en el dominio público de producción; ejecuta también las pruebas de navegador contra la URL desplegada.

La PR #1 se integró en main por petición expresa del usuario. Las credenciales de Vercel ya existían en el entorno `Production` de GitHub; el intento anterior falló porque el job no seleccionaba ese entorno. Esa referencia está corregida. La publicación se considera completada cuando pasan las comprobaciones del workflow y del dominio público.
