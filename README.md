# Maior ou Menor?

Um joguinho de adivinhação no estilo _higher/lower_, com dado público real e brasileiro. Aparecem duas coisas com um número escondido; você chuta qual é o **maior**. Acertou, segue a sequência. Errou, acabou. E a cada rodada o número real aparece contando na tela, com a fonte.

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

## Fases

- **Fase 1 (atual):** motor + deck de população + modo clássico + reveal animado com som.
- Próximas: mais decks (ETL do IBGE e cia.), seleção de categoria, desafio diário compartilhável, modos 3 vidas e blitz.

## Fontes

O número de cada rodada vem de fonte pública e é sempre creditado dentro do jogo.
