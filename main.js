import { Chess } from 'chess.js';
import { StockfishEngine } from './Engine.js';
import { PersonalityEngine } from './Personality.js';

class GrandmasterWhisperer {
    constructor() {
        this.game = new Chess();
        this.engine = new StockfishEngine();
        this.personality = new PersonalityEngine();
        
        this.boardElement = document.getElementById('chessboard');
        this.movesListElement = document.getElementById('moves-list');
        this.pgnInput = document.getElementById('pgn-input');
        this.whispererText = document.getElementById('whisperer-text');
        this.whispererAvatar = document.getElementById('whisperer-avatar');
        this.engineStatus = document.getElementById('engine-status');
        this.accuracyReport = document.getElementById('accuracy-report');
        this.gameSelector = document.getElementById('game-select');
        this.gameSelectorContainer = document.getElementById('game-selector-container');
        this.hintContainer = document.getElementById('hint-container');
        this.hintMsg = document.getElementById('hint-msg');
        this.btnHintYes = document.getElementById('btn-hint-yes');
        this.btnHintNo = document.getElementById('btn-hint-no');
        this.evalFill = document.getElementById('eval-fill');

        this.history = [];
        this.currentIndex = -1;
        this.isFlipped = false;
        this.isAutoPlaying = false;
        this.autoPlayTimeout = null;
        this.isAnalyzingFullGame = false;
        this.analysisResults = [];   // [0..n] one eval per move position
        this.currentEval = 0;
        this.currentBestPV = [];     // principal variation: array of UCI moves
        this.allGames = [];

        // Hint mode: temporarily show PV on board, then restore
        this.isShowingHint = false;
        this.hintReturnIndex = -1;
        this.wasAutoPlaying = false;
        
        // Interactive play
        this.selectedSquare = null;

        // Debounce timer for processInput
        this._inputDebounce = null;

        this.initEventListeners();
        this.initEngine();
        this.renderBoard();
    }

    initEventListeners() {
        document.getElementById('btn-prev').addEventListener('click', () => this.goToMove(this.currentIndex - 1));
        document.getElementById('btn-next').addEventListener('click', () => this.goToMove(this.currentIndex + 1));
        document.getElementById('btn-first').addEventListener('click', () => this.goToMove(-1));
        document.getElementById('btn-last').addEventListener('click', () => this.goToMove(this.history.length - 1));
        document.getElementById('btn-flip').addEventListener('click', () => this.flipBoard());
        document.getElementById('btn-autoplay').addEventListener('click', () => this.toggleAutoPlay());
        document.getElementById('btn-nav-upload').addEventListener('click', () => document.getElementById('pgn-file').click());
        document.getElementById('pgn-file').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('pgn-input').addEventListener('input', () => {
            clearTimeout(this._inputDebounce);
            this._inputDebounce = setTimeout(() => this.processInput(), 600);
        });
        document.getElementById('game-select').addEventListener('change', (e) => this.loadGame(parseInt(e.target.value)));
        document.getElementById('perspective-white').addEventListener('click', () => this.setPerspective('w'));
        document.getElementById('perspective-black').addEventListener('click', () => this.setPerspective('b'));
        this.btnHintYes.addEventListener('click', () => this.handleHintYes());
        this.btnHintNo.addEventListener('click', () => this.handleHintNo());
        
        // Board interactivity
        this.boardElement.addEventListener('click', (e) => {
            const squareEl = e.target.closest('.square');
            if (squareEl) this.handleSquareClick(squareEl.dataset.square);
        });

        document.getElementById('btn-export-pgn').addEventListener('click', () => this.exportPgn());
    }

    initEngine() {
        this.engine.onReady = () => {
            this.engineStatus.innerText = "Motor: Listo";
            this.engineStatus.style.color = "#10b981";
        };
        this.engine.onInfo = (msg) => this.handleEngineInfo(msg);
        this.engine.onBestMove = (msg) => this.handleBestMove(msg);
    }

    // ─── PGN INPUT ────────────────────────────────────────────────────────────

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            this.pgnInput.value = event.target.result;
            this.processInput(true); // Force processing for files
        };
        reader.readAsText(file);
    }

    /**
     * Detects if a PGN is already written in English algebraic notation.
     * Key signals: 'N' = knight (Spanish uses 'C'), 'Q' = queen (Spanish uses 'D').
     */
    isPgnInEnglish(pgn) {
        // Remove headers and comments before checking
        const moveSection = pgn
            .replace(/\[[^\]]*\]/g, '')
            .replace(/\{[^}]*\}/g, '');
        // N or Q followed by a square/capture = English piece notation
        return /\b[NQ][a-h1-8x]/.test(moveSection);
    }

    translatePgnToEnglish(pgn) {
        // If already in English, skip to avoid corrupting Rook (R) and other pieces
        if (this.isPgnInEnglish(pgn)) return pgn;

        const lines = pgn.split('\n');
        return lines.map(line => {
            if (line.trim().startsWith('[')) return line;
            return line
                .replace(/R(?=[a-hx0-9])/g, 'K')
                .replace(/D(?=[a-hx0-9])/g, 'Q')
                .replace(/T(?=[a-hx0-9])/g, 'R')
                .replace(/A(?=[a-hx0-9])/g, 'B')
                .replace(/C(?=[a-hx0-9])/g, 'N');
        }).join('\n');
    }

    /**
     * Strips Arena/engine annotations from PGN:
     * - {comments with engine PV and eval}
     * - NAGs ($1, $2...)
     * - "1. ..." black-to-move notation
     * Leaves headers and move text intact.
     */
    cleanArenaAnnotations(pgn) {
        // Strip {comments} using a character scanner (handles parens inside)
        let result = '';
        let depth = 0;
        for (let i = 0; i < pgn.length; i++) {
            if (pgn[i] === '{') { depth++; continue; }
            if (pgn[i] === '}') { depth--; continue; }
            if (depth === 0) result += pgn[i];
        }
        // Remove "1. ..." style (black forfeits / game starts with Black)
        result = result.replace(/\d+\.\s*\.\.\.\s*/g, '');
        // Remove NAG annotations
        result = result.replace(/\$\d+/g, '');
        // Collapse extra whitespace
        result = result.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
        return result;
    }

    /**
     * Returns true if a PGN game string has at least one real move.
     */
    gameHasMoves(pgn) {
        const cleaned = this.cleanArenaAnnotations(pgn);
        const moveSection = cleaned.replace(/\[[^\]]*\]/g, '').trim();
        return /[1-9]\d*\.\s*[a-hA-Z]/.test(moveSection);
    }

    processInput(force = false) {
        let content = this.pgnInput.value.trim();
        if (!content) { this.resetBoard(); return; }

        // Auto-append * if missing and forced (e.g. for files without result tags)
        if (force && !content.includes('[Event') && !content.endsWith('*')) {
            content += ' *';
            this.pgnInput.value = content;
        }

        const isStandard = content.includes('[Event');
        if (!isStandard) {
            if (!content.endsWith('*') && !force) return;
            content = this.translatePgnToEnglish(content);
            const rawGames = content.split('@').filter(g => g.trim() !== "");
            let pgnFormatted = "";
            rawGames.forEach((game, i) => {
                let cleanGame = game.trim();
                if (cleanGame.endsWith('*')) cleanGame = cleanGame.slice(0, -1).trim();
                pgnFormatted += `[Event "Partida Anónima ${i + 1}"]\n${cleanGame}\n\n`;
            });
            content = pgnFormatted;
        } else {
            const hasResult = /\b(1-0|0-1|1\/2-1\/2|\*)\s*$/.test(content) ||
                              /\b(1-0|0-1|1\/2-1\/2)/.test(content);
            if (!hasResult && !force) return;
            content = this.translatePgnToEnglish(content);
        }

        const allRaw = content.split(/(?=\[Event )/).filter(g => g.trim() !== "");
        const games = allRaw.filter(g => this.gameHasMoves(g));

        if (games.length === 0) {
            this.whispererText.innerText = "No se encontraron partidas con jugadas analizables en este archivo.";
            return;
        }

        this.allGames = games;
        if (games.length > 1) this.showGameSelector(games);
        else this.gameSelectorContainer.style.display = 'none';
        this.loadGame(0);
    }

    resetBoard() {
        this.isAnalyzingFullGame = false;
        this.isAutoPlaying = false;
        clearTimeout(this.autoPlayTimeout);
        this.engine.stop();
        this.game = new Chess();
        this.history = [];
        this.currentIndex = -1;
        this.allGames = [];
        this.analysisResults = [];
        this.bestMoves = [];
        this.bestPVs = [];
        this.currentBestPV = [];
        this.lastHintIndex = -1;
        this.isShowingHint = false;
        this.wasAutoPlaying = false;
        this.renderBoard();
        this.renderMovesList();
        this.updateEvalBar(0);
        this.hintContainer.style.display = 'none';
        this.accuracyReport.style.display = 'none';
        this.gameSelectorContainer.style.display = 'none';
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        this.whispererText.innerText = "Listo. Pega una PGN o escribe jugadas seguidas de *.";
    }

    showGameSelector(games) {
        this.gameSelector.innerHTML = '';
        games.forEach((g, i) => {
            const white = g.match(/\[White "(.*?)"\]/)?.[1] || "Blanco";
            const black = g.match(/\[Black "(.*?)"\]/)?.[1] || "Negro";
            const option = document.createElement('option');
            option.value = i;
            option.innerText = `Partida ${i+1}: ${white} vs ${black}`;
            this.gameSelector.appendChild(option);
        });
        this.gameSelectorContainer.style.display = 'block';
    }

    loadGame(index) {
        let pgn = this.allGames[index];
        // 1. Strip Arena engine comments and forfeit annotations
        pgn = this.cleanArenaAnnotations(pgn);
        // 2. Translate Spanish notation to English for chess.js
        pgn = this.translatePgnToEnglish(pgn);
        try {
            this.personality._msgCache = {};
            this.game.loadPgn(pgn);
            this.history = this.game.history({ verbose: true });
            if (this.history.length === 0) {
                this.whispererText.innerText = "Esta partida no tiene jugadas para analizar.";
                return;
            }
            this.renderMovesList();
            this.renderBoard();
            this.accuracyReport.style.display = 'none';
            this.startFullAnalysis();
        } catch (e) {
            console.error('PGN parse error:', e, pgn.slice(0, 300));
            this.say("Error al procesar la partida. Verifica el formato PGN.");
        }
    }

    setPerspective(side) {
        this.personality.setAnalysisSide(side);
        document.getElementById('perspective-white').classList.toggle('active', side === 'w');
        document.getElementById('perspective-black').classList.toggle('active', side === 'b');
        this.say(`Perspectiva cambiada a ${side === 'w' ? 'Blancas' : 'Negras'}.`);
    }

    // ─── FULL GAME ANALYSIS ───────────────────────────────────────────────────

    startFullAnalysis() {
        this.isAnalyzingFullGame = true;
        this.analysisResults = [0]; // position 0 = starting position = 0 cp
        this.bestMoves = []; // Initialize bestMoves array to avoid undefined errors
        this.bestPVs = []; // Store full PV arrays for each position
        this.lastHintIndex = -1;
        this.currentIndex = -1;
        this.whispererText.innerText = "Iniciando análisis de la partida...";
        this.analyzeNextMoveInGame();
    }

    analyzeNextMoveInGame() {
        if (!this.isAnalyzingFullGame) return;
        if (this.currentIndex >= this.history.length - 1) {
            this.isAnalyzingFullGame = false;
            this.goToMove(-1);
            this.calculateAccuracy();
            return;
        }
        this.currentIndex++;
        this.game.reset();
        for (let i = 0; i <= this.currentIndex; i++) this.game.move(this.history[i].san);
        this.renderBoard();
        this.updateActiveMove();
        this.engine.analyzePosition(this.game.fen(), 8);
    }

    // ─── ENGINE HANDLERS ──────────────────────────────────────────────────────

    handleEngineInfo(msg) {
        const cpMatch = msg.match(/score cp (-?\d+)/);
        const mateMatch = msg.match(/score mate (-?\d+)/);

        if (cpMatch) {
            const cp = parseInt(cpMatch[1]);
            // From engine's perspective (side to move = positive is good for them)
            // We want score from White's perspective always
            this.currentEval = this.game.turn() === 'w' ? cp : -cp;
        } else if (mateMatch) {
            const mateIn = parseInt(mateMatch[1]);
            // mateIn > 0 means side to move has mate, < 0 means side to move is getting mated
            if (this.game.turn() === 'w') {
                this.currentEval = mateIn > 0 ? (10000 - mateIn) : -(10000 + mateIn);
            } else {
                this.currentEval = mateIn > 0 ? -(10000 - mateIn) : (10000 + mateIn);
            }
            // Store mateIn for display
            this._lastMateIn = mateIn;
        }

        this.updateEvalBar(this.currentEval, mateMatch ? parseInt(mateMatch[1]) : null);

        const pvMatch = msg.match(/ pv ([a-h1-8NnBbRrQqKkPp\-O]+(?:\s[a-h1-8NnBbRrQqKkPp\-O]+)*)/);
        if (pvMatch) {
            this.currentBestPV = pvMatch[1].split(' ').slice(0, 5); // up to 5 moves
        }
    }

    handleBestMove(msg) {
        if (this.currentIndex < 0) return;

        if (this.isAnalyzingFullGame) {
            this.analysisResults[this.currentIndex + 1] = this.currentEval;
            if (this.currentBestPV && this.currentBestPV.length > 0) {
                this.bestMoves[this.currentIndex + 1] = this.currentBestPV[0];
                this.bestPVs[this.currentIndex + 1] = this.currentBestPV;
            }

            // Detect blunder during analysis and show msg, then continue after delay
            if (this.currentIndex > 0) {
                const prevEval = this.analysisResults[this.currentIndex];
                const actualMove = this.history[this.currentIndex];
                if (actualMove) {
                    const side = actualMove.color;
                    const diff = side === 'w' ? (prevEval - this.currentEval) : (this.currentEval - prevEval);
                    if (diff > 250) {
                        const analysis = this.personality.analyzeMove(diff, this.currentEval, side, false, this.history.slice(0, this.currentIndex + 1), this.currentIndex);
                        const msgText = this.personality.getMessageForMove(this.currentIndex, analysis.category, analysis.isOpponent);
                        const currentFullMove = Math.floor(this.currentIndex / 2) + 1;
                        this.say(`Jugada ${currentFullMove} (${side === 'w' ? 'Blancas' : 'Negras'}): ${msgText}`, analysis.mood, false);
                        setTimeout(() => this.analyzeNextMoveInGame(), 800);
                        return;
                    }
                }
            }
            
            // Force UI update for progress text by yielding to browser render thread
            const currentFullMove = Math.floor(this.currentIndex / 2) + 1;
            const totalFullMoves = Math.ceil(this.history.length / 2);
            const sideStr = this.history[this.currentIndex]?.color === 'w' ? 'Blancas' : 'Negras';
            this.whispererText.innerText = `Analizando... jugada ${currentFullMove} de ${totalFullMoves} (${sideStr}).`;
            setTimeout(() => this.analyzeNextMoveInGame(), 10);
            return;
        }

        // Interactive mode: provide commentary for the current move
        this._provideInteractiveCommentary();
    }

    _provideInteractiveCommentary() {
        // If we are replaying a move we already prompted a hint for, just advance silently
        if (this.lastHintIndex === this.currentIndex) {
            this.hintContainer.style.display = 'none';
            if (this.isAutoPlaying) {
                this.autoPlayTimeout = setTimeout(() => this.nextAutoStep(), 1000);
            }
            return;
        }

        const actualMove = this.history[this.currentIndex];
        if (!actualMove) return;

        const playedUCI = actualMove.from + actualMove.to + (actualMove.promotion || '');
        const engineRecommendedUCI = this.bestMoves ? this.bestMoves[this.currentIndex] : undefined;
        const isBestMove = engineRecommendedUCI && engineRecommendedUCI === playedUCI;

        const side = actualMove.color;
        const prevEval = this.analysisResults[this.currentIndex] ?? 0;
        const diff = side === 'w' ? (prevEval - this.currentEval) : (this.currentEval - prevEval);

        const moveNum = Math.floor(this.currentIndex / 2) + 1;
        const isOpening = this.currentIndex < 12;
        const isEndgame = this.currentIndex > 35 || this._isEndgamePosition();
        const isUserSide = side === this.personality.analysisSide;

        const analysis = this.personality.analyzeMove(
            diff, this.currentEval, side, isOpening,
            this.history.slice(0, this.currentIndex + 1),
            this.currentIndex
        );

        const isBlunder = analysis.category === 'BLUNDER';
        const isMistake = analysis.category === 'MISTAKE';
        const isInaccuracy = analysis.category === 'INACCURACY';
        const isBrilliant = analysis.category === 'BRILLIANT';
        const isMate = analysis.isMate;
        const isError = isBlunder || isMistake || isInaccuracy;

        // ── OPENING PHASE: only announce opening name ──────────────────────────
        if (isOpening) {
            let openingName = analysis.openingName;
            const header = this.game.header();
            if (header && header.Opening) {
                openingName = header.Opening;
                if (header.Variation) {
                    openingName += ` variante ${header.Variation}`;
                }
                // Translate common English PGN terms to Spanish
                openingName = openingName.replace(/Defense/gi, "Defensa")
                                         .replace(/Opening/gi, "Apertura")
                                         .replace(/Attack/gi, "Ataque")
                                         .replace(/Variation/gi, "")
                                         .replace(/Game/gi, "Apertura")
                                         .replace(/Gambit/gi, "Gambito")
                                         .trim();
            }

            this.hintContainer.style.display = 'none';
            if (openingName && openingName !== this.personality.lastOpeningName) {
                this.personality.lastOpeningName = openingName;
                this.say(`${openingName}.`, 'NEUTRAL', this.isAutoPlaying);
            } else if (this.isAutoPlaying) {
                this.autoPlayTimeout = setTimeout(() => this.nextAutoStep(), 1000);
            }
            return;
        }

        // ── FIRST MOVE OUT OF OPENING: announce end of theory ────────────────
        if (!isOpening && this.currentIndex === 12 && this.isAutoPlaying) {
            const openingAnnounced = this.personality.lastOpeningName;
            const text = openingAnnounced
                ? `Fin de la teoría. Se jugó la ${openingAnnounced}. Comienza el mediojuego.`
                : `Fin de la fase inicial. Comienza el mediojuego.`;
            this.say(text, 'NEUTRAL', true);
            this.hintContainer.style.display = 'none';
            return;
        }

        // ── CHECK: was the opponent's PREVIOUS move an error? ─────────────────
        let opponentPreviousError = 0;
        if (this.currentIndex >= 1) {
            const prevMove = this.history[this.currentIndex - 1];
            if (prevMove) {
                const e0 = this.analysisResults[this.currentIndex - 1] ?? 0;
                const e1 = this.analysisResults[this.currentIndex] ?? 0;
                const prevSide = prevMove.color;
                opponentPreviousError = prevSide === 'w'
                    ? (e0 - e1)   // positive = white lost cp = opponent (white) blundered
                    : (e1 - e0);  // positive = black lost cp = opponent (black) blundered
            }
        }
        const opponentBlundered = opponentPreviousError > 120;
        const userPunished = opponentBlundered && diff < -30;  // user gained advantage
        const userMissed   = opponentBlundered && diff >  50;  // user also lost cp

        // ── MATE THREAT ────────────────────────────────────────────────────────
        if (this.game.in_checkmate && this.game.in_checkmate()) {
            const mateMsgs = [
                "¡Jaque Mate! Fue un gusto analizar esta partida contigo. ¿Te animas a cargar otra?",
                "¡Jaque Mate! Una partida muy interesante. Estoy listo cuando quieras analizar la siguiente.",
                "¡Jaque Mate! Gran desenlace. Si quieres analizamos otra partida, ¡solo cárgala!"
            ];
            const msg = mateMsgs[Math.floor(Math.random() * mateMsgs.length)];
            this.say(msg, "HAPPY", this.isAutoPlaying);
            this.hintContainer.style.display = 'none';
            return;
        }

        if (isMate) {
            const msgText = this.personality.getMessageForMove(
                this.currentIndex,
                analysis.category === 'MATE_OWN' ? 'MATE_OWN' : 'MATE_OPP',
                analysis.isOpponent
            );
            
            // If they played well during a mate, praise them instead of prompting
            if (!isError && !userMissed && analysis.category === 'MATE_OWN') {
                this.say("Mantiene la red de mate.", "HAPPY", this.isAutoPlaying);
                this.hintContainer.style.display = 'none';
            } else {
                this.say(msgText, analysis.mood, this.isAutoPlaying);
                this.promptHint();
            }
            return;
        }

        // ── BEST ENGINE MOVE ───────────────────────────────────────────────────
        if (isBestMove && !isOpening) {
            if (this.lastOpponentErrorIndex === this.currentIndex - 1) {
                this.say("¡Excelente! Encontraste el movimiento clave para castigar el error del oponente.", "HAPPY", this.isAutoPlaying);
                this.hintContainer.style.display = 'none';
                return;
            }
            // If it's a best move but not punishing a recent error, we fall through.
            // This prevents spamming "Precisión total" on every generic good move.
        }

        // ── ERROR MADE BY EITHER SIDE ──────────────────────────────────────────
        if (isError) {
            const msgText = this.personality.getMessageForMove(
                this.currentIndex, analysis.category, analysis.isOpponent
            );
            
            if (analysis.isOpponent || isInaccuracy) {
                if (analysis.isOpponent && !isInaccuracy) {
                    this.lastOpponentErrorIndex = this.currentIndex;
                }
                this.say(msgText, analysis.mood, this.isAutoPlaying);
                this.hintContainer.style.display = 'none';
            } else {
                this.say(msgText, analysis.mood, this.isAutoPlaying);
                this.promptHint();
            }
            return;
        }

        // ── RESPONSE TO OPPONENT'S ERROR ───────────────────────────────────────
        if (userPunished && !isBestMove) {
            this.say(this.personality.getPoolMessage('PUNISHED', this.currentIndex), 'HAPPY', this.isAutoPlaying);
            this.hintContainer.style.display = 'none';
            return;
        }
        if (userMissed) {
            this.say(this.personality.getPoolMessage('MISSED_CHANCE', this.currentIndex), 'SURPRISED', this.isAutoPlaying);
            this.promptHint();
            return;
        }

        // ── BRILLIANT MOVE ─────────────────────────────────────────────────────
        if (isBrilliant) {
            const msgText = this.personality.getMessageForMove(this.currentIndex, 'BRILLIANT', false);
            this.say(msgText, 'HAPPY', this.isAutoPlaying);
            this.hintContainer.style.display = 'none';
            return;
        }

        // ── DECISIVE ADVANTAGE STATE CHANGED ───────────────────────────────────
        const currentAbsEval = Math.abs(this.currentEval);
        const currentIsDecisive = currentAbsEval > 350; // +3.5 is decisive
        const currentWhiteLeads = this.currentEval > 0;
        const currentDecisiveState = currentIsDecisive ? (currentWhiteLeads ? 'WHITE' : 'BLACK') : null;

        const prevAbsEval = Math.abs(prevEval);
        const prevIsDecisive = prevAbsEval > 350;
        const prevWhiteLeads = prevEval > 0;
        const prevDecisiveState = prevIsDecisive ? (prevWhiteLeads ? 'WHITE' : 'BLACK') : null;

        const decisiveStateChanged = currentDecisiveState && currentDecisiveState !== prevDecisiveState;

        if (decisiveStateChanged) {
            const msg = this.personality.getPoolMessage(currentWhiteLeads ? 'DECISIVE_WHITE' : 'DECISIVE_BLACK', this.currentIndex);
            this.say(msg, 'NEUTRAL', this.isAutoPlaying);
            this.hintContainer.style.display = 'none';
            return;
        }

        // ── ENDGAME: comment on significant advantage / threats ────────────────
        if (isEndgame) {
            const evalSwing = Math.abs(diff);
            if (evalSwing > 200) {
                const msg = this.personality.getPoolMessage('ENDGAME_TENSION', this.currentIndex);
                this.say(msg, 'NEUTRAL', this.isAutoPlaying);
                this.hintContainer.style.display = 'none';
                return;
            }
        }

        // ── SILENT MOVE: advance without commentary ────────────────────────────
        this.hintContainer.style.display = 'none';
        if (this.isAutoPlaying) {
            this.autoPlayTimeout = setTimeout(() => this.nextAutoStep(), 1000);
        }
    }

    /** Detects endgame by counting major/minor pieces remaining */
    _isEndgamePosition() {
        let count = 0;
        this.game.board().forEach(row =>
            row.forEach(sq => { if (sq && sq.type !== 'p' && sq.type !== 'k') count++; })
        );
        return count <= 6;
    }


    // ─── EVAL BAR ────────────────────────────────────────────────────────────

    updateEvalBar(cp, mateIn = null) {
        const evalValueEl = document.getElementById('eval-value');

        if (mateIn !== null) {
            const absMate = Math.abs(mateIn);
            const sign = mateIn > 0
                ? (this.game.turn() === 'w' ? '+' : '-')
                : (this.game.turn() === 'w' ? '-' : '+');
            evalValueEl.innerText = `${sign}M${absMate}`;
            // Fill bar completely for the winning side
            const winnerIsWhite = cp > 0;
            this.evalFill.style.height = winnerIsWhite ? '100%' : '0%';
            this.evalFill.style.background = winnerIsWhite ? 'white' : '#1a1a1a';
            return;
        }

        let displayScore = (cp / 100).toFixed(1);
        evalValueEl.innerText = (cp > 0 ? "+" : "") + displayScore;

        // Map centipawns to bar: 0cp = 50%, each 50cp = ~5% (caps at 5-95%)
        let percent = 50 + (cp / 1000) * 50;
        percent = Math.max(2, Math.min(98, percent));
        this.evalFill.style.height = `${percent}%`;

        if (cp > 150) this.evalFill.style.background = 'white';
        else if (cp < -150) this.evalFill.style.background = '#1a1a1a';
        else this.evalFill.style.background = 'linear-gradient(to top, #444, #ddd)';
    }

    // ─── MOVE NAVIGATION ─────────────────────────────────────────────────────

    goToMove(index) {
        if (index < -1 || index >= this.history.length) return;

        if (index !== this.lastHintIndex && index !== this.lastHintIndex - 1) {
            this.lastHintIndex = -1;
        }

        // If in hint mode, restore state first
        if (this.isShowingHint) {
            this.isShowingHint = false;
            // No need to revert visually here; renderBoard at bottom will do it
        }
        
        this.hintContainer.style.display = 'none';
        this.wasAutoPlaying = false;

        if (this.isAnalyzingFullGame) {
            this.isAnalyzingFullGame = false;
            this.whispererText.innerText = "Análisis pausado. Navegando la partida.";
        }

        this.currentIndex = index;
        this.game.reset();
        for (let i = 0; i <= index; i++) this.game.move(this.history[i].san);

        this.renderBoard();
        this.updateActiveMove();
        this.engine.stop();
        this.engine.analyzePosition(this.game.fen(), 12);
    }

    // ─── HINT: show PV on board then restore ─────────────────────────────────

    promptHint() {
        if (this.lastHintIndex === this.currentIndex) return;
        this.lastHintIndex = this.currentIndex;

        this.hintContainer.style.display = 'flex';
        this.hintMsg.innerText = "¿Ver sugerencia del módulo?";
        this.btnHintYes.innerText = 'Sí';
        this.btnHintYes.style.background = 'var(--success)';
        this.btnHintNo.style.display = 'block';
        
        if (this.isAutoPlaying) {
            this.wasAutoPlaying = true;
            this.toggleAutoPlay(false); // Pauses auto-play without cutting off the current explanation
        } else {
            this.wasAutoPlaying = false;
        }
    }

    handleHintNo() {
        this.hintContainer.style.display = 'none';
        if (this.wasAutoPlaying && !this.isAutoPlaying) {
            this.toggleAutoPlay(); // Resumes auto-play
        }
    }

    async handleHintYes() {
        const pvMoves = this.bestPVs ? this.bestPVs[this.currentIndex] : null;
        if (this.isShowingHint || !pvMoves || pvMoves.length === 0) return;

        this.isShowingHint = true;
        this.hintReturnIndex = this.currentIndex;
        this.hintContainer.style.display = 'none';

        // 1. Revert to position BEFORE the blunder
        const beforeBlunderIndex = this.currentIndex - 1;
        const tempGame = new Chess();
        const baseHistory = [];
        for (let i = 0; i <= beforeBlunderIndex; i++) {
            tempGame.move(this.history[i].san);
            baseHistory.push(this.history[i]);
        }

        // Show the board before the mistake briefly
        this._renderGameState(tempGame, baseHistory);
        await new Promise(resolve => setTimeout(resolve, 800));

        // 2. Play up to 3 moves of the CORRECT PV on the reverted board
        const tempHistory = [];
        const sanMoves = [];

        for (const uciMove of pvMoves.slice(0, 3)) {
            const from = uciMove.substring(0, 2);
            const to = uciMove.substring(2, 4);
            const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
            try {
                const result = tempGame.move({ from, to, promotion });
                if (result) {
                    tempHistory.push(result);
                    sanMoves.push(result.san);
                }
            } catch (e) {
                break;
            }
        }

        this.say(`Variante recomendada: ${sanMoves.map(san => this._sanToSpanish(san)).join(' → ')}.`);

        // 3. Animate the correct sequence
        const animGame = new Chess();
        const animHistory = [...baseHistory];
        for (let i = 0; i <= beforeBlunderIndex; i++) animGame.move(this.history[i].san);
        
        for (let i = 0; i < tempHistory.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 800));
            // Check if user manually navigated away during animation
            if (!this.isShowingHint) return;
            animGame.move(tempHistory[i].san);
            animHistory.push(tempHistory[i]);
            this._renderGameState(animGame, animHistory);
        }

        // Wait 3 seconds after the sequence completes
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // If still in hint mode, auto-close it
        if (this.isShowingHint) {
            this.handleHintReturn();
        }
    }

    handleHintReturn() {
        this.isShowingHint = false;
        const autoResume = this.wasAutoPlaying && !this.isAutoPlaying;
        
        if (autoResume) {
            this.hintContainer.style.display = 'none';
            this.wasAutoPlaying = false;
            this.currentIndex = this.hintReturnIndex - 1;
            this.toggleAutoPlay();
        } else {
            this.goToMove(this.hintReturnIndex - 1);
        }
    }

    _sanToSpanish(san) {
        return san.replace(/N/g, 'C')
                  .replace(/B/g, 'A')
                  .replace(/R/g, 'T')
                  .replace(/Q/g, 'D')
                  .replace(/K/g, 'R');
    }

    _renderGameState(chessInstance, highlightMoves) {
        this.boardElement.innerHTML = '';
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        const displayRanks = this.isFlipped ? [...ranks].reverse() : ranks;
        const displayFiles = this.isFlipped ? [...files].reverse() : files;

        const highlightSquares = new Set();
        if (highlightMoves.length > 0) {
            const lastMove = highlightMoves[highlightMoves.length - 1];
            highlightSquares.add(lastMove.from);
            highlightSquares.add(lastMove.to);
        }

        displayRanks.forEach((rank, rIdx) => {
            displayFiles.forEach((file, fIdx) => {
                const square = document.createElement('div');
                const isDark = (rIdx + fIdx) % 2 !== 0;
                square.className = `square ${isDark ? 'dark' : 'light'}`;
                square.dataset.square = `${file}${rank}`;
                if (fIdx === 0) { square.classList.add('rank-label'); square.setAttribute('data-rank', rank); }
                if (rIdx === 7) { square.classList.add('file-label'); square.setAttribute('data-file', file); }

                const piece = chessInstance.get(`${file}${rank}`);
                if (piece) {
                    const pieceImg = document.createElement('img');
                    pieceImg.src = `https://lichess1.org/assets/piece/cburnett/${piece.color}${piece.type.toUpperCase()}.svg`;
                    pieceImg.className = 'piece';
                    square.appendChild(pieceImg);
                }
                if (highlightSquares.has(`${file}${rank}`)) square.classList.add('hint-from');
                this.boardElement.appendChild(square);
            });
        });
    }

    // ─── BOARD RENDERING ─────────────────────────────────────────────────────

    renderBoard() {
        this.boardElement.innerHTML = '';
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        const displayRanks = this.isFlipped ? [...ranks].reverse() : ranks;
        const displayFiles = this.isFlipped ? [...files].reverse() : files;

        displayRanks.forEach((rank, rIdx) => {
            displayFiles.forEach((file, fIdx) => {
                const square = document.createElement('div');
                const isDark = (rIdx + fIdx) % 2 !== 0;
                square.className = `square ${isDark ? 'dark' : 'light'}`;
                square.dataset.square = `${file}${rank}`;
                if (fIdx === 0) { square.classList.add('rank-label'); square.setAttribute('data-rank', rank); }
                if (rIdx === 7) { square.classList.add('file-label'); square.setAttribute('data-file', file); }

                const piece = this.game.get(`${file}${rank}`);
                if (piece) {
                    const pieceImg = document.createElement('img');
                    pieceImg.src = `https://lichess1.org/assets/piece/cburnett/${piece.color}${piece.type.toUpperCase()}.svg`;
                    pieceImg.className = 'piece';
                    square.appendChild(pieceImg);
                }
                
                // Selection highlight
                if (this.selectedSquare === `${file}${rank}`) {
                    square.classList.add('selected-square');
                }

                if (this.currentIndex >= 0) {
                    const lastMove = this.history[this.currentIndex];
                    if (lastMove?.from === `${file}${rank}` || lastMove?.to === `${file}${rank}`) {
                        square.classList.add('last-move');
                    }
                }
                this.boardElement.appendChild(square);
            });
        });
        
        this.updatePlayerLabels();
    }

    updatePlayerLabels() {
        const topEl = document.getElementById('player-top');
        const bottomEl = document.getElementById('player-bottom');
        if (!topEl || !bottomEl) return;

        const headers = this.game.header();
        const white = (headers.White && headers.White !== '?') ? headers.White : "Anonimo";
        const black = (headers.Black && headers.Black !== '?') ? headers.Black : "Anonimo";
        const result = headers.Result || "*";

        let whiteLabel = `⬜ ${white}`;
        let blackLabel = `⬛ ${black}`;

        if (result === '1-0') whiteLabel += ' <span class="trophy">🏆</span>';
        if (result === '0-1') blackLabel += ' <span class="trophy">🏆</span>';

        if (this.isFlipped) {
            topEl.innerHTML = whiteLabel;
            bottomEl.innerHTML = blackLabel;
        } else {
            topEl.innerHTML = blackLabel;
            bottomEl.innerHTML = whiteLabel;
        }
    }

    handleSquareClick(square) {
        // Disable interaction during autoplay or full analysis
        if (this.isAutoPlaying || this.isAnalyzingFullGame) return;

        const piece = this.game.get(square);
        const turn = this.game.turn();

        // 1. Select piece of the current turn
        if (piece && piece.color === turn) {
            this.selectedSquare = (this.selectedSquare === square) ? null : square;
            this.renderBoard();
            return;
        }

        // 2. Try to execute a move
        if (this.selectedSquare) {
            try {
                const move = this.game.move({
                    from: this.selectedSquare,
                    to: square,
                    promotion: 'q' // Always promote to queen for simplicity in this trainer
                });

                if (move) {
                    this.selectedSquare = null;
                    
                    // Update the UI and internal state
                    this.history = this.game.history({ verbose: true });
                    this.currentIndex = this.history.length - 1;
                    
                    // Update PGN textarea (adding * if no result)
                    let pgn = this.game.pgn();
                    if (!pgn.includes('1-0') && !pgn.includes('0-1') && !pgn.includes('1/2-1/2')) {
                        if (!pgn.endsWith('*')) pgn += ' *';
                    }
                    this.pgnInput.value = pgn;
                    
                    // Refresh view
                    this.renderMovesList();
                    this.renderBoard();
                    this.updateActiveMove();
                } else {
                    this.selectedSquare = null;
                    this.renderBoard();
                }
            } catch (err) {
                this.selectedSquare = null;
                this.renderBoard();
            }
        }
    }

    flipBoard() { this.isFlipped = !this.isFlipped; this.renderBoard(); }

    // ─── MOVES LIST ───────────────────────────────────────────────────────────

    toSpanishSAN(san) {
        const map = { 'K': 'R', 'Q': 'D', 'R': 'T', 'B': 'A', 'N': 'C' };
        return san.replace(/[KQRBN]/g, m => map[m]);
    }

    renderMovesList() {
        this.movesListElement.innerHTML = '';
        for (let i = 0; i < this.history.length; i += 2) {
            const num = Math.floor(i / 2) + 1;
            const numEl = document.createElement('div');
            numEl.className = 'move-number';
            numEl.innerText = `${num}.`;
            this.movesListElement.appendChild(numEl);

            const whiteEl = document.createElement('div');
            whiteEl.className = 'move-item';
            whiteEl.innerText = this.toSpanishSAN(this.history[i].san);
            whiteEl.onclick = () => this.goToMove(i);
            this.movesListElement.appendChild(whiteEl);

            const blackMove = this.history[i + 1];
            const blackEl = document.createElement('div');
            if (blackMove) {
                blackEl.className = 'move-item';
                blackEl.innerText = this.toSpanishSAN(blackMove.san);
                blackEl.onclick = () => this.goToMove(i + 1);
            }
            this.movesListElement.appendChild(blackEl);
        }
    }

    updateActiveMove() {
        const moveEls = this.movesListElement.querySelectorAll('.move-item');
        moveEls.forEach((el, i) => el.classList.toggle('active', i === this.currentIndex));
    }

    // ─── AUTOPLAY ────────────────────────────────────────────────────────────

    toggleAutoPlay(cancelSpeech = true) {
        this.isAutoPlaying = !this.isAutoPlaying;
        const btn = document.getElementById('btn-autoplay');
        if (this.isAutoPlaying) {
            // Guard: don't start autoplay if there's no loaded game
            if (this.history.length === 0) {
                this.isAutoPlaying = false;
                this.say('Carga una partida primero para usar el modo automático.', 'NEUTRAL', false);
                return;
            }
            btn.innerText = '⏸ Stop';
            btn.classList.add('pulse');
            
            // Enable full analysis collection so we can show accuracy at the end
            this.isAnalyzingFullGame = true;
            if (!this.analysisResults || this.analysisResults.length === 0) {
                this.analysisResults = [0]; 
            }            
            // If we're already at the end, restart from beginning
            const nextIndex = this.currentIndex >= this.history.length - 1
                ? 0
                : this.currentIndex + 1;
            this.goToMove(nextIndex);
        } else {
            btn.innerText = '▶ Auto';
            btn.classList.remove('pulse');
            clearTimeout(this.autoPlayTimeout);
            // Only cancel speech if explicitly requested (e.g. manual stop)
            // This allows blunder explanations to finish even if autoplay pauses for the prompt
            if (cancelSpeech === true && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        }
    }

    nextAutoStep() {
        if (!this.isAutoPlaying) return;
        if (this.currentIndex >= this.history.length - 1) {
            this.toggleAutoPlay();
            this.calculateAccuracy(); // Show percentage report when analysis finishes
            return;
        }
        this.goToMove(this.currentIndex + 1);
    }

    // ─── ACCURACY ────────────────────────────────────────────────────────────

    calculateAccuracy() {
        let whiteLosses = [], blackLosses = [];
        for (let i = 1; i < this.analysisResults.length; i++) {
            const prev = this.analysisResults[i - 1];
            const curr = this.analysisResults[i];
            const side = this.history[i - 1]?.color;
            // Cap loss at 500cp to avoid blunders skewing the whole result
            const loss = Math.min(500, Math.max(0, side === 'w' ? (prev - curr) : (curr - prev)));
            if (side === 'w') whiteLosses.push(loss);
            else blackLosses.push(loss);
        }
        const avgW = whiteLosses.length ? whiteLosses.reduce((a, b) => a + b, 0) / whiteLosses.length : 0;
        const avgB = blackLosses.length ? blackLosses.reduce((a, b) => a + b, 0) / blackLosses.length : 0;
        const accWhite = Math.max(0, Math.min(100, 100 - (avgW / 5)));
        const accBlack = Math.max(0, Math.min(100, 100 - (avgB / 5)));

        document.getElementById('acc-white').innerText = `⬜ ${accWhite.toFixed(1)}%`;
        document.getElementById('acc-black').innerText = `⬛ ${accBlack.toFixed(1)}%`;
        this.accuracyReport.style.display = 'block';

        const finalComment = this.personality.getFinalCommentary(accWhite, accBlack, this.history.length);
        // Final report always speaks (auto-play just ended)
        this.say(`Análisis completo. Blancas: ${accWhite.toFixed(1)}% | Negras: ${accBlack.toFixed(1)}%. ${finalComment}`, "HAPPY", true);
    }

    // ─── SAY ─────────────────────────────────────────────────────────────────
    // speak=true → use TTS (only during auto-play or critical moments)
    // speak=false → update text silently (manual navigation)

    say(text, mood = 'NEUTRAL', speak = false) {
        const bubble = document.querySelector('.speech-bubble');
        const avatar = document.querySelector('.avatar-container');
        
        const updateUI = () => {
            this.whispererText.innerText = text;
            bubble.classList.remove('pulse');
            void bubble.offsetWidth;
            bubble.classList.add('pulse');
        };

        clearTimeout(this.autoPlayTimeout);
        
        if (speak && window.speechSynthesis) {
            const autoState = this.isAutoPlaying;
            this.personality.speak(text, 
                () => { // onEnd
                    if (avatar) avatar.classList.remove('talking');
                    if (autoState && this.isAutoPlaying) {
                        this.nextAutoStep();
                    }
                },
                () => { // onStart
                    updateUI();
                    if (avatar) avatar.classList.add('talking');
                }
            );
        } else {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            updateUI();
            if (avatar) avatar.classList.remove('talking');
            if (this.isAutoPlaying) {
                const waitTime = Math.max(1500, text.length * 40);
                this.autoPlayTimeout = setTimeout(() => this.nextAutoStep(), waitTime);
            }
        }
    }

    exportPgn() {
        if (this.history.length === 0) {
            this.say("No hay jugadas para exportar.", "NEUTRAL", false);
            return;
        }
        
        const modal = document.getElementById('export-modal');
        const btnSave = document.getElementById('modal-save');
        const btnCancel = document.getElementById('modal-cancel');
        
        modal.style.display = 'flex';
        
        // Reset inputs to current game state
        const headers = this.game.header();
        document.getElementById('meta-white').value = headers.White && headers.White !== '?' ? headers.White : "";
        document.getElementById('meta-black').value = headers.Black && headers.Black !== '?' ? headers.Black : "";
        document.getElementById('meta-result').value = headers.Result || "*";
        document.getElementById('meta-round').value = headers.Round && headers.Round !== '?' ? headers.Round : "";

        const saveHandler = () => {
            const white = document.getElementById('meta-white').value || "Anonimo";
            const black = document.getElementById('meta-black').value || "Anonimo";
            const result = document.getElementById('meta-result').value || "*";
            const round = document.getElementById('meta-round').value || "?";
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

            // Set headers in chess.js
            this.game.header(
                'Event', 'Estudio Ordo Magnus',
                'Site', 'Academia Ordo Magnus',
                'Date', date,
                'White', white,
                'Black', black,
                'Result', result,
                'Round', round
            );

            const pgn = this.game.pgn();
            const blob = new Blob([pgn], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Add unique timestamp to filename
            const ts = new Date().getTime().toString().slice(-4);
            a.download = `Estudio_OrdoMagnus_${date}_${ts}.pgn`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            modal.style.display = 'none';
            this.renderBoard(); // Refresh labels with new names/trophies
            this.say("Partida exportada correctamente.", "HAPPY", false);
            cleanup();
        };

        const cancelHandler = () => {
            modal.style.display = 'none';
            cleanup();
        };

        const cleanup = () => {
            btnSave.removeEventListener('click', saveHandler);
            btnCancel.removeEventListener('click', cancelHandler);
        };

        btnSave.addEventListener('click', saveHandler);
        btnCancel.addEventListener('click', cancelHandler);
    }
}

window.addEventListener('load', () => { new GrandmasterWhisperer(); });
