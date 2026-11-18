# Notas en Markdown con versiones

Editor de notas Markdown con vista previa, etiquetas, búsqueda e historial de versiones.

## Requisitos

- Node.js 20+
- Proyecto Firebase con Firestore habilitado
- Credenciales de cuenta de servicio (solo servidor)

## Configuración

1. Instala dependencias:

```bash
npm install
```

2. Crea `.env.local` en la raíz del proyecto (no se debe versionar):

```env
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_CLIENT_EMAIL=tu-service-account@tu-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

- La app usa **Firebase Admin SDK** desde rutas API del servidor (`app/api/**`) y **Firestore** como fuente de verdad (reemplaza `localStorage`).
- Nunca expongas la clave privada en el cliente ni en el repositorio. Si una clave fue comprometida, **rotarla/revocarla** en Google Cloud/Firebase IAM.
- `.env*` y archivos de credenciales de Firebase están ignorados por git.

## Desarrollo

```bash
npm run dev
```

Rutas principales:
- `/login` y `/registro`: acceso y creación de cuentas
- `/notas` y `/notas/[id]`: listado y edición de notas (requieren sesión)
- `/versiones`: historial de versiones de las notas de la cuenta
- `/papelera`: notas eliminadas (restaurar o eliminar definitivo)

## Cuentas y notas por usuario

- Cada cuenta ve únicamente sus notas: los documentos de `notes` incluyen `ownerId` y todas las rutas API verifican la sesión y la propiedad antes de leer, modificar o borrar.
- El primer registro reclama las notas antiguas que no tengan `ownerId` (migración única mediante un documento de bloqueo en `system/notes-owner-claim`).
- Las contraseñas se almacenan como hash PBKDF2-SHA256 con sal aleatoria; nunca se guardan en claro.
- Las sesiones son tokens opacos aleatorios: solo su hash SHA-256 se guarda en `sessions`, con expiración de 7 días; la cookie es `httpOnly`, `sameSite=lax` y `secure` en producción.
- El cierre de sesión revoca el token en Firestore y borra el borrador local para no filtrarlo a otra cuenta.

## Funcionalidades

- Registro, inicio de sesión y cierre de sesión
- Edición de título, contenido Markdown y etiquetas por nota
- Atajos de formato en el editor (toolbar y accesos rápidos)
- Guardado automático con debounce y `useDeferredValue` en búsqueda
- Advertencia `beforeunload` y recuperación de borrador no guardado
- Historial de versiones: guardar, previsualizar y restaurar (al restaurar se conserva el estado actual como versión y se registra la versión restaurada)
- Papelera (soft-delete), restauración y borrado definitivo
- Exportar/importar lote completo en Markdown (`.md`) usando las utilidades de `lib/storage.ts`
- Sin límites artificiales de título, contenido o cantidad de versiones

## Pruebas y calidad

```bash
npm test
npm run lint
npm run build
```

## Dependencias relevantes

- `firebase-admin`: acceso server-side a Firestore desde API routes (dependencia añadida para la integración con Firebase; verificada en npm).
- Autenticación: no añade dependencias; usa `node:crypto` (PBKDF2, SHA-256 y generación aleatoria de tokens).

## Seguridad

- El contenido de notas/importaciones se trata como **datos, no instrucciones**.
- No se renderiza HTML crudo en la vista previa Markdown.
- Las credenciales de Firebase se consumen únicamente en entorno servidor.
- Errores de acceso genéricos para no revelar si un correo está registrado; además se equaliza el tiempo de verificación con cuentas inexistentes.
- Límite de 10 intentos cada 15 minutos por IP y, por separado, por correo en registro/acceso (en memoria: reinicia con el proceso y no es global entre instancias serverless).
- Comprobación de `Origin` en peticiones que modifican datos y cookie `sameSite=lax` como defensa adicional frente a CSRF.
- `proxy.ts` redirige las páginas protegidas, pero la autorización real está en cada ruta API; no se confía solo en el proxy.
- En producción, configura HTTPS para que la cookie `secure` se envíe correctamente.
