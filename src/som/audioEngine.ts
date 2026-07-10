// Motor de som do jogo. Tudo SINTETIZADO na Web Audio API — nenhum arquivo de
// áudio. O contexto só nasce/volta a tocar depois de um gesto do usuário
// (política de autoplay dos navegadores, iOS inclusive), então chame
// `destravar()` no primeiro toque. Mute persiste no localStorage.

const CHAVE_MUDO = "mm:mudo";

type Onda = OscillatorType;

class MotorDeSom {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  mudo: boolean;

  constructor() {
    let salvo = false;
    try {
      salvo = localStorage.getItem(CHAVE_MUDO) === "1";
    } catch {
      salvo = false;
    }
    this.mudo = salvo;
  }

  private garante(): AudioContext {
    if (!this.ctx) {
      const AC: typeof AudioContext =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.26;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Chame no primeiro gesto do usuário pra liberar o áudio. */
  destravar(): void {
    try {
      this.garante();
    } catch {
      /* sem áudio disponível: o jogo segue mudo */
    }
  }

  definirMudo(m: boolean): void {
    this.mudo = m;
    try {
      localStorage.setItem(CHAVE_MUDO, m ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  alternarMudo(): boolean {
    this.definirMudo(!this.mudo);
    return this.mudo;
  }

  /** Uma voz: oscilador com envelope ADSR curtinho. */
  private voz(freq: number, dur: number, onda: Onda = "triangle", vol = 1, atraso = 0): void {
    if (this.mudo) return;
    const ctx = this.garante();
    if (!this.master) return;
    const t0 = ctx.currentTime + atraso;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = onda;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** Tique da contagem: pitch sobe com o progresso (0..1). Chame com throttle. */
  tique(progresso: number): void {
    const p = Math.min(Math.max(progresso, 0), 1);
    const freq = 320 + p * p * 1500;
    this.voz(freq, 0.05, "square", 0.14);
  }

  /** Acerto: arpejo maior ascendente. `magnitude` (0..1) puxa o brilho pra cima. */
  acerto(magnitude = 0.5): void {
    const base = 392 * (1 + magnitude * 0.16); // ~Sol4, sobe um tico se o número é grande
    [0, 4, 7, 12].forEach((semi, i) => this.voz(base * Math.pow(2, semi / 12), 0.2, "triangle", 0.5, i * 0.06));
  }

  /** Erro: descida grave, meio buzz. */
  erro(): void {
    this.voz(210, 0.18, "sawtooth", 0.4, 0);
    this.voz(150, 0.22, "sawtooth", 0.4, 0.07);
    this.voz(92, 0.34, "sawtooth", 0.4, 0.15);
  }

  /** Novo recorde: fanfarra curtinha. */
  recorde(): void {
    const base = 523.25; // Dó5
    [0, 4, 7, 12, 16].forEach((semi, i) => this.voz(base * Math.pow(2, semi / 12), 0.24, "triangle", 0.5, i * 0.08));
  }
}

export const som = new MotorDeSom();
