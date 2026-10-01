// English for work, as in the verbal reasoning part of job-interview tests. Three kinds:
// "lectura" (short business texts, True / False / Cannot say), "conectores" (link two ideas with the right word)
// and "orden" (put the sentences of a paragraph in order). Levels 1–5 go roughly from A2 to C1.
// Unlike the figures and the numbers, these are written by hand: each item explains its answer in Spanish,
// and each kind brings techniques (tips) to solve it better.
globalThis.English = (() => {
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  /* ---------- Reading: True / False / Cannot say ---------- */
  // Each statement: [text, answer (T | F | C), why in Spanish]
  const T = 'T', F = 'F', C = 'C';
  const READING = {
    1: [
      { text: 'Our office opens at 8:30 a.m. from Monday to Friday. On Saturdays, only the customer service team works, from 9 a.m. to 1 p.m. The office is closed on Sundays and public holidays.', s: [
        ['The office is open on Sunday mornings.', F, 'El texto dice que los domingos la oficina está cerrada.'],
        ['The customer service team works on Saturdays.', T, '"On Saturdays, only the customer service team works": lo dice textual.'],
        ['The office closes at 6 p.m. on weekdays.', C, 'El texto dice a qué hora abre, pero no a qué hora cierra de lunes a viernes.'],
        ['On Saturdays, the whole team works until 1 p.m.', F, 'Los sábados trabaja solo ("only") el equipo de atención al cliente, no todo el equipo.']] },
      { text: 'Maria started working at the company in 2019 as a sales assistant. Two years later, she became the sales manager of the Buenos Aires office. She now leads a team of eight people.', s: [
        ['Maria became sales manager in 2021.', T, 'Empezó en 2019 y "two years later" fue gerente: 2021.'],
        ['Maria joined the company as a manager.', F, 'Entró como asistente de ventas ("sales assistant").'],
        ['Maria\'s team has more than ten people.', F, 'Su equipo tiene ocho personas.'],
        ['Maria has always worked in Buenos Aires.', C, 'Sabemos que es gerente de la oficina de Buenos Aires, pero no dónde trabajaba antes.']] },
      { text: 'The new coffee machine is on the second floor, next to the meeting room. It is free for all employees. Please clean the machine after you use it.', s: [
        ['Employees must pay for the coffee.', F, 'Dice que es gratis ("free") para todos los empleados.'],
        ['The coffee machine is next to the meeting room.', T, 'Lo dice textual: "next to the meeting room".'],
        ['Employees are asked to clean the machine after using it.', T, '"Please clean the machine after you use it" es un pedido a los empleados.'],
        ['There is also a coffee machine on the first floor.', C, 'El texto solo habla de la máquina del segundo piso; no dice si hay otra.']] },
    ],
    2: [
      { text: 'The company will move to a new building in March. The new office is larger and closer to the train station, but it has fewer parking spaces. Employees who drive to work can request a parking card from the HR department.', s: [
        ['The new office has more parking spaces than the current one.', F, 'Dice lo contrario: tiene menos lugares ("fewer parking spaces").'],
        ['The new office is near the train station.', T, '"Closer to the train station": está más cerca de la estación.'],
        ['All employees will receive a parking card.', F, 'Solo pueden pedirla ("can request") los que van en auto; no la reciben todos.'],
        ['The move will cost more than the company expected.', C, 'El texto no dice nada sobre el costo de la mudanza.']] },
      { text: 'Last quarter, online sales grew by 15%, while sales in physical stores remained stable. The marketing team believes the growth was mainly caused by the new mobile app, which was launched in January.', s: [
        ['Sales in physical stores fell last quarter.', F, 'Se mantuvieron estables ("remained stable"), no bajaron.'],
        ['The mobile app was launched in January.', T, '"Which was launched in January": lo dice textual.'],
        ['Online sales grew by more than 20%.', F, 'Crecieron 15%, no más de 20%.'],
        ['The company plans to close some physical stores.', C, 'No se menciona ningún plan de cerrar locales.']] },
      { text: 'Candidates must send their CV and a cover letter before 15 May. Only candidates who pass the online test will be invited to an interview. Interviews will take place in the first two weeks of June.', s: [
        ['Candidates need to send a cover letter.', T, '"Must send their CV and a cover letter".'],
        ['Every candidate will be interviewed.', F, 'Solo los que aprueban el test online ("only") son entrevistados.'],
        ['The online test takes one hour.', C, 'No se dice cuánto dura el test.'],
        ['Interviews will be held in July.', F, 'Son en las primeras dos semanas de junio.']] },
    ],
    3: [
      { text: 'Remote work is allowed up to three days per week for employees who have completed their six-month probation period. Managers may approve additional remote days in exceptional cases, such as a medical recommendation. Employees in customer-facing roles are not eligible.', s: [
        ['A new employee can work remotely three days a week from the first month.', F, 'Hace falta haber completado el período de prueba de seis meses.'],
        ['Some employees may work remotely more than three days a week.', T, 'Los gerentes pueden aprobar días extra en casos excepcionales.'],
        ['Employees in customer-facing roles can work from home two days a week.', F, 'Los puestos de atención al público "are not eligible": no pueden.'],
        ['Most employees prefer working from home.', C, 'El texto describe una política; no dice qué prefieren los empleados.']] },
      { text: 'Although the budget for the project was approved in January, the work did not start until April because the supplier delivered the materials late. Despite the delay, the team expects to finish on time by working extra hours.', s: [
        ['The budget was approved after the work started.', F, 'El presupuesto se aprobó en enero y el trabajo empezó en abril: antes, no después.'],
        ['The delay was caused by the supplier.', T, '"Because the supplier delivered the materials late".'],
        ['The team expects to finish later than planned.', F, 'Espera terminar a tiempo ("on time").'],
        ['The extra hours will increase the total cost of the project.', C, 'Es razonable pensarlo, pero el texto no lo dice: no uses tu conocimiento, solo el texto.']] },
      { text: 'The survey was answered by 1,200 customers. Seven out of ten said they were satisfied with the delivery service, but many complained about the price of shipping. The company has not yet decided whether to reduce shipping costs.', s: [
        ['Most respondents were satisfied with the delivery service.', T, 'Siete de cada diez (70%) es la mayoría.'],
        ['The company has decided to reduce shipping costs.', F, 'Dice que todavía no lo decidió ("has not yet decided").'],
        ['Fewer than 1,000 customers answered the survey.', F, 'Respondieron 1.200 clientes.'],
        ['Customers who complained about the price will stop buying.', C, 'El texto no dice qué van a hacer esos clientes.']] },
    ],
    4: [
      { text: 'Under the new policy, travel expenses will only be reimbursed if employees submit the receipts within 30 days of the trip. Expenses above US$500 also require the prior written approval of a department head. Claims that do not meet these conditions will be rejected, unless the finance director grants an exception.', s: [
        ['An expense of US$300 needs the written approval of a department head.', F, 'La aprobación previa se exige solo para gastos de más de US$500.'],
        ['A claim submitted 45 days after the trip will always be rejected.', F, '"Always" es demasiado: el director de finanzas puede hacer una excepción ("unless…").'],
        ['The finance director can make exceptions to the rules.', T, '"Unless the finance director grants an exception".'],
        ['Most claims are submitted within a week of the trip.', C, 'El texto no da información sobre cuándo se presentan los reclamos.']] },
      { text: 'The merger is expected to create the largest logistics company in the region. However, regulators must approve the deal before it can be completed, and some analysts warn that the approval process could take more than a year. Neither company has announced job cuts.', s: [
        ['The merger has already been completed.', F, 'Todavía falta la aprobación de los reguladores para completarla.'],
        ['The regulators need to approve the merger.', T, '"Regulators must approve the deal".'],
        ['Both companies have announced job cuts.', F, '"Neither company has announced job cuts": ninguna anunció despidos.'],
        ['The new company will reduce its prices.', C, 'No se habla de precios.']] },
      { text: 'Sales of electric vehicles in the country doubled in 2024, yet they still represent less than 5% of all new cars sold. The government has announced tax incentives for buyers, which industry experts say could accelerate growth if charging infrastructure improves.', s: [
        ['Electric vehicles represent most of the new cars sold.', F, 'Son menos del 5% de los autos nuevos.'],
        ['Sales of electric vehicles grew in 2024.', T, 'Se duplicaron ("doubled").'],
        ['Experts believe that charging infrastructure matters for growth.', T, 'Dicen que el crecimiento podría acelerarse "if charging infrastructure improves".'],
        ['The tax incentives will start next year.', C, 'Se anunciaron, pero no se dice desde cuándo rigen.']] },
    ],
    5: [
      { text: 'While the company\'s revenue rose by 12% last year, its operating profit fell slightly, mainly due to higher energy and transport costs. The board has stated that it does not intend to raise prices this year, preferring instead to improve efficiency in its distribution centres.', s: [
        ['Both revenue and profit increased last year.', F, 'Los ingresos subieron, pero la ganancia operativa bajó.'],
        ['Higher costs were the main reason for the fall in profit.', T, '"Mainly due to higher energy and transport costs".'],
        ['The board plans to increase prices this year.', F, 'Dice que no tiene intención de subir precios.'],
        ['Efficiency improvements will be enough to restore profit.', C, 'Es el plan del directorio, pero el texto no dice si va a alcanzar.']] },
      { text: 'Applicants who hold a degree in engineering are exempt from the technical test, provided that they graduated within the last five years. Those who graduated earlier must take the test unless they can prove at least three years of relevant professional experience.', s: [
        ['An engineer who graduated two years ago must take the technical test.', F, 'Se recibió hace menos de cinco años: está exento.'],
        ['An engineer who graduated ten years ago and has four years of relevant experience does not need to take the test.', T, 'Se recibió hace más de cinco años, pero prueba más de tres años de experiencia: aplica el "unless".'],
        ['Applicants without an engineering degree must take the test.', C, 'El texto solo habla de quienes tienen título de ingeniería; no dice qué pasa con el resto.'],
        ['The technical test is only offered online.', C, 'No se menciona el formato del test.']] },
      { text: 'Contrary to popular belief, the study found no significant link between the number of hours employees spent in the office and their productivity. Instead, productivity was most strongly associated with clear goals and regular feedback from managers. The authors note, however, that the study only covered technology companies.', s: [
        ['The study found that more hours in the office lead to higher productivity.', F, 'Encontró que no hay una relación significativa ("no significant link").'],
        ['Clear goals were associated with productivity.', T, '"Most strongly associated with clear goals and regular feedback".'],
        ['The study included companies from many different industries.', F, 'Solo cubrió empresas de tecnología ("only covered technology companies").'],
        ['Managers in technology companies give more feedback than managers in other sectors.', C, 'El estudio no compara sectores.']] },
    ],
  };
  const TFC = ['True', 'False', 'Cannot say'], TFC_I = { T: 0, F: 1, C: 2 };
  const READING_TIPS = {
    T: 'True: el texto lo dice, aunque sea con otras palabras ("doubled" = "grew"). Buscá la frase del texto que lo confirma antes de marcarla.',
    F: 'False: el texto dice lo contrario. Ojo con palabras como all, always, only, never: una sola excepción en el texto ("unless…") las vuelve falsas.',
    C: 'Cannot say: el texto no alcanza para saberlo. Si la afirmación agrega un dato que el texto no menciona (un precio, una fecha, una opinión), suele ser Cannot say.',
    G: 'Respondé solo con lo que dice el texto, no con lo que vos sabés o suponés del tema. Esa es la clave de True / False / Cannot say.',
  };
  // Before answering: techniques that never depend on the right answer
  const READING_BEFORE = [
    READING_TIPS.G,
    'Leé primero la afirmación y después buscá en el texto la frase que habla de lo mismo. True = el texto lo dice; False = dice lo contrario; Cannot say = no alcanza para saberlo.',
    'Subrayá mentalmente las palabras fuertes de la afirmación (all, always, only, never, most, more than): suelen decidir la respuesta.',
    'Si la afirmación habla de algo que el texto nunca menciona (un costo, una fecha, una opinión), no lo completes con sentido común.',
  ];
  function lectura(d, used = new Set()) {
    const pool = READING[d].flatMap((p, pi) => p.s.map((s, si) => ({ p, id: `l${d}-${pi}-${si}`, s })));
    const fresh = pool.filter(x => !used.has(x.id));
    const x = pick(fresh.length ? fresh : pool); used.add(x.id);
    const [stmt, ans, why] = x.s;
    return {
      kind: 'lectura', prompt: 'Based only on the text, is the statement True, False, or Cannot say?',
      stimulus: `<div class="q-text"><p>${esc(x.p.text)}</p><p class="q-stmt"><b>Statement:</b> ${esc(stmt)}</p></div>`,
      options: TFC, answer: TFC_I[ans], explain: `${TFC[TFC_I[ans]]}. ${why}`,
      tip: pick(READING_BEFORE),
      after: READING_TIPS[ans], id: x.id,
    };
  }

  /* ---------- Connectors ---------- */
  // [sentence with ___, answer, distractors, category, why]
  const CONNECTORS = {
    1: [
      ['I called the client, ___ she didn\'t answer.', 'but', ['because', 'so', 'or'], 'contrast', 'Hay contraste: llamé, pero no atendió.'],
      ['The office was closed, ___ we worked from home.', 'so', ['but', 'because', 'or'], 'result', 'La segunda parte es la consecuencia de la primera.'],
      ['We need more chairs ___ ten new people are joining the team.', 'because', ['so', 'but', 'or'], 'cause', 'La segunda parte explica la causa.'],
      ['You can pay by card ___ in cash.', 'or', ['but', 'because', 'so'], 'choice', 'Son dos alternativas.'],
      ['The meeting finished early ___ the manager was sick.', 'because', ['so', 'or', 'but'], 'cause', 'El gerente enfermo es la causa.'],
      ['The printer is broken, ___ please use the one on the second floor.', 'so', ['because', 'or', 'but'], 'result', 'Usá la otra impresora como consecuencia de que esta no anda.'],
      ['The product is very good, ___ it is very expensive.', 'but', ['because', 'so', 'or'], 'contrast', 'Una idea positiva y una negativa: contraste.'],
      ['She speaks English ___ Portuguese.', 'and', ['but', 'because', 'so'], 'addition', 'Se suman dos datos del mismo tipo.'],
    ],
    2: [
      ['Sales increased in March. ___, profits fell because of higher costs.', 'However', ['Therefore', 'Also', 'Then'], 'contrast', 'Las ventas suben pero la ganancia baja: contraste entre oraciones.'],
      ['The flight was cancelled. ___, the meeting was moved to Monday.', 'Therefore', ['However', 'Although', 'Also'], 'result', 'Mover la reunión es consecuencia de la cancelación.'],
      ['___ it was raining, they arrived on time.', 'Although', ['Because', 'So', 'Therefore'], 'concession', 'Llegaron a tiempo a pesar de la lluvia: concesión.'],
      ['Please read the contract ___ you sign it.', 'before', ['after', 'so', 'although'], 'time', 'Primero se lee, después se firma.'],
      ['We will call you ___ the results are ready.', 'when', ['although', 'however', 'because of'], 'time', 'Indica en qué momento: cuando estén los resultados.'],
      ['The new software is faster. It is ___ easier to use.', 'also', ['however', 'although', 'therefore'], 'addition', 'Se agrega una ventaja más.'],
      ['First, open the file. ___, click on "Export".', 'Then', ['Although', 'However', 'Because'], 'time', 'Es el paso siguiente de una secuencia.'],
      ['She was late ___ the traffic.', 'because of', ['because', 'although', 'so'], 'cause', '"Because of" va con un sustantivo (the traffic); "because" necesita una oración completa.'],
    ],
    3: [
      ['We will miss the deadline ___ we hire more people.', 'unless', ['despite', 'whereas', 'as a result'], 'condition', '"Unless" = a menos que: si no contratamos, no llegamos.'],
      ['___ the bad weather, the event was a success.', 'Despite', ['Although', 'Unless', 'Whereas'], 'concession', '"Despite" va con un sustantivo (the bad weather); "although" necesitaría un verbo.'],
      ['The Madrid office focuses on sales, ___ the Buenos Aires office handles customer support.', 'whereas', ['as a result', 'unless', 'despite'], 'contrast', '"Whereas" compara dos cosas distintas en la misma oración.'],
      ['The supplier raised its prices. ___, we had to update our budget.', 'As a result', ['Whereas', 'Unless', 'Despite'], 'result', 'Actualizar el presupuesto es la consecuencia.'],
      ['Save your work regularly; ___, you might lose it.', 'otherwise', ['whereas', 'despite', 'as a result'], 'condition', '"Otherwise" = si no: si no guardás, podés perderlo.'],
      ['___ he had little experience, he got the job.', 'Even though', ['Despite', 'Unless', 'As a result'], 'concession', 'Va con una oración completa (he had…), por eso no puede ser "despite".'],
      ['The plan reduces costs. ___, it improves customer satisfaction.', 'In addition', ['Otherwise', 'Whereas', 'Despite'], 'addition', 'Suma un segundo beneficio.'],
      ['She accepted the offer ___ the low salary.', 'in spite of', ['although', 'unless', 'whereas'], 'concession', '"In spite of" + sustantivo (the low salary).'],
    ],
    4: [
      ['The project was over budget. ___, the client was happy with the result.', 'Nevertheless', ['Consequently', 'Moreover', 'Provided that'], 'contrast', 'Algo negativo seguido de algo positivo: "nevertheless" = sin embargo.'],
      ['You can work from home ___ you attend the Monday meeting.', 'provided that', ['nevertheless', 'consequently', 'so that'], 'condition', '"Provided that" = siempre que: es la condición para trabajar desde casa.'],
      ['We updated the website ___ customers could find products more easily.', 'so that', ['in order to', 'provided that', 'nevertheless'], 'purpose', 'Finalidad + oración con sujeto (customers could…): "so that". "In order to" iría con un verbo directo.'],
      ['The factory closed for two weeks. ___, production fell by 20%.', 'Consequently', ['Nevertheless', 'Moreover', 'On the other hand'], 'result', 'La baja de producción es consecuencia del cierre.'],
      ['The new model is cheaper. ___, it uses less energy.', 'Moreover', ['Nevertheless', 'Otherwise', 'Unless'], 'addition', 'Agrega otra ventaja: "moreover" = además.'],
      ['We are hiring more staff ___ reduce waiting times.', 'in order to', ['so that', 'provided that', 'as long as'], 'purpose', '"In order to" + verbo (reduce) expresa la finalidad.'],
      ['Renting is flexible. ___, buying can be cheaper in the long term.', 'On the other hand', ['Consequently', 'Provided that', 'So that'], 'contrast', 'Presenta el otro lado de la comparación.'],
      ['You will get the discount ___ you pay before Friday.', 'as long as', ['nevertheless', 'moreover', 'in order to'], 'condition', '"As long as" = siempre y cuando.'],
    ],
    5: [
      ['The results were positive, ___ lower than expected.', 'albeit', ['hence', 'whereby', 'given that'], 'concession', '"Albeit" = aunque, seguido de un adjetivo o frase corta, sin verbo.'],
      ['___ the deadline is tomorrow, we should prioritise this task.', 'Given that', ['Albeit', 'Whereby', 'Notwithstanding'], 'cause', '"Given that" = dado que: introduce la razón.'],
      ['The company introduced a system ___ employees can share ideas anonymously.', 'whereby', ['hence', 'albeit', 'notwithstanding'], 'relation', '"Whereby" = mediante el cual: describe cómo funciona el sistema.'],
      ['Costs fell by 10%, ___ improving the profit margin.', 'thereby', ['whereby', 'albeit', 'given that'], 'result', '"Thereby" + -ing = con lo cual, como resultado.'],
      ['The data were incomplete; ___, the conclusions should be treated with caution.', 'hence', ['albeit', 'whereby', 'notwithstanding'], 'result', '"Hence" = por lo tanto.'],
      ['___ the strong competition, the brand increased its market share.', 'Notwithstanding', ['Given that', 'Hence', 'Whereby'], 'concession', '"Notwithstanding" = a pesar de, muy formal.'],
      ['He can barely manage his own team, ___ a whole department.', 'let alone', ['albeit', 'thereby', 'hence'], 'addition', '"Let alone" = mucho menos: si no puede lo fácil, menos lo difícil.'],
      ['The offer is valid ___ stocks last.', 'while', ['albeit', 'whereby', 'hence'], 'time', '"While stocks last" = mientras haya stock.'],
    ],
  };
  const CONNECTOR_TIPS = {
    contrast: 'Contraste (but, however, whereas, nevertheless, on the other hand): las dos ideas van en direcciones opuestas. "However" y "nevertheless" empiezan una oración nueva y van seguidos de coma.',
    result: 'Consecuencia (so, therefore, as a result, consequently, hence): la segunda idea es el resultado de la primera. Preguntate "¿esto pasó por lo anterior?".',
    cause: 'Causa (because, because of, given that): la segunda idea explica por qué. "Because" + oración; "because of" + sustantivo.',
    concession: 'Concesión: algo pasó a pesar de otra cosa. Although / even though + oración completa (sujeto y verbo); despite / in spite of / notwithstanding + sustantivo o -ing.',
    condition: 'Condición (unless, provided that, as long as, otherwise): algo depende de otra cosa. "Unless" = a menos que; "otherwise" = si no.',
    addition: 'Agregado (and, also, moreover, in addition, let alone): se suma una idea en la misma dirección.',
    time: 'Tiempo (before, after, when, then, while): ordená los hechos en el tiempo y fijate cuál pasa primero.',
    purpose: 'Finalidad: "in order to" / "to" + verbo; "so that" + oración con sujeto (so that customers could…).',
    choice: 'Opción (or): se presentan alternativas.',
    relation: '"Whereby" = mediante el cual / por el cual: describe un mecanismo o sistema.',
    G: 'Antes de mirar las opciones, leé la oración entera y decí qué relación hay entre las dos ideas: ¿contraste, causa, consecuencia, condición o agregado? Después buscá el conector de esa familia.',
  };
  const CONNECTOR_BEFORE = [
    CONNECTOR_TIPS.G,
    'Mirá qué viene después del hueco: si es una oración completa (sujeto + verbo) o solo un sustantivo. Hay conectores que van con cada caso (although + oración; despite + sustantivo).',
    'Fijate la puntuación: los conectores que empiezan una oración nueva (However, Therefore, Moreover…) van seguidos de coma.',
    'Probá cada opción leyendo la oración completa: descartá las que cambian el sentido o no suenan gramaticales.',
  ];
  function conectores(d, used = new Set()) {
    const pool = CONNECTORS[d].map((c, i) => ({ c, id: `c${d}-${i}` }));
    const fresh = pool.filter(x => !used.has(x.id));
    const x = pick(fresh.length ? fresh : pool); used.add(x.id);
    const [sentence, ans, wrong, cat, why] = x.c;
    const options = shuffle([ans, ...wrong]);
    return {
      kind: 'conectores', prompt: 'Choose the word or phrase that best completes the sentence.',
      stimulus: `<div class="q-text"><p class="q-gap">${esc(sentence).replace('___', '<span class="gap">_____</span>')}</p></div>`,
      options, answer: options.indexOf(ans), explain: `"${ans}". ${why}`,
      tip: pick(CONNECTOR_BEFORE), after: CONNECTOR_TIPS[cat], id: x.id,
    };
  }

  /* ---------- Sentence order ---------- */
  // Sentences in the right order, and why in Spanish
  const ORDER = {
    1: [
      [['First, turn on the computer.', 'Then, open the email program.', 'Next, write the message to your client.', 'Finally, click on "Send".'], 'Las palabras de secuencia marcan el orden: first, then, next, finally.'],
      [['Hi Ana, I hope you are well.', 'I am writing to confirm our meeting on Tuesday.', 'It will be at 10 a.m. in my office.', 'See you soon, Pablo.'], 'Un email empieza con el saludo, sigue con el motivo y sus detalles, y termina con la despedida.'],
      [['Our company makes furniture.', 'It was founded in 1998 by two brothers.', 'Today it has more than 50 employees.', 'Next year, it will open a store in Chile.'], 'Primero se presenta la empresa; "it" se refiere a ella. Después el orden es pasado, presente y futuro.'],
      [['Welcome to your first day at the company!', 'Your desk is on the fourth floor.', 'At 11 a.m., you will meet your team.', 'After lunch, HR will show you the building.'], 'Primero la bienvenida, después dónde está tu escritorio y luego las actividades del día en orden horario.'],
      [['Dear customer, thank you for your order.', 'Your package was sent today.', 'It will arrive in three to five days.', 'Best regards, the Sales Team.'], 'Saludo y agradecimiento, el envío, cuándo llega y la despedida.'],
    ],
    2: [
      [['We have a problem with your order.', 'The product you bought is out of stock.', 'However, it will be available again next week.', 'We are sorry for the inconvenience.'], 'Primero el problema, después el detalle, "however" introduce la buena noticia y al final la disculpa.'],
      [['Last year, the team set a goal of 1,000 new customers.', 'At first, progress was slow.', 'Then, a new advertising campaign started in June.', 'In the end, the team reached 1,200 customers.'], 'At first → then → in the end ordenan la historia en el tiempo.'],
      [['Thank you for applying for the position of sales assistant.', 'We have reviewed your CV carefully.', 'We would like to invite you to an interview.', 'Please confirm your availability by Friday.'], 'Agradecimiento, revisión, invitación y pedido de confirmación: el orden lógico de una respuesta a un candidato.'],
      [['Our team meeting is usually on Mondays.', 'This week, however, Monday is a public holiday.', 'So the meeting will be on Tuesday at the same time.', 'Please update your calendars.'], '"However" marca la excepción, "so" la consecuencia y el pedido va al final.'],
      [['I would like to request two days off next month.', 'My sister is getting married on the 14th.', 'I have already finished the report that was due that week.', 'Please let me know if this is possible.'], 'Pedido, motivo, dato que tranquiliza al jefe y cierre con la pregunta.'],
    ],
    3: [
      [['Many companies now offer flexible working hours.', 'This allows employees to balance work and family life.', 'As a result, they tend to be more satisfied.', 'However, managers say communication can become more difficult.'], '"This" se refiere a los horarios flexibles; "as a result" trae la consecuencia y "however" la objeción.'],
      [['The meeting room on the third floor will be closed next week.', 'This is because the walls are being painted.', 'In the meantime, please book the room on the first floor.', 'It will reopen on Monday the 15th.'], 'El anuncio va primero; "this is because" explica la causa; "in the meantime" da la alternativa y al final la fecha de reapertura.'],
      [['Customer complaints increased by 30% in the last quarter.', 'Most of them were about late deliveries.', 'To solve this, we have hired a new logistics partner.', 'We expect delivery times to improve next month.'], '"Most of them" remite a las quejas; "to solve this" remite al problema de entregas.'],
      [['Our website was down for three hours yesterday.', 'The problem was caused by a failure at our hosting provider.', 'During that time, customers could not place orders.', 'To prevent this in the future, we are adding a backup server.'], 'El hecho, su causa, el efecto ("during that time") y la solución ("to prevent this").'],
      [['Learning a new language takes time.', 'Most experts recommend practising a little every day.', 'This is more effective than studying for hours once a week.', 'Even ten minutes a day can make a big difference.'], 'Idea general, recomendación, "this" la compara y el cierre la refuerza.'],
    ],
    4: [
      [['Remote work has grown rapidly since 2020.', 'Supporters argue that it saves time and money.', 'Critics, on the other hand, worry about isolation and weaker team culture.', 'Most experts therefore recommend a hybrid model.'], 'Tema → a favor → "on the other hand" en contra → "therefore" conclusión.'],
      [['The launch of the new app was delayed twice.', 'The first delay was caused by a security problem.', 'The second one happened when a key developer left the company.', 'Despite these setbacks, the app was finally released in May.'], '"The first… / the second one" detallan los dos retrasos; "despite these setbacks" cierra.'],
      [['We are pleased to announce our results for the year.', 'Revenue grew by 18%, driven mainly by exports.', 'This growth, however, came with higher shipping costs.', 'Consequently, the board will review our logistics strategy.'], '"This growth" remite al 18%; "consequently" trae la decisión final.'],
      [['Last year, the company decided to reduce its use of paper.', 'To achieve this, all contracts are now signed electronically.', 'In addition, printers now print on both sides by default.', 'As a result, paper consumption has fallen by 60%.'], 'Decisión → "to achieve this" medidas → "in addition" otra medida → "as a result" el resultado.'],
      [['Many job candidates prepare carefully for technical questions.', 'Fewer, however, prepare for questions about their own experience.', 'Yet these are often the questions that decide the interview.', 'It is therefore worth practising clear examples from your past jobs.'], 'Afirmación, "however" el contraste, "yet" lo refuerza y "therefore" la recomendación final.'],
    ],
    5: [
      [['Artificial intelligence is transforming the way companies hire.', 'Algorithms can now screen thousands of CVs in minutes.', 'Such speed, though, raises concerns about hidden bias.', 'Hence, several countries are drafting rules to make these systems more transparent.'], '"Such speed" remite a revisar miles de CV en minutos; "hence" cierra con la consecuencia.'],
      [['The study tracked 500 employees over three years.', 'Those who received regular feedback were promoted more often.', 'This effect held even after controlling for experience and education.', 'The authors conclude that feedback is a key driver of career growth.'], 'Método → resultado → "this effect" lo confirma → conclusión de los autores.'],
      [['Few industries have changed as fast as retail.', 'Online shopping has forced stores to rethink their role.', 'Rather than simply selling products, many now offer experiences.', 'This shift has, in turn, changed the skills that retail employees need.'], 'Tema general → causa → cambio concreto → "this shift" y "in turn" traen la consecuencia.'],
      [['Inflation has eroded the purchasing power of salaries over the past decade.', 'In response, some firms have started adjusting wages every quarter rather than once a year.', 'This practice, while popular with employees, complicates budget planning.', 'Finance teams consequently rely more heavily on scenario analysis.'], 'Problema → "in response" la medida → "this practice" su costo → "consequently" el efecto en finanzas.'],
      [['Customer loyalty is notoriously hard to measure.', 'Repeat purchases, for instance, may simply reflect a lack of alternatives.', 'Satisfaction surveys, meanwhile, often capture intentions rather than behaviour.', 'Combining several indicators therefore tends to give a more reliable picture.'], 'Tesis, dos ejemplos ("for instance", "meanwhile") y la conclusión con "therefore".'],
    ],
  };
  const ORDER_TIPS = [
    'Buscá primero la oración que abre: presenta el tema y no empieza con this, it, they, however, then ni therefore.',
    'Los pronombres y palabras como this, these, such o the second one se refieren a algo dicho antes: esa oración no puede ir primero.',
    'Descartá opciones rápido: si una propuesta empieza con "However…" o "Then…", es incorrecta.',
    'Los conectores marcan el orden: first / then / finally (secuencia), however (contraste), as a result / therefore (consecuencia, suele ir al final).',
  ];
  const L = '1234';
  function orden(d, used = new Set()) {
    const pool = ORDER[d].map((o, i) => ({ o, id: `o${d}-${i}` }));
    const fresh = pool.filter(x => !used.has(x.id));
    const x = pick(fresh.length ? fresh : pool); used.add(x.id);
    const [sentences, why] = x.o;
    // Show the sentences shuffled, labeled A–D (never already in order)
    let shown; do { shown = shuffle([0, 1, 2, 3]); } while (shown.every((v, i) => v === i));
    const labelOf = idx => L[shown.indexOf(idx)];
    const right = [0, 1, 2, 3].map(labelOf).join(' → ');
    const seen = new Set([right]), options = [right];
    const n = d <= 2 ? 4 : 5;
    // Wrong orders: swaps of the right one first (the tempting ones), then random
    const swaps = [[0, 1], [1, 2], [2, 3], [0, 3], [1, 3], [0, 2]];
    for (const [i, j] of shuffle(swaps)) {
      const ord = [0, 1, 2, 3]; [ord[i], ord[j]] = [ord[j], ord[i]];
      const s = ord.map(labelOf).join(' → ');
      if (!seen.has(s) && options.length < n) { seen.add(s); options.push(s); }
    }
    const opts = shuffle(options);
    return {
      kind: 'orden', prompt: 'Put the sentences in the most logical order.',
      stimulus: `<div class="q-text"><ol class="q-sent">${shown.map((idx, k) => `<li><b>${L[k]}</b> ${esc(sentences[idx])}</li>`).join('')}</ol></div>`,
      options: opts, answer: opts.indexOf(right), explain: `${right}. ${why}`, tip: pick(ORDER_TIPS), after: ORDER_TIPS[0], id: x.id,
    };
  }

  const GUIDE = {
    lectura: [READING_BEFORE[1], READING_TIPS.F, READING_TIPS.C],
    conectores: [CONNECTOR_TIPS.G, CONNECTOR_TIPS.contrast, CONNECTOR_TIPS.concession, CONNECTOR_TIPS.result, CONNECTOR_TIPS.condition],
    orden: ORDER_TIPS,
  };
  const make = Object.fromEntries(Object.entries({ lectura, conectores, orden }).map(([k, fn]) => [k, (d, used) => ({ ...fn(d, used), d, text: true })]));
  return { make, KINDS: Object.keys(make), GUIDE };
})();
