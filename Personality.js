export const TRAINERS = {
    KING: {
        name: "Ordo Magnus",
        avatar: "/king.png",
        voice: "male",
        description: "Gran Maestro Digital - Sabiduría y Lógica Pura."
    }
};

const FAMOUS_QUOTES = {
    CENTER: [
        "\"El centro es el corazón del tablero.\" - Philidor",
        "\"Quien domine el centro, dominará la partida.\" - Nimzowitsch",
        "\"Los peones son el alma del ajedrez.\" - Philidor"
    ],
    TENSION: [
        "\"La amenaza es más fuerte que la ejecución.\" - Spielmann",
        "\"En el ajedrez, como en la vida, la mejor defensa es un buen ataque.\""
    ],
    ERROR: [
        "\"El error es el padre de la victoria.\" - Savielly Tartakower",
        "\"Aquel que comete el penúltimo error gana la partida.\" - Savielly Tartakower"
    ],
    DEVELOPMENT: [
        "\"Desarrolla tus piezas antes de atacar.\" - Lasker",
        "\"Cada pieza tiene un propósito, no la dejes durmiendo.\""
    ]
};

const OPENING_BOOK = {
    "e4 e5 Nf3 Nc6 Bc4 Bc5": "Apertura Italiana",
    "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5": "Ataque Fried Liver (Fegatello)",
    "e4 e6": "Defensa Francesa",
    "e4 c5": "Defensa Siciliana",
    "e4 e5 Nf3 Nc6 Bb5": "Apertura Ruy López (Española)",
    "d4 d5 c4": "Gambito de Dama",
    "e4 c6": "Defensa Caro-Kann",
    "e4 g6": "Defensa Moderna",
    "d4 Nf6 c4 g6 Nc3 Bg7": "Defensa India de Rey",
    "e4 e5 Nf3 Nc6 d4": "Apertura Escocesa",
    "e3": "Apertura Van't Kruijs (Ocupando el centro tímidamente...)"
};

export class PersonalityEngine {
    constructor() {
        this.currentTrainer = 'KING';
        this.analysisSide = 'w';
        this.lastOpeningName = "";
    }

    setAnalysisSide(side) {
        this.analysisSide = side;
    }

    setTrainer(trainerId) {
        if (TRAINERS[trainerId]) {
            this.currentTrainer = trainerId;
        }
    }

    getTrainerInfo() {
        return TRAINERS[this.currentTrainer];
    }

    getOpeningName(history) {
        const moves = history.map(m => m.san).join(' ');
        for (const [seq, name] of Object.entries(OPENING_BOOK)) {
            if (moves.startsWith(seq)) return name;
        }
        return "";
    }

    getFamousQuote(category) {
        const quotes = FAMOUS_QUOTES[category] || FAMOUS_QUOTES.DEVELOPMENT;
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    getFinalCommentary(accWhite, accBlack, numMoves) {
        let comments = [];
        
        if (numMoves < 18) {
            comments.push("¡Oye! Esto fue una miniatura... o quizás caíste en una celada. ¡Hay que estar más pendiente!");
        }

        const diff = Math.abs(accWhite - accBlack);
        if (diff < 5) {
            comments.push("La partida estuvo muy reñida, ambos jugaron a un nivel muy parejo. ¡Un choque de trenes!");
        } else {
            const isWhiteVictorious = accWhite > accBlack;
            const isUserWhite = this.analysisSide === 'w';
            
            if ((isWhiteVictorious && isUserWhite) || (!isWhiteVictorious && !isUserWhite)) {
                comments.push("¡Victoria aplastante! No le diste ni un respiro a tu oponente.");
            } else {
                comments.push("Esta derrota fue catastrófica. Tu rival te pasó por encima como una aplanadora.");
            }
        }

        return comments.join(" ");
    }

    getMessage(category, isOpponent, openingName) {
        let prefix = "";
        if (openingName && openingName !== this.lastOpeningName) {
            this.lastOpeningName = openingName;
            prefix = `¡Estamos ante una ${openingName}! `;
        }

        const messages = {
            CENTER: [
                "¡Oye! Esos peones centrales no se van a mover solos. " + this.getFamousQuote('CENTER'),
                "¿Y el centro pa' cuándo? " + this.getFamousQuote('CENTER'),
                "¡Concho! Ocupa el centro, que ahí es que está la fiesta."
            ],
            BLUNDER: isOpponent ? [
                "¡Tu oponente se fue de boca! No vio que acabas de ganarle una pieza.",
                "¡Oye eso! Tu oponente acaba de regalarte la partida. " + this.getFamousQuote('ERROR'),
                "¡Ay mi madre! Tu rival se acaba de equivocar feo. ¡Duro ahí!"
            ] : [
                "¡Ay mi madre! Ese movimiento dolió hasta aquí. " + this.getFamousQuote('ERROR'),
                "¿Viste eso? Acabas de regalar la dama. " + this.getFamousQuote('ERROR'),
                "Eso no fue un error, fue un crimen táctico. ¡Llamen a la policía del ajedrez!"
            ],
            BRILLIANT: isOpponent ? [
                "Tu oponente jugó una de la fina ahí. Ten cuidado.",
                "¡Cuidado! Tu rival sacó un truco debajo de la manga.",
                "Esa jugada de tu oponente tiene veneno. Mírala bien."
            ] : [
                "¡Wao! Ni Stockfish lo hubiera pensado mejor. " + this.getFamousQuote('DEVELOPMENT'),
                "¡Qué clase! Esa jugada tiene perfume de gran maestro. ¡Duro ahí!",
                "¡Abusador! Le diste en la madre con esa. ¡Eso es ajedrez de verdad!"
            ],
            INACCURACY: isOpponent ? [
                "Tu oponente no jugó la mejor ahí. Puedes castigarlo.",
                "Esa jugada de tu rival es como un café frío. " + this.getFamousQuote('TENSION'),
                "Tu rival se está ablandando. ¡Presiona!"
            ] : [
                "Pudiste hacerlo mejor. " + this.getFamousQuote('TENSION'),
                "Hay mejores opciones. Estás dejando que se te escape la ventaja.",
                "Eso fue un 'bulto'. Mucho movimiento y poca sustancia."
            ],
            NEUTRAL: [
                "Seguimos en la pelea. Mantén la concentración.",
                "Posición equilibrada. El que parpadee pierde.",
                "Tranquilo, que todavía hay juego. No te me sofoques."
            ]
        };

        const catMessages = messages[category] || messages.NEUTRAL;
        const mainMsg = catMessages[Math.floor(Math.random() * catMessages.length)];
        return prefix + mainMsg;
    }

    analyzeMove(diff, sideMoved, isOpening, history) {
        const isUserSide = sideMoved === this.analysisSide;
        const openingName = this.getOpeningName(history);
        
        if (diff > 300) return { mood: 'ANGRY', category: 'BLUNDER', isOpponent: !isUserSide, openingName };
        if (diff > 100) return { mood: 'SURPRISED', category: 'INACCURACY', isOpponent: !isUserSide, openingName };
        if (diff < -50) return { mood: 'HAPPY', category: 'BRILLIANT', isOpponent: !isUserSide, openingName };
        
        if (openingName && openingName !== this.lastOpeningName) {
            return { mood: 'NEUTRAL', category: 'NEUTRAL', isOpponent: false, openingName };
        }

        if (isOpening) return { mood: 'NEUTRAL', category: 'CENTER', isOpponent: false, openingName };

        return { mood: 'NEUTRAL', category: 'NEUTRAL', isOpponent: false, openingName };
    }

    speak(text) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        
        const voices = window.speechSynthesis.getVoices();
        // Priority for male voices in Spanish
        const preferredVoice = voices.find(v => v.lang.startsWith('es') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('rey') || v.name.toLowerCase().includes('pablo') || v.name.toLowerCase().includes('raul')))
                        || voices.find(v => v.lang.startsWith('es') && v.name.includes('male'))
                        || voices.find(v => v.lang.startsWith('es'));

        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.pitch = 0.85;
        utterance.rate = 1.0;
        
        window.speechSynthesis.speak(utterance);
    }
}
