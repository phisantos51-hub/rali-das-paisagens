/* =====================================================================
   RALI DAS PAISAGENS — MISSÕES, PLACAS E EXPLICAÇÕES
   =====================================================================

   Este é o ÚNICO arquivo que você precisa mexer para criar ou mudar
   fases. Abra-o num editor de texto simples (Bloco de Notas, ou o
   editor do próprio GitHub, clicando no lápis ✏️).

   COMO A FASE FUNCIONA
   - Antes da corrida aparece a MISSÃO (texto + imagens das placas certas).
   - Na estrada aparecem placas. A criança passa por cima das CERTAS
     e desvia das ERRADAS.
   - Se pegar uma placa errada, o carro perde velocidade e aparece a
     EXPLICAÇÃO daquela placa (campo "porque").
   - Nas BIFURCAÇÕES, a estrada se divide em duas e aparece a instrução.

   COMO ACRESCENTAR UMA FASE NOVA
   1. Copie um bloco inteiro de fase, desde a chave "{" até a chave "},"
      (há um MODELO comentado no fim deste arquivo).
   2. Cole logo abaixo da última fase do mesmo ano.
   3. Troque o "id" por um nome que ainda não exista (sem espaços e sem
      acentos, por exemplo "2-feira-livre").
   4. Troque os textos, as imagens e as explicações.
   5. Salve. Pronto! A fase aparece sozinha na tela inicial.

   REGRAS IMPORTANTES (para não quebrar o jogo)
   - Todo texto fica entre aspas: "assim".
   - Depois de cada item de uma lista vem uma vírgula.
   - As imagens são EMOJIS (figurinhas). Para escolher um emoji, você
     pode copiar de um site de emojis e colar entre as aspas.
     Os emojis usados nas fases que vêm com o jogo já têm o desenho
     guardado na pasta "imagens/emoji", e por isso funcionam igual em
     todos os computadores. Um emoji novo também funciona, mas o desenho
     depende do computador (veja o arquivo LEIAME/README).
   - Não coloque emojis no meio das frases: use emojis só no campo "img".
   - Frases curtas! No 1º ano, o jogo mostra tudo em LETRA MAIÚSCULA
     automaticamente.

   CAMPOS DE UMA FASE
   id          nome único da fase (sem espaços e sem acentos)
   ano         1, 2 ou 3
   titulo      nome que aparece no cartão da fase
   paisagem    "cidade", "campo", "praia", "floresta" ou "rio"
   tempo       "sol", "chuva" ou "noite"
   missao      frase da missão (curta!)
   certas      placas que a criança deve PEGAR:
                 { img: "🏫", nome: "Escola", sobre: "frase curta (opcional)" }
   erradas     placas que a criança deve DESVIAR:
                 { img: "🐄", nome: "Vaca", porque: "explicação curta" }
   bifurcacoes caminhos divididos (pode ter 0, 1 ou 2):
                 {
                   instrucao: "Vire à direita para chegar à escola",
                   certo: "direita",            (ou "esquerda")
                   esquerda: { img: "🏠", nome: "Casa" },
                   direita:  { img: "🏫", nome: "Escola" },
                   acerto: "frase quando acerta",
                   porque: "frase quando erra"
                 }
   minimapa    true para mostrar o mapa com legenda no canto (3º ano).
               Com o mapa ligado, os lugares das bifurcações aparecem
               SÓ no mapa, e a criança precisa ler os símbolos.
   placas      (opcional) quantas fileiras de placas a corrida terá.
   obstaculos  (opcional) lista de obstáculos para desviar:
                 { img: "🚧", nome: "Cone", porque: "explicação" }
               Se não tiver, o jogo usa obstáculos da paisagem.
   ===================================================================== */

var FASES = [

  /* ===================================================================
     1º ANO — Lugares de vivência, direita e esquerda, dia e noite, tempo
     =================================================================== */
  {
    id: "1-estudar-brincar",
    ano: 1,
    titulo: "Escola e praça",
    paisagem: "cidade",
    tempo: "sol",
    missao: "Pegue os lugares onde a gente estuda e brinca",
    certas: [
      { img: "🏫", nome: "Escola", sobre: "Na escola a gente aprende." },
      { img: "⛲", nome: "Praça", sobre: "Na praça a gente brinca." },
      { img: "🛝", nome: "Parquinho", sobre: "No parquinho a gente brinca." }
    ],
    erradas: [
      { img: "🏥", nome: "Posto de saúde", porque: "No posto de saúde a gente cuida da saúde." },
      { img: "🛒", nome: "Mercado", porque: "No mercado a gente compra comida." }
    ],
    bifurcacoes: [
      {
        instrucao: "Vire à direita para chegar à escola",
        certo: "direita",
        esquerda: { img: "🏠", nome: "Casa" },
        direita: { img: "🏫", nome: "Escola" },
        acerto: "Isso! A escola ficava à direita.",
        porque: "A escola ficava à DIREITA."
      }
    ]
  },

  {
    id: "1-comprar-cuidar",
    ano: 1,
    titulo: "Mercado e posto de saúde",
    paisagem: "cidade",
    tempo: "sol",
    missao: "Pegue os lugares onde a gente compra comida",
    certas: [
      { img: "🛒", nome: "Mercado", sobre: "No mercado a gente compra comida." },
      { img: "🥖", nome: "Padaria", sobre: "Na padaria a gente compra pão." },
      { img: "🍎", nome: "Feira", sobre: "Na feira tem frutas e verduras." }
    ],
    erradas: [
      { img: "🏫", nome: "Escola", porque: "Na escola a gente estuda." },
      { img: "⛲", nome: "Praça", porque: "Na praça a gente brinca e passeia." }
    ],
    bifurcacoes: [
      {
        instrucao: "Vire à esquerda para ir ao posto de saúde",
        certo: "esquerda",
        esquerda: { img: "🏥", nome: "Posto de saúde" },
        direita: { img: "⛲", nome: "Praça" },
        acerto: "Isso! O posto de saúde ficava à esquerda.",
        porque: "O posto de saúde ficava à ESQUERDA."
      }
    ]
  },

  {
    id: "1-dia-de-sol",
    ano: 1,
    titulo: "Dia de sol",
    paisagem: "floresta",
    tempo: "sol",
    missao: "É dia! Pegue o que a gente vê de dia",
    certas: [
      { img: "☀️", nome: "Sol", sobre: "O sol brilha de dia." },
      { img: "🌈", nome: "Arco-íris", sobre: "O arco-íris aparece de dia." },
      { img: "🦋", nome: "Borboleta", sobre: "A borboleta voa de dia." },
      { img: "🐓", nome: "Galo", sobre: "O galo canta de manhã." }
    ],
    erradas: [
      { img: "🌙", nome: "Lua", porque: "A lua brilha à noite." },
      { img: "⭐", nome: "Estrela", porque: "Vemos as estrelas à noite." },
      { img: "🦉", nome: "Coruja", porque: "A coruja acorda à noite." }
    ],
    bifurcacoes: [
      {
        instrucao: "Vire à esquerda para ir para casa",
        certo: "esquerda",
        esquerda: { img: "🏠", nome: "Casa" },
        direita: { img: "🛒", nome: "Mercado" },
        acerto: "Isso! A casa ficava à esquerda.",
        porque: "A casa ficava à ESQUERDA."
      }
    ]
  },

  {
    id: "1-noite",
    ano: 1,
    titulo: "Passeio de noite",
    paisagem: "cidade",
    tempo: "noite",
    missao: "É noite! Pegue o que a gente vê à noite",
    certas: [
      { img: "🌙", nome: "Lua", sobre: "A lua brilha à noite." },
      { img: "⭐", nome: "Estrela", sobre: "As estrelas aparecem à noite." },
      { img: "🦉", nome: "Coruja", sobre: "A coruja acorda à noite." }
    ],
    erradas: [
      { img: "☀️", nome: "Sol", porque: "O sol aparece de dia." },
      { img: "🌈", nome: "Arco-íris", porque: "O arco-íris aparece de dia." },
      { img: "🕶️", nome: "Óculos de sol", porque: "Óculos de sol é para o dia." }
    ],
    bifurcacoes: [
      {
        instrucao: "Vire à direita para ir para casa",
        certo: "direita",
        esquerda: { img: "🏫", nome: "Escola" },
        direita: { img: "🏠", nome: "Casa" },
        acerto: "Isso! A casa ficava à direita.",
        porque: "A casa ficava à DIREITA."
      }
    ]
  },

  {
    id: "1-chuva",
    ano: 1,
    titulo: "Dia de chuva",
    paisagem: "campo",
    tempo: "chuva",
    missao: "Está chovendo! Pegue o que protege da chuva",
    certas: [
      { img: "☂️", nome: "Guarda-chuva", sobre: "O guarda-chuva protege da chuva." },
      { img: "🧥", nome: "Capa", sobre: "A capa protege da chuva." },
      { img: "👢", nome: "Bota", sobre: "A bota protege os pés da água." }
    ],
    erradas: [
      { img: "🕶️", nome: "Óculos de sol", porque: "Óculos de sol é para dia de sol." },
      { img: "🩱", nome: "Maiô", porque: "Maiô é para nadar no calor." },
      { img: "⛱️", nome: "Guarda-sol", porque: "Guarda-sol é para a praia no sol." }
    ],
    bifurcacoes: [
      {
        instrucao: "Vire à esquerda para chegar à escola",
        certo: "esquerda",
        esquerda: { img: "🏫", nome: "Escola" },
        direita: { img: "⛲", nome: "Praça" },
        acerto: "Isso! A escola ficava à esquerda.",
        porque: "A escola ficava à ESQUERDA."
      },
      {
        instrucao: "Vire à direita para voltar para casa",
        certo: "direita",
        esquerda: { img: "🛒", nome: "Mercado" },
        direita: { img: "🏠", nome: "Casa" },
        acerto: "Isso! A casa ficava à direita.",
        porque: "A casa ficava à DIREITA."
      }
    ]
  },

  /* ===================================================================
     2º ANO — Meios de transporte, trabalhos do campo e da cidade,
              pontos de referência
     =================================================================== */
  {
    id: "2-transporte-terra",
    ano: 2,
    titulo: "Transportes da terra",
    paisagem: "cidade",
    tempo: "sol",
    missao: "Pegue os transportes que andam na terra",
    certas: [
      { img: "🚌", nome: "Ônibus", sobre: "O ônibus anda nas ruas." },
      { img: "🚲", nome: "Bicicleta", sobre: "A bicicleta anda nas ruas." },
      { img: "🚆", nome: "Trem", sobre: "O trem anda nos trilhos." },
      { img: "🏍️", nome: "Moto", sobre: "A moto anda nas ruas." }
    ],
    erradas: [
      { img: "✈️", nome: "Avião", porque: "O avião é um transporte aéreo: voa." },
      { img: "⛵", nome: "Barco", porque: "O barco é um transporte aquático." },
      { img: "🚁", nome: "Helicóptero", porque: "O helicóptero voa: é aéreo." }
    ],
    bifurcacoes: [
      {
        instrucao: "Vire depois da padaria para chegar à estação",
        certo: "direita",
        esquerda: { img: "💈", nome: "Barbearia" },
        direita: { img: "🥖", nome: "Padaria" },
        acerto: "Isso! Você virou depois da padaria.",
        porque: "A padaria estava do outro lado. Procure a padaria."
      }
    ]
  },

  {
    id: "2-transporte-agua",
    ano: 2,
    titulo: "Transportes da água",
    paisagem: "rio",
    tempo: "sol",
    missao: "Pegue os transportes que andam na água",
    certas: [
      { img: "🚢", nome: "Navio", sobre: "O navio navega no mar." },
      { img: "⛵", nome: "Veleiro", sobre: "O veleiro usa o vento." },
      { img: "🛶", nome: "Canoa", sobre: "A canoa navega no rio." },
      { img: "🚤", nome: "Lancha", sobre: "A lancha anda na água." }
    ],
    erradas: [
      { img: "🚌", nome: "Ônibus", porque: "O ônibus é terrestre: anda na rua." },
      { img: "✈️", nome: "Avião", porque: "O avião é aéreo: voa." },
      { img: "🚲", nome: "Bicicleta", porque: "A bicicleta é terrestre." }
    ],
    bifurcacoes: [
      {
        instrucao: "Siga pelo caminho da ponte para chegar ao porto",
        certo: "esquerda",
        esquerda: { img: "🌉", nome: "Ponte" },
        direita: { img: "⛪", nome: "Igreja" },
        acerto: "Isso! Você seguiu pelo caminho da ponte.",
        porque: "A ponte estava do outro lado."
      }
    ]
  },

  {
    id: "2-transporte-ar",
    ano: 2,
    titulo: "Transportes do ar",
    paisagem: "praia",
    tempo: "sol",
    missao: "Pegue os transportes que voam",
    certas: [
      { img: "✈️", nome: "Avião", sobre: "O avião voa alto." },
      { img: "🚁", nome: "Helicóptero", sobre: "O helicóptero voa." },
      { img: "🎈", nome: "Balão", sobre: "O balão voa com ar quente." },
      { img: "🪂", nome: "Paraquedas", sobre: "O paraquedas desce do céu." }
    ],
    erradas: [
      { img: "🚢", nome: "Navio", porque: "O navio é aquático: navega." },
      { img: "🚲", nome: "Bicicleta", porque: "A bicicleta é terrestre." },
      { img: "🚆", nome: "Trem", porque: "O trem é terrestre: anda nos trilhos." }
    ],
    bifurcacoes: [
      {
        instrucao: "Vire depois do quiosque para chegar ao aeroporto",
        certo: "esquerda",
        esquerda: { img: "🍹", nome: "Quiosque" },
        direita: { img: "🏖️", nome: "Praia" },
        acerto: "Isso! Você virou depois do quiosque.",
        porque: "O quiosque estava do outro lado."
      }
    ]
  },

  {
    id: "2-trabalho-campo",
    ano: 2,
    titulo: "Trabalhos do campo",
    paisagem: "campo",
    tempo: "sol",
    missao: "Pegue as placas de trabalhos do campo",
    certas: [
      { img: "🧑‍🌾", nome: "Agricultor", sobre: "O agricultor planta e colhe." },
      { img: "🚜", nome: "Trator", sobre: "O trator ajuda a plantar." },
      { img: "🐄", nome: "Criar gado", sobre: "No campo se cria gado." },
      { img: "🌽", nome: "Colheita", sobre: "No campo se colhe milho." }
    ],
    erradas: [
      { img: "🚕", nome: "Táxi", porque: "O taxista trabalha nas ruas da cidade." },
      { img: "🏢", nome: "Escritório", porque: "Escritórios ficam nos prédios da cidade." },
      { img: "🚇", nome: "Metrô", porque: "O metrô é um trabalho da cidade." }
    ],
    bifurcacoes: [
      {
        instrucao: "Vire depois dos cavalos para chegar à horta",
        certo: "direita",
        esquerda: { img: "🌻", nome: "Girassóis" },
        direita: { img: "🐴", nome: "Cavalos" },
        acerto: "Isso! Você virou depois dos cavalos.",
        porque: "Os cavalos estavam do outro lado."
      }
    ]
  },

  {
    id: "2-trabalho-cidade",
    ano: 2,
    titulo: "Trabalhos da cidade",
    paisagem: "cidade",
    tempo: "sol",
    missao: "Pegue as placas de trabalhos da cidade",
    certas: [
      { img: "🚒", nome: "Bombeiro", sobre: "O bombeiro apaga incêndios." },
      { img: "🏗️", nome: "Construção", sobre: "Na cidade se constroem prédios." },
      { img: "🏪", nome: "Loja", sobre: "Na loja se vendem coisas." },
      { img: "🚕", nome: "Táxi", sobre: "O taxista leva pessoas." }
    ],
    erradas: [
      { img: "🚜", nome: "Trator", porque: "O trator trabalha no campo." },
      { img: "🐑", nome: "Criar ovelhas", porque: "Ovelhas são criadas no campo." },
      { img: "🌾", nome: "Plantação", porque: "A plantação fica no campo." }
    ],
    bifurcacoes: [
      {
        instrucao: "Vire depois da farmácia para chegar ao hospital",
        certo: "esquerda",
        esquerda: { img: "💊", nome: "Farmácia" },
        direita: { img: "🏦", nome: "Banco" },
        acerto: "Isso! Você virou depois da farmácia.",
        porque: "A farmácia estava do outro lado."
      },
      {
        instrucao: "Siga pelo caminho do semáforo para chegar à escola",
        certo: "direita",
        esquerda: { img: "🌳", nome: "Árvore" },
        direita: { img: "🚦", nome: "Semáforo" },
        acerto: "Isso! Você seguiu pelo caminho do semáforo.",
        porque: "O semáforo estava do outro lado."
      }
    ]
  },

  /* ===================================================================
     3º ANO — Paisagem urbana e rural, natural e modificada,
              cuidados com o ambiente, minimapa com legenda
     =================================================================== */
  {
    id: "3-urbana",
    ano: 3,
    titulo: "Paisagem urbana",
    paisagem: "cidade",
    tempo: "sol",
    minimapa: true,
    missao: "Pegue os elementos da paisagem urbana",
    certas: [
      { img: "🏢", nome: "Prédio", sobre: "Prédios são comuns na cidade." },
      { img: "🚦", nome: "Semáforo", sobre: "O semáforo organiza o trânsito." },
      { img: "🚇", nome: "Metrô", sobre: "O metrô leva muita gente na cidade." },
      { img: "🏬", nome: "Shopping", sobre: "Lojas grandes ficam na cidade." }
    ],
    erradas: [
      { img: "🌾", nome: "Plantação", porque: "Plantações fazem parte da paisagem rural." },
      { img: "🐄", nome: "Gado", porque: "A criação de gado é da paisagem rural." },
      { img: "🚜", nome: "Trator", porque: "O trator trabalha na paisagem rural." }
    ],
    bifurcacoes: [
      {
        instrucao: "Siga pela estrada que passa pelo hospital",
        certo: "esquerda",
        esquerda: { img: "🏥", nome: "Hospital" },
        direita: { img: "🏫", nome: "Escola" },
        acerto: "Isso! Você leu o mapa e passou pelo hospital.",
        porque: "No mapa, o hospital estava na estrada da esquerda."
      },
      {
        instrucao: "Siga pela estrada que passa pelo parque",
        certo: "direita",
        esquerda: { img: "🏭", nome: "Fábrica" },
        direita: { img: "🌳", nome: "Parque" },
        acerto: "Isso! Você leu o mapa e passou pelo parque.",
        porque: "No mapa, o parque estava na estrada da direita."
      }
    ]
  },

  {
    id: "3-rural",
    ano: 3,
    titulo: "Paisagem rural",
    paisagem: "campo",
    tempo: "sol",
    minimapa: true,
    missao: "Pegue os elementos da paisagem rural",
    certas: [
      { img: "🌾", nome: "Plantação", sobre: "Plantações ficam na zona rural." },
      { img: "🐄", nome: "Gado", sobre: "O gado é criado na zona rural." },
      { img: "🚜", nome: "Trator", sobre: "O trator trabalha no campo." },
      { img: "🏡", nome: "Sítio", sobre: "O sítio fica na zona rural." }
    ],
    erradas: [
      { img: "🏢", nome: "Prédio", porque: "Prédios altos são da paisagem urbana." },
      { img: "🚇", nome: "Metrô", porque: "O metrô é da paisagem urbana." },
      { img: "🚦", nome: "Semáforo", porque: "Semáforos são comuns na cidade." }
    ],
    bifurcacoes: [
      {
        instrucao: "Siga pela estrada que passa pela capela",
        certo: "direita",
        esquerda: { img: "🏠", nome: "Casa" },
        direita: { img: "⛪", nome: "Capela" },
        acerto: "Isso! Você leu o mapa e passou pela capela.",
        porque: "No mapa, a capela estava na estrada da direita."
      },
      {
        instrucao: "Siga pela estrada que passa pelo lago",
        certo: "esquerda",
        esquerda: { img: "💧", nome: "Lago" },
        direita: { img: "🌲", nome: "Mata" },
        acerto: "Isso! Você leu o mapa e passou pelo lago.",
        porque: "No mapa, o lago estava na estrada da esquerda."
      }
    ]
  },

  {
    id: "3-natural",
    ano: 3,
    titulo: "Paisagem natural",
    paisagem: "floresta",
    tempo: "sol",
    minimapa: true,
    missao: "Pegue os elementos da paisagem natural",
    certas: [
      { img: "🌳", nome: "Árvore", sobre: "A mata é paisagem natural." },
      { img: "⛰️", nome: "Montanha", sobre: "A montanha foi feita pela natureza." },
      { img: "🦜", nome: "Papagaio", sobre: "Os animais fazem parte da natureza." },
      { img: "🌊", nome: "Mar", sobre: "O mar é paisagem natural." }
    ],
    erradas: [
      { img: "🏠", nome: "Casa", porque: "A casa foi construída pelas pessoas: é paisagem modificada." },
      { img: "🌉", nome: "Ponte", porque: "A ponte foi construída pelas pessoas." },
      { img: "🛣️", nome: "Estrada", porque: "A estrada foi feita pelas pessoas: é paisagem modificada." }
    ],
    bifurcacoes: [
      {
        instrucao: "Siga pela estrada que passa pela cachoeira",
        certo: "esquerda",
        esquerda: { img: "🏞️", nome: "Cachoeira" },
        direita: { img: "⛺", nome: "Barraca" },
        acerto: "Isso! Você leu o mapa e passou pela cachoeira.",
        porque: "No mapa, a cachoeira estava na estrada da esquerda."
      }
    ]
  },

  {
    id: "3-modificada",
    ano: 3,
    titulo: "Paisagem modificada",
    paisagem: "rio",
    tempo: "sol",
    minimapa: true,
    missao: "Pegue o que foi construído pelas pessoas",
    certas: [
      { img: "🌉", nome: "Ponte", sobre: "As pessoas construíram a ponte." },
      { img: "🏭", nome: "Fábrica", sobre: "A fábrica modificou a paisagem." },
      { img: "🏘️", nome: "Bairro", sobre: "As casas modificam a paisagem." },
      { img: "⛽", nome: "Posto", sobre: "O posto foi construído pelas pessoas." }
    ],
    erradas: [
      { img: "🐟", nome: "Peixe", porque: "O peixe é da natureza." },
      { img: "🌳", nome: "Árvore", porque: "A árvore nasce na natureza." },
      { img: "🪨", nome: "Pedra", porque: "A pedra é da natureza." }
    ],
    bifurcacoes: [
      {
        instrucao: "Siga pela estrada que passa pelo porto",
        certo: "direita",
        esquerda: { img: "🌲", nome: "Mata" },
        direita: { img: "⚓", nome: "Porto" },
        acerto: "Isso! Você leu o mapa e passou pelo porto.",
        porque: "No mapa, o porto estava na estrada da direita."
      },
      {
        instrucao: "Siga pela estrada que passa pela fábrica",
        certo: "esquerda",
        esquerda: { img: "🏭", nome: "Fábrica" },
        direita: { img: "🏡", nome: "Sítio" },
        acerto: "Isso! Você leu o mapa e passou pela fábrica.",
        porque: "No mapa, a fábrica estava na estrada da esquerda."
      }
    ]
  },

  {
    id: "3-cuidar-ambiente",
    ano: 3,
    titulo: "Cuidar do ambiente",
    paisagem: "rio",
    tempo: "sol",
    minimapa: true,
    missao: "Pegue os itens de reciclagem e o que protege a natureza. Desvie do lixo!",
    certas: [
      { img: "🥫", nome: "Lata", sobre: "Lata vai para a reciclagem." },
      { img: "📰", nome: "Jornal", sobre: "Papel vai para a reciclagem." },
      { img: "🍾", nome: "Garrafa de vidro", sobre: "Vidro vai para a reciclagem." },
      { img: "🌱", nome: "Muda de árvore", sobre: "Plantar árvores protege o rio." }
    ],
    erradas: [
      { img: "🪓", nome: "Machado", porque: "Cortar árvores destrói a mata perto do rio." },
      { img: "🔥", nome: "Queimada", porque: "A queimada destrói a mata e suja o ar." },
      { img: "🛢️", nome: "Óleo", porque: "Óleo jogado no rio deixa a água suja." }
    ],
    obstaculos: [
      { img: "🗑️", nome: "Lixo", porque: "Lixo no chão! O lixo vai na lixeira." },
      { img: "🧃", nome: "Lixo", porque: "Lixo no chão suja a cidade e o rio." }
    ],
    bifurcacoes: [
      {
        instrucao: "Siga pela estrada que passa pelo ponto de reciclagem",
        certo: "direita",
        esquerda: { img: "🏭", nome: "Fábrica" },
        direita: { img: "♻️", nome: "Reciclagem" },
        acerto: "Isso! Você levou o lixo para a reciclagem.",
        porque: "No mapa, a reciclagem estava na estrada da direita."
      }
    ]
  }

  /* ===================================================================
     MODELO DE FASE NOVA
     Copie o bloco abaixo, que começa em ",{" e termina em "}".
     Cole logo DEPOIS da última fase da lista (antes do "];" que fecha
     a lista), fora deste comentário, e preencha com a sua missão.
     A vírgula do começo separa a fase nova da fase anterior.

  ,{
    id: "2-feira-livre",
    ano: 2,
    titulo: "Feira livre",
    paisagem: "cidade",
    tempo: "sol",
    missao: "Pegue o que vem do campo para a feira",
    certas: [
      { img: "🥕", nome: "Cenoura", sobre: "A cenoura é plantada no campo." },
      { img: "🍌", nome: "Banana", sobre: "A banana vem do campo." }
    ],
    erradas: [
      { img: "📱", nome: "Celular", porque: "O celular é feito em fábricas." }
    ],
    bifurcacoes: [
      {
        instrucao: "Vire à esquerda para chegar à feira",
        certo: "esquerda",
        esquerda: { img: "🍎", nome: "Feira" },
        direita: { img: "🏫", nome: "Escola" },
        acerto: "Isso! A feira ficava à esquerda.",
        porque: "A feira ficava à ESQUERDA."
      }
    ]
  }
     =================================================================== */
];

/* Obstáculos que aparecem em cada paisagem quando a fase não define
   os seus. Também podem ser editados. */
var OBSTACULOS_DA_PAISAGEM = {
  cidade:   [{ img: "🚧", nome: "Obra", porque: "Cuidado com a obra! Mude de faixa para desviar." }],
  campo:    [{ img: "🪨", nome: "Pedra", porque: "Cuidado com a pedra! Mude de faixa para desviar." }],
  praia:    [{ img: "🦀", nome: "Caranguejo", porque: "Cuidado com o caranguejo! Mude de faixa." }],
  floresta: [{ img: "🪵", nome: "Tronco", porque: "Um tronco caiu na estrada! Mude de faixa." }],
  rio:      [{ img: "🦆", nome: "Pato", porque: "Um pato atravessando! Mude de faixa para desviar." }]
};
