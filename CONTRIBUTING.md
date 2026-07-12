# Contribuyendo a KA ESPORTS

Gracias por tu interés en contribuir. Sigue estas pautas para mantener el proyecto ordenado.

## Cómo levantar el proyecto localmente

```bash
npm install
npm run dev
```

## Cómo correr tests

```bash
npm test
```

## Cómo correr lint

```bash
npm run lint
```

## Convención de commits

Usa commits descriptivos en español. Ejemplo:

- `Agrega validación de IDs en el ranking`
- `Corrige cálculo de Glicko-2 para nuevos jugadores`
- `Refactoriza módulo de emparejamientos`

## Estructura del proyecto

- `js/ui/` — Módulos de interfaz de usuario
- `css/` — Estilos y tokens CSS
- `ka-esports/` — Páginas del sitio

## Notas importantes

- No hacer commit de `node_modules/` ni `package-lock.json` — ambos están en `.gitignore`.
