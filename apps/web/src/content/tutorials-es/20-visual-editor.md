---
title: "Editor visual (alpha)"
description: "Tour de apps/editor — la herramienta de autoría de escenas en React que ships con v1.0."
order: 20
level: "beginner"
duration: "10 min"
---
# Tutorial 20: Editor visual básico
> **Nivel:** Principiante
> **Tiempo:** 10 minutos

Usá Node 24, instalá dependencias, ejecutá `pnpm build` y después `pnpm --filter editor dev`. El flujo básico de escritorio está probado en Chromium, Firefox y WebKit.

1. Seleccioná un nodo desde la jerarquía o el viewport.
2. Creá grupos, cubos, esferas y planos bajo la selección o la raíz.
3. Editá nombre y padre; un reparentado cíclico se rechaza sin alterar la escena.
4. Editá posición, rotación Euler XYZ en grados y escala; core conserva cuaterniones.
5. Ajustá color, opacidad, roughness, metalness y caras dobles del material.
6. Usá W/E/R para los gizmos. La cámara de navegación es independiente de las cámaras guardadas.
7. Duplicá o eliminá nodos. Ctrl/Cmd+Z deshace y Ctrl/Cmd+Shift+Z o Ctrl+Y rehace. Cada arrastre es una operación.
8. Guardá JSON; se avisa antes de omitir datos que requieren reconstrucción.
9. Cargá una escena válida: viewport, jerarquía, selección e inspector cambian juntos y se limpia el historial. Un archivo inválido conserva la escena actual. Reemplazar cambios sin guardar requiere confirmación.

`EditorController` es la única fuente de escena, selección e historial. El desmontaje libera renderer, gizmos, observers, listeners y RAF.

Se conserva el formato público de `serialize()`. Assets externos, scripts, instante de reproducción y estado físico necesitan reconstrucción. Duplicar crea IDs nuevos, pero no remapea automáticamente nombres de animación o huesos.

Timeline, empaquetado de proyectos y colaboración quedan fuera. Consultá [capacidades y aceptación](/es/docs/stability-1.2).
