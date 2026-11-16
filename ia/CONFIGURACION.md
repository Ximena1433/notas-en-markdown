# Configuración y Barreras de Seguridad - Notas Markdown

## 1. Reglas de proyecto (AGENTS.md)
- **Riesgo cubierto:** Modificaciones de código no estructuradas, uso de tipos inseguros (`any`) y saltos en la arquitectura de componentes del editor.
- **Límites:** Orientan al modelo de IA pero no bloquean por sistema operativo por sí solas; se complementan con el sandbox.

## 2. Permisos y Secretos (.claude/settings.json)
- **Riesgo cubierto:** Lectura accidental o maliciosa de credenciales de entorno (`.env.local`) o salida del directorio de trabajo al gestionar archivos de notas locales.
- **Ajustes:** Bloqueo explícito de patrones ` Read(**/.env*)` y activación estricta de `blockReadsOutsideWorkingDirectories: true`[cite: 2].

## 3. Scripts de Calidad Automática (`npm run check`)
- **Riesgo cubierto:** Inyección de código roto, fallos en TypeScript o regressions en la lógica de historial de versiones.
- **Ajustes:** Encadenamiento de `tsc --noEmit`, `eslint`, `prettier` y `vitest run --coverage` (exigiendo $\ge 80\%$ en lógica de negocio)[cite: 3].