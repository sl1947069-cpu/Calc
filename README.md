# Calculadora

Réplica de la calculadora estándar de Windows 98 para Android. Es una aplicación web instalable (PWA): funciona sin conexión, sin publicidad y sin seguimiento. No guarda nada: cada vez que se abre comienza en 0 y con la memoria vacía.

Archivos del proyecto: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `service-worker.js` e `icons/` (`icon-192.png`, `icon-512.png`). Todas las rutas son relativas, así que funciona dentro de un subdirectorio como `https://usuario.github.io/calculadora/`. No hace falta modificar ningún código.

## 1. Crear el repositorio en GitHub
1. Entre en https://github.com e inicie sesión (o cree una cuenta gratuita).
2. Pulse **+** (arriba a la derecha) y elija **New repository**.
3. En **Repository name** escriba `calculadora` (en minúsculas).
4. Elija **Public**. No marque ninguna casilla de README, .gitignore ni licencia.
5. Pulse **Create repository**.

## 2. Subir los archivos
1. Descomprima `calculadora.zip`. Dentro hay una carpeta `calculadora`.
2. En la página del repositorio vacío pulse **uploading an existing file**.
3. Abra la carpeta `calculadora` y arrastre **su contenido** (los archivos y la carpeta `icons`), no la carpeta `calculadora` en sí. `index.html` debe quedar en la raíz del repositorio.
4. Compruebe que se ven `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `service-worker.js`, `README.md` y la carpeta `icons` con sus dos PNG.
5. Pulse **Commit changes**.

## 3. Activar GitHub Pages
1. Vaya a **Settings** del repositorio y luego a **Pages**.
2. En **Source** elija **Deploy from a branch**.
3. En **Branch** elija `main` y la carpeta `/ (root)`, y pulse **Save**.
4. Espere 1 o 2 minutos y recargue. Aparecerá la dirección: `https://SU-USUARIO.github.io/calculadora/`.

## 4. Instalar en Android
1. Abra esa dirección en **Google Chrome** y espere a que cargue por completo (así queda guardada para uso sin conexión).
2. Pulse el menú de tres puntos (⋮) y elija **Instalar aplicación** (o **Añadir a la pantalla de inicio**, y luego **Instalar**).
3. Confirme. Aparecerá el icono **Calculadora** en la pantalla de inicio.
4. Ábrala desde el icono: se abre sin barra del navegador y funciona sin Internet.

## 5. Actualizar en el futuro
1. En el repositorio abra el archivo que quiera cambiar, pulse el lápiz, edite y pulse **Commit changes** (o suba el archivo nuevo con **Add file > Upload files**).
2. Abra `service-worker.js` y cambie `const CACHE_VERSION = 'v1';` por `'v2'` (luego `'v3'`, etc.) para que los teléfonos descarguen la versión nueva.
3. Con Internet, abra la aplicación en el teléfono y ciérrela del todo; la siguiente vez que la abra tendrá la versión nueva.

## Notas
- **Botón Cerrar (X):** intenta cerrar la ventana. Android y Chrome normalmente lo impiden en una aplicación instalada, por eso se muestra una pantalla que lo explica y permite volver a abrir la calculadora sin perder los cálculos. Para salir del todo use el botón Atrás o cierre la aplicación desde las aplicaciones recientes.
- **Minimizar** es solo decorativo y **Restaurar** está deshabilitado, como se pidió.
- **Icono:** no se pudo consultar el icono original de CALC.EXE (sin acceso a Internet en el entorno de trabajo). El icono incluido está dibujado en píxeles según la descripción (calculadora turquesa, pantalla y botones grises) y **no está verificado contra el original**. Si dispone del icono real, reemplace `icons/icon-192.png` e `icons/icon-512.png` (mismos nombres) y cambie la versión de caché.
- Para probarla en un ordenador no abra `index.html` con doble clic: el Service Worker requiere `https://` o `http://localhost`.
