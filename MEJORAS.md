# Templo Ninja: aprendizaje, juego y revancha

Revisión del 2 de octubre de 2026. El objetivo de esta entrega es acortar el camino entre entrar, practicar, entender un error y volver a jugar. Conserva las cuentas, las 26 lecciones, las 45 sesiones, los simulacros y la infraestructura existente.

## Referentes consultados y decisiones

No existe una clasificación objetiva que permita declarar un producto «el mejor». Se consultaron referentes por categoría y se adaptaron patrones, sin copiar sus ejercicios ni sus marcas.

| Área | Referente y evidencia | Aplicación en Templo Ninja |
| --- | --- | --- |
| Mecanografía inicial | [TypingClub](https://www.typingclub.com/) combina guía de postura, lecciones, estrellas y distintos ejercicios. | Una entrada según nivel, precisión como objetivo y acceso directo a la siguiente habilidad que todavía no tiene dos estrellas. |
| Práctica específica | [Monkeytype](https://monkeytype.com/about) ofrece práctica de palabras falladas o lentas. | Repaso generado con las teclas falladas; no acredita estrellas de una lección distinta. |
| Competencia social | [TypeRacer](https://play.typeracer.com/) utiliza carreras de escritura contra otras personas. | Desafíos asincrónicos con texto reproducible, reglas de tildes y precisión explícitas. No se implementaron salas en tiempo real. |
| Figuras | [SHL](https://www.shl.com/assets/documents/rebranded-assets/product-factsheet-verify-interactive-inductive.pdf) describe ejercicios inductivos interactivos y diseño para dispositivos móviles. | Se conservan los generadores originales y se mejora el acceso por nivel, el refuerzo, los controles y las descripciones de figuras. |
| Razonamiento numérico | [AssessmentDay](https://www.assessmentday.co.uk/resources/aptitude-test-sample-questions-answers.html) publica preguntas de práctica y soluciones. | El usuario puede estudiar una solución sin que el reloj de práctica le quite tiempo y volver a entrenar el tipo de pregunta fallado. |
| Inglés | [British Council](https://learnenglish.britishcouncil.org/level) organiza recursos según nivel y explica que una prueba orientativa no es una certificación. | Acceso inicial a dificultades 1, 3 o 4, conservando el banco A2–C1 y sus explicaciones. La selección es autoevaluada; no se presenta como un diagnóstico CEFR. |

## Cambios por recorrido

**Inicio.** Nuevo plan con tres acciones: aprender, reforzar y superarse. Cuatro áreas y tres puntos de partida. La recomendación busca dos estrellas, no solo completar una sesión. Meta de tres prácticas y racha diaria sin castigos ni mensajes de culpa. Se usan fechas de Argentina, igual que el límite diario existente.

**Mecanografía.** Resultados con devolución según precisión, comparación de precisión anterior y un botón de repaso de teclas falladas. El repaso utiliza palabras compatibles con la base seleccionada cuando están disponibles. Al fallar una lección, repetir toma prioridad sobre saltar a la siguiente. El reto diario usa una semilla compartida para conservar el texto.

**Figuras, números e inglés.** Sesiones guiadas sin reloj activadas por defecto. Se puede volver al modo cronometrado desde el plan; los simulacros y el desafío de cinco minutos siempre mantienen sus límites. En sesiones cronometradas, leer la devolución pausa el reloj. Los resultados reúnen las explicaciones de los errores y ofrecen reforzar un tipo de ejercicio con preguntas nuevas. El siguiente nivel deja de ser la acción principal cuando no se aprobó.

**Humor.** Devoluciones lúdicas que dependen de la precisión y pueden desactivarse. Las bromas hablan del teclado, las neuronas, el mate y la revancha. Se retira de la interfaz el nivel «indigente» y se reemplaza por «ninja del mate», manteniendo los identificadores de progreso. El índice ninja se identifica como una escala de juego, no una medición de inteligencia. Se elimina la afirmación de un percentil poblacional inventado.

**Amigos y colegas.** Los enlaces nuevos de velocidad incluyen la semilla del texto, precisión y regla de tildes. La aceptación replica esas condiciones. Para proclamar ganador, ambas marcas con precisión conocida deben llegar al 90%. Los enlaces anteriores siguen funcionando, indicando que la comparación usa textos aleatorios. Las marcas de velocidad se identifican como autodeclaradas; los desafíos Ninja conservan la corrección en servidor. Compartir abre WhatsApp, correo o copia el mensaje: nunca se envía automáticamente.

**Usabilidad.** Preferencias plegadas en la primera pantalla móvil; encabezado adaptable también en tablet; controles principales de al menos 44 px; foco visible; enlace para saltar al plan; descripciones de las figuras para lectores de pantalla; foco en la nueva pregunta; botón para pausar paisajes; respeto por movimiento reducido. En celular se orienta hacia Ninja mental y se explica el uso de teclado físico para mecanografía.

## Verificación

- `tests/dojo.cjs`: fechas y rachas; texto determinista; repaso; humor configurable; figuras accesibles; las 12 combinaciones de área y nivel; pausa de explicación; persistencia de preferencias; igualdad del texto entre amigos; repaso sin progreso indebido; interacción y ausencia de desbordes en 320, 390, 768 y 1440 px.
- `tests/smoke.cjs`: cuentas, teclado y tildes, progreso, ejercicios, simulacros, rankings, desafíos y protecciones existentes de Ninja mental. Se actualizan únicamente expectativas de textos que cambiaron deliberadamente.
- `tests/billing.cjs`: límites, cuentas, pago único, webhook simulado y compatibilidad con pagos anteriores.
- Capturas inspeccionadas en Chrome de escritorio y emulación móvil. No se ejecutó Safari real ni una auditoría formal de accesibilidad.

En Windows se puede usar Chrome instalado con `CHROME_PATH`; en otros entornos, instalar Chromium de Playwright antes de ejecutar `npm test`. El servidor local desactiva el píxel real y usa datos en memoria.

## Límites y siguientes validaciones de producto

El plan, la racha y las teclas a reforzar son locales al navegador. Las cuentas siguen sincronizando el progreso original; además guardan los metadatos de los nuevos desafíos de velocidad. No se agregaron ligas privadas, salas en tiempo real, notificaciones ni un nuevo sistema de analítica.

Estas mejoras no permiten afirmar que aumentó la retención ni que la aplicación ya es «10/10». Eso requiere observar usuarios reales. Medir primero: proporción que termina su primera práctica, cuántos usan el repaso, evolución de precisión en ejercicios comparables, retorno al día siguiente y a la semana, y proporción de desafíos aceptados. Evaluar principiantes, intermedios y avanzados por separado. Mantener los bancos de preguntas bajo revisión de especialistas y comprobar teclado real, lector de pantalla y Safari/iOS antes de afirmar cobertura global.
