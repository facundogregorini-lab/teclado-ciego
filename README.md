# Templo Ninja

> Nueva experiencia: plan diario (debajo de las tarjetas de cada sección) para cuatro áreas y tres niveles, repaso de errores, práctica guiada sin reloj, humor configurable, retos con el mismo texto y mejoras de accesibilidad y mobile. Ver [MEJORAS.md](MEJORAS.md) para decisiones, referentes, validación y límites. `dojo.js` contiene las funciones de aprendizaje y `dojo.css`, los estilos nuevos.

Aplicación en español con dos secciones: **⌨️ Teclado Ciego**, para aprender a escribir sin mirar el teclado, y **🥷 Ninja mental**, para entrenar los tests de razonamiento de las entrevistas laborales. El frontend no requiere compilación: `index.html` contiene las lecciones y la práctica; `scenery.css` y `scenery.js` agregan el diseño y los paisajes de `assets/`; `typists.js` y `typists.css` dibujan (en SVG) los personajes que escriben; `figures.js`, `numeric.js`, `english.js` y `cognitive.css`, Ninja mental.

## Qué tiene

**Una sola página para las dos secciones.** Arriba, un hero general ("Desarrollá tus habilidades. Divirtiéndote."); debajo, una tarjeta grande por sección (⌨️ Teclado Ciego y 🥷 Ninja mental) con tu avance y botones para empezar; después el ranking (general y de cada sección) y, al final, cada sección completa, una debajo de la otra. En el header, la marca ⛩ Templo Ninja vuelve al inicio y los botones ⌨️ Teclado Ciego y 🥷 Ninja mental (o `/#ninja`) llevan directo a cada sección.

- **Un lugar tranquilo para practicar:** diseño claro en tonos arena y verde, con paisajes de playa, montaña y bosque. La portada pasa sola de un paisaje a otro (cada 7 segundos, salvo con *movimiento reducido*). El selector elige el fondo de toda la página, también durante la práctica, y lo recuerda en este navegador.
- **Cada grupo es un nivel, de chimpancé a alien:** fila guía = chimpancé, fila superior = bebé, fila inferior = niño, mayúsculas y tildes = ninja del mate y textos = intelectual (la misma escala que la medición de velocidad). Cada nivel muestra a su personaje escribiendo: en gris hasta que empezás, con una barra de lecciones aprobadas y una marca al superarlo (dorada con 3 estrellas en todas). Al superar un nivel, el resultado muestra "¡Nivel chimpancé superado!" con el personaje siguiente. Al final, *La cima*: premio Nobel al aprobar las 26 lecciones y alien con 3 estrellas en todas.

- **26 lecciones en orden:** fila guía, fila superior, fila inferior (con coma y punto), mayúsculas, tildes y textos reales. Cada grupo termina con un repaso.
- **Ejercicios nuevos en cada intento:** repetición de las teclas nuevas, combinaciones y palabras en español que solo usan las letras ya aprendidas.
- **Guía de dedos:** teclado en pantalla con un color por dedo, la próxima tecla iluminada y el dedo que corresponde. Shift con la mano contraria y la tilde antes de la vocal.
- **Tres niveles de ayuda:** teclado visible, solo si me equivoco u oculto.
- **Medición:** palabras por minuto, precisión, tiempo y las teclas con más errores. Una estrella con 90% de precisión, dos con 95% y tres si además se llega a la velocidad meta del grupo.
- **Velocidad según cómo escribís:** mediciones de 1 minuto con textos reales eligiendo el método (*mirando el teclado*, *híbrido* o *a ciegas*), sin ayuda en pantalla. Cada método muestra su última medición, su mejor marca y cuánto cambió desde la primera. Un gráfico (o tabla) muestra la evolución en el tiempo y compara a ciegas con mirando: "A ciegas ya llegás al 77% de tu velocidad mirando el teclado".
- **¿Cómo quién escribís?** En la medición de velocidad, un personaje escribe en vivo a tu ritmo y al final te dice a quién te parecés, en una escala de evolución: chimpancé, bebé, niño, ninja del mate, intelectual, premio Nobel y alien. Te compara con la mediana (40 palabras por minuto, con un porcentaje aproximado de gente más lenta) y hace chistes, sobre todo si vas despacio ("estás en la media de un chimpancé"). El entrenador también hace bromas según tu precisión; se pueden desactivar.
- **Desafiá a tus amigos:** después de medir (o desde *Mi progreso*) mandás un enlace por WhatsApp o email, o lo copiás. Quien lo abre ve "ana te desafía: 42 palabras por minuto a ciegas", acepta y al terminar sabe si ganó y puede mandar la revancha. La marca viaja en el enlace (`?de=ana&ppm=42&metodo=ciegas`), junto con `texto`, `precision` y `tildes` para las mediciones nuevas; no se guarda nada en el servidor.
- **Ranking:** todas las cuentas. El **general** suma estrellas de las lecciones + estrellas de Ninja mental + mejor velocidad (ppm) + mejor puntaje del desafío. Además, uno por sección: Teclado Ciego (avance y velocidad) y Ninja mental (avance y desafío de 5 minutos). Se ve sin cuenta; para aparecer hay que entrar. Muestra el top 50 y tu lugar. Las mediciones de más de 250 palabras por minuto no cuentan.
- **Tu nombre en el ranking:** en *Tu cuenta* cada persona elige cómo aparece (en el ranking, el header y los desafíos), con 3 a 24 letras, números, espacios, puntos o guiones; vacío, vuelve a mostrar el usuario. Para entrar se sigue usando el usuario, que no cambia. El nombre se guarda en `display:<usuario>` y se reserva en `alias:<clave>` (sin tildes, mayúsculas, espacios ni signos): dos cuentas no pueden mostrar el mismo nombre, ni el usuario de otra persona, ni el de un rival (`POST /api/auth {action: 'display', display}`).
- **🤖 Rivales del dojo:** diez bots de práctica (`api/_rivals.js`), de Kenta, el aprendiz, al Maestro Hattori, en todos los rankings para que siempre haya a quién superar. Siempre se muestran como bots ("🤖 rival del dojo", borde punteado y la aclaración debajo de la lista) y nunca como personas: no cuentan en el total de personas, aunque sí en tu posición. La API los marca con `rival: true` y un id `rival:<nombre>` que no puede ser un usuario.
- **Tildes en cualquier teclado:** la tilde con tecla muerta (´ y después la vocal) funciona también en Safari en Mac, cuando el foco no está en el texto y cuando el teclado manda la marca y la vocal por separado. En Mac con teclado en inglés se usa Option + E y la vocal, y el menú de mantener apretada la vocal no cuenta como error. Si la tilde no sale, aparece una ayuda con el botón *Aceptar vocales sin tilde*; la opción *Tildes opcionales* también está en las preferencias.
- **Distribución** latinoamericana o de España. La computadora tiene que tener el teclado configurado en español.

Sin cuenta, el progreso se guarda en el navegador (`localStorage`).

## Ninja mental (tests de razonamiento de entrevistas)

Desde **🥷 Ninja mental** en el header, al lado del nombre de la app (o `/#ninja`), se entrena para los tests que usan muchas empresas en sus procesos de selección, tomando como referencia los de [AssessmentDay](https://www.assessmentday.com/). Tiene tres pistas, cada una con el mismo diseño que las lecciones: 5 niveles de dificultad con su personaje (chimpancé, bebé, niño, ninja del mate, intelectual), 3 tipos de ejercicio por nivel, sesiones con tiempo, un simulacro y *La cima* (premio Nobel al aprobar las 15 sesiones de la pista, alien con 3 estrellas en todas).

- **🔷 Figuras abstractas** (`figures.js`, generadas al azar): series (¿qué figura sigue?), matrices de 3×3 y la figura distinta. Simulacro: 11 preguntas en 11 minutos.
- **📊 Razonamiento numérico** (`numeric.js`, generado al azar): tablas y gráficos de barras de ventas (diferencias, promedios, variaciones, participaciones, razones, monedas, proyecciones y puntos porcentuales) y problemas de porcentajes (descuentos, IVA, aumentos seguidos, márgenes). Las opciones incorrectas salen de los errores típicos (dividir por la base equivocada, sumar porcentajes, correr la coma). Simulacro: 10 preguntas en 15 minutos.
- **🇬🇧 Inglés para el trabajo** (`english.js`, banco escrito a mano, niveles A2 a C1): comprensión de textos de trabajo con *True / False / Cannot say*, conectores para unir oraciones y ordenar oraciones en un párrafo. Cada ítem explica su respuesta en español. Simulacro: 12 preguntas en 12 minutos.

**Aprender con técnicas:** cada pregunta muestra un 💡 *Técnica* para resolver ese tipo de caso (sin revelar la respuesta). Al responder aparece la explicación (en numérico, la cuenta completa) y, si corresponde, un *Para la próxima* con la técnica específica de la regla que se usó. Cada pista tiene una guía de técnicas por tipo de ejercicio. En los simulacros y el desafío de 5 minutos no hay tips, como en un test real; el repaso del simulacro muestra la técnica de cada error.

**Desafío de 5 minutos:** preguntas de las tres pistas que se van alternando (figuras, números e inglés: los 9 tipos de ejercicio), y cada 3 aciertos sube la dificultad (de 1 a 5). Cada acierto suma su dificultad y el total se multiplica por la efectividad (aciertos / respondidas). Con ese puntaje se estima un IQ ninja: `85 + 22 × ln(1 + puntos / 4)`, entre 70 y 160, aclarando que es un juego y no un test de IQ real. Los personajes van por IQ: menos de 115 es chimpancé ("que nunca se enteren en el trabajo"), después bebé (115), niño (125), ninja del mate (130), intelectual (135), premio Nobel (140) y alien (150). Tiene su ranking (el mejor puntaje de cada cuenta, en la sección y en la pestaña *Ninja* del ranking general) y se puede desafiar a amigos por WhatsApp o email como en la medición de velocidad (`?de=ana&reto=<partida>#ninja`).

**Sin trampas en el desafío.** El desafío lo corre el servidor (`api/ninja.js`): genera cada pregunta con los mismos generadores de la página, la manda sin respuesta ni explicación, guarda la respuesta correcta y el reloj (5 minutos, con 4 segundos de gracia) y calcula el puntaje. La página sólo manda la opción elegida, así que no se puede leer la respuesta del código ni inventar un puntaje: lo que el navegador manda como "mejor marca" en el progreso se ignora y el ranking ninja sólo toma partidas corregidas por el servidor (al publicar esto, las marcas anteriores salen del ranking una única vez). El enlace de desafío apunta a la partida guardada y el servidor dice su puntaje; un enlace viejo con el puntaje en la URL es sólo una invitación. Además, cada respuesta lleva cómo se dio (teclado o puntero, si el navegador vio un evento real, si la página tenía el foco, cuánto se movió el puntero y cuánto saltó para hacer clic). Una partida no cuenta para el ranking ni para desafiar si tiene una señal fuerte (clics generados por un programa; el puntero que salta directo a la respuesta sin recorrer la pantalla en la mitad o más de los clics; clics con la página sin foco) o dos señales débiles juntas (ritmo de respuesta demasiado parejo; precisión de 95% o más en la dificultad máxima; textos en inglés resueltos en menos de 2,5 segundos). Se muestra igual el resultado, con el aviso "Esta partida no cuenta para el ranking" y el motivo. Sin conexión con el servidor se puede jugar, pero tampoco cuenta.

Las figuras y los ejercicios numéricos se generan al azar y cada pregunta tiene una sola respuesta correcta. El avance se guarda en el navegador y en la cuenta (`cog` y `sims` en `api/data.js`). Cada sesión cuenta como una práctica del plan gratis.

## Ayudanos a mejorar (comentarios a los monjes)

Un monje caricaturizado (SVG en `monk.js`, estilos en `monk.css`) asoma desde el borde derecho de la pantalla, medio escondido. Al pasar el mouse o con el foco del teclado sale entero y dice *Ayudanos a mejorar*. Al hacer clic abre un diálogo lúdico: elegís cómo te sentís (😖 a 🤩, y el monje cambia de cara y te responde), sobre qué escribís (💡 idea, 🐞 algo no anda, ❤️ algo que me gusta, 🗨️ otra cosa) y tu mensaje (hasta 1000 caracteres, se envía también con Ctrl/⌘ + Enter). Con cuenta podés firmarlo con tu nombre visible. Al enviar, el pergamino vuela, el monje hace una reverencia y vibra el gong (es animación, sin sonido).

Para que no moleste: es chico y queda pegado al borde; desaparece durante las lecciones y los ejercicios, y en el celular mientras está abierto el teclado; se puede esconder desde el diálogo (el link *🙏 Ayudanos a mejorar* del pie de página lo sigue abriendo); muestra una sola vez por navegador una burbuja de aviso (a los 25 segundos en el inicio, se va sola); funciona con el teclado (Escape cierra) y respeta *movimiento reducido*.

`api/feedback.js` guarda los mensajes en la lista `feedback` de Redis (los últimos 2000), con un límite de 6 por hora por conexión y un campo trampa para bots. **Para leerlos:** `/comentarios.html` (no se indexa) pide la clave de la variable `FEEDBACK_KEY`, que hay que agregar en Vercel (cualquier texto largo y secreto) y hacer Redeploy. Muestra un resumen (total, última semana, ánimo promedio y cantidad por tipo), filtros, búsqueda y descarga en CSV. PostHog recibe `feedback_opened` y `feedback_sent` (ánimo, tipo y largo, nunca el texto).

## Aporte al templo (freemium con pago único)

El botón **✦ Apoyá el templo** del header, a la izquierda del usuario, se ve siempre, con o sin cuenta (con acceso ilimitado dice **✦ Ninja ilimitado**). Abre el plan; si los pagos todavía no están configurados, avisa que el acceso ilimitado está en camino y que por ahora todo es gratis.

- **Gratis:** 3 prácticas por día sin cuenta y 6 con una cuenta gratis (hora de Argentina). Al quedarse sin prácticas, un invitado ve primero la opción de crear su cuenta gratis y seguir; el aporte queda como segunda opción. Una práctica es una lección, una medición, una sesión o un desafío y cuenta desde la primera respuesta: abrir y salir no la usa.
- **Acceso ilimitado para siempre:** un único pago con **Mercado Pago** (Checkout Pro), sin suscripción ni débitos automáticos: "Tu pequeño aporte al templo nos permite mejorar el entrenamiento semana a semana. Los monjes ninja te lo agradecerán 🙏". Precio de lanzamiento: $ 4.900. Queda guardado en `paid:<usuario>` y no vence. Las suscripciones mensuales de antes siguen valiendo hasta el final de su período pago.

Mientras no estén configuradas las variables de Mercado Pago, la app no tiene límites. Para los invitados el límite se cuenta en el navegador (alguien con conocimientos técnicos podría saltearlo); para las cuentas lo lleva el servidor.

### Píxel de Meta (anuncios)

La app carga el Píxel de Meta **Templo Ninja Web** (`2167285730522630`, el ID llega desde `/api/billing`) y manda estos eventos. Con la variable `META_PIXEL_ID` en Vercel se usa otro pixel, y con `META_PIXEL_ID=off` no se carga nada.

| Evento | Cuándo |
| --- | --- |
| `PageView` | Al abrir la app. |
| `CompleteRegistration` | Al crear una cuenta. |
| `Practica` (personalizado) | Al empezar una práctica (primera tecla o primera respuesta), con `seccion`: `teclado-ciego` o `ninja-mental`, y `desafio` si es el de 5 minutos. |
| `InitiateCheckout` | Al ir a pagar el aporte, con el precio. |
| `Purchase` | Al volver de Mercado Pago con el pago aprobado (una vez por navegador). |

Con `META_CAPI_TOKEN` (token de la API de conversiones, en el Administrador de eventos → el píxel → Configuración), el servidor también informa cada `Purchase` la primera vez que ve el pago aprobado (webhook o vuelta del pago). Usa el mismo `event_id` que el navegador (`pay_<id del pago>`), así Meta lo cuenta una sola vez, y le pasa el monto, las cookies `_fbp`/`_fbc` (viajan en la metadata del pago), el navegador y el usuario cifrado con SHA-256. Opcional: `META_GRAPH_VERSION` (por defecto `v23.0`).

### Analítica de producto (PostHog y Vercel)

`analytics.js` (en `index.html` y `precios.html`) carga **Vercel Web Analytics y Speed Insights** (los scripts los sirve Vercel en `/_vercel/…` cuando están activados en el proyecto) y **PostHog** (proyecto 642163, región US) con páginas vistas automáticas, autocapture y grabación de sesiones con todos los campos de texto ocultos. PostHog va por `/ingest`, un rewrite de `vercel.json` hacia `us.i.posthog.com`, para que no lo frenen los bloqueadores de anuncios. La Project API key es pública y está en el código. En copias locales (`localhost`, `127.0.0.1`) no se carga nada: los eventos quedan en `window.tnEvents` para los tests.

| Evento | Dónde se dispara | Propiedades |
| --- | --- | --- |
| `$pageview`, `$autocapture`, grabación | Automáticos de PostHog. | UTM de la visita, dispositivo, etc. |
| `practice_started` | `countPractice()`: primera tecla o primera respuesta de una práctica (lo mismo que cuenta para el límite). | `section`, `kind` (`leccion`, `repaso`, `medicion`, `sesion`, `simulacro`, `desafio-5-min`), `lesson`, `method`, `track`, `difficulty`, `guided`, `free_left`. |
| `practice_completed` | `finish()`, `finishQuiz()` y `finishNinja()`. | Las de arriba más `wpm` y `accuracy` (teclado), `correct`, `questions`, `stars`, `score`, `iq`, `flagged`, `duration_ms`. |
| `pricing_viewed` | `showPlan()`: botón ✦ del header, nota del plan gratis, límite diario o botón del plan diario. | `reason` (`upgrade` o `limit`), `payments_on`, `premium`, `logged_in`, `used_today`. |
| `checkout_clicked` | Botón de pagar del diálogo del plan (también sin cuenta, antes de pedirla). | `logged_in`, `price`, `currency`. |
| `checkout_started` / `checkout_error` | Al recibir el link de Mercado Pago, justo antes de ir / si falla. | `provider` / `status`. |
| `payment_succeeded` | **Servidor** (`api/_billing.js`), la primera vez que ve un pago aprobado (vuelta del pago o webhook). | `value`, `currency`, `provider`, `source: server`. |
| `payment_pending` / `payment_failed` | Al volver de Mercado Pago sin pago aprobado (`?aporte=ok` todavía sin confirmar / `?aporte=error`). | `status`. |
| `signup_prompt_clicked` | Botones *Crear cuenta gratis* / *Ya tengo cuenta* del diálogo del plan (invitados sin prácticas o desde el botón del plan). | `mode` (`register` o `login`), `used_today`. |
| `signed_up` / `logged_in` | Al crear la cuenta / entrar. | `source`: `plan` si vino del diálogo del plan, `account` si no. |
| `challenge_accepted` | Botón *Aceptar* de un desafío recibido. | `kind`, `has_score`. |

Con cuenta, `posthog.identify()` usa el nombre de usuario (es el id de la cuenta; la app no pide email) y la propiedad `plan` (`gratis` o `ilimitado`). Al salir, `posthog.reset()`. Nunca se mandan contraseñas, emails ni datos de pago.

**Leer métricas:** `node scripts/posthog-query.cjs funnel` (también `events`, `sources` o cualquier consulta HogQL entre comillas; `DAYS=30` cambia el período). Usa `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID` y `POSTHOG_HOST` del entorno, con `api/_posthog.js`; la personal key nunca llega a la página. Variables en `.env.example`. Para las grabaciones, en PostHog tiene que estar activado *Settings → Session replay → Record user sessions*.

### Configurar Mercado Pago en Vercel

1. En [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app) creá una aplicación (producto: *Checkout Pro*) y copiá el **Access Token de producción**. Para probar sin cobrar, usá primero el de prueba con usuarios de prueba.
2. En Vercel → **Settings → Environment Variables** agregá:
   - `MP_ACCESS_TOKEN`: el Access Token.
   - `MP_PRICE`: el monto del pago único **en pesos**, por ejemplo `4900`.
   - `PRICE_LABEL` (opcional): el texto del precio en pantalla. Por defecto, `$ 4.900 · pago único` (sale de `MP_PRICE`). Si cambiás el precio, actualizá también `precios.html`.
   - `TECLADO_PREMIUM_USERS` (opcional): usuarios con acceso de cortesía, separados por comas.
3. La app le pasa a Mercado Pago la dirección del webhook (`https://TU-DOMINIO/api/mercadopago`) en cada pago, así que no hace falta configurarlo. Si querés, cargalo también en **Webhooks** con el evento **Pagos**. Sin el webhook igual funciona: el pago se busca al volver de Mercado Pago.
4. **Redeploy.**

Para cobrar de forma comercial, Vercel exige el plan **Pro** y en Argentina corresponde estar inscripto en ARCA y facturar.

## Cuentas

Con **Entrar** cada persona crea un usuario y contraseña. Desde ahí se guardan en el servidor las lecciones, las estrellas, las mediciones de velocidad por método, las preferencias (distribución y ayuda del teclado) y cada sesión de práctica (fecha, lección, palabras por minuto, precisión y tiempo; las últimas 100). En **tu cuenta** se ven las estadísticas y las últimas sesiones.

- Al crear la cuenta o entrar, lo practicado en ese navegador se suma a la cuenta (se queda el mejor resultado de cada lección).
- Al cerrar sesión, el navegador vuelve a empezar de cero; el progreso queda en la cuenta.
- Las contraseñas se guardan con `scrypt` y salt. Las sesiones duran 30 días y hay un límite de 10 intentos fallidos cada 15 minutos por usuario.

El servidor son funciones de Vercel en `api/` (`auth.js`, `data.js`, `ninja.js`, `ranking.js`, `billing.js` y `mercadopago.js`) y los datos van a una base Redis. Los rankings son *sorted sets* (`rank:general`, `rank:progress`, `rank:speed`, `rank:cog` y `rank:ninja`) que se actualizan cada vez que se guarda el progreso; las cuentas anteriores entran al ranking la próxima vez que abren la app. El nombre de usuario es público en el ranking.

### Configurar la base de datos en Vercel

1. En el proyecto de Vercel, abrí **Storage → Create Database** (o **Marketplace**) y elegí **Upstash for Redis** (plan gratuito).
2. Conectala al proyecto. Vercel agrega solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN` (también sirven `UPSTASH_REDIS_REST_URL`/`_TOKEN`, esos nombres con prefijo, o un `REDIS_URL`).
3. Volvé a desplegar (**Deployments → Redeploy**) para que las funciones tomen las variables.

Si falta la base, la práctica funciona igual sin cuenta y el formulario avisa qué falta.

## Precios, legales y demo

- `precios.html`, `terminos.html`, `privacidad.html` y `reembolsos.html` (con `legal.css`) son las páginas de precios y legales, enlazadas desde el pie de la app y desde el diálogo del plan. Cada una tiene un resumen en inglés. El email de contacto es info@tecladociego.com.
- `demo/teclado-ciego-demo.mp4` (grabado antes de llamarse Templo Ninja) es un video de 2 minutos con un recorrido por la app (grabado con Playwright sobre el servidor local, con cuentas de ejemplo en el ranking).

## Desarrollo

- `npm run dev` levanta el sitio y la API en http://127.0.0.1:3000 con una base en memoria.
- `npm test` prueba en Chromium: la portada que cambia sola, crear cuenta, practicar y evolucionar de nivel, las tildes en Mac y Safari, medir la velocidad y ver a quién te parecés, el ranking, los desafíos por WhatsApp y email, Ninja mental (las tres pistas con sus técnicas, el simulacro, el desafío de 5 minutos corregido por el servidor, con su ranking y sus desafíos, y que no cuenten las partidas con clics de un script, con el puntero que salta a las respuestas o con un puntaje inventado), entrar desde otro navegador y cerrar sesión. Después corre `tests/billing.cjs` (también suelto con `npm run test:billing`): el límite de 3 prácticas sin cuenta y 6 con cuenta, la oferta de cuenta gratis al quedarse sin prácticas, el aporte (pago único) y su webhook contra un Mercado Pago simulado, y que una suscripción mensual anterior siga valiendo.

## Publicar en Vercel

Importá el repo en Vercel (**Add New → Project**) sin configurar nada y conectá la base de datos como se explica arriba.
