# Maior ou Menor?

Um joguinho de adivinhação no estilo _higher/lower_, com dado público real e brasileiro. Aparecem duas coisas com um número escondido; você chuta qual é o **maior**. Acertou, segue a sequência. Errou, acabou. E a cada rodada o número real aparece contando na tela, com a fonte.

**Jogar agora:** [game-numbers.vercel.app](https://game-numbers.vercel.app)

## A ideia de arquitetura

O motor do jogo é **agnóstico ao dado**. Cada categoria é um _deck_ — um único arquivo JSON. Adicionar categoria nova = escrever um arquivo, sem tocar na lógica do jogo.

```json
{
  "id": "ibge-populacao-municipios",
  "titulo": "População dos municípios",
  "unidade": "habitantes",
  "pergunta": "Tem MAIS ou MENOS habitantes?",
  "fonte": "IBGE — Censo 2022",
  "fonte_url": "https://censo2022.ibge.gov.br",
  "itens": [{ "nome": "São Paulo (SP)", "valor": 11451245, "fato": "A maior cidade do país." }]
}
```

O motor (`src/lib/jogo`) é puro e determinístico (a aleatoriedade mora numa semente guardada no estado, então dá pra reproduzir uma partida). O JSON de deck passa por um validador honesto antes de entrar no jogo.

## Stack

- React + Vite + TypeScript
- Áudio sintetizado com a Web Audio API (o "número subindo")
- Sem backend: os decks são JSON estático, gerados por ETL a partir de fontes públicas (IBGE, World Bank, etc.)

## Rodar

```bash
npm install
npm run dev
```

## Multijogador 1v1

O modo 1v1 em tempo real reaproveita o [Balcão](https://github.com/Gabrieldiog/gateway-) — um gateway de APIs públicas que já está no ar — como backend. Lá vive um relay WebSocket (`/ws/1v1`) que faz só duas coisas: junta dois jogadores (matchmaking de fila de um) e repassa mensagens de um pro outro, sem ler o conteúdo.

Quem gera as rodadas e conta o placar é o **cliente**: as duas pontas geram a mesma sequência a partir da semente da sala (o mesmo motor determinístico do desafio diário), então ambos veem exatamente as mesmas cartas. Pelo relay trafegam só placar, fim e rematch. É casual e client-side de propósito — mantém o gateway leve e dispensa subir mais um serviço.

Como o Balcão fica no plano grátis do Render (dorme quando ninguém usa), a primeira conexão do dia acorda o servidor e demora alguns segundos. A tela "Acordando o servidor…" cobre essa espera com bom humor em vez de esconder.

## Publicar

O frontend é estático; o backend do 1v1 é o Balcão, que já está publicado à parte. Então aqui é um deploy só:

- **Frontend (Vercel):** importe o repositório na Vercel (o preset Vite já é detectado — build `npm run build`, output `dist`, mais o rewrite de SPA, tudo no `vercel.json`) e defina a variável de ambiente **`VITE_BALCAO_WS`** com a URL WebSocket do relay: `wss://balcao-api.onrender.com/ws/1v1`. O Vite lê essa variável no build, então depois de definir é preciso refazer o deploy.

## O que tem

- **Vários decks** de dado real — população e área de municípios/estados, indicadores de países (World Bank), além de decks de fama e de diversão com foto em cada carta.
- **Seleção de categoria** por grupos (Fama, Brasil, Mundo, Diversão).
- **Desafio diário** determinístico — todo mundo pega a mesma sequência no dia — com resultado compartilhável no estilo Wordle.
- **Modos de jogo** — clássico (morte súbita), 3 vidas e blitz (cronômetro + combo).
- **Multijogador 1v1** em tempo real (ver acima).
- **Som e juice** — o número sobe contando na tela, com áudio sintetizado na Web Audio API.

## Fontes

O número de cada rodada vem de fonte pública e é sempre creditado dentro do jogo.
