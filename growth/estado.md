# Estado de Growth — Templo Ninja

Última actualización: 2026-10-05 (primera ejecución del research externo).

## Cuello de botella actual
**De ver precios a comprar.** Últimos 14 días (PostHog, proyecto 642163):

| Paso | Usuarios |
| --- | --- |
| Visitas (`$pageview`) | 132 |
| Empezaron una práctica | 30 |
| Terminaron una práctica | 26 |
| Vieron precios (`pricing_viewed`) | 20 (12 por límite sin cuenta) |
| Clic en pagar (`checkout_clicked`) | 7 |
| Llegaron a Mercado Pago (`checkout_started`) | 3 |
| Pagaron (`payment_succeeded`) | 0 |

Por anuncio (primera visita con `utm_content`): `iq` 42 usuarios, 13 practican, 10 ven precios y 1 hace clic
en pagar. `velocidad` 41 usuarios, 14 practican, 2 ven precios. `templo` 13 usuarios, ninguno practica.

## Experimentos en curso

### `iq-desafio-directo` (OP-001), desde 2026-10-05
- **Quién:** visitantes del anuncio `iq` (`utm_content=iq`), 50/50 con el flag de PostHog. Solo cuentan los que además interactúan de verdad (`iq_exp_activated`): las cargas automáticas de Instagram, Facebook y Meta no entran (UX-001).
- **Cambio (`test`):** el botón principal de Ninja mental lleva al desafío de 5 minutos, y debajo del IQ aparece el plan ilimitado ($4.900, pago único). El IQ sigue siendo gratis.
- **Métrica que decide:** % de visitantes del anuncio que hacen clic en pagar (`checkout_clicked`). Línea de base: 1 de 42.
- **Señal temprana:** % que completa el desafío (`practice_completed` con `kind=desafio-5-min`). Línea de base: 1 de 13 que practican.
- **Métrica final:** compras por visitante (`payment_succeeded`); con este volumen, no concluyente.
- **Control de daños:** % de visitantes que empieza a practicar (`practice_started`).
- **Duración:** hasta 60 visitantes por grupo o 3 semanas, lo que ocurra primero.
- **Regla de decisión:** si `test` duplica o más el % de clic en pagar sin bajar el % que practica, pasa al 100% y se aplica lo mismo al anuncio `velocidad` (directo a la medición de 1 minuto). Si no se mueve, se descarta y se revisa el precio.
- **Cambio en Meta (2026-10-05):** se pausó el anuncio `templo` (13 visitantes, ninguno practicó) para concentrar el presupuesto en `iq`.

## Próximo
Ver `growth/backlog.md`. Esta semana:
- **BL-002** (a aprobar): experimento para el anuncio `velocidad`, directo a la medición de 1 minuto.
- **BL-003**: investigar el abandono al crear la cuenta (pedido a producto, abajo).

## Pedidos del coordinador
Cada rutina responde primero lo que le toca, en una sección "Pedidos del coordinador" de su informe.
- **Producto:** ver las grabaciones de quienes tocaron "crear cuenta" al llegar al límite y no la terminaron (BL-003). ¿Dónde abandonan y por qué?
- **Marketing:** visitas reales por semana de `iq` y `velocidad`, para estimar cuánto tarda cada experimento en llegar a 60 personas por grupo.
- **Research:** qué empresas argentinas usan tests online de aptitud en sus búsquedas y cómo se busca eso en Google (BL-006).

## Estructura de Growth
| Rutina | Cuándo (hora de Argentina) | Entrega | Instrucciones |
| --- | --- | --- | --- |
| Status diario | todos los días, 8:47 | email | `growth/status/PROMPT.md` |
| Coordinador | lunes 9:13, después de las tres semanales | un PR con todo + email | `growth/coordinador/PROMPT.md` |
| Producto y CRO | lunes 7:21 | PR + email a las 9:00 | `growth/producto/PROMPT.md` |
| Adquisición y retención | lunes 7:34 | PR + email a las 9:00 | `growth/marketing/PROMPT.md` |
| Research de mercado | lunes 7:48 | PR + email a las 9:00 | `growth/research/PROMPT.md` |

Dashboards de PostHog: "Growth · Producto y CRO", "Growth · Adquisición", "Growth · Retención" y
"Templo Ninja · Embudo de conversión".
