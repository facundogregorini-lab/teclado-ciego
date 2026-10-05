# Observaciones (registro acumulativo, no se borra)

Formato: fecha · fuente · tipo de evidencia · observación.
Tipos: **directa** (lo vimos), **declarado** (lo dice la empresa), **estimación** (terceros), **inferencia** (nuestra).

## 2026-10-05 (primera ejecución)

### Anuncios en Argentina (Biblioteca de anuncios de Meta, activos)
- Meta Ad Library · directa · "test de IQ" en AR: **75 anuncios activos** (IQ Masters "Tu mente, tu arquetipo", Monica Sage "¿Más listo que 100?", Brainova, Brainpiq "¿Cuál es tu verdadero arquetipo?", IQ Center "Ve tu puntuación al instante"). La mayoría paga en USD o TRY: anunciantes extranjeros.
- Meta Ad Library · directa · "coeficiente intelectual" en AR: 56 activos. "Test de inteligencia" en AR: 206 (con ruido de otros rubros).
- Meta Ad Library · directa · "mecanografía" en AR: **2 activos**, ninguno local. "Test psicotécnico" en AR: 2 (B2B). "Entrevista laboral test": 7.
- Meta Ad Library · inferencia · el gancho "IQ" está muy disputado en AR; el de tipeo, casi vacío. No sabemos cuánto rinden esos anuncios.
- Meta Ad Library · limitación · los snapshots de los anuncios piden login (403). Solo vimos títulos, no textos ni creatividades.

### Tráfico de los líderes (Semrush, agosto de 2026, salvo que se indique)
- monkeytype.com 21,33M/mes (67% directo) · typing.com 15,17M · 10fastfingers 5,6M · typingclub 4,99M · keybr 3,61M · humanbenchmark 2,77M · typeracer 2,16M · nitrotype 2,06M · 123test 1,25M · ratatype 400K · estimación.
- En casi todos los sitios de tipeo, Bangladesh e India son los primeros países · estimación · inferencia: mucho tráfico escolar o de bajo valor. No es nuestra audiencia.
- myiq.com 5,8M visitas en 3 meses, +64% m/m, **Paid Social 40%**, top Italia/Brasil/Canadá/Francia/España · Similarweb · estimación.
- psicoactiva.com 371,7K visitas en 3 meses, Argentina 14,9% · Similarweb · estimación.
- velocidactil.es ~7,5K/mes · Similarweb · estimación (sitio chico, poco confiable).

### Modelos de monetización
- Ratatype · directa (FAQ) · gratis con 10 ejercicios por día; acceso ilimitado pago (sin precio publicado en el FAQ); Plus sin anuncios.
- 123test · directa · IQ gratis de 10 preguntas con resultado al instante y comparación con "cientos de miles"; versión profesional de 44 preguntas a US$12,99; banner "Autumn offer (70% off)".
- Keybr · estimación · pago único de US$14 para sacar anuncios.
- typing.com · estimación · Premium sin anuncios (US$7,99 en promo, US$45/año según otra fuente); certificados gratis.
- TypeQuicker · directa · certificados de tipeo gratis e ilimitados (PDF, link público, imagen) para quienes buscan trabajo.
- practiceaptitudetests.com · directa · gratis 1 test por formato; Pro £39/año o £29/mes; "20m+ tests", "11.869 reseñas".
- JobTestPrep · estimación · packs por empleador; Premium de 1, 3 o 6 meses.
- EF SET · declarado · test de inglés gratis con certificado y URL personalizada para CV/LinkedIn; 30M+ personas desde 2016.
- Lumosity · estimación · "Fit Test" inicial de 10 minutos con comparación por edad → paywall con trial de 14 días.
- IQ Masters · estimación · onboarding con objetivos y demografía → paywall con trial de 3 días; US$400K/mes (screensdesign, sin verificar).
- myiq.com / brainable / check-iq · reseñas (Trustpilot, sikayetvar) · test "gratis", pago de ~US$1 para ver el resultado y después suscripción de ~US$30/mes poco informada. Muchas quejas.
- Monkeytype · estimación · anuncios (Playwire), US$60–130K/mes, más Patreon y merch.

### Mecánicas
- Duolingo · declarado (blog y podcast) · separar meta diaria y racha: +3,3% de retención D14. Ligas: +17% de tiempo de aprendizaje.
- Wordle · declarado/prensa · la grilla de emojis para compartir llevó de 300K a 2M+ jugadores en enero de 2022.
- Human Benchmark · directa · percentil frente a otros usuarios en cada prueba.
- Superwall (caso Speak4Me) · declarado · paywall en dos pasos (primero valor, después oferta): +27% de conversión.
- Techint Jóvenes Profesionales · Glassdoor (candidatos) · 5 tests online antes de la entrevista: inglés, razonamiento lógico, matemática, comprensión (39 preguntas en 18 min) y numérico (15 en 30 min).

### Contexto Argentina
- Defensa del Consumidor · directa (prensa) · el "botón de baja" es obligatorio en más rubros de suscripción. Nuestro pago único sin débitos no tiene ese riesgo.
- Mercado Pago (blog) · declarado · conversión media de e-commerce entre 1% y 4%.

### Interno (PostHog, 14 días)
- `iq`: 42 usuarios llegan a `/#ninja`. 13 practican. **9 hacen "sesión" guiada y solo 1 hace el desafío de 5 minutos** (el que da el IQ prometido en el anuncio). 10 ven precios (la mayoría por límite) y 1 hace clic en pagar.
- `velocidad`: 41 usuarios llegan a `/` (home). 14 practican: 9 empiezan una lección y solo 4 hacen la medición de 1 minuto que promete el anuncio.
- `templo`: 13 usuarios, ninguno practica.

### Calidad del proceso
- Los resúmenes del buscador inventaron cifras (TypeLab "US$74K MRR"; la fuente dice US$10). **Regla nueva: toda cifra de ingresos o tráfico que se use en una oportunidad se verifica en la fuente.**
