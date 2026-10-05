# Backlog de Growth

Único backlog priorizado. Lo mantiene el coordinador (`growth/coordinador/PROMPT.md`). Puntaje = Impacto ×
Confianza × Facilidad (cada uno de 1 a 10). Nunca se borran filas.

Segmentos de tráfico: `iq` (anuncio iq), `velocidad` (anuncio velocidad), `resto` (orgánico, directo,
referidos y otros anuncios). Un experimento por segmento a la vez.

## Abiertas

| BL | Origen | Idea | Paso del embudo | Segmento | I | C | F | Puntaje | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BL-001 | OP-001 | El anuncio `iq` lleva directo al desafío de 5 min y la oferta aparece junto al IQ | ver precios → clic en pagar | iq | 7 | 5 | 8 | 280 | **experimentando** desde 2026-10-05 (`iq-desafio-directo`) |
| BL-002 | OP-001 (variante) | El anuncio `velocidad` lleva directo a la medición de 1 minuto que promete, con la oferta junto al resultado | visita → práctica → ver precios | velocidad | 7 | 6 | 8 | 336 | **próximo** (a aprobar por Facundo) |
| BL-003 | UX-003 | Entender por qué casi nadie termina la cuenta al llegar al límite (12 → 2): grabaciones antes de cambiar nada | límite → cuenta | todos | 5 | 4 | 9 | 180 | **próximo** (investigar: producto) |
| BL-004 | UX-002 | En el celular, mostrar primero Ninja mental (el teclado de la pantalla arruina la lección de tipeo) | práctica | resto | 4 | 5 | 7 | 140 | backlog (el segmento `resto` hoy casi no tiene volumen) |
| BL-005 | OP-002 | Certificado verificable incluido en el aporte, empezando por un botón para medir la demanda | resultado → clic en pagar | iq o velocidad | 6 | 4 | 7 | 168 | backlog (después de BL-001 y BL-002: toca las mismas pantallas) |
| BL-006 | OP-003 | Simulacros del test de una empresa argentina | nuevo segmento | nuevo anuncio | 7 | 2 | 5 | 70 | **en curso**: el primero (estilo Mercado Libre) salió con BL-010; falta validar demanda con un anuncio hacia `/profesional` (a aprobar) |

| BL-011 | BL-010 | Comprensión verbal en español (verdadero, falso o no se puede saber) y juicio situacional en `/profesional` | práctica | todos | 6 | 4 | 4 | 96 | backlog (contenido escrito a mano) |

## Cerradas

| BL | Origen | Idea | Estado | Resultado |
| --- | --- | --- | --- | --- |
| BL-007 | UX-001 / MK-001 | Contar solo personas reales: activación del experimento y visitas reales por anuncio | **aplicado** 2026-10-05 | Evento `iq_exp_activated` y tabla "Visitas reales por anuncio" en PostHog |
| BL-008 | MK-002 | Recordatorio por email para volver a practicar | **descartado** 2026-10-05 (decidió Facundo) | — |
| BL-009 | MK-003 | Optimizar el conjunto de Meta por la conversión "Practica" | **descartado** 2026-10-05 (decidió Facundo) | — |
| BL-010 | Facundo | Versión profesional: `/profesional` al estilo de practiceaptitudetests.com, en español y con empresas argentinas; pista 🧩 Lógica y series; simulacro estilo Mercado Libre (40 preguntas, 30 min) | **aplicado** 2026-10-05 (decidió Facundo) | Medir: `pro_cta_clicked` por `cta`, prácticas con `track=log` y `company=meli`, y si quienes usan la pista de lógica ven precios y hacen clic en pagar más que el resto |
