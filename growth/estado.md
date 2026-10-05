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
- **Quién:** visitantes del anuncio `iq` (`utm_content=iq`), 50/50 con el flag de PostHog.
- **Cambio (`test`):** el botón principal de Ninja mental lleva al desafío de 5 minutos, y debajo del IQ aparece el plan ilimitado ($4.900, pago único). El IQ sigue siendo gratis.
- **Métrica que decide:** % de visitantes del anuncio que hacen clic en pagar (`checkout_clicked`). Línea de base: 1 de 42.
- **Señal temprana:** % que completa el desafío (`practice_completed` con `kind=desafio-5-min`). Línea de base: 1 de 13 que practican.
- **Métrica final:** compras por visitante (`payment_succeeded`); con este volumen, no concluyente.
- **Control de daños:** % de visitantes que empieza a practicar (`practice_started`).
- **Duración:** hasta 60 visitantes por grupo o 3 semanas, lo que ocurra primero.
- **Regla de decisión:** si `test` duplica o más el % de clic en pagar sin bajar el % que practica, pasa al 100% y se aplica lo mismo al anuncio `velocidad` (directo a la medición de 1 minuto). Si no se mueve, se descarta y se revisa el precio.
- **Cambio en Meta (2026-10-05):** se pausó el anuncio `templo` (13 visitantes, ninguno practicó) para concentrar el presupuesto en `iq`.

## Hipótesis activas
Ver `growth/research/oportunidades.md`.
