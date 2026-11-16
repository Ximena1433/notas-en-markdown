This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Pruebas

```bash
npm test
npm run test:watch
```

Se añadió `vitest` como dependencia de desarrollo para probar la lógica pura de notas y versiones sin necesidad de un navegador. Se eligió la rama `4.1.x` porque es compatible con `@types/node@^20`, que ya usa el proyecto.

### Dependencias de interfaz y pruebas

- `react-markdown`: renderiza la vista previa con CommonMark. No interpreta HTML crudo por defecto, lo que evita inyecciones en el contenido de las notas.
- `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event` y `@testing-library/jest-dom`: pruebas de componentes centradas en el comportamiento accesible y la interacción real del usuario.
- `jsdom@29.1.1`: entorno DOM para Vitest, compatible con Node 22.16.
- `@vitejs/plugin-react@6.3.0`: transformación JSX de los componentes durante las pruebas con Vite 8.
- `axe-core`: auditoría automática de accesibilidad en las pruebas de componente.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
