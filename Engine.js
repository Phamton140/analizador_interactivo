export class StockfishEngine {
    constructor() {
        // Use absolute path for Vite public directory
        this.worker = new Worker('/stockfish.js');
        this.onInfo = null;
        this.onBestMove = null;
        this.onReady = null;
        this.isReady = false;
        
        this.worker.onmessage = (e) => {
            const line = e.data;
            if (line === 'uciok') {
                this.sendCommand('isready');
            } else if (line === 'readyok') {
                this.isReady = true;
                if (this.onReady) this.onReady();
            } else if (line.startsWith('info ')) {
                if (this.onInfo) this.onInfo(line);
            } else if (line.startsWith('bestmove ')) {
                if (this.onBestMove) this.onBestMove(line);
            }
        };

        this.sendCommand('uci');
    }

    sendCommand(cmd) {
        this.worker.postMessage(cmd);
    }

    analyzePosition(fen, depth = 10) {
        this.sendCommand(`position fen ${fen}`);
        this.sendCommand(`go depth ${depth}`);
    }

    stop() {
        this.sendCommand('stop');
    }
}
