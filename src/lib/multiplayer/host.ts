// Onde vive o servidor PartyKit. No dev, o `partykit dev` local (127.0.0.1:1999).
// Em produção, o host publicado — passado via VITE_PARTY_HOST no build.
const env = import.meta.env as unknown as Record<string, string | undefined>;

export const PARTY_HOST = env.VITE_PARTY_HOST ?? "127.0.0.1:1999";
