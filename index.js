import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { Chess } from "chess.js";
import { v6 as uuidv6 } from "uuid";

class Game {
  constructor(id) {
    this.id = id;
    this.chess = new Chess();
    this.hasStarted = false;
  }
}

const wss = new WebSocketServer({ port: 3001, clientTracking: true }); // TODO: Unhardcode

let currentGames = new Map();

const httpServer = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  const gameId = uuidv6();
  const game = new Game(gameId);
  currentGames.set(gameId, game);
  res.end(gameId);
});

wss.on("connection", (ws) => {
  ws.on("error", console.error);

  // console.log(wss.clients); // TODO: Make max clients 2

  ws.on("message", (data) => {
    const [gameId, move] = data.toString("utf-8").split(" ");
    if (!gameId || !move) {
      console.error("Invalid message format");
      ws.send("Error: Invalid message format");
      return;
    }
    if (!currentGames.has(gameId)) {
      console.error("Game not found");
      ws.send("Error: Game not found");
      return;
    }

    wss.clients.forEach((socket) => socket.send(`Moved ${move} in ${gameId}`));
  });
});

httpServer.listen(3000); // TODO: Unhardcode
