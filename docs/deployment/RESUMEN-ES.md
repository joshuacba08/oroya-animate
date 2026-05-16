# Documentacion de Publicacion y Despliegue - Resumen Ejecutivo

Este resumen refleja el estado de Oroya Animate 1.0.0 y la familia actual de paquetes `@joroya/*`.

## Estado Actual

La configuracion de publicacion cubre NPM, CDNs publicos y el sitio de documentacion en Vercel. El proyecto publica 11 paquetes:

- `@joroya/core`
- `@joroya/renderer-three`
- `@joroya/renderer-svg`
- `@joroya/renderer-canvas2d`
- `@joroya/loader-gltf`
- `@joroya/physics`
- `@joroya/assets`
- `@joroya/input`
- `@joroya/inspector`
- `@joroya/react`
- `@joroya/vue`

## Documentacion Disponible

- `docs/deployment/npm-publishing.md` - Publicacion en NPM
- `docs/deployment/cdn-setup.md` - Uso via CDN
- `docs/deployment/vercel-deployment.md` - Despliegue del sitio Astro
- `docs/deployment/package-metadata.md` - Metadatos y discoverability
- `docs/deployment/CHECKLIST.md` - Checklist de release
- `docs/deployment/README.md` - Guia rapida del flujo completo

## Workflows

- `.github/workflows/ci.yml` ejecuta lint, typecheck, tests y build.
- `.github/workflows/publish.yml` publica en NPM cuando se pushea un tag `v*.*.*`.
- `.github/workflows/deploy-web.yml` despliega el sitio web.

## Configuracion Requerida

### NPM

```bash
npm login
npm token create --read-write
```

Agregar el token como `NPM_TOKEN` en GitHub Secrets.

### Vercel

```bash
npm install -g vercel
vercel login
vercel link
```

Agregar estos secrets en GitHub:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Flujo Normal De Release

```bash
# 1. Actualizar todas las versiones de paquetes
node scripts/sync-versions.js 1.0.1

# 2. Validar localmente
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build

# 3. Commit y tag
git add .
git commit -m "Release v1.0.1"
git tag v1.0.1

# 4. Push
git push origin main
git push origin v1.0.1
```

El workflow de publicacion se encarga de publicar todos los paquetes en NPM con `--access public` y provenance.

## Verificacion Post-publicacion

```bash
npm view @joroya/core version
npm view @joroya/renderer-three version
npm view @joroya/renderer-svg version
npm view @joroya/renderer-canvas2d version
npm view @joroya/loader-gltf version
curl https://unpkg.com/@joroya/core@1.0.0/package.json
curl https://oroya-animate.vercel.app
```

## URLs Principales

- NPM Org: https://www.npmjs.com/org/joroya
- Documentacion: https://oroya-animate.vercel.app
- GitHub: https://github.com/joshuacba08/oroya-animate
- CDN base: `https://unpkg.com/@joroya/core@1.0.0/dist/index.js`

## Checklist Inicial

- [ ] Cuenta NPM creada
- [ ] Organizacion `@joroya` creada en NPM
- [ ] `NPM_TOKEN` agregado a GitHub Secrets
- [ ] Secrets de Vercel agregados a GitHub
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` pasando
- [ ] Tag de release creado con formato `vX.Y.Z`
- [ ] Version verificada en NPM y CDN

## Soporte

Si algo falla, revisar:

- Logs de GitHub Actions
- `docs/deployment/CHECKLIST.md`
- Secciones de troubleshooting en las guias de NPM, CDN y Vercel
- Issues del repositorio: https://github.com/joshuacba08/oroya-animate/issues
