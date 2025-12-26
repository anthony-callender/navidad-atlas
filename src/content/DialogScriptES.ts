import { DialogueLine } from '../systems/DialogueSystem';

export const DialogScriptES = {
  // Cabina - Inicio del juego
  cabinStart: [
    {
      speaker: 'June',
      text: "Ugh... ¿ya es de mañana? Mi estómago ruge más fuerte que el viento afuera."
    },
    {
      speaker: 'June',
      text: "¿Tony? ¡TONY! ¿Dónde está ese tipo? Más le vale no estar cortando leña con este clima."
    },
    {
      speaker: 'June',
      text: "*suspiro* Supongo que tengo que salir. Si me congelo, lo voy a acechar como fantasma."
    }
  ] as DialogueLine[],
  
  // Primer encuentro con Gabi
  meetGabi: [
    {
      speaker: 'Gabi',
      text: "¡Oh! Perdóname, niña. Parece que... estoy terriblemente perdido."
    },
    {
      speaker: 'June',
      text: "¿Perdido? Escogiste un gran lugar para ello—en medio de la nada, congelándote. Cinco estrellas."
    },
    {
      speaker: 'Gabi',
      text: "Desearía poder explicar, pero... no puedo recordar. Mi nombre, mi propósito... todo es niebla."
    },
    {
      speaker: 'June',
      text: "¿Amnesia? ¿En un bosque misterioso? Esto es un sueño muy raro o mi vida se puso interesante."
    },
    {
      speaker: 'Gabi',
      text: "Estos símbolos tallados en las piedras... me llaman de alguna manera."
    },
    {
      speaker: 'June',
      text: "Está bien, anciano. Busquemos tus recuerdos. No puede ser más raro que mi mañana hasta ahora."
    }
  ] as DialogueLine[],

  // Bosque Oeste: encuentro con Tony -> el oso lo arrebata
  tonyFoundWoods: [
    { speaker: 'Tony', text: '¡June! Hey—perdón. Sé que desaparecí.' },
    { speaker: 'June', text: '“Desaparecí” es una forma linda de decir “me diste un ataque de pánico”.' },
    { speaker: 'Tony', text: 'Estaba cortando un arbolito. Para la cabaña. Cosas de Navidad.' },
    { speaker: 'June', text: 'Te metiste al bosque embrujado por decoración interior. Increíble.' },
    { speaker: 'Tony', text: 'Escucha… algo se sentía raro. Como si el bosque… escuchara.' },
    { speaker: 'June', text: 'Sí. Ese es el ambiente. Ese es TODO el ambiente.' }
  ] as DialogueLine[],

  tonyBearSnatch: [
    { speaker: 'Tony', text: '¿Oíste eso?' },
    { speaker: 'June', text: 'Por favor dime que eso fue… ¿viento?' },
    { speaker: 'Tony', text: 'June—¡CORRE!' }
  ] as DialogueLine[],

  // Rescate de Tony (jaula) — conversación emocional + reafirmación
  tonyInCage: [
    { speaker: 'June', text: '¡Tony! Dios mío—¿estás bien?' },
    { speaker: 'Tony', text: '¿Físicamente? Sí. ¿Mentalmente? …Me siento estúpido.' },
    { speaker: 'June', text: 'Nope. No permitido. No hoy.' },
    { speaker: 'Tony', text: 'Pensé que podía manejar una cosa simple. Un árbol. Una sorpresa.' },
    { speaker: 'Tony', text: 'Y terminé atrapado como un personaje secundario.' },
    { speaker: 'June', text: 'Tú no eres “secundario”. Tú eres tú. Mi persona.' },
    { speaker: 'Tony', text: 'Es como si mi cabeza me gritara que soy un fracaso… y suena convincente.' },
    { speaker: 'June', text: 'Ok. Mírame. Escúchame.' },
    { speaker: 'June', text: 'Amor… estos pensamientos y emociones que estás experimentando, aunque suenen reales y convincentes, son falsos.' },
    { speaker: 'June', text: 'Has logrado muchísimo, eres un gran amigo, hermano, trabajador y novio.' },
    { speaker: 'June', text: 'Pero más importante: mereces amor y cuidado por el simple hecho de existir.' },
    { speaker: 'June', text: 'Dios te ama por el simple hecho de ser su hijo.' },
    { speaker: 'June', text: 'Y mereces todo porque eres su hijo.' },
    { speaker: 'Tony', text: '…No te merezco.' },
    { speaker: 'June', text: 'Esa es la mentira. No tienes que sufrir para “ganarte” el amor.' },
    { speaker: 'June', text: 'Puedes tener miedo. Puedes necesitar ayuda. Sigues siendo tú.' },
    { speaker: 'Tony', text: 'Yo solo… quería que Navidad se sintiera segura para ti.' },
    { speaker: 'June', text: 'Lo haces. Todos los días. El cacao. Las pequeñas preguntas. El esfuerzo.' },
    { speaker: 'June', text: 'Y estoy aquí. Te tengo. Nos vamos juntos, ¿sí?' },
    { speaker: 'Tony', text: 'Sí. Juntos.' }
  ] as DialogueLine[],

  diracSwordAppears: [
    { speaker: 'June', text: '…Ok, el bosque secuestra a mi novio y ahora una espada simplemente… está aquí.' },
    { speaker: 'June', text: 'Y en ella: (i γ^μ ∂_μ − m) ψ = 0.' },
    { speaker: 'June', text: 'Dirac. Genial. Nada dice “romance” como mecánica cuántica relativista.' }
  ] as DialogueLine[],

  afterBearDefeated: [
    { speaker: 'Tony', text: 'Tú… tú sí lo lograste.' },
    { speaker: 'June', text: 'Voy a estar adolorida una semana, pero sí.' },
    { speaker: 'Tony', text: 'Voy a encontrar las llaves de la caja del regalo. Lo prometo.' },
    { speaker: 'Tony', text: 'Lo que sea que haya en ese regalo… importa.' },
    { speaker: 'June', text: 'Ok. Entonces me voy al norte. Algo está esperando detrás de ese portón.' }
  ] as DialogueLine[],
  
  // Notas de pista del rompecabezas
  puzzleHint1: [
    {
      speaker: 'Piedra Tallada',
      text: "Cuando el pino alcanza hacia la luna creciente, la estrella guía se revela."
    }
  ] as DialogueLine[],
  
  puzzleHint2: [
    {
      speaker: 'Nota Antigua',
      text: "La suma de símbolos abre el camino: PINO + LUNA = ESTRELLA. Busca el equilibrio."
    }
  ] as DialogueLine[],
  
  // Rompecabezas resuelto
  puzzleSolved: [
    {
      speaker: 'June',
      text: "¡Wow! Las piedras están brillando—¡algo se está manifestando de la nada!"
    },
    {
      speaker: 'June',
      text: "¿Un cofre simplemente... apareció? Ok, oficialmente más raro de lo que pensé."
    }
  ] as DialogueLine[],
  
  // Conseguí la Reliquia Llave
  gotKeyRelic: [
    {
      speaker: 'June',
      text: "Esta llave... está tibia y pulsando con luz. Se siente antigua, muy antigua de verdad."
    },
    {
      speaker: 'June',
      text: "Ese portal sellado en el bosque—apuesto a que esto es lo que ha estado esperando."
    }
  ] as DialogueLine[],
  
  // Portal del jefe sin llave
  bossGateNoKey: [
    {
      speaker: 'June',
      text: "Un portal masivo cubierto de símbolos... está sellado herméticamente. Como 'no va a pasar sin una llave'."
    }
  ] as DialogueLine[],
  
  // Portal del jefe con llave
  bossGateWithKey: [
    {
      speaker: 'June',
      text: "La llave brilla más intenso... vibrando en mi mano. Este portal definitivamente está por abrirse."
    },
    {
      speaker: 'June',
      text: "Okay June, veamos qué has estado guardando por quién-sabe-cuánto-tiempo."
    }
  ] as DialogueLine[],
  
  // Jefe derrotado
  bossDefeated: [
    {
      speaker: 'June',
      text: "*jadeando* ¿Qué... qué FUE esa cosa? ¿Algún tipo de guardián?"
    },
    {
      speaker: 'June',
      text: "Dejó este símbolo—brillando con la misma luz que la llave. ¡Esto tiene que ser lo que Gabi necesita!"
    }
  ] as DialogueLine[],
  
  // Regreso a Gabi después del jefe (LA REVELACIÓN)
  gabrielReveal: [
    {
      speaker: 'Gabi',
      text: "¡Has regresado! Y llevas... el Símbolo de la Memoria. Puedo sentir su poder desde aquí."
    },
    {
      speaker: 'June',
      text: "Sí, sobre eso—tuve que pelear con una cosa poseída de venado. De nada, por cierto."
    },
    {
      speaker: 'Gabi',
      text: "Déjame... *tocando el símbolo* Oh. OH. Todo está regresando."
    },
    {
      speaker: 'Gabi',
      text: "Mi nombre es Gabriel. Soy... soy un mensajero."
    },
    {
      speaker: 'June',
      text: "¿Gabriel? Espera—¿Gabriel como EL Gabriel? ¿De... de la Biblia?"
    },
    {
      speaker: 'Gabriel',
      text: "Sí, niña. Fui enviado a traer noticias a una joven llamada María."
    },
    {
      speaker: 'Gabriel',
      text: "Ella dará a luz un hijo, y su nombre será Emmanuel—'Dios está con nosotros'."
    },
    {
      speaker: 'June',
      text: "Lo siento, ¿QUÉ? ¿Ayudé a un ÁNGEL actual a recordar su misión? ¡Este es el martes más raro de todos!"
    },
    {
      speaker: 'Gabriel',
      text: "Has hecho más que ayudar—me has recordado por qué camino entre mortales."
    },
    {
      speaker: 'Gabriel',
      text: "Por favor, toma este regalo. Un pequeño recordatorio de que la esperanza nace en los lugares más inesperados."
    },
    {
      speaker: 'June',
      text: "Un pesebre de natividad diminuto... es hermoso. Imposiblemente hermoso."
    },
    {
      speaker: 'Gabriel',
      text: "Que te recuerde: incluso en el invierno más frío, nueva luz encuentra su camino. Adiós, June."
    },
    {
      speaker: 'June',
      text: "Espera, ¿simplemente vas a—okay, se fue. Desvanecido. Por supuesto. Porque ángeles."
    }
  ] as DialogueLine[],
  
  // Final de la cabina - Post Final Acto (Tony fue parte de todo)
  cabinEnding: [
    {
      speaker: 'June',
      text: "Casa. Casa de verdad. Con paredes que no intentan comernos."
    },
    {
      speaker: 'Tony',
      text: "Sigo procesando la parte en la que te secuestraron y yo tuve que hacer lo de héroe."
    },
    {
      speaker: 'June',
      text: "Lo hiciste genial. Fuiste tú… incluso con miedo. Ese es el punto."
    },
    {
      speaker: 'Tony',
      text: "Entonces solicito oficialmente: cacao, mantas y un árbol que se quede quieto."
    },
    {
      speaker: 'June',
      text: "Trato. Y—buenas noticias. Sí encontraste las llaves del regalo."
    },
    {
      speaker: 'Tony',
      text: "Sí. Mi cerebro por fin fue útil otra vez."
    },
    {
      speaker: 'June',
      text: "Primero… decoramos juntos. Luego abrimos el regalo. Nada más de misterios esta noche."
    }
  ] as DialogueLine[],

  // Acto final: llegada al portón norte + captura de June + resolución de Tony (rescue_june)
  finalGateArrival: [
    { speaker: 'Tony', text: 'Norte… ahí está.' },
    { speaker: 'June', text: 'Ok. Hacemos esto y luego nos vamos a casa. Árbol, cacao, regalo. Normal.' },
    { speaker: 'Tony', text: 'Tengo las llaves del regalo. Lo que sea que haya en esa caja… lo enfrentaremos juntos.' }
  ] as DialogueLine[],

  // Nota: esta parte es corta a propósito porque en la escena se auto-avanza con temporizador.
  finalJuneCaptured: [
    { speaker: 'June', text: '…Espera. ¿Por qué el aire está haciendo eso?' },
    { speaker: 'Tony', text: 'June—¡detrás de ti!' },
    { speaker: 'June', text: 'Oh—NO—' }
  ] as DialogueLine[],

  finalTonyResolve: [
    { speaker: 'Tony', text: '¡June!' },
    { speaker: 'Tony', text: 'No… no. Aguanta. Voy por ti.' },
    { speaker: 'Tony', text: 'Tengo que entrar. Encontrar la llave. Abrir esa puerta.' }
  ] as DialogueLine[],

  // Rescate de June: conversación en la jaula (cuando Tony se acerca y presiona E)
  juneCageTalk: [
    { speaker: 'Tony', text: 'June… mírame. Estoy aquí.' },
    { speaker: 'June', text: 'Tony… lo siento. Me distraje un segundo y—' },
    { speaker: 'Tony', text: 'No. No me debes disculpas. Te atacaron. Eso no dice nada de ti.' },
    { speaker: 'June', text: 'Se siente como si todo lo que hice no importara… como si me hubiera quedado sin fuerza.' },
    { speaker: 'Tony', text: 'Escúchame: todavía importas. Todavía eres tú. Y yo no me voy a rendir contigo adentro.' },
    { speaker: 'Tony', text: 'Se que aveces es dificil recordarlo o creerlo...' },
    { speaker: 'June', text: '…Sí.' },
    { speaker: 'Tony', text: 'honey, todo lo que has logrado hasta ahora es porque tomaste la decision dificil de salir Adelante.' },
    { speaker: 'June', text: 'Me cuesta sentirlo real cuando estoy aquí encerrada.' },
    { speaker: 'Tony', text: 'Se que aveces las voces o personas te hacen sentir como si realmente no has logrado nada.' },
    { speaker: 'Tony', text: 'Pero las cosas que has hecho a sido principalmente por Dios y por tus esfuerzos mi Cielo.' },
    { speaker: 'Tony', text: 'Nadie puede quitarte eso, el dinero que has hecho, las personas que has ayudado, y el crecimiento que has tenido.' },
    { speaker: 'June', text: '…Gracias. Necesitaba escucharlo de alguien que no sea mi miedo.' },
    { speaker: 'Tony', text: 'Bien. Ahora me toca a mí. Voy a encontrar la llave. Voy a abrir esa puerta. Y voy a sacarte.' },
    { speaker: 'June', text: 'Ok. Tony… ve. Pero prométeme algo.' },
    { speaker: 'Tony', text: 'Lo que sea.' },
    { speaker: 'June', text: 'Que vuelves. No como héroe. Como tú.' },
    { speaker: 'Tony', text: 'Te lo prometo. Siempre vuelvo.' }
  ] as DialogueLine[],

  /**
   * Final Act (NEW): Shadow healing scene
   *
   * NOTE: The user provided a long lyric reference. We do NOT reproduce copyrighted lyrics.
   * This is original dialogue inspired by the theme: making peace with your shadow, choosing love, and moving forward together.
   */
  shadowHealing: [
    { speaker: 'Sombra de June', text: '¿De verdad creíste que podías escapar de mí?' },
    { speaker: 'June', text: 'No. Solo… estaba cansada de escuchar tu voz como si fuera la verdad.' },
    { speaker: 'Sombra de June', text: 'Yo soy la verdad: el miedo. La duda. La vergüenza.' },
    { speaker: 'June', text: 'No. Tú eres una parte. No el todo.' },
    { speaker: 'June', text: 'Estoy cansada de vivir “perfecto” para que tú te calles.' },
    { speaker: 'June', text: 'Estoy cansada de correr de mí misma.' },
    { speaker: 'Sombra de June', text: '¿Y quién eres sin mí?' },
    { speaker: 'June', text: 'Una mujer que aprende a amarse otra vez. Aunque tiemble.' },
    { speaker: 'June', text: 'Una mujer que no va a dejar que el orgullo la encierre en silencio.' },
    { speaker: 'June', text: 'Yo… puedo ver luz. No es fantasía. Está aquí.' },
    { speaker: 'Sombra de Tony', text: 'Te la vas a llevar… y vas a fallar. Como siempre.' },
    { speaker: 'Tony', text: 'Estoy cansado.' },
    { speaker: 'Tony', text: 'De darte el volante cada vez que me equivoco.' },
    { speaker: 'Sombra de Tony', text: 'Yo te protejo. Te preparo para el golpe.' },
    { speaker: 'Tony', text: 'No. Tú me humillas y lo llamas “protección”.' },
    { speaker: 'Tony', text: 'Yo no necesito que me frotes la cara en mis errores.' },
    { speaker: 'Tony', text: 'He esperado suficiente. Ya no voy a vivir en esta oscuridad.' },
    { speaker: 'Sombra de Tony', text: 'Sin mí, te vas a romper.' },
    { speaker: 'Tony', text: 'Conmigo, me rompo más lento… pero igual me rompo.' },
    { speaker: 'Tony', text: 'Te deseo paz, pero no te doy más de mi vida.' },
    { speaker: 'June', text: 'Tony…' },
    { speaker: 'Tony', text: 'No voy a quedarme a ver cómo saboteas lo poco que nos queda de fe.' },
    { speaker: 'Sombra de June', text: 'Te odio.' },
    { speaker: 'June', text: 'No. Te tengo miedo.' },
    { speaker: 'June', text: 'Y aun así… puedo sostenerte sin obedecerte.' },
    { speaker: 'Sombra de Tony', text: 'Entonces dime… ¿qué hacemos conmigo?' },
    { speaker: 'Tony', text: 'No te destruyo.' },
    { speaker: 'Tony', text: 'Te abrazo. Y te pongo límites.' },
    { speaker: 'June', text: 'Yo también.' }
  ] as DialogueLine[],

  shadowHealingFinal: [
    {
      speaker: 'Tony',
      text: 'Hemos crecido tanto estos years, mi amor… hemos logrado tanto a pesar de las dudas, dificultades y obstáculos.'
    },
    {
      speaker: 'Tony',
      text: 'Y respondiendo tu pregunta de hace días… sí. Estoy muy feliz y agradecido por lo que hemos logrado.'
    },
    {
      speaker: 'Tony',
      text: 'La casita, los trabajos que hemos hecho, los recursos que tenemos… lo que parecía fantasía ahora es realidad.'
    },
    {
      speaker: 'June',
      text: 'Y vamos por más… con la ayuda de Dios. Como equipo.'
    },
    {
      speaker: 'Tony',
      text: 'Estamos sanando heridas generacionales y construyendo algo para nosotros… y para nuestro futuro.'
    },
    {
      speaker: 'June',
      text: 'Seguiremos adelante. Tomaremos lo que cultivamos estos últimos years… y lo transformaremos en algo hermoso.'
    },
    {
      speaker: 'Tony',
      text: 'I love you more than ever, honey.'
    }
  ] as DialogueLine[],

  finalBossAfter: [
    { speaker: 'Tony', text: 'Estás a salvo. Te tengo.' },
    { speaker: 'June', text: 'Tú… volviste por mí.' },
    { speaker: 'Tony', text: 'Siempre.' }
  ] as DialogueLine[],

  villagePraise: [
    { speaker: 'Aldeano', text: '¡La maldición se fue!' },
    { speaker: 'Aldeano', text: '¡Gracias—gracias!' },
    { speaker: 'June', text: 'Uh. Hola. Esto es… demasiado.' },
    { speaker: 'Tony', text: 'Busquemos a Gabi. Él sabrá qué significa esto.' }
  ] as DialogueLine[],

  gabiFinalWithCouple: [
    { speaker: 'Gabi', text: 'Regresaron… y el bosque ya no tiembla.' },
    { speaker: 'June', text: 'Laponia volvió a respirar. Y nosotros… también.' },
    { speaker: 'Tony', text: 'Pero siento que falta una pieza. Algo que todavía no nos has dicho.' },
    { speaker: 'Gabi', text: '…Sí. La niebla se levantó.' },
    { speaker: 'Gabi', text: 'Mi memoria regresó como una campana en la noche: clara, inevitable.' },
    { speaker: 'June', text: 'Ok. Entonces dilo. Porque mi terapia no cubre “bosques mágicos y ancianos misteriosos”.' },
    { speaker: 'Gabi', text: 'Mi nombre… es Gabriel.' },
    { speaker: 'June', text: '...' },
    { speaker: 'Tony', text: '¿Gabriel… como…?' },
    { speaker: 'Gabriel', text: 'Como el mensajero. El ángel enviado.' },
    { speaker: 'June', text: 'Ah, genial. Claro. Mi semana normal.' },
    { speaker: 'Gabriel', text: 'Ustedes me ayudaron a recordar por qué camino cerca de los hombres: para anunciar esperanza cuando la oscuridad grita más fuerte.' },
    { speaker: 'Gabriel', text: 'Debo volver… a un tiempo anterior. A una joven llamada María.' },
    { speaker: 'Gabriel', text: 'Y entregarle el mensaje: que Dios está con nosotros.' },
    // We reference Scripture without copying a modern copyrighted translation verbatim.
    { speaker: 'Gabriel', text: '“No temas… recibirás una buena noticia: te será dado un Hijo.” (cf. Lucas 1:30–33; 2:10–11)' },
    { speaker: 'Gabriel', text: 'Ese Niño no es solo una historia: es la señal de que el amor de Dios entra al mundo… incluso en un pesebre.' },
    { speaker: 'June', text: 'Entonces… ¿todo esto fue para que recordaras tu misión?' },
    { speaker: 'Gabriel', text: 'También fue para que ustedes recordaran la suya.' },
    { speaker: 'Gabriel', text: 'Que el miedo no gobierna su casa. Que el amor puede ser valiente. Que la fe puede ser pequeña… y aun así mover el invierno.' },
    { speaker: 'Tony', text: 'Nos sentimos… sostenidos. Como si no estuviéramos solos.' },
    { speaker: 'Gabriel', text: 'No lo están.' },
    { speaker: 'Gabriel', text: 'Vayan a casa. Abracen el calor. Terminen su noche.' },
    { speaker: 'June', text: 'Árbol, cacao… y el regalo.' },
    { speaker: 'Gabriel', text: 'Sí. Y recuerden: la Navidad no empieza en el regalo… empieza en la promesa.' }
  ] as DialogueLine[],

  // Laponia: los aldeanos se quejan de que el monstruo detuvo la nieve
  laponiaNoSnow: [
    { speaker: 'Aldeano', text: 'Es Navidad… y no hay nieve.' },
    { speaker: 'Aldeano', text: 'El monstruo nos robó el invierno. El aire se siente mal.' },
    { speaker: 'June', text: 'Nosotros… acabamos con la cosa detrás del portón. ¿Está conectado?' },
    { speaker: 'Tony', text: 'Si se alimentaba del miedo… quizá también se alimentaba del *invierno*.' }
  ] as DialogueLine[],

  // Laponia: sermón + recompensa con nevada
  laponiaHeavenSermon: [
    { speaker: 'Voz del Cielo', text: 'Pueblo de Laponia—escúchenme.' },
    { speaker: 'Voz del Cielo', text: 'El miedo congeló su alegría. La oscuridad silenció su temporada.' },
    { speaker: 'Voz del Cielo', text: 'Pero el valor caminó sus caminos. El amor no se dio la vuelta.' },
    { speaker: 'Voz del Cielo', text: 'Bien hecho. Que el invierno regrese—no como maldición… sino como regalo.' },
    { speaker: 'Aldeano', text: 'Miren… ¡miren! El aire—' },
    { speaker: 'June', text: 'Dios mío. Está empezando…' },
    { speaker: 'Tony', text: 'Nieve.' }
  ] as DialogueLine[],
  
  // Regalo abierto (con mensaje de regalo)
  giftOpened: [
    {
      speaker: 'June',
      text: "¡Se está abriendo! ¡Las llaves funcionaron!"
    },
    {
      speaker: 'Nota en la Caja',
      text: "Para aquellos que buscan maravillas: recuerden que la magia vive en la bondad, los misterios se esconden a simple vista, y cada final es un nuevo comienzo. Feliz Navidad. —G"
    },
    {
      speaker: 'June',
      text: "Espera, hay algo más... ¡una tarjeta de regalo!"
    },
    {
      speaker: 'Tarjeta de Regalo',
      text: "🎁 Regalo Especial de Navidad: amazon.com/gift | Código: NAVIDADATLAS2024"
    },
    {
      speaker: 'Tony',
      text: "Eso es... realmente dulce. ¡Y generoso! ¿Quién es 'G'?"
    },
    {
      speaker: 'June',
      text: "Un viejo amigo. Un viejo amigo muy antiguo. Feliz Navidad, Tony."
    },
    {
      speaker: 'Tony',
      text: "Feliz Navidad, June. La mejor aventura-Navidad rara de todas."
    }
  ] as DialogueLine[],
  
  // Interacciones genéricas
  christmasTree: [
    {
      speaker: 'June',
      text: "El árbol huele a pino y canela. Tony siempre escoge los mejores."
    }
  ] as DialogueLine[],
  
  lockedGift: [
    {
      speaker: 'June',
      text: "Cerrado más fuerte que Fort Knox. No hay cantidad de sacudidas o súplicas que abra esta cosa."
    }
  ] as DialogueLine[]
};

