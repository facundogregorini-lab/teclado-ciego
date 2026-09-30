# Teclado Ciego

Aplicación para aprender a escribir sin mirar el teclado, en español. El frontend no requiere compilación: `index.html` contiene las lecciones y la práctica; `scenery.css` y `scenery.js` agregan el diseño y los paisajes de `assets/`; `typists.js` y `typists.css` dibujan (en SVG) los personajes que escriben; `figures.js` y `cognitive.css`, Ninja mental.

## Qué tiene

- **Un lugar tranquilo para practicar:** diseño claro en tonos arena y verde, con paisajes de playa, montaña y bosque. La portada pasa sola de un paisaje a otro (cada 7 segundos, salvo con *movimiento reducido*). El selector elige el fondo de toda la página, también durante la práctica, y lo recuerda en este navegador.
- **Cada grupo es un nivel, de chimpancé a alien:** fila guía = chimpancé, fila superior = bebé, fila inferior = niño, mayúsculas y tildes = indigente y textos = intelectual (la misma escala que la medición de velocidad). Cada nivel muestra a su personaje escribiendo: en gris hasta que empezás, con una barra de lecciones aprobadas y una marca al superarlo (dorada con 3 estrellas en todas). Al superar un nivel, el resultado muestra "¡Nivel chimpancé superado!" con el personaje siguiente. Al final, *La cima*: premio Nobel al aprobar las 26 lecciones y alien con 3 estrellas en todas.

- **26 lecciones en orden:** fila guía, fila superior, fila inferior (con coma y punto), mayúsculas, tildes y textos reales. Cada grupo termina con un repaso.
- **Ejercicios nuevos en cada intento:** repetición de las teclas nuevas, combinaciones y palabras en español que solo usan las letras ya aprendidas.
- **Guía de dedos:** teclado en pantalla con un color por dedo, la próxima tecla iluminada y el dedo que corresponde. Shift con la mano contraria y la tilde antes de la vocal.
- **Tres niveles de ayuda:** teclado visible, solo si me equivoco u oculto.
- **Medición:** palabras por minuto, precisión, tiempo y las teclas con más errores. Una estrella con 90% de precisión, dos con 95% y tres si además se llega a la velocidad meta del grupo.
- **Velocidad según cómo escribís:** mediciones de 1 minuto con textos reales eligiendo el método (*mirando el teclado*, *híbrido* o *a ciegas*), sin ayuda en pantalla. Cada método muestra su última medición, su mejor marca y cuánto cambió desde la primera. Un gráfico (o tabla) muestra la evolución en el tiempo y compara a ciegas con mirando: "A ciegas ya llegás al 77% de tu velocidad mirando el teclado".
- **¿Cómo quién escribís?** En la medición de velocidad, un personaje escribe en vivo a tu ritmo y al final te dice a quién te parecés, en una escala de evolución: chimpancé, bebé, niño, indigente, intelectual, premio Nobel y alien. Te compara con la mediana (40 palabras por minuto, con un porcentaje aproximado de gente más lenta) y hace chistes, sobre todo si vas despacio ("estás en la media de un chimpancé").
- **Desafiá a tus amigos:** después de medir (o desde *Mi progreso*) mandás un enlace por WhatsApp o email, o lo copiás. Quien lo abre ve "ana te desafía: 42 palabras por minuto a ciegas", acepta y al terminar sabe si ganó y puede mandar la revancha. La marca viaja en el enlace (`?de=ana&ppm=42&metodo=ciegas`); no se guarda nada en el servidor.
- **Ranking:** todas las cuentas, por avance (lecciones aprobadas y estrellas), por velocidad (mejor medición) y por el desafío de 3 minutos de Ninja mental. Se ve sin cuenta; para aparecer hay que entrar. Muestra el top 50 y tu lugar. Las mediciones de más de 250 palabras por minuto no cuentan.
- **Tildes en cualquier teclado:** la tilde con tecla muerta (´ y después la vocal) funciona también en Safari en Mac, cuando el foco no está en el texto y cuando el teclado manda la marca y la vocal por separado. En Mac con teclado en inglés se usa Option + E y la vocal, y el menú de mantener apretada la vocal no cuenta como error. Si la tilde no sale, aparece una ayuda con el botón *Aceptar vocales sin tilde*; la opción *Tildes opcionales* también está en las preferencias.
- **Distribución** latinoamericana o de España. La computadora tiene que tener el teclado configurado en español.

Sin cuenta, el progreso se guarda en el navegador (`localStorage`).

## Ninja mental (tests de razonamiento de entrevistas)

Desde **🥷 Ninja mental** en el header, al lado del nombre de la app (o `/#ninja`), se entrena para los tests de razonamiento abstracto que usan muchas empresas en sus procesos de selección, tomando como referencia los de [AssessmentDay](https://www.assessmentday.com/). Por ahora, solo con figuras abstractas:

- **Series:** ¿qué figura sigue? Las figuras cambian paso a paso (giran, se mueve un punto, se suman figuras, cambia el relleno o la forma).
- **Matrices:** ¿qué completa la grilla de 3×3? Las reglas van por fila, por columna o con cada valor una vez en cada fila y columna.
- **La distinta:** cuatro figuras comparten una regla y una no (forma, relleno, cantidad par o impar, cantidad igual a los lados o flechas que apuntan al punto).

El diseño es el mismo que el de las lecciones: 5 niveles de dificultad, cada uno con su personaje (chimpancé, bebé, niño, indigente, intelectual) y 3 sesiones de 6 preguntas con tiempo. Se aprueba con 4 de 6, y 6 de 6 da 3 estrellas. Después de cada respuesta se muestra la correcta y la explicación de la regla. *La cima* es el **simulacro de entrevista**: 11 preguntas mezcladas en 11 minutos (como el test gratis de AssessmentDay), sin ayuda hasta el final, que te dice a quién te parecés y repasa los errores. Premio Nobel al aprobar las 15 sesiones y alien con 3 estrellas en todas.

**Desafío de 3 minutos:** series una tras otra, cada 3 aciertos sube la dificultad (de 1 a 5). Cada acierto suma su dificultad y el total se multiplica por la efectividad (aciertos / respondidas). Con ese puntaje se estima un IQ ninja: `85 + 22 × ln(1 + puntos / 4)`, entre 70 y 160, aclarando que es un juego y no un test de IQ real. Los personajes van por IQ: menos de 115 es chimpancé ("que nunca se enteren en el trabajo"), después bebé (115), niño (125), indigente (130), intelectual (135), premio Nobel (140) y alien (150). Tiene su ranking (el mejor puntaje de cada cuenta, en la sección y en la pestaña *Ninja* del ranking general) y se puede desafiar a amigos por WhatsApp o email como en la medición de velocidad (`?de=ana&ninja=34#ninja`).

Las preguntas se generan al azar en `figures.js`, dibujadas en SVG, y cada una tiene una sola respuesta correcta. El avance se guarda en el navegador y en la cuenta (`cog` y `sims` en `api/data.js`). Cada sesión cuenta como una práctica del plan gratis.

## Plan Ilimitado (freemium)

El botón **✦ Mejorar suscripción** del header, a la izquierda del usuario, se ve siempre, con o sin cuenta. Abre el plan; si los pagos todavía no están configurados, avisa que el plan está en camino y que por ahora todo es gratis.


- **Gratis:** 3 prácticas por día (hora de Argentina), con o sin cuenta. Una práctica es una lección o una medición y cuenta desde la primera tecla: abrir una lección y salir no la usa.
- **Ilimitado:** prácticas sin límite, con una suscripción mensual de **Mercado Pago**, que cobra sola cada mes. Se cancela desde Mercado Pago y el acceso sigue hasta el fin del período pago.

Mientras no estén configuradas las variables de Mercado Pago, la app no tiene límites. Para los invitados el límite se cuenta en el navegador (alguien con conocimientos técnicos podría saltearlo); para las cuentas lo lleva el servidor.

### Configurar Mercado Pago en Vercel

1. En [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app) creá una aplicación (producto: *Suscripciones*) y copiá el **Access Token de producción**. Para probar sin cobrar, usá primero el de prueba con usuarios de prueba.
2. En Vercel → **Settings → Environment Variables** agregá:
   - `MP_ACCESS_TOKEN`: el Access Token.
   - `MP_PRICE`: el monto mensual **en pesos** (Mercado Pago Argentina cobra suscripciones en ARS).
   - `PRICE_LABEL` (opcional): el texto del precio en pantalla. Por defecto, `US$ 5 por mes`.
   - `TECLADO_PREMIUM_USERS` (opcional): usuarios con el plan de cortesía, separados por comas.
3. En la aplicación de Mercado Pago, en **Webhooks**, cargá `https://TU-DOMINIO/api/mercadopago` con el evento **Planes y suscripciones**. Sin el webhook igual funciona: el plan se revisa al volver del pago y cuando está por vencer.
4. **Redeploy.**

Para cobrar de forma comercial, Vercel exige el plan **Pro** y en Argentina corresponde estar inscripto en ARCA y facturar.

## Cuentas

Con **Entrar** cada persona crea un usuario y contraseña. Desde ahí se guardan en el servidor las lecciones, las estrellas, las mediciones de velocidad por método, las preferencias (distribución y ayuda del teclado) y cada sesión de práctica (fecha, lección, palabras por minuto, precisión y tiempo; las últimas 100). En **tu cuenta** se ven las estadísticas y las últimas sesiones.

- Al crear la cuenta o entrar, lo practicado en ese navegador se suma a la cuenta (se queda el mejor resultado de cada lección).
- Al cerrar sesión, el navegador vuelve a empezar de cero; el progreso queda en la cuenta.
- Las contraseñas se guardan con `scrypt` y salt. Las sesiones duran 30 días y hay un límite de 10 intentos fallidos cada 15 minutos por usuario.

El servidor son funciones de Vercel en `api/` (`auth.js`, `data.js`, `ranking.js`, `billing.js` y `mercadopago.js`) y los datos van a una base Redis. Los rankings son *sorted sets* (`rank:progress`, `rank:speed` y `rank:ninja`) que se actualizan cada vez que se guarda el progreso; las cuentas anteriores entran al ranking la próxima vez que abren la app. El nombre de usuario es público en el ranking.

### Configurar la base de datos en Vercel

1. En el proyecto de Vercel, abrí **Storage → Create Database** (o **Marketplace**) y elegí **Upstash for Redis** (plan gratuito).
2. Conectala al proyecto. Vercel agrega solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN` (también sirven `UPSTASH_REDIS_REST_URL`/`_TOKEN`, esos nombres con prefijo, o un `REDIS_URL`).
3. Volvé a desplegar (**Deployments → Redeploy**) para que las funciones tomen las variables.

Si falta la base, la práctica funciona igual sin cuenta y el formulario avisa qué falta.

## Desarrollo

- `npm run dev` levanta el sitio y la API en http://127.0.0.1:3000 con una base en memoria.
- `npm test` prueba en Chromium: la portada que cambia sola, crear cuenta, practicar y evolucionar de nivel, las tildes en Mac y Safari, medir la velocidad y ver a quién te parecés, el ranking, los desafíos por WhatsApp y email, Ninja mental (series, matrices, la distinta, el simulacro, el desafío de 3 minutos con su ranking y sus desafíos), entrar desde otro navegador y cerrar sesión. Después corre `tests/billing.cjs` (también suelto con `npm run test:billing`): el límite de 3 prácticas y la suscripción contra un Mercado Pago simulado.

## Publicar en Vercel

Importá el repo en Vercel (**Add New → Project**) sin configurar nada y conectá la base de datos como se explica arriba.
