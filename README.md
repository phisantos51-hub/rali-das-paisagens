# 🏎️ Rali das Paisagens

Jogo de corrida com foco em **Geografia** para o **Ciclo de Alfabetização** (1º, 2º e 3º ano do Ensino Fundamental), alinhado ao Currículo da Cidade de São Paulo.

**Para jogar:** https://phisantos51-hub.github.io/rali-das-paisagens/

## Como se joga

- O carro corre numa estrada vista de cima. **← →** mudam de faixa, **↑** acelera e **↓** freia.
- Antes de cada corrida aparece a **missão** (por exemplo, "Pegue os lugares onde a gente estuda e brinca"). A criança passa por cima das placas certas e desvia das erradas e dos obstáculos.
- Em alguns pontos a **estrada se divide**, e uma instrução diz para que lado ir.
- Ninguém perde: se pegar uma placa errada, o carro fica mais lento por um instante e aparece uma **explicação curta com imagem**.
- No fim, a criança ganha de **1 a 3 estrelas**, e o jogo mostra o que ela acertou e o que vale lembrar.

### Modos de jogo
- **Sozinho:** joga com as setas (também funciona com W A S D).
- **Dupla, no mesmo teclado:** a tela se divide em duas. O Jogador 1 usa **W A S D** e o Jogador 2 usa as **setas**.

### Temas por ano
| Ano | Temas | Paisagens |
|---|---|---|
| 1º | Lugares de vivência (casa, escola, praça, mercado, posto de saúde), direita e esquerda, dia e noite, sol e chuva | cidade, floresta, campo |
| 2º | Meios de transporte (terra, água, ar), trabalhos do campo e da cidade, pontos de referência ("vire depois da padaria") | cidade, rio, praia, campo |
| 3º | Paisagem urbana e rural, paisagem natural e modificada, cuidados com o ambiente, **minimapa com legenda** | cidade, campo, floresta, rio |

### Para a sala de informática
- **Não depende de som.** Todo aviso aparece na tela, e o som começa desligado (há um botão para ligar).
- **Velocidade:** lenta (padrão), média ou rápida.
- **Contra o relógio:** opcional e desligado no começo.
- **Pausa** (botão ou tecla P) e **Como jogar**, sempre na barra de cima.
- **Área do professor:** botão discreto no fim da tela inicial, protegido por uma pergunta de soma. Lá dá para **liberar todas as fases** ou **apagar o progresso** (o jogo pede confirmação antes de apagar).
- O progresso fica salvo **só no navegador daquele computador**.
- Funciona **sem internet** depois de aberto uma vez. Não tem anúncios, não tem links para fora e não coleta dados.

## Como acrescentar ou mudar missões

Tudo o que aparece nas fases fica no arquivo **`missoes.js`**: missões, placas, explicações e bifurcações. O começo do arquivo explica cada parte, e no final há um **modelo de fase** pronto para copiar.

Pelo próprio site do GitHub:
1. Abra o arquivo `missoes.js` e clique no **lápis ✏️** (editar).
2. Copie o modelo do fim do arquivo e cole depois da última fase.
3. Troque os textos e as figuras (emojis).
4. Clique em **Commit changes** para salvar. Em poucos minutos, a fase nova aparece no jogo.

Cada placa tem uma figura (`img`), um nome e uma frase curta: `sobre` para as placas certas e `porque` para as erradas. No 1º ano, o jogo coloca tudo em letra maiúscula sozinho.

> As figuras das fases que já vêm com o jogo ficam guardadas na pasta `imagens/emoji`, e por isso aparecem iguais em qualquer computador. Uma figura nova, que não esteja nessa pasta, também funciona, mas aparece com o desenho do próprio computador. Para deixá-la igual às outras, copie o arquivo `.svg` correspondente do projeto Twemoji para `imagens/emoji`.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | Página do jogo |
| `missoes.js` | **Missões, placas e explicações (é este que se edita)** |
| `jogo.js` | Funcionamento do jogo |
| `estilo.css` | Cores e aparência |
| `sw.js` | Guarda o jogo no navegador para funcionar sem internet |
| `imagens/emoji/` | Figuras usadas nas placas e no cenário |

## Créditos

Figuras: [Twemoji](https://github.com/jdecked/twemoji), © Twitter, Inc. e outros colaboradores, licença [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
