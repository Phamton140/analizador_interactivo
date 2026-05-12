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
        this.hintBtn = document.getElementById('btn-show-hint');
        this.bestMoveHint = document.createElement('div'); // In-memory hint holder
        this.evalFill = document.getElementById('eval-fill');

        this.history = [];
        this.currentIndex = -1;
        this.isFlipped = false;
        this.isAutoPlaying = false;
        this.autoPlayTimeout = null;
        this.isAnalyzingFullGame = false;
        this.analysisResults = [];
        this.currentEval = 0;
        this.currentBestMove = null;
        this.allGames = [];

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
        document.getElementById('pgn-input').addEventListener('input', () => this.processInput());
        document.getElementById('game-select').addEventListener('change', (e) => this.loadGame(parseInt(e.target.value)));
        
        document.getElementById('perspective-white').addEventListener('click', () => this.setPerspective('w'));
        document.getElementById('perspective-black').addEventListener('click', () => this.setPerspective('b'));
        this.hintBtn.addEventListener('click', () => this.showHint());
    }

    initEngine() {
        this.engine.onReady = () => {
            this.engineStatus.innerText = "Motor: Listo";
            this.engineStatus.style.color = "#10b981";
        };
        this.engine.onInfo = (msg) => this.handleEngineInfo(msg);
        this.engine.onBestMove = (msg) => this.handleBestMove(msg);
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            this.pgnInput.value = event.target.result;
            this.processInput();
        };
        reader.readAsText(file);
    }

    translatePgnToEnglish(pgn) {
        // Translation map: ES -> EN
        // R -> K (Rey), D -> Q (Dama), T -> R (Torre), A -> B (Alfil), C -> N (Caballo)
        const lines = pgn.split('\n');
        return lines.map(line => {
            if (line.trim().startsWith('[')) return line;
            return line
                .replace(/R(?=[a-h|x|0-9])/g, 'K')
                .replace(/D(?=[a-h|x|0-9])/g, 'Q')
                .replace(/T(?=[a-h|x|0-9])/g, 'R')
                .replace(/A(?=[a-h|x|0-9])/g, 'B')
                .replace(/C(?=[a-h|x|0-9])/g, 'N');
        }).join('\n');
    }

    processInput() {
        let content = this.pgnInput.value.trim();
        if (!content) {
            this.resetBoard();
            return;
        }
        
        const isStandard = content.includes('[Event ');

        if (!isStandard) {
            // Trigger only if ends with *
            if (!content.endsWith('*')) return;
            
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
            content = this.translatePgnToEnglish(content);
        }
        
        const games = content.split(/\[Event /).filter(g => g.trim() !== "").map(g => "[Event " + g);
        this.allGames = games;
        
        if (games.length > 0) {
            if (games.length > 1) this.showGameSelector(games);
            else this.gameSelectorContainer.style.display = 'none';
            this.loadGame(0);
        }
    }

    resetBoard() {
        this.isAnalyzingFullGame = false;
        this.engine.stop();
        this.game = new Chess();
        this.history = [];
        this.currentIndex = -1;
        this.allGames = [];
        this.analysisResults = [];
        this.renderBoard();
        this.renderMovesList();
        this.updateEvalBar(0);
        this.bestMoveHint.innerText = '';
        this.accuracyReport.style.display = 'none';
        this.gameSelectorContainer.style.display = 'none';
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        this.whispererText.innerText = "¡Listo para una nueva partida! Pega tu PGN o escribe las jugadas.";
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
        pgn = this.translatePgnToEnglish(pgn);
        try {
            this.game.loadPgn(pgn);
            this.history = this.game.history({ verbose: true });
            this.renderMovesList();
            this.accuracyReport.style.display = 'none';
            this.startFullAnalysis();
        } catch (e) {
            this.say("¡Vaya! Hubo un error al leer esta partida.");
        }
    }

    setPerspective(side) {
        this.personality.setAnalysisSide(side);
        document.getElementById('perspective-white').classList.toggle('active', side === 'w');
        document.getElementById('perspective-black').classList.toggle('active', side === 'b');
        this.say(`Analizando como ${side === 'w' ? 'Blancas' : 'Negras'}.`);
    }

    startFullAnalysis() {
        this.isAnalyzingFullGame = true;
        this.analysisResults = [0];
        this.currentIndex = -1;
        this.say("Iniciando análisis profundo...", "HAPPY");
        this.analyzeNextMoveInGame();
    }

    analyzeNextMoveInGame() {
        if (!this.isAnalyzingFullGame) return;
        if (this.currentIndex >= this.history.length - 1) {
            this.isAnalyzingFullGame = false;
            this.calculateAccuracy();
            this.goToMove(0);
            return;
        }
        this.currentIndex++;
        this.game.reset();
        for (let i = 0; i <= this.currentIndex; i++) {
            this.game.move(this.history[i].san);
        }
        this.renderBoard();
        this.updateActiveMove();
        this.engine.analyzePosition(this.game.fen(), 8);
    }

    calculateAccuracy() {
        let whiteLosses = [];
        let blackLosses = [];
        for (let i = 1; i < this.analysisResults.length; i++) {
            const prev = this.analysisResults[i-1];
            const curr = this.analysisResults[i];
            const side = this.history[i-1].color;
            const loss = side === 'w' ? (prev - curr) : (curr - prev);
            if (side === 'w') whiteLosses.push(Math.max(0, loss));
            else blackLosses.push(Math.max(0, loss));
        }
        const avgW = whiteLosses.length ? whiteLosses.reduce((a,b)=>a+b,0)/whiteLosses.length : 0;
        const avgB = blackLosses.length ? blackLosses.reduce((a,b)=>a+b,0)/blackLosses.length : 0;
        const accWhite = Math.max(0, Math.min(100, 100 - (avgW / 2)));
        const accBlack = Math.max(0, Math.min(100, 100 - (avgB / 2)));

        document.getElementById('acc-white').innerText = `${accWhite.toFixed(1)}%`;
        document.getElementById('acc-black').innerText = `${accBlack.toFixed(1)}%`;
        this.accuracyReport.style.display = 'block';

        const finalComment = this.personality.getFinalCommentary(accWhite, accBlack, this.history.length);
        this.say(`¡Análisis completo! Blancas: ${accWhite.toFixed(1)}%, Negras: ${accBlack.toFixed(1)}%. ${finalComment}`, "HAPPY");
    }

    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
        const btn = document.getElementById('btn-autoplay');
        if (this.isAutoPlaying) {
            btn.innerText = '⏸ Stop';
            btn.classList.add('pulse');
            this.nextAutoStep();
        } else {
            btn.innerText = '▶ Auto';
            btn.classList.remove('pulse');
            clearTimeout(this.autoPlayTimeout);
        }
    }

    nextAutoStep() {
        if (!this.isAutoPlaying) return;
        if (this.currentIndex >= this.history.length - 1) {
            this.toggleAutoPlay();
            return;
        }
        this.goToMove(this.currentIndex + 1);
    }

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
            
            const whiteMove = this.history[i];
            const whiteEl = document.createElement('div');
            whiteEl.className = 'move-item';
            whiteEl.innerText = this.toSpanishSAN(whiteMove.san);
            whiteEl.onclick = () => this.goToMove(i);
            this.movesListElement.appendChild(whiteEl);
            
            const blackMove = this.history[i + 1];
            if (blackMove) {
                const blackEl = document.createElement('div');
                blackEl.className = 'move-item';
                blackEl.innerText = this.toSpanishSAN(blackMove.san);
                blackEl.onclick = () => this.goToMove(i + 1);
                this.movesListElement.appendChild(blackEl);
            } else {
                this.movesListElement.appendChild(document.createElement('div'));
            }
        }
    }

    flipBoard() {
        this.isFlipped = !this.isFlipped;
        this.renderBoard();
    }

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
                if (this.currentIndex >= 0) {
                    const lastMove = this.history[this.currentIndex];
                    if (lastMove.from === `${file}${rank}` || lastMove.to === `${file}${rank}`) {
                        square.classList.add('last-move');
                    }
                }
                this.boardElement.appendChild(square);
            });
        });
    }

    handleEngineInfo(msg) {
        const cpMatch = msg.match(/score cp (-?\d+)/);
        const mateMatch = msg.match(/score mate (-?\d+)/);
        let score = 0;
        if (cpMatch) {
            const cp = parseInt(cpMatch[1]);
            score = this.game.turn() === 'w' ? cp : -cp;
        } else if (mateMatch) {
            const mateIn = parseInt(mateMatch[1]);
            score = (this.game.turn() === 'w' ? 1 : -1) * (mateIn > 0 ? 10000 : -10000);
        }
        this.currentEval = score;
        this.updateEvalBar(score);
        const pvMatch = msg.match(/ pv (.*)/);
        if (pvMatch) this.currentBestMove = pvMatch[1].split(' ')[0];
    }

    updateEvalBar(cp) {
        const evalValueEl = document.getElementById('eval-value');
        let displayScore = (cp / 100).toFixed(1);
        if (cp > 1000) displayScore = "M" + Math.round((10000 - cp) / 100);
        if (cp < -1000) displayScore = "-M" + Math.round((10000 + cp) / 100);
        evalValueEl.innerText = (cp > 0 ? "+" : "") + displayScore;
        let percent = 50 + (cp / 20);
        percent = Math.max(5, Math.min(95, percent));
        this.evalFill.style.height = `${percent}%`;
        if (cp > 100) this.evalFill.style.background = 'white';
        else if (cp < -100) this.evalFill.style.background = '#333';
        else this.evalFill.style.background = 'linear-gradient(to top, #333, white)';
    }

    handleBestMove(msg) {
        if (this.currentIndex < 0) return;
        
        if (this.isAnalyzingFullGame) {
            if (!this.isAnalyzingFullGame) return;
            this.analysisResults[this.currentIndex + 1] = this.currentEval;
            if (this.currentIndex >= 0) {
                const prevEval = this.analysisResults[this.currentIndex];
                const actualMove = this.history[this.currentIndex];
                if (actualMove) {
                    const side = actualMove.color;
                    const diff = side === 'w' ? (prevEval - this.currentEval) : (this.currentEval - prevEval);
                    if (diff > 250) {
                        this.say(`¡Atención! Error grave en la jugada ${this.currentIndex + 1}.`, "SURPRISED");
                    } else if ((this.currentIndex + 1) % 5 === 0) {
                        this.whispererText.innerText = `Analizando profundamente... voy por la jugada ${this.currentIndex + 1}.`;
                    }
                }
            }
            this.analyzeNextMoveInGame();
            return;
        }

        const actualMove = this.history[this.currentIndex];
        if (!actualMove) return;
        
        const side = actualMove.color;
        const prevEval = this.analysisResults[this.currentIndex] || 0;
        const diff = side === 'w' ? (prevEval - this.currentEval) : (this.currentEval - prevEval);
        const isOpening = this.currentIndex < 12;
        const analysis = this.personality.analyzeMove(diff, side, isOpening, this.history.slice(0, this.currentIndex + 1));
        const msgText = this.personality.getMessage(analysis.category, analysis.isOpponent, analysis.openingName);
        this.say(msgText, analysis.mood);

        if (analysis.category === 'BLUNDER' || analysis.category === 'INACCURACY') {
            this.hintBtn.style.display = 'block';
        }

        if (this.isAutoPlaying) {
            const delay = (analysis.category === 'BLUNDER' || analysis.category === 'INACCURACY') ? 6000 : 1500;
            this.autoPlayTimeout = setTimeout(() => this.nextAutoStep(), delay);
        }
    }

    goToMove(index) {
        if (index < -1 || index >= this.history.length) return;
        if (this.isAnalyzingFullGame) {
            this.isAnalyzingFullGame = false;
            this.say("Análisis interrumpido. Sigamos con esta posición.", "NEUTRAL");
        }
        this.currentIndex = index;
        this.game.reset();
        for (let i = 0; i <= index; i++) {
            this.game.move(this.history[i].san);
        }
        this.renderBoard();
        this.updateActiveMove();
        this.hintBtn.style.display = 'none';
        this.engine.stop();
        this.engine.analyzePosition(this.game.fen());
    }

    updateActiveMove() {
        const moveEls = this.movesListElement.querySelectorAll('.move-item');
        moveEls.forEach((el, i) => el.classList.toggle('active', i === this.currentIndex));
    }

    showHint() {
        if (!this.currentBestMove) return;
        const from = this.currentBestMove.substring(0, 2);
        const to = this.currentBestMove.substring(2, 4);
        const squares = this.boardElement.querySelectorAll('.square');
        squares.forEach(sq => {
            if (sq.dataset.square === from) sq.classList.add('hint-from');
            if (sq.dataset.square === to) sq.classList.add('hint-to');
        });
    }

    say(text, mood = 'NEUTRAL') {
        this.whispererText.innerText = text;
        const bubble = document.querySelector('.speech-bubble');
        bubble.classList.remove('pulse');
        void bubble.offsetWidth;
        bubble.classList.add('pulse');
        this.personality.speak(text);
    }
}

window.addEventListener('load', () => {
    new GrandmasterWhisperer();
});
