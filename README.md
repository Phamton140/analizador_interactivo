# Ordo Magnus - Analizador Pedagógico de Ajedrez

**Ordo Magnus** es una aplicación web avanzada para el análisis automatizado de partidas de ajedrez. Diseñado como una herramienta pedagógica de alto nivel, no solo evalúa los movimientos, sino que actúa como un mentor interactivo (el *Grandmaster Whisperer*). Proporciona retroalimentación de voz en tiempo real, reconoce aperturas sin depender de etiquetas PGN, y alerta al jugador visual y oralmente cuando desaprovecha oportunidades críticas, mostrando animaciones de las mejores variantes en el propio tablero.

---

## 🚀 Características Principales

* **Análisis Total de la Partida:** Carga un archivo PGN o introduce tus movimientos. El sistema evalúa instantáneamente toda la partida y genera un reporte de precisión (basado en la pérdida de centipeones).
* **Carga de PGN Ultra-Resiliente:** Incorpora un motor de **Reconstrucción Manual de Jugadas** capaz de procesar archivos PGN complejos provenientes de plataformas como **Chess.com y Lichess**, incluso si contienen etiquetas no estándar o errores de formato que otros analizadores rechazarían.
* **Identidad Visual Persistente:** Etiquetas de jugadores minimalistas y transparentes integradas directamente en el tablero. El sistema gestiona identidades de forma persistente, manteniendo los nombres reales y los **trofeos de victoria (con resplandor dorado)** visibles incluso durante los intensos ciclos de re-análisis del motor.
* **Diccionario de Aperturas Offline Dinámico:** Reconoce decenas de aperturas y variantes (Ej: Defensa Siciliana, Variante Najdorf) mediante un árbol de prefijos exhaustivo integrado, sin requerir metadata de plataformas externas.
* **Alertas Pedagógicas Animadas:** Si el jugador se equivoca, el motor interrumpe sutilmente el flujo mediante un *overlay* difuminado. El análisis se enfoca específicamente en **explotar los errores del oponente**, animando las variantes ganadoras. Tras 3 segundos de reflexión, el análisis automático se reanuda por sí solo.
* **Gestión de Metadatos en Tiempo Real:** Modal de exportación PGN mejorado que permite editar Evento, Sitio, Ronda y Resultado, reflejando cualquier cambio (incluyendo el ganador del trofeo) instantáneamente en la interfaz del tablero.
* **Retroalimentación Auditiva Avanzada:** Integración con la `Web Speech API` para locutar comentarios humanos y narrar movimientos con notación algebraica en español ("Caballo por de cuatro").

---

## 🛠️ Tecnologías Utilizadas

El proyecto fue construido priorizando rendimiento, ejecución local (cliente puro) y compatibilidad.

* **HTML5 / CSS3 Vanilla:** Maquetación moderna basada en CSS Grid/Flexbox y variables nativas para un control de temas y *glassmorphism* eficiente.
* **JavaScript (ES6 Modules):** Arquitectura limpia orientada a objetos (separación de la lógica de interfaz, motor de ajedrez, y el módulo de personalidad "Whisperer").
* **[chess.js](https://github.com/jhlywa/chess.js):** Librería subyacente para la validación estricta de movimientos legales y control de turnos.
* **[Stockfish.js](https://github.com/nmrugg/stockfish.js/) (WebAssembly):** Motor de ajedrez en WASM corriendo en un *Web Worker* secundario para un análisis de alto rendimiento sin bloqueos de interfaz.
* **Web Speech API:** Interfaz nativa del navegador para la síntesis de voz interactiva.
* **Vite:** Entorno de desarrollo y construcción ligero y ultrarrápido.

---

## 📦 Instalación y Ejecución Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Phamton140/analizador_interactivo.git
   cd analizador_interactivo
   ```
2. Instala las dependencias (Vite):
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
4. Abre la dirección proporcionada por Vite (usualmente `http://localhost:5173/`) en tu navegador.

---

## 🔧 Detalles Técnicos (Engine Management)

Para asegurar la estabilidad del hilo de WebAssembly (`stockfish.wasm`), la aplicación maneja una estricta orquestación de comandos UCI. El sistema de carga resiliente asegura que la metadata de los jugadores (`White`, `Black`, `Result`) se preserve en una memoria de reserva interna, permitiendo que la interfaz se mantenga informativa y coherente incluso cuando el motor interno se reinicia para evaluar nuevas posiciones.

---
*Diseñado con el propósito de revolucionar la enseñanza interactiva y fluida en el ajedrez moderno.*
