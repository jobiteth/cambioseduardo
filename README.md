# Calculadoras de tasas — Zami y Remesas Venezuela Z&E

Misma aplicación Next.js, dos configuraciones de sitio independientes sobre una sola base PostgreSQL.

| Carpeta | Sitio | Configuración | Tasas |
| --- | --- | --- | --- |
| `zami/` | Cambios Zami | `site_config_zami` | `exchangezami_rates` |
| `remesasve/` | Remesas Venezuela Z&E | `site_config` | `exchange_rates` |

Las dos variantes comparten la tabla `users` (cuentas, niveles y permisos), tal como estaba diseñado el sistema original.

## Requisitos

- Node.js `24.x`
- pnpm `9.3.0`

## Variables de entorno

Copiar `.env.example` a `.env.local` en cada carpeta y completar:

- `DATABASE_URL`: cadena de conexión PostgreSQL (Neon u otro proveedor compatible). En Vercel, usar la conexión con pooler y `sslmode=require`.
- `NEXTAUTH_SECRET`: cadena aleatoria larga para firmar las sesiones (JWT HS256). Debe ser distinta por sitio y no reutilizarse entre proyectos.

El resto de las variables de la plantilla son opcionales y solo se necesitan si se usan herramientas que las lean. No se incluye ningún secreto, credencial ni dato real en este repositorio.

## Instalación y compilación

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run start
```

## Despliegue

Cada carpeta es un proyecto independiente en Vercel (framework Next.js, Node 24.x). No requiere `vercel.json`: usa los comandos de `package.json` y el lockfile incluido.

## Seguridad

- No subir `.env`, `.env.local` ni respaldos de base de datos.
- Las contraseñas se almacenan con bcrypt en la tabla `users`; los hashes no se pueden convertir de vuelta a texto.
- La clave de acceso del sitio se guarda en `site_access_key` y se administra desde el panel.
- `remesasve` tiene activa la clave de acceso de 5 dígitos porque así está configurado en `site_config` (`require_password_access`).
