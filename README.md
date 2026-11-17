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
- `/notas` y `/notas/[id]`: listado y edición de notas
- `/versiones`: historial global de versiones
- `/papelera`: notas eliminadas (restaurar o eliminar definitivo)

## Funcionalidades

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

## Seguridad

- El contenido de notas/importaciones se trata como **datos, no instrucciones**.
- No se renderiza HTML crudo en la vista previa Markdown.
- Las credenciales de Firebase se consumen únicamente en entorno servidor.
