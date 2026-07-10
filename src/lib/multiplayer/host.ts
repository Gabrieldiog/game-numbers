// Onde vive o relay 1v1: o Balcão (o mesmo gateway que já está no ar no Render).
// O padrão já aponta pra produção, então o online funciona no deploy sem depender
// de nenhuma variável de ambiente. Pra desenvolver contra um Balcão local, é só
// definir VITE_BALCAO_WS (ex.: ws://127.0.0.1:8000/ws/1v1) no build. A URL já
// inclui o caminho /ws/1v1; o hook só anexa ?nome=... na hora de conectar.
const env = import.meta.env as unknown as Record<string, string | undefined>;

// Garante um esquema ws:// ou wss:// na URL. Sem isso, um valor tipo
// "balcao-api.onrender.com/ws/1v1" (sem esquema) seria tratado pelo new WebSocket()
// como caminho RELATIVO à página — virava "wss://<site>/balcao-api.onrender.com/..."
// e o online quebrava. Aqui a gente conserta qualquer forma razoável de env var.
function normalizaWs(bruto: string): string {
  const u = bruto.trim().replace(/\/+$/, "");
  if (/^wss?:\/\//i.test(u)) return u;
  if (/^https:\/\//i.test(u)) return "wss://" + u.slice("https://".length);
  if (/^http:\/\//i.test(u)) return "ws://" + u.slice("http://".length);
  return "wss://" + u.replace(/^\/+/, "");
}

export const BALCAO_WS = normalizaWs(env.VITE_BALCAO_WS ?? "balcao-api.onrender.com/ws/1v1");

// URL http(s) do /health do mesmo Balcão, derivada da do WebSocket. Serve pra
// "pré-aquecer" o servidor antes de conectar: o free tier do Render dorme, e um
// GET acorda ele de forma mais confiável que o upgrade do WebSocket direto no
// meio do cold-start.
export const BALCAO_HEALTH: string | null = (() => {
  try {
    const u = new URL(BALCAO_WS);
    const proto = u.protocol === "wss:" ? "https:" : "http:";
    return `${proto}//${u.host}/health`;
  } catch {
    return null;
  }
})();
