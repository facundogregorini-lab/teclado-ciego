// Cinturones: after the 26 lessons of the base course (white belt), five belts of 8 lessons each, from capitals and
// punctuation to speed goals. Each lesson makes its own text every time (sentences and words picked at random) and
// has a speed goal for the third star. Only characters of the Spanish keyboards in app.js (no @ or #).
window.Belts = (() => {
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a, n) => shuffle(a).slice(0, n);
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const words = (list, n) => { const out = []; while (out.length < n) { const w = list[Math.floor(Math.random() * list.length)]; if (w !== out[out.length - 1]) out.push(w); } return out.join(' '); };
  const sentences = (bank, n) => pick(bank, n).join(' ');
  const thousands = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  /* ---------- Amarillo: mayúsculas y puntuación ---------- */
  const COMMAS = ['Compré pan, queso, tomate y café.', 'Llegué temprano, saludé y me senté.', 'Lunes, martes y jueves tengo clases.', 'Si llueve, nos vemos en el bar.', 'Mi hermana, que vive en Rosario, viene el sábado.', 'Primero estudio, después entreno y a la noche descanso.', 'Gracias, de verdad, por la ayuda.', 'Ana, Pedro y Lucía ganaron el torneo.', 'Por suerte, el tren salió a horario.', 'Abrí la ventana, entró el sol y todo cambió.'];
  const PERIODS = ['El día está lindo. Salgo a caminar.', 'Hoy no hay clases. Mañana sí.', 'La reunión empezó tarde. Nadie se quejó.', 'Me gusta leer. También escribir.', 'El café está listo. Vení a la cocina.', 'Ganamos el partido. Fue un gran equipo.', 'Llegó el pedido. Está todo bien.', 'Cerré la puerta. Apagué la luz.', 'Pensalo con calma. Después decidí.', 'El tren tarda. Esperamos un rato.'];
  const ASKS = ['¿Llegaste bien?', '¡Qué buena noticia!', '¿A qué hora empieza la reunión?', '¡Feliz cumpleaños!', '¿Me pasás la sal, por favor?', '¡No lo puedo creer!', '¿Quién trae el postre?', '¡Vamos, que se puede!', '¿Cuánto cuesta el envío?', '¡Gracias por venir!', '¿Ya almorzaste?', '¡Qué frío hace hoy!'];
  const QUOTES = ['Me dijo: "nos vemos mañana".', 'El cartel decía "cerrado por vacaciones".', 'Traé todo (cuadernos, lápices y la calculadora).', 'La reunión (la de las diez) se pasó a las once.', 'Mi abuela siempre dice "más vale tarde que nunca".', 'El libro se llama "Rayuela" y lo escribió Cortázar.', 'Llegamos a tiempo (por poco).', 'Leé el punto tres (el de los plazos).'];
  const COLONS = ['Necesito tres cosas: tiempo, ganas y café.', 'Llegó tarde; igual ganó la carrera.', 'La lista es corta: pan, leche y frutas.', 'Estudió mucho; aprobó con nueve.', 'Te aviso algo: mañana no hay clases.', 'Hacía frío; aun así salimos a correr.', 'Ojo con esto: el plazo vence el viernes.', 'Quería dormir; el perro no estaba de acuerdo.'];
  const NAMES = ['Ana viaja a Córdoba en marzo.', 'Martín vive en Mendoza con Sofía.', 'El Río de la Plata es enorme.', 'Lucía trabaja en Buenos Aires desde enero.', 'Diego y Paula se conocieron en Salta.', 'La Patagonia es preciosa en otoño.', 'Valentina estudia en la Universidad de La Plata.', 'Tomás juega en Boca y Matías en River.', 'Mi tía Rosa cocina como nadie.', 'Ushuaia es la ciudad más austral del país.'];
  const YELLOW = [...COMMAS, ...PERIODS, ...ASKS, ...QUOTES, ...COLONS, ...NAMES];

  /* ---------- Naranja: números y símbolos ---------- */
  const nums = digits => Array.from({ length: 30 }, () => Array.from({ length: rint(2, 4) }, () => digits[Math.floor(Math.random() * digits.length)]).join('')).join(' ');
  const price = () => '$ ' + thousands(rint(1, 99) * (Math.random() < .5 ? 50 : 1000) + (Math.random() < .3 ? 900 : 0));
  const date = () => `${String(rint(1, 28)).padStart(2, '0')}/${String(rint(1, 12)).padStart(2, '0')}/20${rint(24, 27)}`;
  const hour = () => `${String(rint(7, 21)).padStart(2, '0')}:${['00', '15', '30', '45'][rint(0, 3)]}`;
  const phone = () => `11-${rint(4000, 6999)}-${rint(1000, 9999)}`;

  /* ---------- Verde: palabras frecuentes ---------- */
  const TOP = 'de la que el en y a los se del las un por con no una su para es al lo como más o pero sus le ha me si sin sobre este ya entre cuando todo esta ser son dos también fue había era muy años hasta desde está mi porque qué solo han yo hay vez puede todos así nos ni parte tiene él uno donde bien tiempo mismo ese ahora cada vida otro después te otros aunque esa eso hace otra tan durante siempre día tanto ella tres sí dijo sido gran país según menos mundo año antes estado contra sino forma caso nada hacer general estaba poco estos mayor ante unos les algo hacia casa ellos ayer hecho primera mucho mientras además quien momento'.split(' ');
  const CONNECT = 'porque aunque entonces además sin embargo mientras después también por eso en cambio es decir por ejemplo así que primero luego finalmente incluso tampoco todavía pero sino cuando como si'.split(' ');
  const VERBS = 'hacer tener decir poder ir ver dar saber querer llegar pasar deber poner parecer quedar creer hablar llevar dejar seguir encontrar llamar venir pensar salir volver tomar conocer vivir sentir trabajar escribir leer mandar pagar buscar esperar entender necesitar ayudar'.split(' ');
  const PHRASES = ['Nos vemos mañana.', 'Te llamo más tarde.', 'Muchas gracias por todo.', 'Avisame cuando llegues.', 'Ya está todo listo.', 'Lo hablamos en la semana.', 'Qué bueno verte.', 'Perdón por la demora.', 'Cualquier cosa me avisás.', 'Quedamos así entonces.', 'Me parece muy bien.', 'Hoy no puedo, mañana sí.', 'Dale, lo vemos.', 'Llego en diez minutos.'];

  /* ---------- Azul: textos de trabajo ---------- */
  const MAIL = ['Hola, Marta: ¿cómo estás?', 'Buen día, equipo.', 'Estimado Juan: te escribo por el pedido de la semana pasada.', 'Quedo atento a tu respuesta.', 'Saludos cordiales.', 'Muchas gracias por la información.', 'Te adjunto el archivo que me pediste.', 'Cualquier duda, quedo a disposición.', 'Hola, Sergio: te confirmo la reunión del jueves.', 'Un abrazo y buena semana.'];
  const ASKWORK = ['Te paso el presupuesto actualizado.', '¿Podés confirmar el horario de entrega?', 'Necesito la factura antes del viernes.', 'Ya envié el pedido por correo.', '¿Me reenviás el último informe, por favor?', 'El pago se acreditó esta mañana.', 'Revisé la planilla y está todo bien.', 'Mañana te mando la propuesta final.', '¿Podemos pasar la reunión para las 16:00?', 'Recibí tu mensaje; lo veo y te respondo.'];
  const FIRST = ['Laura', 'Pablo', 'Sofía', 'Martín', 'Carla', 'Diego', 'Julieta', 'Lucas', 'Camila', 'Nicolás', 'Florencia', 'Matías'];
  const LAST = ['Gómez', 'Fernández', 'Rodríguez', 'López', 'Martínez', 'Pérez', 'García', 'Sánchez', 'Romero', 'Díaz', 'Torres', 'Acosta'];
  const STREETS = ['Av. Corrientes', 'Av. Santa Fe', 'San Martín', 'Belgrano', 'Av. Rivadavia', 'Sarmiento', 'Mitre', 'Av. Colón', 'Moreno', 'Av. Libertador'];
  const CITIES = ['CABA', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata', 'Salta', 'Neuquén'];
  const ITEMS = ['yerba 1 kg', 'café molido', 'resma A4', 'cartuchos negros', 'sillas de oficina', 'botellas de agua', 'cuadernos', 'monitores 24"'];
  const person = () => `${pick(FIRST, 1)} ${pick(LAST, 1)}`;
  const client = () => `Cliente: ${person()}. DNI ${thousands(rint(20000000, 45999999))}. Tel. ${phone()}.`;
  const address = () => `${pick(STREETS, 1)} ${rint(100, 4999)}, piso ${rint(1, 12)}, depto. ${'ABCDEF'[rint(0, 5)]}, ${pick(CITIES, 1)}.`;
  const row = () => `Producto: ${pick(ITEMS, 1)}; cantidad: ${rint(1, 40)}; precio: ${price()}.`;
  const CHATS = ['Buen día, ¿llegó el pedido?', 'Sí, llegó todo bien. ¡Gracias!', 'Hoy salgo un poco antes, aviso por las dudas.', '¿Me confirmás la dirección de entrega?', 'Listo, ya lo cargué en el sistema.', 'Perdón, me olvidé de mandarlo. Va ahora.', '¿Seguimos mañana a las 9?', 'Perfecto, nos vemos ahí.', 'Te llamo en cinco minutos.', 'Ya está pago, te mando el comprobante.'];
  const REPORT = () => `En ${pick(['enero', 'marzo', 'mayo', 'julio', 'septiembre', 'noviembre'], 1)} las ventas ${Math.random() < .7 ? 'subieron' : 'bajaron'} un ${rint(2, 18)}% respecto del mes anterior. Se atendieron ${rint(80, 950)} pedidos y el ticket promedio fue de ${price()}.`;

  /* ---------- The belts ---------- */
  const BELTS = [
    { id: 'amarillo', name: 'Cinturón amarillo', color: '#E2B33C', theme: 'Mayúsculas y puntuación', desc: 'Comas, puntos, preguntas, comillas y nombres propios: escribir como en un mensaje de verdad.', goal: 25,
      tip: 'Shift con el meñique de la mano contraria a la letra. Los signos de apertura (¿ ¡) van antes de la frase.',
      lessons: [['Comas', () => sentences(COMMAS, 5)], ['Punto y mayúscula', () => sentences(PERIODS, 5)], ['Preguntas y exclamaciones', () => sentences(ASKS, 7)], ['Comillas y paréntesis', () => sentences(QUOTES, 4)], ['Dos puntos y punto y coma', () => sentences(COLONS, 4)], ['Nombres propios', () => sentences(NAMES, 5)], ['Todo junto', () => sentences(YELLOW, 6)], ['Repaso amarillo', () => sentences(YELLOW, 8)]] },
    { id: 'naranja', name: 'Cinturón naranja', color: '#E07B35', theme: 'Números y símbolos', desc: 'La fila de los números, precios, fechas, horas, porcentajes y teléfonos.', goal: 20,
      tip: 'Cada número se escribe con el mismo dedo que la letra de abajo: el 4 y el 5 con el índice izquierdo, el 6 y el 7 con el derecho.',
      lessons: [['Números del 1 al 5', () => nums('12345')], ['Números del 6 al 0', () => nums('67890')], ['Precios', () => Array.from({ length: 10 }, () => `Cuesta ${price()}.`).join(' ')], ['Fechas y horas', () => Array.from({ length: 5 }, () => `El ${date()} a las ${hour()}.`).join(' ')], ['Porcentajes', () => Array.from({ length: 10 }, () => `${['Descuento del', 'Subió un', 'Bajó un', 'Un'][rint(0, 3)]} ${rint(2, 60)}%.`).join(' ')], ['Teléfonos y códigos', () => Array.from({ length: 5 }, () => `Tel. ${phone()} (CP ${rint(1000, 9499)}).`).join(' ')], ['Cuentas', () => Array.from({ length: 11 }, () => { const a = rint(2, 40), b = rint(2, 12); return Math.random() < .5 ? `${a} + ${b} = ${a + b}` : `${a} * ${b} = ${a * b}`; }).join('; ') + '.'], ['Repaso naranja', () => [`Pedido del ${date()}:`, row(), `Entrega a las ${hour()}.`, `Total con ${rint(5, 25)}% de descuento.`].join(' ')]] },
    { id: 'verde', name: 'Cinturón verde', color: '#3A9654', theme: 'Palabras frecuentes', desc: 'Las palabras que más se usan en español: dominarlas es la mitad de la velocidad.', goal: 30,
      tip: 'Las palabras cortas se escriben "de un golpe": pensá la palabra entera, no letra por letra.',
      lessons: [['Las 25 más usadas', () => words(TOP.slice(0, 25), 34)], ['De la 26 a la 50', () => words(TOP.slice(25, 50), 32)], ['De la 51 a la 75', () => words(TOP.slice(50, 75), 30)], ['De la 76 a la 100', () => words(TOP.slice(75, 100), 30)], ['Conectores', () => words(CONNECT, 26)], ['Verbos de todos los días', () => words(VERBS, 26)], ['Frases cortas', () => sentences(PHRASES, 7)], ['Repaso verde', () => words(TOP, 36)]] },
    { id: 'azul', name: 'Cinturón azul', color: '#3B6BCB', theme: 'Textos de trabajo', desc: 'Mails, pedidos, datos de clientes, direcciones y planillas: lo que se escribe en una oficina.', goal: 32,
      tip: 'En los datos, la precisión vale más que la velocidad: un número mal escrito es un pedido perdido.',
      lessons: [['Saludos y cierres de mail', () => sentences(MAIL, 5)], ['Pedidos y respuestas', () => sentences(ASKWORK, 5)], ['Datos de clientes', () => [client(), client(), client()].join(' ')], ['Direcciones', () => [address(), address(), address()].join(' ')], ['Planillas', () => [row(), row(), row()].join(' ')], ['Mensajes de trabajo', () => sentences(CHATS, 6)], ['Reportes', () => REPORT() + ' ' + sentences(ASKWORK, 2)], ['Repaso azul', () => [sentences(MAIL, 1), sentences(ASKWORK, 2), client()].join(' ')]] },
    { id: 'negro', name: 'Cinturón negro', color: '#1F2421', theme: 'Velocidad', desc: 'Ocho lecciones con la meta cada vez más alta: de 35 a 70 palabras por minuto, con 95% de precisión.', goal: 35,
      tip: 'Mantené un ritmo parejo: es más rápido no frenar que correr y corregir.',
      lessons: [35, 40, 45, 50, 55, 60, 65, 70].map((goal, i) => [`Meta: ${goal} ppm`, () => i % 2 ? sentences([...PHRASES, ...ASKWORK, ...COMMAS], 5) : words(TOP, 34), goal])},
  ];
  const ALL = [];
  BELTS.forEach((b, bi) => {
    b.lessons = b.lessons.map(([name, gen, goal], i) => {
      const l = { id: 'b' + (bi + 1) + 'abcdefgh'[i], belt: bi, n: i + 1, name, goal: goal || b.goal, type: 'belt', gen };
      ALL.push(l); return l;
    });
  });
  return { list: BELTS, lessons: ALL };
})();
