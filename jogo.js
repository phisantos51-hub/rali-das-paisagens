/* =====================================================================
   RALI DAS PAISAGENS — motor do jogo
   As missões ficam em missoes.js. Aqui fica o funcionamento do jogo.
   ===================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Medidas da pista (em pontos do desenho; a tela é ampliada depois)
     ------------------------------------------------------------------ */
  var LARG = 600, ALT = 800;
  var ESTRADA_X = 120, FAIXA_L = 120;
  var CARRO_Y = 650;               // altura do carro na tela
  var COMP_BIF = 900;              // comprimento do trecho dividido
  var PARADA_BIF = 70;             // onde o carro para se não escolher
  var TOPO_HUD = 76;               // altura do painel de cima
  var VELOCIDADES = { lenta: 150, media: 220, rapida: 300 };
  var CONFIG_ANO = {
    1: { linhas: 7, espaco: 640, dupla: 0, obst: 0.12, fator: 0.85 },
    2: { linhas: 9, espaco: 540, dupla: 0.5, obst: 0.25, fator: 1 },
    3: { linhas: 10, espaco: 500, dupla: 0.65, obst: 0.3, fator: 1 }
  };
  var CORES = { j1: '#e53935', j2: '#1e88e5' };
  var FONTE = '"Trebuchet MS", Verdana, Arial, sans-serif';
  var FONTE_EMOJI = '"Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif';

  var PAISAGENS = {
    cidade: { nome: 'Cidade', img: '🏙️' },
    campo: { nome: 'Campo', img: '🌾' },
    praia: { nome: 'Praia', img: '🏖️' },
    floresta: { nome: 'Floresta', img: '🌳' },
    rio: { nome: 'Rio', img: '🏞️' }
  };
  var TEMPOS = {
    sol: { nome: 'dia de sol', img: '☀️' },
    chuva: { nome: 'dia de chuva', img: '🌧️' },
    noite: { nome: 'noite', img: '🌙' }
  };

  /* ------------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------------ */
  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Emojis não aparecem bem dentro de frases desenhadas: tiramos.
  var RE_EMOJI = /[←-⇿⌀-➿⬀-⯿️‍]|[\uD83C-\uD83E][\uDC00-\uDFFF]/g;
  function semEmoji(s) {
    return String(s || '').replace(RE_EMOJI, '').replace(/\s{2,}/g, ' ').trim();
  }

  function sorteador(semente) {           // números "aleatórios" repetíveis
    var a = semente >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function ruido(n) {                     // valor fixo entre 0 e 1 para cada n
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function embaralhar(lista, rnd) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function faixaX(i) { return ESTRADA_X + FAIXA_L * i + FAIXA_L / 2; }

  function fonte(px) { return 'bold ' + px + 'px ' + FONTE; }

  function relogioTexto(seg) {
    seg = Math.max(0, Math.round(seg));
    var m = Math.floor(seg / 60), s = seg % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ------------------------------------------------------------------
     Figuras (emojis guardados em imagens/emoji)
     ------------------------------------------------------------------ */
  function codigoEmoji(e) {
    var texto = e.indexOf('‍') < 0 ? e.replace(/️/g, '') : e;
    var cods = [];
    for (var i = 0; i < texto.length; i++) {
      var c = texto.codePointAt(i);
      cods.push(c.toString(16));
      if (c > 0xffff) i++;
    }
    return cods.join('-');
  }

  function caminhoEmoji(e) { return 'imagens/emoji/' + codigoEmoji(e) + '.svg'; }

  var figuras = {};
  function carregarEmoji(e) {
    if (figuras[e]) return figuras[e];
    var f = { img: new Image(), pronta: false, falhou: false, tela: null };
    f.img.onload = function () { f.pronta = true; };
    f.img.onerror = function () { f.falhou = true; };
    f.img.src = caminhoEmoji(e);
    figuras[e] = f;
    return f;
  }

  // Desenha a figura uma vez num quadro pequeno, para ficar leve.
  function quadroEmoji(e) {
    var f = carregarEmoji(e);
    if (f.tela) return f.tela;
    if (!f.pronta && !f.falhou) return null;
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var g = c.getContext('2d');
    if (f.pronta) {
      g.drawImage(f.img, 4, 4, 120, 120);
    } else {                               // sem arquivo: usa o emoji do computador
      g.font = '104px ' + FONTE_EMOJI;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(e, 64, 70);
    }
    f.tela = c;
    return c;
  }

  function desenharEmoji(ctx, e, x, y, tam) {
    if (!e) return;
    var q = quadroEmoji(e);
    if (q) ctx.drawImage(q, x - tam / 2, y - tam / 2, tam, tam);
  }

  // Troca <span data-e="🚗"> por uma figura.
  function prepararIcones(raiz) {
    var lista = (raiz || document).querySelectorAll('[data-e]');
    for (var i = 0; i < lista.length; i++) {
      var span = lista[i];
      var e = span.getAttribute('data-e');
      span.removeAttribute('data-e');
      var img = document.createElement('img');
      img.className = 'ico';
      img.alt = '';
      img.draggable = false;
      img.src = caminhoEmoji(e);
      img.addEventListener('error', (function (el, em) {
        return function () { el.replaceWith(document.createTextNode(em)); };
      })(img, e));
      span.textContent = '';
      span.appendChild(img);
    }
  }

  function ico(e) { return '<span data-e="' + esc(e) + '"></span>'; }

  /* ------------------------------------------------------------------
     Fases
     ------------------------------------------------------------------ */
  function validarFases() {
    var ok = [];
    var vistos = {};
    (window.FASES || []).forEach(function (f, i) {
      if (!f || !f.id || !f.ano || !Array.isArray(f.certas) || f.certas.length === 0) {
        console.warn('Fase ' + (i + 1) + ' ignorada: falta id, ano ou placas certas.', f);
        return;
      }
      if (vistos[f.id]) { console.warn('Fase repetida ignorada: ' + f.id); return; }
      vistos[f.id] = true;
      f.ano = Number(f.ano);
      f.paisagem = PAISAGENS[f.paisagem] ? f.paisagem : 'cidade';
      f.tempo = TEMPOS[f.tempo] ? f.tempo : 'sol';
      f.erradas = Array.isArray(f.erradas) ? f.erradas : [];
      f.bifurcacoes = (Array.isArray(f.bifurcacoes) ? f.bifurcacoes : []).filter(function (b) {
        return b && (b.certo === 'esquerda' || b.certo === 'direita') && b.esquerda && b.direita;
      });
      ok.push(f);
    });
    return ok;
  }

  var FASES_OK = [];
  function fasesDoAno(ano) {
    return FASES_OK.filter(function (f) { return f.ano === ano; });
  }

  function obstaculosDa(fase) {
    if (Array.isArray(fase.obstaculos) && fase.obstaculos.length) return fase.obstaculos;
    var lista = window.OBSTACULOS_DA_PAISAGEM || {};
    return lista[fase.paisagem] || [{ img: '🚧', nome: 'Obstáculo', porque: 'Cuidado! Mude de faixa para desviar.' }];
  }

  // Texto em maiúsculas no 1º ano.
  function T(fase, s) {
    s = s == null ? '' : String(s);
    return fase && fase.ano === 1 ? s.toLocaleUpperCase('pt-BR') : s;
  }

  /* ------------------------------------------------------------------
     Montagem da pista: onde ficam as placas, obstáculos e bifurcações
     ------------------------------------------------------------------ */
  function montarPista(fase, semente) {
    var rnd = sorteador(semente);
    var cfg = CONFIG_ANO[fase.ano] || CONFIG_ANO[2];
    var linhas = Math.max(3, Number(fase.placas) || cfg.linhas);
    var nBif = fase.bifurcacoes.length;
    var obst = obstaculosDa(fase);
    var objetos = [];
    var bifs = [];
    var filaCertas = [], filaErradas = [];

    function proxima(fila, lista) {
      if (fila.length === 0) Array.prototype.push.apply(fila, embaralhar(lista, rnd));
      return fila.shift();
    }

    // Em quais fileiras vem uma bifurcação logo depois
    var depoisDe = {};
    for (var b = 0; b < nBif; b++) {
      depoisDe[Math.max(1, Math.round((b + 1) * linhas / (nBif + 1))) - 1] = b;
    }

    var y = 300;
    var ultimaFaixa = 1;
    for (var l = 0; l < linhas; l++) {
      y += cfg.espaco;
      var faixas = embaralhar([0, 1, 2], rnd);
      if (faixas[0] === ultimaFaixa && rnd() < 0.6) faixas.push(faixas.shift());
      var dupla = fase.erradas.length > 0 && rnd() < cfg.dupla;
      var temErrada = fase.erradas.length > 0 && (dupla || rnd() < 0.4);
      var usadas = 0;
      if (dupla || !temErrada) {
        objetos.push({ tipo: 'placa', y: y, faixa: faixas[usadas++], item: proxima(filaCertas, fase.certas), certa: true });
      }
      if (temErrada) {
        objetos.push({ tipo: 'placa', y: y, faixa: faixas[usadas++], item: proxima(filaErradas, fase.erradas), certa: false });
      }
      if (usadas < 3 && rnd() < cfg.obst && !(usadas === 2)) {
        objetos.push({ tipo: 'obstaculo', y: y + (rnd() < 0.5 ? 0 : 160), faixa: faixas[usadas], item: obst[Math.floor(rnd() * obst.length)] });
      } else if (usadas === 2 && rnd() < cfg.obst) {
        objetos.push({ tipo: 'obstaculo', y: y + cfg.espaco / 2, faixa: faixas[2], item: obst[Math.floor(rnd() * obst.length)] });
      }
      ultimaFaixa = faixas[0];

      if (depoisDe[l] !== undefined) {
        y += 850;
        bifs.push({ y: y, dados: fase.bifurcacoes[depoisDe[l]] });
        y += COMP_BIF + 150 - cfg.espaco / 2;
      }
    }
    objetos.forEach(function (o, i) { o.id = i; });
    return {
      objetos: objetos,
      bifs: bifs,
      chegada: y + 700,
      totalCertas: objetos.filter(function (o) { return o.tipo === 'placa' && o.certa; }).length
    };
  }

  /* ------------------------------------------------------------------
     Som (desligado no começo; só bipes simples)
     ------------------------------------------------------------------ */
  var som = { ligado: false, ctx: null };
  function bip(notas) {
    if (!som.ligado) return;
    try {
      if (!som.ctx) som.ctx = new (window.AudioContext || window.webkitAudioContext)();
      var t = som.ctx.currentTime;
      notas.forEach(function (n, i) {
        var o = som.ctx.createOscillator(), g = som.ctx.createGain();
        o.type = n[2] || 'triangle';
        o.frequency.value = n[0];
        g.gain.setValueAtTime(0.0001, t + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.18, t + i * 0.1 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.1 + (n[1] || 0.15));
        o.connect(g); g.connect(som.ctx.destination);
        o.start(t + i * 0.1); o.stop(t + i * 0.1 + (n[1] || 0.15) + 0.05);
      });
    } catch (e) { /* sem som, tudo bem */ }
  }
  var SONS = {
    acerto: [[660], [880]],
    erro: [[220, 0.25, 'square']],
    caminho: [[523], [659], [784]],
    chegada: [[523], [659], [784], [1047, 0.35]]
  };

  /* ------------------------------------------------------------------
     Uma corrida (um carro numa pista). Na dupla são duas.
     ------------------------------------------------------------------ */
  function Corrida(canvas, fase, pista, opcoes) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fase = fase;
    this.pista = pista;
    this.op = opcoes;            // { cor, rotulo, numero, velocidade, relogio, dupla }
    this.base = VELOCIDADES[opcoes.velocidade] * (CONFIG_ANO[fase.ano] || CONFIG_ANO[2]).fator;
    this.faixa = 1;
    this.x = faixaX(1);
    this.dist = 0;
    this.vel = 0;
    this.t = 0;
    this.tempoCorrida = 0;
    this.estado = 'contagem';
    this.contagem = 3.4;
    this.segura = { cima: false, baixo: false };
    this.lentoAte = 0;
    this.tremerAte = 0;
    this.bloqueioAte = 0;
    this.tocados = {};
    this.acertos = [];
    this.erros = [];
    this.batidas = 0;
    this.bifCertas = 0;
    this.escolhas = {};
    this.efeitos = [];
    this.cartao = null;
    this.aviso = null;
    this.fimEm = 0;
    this.meta = pista.chegada / this.base * 1.15 + 4;
  }

  Corrida.prototype.bifAtual = function () {
    for (var i = 0; i < this.pista.bifs.length; i++) {
      var b = this.pista.bifs[i];
      if (this.dist < b.y + COMP_BIF) return { b: b, i: i };
    }
    return null;
  };

  Corrida.prototype.naBifurcacao = function () {
    var ba = this.bifAtual();
    if (!ba) return null;
    return this.dist >= ba.b.y - PARADA_BIF ? ba : null;
  };

  Corrida.prototype.mover = function (d) {
    if (this.estado === 'fim') return;
    if (this.estado === 'escolher') {
      this.faixa = d < 0 ? 0 : 2;
      this.estado = 'correndo';
      return;
    }
    var alvo = Math.max(0, Math.min(2, this.faixa + d));
    if (alvo === this.faixa) return;
    if (alvo === 1 && this.naBifurcacao()) {      // não dá para atravessar o canteiro
      this.bloqueioAte = this.t + 0.4;
      return;
    }
    this.faixa = alvo;
  };

  Corrida.prototype.atualizar = function (dt) {
    this.t += dt;
    var t = this.t;

    if (this.estado === 'contagem') {
      this.contagem -= dt;
      if (this.contagem <= 0) {
        this.estado = 'correndo';
        this.efeitos.push({ tipo: 'ja', vida: 1 });
      }
    }

    if (this.estado === 'correndo' || this.estado === 'escolher') this.tempoCorrida += dt;

    // Velocidade
    var alvo = 0;
    if (this.estado === 'correndo') {
      alvo = this.base;
      if (this.segura.cima) alvo = this.base * 1.5;
      if (this.segura.baixo) alvo = this.base * 0.3;
      if (this.lentoAte > t) alvo = Math.min(alvo, this.base * 0.3);
    } else if (this.estado === 'fim') {
      alvo = 0;
    }
    var acel = alvo > this.vel ? 2.2 : 5;
    this.vel += (alvo - this.vel) * Math.min(1, dt * acel);
    if (this.estado === 'escolher') this.vel = 0;
    this.dist += this.vel * dt;

    // Posição do carro na faixa
    this.x += (faixaX(this.faixa) - this.x) * Math.min(1, dt * 12);

    // Bifurcações
    var ba = this.bifAtual();
    if (ba && this.estado === 'correndo' && this.escolhas[ba.i] === undefined && this.dist >= ba.b.y - PARADA_BIF) {
      if (this.faixa === 1) {
        this.dist = ba.b.y - PARADA_BIF;
        this.vel = 0;
        this.estado = 'escolher';
      } else {
        this.resolverBif(ba, this.faixa === 0 ? 'esquerda' : 'direita');
      }
    }

    // Placas e obstáculos
    if (this.estado === 'correndo') {
      var objs = this.pista.objetos;
      for (var i = 0; i < objs.length; i++) {
        var o = objs[i];
        if (this.tocados[o.id]) continue;
        var dy = Math.abs(o.y - this.dist);
        if (dy > 120) continue;
        var dx = Math.abs(faixaX(o.faixa) - this.x);
        var limY = o.tipo === 'placa' ? 95 : 72;
        var limX = o.tipo === 'placa' ? 70 : 58;
        if (dy < limY && dx < limX) this.tocar(o);
      }
    }

    // Chegada
    if (this.estado === 'correndo' && this.dist >= this.pista.chegada) {
      this.estado = 'fim';
      this.fimEm = t;
      bip(SONS.chegada);
    }

    // Efeitos
    for (var k = this.efeitos.length - 1; k >= 0; k--) {
      var ef = this.efeitos[k];
      ef.vida -= dt;
      if (ef.tipo === 'brilho') { ef.x += ef.vx * dt; ef.y += ef.vy * dt; ef.vy += 300 * dt; }
      if (ef.tipo === 'texto') { ef.y -= 50 * dt; }
      if (ef.vida <= 0) this.efeitos.splice(k, 1);
    }
    if (this.cartao && this.cartao.ate < t) this.cartao = null;
    if (this.aviso && this.aviso.ate < t) this.aviso = null;
  };

  Corrida.prototype.tocar = function (o) {
    this.tocados[o.id] = true;
    var f = this.fase;
    var sx = faixaX(o.faixa), syy = CARRO_Y - 40;
    if (o.tipo === 'placa' && o.certa) {
      this.acertos.push(o.item);
      bip(SONS.acerto);
      for (var i = 0; i < 18; i++) {
        var ang = Math.random() * Math.PI * 2, v = 120 + Math.random() * 160;
        this.efeitos.push({ tipo: 'brilho', x: sx, y: syy, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 120, vida: 0.9,
          cor: ['#ffd600', '#00e676', '#ffffff', '#40c4ff'][i % 4] });
      }
      this.efeitos.push({ tipo: 'texto', x: sx, y: syy - 60, texto: '+1', vida: 1.1, cor: '#00c853' });
      if (!this.cartao) {
        this.aviso = { cor: 'verde', img: o.item.img, titulo: T(f, semEmoji(o.item.nome)), texto: T(f, semEmoji(o.item.sobre || '')), ate: this.t + 1.9 };
      }
    } else {
      var obs = o.tipo === 'obstaculo';
      if (obs) this.batidas++; else this.erros.push({ tipo: 'placa', item: o.item });
      this.lentoAte = this.t + 1.6;
      this.tremerAte = this.t + 0.6;
      this.vel = Math.min(this.vel, this.base * 0.3);
      bip(SONS.erro);
      this.aviso = null;
      this.cartao = {
        img: o.item.img,
        titulo: T(f, obs ? 'Cuidado!' : 'Ops! ' + semEmoji(o.item.nome)),
        texto: T(f, semEmoji(o.item.porque || (obs ? 'Mude de faixa para desviar.' : 'Esta placa não combina com a missão.'))),
        ate: this.t + 3.4
      };
    }
  };

  Corrida.prototype.resolverBif = function (ba, lado) {
    var d = ba.b.dados, f = this.fase;
    this.escolhas[ba.i] = lado;
    var outro = lado === 'esquerda' ? 'direita' : 'esquerda';
    if (lado === d.certo) {
      this.bifCertas++;
      bip(SONS.caminho);
      this.cartao = null;
      this.aviso = { cor: 'verde', img: d[lado].img, titulo: T(f, 'Caminho certo!'), texto: T(f, semEmoji(d.acerto || 'Você escolheu o caminho certo.')), ate: this.t + 2.6 };
      for (var i = 0; i < 24; i++) {
        var ang = Math.random() * Math.PI * 2, v = 140 + Math.random() * 180;
        this.efeitos.push({ tipo: 'brilho', x: this.x, y: CARRO_Y - 30, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 140, vida: 1,
          cor: ['#ffd600', '#00e676', '#ffffff', '#ff4081'][i % 4] });
      }
    } else {
      this.erros.push({ tipo: 'caminho', item: d[outro], porque: d.porque, instrucao: d.instrucao });
      this.lentoAte = this.t + 1.6;
      this.tremerAte = this.t + 0.5;
      bip(SONS.erro);
      this.aviso = null;
      this.cartao = {
        img: d[d.certo].img,
        titulo: T(f, 'Ops! Caminho errado'),
        texto: T(f, semEmoji(d.porque || ('O caminho certo era o da ' + d.certo + '.'))),
        ate: this.t + 3.8
      };
    }
  };

  Corrida.prototype.resumo = function () {
    var max = this.pista.totalCertas + this.pista.bifs.length;
    var erradasPegas = this.erros.filter(function (e) { return e.tipo === 'placa'; }).length;
    var pontos = Math.max(0, this.acertos.length + this.bifCertas - 0.5 * erradasPegas - 0.25 * this.batidas);
    var taxa = max ? pontos / max : 1;
    return {
      estrelas: taxa >= 0.75 ? 3 : taxa >= 0.45 ? 2 : 1,
      acertos: this.acertos,
      erros: this.erros,
      batidas: this.batidas,
      bifCertas: this.bifCertas,
      bifTotal: this.pista.bifs.length,
      totalCertas: this.pista.totalCertas,
      tempo: this.tempoCorrida,
      noRelogio: this.tempoCorrida <= this.meta
    };
  };

  /* ------------------------------------------------------------------
     Desenho
     ------------------------------------------------------------------ */
  Corrida.prototype.sy = function (yMundo) { return CARRO_Y - (yMundo - this.dist); };

  function retArred(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function quebrar(ctx, texto, larg) {
    var palavras = String(texto).split(/\s+/), linhas = [], atual = '';
    for (var i = 0; i < palavras.length; i++) {
      var teste = atual ? atual + ' ' + palavras[i] : palavras[i];
      if (ctx.measureText(teste).width > larg && atual) { linhas.push(atual); atual = palavras[i]; }
      else atual = teste;
    }
    if (atual) linhas.push(atual);
    return linhas;
  }

  // Escreve o texto diminuindo a letra até caber.
  function textoQueCabe(ctx, texto, larg, px, minimo, maxLinhas) {
    var linhas;
    for (; px >= minimo; px--) {
      ctx.font = fonte(px);
      linhas = quebrar(ctx, texto, larg);
      var cabe = linhas.length <= maxLinhas && linhas.every(function (l) { return ctx.measureText(l).width <= larg; });
      if (cabe) break;
    }
    return { px: Math.max(px, minimo), linhas: linhas };
  }

  Corrida.prototype.desenhar = function () {
    var ctx = this.ctx;
    var esc = this.canvas.width / LARG;
    ctx.setTransform(esc, 0, 0, esc, 0, 0);
    ctx.save();
    var tremendo = this.tremerAte > this.t;
    if (tremendo) ctx.translate(Math.sin(this.t * 70) * 5, 0);

    this.desenharCenario(ctx);
    this.desenharEstrada(ctx);
    this.desenharBifurcacoes(ctx);
    this.desenharChegada(ctx);
    if (this.fase.tempo === 'noite') this.desenharNoite(ctx);
    this.desenharMarcos(ctx);
    this.desenharObjetos(ctx);
    this.desenharCarro(ctx);
    this.desenharEfeitos(ctx);
    if (this.fase.tempo === 'chuva') this.desenharChuva(ctx);
    ctx.restore();

    if (tremendo) {                       // moldura laranja ao bater
      ctx.strokeStyle = 'rgba(255,109,0,0.9)';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, LARG - 14, ALT - 14);
    }
    this.desenharPainel(ctx);
    if (this.fase.minimapa) this.desenharMinimapa(ctx);
    this.desenharMensagens(ctx);
  };

  /* ---------- Cenário de cada paisagem ---------- */
  var SEG = 160;
  var PREDIOS = ['#ef5350', '#ffca28', '#42a5f5', '#ab47bc', '#26a69a', '#ff7043', '#8d6e63'];

  Corrida.prototype.desenharCenario = function (ctx) {
    var p = this.fase.paisagem;
    var fundo = { cidade: '#8bc34a', campo: '#9ccc65', praia: '#ffe08a', floresta: '#2e7d32', rio: '#7cb342' }[p];
    ctx.fillStyle = fundo;
    ctx.fillRect(0, 0, LARG, ALT);

    // água
    if (p === 'praia' || p === 'rio') {
      ctx.fillStyle = p === 'praia' ? '#1e9be8' : '#3fb6ea';
      ctx.fillRect(ESTRADA_X + 360 + 28, 0, LARG, ALT);
      ctx.fillStyle = p === 'praia' ? '#ffe08a' : '#8d6e63';
      ctx.fillRect(ESTRADA_X + 360, 0, 28, ALT);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 3;
      var off = (this.dist * 1 + this.t * 20) % 60;
      for (var yy = -60; yy < ALT + 60; yy += 60) {
        ctx.beginPath();
        var base = yy + off;
        ctx.moveTo(512, base);
        ctx.quadraticCurveTo(530, base - 10, 548, base);
        ctx.quadraticCurveTo(566, base + 10, 584, base);
        ctx.stroke();
      }
    }

    var n0 = Math.floor((this.dist - (ALT - CARRO_Y)) / SEG) - 1;
    var n1 = Math.floor((this.dist + CARRO_Y) / SEG) + 1;
    for (var n = n0; n <= n1; n++) {
      var ys = this.sy(n * SEG) - SEG / 2;
      for (var lado = 0; lado < 2; lado++) {
        if (lado === 1 && (p === 'praia' || p === 'rio')) {
          this.decorarAgua(ctx, p, n, ys);
          continue;
        }
        this.decorar(ctx, p, n * 2 + lado, lado, ys);
      }
    }

    // calçada ou cerca junto da estrada
    if (p === 'cidade') {
      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(ESTRADA_X - 20, 0, 20, ALT);
      ctx.fillRect(ESTRADA_X + 360, 0, 20, ALT);
    }
    if (p === 'campo') {
      ctx.fillStyle = '#795548';
      var o2 = this.dist % 50;
      for (var c = -50; c < ALT + 50; c += 50) {
        ctx.fillRect(ESTRADA_X - 14, c + o2, 6, 14);
        ctx.fillRect(ESTRADA_X + 368, c + o2, 6, 14);
      }
      ctx.fillRect(ESTRADA_X - 13, 0, 3, ALT);
      ctx.fillRect(ESTRADA_X + 369, 0, 3, ALT);
    }
  };

  Corrida.prototype.decorar = function (ctx, p, n, lado, ys) {
    var r = ruido(n), r2 = ruido(n + 0.5);
    var cx = lado === 0 ? 50 + (r2 - 0.5) * 20 : 550 + (r2 - 0.5) * 20;
    if (p === 'cidade') cx = lado === 0 ? 46 : 554;
    var noite = this.fase.tempo === 'noite';
    if (p === 'cidade') {
      if (r < 0.55) {
        var cor = PREDIOS[Math.floor(r2 * PREDIOS.length)];
        var w = 84, h = 120 + Math.floor(r2 * 30);
        var x = cx - w / 2, y = ys - h / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x + 6, y + 6, w, h);
        ctx.fillStyle = cor;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = noite ? '#fff59d' : 'rgba(255,255,255,0.75)';
        for (var jy = 0; jy < 4; jy++) for (var jx = 0; jx < 3; jx++) {
          if (noite && ruido(n * 13 + jy * 3 + jx) < 0.4) continue;
          ctx.fillRect(x + 10 + jx * 24, y + 12 + jy * (h - 20) / 4, 14, 14);
        }
      } else if (r < 0.8) {
        desenharEmoji(ctx, '🌳', cx, ys, 64);
      } else {
        desenharEmoji(ctx, ['🏠', '🌷', '🚏', '🏠'][Math.floor(r2 * 4)], cx, ys, 56);
      }
    } else if (p === 'campo') {
      if (r < 0.35) {
        var trigo = r2 < 0.5;
        ctx.fillStyle = trigo ? '#f6d365' : '#7cb342';
        ctx.fillRect(cx - 44, ys - 70, 88, 140);
        ctx.strokeStyle = trigo ? '#d4a73a' : '#558b2f';
        ctx.lineWidth = 4;
        for (var k = 0; k < 6; k++) {
          ctx.beginPath(); ctx.moveTo(cx - 44, ys - 60 + k * 24); ctx.lineTo(cx + 44, ys - 60 + k * 24); ctx.stroke();
        }
      } else {
        desenharEmoji(ctx, ['🐄', '🌻', '🐑', '🌳', '🏡', '🌽', '🐴', '🌳'][Math.floor(r2 * 8)], cx, ys, 58);
      }
    } else if (p === 'praia') {
      if (r < 0.75) desenharEmoji(ctx, ['🌴', '⛱️', '🌴', '🐚', '🌴'][Math.floor(r2 * 5)], cx, ys, r2 < 0.6 ? 66 : 44);
    } else if (p === 'floresta') {
      desenharEmoji(ctx, r < 0.5 ? '🌲' : '🌳', cx - 18, ys - 30, 66);
      desenharEmoji(ctx, r2 < 0.5 ? '🌳' : '🌲', cx + 18, ys + 34, 62);
      if (r < 0.12) desenharEmoji(ctx, ['🍄', '🦜', '🐒'][Math.floor(r2 * 3)], cx, ys + 4, 40);
    } else if (p === 'rio') {
      if (r < 0.7) desenharEmoji(ctx, ['🌳', '🌿', '🏠', '🌳', '🌿'][Math.floor(r2 * 5)], cx, ys, 58);
    }
  };

  Corrida.prototype.decorarAgua = function (ctx, p, n, ys) {
    var r = ruido(n * 7 + 3), r2 = ruido(n * 7 + 4);
    if (r < 0.25) {
      var lista = p === 'praia' ? ['⛵', '🐬', '🏄'] : ['🦆', '🛶', '🐟'];
      desenharEmoji(ctx, lista[Math.floor(r2 * lista.length)], 552, ys, 46);
    }
  };

  /* ---------- Estrada ---------- */
  Corrida.prototype.desenharEstrada = function (ctx) {
    var p = this.fase.paisagem;
    ctx.fillStyle = p === 'campo' ? '#a1795a' : '#55636b';
    ctx.fillRect(ESTRADA_X, 0, 360, ALT);
    // bordas
    ctx.fillStyle = p === 'campo' ? '#fff3c4' : '#ffffff';
    ctx.fillRect(ESTRADA_X, 0, 6, ALT);
    ctx.fillRect(ESTRADA_X + 354, 0, 6, ALT);
    // faixas tracejadas
    var off = this.dist % 80;
    for (var f = 1; f < 3; f++) {
      var x = ESTRADA_X + f * FAIXA_L - 3;
      for (var y = -80; y < ALT + 80; y += 80) {
        var yy = y + off;
        if (this.trechoDividido(yy)) continue;
        ctx.fillRect(x, yy, 6, 44);
      }
    }
  };

  Corrida.prototype.trechoDividido = function (ys) {
    var yMundo = this.dist + (CARRO_Y - ys);
    for (var i = 0; i < this.pista.bifs.length; i++) {
      var b = this.pista.bifs[i];
      if (yMundo > b.y - 60 && yMundo < b.y + COMP_BIF + 40) return true;
    }
    return false;
  };

  /* ---------- Bifurcações (estrada dividida por um canteiro) ---------- */
  Corrida.prototype.desenharBifurcacoes = function (ctx) {
    var cx = faixaX(1);
    for (var i = 0; i < this.pista.bifs.length; i++) {
      var b = this.pista.bifs[i];
      var yIni = this.sy(b.y), yFim = this.sy(b.y + COMP_BIF);
      if (yIni < -50 || yFim > ALT + 50) continue;

      // setas pintadas no chão antes da divisão
      var ySeta = this.sy(b.y - 260);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      desenharSetaChao(ctx, faixaX(0), ySeta, -1);
      desenharSetaChao(ctx, faixaX(2), ySeta, 1);

      // canteiro
      var meia = 52;
      ctx.beginPath();
      ctx.moveTo(cx, yIni);
      ctx.quadraticCurveTo(cx - meia, yIni - 60, cx - meia, yIni - 180);
      ctx.lineTo(cx - meia, yFim + 180);
      ctx.quadraticCurveTo(cx - meia, yFim + 60, cx, yFim);
      ctx.quadraticCurveTo(cx + meia, yFim + 60, cx + meia, yFim + 180);
      ctx.lineTo(cx + meia, yIni - 180);
      ctx.quadraticCurveTo(cx + meia, yIni - 60, cx, yIni);
      ctx.closePath();
      ctx.fillStyle = '#66bb6a';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#e53935';
      ctx.setLineDash([16, 16]);
      ctx.stroke();
      ctx.setLineDash([]);
      for (var k = 1; k <= 3; k++) {
        desenharEmoji(ctx, k === 2 ? '🌷' : '🌳', cx, yIni - COMP_BIF * k / 4, k === 2 ? 40 : 60);
      }

      // placa de setas na ponta do canteiro
      var yp = yIni - 70;
      ctx.fillStyle = '#ffffff';
      retArred(ctx, cx - 46, yp - 26, 92, 48, 10);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0d2a6b';
      ctx.stroke();
      ctx.fillStyle = '#0d2a6b';
      ctx.font = fonte(34);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('←  →', cx, yp);
    }
  };

  function desenharSetaChao(ctx, x, y, lado) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lado * -0.45);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.lineTo(26, -26);
    ctx.lineTo(9, -26);
    ctx.lineTo(9, 40);
    ctx.lineTo(-9, 40);
    ctx.lineTo(-9, -26);
    ctx.lineTo(-26, -26);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Lugares ao lado de cada caminho (no 3º ano, só aparecem no mapa).
  Corrida.prototype.desenharMarcos = function (ctx) {
    if (this.fase.minimapa) return;
    for (var i = 0; i < this.pista.bifs.length; i++) {
      var b = this.pista.bifs[i];
      var y = this.sy(b.y - 420);       // antes da divisão: "vire depois da padaria"
      if (y < -120 || y > ALT + 120) continue;
      desenharPlacaLugar(ctx, 60, y, b.dados.esquerda, this.fase);
      desenharPlacaLugar(ctx, 540, y, b.dados.direita, this.fase);
    }
  };

  function desenharPlacaLugar(ctx, x, y, lugar, fase) {
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x - 4, y + 50, 8, 30);
    ctx.fillStyle = '#fffde7';
    retArred(ctx, x - 54, y - 64, 108, 118, 14);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#6a1b9a';
    ctx.stroke();
    desenharEmoji(ctx, lugar.img, x, y - 20, 62);
    var t = textoQueCabe(ctx, T(fase, semEmoji(lugar.nome)), 98, 18, 11, 2);
    ctx.fillStyle = '#14213d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    t.linhas.forEach(function (l, k) {
      ctx.fillText(l, x, y + 26 + (k - (t.linhas.length - 1) / 2) * (t.px + 1));
    });
  }

  /* ---------- Chegada ---------- */
  Corrida.prototype.desenharChegada = function (ctx) {
    var y = this.sy(this.pista.chegada);
    if (y < -100 || y > ALT + 40) return;
    var q = 20;
    for (var i = 0; i < 360 / q; i++) {
      for (var j = 0; j < 2; j++) {
        ctx.fillStyle = (i + j) % 2 ? '#111' : '#fff';
        ctx.fillRect(ESTRADA_X + i * q, y - j * q, q, q);
      }
    }
    // arco
    ctx.fillStyle = '#e53935';
    ctx.fillRect(ESTRADA_X - 10, y - 90, 14, 110);
    ctx.fillRect(ESTRADA_X + 356, y - 90, 14, 110);
    ctx.fillStyle = '#ffd600';
    retArred(ctx, ESTRADA_X - 10, y - 110, 380, 48, 10);
    ctx.fill();
    ctx.strokeStyle = '#0d2a6b';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#0d2a6b';
    ctx.font = fonte(32);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CHEGADA', LARG / 2, y - 85);
    desenharEmoji(ctx, '🏁', ESTRADA_X + 30, y - 86, 36);
    desenharEmoji(ctx, '🏁', ESTRADA_X + 330, y - 86, 36);
  };

  /* ---------- Noite e chuva ---------- */
  Corrida.prototype.desenharNoite = function (ctx) {
    ctx.fillStyle = 'rgba(8,16,60,0.55)';
    ctx.fillRect(0, 0, LARG, ALT);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var off = this.dist % 320;
    for (var y = -320; y < ALT + 320; y += 320) {
      [ESTRADA_X - 10, ESTRADA_X + 370].forEach(function (x) {
        var g = ctx.createRadialGradient(x, y + off, 4, x, y + off, 90);
        g.addColorStop(0, 'rgba(255,230,140,0.55)');
        g.addColorStop(1, 'rgba(255,230,140,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 90, y + off - 90, 180, 180);
      });
    }
    // faróis
    var g2 = ctx.createLinearGradient(0, CARRO_Y - 50, 0, CARRO_Y - 330);
    g2.addColorStop(0, 'rgba(255,245,180,0.45)');
    g2.addColorStop(1, 'rgba(255,245,180,0)');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.moveTo(this.x - 24, CARRO_Y - 48);
    ctx.lineTo(this.x + 24, CARRO_Y - 48);
    ctx.lineTo(this.x + 110, CARRO_Y - 330);
    ctx.lineTo(this.x - 110, CARRO_Y - 330);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // lua no céu
    desenharEmoji(ctx, '🌙', 560, 112, 44);
  };

  var GOTAS = [];
  for (var gi = 0; gi < 90; gi++) GOTAS.push([ruido(gi + 0.1), ruido(gi + 0.7), 0.7 + ruido(gi + 0.3) * 0.6]);

  Corrida.prototype.desenharChuva = function (ctx) {
    ctx.fillStyle = 'rgba(40,60,100,0.16)';
    ctx.fillRect(0, 0, LARG, ALT);
    ctx.strokeStyle = 'rgba(225,240,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i < GOTAS.length; i++) {
      var gt = GOTAS[i];
      var x = (gt[0] * LARG + this.t * 60 * gt[2]) % LARG;
      var y = (gt[1] * ALT + this.t * 900 * gt[2]) % ALT;
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5, y + 22);
    }
    ctx.stroke();
  };

  /* ---------- Placas e obstáculos ---------- */
  Corrida.prototype.desenharObjetos = function (ctx) {
    var objs = this.pista.objetos;
    for (var i = 0; i < objs.length; i++) {
      var o = objs[i];
      var y = this.sy(o.y);
      if (y < -90 || y > ALT + 90) continue;
      var x = faixaX(o.faixa);
      var tocado = this.tocados[o.id];
      if (tocado && o.tipo === 'placa' && o.certa) continue;   // já foi pega
      ctx.save();
      if (tocado) ctx.globalAlpha = 0.3;
      if (o.tipo === 'placa') this.desenharPlaca(ctx, x, y, o.item);
      else {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 4, y + 28, 36, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,152,0,0.35)';
        ctx.beginPath();
        ctx.arc(x, y, 44, 0, Math.PI * 2);
        ctx.fill();
        desenharEmoji(ctx, o.item.img, x, y, 72);
      }
      ctx.restore();
    }
  };

  Corrida.prototype.desenharPlaca = function (ctx, x, y, item) {
    var w = 104, h = 118;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    retArred(ctx, x - w / 2 + 6, y - h / 2 + 6, w, h, 14);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    retArred(ctx, x - w / 2, y - h / 2, w, h, 14);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0d47a1';
    ctx.stroke();
    desenharEmoji(ctx, item.img, x, y - 18, 62);
    var t = textoQueCabe(ctx, T(this.fase, semEmoji(item.nome)), w - 12, 18, 11, 2);
    ctx.fillStyle = '#0d1b3d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    t.linhas.forEach(function (l, k) {
      ctx.fillText(l, x, y + 34 + (k - (t.linhas.length - 1) / 2) * (t.px + 1));
    });
  };

  /* ---------- Carro ---------- */
  Corrida.prototype.desenharCarro = function (ctx) {
    var x = this.x, y = CARRO_Y;
    var inclina = (faixaX(this.faixa) - this.x) / FAIXA_L * -0.35;
    var acelerando = this.segura.cima && this.estado === 'correndo' && this.lentoAte < this.t;

    if (acelerando) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 4;
      for (var i = 0; i < 4; i++) {
        var ly = y + 20 + ((this.t * 600 + i * 30) % 120) - 40;
        ctx.beginPath(); ctx.moveTo(x - 46, ly); ctx.lineTo(x - 46, ly + 26); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 46, ly); ctx.lineTo(x + 46, ly + 26); ctx.stroke();
      }
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(inclina);
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    retArred(ctx, -28, -46, 64, 104, 18);
    ctx.fill();
    // rodas
    ctx.fillStyle = '#1a1a1a';
    [[-36, -38], [24, -38], [-36, 18], [24, 18]].forEach(function (r) { ctx.fillRect(r[0], r[1], 12, 26); });
    // corpo
    ctx.fillStyle = this.op.cor;
    retArred(ctx, -30, -52, 60, 104, 18);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1b1b1b';
    ctx.stroke();
    // faixas de corrida
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-11, -52, 7, 104);
    ctx.fillRect(4, -52, 7, 104);
    // vidros
    ctx.fillStyle = '#b3e5fc';
    retArred(ctx, -22, -30, 44, 20, 6);
    ctx.fill();
    retArred(ctx, -20, 22, 40, 14, 6);
    ctx.fill();
    // teto com número
    ctx.fillStyle = this.op.cor;
    retArred(ctx, -20, -8, 40, 28, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 6, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.font = fonte(16);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(this.op.numero), 0, 7);
    // faróis
    ctx.fillStyle = '#fff59d';
    ctx.fillRect(-24, -54, 12, 6);
    ctx.fillRect(12, -54, 12, 6);
    ctx.restore();

    if (this.lentoAte > this.t) desenharEmoji(ctx, '💫', x, y - 78, 40);
    if (this.bloqueioAte > this.t) desenharEmoji(ctx, '🚫', x, y - 80, 40);
  };

  Corrida.prototype.desenharEfeitos = function (ctx) {
    for (var i = 0; i < this.efeitos.length; i++) {
      var e = this.efeitos[i];
      if (e.tipo === 'brilho') {
        ctx.globalAlpha = Math.max(0, e.vida);
        ctx.fillStyle = e.cor;
        ctx.beginPath(); ctx.arc(e.x, e.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (e.tipo === 'texto') {
        ctx.globalAlpha = Math.min(1, e.vida * 1.5);
        ctx.font = fonte(44);
        ctx.textAlign = 'center';
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#fff';
        ctx.strokeText(e.texto, e.x, e.y);
        ctx.fillStyle = e.cor;
        ctx.fillText(e.texto, e.x, e.y);
        ctx.globalAlpha = 1;
      }
    }
  };

  /* ---------- Painel de cima (missão, acertos, progresso, relógio) ---------- */
  Corrida.prototype.desenharPainel = function (ctx) {
    var f = this.fase;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, LARG, 58);
    ctx.fillStyle = '#0d2a6b';
    ctx.fillRect(0, 58, LARG, 4);

    var x = 12;
    if (this.op.dupla) {
      ctx.fillStyle = this.op.cor;
      retArred(ctx, 8, 9, 50, 40, 10);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = fonte(22);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.op.rotulo, 33, 30);
      x = 66;
    }
    ctx.fillStyle = '#1b8a3a';
    ctx.font = fonte(20);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    var pegue = T(f, 'Pegue:');
    ctx.fillText(pegue, x, 30);
    x += ctx.measureText(pegue).width + 26;
    var mostrar = f.certas.slice(0, 5);
    for (var i = 0; i < mostrar.length; i++) {
      desenharEmoji(ctx, mostrar[i].img, x + i * 44, 29, 40);
    }

    // contador de acertos
    ctx.fillStyle = '#d9f7d9';
    retArred(ctx, 470, 8, 120, 42, 12);
    ctx.fill();
    ctx.strokeStyle = '#1b8a3a';
    ctx.lineWidth = 3;
    ctx.stroke();
    desenharEmoji(ctx, '✅', 496, 29, 30);
    ctx.fillStyle = '#0d3b1c';
    ctx.font = fonte(30);
    ctx.textAlign = 'center';
    ctx.fillText(String(this.acertos.length + this.bifCertas), 548, 31);

    // barra de progresso
    var p = Math.max(0, Math.min(1, this.dist / this.pista.chegada));
    ctx.fillStyle = '#e3e8f0';
    ctx.fillRect(0, 62, LARG, 14);
    ctx.fillStyle = '#ffc928';
    ctx.fillRect(0, 62, LARG * p, 14);
    ctx.fillStyle = '#0d2a6b';
    ctx.fillRect(0, 76, LARG, 2);
    desenharEmoji(ctx, '🏁', LARG - 14, 69, 22);
    ctx.fillStyle = this.op.cor;
    ctx.beginPath();
    ctx.arc(Math.max(10, Math.min(LARG - 30, LARG * p)), 69, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // relógio
    if (this.op.relogio) {
      var resta = this.meta - this.tempoCorrida;
      var atrasado = resta < 0;
      var bx = this.fase.minimapa ? 380 : 490, by = ALT - 56;
      ctx.fillStyle = atrasado ? '#ffe0b2' : '#ffffff';
      retArred(ctx, bx, by, 100, 44, 12);
      ctx.fill();
      ctx.strokeStyle = atrasado ? '#e65100' : '#0d2a6b';
      ctx.lineWidth = 4;
      ctx.stroke();
      desenharEmoji(ctx, '⏱️', bx + 22, by + 22, 28);
      ctx.fillStyle = atrasado ? '#bf360c' : '#0d2a6b';
      ctx.font = fonte(22);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((atrasado ? '+' : '') + relogioTexto(Math.abs(resta)), bx + 66, by + 23);
    }
  };

  /* ---------- Minimapa com legenda (3º ano) ---------- */
  Corrida.prototype.desenharMinimapa = function (ctx) {
    var f = this.fase;
    var x0 = 486, y0 = TOPO_HUD + 6, w = 108, mapaH = 250;
    var lugares = [];
    this.pista.bifs.forEach(function (b) {
      [b.dados.esquerda, b.dados.direita].forEach(function (l) {
        if (!lugares.some(function (o) { return o.img === l.img; })) lugares.push(l);
      });
    });
    var legH = 26 + (lugares.length + 2) * 26;
    var h = 28 + mapaH + legH;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    retArred(ctx, x0 + 4, y0 + 4, w, h, 12);
    ctx.fill();
    ctx.fillStyle = '#fffbe6';
    retArred(ctx, x0, y0, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = '#6d4c41';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#4e342e';
    ctx.font = fonte(17);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MAPA', x0 + w / 2 + 10, y0 + 16);
    desenharEmoji(ctx, '🗺️', x0 + 22, y0 + 16, 22);

    var cx = x0 + w / 2;
    var yTopo = y0 + 50, yBase = y0 + 28 + mapaH - 12;
    var total = this.pista.chegada;
    function conv(yM) { return yBase - Math.max(0, Math.min(1, yM / total)) * (yBase - yTopo); }
    var abre = 28;

    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    var yAtual = 0;
    ctx.beginPath();
    ctx.moveTo(cx, conv(0));
    this.pista.bifs.forEach(function (b) {
      ctx.lineTo(cx, conv(b.y));
      var a = conv(b.y), z = conv(b.y + COMP_BIF), q = (a - z) / 4;
      [-1, 1].forEach(function (s) {
        ctx.moveTo(cx, a);
        ctx.lineTo(cx + s * abre, a - q);
        ctx.lineTo(cx + s * abre, z + q);
        ctx.lineTo(cx, z);
      });
      ctx.moveTo(cx, z);
      yAtual = b.y + COMP_BIF;
    });
    ctx.lineTo(cx, conv(total));
    ctx.stroke();
    ctx.lineCap = 'butt';

    // símbolos dos lugares nos caminhos
    var self = this;
    this.pista.bifs.forEach(function (b, i) {
      var meio = conv(b.y + COMP_BIF / 2);
      [['esquerda', -1], ['direita', 1]].forEach(function (par) {
        var lx = cx + par[1] * abre;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(lx, meio, 15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = self.escolhas[i] === par[0] ? (par[0] === b.dados.certo ? '#1b8a3a' : '#e65100') : '#4e342e';
        ctx.lineWidth = 3;
        ctx.stroke();
        desenharEmoji(ctx, b.dados[par[0]].img, lx, meio, 22);
      });
    });
    desenharEmoji(ctx, '🏁', cx, conv(total) - 4, 22);

    // você está aqui
    var ba = this.bifAtual(), vx = cx;
    if (ba && this.dist > ba.b.y && this.escolhas[ba.i]) vx = cx + (this.escolhas[ba.i] === 'esquerda' ? -abre : abre);
    var pisca = Math.sin(this.t * 8) > -0.3;
    ctx.fillStyle = this.op.cor;
    ctx.beginPath(); ctx.arc(vx, conv(this.dist), pisca ? 9 : 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();

    // legenda
    var ly = y0 + 28 + mapaH;
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(x0 + 8, ly - 2, w - 16, 2);
    ctx.fillStyle = '#4e342e';
    ctx.font = fonte(14);
    ctx.textAlign = 'center';
    ctx.fillText('LEGENDA', cx, ly + 13);
    var linhas = lugares.map(function (l) { return { img: l.img, nome: semEmoji(l.nome) }; });
    linhas.push({ cor: this.op.cor, nome: 'Você' });
    linhas.push({ img: '🏁', nome: 'Chegada' });
    ctx.textAlign = 'left';
    linhas.forEach(function (l, k) {
      var yy = ly + 38 + k * 26;
      if (l.img) desenharEmoji(ctx, l.img, x0 + 18, yy, 22);
      else {
        ctx.fillStyle = l.cor;
        ctx.beginPath(); ctx.arc(x0 + 18, yy, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      }
      var tq = textoQueCabe(ctx, T(f, l.nome), w - 38, 14, 9, 1);
      ctx.font = fonte(tq.px);
      ctx.fillStyle = '#1b1b1b';
      ctx.fillText(tq.linhas[0] || '', x0 + 33, yy + 1);
    });
  };

  /* ---------- Mensagens: instrução, explicação, contagem ---------- */
  Corrida.prototype.desenharMensagens = function (ctx) {
    var f = this.fase;
    var areaX = 8, areaW = f.minimapa ? 470 : LARG - 16;
    var y = TOPO_HUD + 6;

    // instrução da bifurcação
    var ba = this.bifAtual();
    if (ba && this.escolhas[ba.i] === undefined && ba.b.y - this.dist < 1150 && this.estado !== 'fim') {
      var instr = T(f, semEmoji(ba.b.dados.instrucao || 'Escolha o caminho'));
      var tq = textoQueCabe(ctx, instr, areaW - 90, 27, 18, 3);
      var h = 24 + tq.linhas.length * (tq.px + 6) + 34;
      var pisca = this.estado === 'escolher' && Math.sin(this.t * 10) > 0;
      ctx.fillStyle = pisca ? '#fff59d' : '#fffde7';
      retArred(ctx, areaX, y, areaW, h, 16);
      ctx.fill();
      ctx.strokeStyle = '#6a1b9a';
      ctx.lineWidth = 6;
      ctx.stroke();
      desenharEmoji(ctx, f.minimapa ? '🗺️' : '🔀', areaX + 40, y + h / 2 - 8, 52);
      ctx.fillStyle = '#2a0f45';
      ctx.font = fonte(tq.px);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var cxT = areaX + 80 + (areaW - 90) / 2;
      tq.linhas.forEach(function (l, k) { ctx.fillText(l, cxT, y + 22 + k * (tq.px + 6)); });
      ctx.font = fonte(18);
      ctx.fillStyle = '#4a148c';
      ctx.fillText(T(f, '← esquerda        direita →'), cxT, y + h - 22);
      y += h + 8;
    }

    // explicação (laranja) ou acerto (verde)
    var m = this.cartao || this.aviso;
    if (m) {
      var laranja = !!this.cartao;
      var larg = areaW - 110;
      var tt = textoQueCabe(ctx, m.texto || '', larg, 24, 16, 4);
      var hh = Math.max(110, 56 + tt.linhas.length * (tt.px + 6) + (m.texto ? 8 : -20));
      ctx.fillStyle = laranja ? '#fff3e6' : '#e8fbe8';
      retArred(ctx, areaX, y, areaW, hh, 16);
      ctx.fill();
      ctx.strokeStyle = laranja ? '#e65100' : '#1b8a3a';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(areaX + 52, y + hh / 2, 42, 0, Math.PI * 2); ctx.fill();
      desenharEmoji(ctx, m.img, areaX + 52, y + hh / 2, 64);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      var tt2 = textoQueCabe(ctx, (laranja ? '' : '✓ ') + m.titulo, larg, 26, 16, 1);
      ctx.font = fonte(tt2.px);
      ctx.fillStyle = laranja ? '#bf360c' : '#11612a';
      ctx.fillText(tt2.linhas[0] || '', areaX + 104, y + 28);
      ctx.font = fonte(tt.px);
      ctx.fillStyle = '#1b1b1b';
      tt.linhas.forEach(function (l, k) { ctx.fillText(l, areaX + 104, y + 62 + k * (tt.px + 6)); });
    }

    // escolha parada no meio
    if (this.estado === 'escolher') {
      var py = ALT - 46;
      ctx.fillStyle = 'rgba(13,42,107,0.94)';
      retArred(ctx, areaX, py - 34, areaW, 68, 18);
      ctx.fill();
      ctx.strokeStyle = '#ffc928';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = fonte(28);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var tecla = this.op.teclas === 'wasd' ? ['A', 'D'] : ['←', '→'];
      ctx.fillText(T(f, 'Escolha o caminho: ') + tecla[0] + T(f, ' ou ') + tecla[1], areaX + areaW / 2, py);
    }

    // contagem regressiva
    if (this.estado === 'contagem') {
      var n = Math.ceil(this.contagem - 0.4);
      if (n >= 1) {
        ctx.fillStyle = 'rgba(13,42,107,0.85)';
        ctx.beginPath(); ctx.arc(LARG / 2, ALT / 2 - 40, 90, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffc928'; ctx.lineWidth = 10; ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = fonte(110);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(n), LARG / 2, ALT / 2 - 34);
      }
    }
    for (var i = 0; i < this.efeitos.length; i++) {
      if (this.efeitos[i].tipo === 'ja') {
        ctx.globalAlpha = Math.min(1, this.efeitos[i].vida * 2);
        ctx.font = fonte(100);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#0d2a6b';
        ctx.strokeText('JÁ!', LARG / 2, ALT / 2 - 40);
        ctx.fillStyle = '#ffd600';
        ctx.fillText('JÁ!', LARG / 2, ALT / 2 - 40);
        ctx.globalAlpha = 1;
      }
    }

    // chegou
    if (this.estado === 'fim') {
      ctx.fillStyle = 'rgba(13,42,107,0.88)';
      retArred(ctx, 60, ALT / 2 - 110, 480, 190, 24);
      ctx.fill();
      ctx.strokeStyle = '#ffc928'; ctx.lineWidth = 8; ctx.stroke();
      desenharEmoji(ctx, '🏁', LARG / 2, ALT / 2 - 60, 70);
      ctx.fillStyle = '#fff';
      ctx.font = fonte(44);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CHEGOU!', LARG / 2, ALT / 2 + 10);
      if (this.op.dupla && !jogo.todosChegaram()) {
        ctx.font = fonte(22);
        ctx.fillText(T(f, 'Espere o colega chegar'), LARG / 2, ALT / 2 + 54);
      }
    }
  };

  /* ------------------------------------------------------------------
     Progresso salvo neste computador
     ------------------------------------------------------------------ */
  var CHAVE = 'raliDasPaisagens.progresso.v1';
  var progresso = { estrelas: {}, liberadas: false };

  function lerProgresso() {
    try {
      var p = JSON.parse(localStorage.getItem(CHAVE));
      if (p && typeof p === 'object') {
        progresso = { estrelas: p.estrelas || {}, liberadas: !!p.liberadas };
      }
    } catch (e) { /* navegador sem armazenamento: segue sem salvar */ }
  }

  function salvarProgresso() {
    try { localStorage.setItem(CHAVE, JSON.stringify(progresso)); } catch (e) { /* sem armazenamento */ }
  }

  function faseLiberada(fase) {
    if (progresso.liberadas) return true;
    var lista = fasesDoAno(fase.ano);
    var i = lista.indexOf(fase);
    return i <= 0 || (progresso.estrelas[lista[i - 1].id] || 0) >= 1;
  }

  /* ------------------------------------------------------------------
     Telas e botões
     ------------------------------------------------------------------ */
  var escolha = { modo: 'solo', ano: 1, velocidade: 'lenta', relogio: false };
  var jogo = {
    fase: null,
    corridas: [],
    pausado: false,
    resultadoMarcado: false,
    todosChegaram: function () {
      return this.corridas.length > 0 && this.corridas.every(function (c) { return c.estado === 'fim'; });
    }
  };
  var telaAtual = 'tela-inicio';

  function mostrarTela(id) {
    var telas = document.querySelectorAll('.tela');
    for (var i = 0; i < telas.length; i++) telas[i].classList.toggle('ativa', telas[i].id === id);
    telaAtual = id;
    $('btn-pausa').hidden = id !== 'tela-corrida';
    $('btn-inicio').hidden = id === 'tela-inicio';
    window.scrollTo(0, 0);
  }

  function marcarOpcao(grupoId, botao) {
    var bs = $(grupoId).querySelectorAll('button');
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute('aria-pressed', bs[i] === botao ? 'true' : 'false');
  }

  function montarListaFases() {
    var lista = fasesDoAno(escolha.ano);
    var html = '';
    lista.forEach(function (f, i) {
      var livre = faseLiberada(f);
      var est = progresso.estrelas[f.id] || 0;
      var estrelas = '';
      for (var k = 0; k < 3; k++) estrelas += '<span class="' + (k < est ? '' : 'apagada') + '">' + ico('⭐') + '</span>';
      html += '<button class="cartao-fase fundo-' + f.paisagem + '" data-fase="' + esc(f.id) + '"' + (livre ? '' : ' disabled') + '>' +
        '<span class="fase-num">' + (i + 1) + '</span>' +
        '<span class="fase-ico">' + ico(PAISAGENS[f.paisagem].img) + (f.tempo !== 'sol' ? ico(TEMPOS[f.tempo].img) : '') + '</span>' +
        '<span class="fase-titulo">' + esc(T(f, f.titulo || 'Fase ' + (i + 1))) + '</span>' +
        (livre ? '<span class="fase-estrelas">' + estrelas + '</span>'
               : '<span class="cadeado">' + ico('🔒') + ' Termine a fase ' + i + '</span>') +
        '</button>';
    });
    if (!lista.length) html = '<p class="grande">Ainda não há fases para este ano. Acrescente no arquivo missoes.js.</p>';
    $('lista-fases').innerHTML = html;
    prepararIcones($('lista-fases'));
  }

  function desenhoTeclas(tipo) {
    var k = tipo === 'wasd' ? ['W', 'A', 'S', 'D'] : ['↑', '←', '↓', '→'];
    function tecla(cls, letra, nome) {
      return '<div class="tecla-com-nome ' + cls + '"><kbd class="tecla">' + letra + '</kbd>' + nome + '</div>';
    }
    return '<div class="teclado">' +
      tecla('cima', k[0], 'ACELERA') +
      tecla('esq', k[1], 'ESQUERDA') +
      tecla('baixo', k[2], 'FREIA') +
      tecla('dir', k[3], 'DIREITA') +
      '</div>';
  }

  function abrirMissao(fase) {
    jogo.fase = fase;
    var f = fase;
    $('missao-paisagem').innerHTML = ico(PAISAGENS[f.paisagem].img) + ico(TEMPOS[f.tempo].img);
    var num = fasesDoAno(f.ano).indexOf(f) + 1;
    $('missao-fase').textContent = T(f, f.ano + 'º ano · Fase ' + num + ' · ' + (f.titulo || '') + ' · ' +
      PAISAGENS[f.paisagem].nome + ', ' + TEMPOS[f.tempo].nome);
    $('missao-texto').textContent = T(f, semEmoji(f.missao || 'Pegue as placas certas!'));

    function placa(item) {
      return '<div class="placa"><span class="placa-ico">' + ico(item.img) + '</span>' + esc(T(f, semEmoji(item.nome))) + '</div>';
    }
    $('missao-certas').innerHTML = f.certas.map(placa).join('');
    var desvie = f.erradas.slice();
    obstaculosDa(f).forEach(function (o) {
      if (!desvie.some(function (d) { return d.img === o.img; })) desvie.push(o);
    });
    $('missao-erradas').innerHTML = desvie.map(placa).join('');

    var cam = '';
    if (f.bifurcacoes.length) {
      cam = f.minimapa
        ? ico('🗺️') + ' ' + T(f, 'A estrada vai se dividir. Olhe o MAPA e a LEGENDA no canto da tela para escolher o caminho.')
        : ico('🔀') + ' ' + T(f, 'A estrada vai se dividir. Leia a instrução e escolha o caminho: esquerda ou direita.');
    }
    $('missao-caminhos').innerHTML = cam;

    var ctr;
    if (escolha.modo === 'dupla') {
      ctr = '<div class="bloco-controles j1"><h4>' + ico('🚗') + ' JOGADOR 1</h4>' + desenhoTeclas('wasd') + '</div>' +
            '<div class="bloco-controles j2"><h4>' + ico('🚙') + ' JOGADOR 2</h4>' + desenhoTeclas('setas') + '</div>';
    } else {
      ctr = '<div class="bloco-controles"><h4>' + ico('🚗') + ' CONTROLES</h4>' + desenhoTeclas('setas') + '</div>';
    }
    $('missao-controles').innerHTML = ctr;
    prepararIcones($('tela-missao'));
    mostrarTela('tela-missao');
    $('btn-comecar').focus({ preventScroll: true });
  }

  /* ---------- Corrida ---------- */
  function comecarCorrida() {
    if (!jogo.fase || telaAtual !== 'tela-missao') return;
    var fase = jogo.fase;
    var pista = montarPista(fase, (Date.now() & 0x7fffffff) ^ 0x5bd1e995);
    var area = $('pistas');
    area.innerHTML = '';
    jogo.corridas = [];
    var dupla = escolha.modo === 'dupla';
    var jogadores = dupla
      ? [{ cor: CORES.j1, rotulo: 'J1', numero: 1, teclas: 'wasd', classe: 'j1' },
         { cor: CORES.j2, rotulo: 'J2', numero: 2, teclas: 'setas', classe: 'j2' }]
      : [{ cor: CORES.j1, rotulo: '', numero: 1, teclas: 'todas', classe: '' }];
    jogadores.forEach(function (j) {
      var c = document.createElement('canvas');
      if (j.classe) c.className = j.classe;
      c.setAttribute('aria-label', dupla ? 'Pista do jogador ' + j.numero : 'Pista');
      area.appendChild(c);
      jogo.corridas.push(new Corrida(c, fase, pista, {
        cor: j.cor, rotulo: j.rotulo, numero: j.numero, teclas: j.teclas,
        velocidade: escolha.velocidade, relogio: escolha.relogio, dupla: dupla
      }));
    });
    jogo.pausado = false;
    jogo.resultadoMarcado = false;
    mostrarTela('tela-corrida');
    if (document.activeElement) document.activeElement.blur();
    ajustarTamanho();
  }

  function ajustarTamanho() {
    if (!jogo.corridas.length) return;
    var area = $('pistas');
    var n = jogo.corridas.length;
    var w = (area.clientWidth - (n - 1) * 10) / n - 10;
    var h = window.innerHeight - area.getBoundingClientRect().top - 22;
    var esc = Math.max(0.2, Math.min(w / LARG, h / ALT));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    jogo.corridas.forEach(function (c) {
      c.canvas.style.width = Math.floor(LARG * esc) + 'px';
      c.canvas.style.height = Math.floor(ALT * esc) + 'px';
      c.canvas.width = Math.floor(LARG * esc * dpr);
      c.canvas.height = Math.floor(ALT * esc * dpr);
    });
  }

  var ultimo = 0;
  function quadro(agora) {
    var dt = Math.min(0.05, Math.max(0, (agora - ultimo) / 1000));
    ultimo = agora;
    if (telaAtual === 'tela-corrida' && jogo.corridas.length) {
      if (!jogo.pausado) jogo.corridas.forEach(function (c) { c.atualizar(dt); });
      jogo.corridas.forEach(function (c) { c.desenhar(); });
      if (!jogo.resultadoMarcado && jogo.todosChegaram()) {
        jogo.resultadoMarcado = true;
        setTimeout(mostrarResultado, 2200);
      }
    }
    requestAnimationFrame(quadro);
  }

  function pausar() {
    if (telaAtual !== 'tela-corrida' || jogo.pausado) return;
    jogo.pausado = true;
    soltarTeclas();
    abrirModal('modal-pausa');
  }

  function continuar() {
    fecharModal('modal-pausa');
    jogo.pausado = false;
    soltarTeclas();
  }

  function soltarTeclas() {
    jogo.corridas.forEach(function (c) { c.segura.cima = c.segura.baixo = false; });
  }

  function sairDaCorrida() {
    fecharModal('modal-pausa');
    jogo.corridas = [];
    jogo.pausado = false;
    $('pistas').innerHTML = '';
    montarListaFases();
    mostrarTela('tela-inicio');
  }

  /* ---------- Resultado ---------- */
  var FRASES = {
    3: 'Incrível! Você é fera nas paisagens!',
    2: 'Muito bem! Quase tudo certo!',
    1: 'Boa corrida! Jogue de novo para ganhar mais estrelas!'
  };

  function mostrarResultado() {
    if (telaAtual !== 'tela-corrida') return;
    var f = jogo.fase;
    var dupla = jogo.corridas.length > 1;
    var resumos = jogo.corridas.map(function (c) { return c.resumo(); });
    var melhor = Math.max.apply(null, resumos.map(function (r) { return r.estrelas; }));
    progresso.estrelas[f.id] = Math.max(progresso.estrelas[f.id] || 0, melhor);
    salvarProgresso();

    var html = '<h2 class="resultado-titulo">' + ico('🏁') + ' ' +
      esc(T(f, dupla ? 'A dupla chegou!' : 'Você chegou!')) + ' ' + ico('🎉') + '</h2>';
    html += '<div class="resultado-colunas">';
    resumos.forEach(function (r, i) {
      var c = jogo.corridas[i];
      var est = '';
      for (var k = 0; k < 3; k++) est += '<span class="' + (k < r.estrelas ? '' : 'apagada') + '">' + ico('⭐') + '</span>';

      // agrupa as placas pegas
      var grupos = [];
      r.acertos.forEach(function (it) {
        var g = grupos.filter(function (x) { return x.img === it.img && x.nome === it.nome; })[0];
        if (g) g.n++; else grupos.push({ img: it.img, nome: it.nome, n: 1 });
      });
      var pegas = grupos.length
        ? grupos.map(function (g) {
            return '<span class="item-pego">' + ico(g.img) + ' ' + esc(T(f, semEmoji(g.nome))) + (g.n > 1 ? ' ×' + g.n : '') + '</span>';
          }).join('')
        : '<span>' + esc(T(f, 'Nenhuma desta vez. Tente de novo!')) + '</span>';

      var lembrar = r.erros.map(function (e) {
        var txt = e.tipo === 'caminho'
          ? semEmoji(e.instrucao) + ': ' + semEmoji(e.porque || '')
          : semEmoji(e.item.nome) + ': ' + semEmoji(e.item.porque || '');
        return '<li>' + ico(e.item.img) + ' ' + esc(T(f, txt)) + '</li>';
      }).join('');

      html += '<div class="resultado-jogador ' + (dupla ? 'j' + (i + 1) : '') + '">' +
        (dupla ? '<h3>' + ico(i === 0 ? '🚗' : '🚙') + ' ' + esc(T(f, 'Jogador ' + (i + 1))) + '</h3>' : '') +
        '<div class="estrelas-grandes">' + est + '</div>' +
        '<p class="frase-estrelas">' + esc(T(f, FRASES[r.estrelas])) + '</p>' +
        '<div class="resultado-bloco"><h4>' + ico('✅') + ' ' + esc(T(f, 'Placas certas que ' + (dupla ? 'pegou' : 'você pegou') + ': ' +
          r.acertos.length + ' de ' + r.totalCertas)) + '</h4><div class="lista-itens">' + pegas + '</div></div>' +
        (r.bifTotal ? '<div class="resultado-bloco"><h4>' + ico('🔀') + ' ' +
          esc(T(f, 'Caminhos certos: ' + r.bifCertas + ' de ' + r.bifTotal)) + '</h4></div>' : '') +
        (lembrar ? '<div class="resultado-bloco"><h4>' + ico('💡') + ' ' + esc(T(f, 'Para lembrar:')) + '</h4><ul class="lembrar">' + lembrar + '</ul></div>' : '') +
        (c.op.relogio ? '<span class="selo">' + ico('⏱️') + ' ' + esc(T(f, (r.noRelogio ? 'Chegou antes do relógio! ' : 'Tempo: ') + relogioTexto(r.tempo))) + '</span>' : '') +
        '</div>';
    });
    html += '</div>';
    if (dupla) html += '<p class="frase-estrelas" style="margin-top:12px">' + ico('🤝') + ' ' + esc(T(f, 'Parabéns aos dois! Cada um descobriu coisas novas.')) + '</p>';

    $('resultado-conteudo').innerHTML = html;
    prepararIcones($('resultado-conteudo'));
    var prox = proximaFase();
    $('btn-proxima').hidden = !prox;
    jogo.corridas = [];
    $('pistas').innerHTML = '';
    mostrarTela('tela-resultado');
    $(prox ? 'btn-proxima' : 'btn-repetir').focus({ preventScroll: true });
  }

  function proximaFase() {
    var lista = fasesDoAno(jogo.fase.ano);
    var p = lista[lista.indexOf(jogo.fase) + 1];
    return p && faseLiberada(p) ? p : null;
  }

  /* ---------- Janelas ---------- */
  var modalAntesDaAjuda = null;
  function abrirModal(id) { $(id).hidden = false; var b = $(id).querySelector('button, input'); if (b) b.focus(); }
  function fecharModal(id) {
    $(id).hidden = true;
    if (id === 'modal-ajuda' && modalAntesDaAjuda) {
      abrirModal(modalAntesDaAjuda);
      modalAntesDaAjuda = null;
    }
  }
  function modalAberto() {
    var ms = document.querySelectorAll('.modal');
    for (var i = 0; i < ms.length; i++) if (!ms[i].hidden) return ms[i].id;
    return null;
  }

  function abrirAjuda() {
    if (telaAtual === 'tela-corrida') {
      pausar();
      $('modal-pausa').hidden = true;
      modalAntesDaAjuda = 'modal-pausa';
    }
    abrirModal('modal-ajuda');
  }

  /* ---------- Área do professor ---------- */
  var contaProf = 0;
  function abrirProfessor() {
    var a = 3 + Math.floor(Math.random() * 7), b = 3 + Math.floor(Math.random() * 7);
    contaProf = a + b;
    $('prof-conta').textContent = a + ' + ' + b;
    $('prof-resposta').value = '';
    $('prof-aviso').hidden = true;
    $('prof-pergunta').hidden = false;
    $('prof-painel').hidden = true;
    $('prof-mensagem').hidden = true;
    abrirModal('modal-professor');
    $('prof-resposta').focus();
  }

  function conferirProfessor() {
    if (Number($('prof-resposta').value) === contaProf) {
      $('prof-pergunta').hidden = true;
      $('prof-painel').hidden = false;
      atualizarBotaoLiberar();
    } else {
      $('prof-aviso').hidden = false;
      $('prof-resposta').value = '';
      $('prof-resposta').focus();
    }
  }

  function atualizarBotaoLiberar() {
    $('prof-liberar').innerHTML = progresso.liberadas
      ? ico('🔒') + ' Voltar a travar as fases'
      : ico('🔓') + ' Liberar todas as fases';
    prepararIcones($('prof-liberar'));
  }

  function mensagemProf(txt) {
    $('prof-mensagem').textContent = txt;
    $('prof-mensagem').hidden = false;
  }

  /* ------------------------------------------------------------------
     Teclado
     ------------------------------------------------------------------ */
  var TECLAS = {
    ArrowLeft: ['setas', 'esq'], ArrowRight: ['setas', 'dir'], ArrowUp: ['setas', 'cima'], ArrowDown: ['setas', 'baixo'],
    KeyA: ['wasd', 'esq'], KeyD: ['wasd', 'dir'], KeyW: ['wasd', 'cima'], KeyS: ['wasd', 'baixo']
  };

  function corridaDa(grupo) {
    if (jogo.corridas.length === 1) return jogo.corridas[0];
    return grupo === 'wasd' ? jogo.corridas[0] : jogo.corridas[1];
  }

  document.addEventListener('keydown', function (e) {
    var aberto = modalAberto();
    if (e.key === 'Escape') {
      if (aberto === 'modal-pausa') { continuar(); return; }
      if (aberto) { fecharModal(aberto); return; }
      if (telaAtual === 'tela-corrida') { pausar(); return; }
    }
    if (aberto) {
      if (aberto === 'modal-professor' && e.key === 'Enter' && document.activeElement === $('prof-resposta')) conferirProfessor();
      return;
    }

    if (telaAtual === 'tela-missao' && (e.code === 'Space' || e.key === 'Enter')) {
      if (e.target && e.target.tagName === 'BUTTON' && e.target.id !== 'btn-comecar') return;
      e.preventDefault();
      comecarCorrida();
      return;
    }

    if (telaAtual !== 'tela-corrida') return;
    if (e.code === 'KeyP') { pausar(); return; }
    var m = TECLAS[e.code];
    if (e.code === 'Space') e.preventDefault();
    if (!m) return;
    e.preventDefault();
    if (jogo.pausado) return;
    var c = corridaDa(m[0]);
    if (!c) return;
    if (m[1] === 'cima') c.segura.cima = true;
    else if (m[1] === 'baixo') c.segura.baixo = true;
    else if (!e.repeat) c.mover(m[1] === 'esq' ? -1 : 1);
  });

  document.addEventListener('keyup', function (e) {
    var m = TECLAS[e.code];
    if (!m || telaAtual !== 'tela-corrida') return;
    var c = corridaDa(m[0]);
    if (!c) return;
    if (m[1] === 'cima') c.segura.cima = false;
    if (m[1] === 'baixo') c.segura.baixo = false;
  });

  document.addEventListener('visibilitychange', function () { if (document.hidden) pausar(); });
  window.addEventListener('blur', function () { soltarTeclas(); });
  window.addEventListener('resize', ajustarTamanho);

  /* ------------------------------------------------------------------
     Início
     ------------------------------------------------------------------ */
  function ligarBotoes() {
    $('op-modo').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      escolha.modo = b.getAttribute('data-modo');
      marcarOpcao('op-modo', b);
    });
    $('op-ano').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      escolha.ano = Number(b.getAttribute('data-ano'));
      marcarOpcao('op-ano', b);
      montarListaFases();
    });
    $('op-velocidade').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      escolha.velocidade = b.getAttribute('data-vel');
      marcarOpcao('op-velocidade', b);
    });
    $('op-relogio').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      escolha.relogio = b.getAttribute('data-relogio') === 'sim';
      marcarOpcao('op-relogio', b);
    });
    $('lista-fases').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-fase]'); if (!b || b.disabled) return;
      var id = b.getAttribute('data-fase');
      var f = FASES_OK.filter(function (x) { return x.id === id; })[0];
      if (f) abrirMissao(f);
    });

    $('btn-comecar').addEventListener('click', comecarCorrida);
    $('btn-voltar-missao').addEventListener('click', function () { mostrarTela('tela-inicio'); });
    $('btn-repetir').addEventListener('click', function () { abrirMissao(jogo.fase); });
    $('btn-proxima').addEventListener('click', function () { var p = proximaFase(); if (p) abrirMissao(p); });
    $('btn-fases').addEventListener('click', function () { montarListaFases(); mostrarTela('tela-inicio'); });

    $('btn-pausa').addEventListener('click', pausar);
    $('btn-continuar').addEventListener('click', continuar);
    $('btn-pausa-ajuda').addEventListener('click', abrirAjuda);
    $('btn-pausa-sair').addEventListener('click', sairDaCorrida);
    $('btn-ajuda').addEventListener('click', abrirAjuda);
    $('btn-inicio').addEventListener('click', function () {
      if (telaAtual === 'tela-corrida') { pausar(); return; }   // pergunta antes de sair
      montarListaFases();
      mostrarTela('tela-inicio');
    });
    $('btn-som').addEventListener('click', function () {
      som.ligado = !som.ligado;
      var b = $('btn-som');
      b.setAttribute('aria-pressed', som.ligado ? 'true' : 'false');
      b.innerHTML = som.ligado ? ico('🔊') + ' Som ligado' : ico('🔇') + ' Som desligado';
      prepararIcones(b);
      if (som.ligado) bip(SONS.acerto);
    });

    $('btn-professor').addEventListener('click', abrirProfessor);
    $('prof-entrar').addEventListener('click', conferirProfessor);
    $('prof-liberar').addEventListener('click', function () {
      progresso.liberadas = !progresso.liberadas;
      salvarProgresso();
      atualizarBotaoLiberar();
      montarListaFases();
      mensagemProf(progresso.liberadas ? 'Pronto! Todas as fases estão liberadas.' : 'Pronto! As fases voltaram a abrir uma de cada vez.');
    });
    $('prof-apagar').addEventListener('click', function () { abrirModal('modal-confirmar'); });
    $('confirmar-apagar').addEventListener('click', function () {
      progresso = { estrelas: {}, liberadas: false };
      try { localStorage.removeItem(CHAVE); } catch (e) { /* sem armazenamento */ }
      fecharModal('modal-confirmar');
      atualizarBotaoLiberar();
      montarListaFases();
      mensagemProf('Pronto! O progresso foi apagado.');
    });

    var fechar = document.querySelectorAll('[data-fechar]');
    for (var i = 0; i < fechar.length; i++) {
      fechar[i].addEventListener('click', function () { fecharModal(this.getAttribute('data-fechar')); });
    }
  }

  function carregarTodasAsFiguras() {
    var lista = ['✅', '💫', '🚫', '🏁', '🗺️', '🔀', '⏱️', '🌙', '🌳', '🌷', '🌲', '🏠', '🚏', '🐄', '🌻', '🐑', '🏡',
      '🌽', '🐴', '🌴', '⛱️', '🐚', '🍄', '🦜', '🐒', '🌿', '⛵', '🐬', '🏄', '🦆', '🛶', '🐟'];
    FASES_OK.forEach(function (f) {
      f.certas.concat(f.erradas, obstaculosDa(f)).forEach(function (i) { lista.push(i.img); });
      f.bifurcacoes.forEach(function (b) { lista.push(b.esquerda.img, b.direita.img); });
    });
    lista.forEach(function (e) { if (e) carregarEmoji(e); });
  }

  function iniciar() {
    FASES_OK = validarFases();
    lerProgresso();
    prepararIcones(document);
    ligarBotoes();
    montarListaFases();
    carregarTodasAsFiguras();
    requestAnimationFrame(function (t) { ultimo = t; requestAnimationFrame(quadro); });

    // Guarda os arquivos no navegador para funcionar sem internet.
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* segue sem guardar */ });
    }
  }

  iniciar();
})();
