import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { Chess } from "chess.js";
import { v6 as uuidv6 } from "uuid";
// TODO: implement automated testing

class Game {
  constructor(id) {
    this.id = id;
    this.chess = new Chess();
    this.hasStarted = false;
    this.players = [];
  }
}

const wss = new WebSocketServer({ port: 3001, clientTracking: true }); // TODO: Unhardcode

let currentGames = new Map();

const httpServer = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  const gameId = uuidv6();
  const game = new Game(gameId);
  currentGames.set(gameId, game);
  console.log("Created game ID: " + gameId);
  res.end(gameId);
});

wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("message", (data) => {
    const [gameId, command, move] = data.toString("utf-8").split(" ");
    if (!gameId || !command) {
      console.error("Invalid message format");
      ws.send("Error: Invalid message format");
      return;
    }
    if (!currentGames.has(gameId)) {
      console.error("Game not found");
      ws.send("Error: Game not found");
      return;
    }
    const game = currentGames.get(gameId);

    if (command === "join" && game.players.length < 2) {
      game.players.push(ws);
    }
    if (command === "move" && game.players.includes(ws)) {
      // TODO: Avoid moves from players who are not in the game (Check if this method is proper)
      try {
        game.chess.move(move);
        game.players.forEach((socket) => socket.send(move));
      } catch (err) {
        console.error(err);
      }
    }

    console.log(game.id);
    console.log(game.chess.ascii());
  });
});

httpServer.listen(3000); // TODO: Unhardcode
