# Propuesta: anuncio hacia /profesional (validar demanda) — pendiente de aprobación

**Qué queremos saber:** si la gente que prepara un test de selección llega, practica y paga más barato que el
tráfico actual (`iq` y `velocidad`). Relacionado: BL-006 y BL-010.

## Estructura (no toca la campaña actual ni el experimento `iq-desafio-directo`)
- **Campaña nueva:** "TN | Profesional | AR | Test01". Objetivo Tráfico, optimizada para **visitas a la página de
  destino** (necesita el píxel en `/profesional`, que llega con este PR).
- **Presupuesto:** ARS 3.000 por día durante 7 días, con tope total de **ARS 21.000**. La campaña actual sigue con sus
  ARS 5.000 por día: en total son ARS 8.000 por día durante esa semana.
- **Público:** Argentina, de 20 a 35 años, público Advantage+ (sugerencia: búsqueda de empleo y graduados recientes) y
  ubicaciones Advantage+.
- **Dos anuncios**, misma imagen base (`creativos/profesional-a-4x5.png` y `-b-4x5.png`) y botón "Más información":
  - **A, sin marcas:** "¿Te toca un test de selección?". Texto: "Muchas empresas filtran candidatos con un test
    online de lógica y números, con menos de un minuto por pregunta. Practicá con el mismo formato, con reloj y la
    explicación de cada respuesta. Gratis para empezar." Título: "Prepará tu test de selección".
    URL: `https://www.temploninja.com/profesional?utm_source=meta&utm_medium=paid&utm_campaign=profesional&utm_content=pro-a`
  - **B, con el gancho de la empresa:** "40 preguntas. 30 minutos.". Texto: "Candidatos de Mercado Libre contaron
    que el test fue de 40 preguntas de lógica y matemática en 30 minutos. Practicá ese formato con reloj y
    explicaciones. Gratis para empezar." Título: "40 preguntas en 30 minutos". URL igual, con `utm_content=pro-b`.
    **Riesgo:** nombrar una marca de un tercero puede hacer que Meta rechace el anuncio o pida revisión. Si lo
    rechaza, corre solo A.

## Regla de decisión (escrita antes de lanzar)
Se mide a los 7 días o al gastar los ARS 21.000, con visitas reales (más de 2 s o con clic) y PostHog:
- **Escalar** (pasar a la campaña principal o subir el presupuesto) si el **costo por practicante** es de ARS 676
  o menos (el de hoy) y hay al menos 1 clic en pagar.
- **Descartar** si el costo por practicante es de ARS 1.350 o más (el doble), o si menos del 15% de las visitas
  reales hace clic hacia la práctica (`pro_cta_clicked`).
- **En el medio:** una semana más cambiando solo el mensaje.
- **A contra B:** con menos de 50 clics por anuncio no se declara ganador; es orientativo.

Estimación: con el CPC de hoy (unos ARS 160), ARS 21.000 son unos 130 clics, unas 90 visitas reales y unos 28
practicantes si practica el mismo 31% que en `iq`.

## Cómo se aplica (con la aprobación de Facundo)
Subir las dos imágenes, crear la campaña, el conjunto y los dos anuncios en pausa, revisar la vista previa y
activar. Registrar el cambio en `canales.md` y en `growth/coordinador/decisiones.md`.
