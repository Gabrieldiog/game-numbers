// Onde vive o relay 1v1: o Balcão (o mesmo gateway que já está no ar). Em dev, um
// Balcão local; em produção, o host publicado no Render — passado via
// VITE_BALCAO_WS no momento do build. A URL já inclui o caminho /ws/1v1; o hook
// só anexa ?nome=... na hora de conectar.
const env = import.meta.env as unknown as Record<string, string | undefined>;

export const BALCAO_WS = env.VITE_BALCAO_WS ?? "ws://127.0.0.1:8000/ws/1v1";
