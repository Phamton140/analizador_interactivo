export const TRAINERS = {
    KING: {
        name: "Ordo Magnus",
        avatar: "/king.png",
        voice: "male",
        description: "Gran Maestro Digital - Sabiduría y Lógica Pura."
    }
};

const OPENING_BOOK = {
    // Siciliana
    "e4 c5": "Defensa Siciliana",
    "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6": "Defensa Siciliana variante Najdorf",
    "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6": "Defensa Siciliana variante Dragón",
    "e4 c5 Nf3 e6": "Defensa Siciliana variante Francesa",
    "e4 c5 c3": "Defensa Siciliana variante Alapin",
    "e4 c5 Nf3 Nc6": "Defensa Siciliana variante Pelikán",
    "e4 c5 Nc3": "Defensa Siciliana Cerrada",
    "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 Nc6": "Defensa Siciliana Clásica",
    "e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6": "Defensa Siciliana variante Kan",
    "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nf6 Nc3 Bb4": "Defensa Siciliana variante Taimanov",
    "e4 c5 Nf3 d6 Bb5+": "Defensa Siciliana Ataque Canal-Sokolsky",

    // Ruy Lopez / Española
    "e4 e5 Nf3 Nc6 Bb5": "Apertura Española (Ruy López)",
    "e4 e5 Nf3 Nc6 Bb5 a6": "Apertura Española variante Morphy",
    "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7": "Apertura Española Cerrada",
    "e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Nxe4": "Apertura Española Abierta",
    "e4 e5 Nf3 Nc6 Bb5 Nf6": "Apertura Española Defensa Berlinesa",
    "e4 e5 Nf3 Nc6 Bb5 a6 Bxc6": "Apertura Española variante del Cambio",

    // Italiana
    "e4 e5 Nf3 Nc6 Bc4": "Apertura Italiana",
    "e4 e5 Nf3 Nc6 Bc4 Bc5": "Giuoco Piano",
    "e4 e5 Nf3 Nc6 Bc4 Bc5 c3": "Giuoco Pianissimo",
    "e4 e5 Nf3 Nc6 Bc4 Bc5 b4": "Gambito Evans",
    "e4 e5 Nf3 Nc6 Bc4 Nf6": "Defensa de los Dos Caballos",
    "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5": "Ataque Fegatello",

    // Francesa
    "e4 e6": "Defensa Francesa",
    "e4 e6 d4 d5": "Defensa Francesa Clásica",
    "e4 e6 d4 d5 e5": "Defensa Francesa variante del Avance",
    "e4 e6 d4 d5 exd5": "Defensa Francesa variante del Cambio",
    "e4 e6 d4 d5 Nd2": "Defensa Francesa variante Tarrasch",
    "e4 e6 d4 d5 Nc3": "Defensa Francesa variante Paulsen/Winawer",
    "e4 e6 d4 d5 Nc3 Bb4": "Defensa Francesa variante Winawer",

    // Caro-Kann
    "e4 c6": "Defensa Caro-Kann",
    "e4 c6 d4 d5": "Defensa Caro-Kann Clásica",
    "e4 c6 d4 d5 e5": "Defensa Caro-Kann variante del Avance",
    "e4 c6 d4 d5 exd5 cxd5 Bd3": "Defensa Caro-Kann variante del Cambio",
    "e4 c6 d4 d5 Nd2 dxe4 Nxe4 Bf5": "Defensa Caro-Kann variante Capablanca",
    "e4 c6 d4 d5 Nd2 dxe4 Nxe4 Nd7": "Defensa Caro-Kann variante Karpov",

    // Otras e4
    "e4 e5": "Juego Abierto",
    "e4 e5 Nf3 Nc6 d4": "Apertura Escocesa",
    "e4 e5 Nf3 Nc6 d4 exd4 Nxd4": "Apertura Escocesa Clásica",
    "e4 e5 Nf3 Nc6 Bc4 Be7": "Defensa Húngara",
    "e4 e5 f4": "Gambito de Rey",
    "e4 e5 f4 exf4": "Gambito de Rey Aceptado",
    "e4 e5 f4 d5": "Gambito de Rey Rehusado",
    "e4 d5": "Defensa Escandinava",
    "e4 d5 exd5 Qxd5": "Defensa Escandinava Clásica",
    "e4 Nf6": "Defensa Alekhine",
    "e4 d6 d4 Nf6": "Defensa Pirc",
    "e4 g6": "Defensa Moderna",
    "e4 e5 Nc3": "Apertura Vienesa",
    "e4 e5 Bc4": "Apertura de Alfil",
    "e4 c5 d4": "Gambito Morra",

    // Gambito de Dama & Cerradas
    "d4 d5": "Apertura de Peón de Dama",
    "d4 d5 c4": "Gambito de Dama",
    "d4 d5 c4 dxc4": "Gambito de Dama Aceptado",
    "d4 d5 c4 e6": "Gambito de Dama Rehusado",
    "d4 d5 c4 c6": "Defensa Eslava",
    "d4 d5 c4 c6 Nc3 Nf6 Nf3 dxc4": "Defensa Eslava Principal",
    "d4 d5 c4 e6 Nc3 c6": "Defensa Semieslava",
    "d4 d5 c4 e6 Nc3 c6 Nf3 Nf6 e3 Nbd7 Bd3 dxc4 Bxc4 b5": "Defensa Semieslava variante Merano",
    "d4 Nf6 c4 c5": "Defensa Benoni",
    "d4 Nf6 c4 c5 d5": "Defensa Benoni Moderna",
    "d4 Nf6 c4 c5 d5 b5": "Gambito Benko",

    // Indias
    "d4 Nf6": "Defensa India",
    "d4 Nf6 c4 e6": "Defensa India Oriental",
    "d4 Nf6 c4 e6 Nc3 Bb4": "Defensa Nimzo-India",
    "d4 Nf6 c4 e6 Nf3 b6": "Defensa India de Dama",
    "d4 Nf6 c4 e6 g3": "Apertura Catalana",
    "d4 Nf6 c4 g6": "Defensa India de Rey",
    "d4 Nf6 c4 g6 Nc3 Bg7": "Defensa India de Rey Clásica",
    "d4 Nf6 c4 g6 Nc3 d5": "Defensa Grünfeld",
    "d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3": "Defensa Grünfeld variante del Cambio",

    // Otras de d4
    "d4 f5": "Defensa Holandesa",
    "d4 f5 g3": "Defensa Holandesa variante Leningrado",
    "d4 f5 c4 Nf6 g3 e6 Bg2 Be7": "Defensa Holandesa Muro de Piedra",
    "d4 d5 Bf4": "Sistema Londres",
    "d4 Nf6 Nf3 g6 Bf4": "Sistema Londres",
    "d4 Nf6 Bg5": "Ataque Trompowsky",
    "d4 d5 Bg5": "Ataque Trompowsky",
    
    // Flanco
    "c4": "Apertura Inglesa",
    "c4 e5": "Apertura Inglesa Simétrica Invertida",
    "c4 c5": "Apertura Inglesa Simétrica",
    "Nf3": "Apertura Reti",
    "Nf3 d5 g3": "Ataque Indio de Rey",
    "b3": "Apertura Larsen",
    "b4": "Apertura Sokolsky",
    "f4": "Apertura Bird",
    "g3": "Apertura Benko / Húngara"
};

// Message pools per category — deterministic by moveIndex to avoid repeats
const MESSAGES = {
    BLUNDER_OWN: [
        "¡Un error catastrófico! Has perdido muchísima ventaja.",
        "Una equivocación garrafal. Esta jugada compromete totalmente la partida.",
        "Error muy grave. Regalaste el control absoluto de la posición."
    ],
    BLUNDER_OPP: [
        "¡El rival cometió un error catastrófico!",
        "¡Un error garrafal del oponente! La partida se inclina fuertemente.",
        "¡Vaya descuido catastrófico del rival!"
    ],
    MISTAKE_OWN: [
        "Has cometido un error importante aquí.",
        "Esta jugada es un claro error posicional o táctico.",
        "Fallo considerable. Había opciones mejores."
    ],
    MISTAKE_OPP: [
        "El oponente ha cometido un error claro.",
        "Un fallo evidente del rival que puedes aprovechar.",
        "El oponente se equivocó."
    ],
    INACCURACY_OWN: [
        "Una jugada un poco imprecisa.",
        "Se podía jugar con mayor precisión.",
        "Una imprecisión posicional."
    ],
    INACCURACY_OPP: [
        "El oponente jugó de forma imprecisa.",
        "Una leve imprecisión del rival.",
        "Una jugada dudosa del oponente."
    ],
    BRILLIANT: [
        "¡Jugada excepcional! Coincide con la primera opción de Stockfish.",
        "Movimiento preciso. Esta jugada es la que elegiría un gran maestro.",
        "¡Perfecto! Ni el propio Stockfish encontraría una respuesta superior.",
        "Jugada de alta calidad. El motor la evalúa como la mejor continuación posible.",
        "¡Exacta! Esta jugada optimiza completamente la posición."
    ],
    OPENING: [
        "Desarrollo sólido. Los principios de apertura se cumplen correctamente.",
        "Control central. Una buena base para el mediojuego.",
        "Apertura activa. Las piezas se dirigen a sus casillas ideales.",
        "Fundamentos correctos. La posición ofrece buen juego.",
        "Coherente con los principios clásicos de apertura."
    ],
    NEUTRAL: [
        "Posición equilibrada. Ambos bandos tienen recursos.",
        "La tensión se mantiene. La partida está abierta a múltiples planes.",
        "Continuación sólida. El balance se mantiene estable.",
        "Posición compleja. Las ideas estratégicas son la clave.",
        "Igualdad en el tablero. El próximo plan es determinante."
    ],
    DECISIVE_WHITE: [
        "Ventaja decisiva para blancas. La técnica debe ser suficiente.",
        "Blancas dominan. La posición es técnicamente ganadora.",
        "El material y la posición favorecen claramente a blancas."
    ],
    DECISIVE_BLACK: [
        "Ventaja decisiva para negras. La conversión técnica es el próximo paso.",
        "Negras dominan. La posición es técnicamente ganadora.",
        "El material y la posición favorecen claramente a negras."
    ],
    MATE_FOUND_OWN: [
        "¡Mate en la variante! La posición es absolutamente ganadora.",
        "Secuencia de mate detectada. La victoria está garantizada con precisión.",
        "¡Jaque mate forzado! El motor confirma la victoria."
    ],
    MATE_FOUND_OPP: [
        "El oponente tiene mate forzado. Es una posición perdida; hay que buscar complicaciones.",
        "Secuencia de mate del rival detectada. La resistencia es la única opción.",
        "Amenaza de mate crítica. El análisis es urgente."
    ],
    PUNISHED: [
        "¡Correcto! La imprecisión del rival fue aprovechada con precisión.",
        "Respuesta exacta al error del oponente. Eso es dominio táctico.",
        "¡Excelente! No desaprovechaste el regalo del rival.",
        "La ventaja fue capitalizada. Así se convierte una imprecisión ajena en puntos.",
        "Respuesta precisa. El motor coincide con esta continuación."
    ],
    MISSED_CHANCE: [
        "El rival cometió un error, pero la respuesta no fue la más fuerte disponible.",
        "Había una continuación decisiva aquí. El error del oponente no fue castigado.",
        "Oportunidad desaprovechada. El análisis muestra una ganancia concreta que se pasó.",
        "El rival se equivocó, pero la partida sigue igualada. Revisar la variante del motor.",
        "Un momento crítico no aprovechado. Estudia la jugada correcta aquí."
    ],
    ENDGAME_TENSION: [
        "La posición evoluciona. Cada jugada en el final tiene peso.",
        "El balance cambia en el final. La precisión técnica es indispensable.",
        "El juego se profundiza. Hay que calcular con cuidado.",
        "Momento delicado del final. Una sola imprecisión puede decidir."
    ]
};

export class PersonalityEngine {
    constructor() {
        this.currentTrainer = 'KING';
        this.analysisSide = 'w';
        this.lastOpeningName = "";
        // Cache: moveIndex -> message to avoid repeats when revisiting
        this._msgCache = {};

        // Pre-load voices for browsers that don't load them immediately
        this._voices = [];
        if ('speechSynthesis' in window) {
            this._voices = window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                this._voices = window.speechSynthesis.getVoices();
            };
        }
    }

    setAnalysisSide(side) {
        this.analysisSide = side;
        // Clear cache when perspective changes
        this._msgCache = {};
    }

    setTrainer(trainerId) {
        if (TRAINERS[trainerId]) this.currentTrainer = trainerId;
    }

    getTrainerInfo() {
        return TRAINERS[this.currentTrainer];
    }

    getOpeningName(history) {
        const moves = history.map(m => m.san).join(' ');
        let bestMatch = "";
        let maxLen = 0;
        for (const [seq, name] of Object.entries(OPENING_BOOK)) {
            if (moves.startsWith(seq) && seq.length > maxLen) {
                bestMatch = name;
                maxLen = seq.length;
            }
        }
        return bestMatch;
    }

    getFinalCommentary(accWhite, accBlack, numMoves) {
        const parts = [];
        if (numMoves < 20) parts.push("Partida breve. Probablemente una trampa de apertura o un error temprano decisivo.");
        const diff = Math.abs(accWhite - accBlack);
        if (diff < 5) {
            parts.push("Partida muy reñida, ambos bandos jugaron con precisión similar.");
        } else {
            const whiteWon = accWhite > accBlack;
            const userWon = (whiteWon && this.analysisSide === 'w') || (!whiteWon && this.analysisSide === 'b');
            if (userWon) parts.push("Superioridad clara en tu juego. La presión constante hizo la diferencia.");
            else parts.push("El rival tuvo mejor desempeño. Revisar los errores marcados ayudará a mejorar.");
        }
        return parts.join(" ");
    }

    // Deterministic pick from pool — same moveIndex always gets same msg
    _pick(pool, moveIndex) {
        return pool[moveIndex % pool.length];
    }

    getMessageForMove(moveIndex, category, isOpponent, mateIn = null) {
        const cacheKey = `${moveIndex}_${category}_${isOpponent ? 1 : 0}`;
        if (this._msgCache[cacheKey]) return this._msgCache[cacheKey];

        let pool;
        if (category === 'MATE_OWN')       pool = MESSAGES.MATE_FOUND_OWN;
        else if (category === 'MATE_OPP')  pool = MESSAGES.MATE_FOUND_OPP;
        else if (category === 'BLUNDER')   pool = isOpponent ? MESSAGES.BLUNDER_OPP   : MESSAGES.BLUNDER_OWN;
        else if (category === 'MISTAKE')   pool = isOpponent ? MESSAGES.MISTAKE_OPP   : MESSAGES.MISTAKE_OWN;
        else if (category === 'INACCURACY')pool = isOpponent ? MESSAGES.INACCURACY_OPP : MESSAGES.INACCURACY_OWN;
        else if (category === 'BRILLIANT') pool = MESSAGES.BRILLIANT;
        else if (category === 'OPENING')   pool = MESSAGES.OPENING;
        else if (category === 'DECISIVE_WHITE') pool = MESSAGES.DECISIVE_WHITE;
        else if (category === 'DECISIVE_BLACK') pool = MESSAGES.DECISIVE_BLACK;
        else pool = MESSAGES.NEUTRAL;

        const msg = this._pick(pool, moveIndex);
        this._msgCache[cacheKey] = msg;
        return msg;
    }

    /** Gets a message from a named pool deterministically (no caching — used for contextual comments) */
    getPoolMessage(poolName, moveIndex) {
        const pool = MESSAGES[poolName];
        if (!pool) return '';
        return this._pick(pool, moveIndex);
    }

    analyzeMove(diff, cp, sideMoved, isOpening, history, moveIndex) {
        const isUserSide = sideMoved === this.analysisSide;
        const openingName = this.getOpeningName(history);

        // Mate detection: cp is very large positive or negative
        const isMate = Math.abs(cp) > 5000;
        if (isMate) {
            const whiteWins = cp > 0;
            // If white wins and user is white => user has mate, opponent doesn't
            const userHasMate = (whiteWins && this.analysisSide === 'w') || (!whiteWins && this.analysisSide === 'b');
            const category = userHasMate ? 'MATE_OWN' : 'MATE_OPP';
            return { mood: userHasMate ? 'HAPPY' : 'SURPRISED', category, isOpponent: !isUserSide, openingName, isMate: true };
        }

        // Decisive advantage (5+ pawns)
        if (Math.abs(cp) > 500) {
            const whiteLeads = cp > 0;
            const category = whiteLeads ? 'DECISIVE_WHITE' : 'DECISIVE_BLACK';
            return { mood: 'NEUTRAL', category, isOpponent: false, openingName, isMate: false };
        }

        // Move quality based on diff (centipawn loss for the side that moved)
        if (diff >= 150) return { mood: 'ANGRY', category: 'BLUNDER', isOpponent: !isUserSide, openingName, isMate: false };
        if (diff >= 100) return { mood: 'SURPRISED', category: 'MISTAKE', isOpponent: !isUserSide, openingName, isMate: false };
        if (diff >= 70)  return { mood: 'NEUTRAL', category: 'INACCURACY', isOpponent: !isUserSide, openingName, isMate: false };
        if (isOpening) return { mood: 'NEUTRAL', category: 'OPENING', isOpponent: false, openingName, isMate: false };
        return { mood: 'NEUTRAL', category: 'NEUTRAL', isOpponent: false, openingName, isMate: false };
    }

    speak(text, onEndCallback = null, onStartCallback = null) {
        if (!('speechSynthesis' in window)) {
            if (onStartCallback) onStartCallback();
            if (onEndCallback) onEndCallback();
            return;
        }
        if (this._currentUtterance) {
            this._currentUtterance.onend = null;
            this._currentUtterance.onerror = null;
            this._currentUtterance.onstart = null;
        }
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        this._currentUtterance = utterance;
        
        utterance.lang = 'es-ES';
        
        if (!this._voices || this._voices.length === 0) {
            this._voices = window.speechSynthesis.getVoices();
        }
        
        let preferred = this._voices.find(v => v.lang.startsWith('es') && v.localService && v.name.toLowerCase().includes('microsoft') && v.name.toLowerCase().includes('helena'))
                     || this._voices.find(v => v.lang.startsWith('es') && v.localService && v.name.toLowerCase().includes('microsoft'))
                     || this._voices.find(v => v.lang.startsWith('es') && v.localService)
                     || this._voices.find(v => v.lang.startsWith('es'));
                     
        if (preferred) utterance.voice = preferred;
        utterance.pitch = 0.9;
        utterance.rate = 1.0;
        
        if (onStartCallback) {
            utterance.onstart = () => {
                if (this._currentUtterance === utterance) onStartCallback();
            };
        }

        if (onEndCallback) {
            utterance.onend = () => {
                if (this._currentUtterance === utterance) onEndCallback();
            };
            utterance.onerror = () => {
                if (this._currentUtterance === utterance) onEndCallback();
            };
        }
        
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 50);
    }
}
