# Teclado Ciego

Aplicación para aprender a escribir sin mirar el teclado, en español. Es un solo archivo (`index.html`), sin compilación ni dependencias.

## Qué tiene

- **26 lecciones en orden:** fila guía, fila superior, fila inferior (con coma y punto), mayúsculas, tildes y textos reales. Cada grupo termina con un repaso.
- **Ejercicios nuevos en cada intento:** repetición de las teclas nuevas, combinaciones y palabras en español que solo usan las letras ya aprendidas.
- **Guía de dedos:** teclado en pantalla con un color por dedo, la próxima tecla iluminada y el dedo que corresponde. Shift con la mano contraria y la tilde antes de la vocal.
- **Tres niveles de ayuda:** teclado visible, solo si me equivoco u oculto.
- **Medición:** palabras por minuto, precisión, tiempo y las teclas con más errores. Una estrella con 90% de precisión, dos con 95% y tres si además se llega a la velocidad meta del grupo.
- **Prueba de 1 minuto** con refranes y textos variados.
- **Distribución** latinoamericana o de España. La computadora tiene que tener el teclado configurado en español.

Sin cuenta, el progreso se guarda en el navegador (`localStorage`).

## Cuentas

Con **Entrar** cada persona crea un usuario y contraseña. Desde ahí se guardan en el servidor las lecciones, las estrellas, la mejor prueba, las preferencias (distribución y ayuda del teclado) y cada sesión de práctica (fecha, lección, palabras por minuto, precisión y tiempo; las últimas 100). En **tu cuenta** se ven las estadísticas y las últimas sesiones.

- Al crear la cuenta o entrar, lo practicado en ese navegador se suma a la cuenta (se queda el mejor resultado de cada lección).
- Al cerrar sesión, el navegador vuelve a empezar de cero; el progreso queda en la cuenta.
- Las contraseñas se guardan con `scrypt` y salt. Las sesiones duran 30 días y hay un límite de 10 intentos fallidos cada 15 minutos por usuario.

El servidor son dos funciones de Vercel en `api/` (`auth.js` y `data.js`) y los datos van a una base Redis.

### Configurar la base de datos en Vercel

1. En el proyecto de Vercel, abrí **Storage → Create Database** (o **Marketplace**) y elegí **Upstash for Redis** (plan gratuito).
2. Conectala al proyecto. Vercel agrega solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN` (también sirven `UPSTASH_REDIS_REST_URL`/`_TOKEN`, esos nombres con prefijo, o un `REDIS_URL`).
3. Volvé a desplegar (**Deployments → Redeploy**) para que las funciones tomen las variables.

Si falta la base, la práctica funciona igual sin cuenta y el formulario avisa qué falta.

## Desarrollo

- `npm run dev` levanta el sitio y la API en http://127.0.0.1:3000 con una base en memoria.
- `npm test` prueba en Chromium: crear cuenta, practicar, entrar desde otro navegador, contraseña incorrecta y cerrar sesión.

## Publicar en Vercel

Importá el repo en Vercel (**Add New → Project**) sin configurar nada y conectá la base de datos como se explica arriba.
