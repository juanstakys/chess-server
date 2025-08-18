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
    this.white = Math.random() > 0.5; // Determines if white is the 0th o 1st player in .players
    this.turn = this.white;
  }
}

const wss = new WebSocketServer({
  port: 3001,
  clientTracking: true,
}); // TODO: Unhardcode

let currentGames = new Map();

const httpServer = createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Access-Control-Allow-Origin": "http://localhost:5173",
  });
  const gameId = uuidv6();
  const game = new Game(gameId);
  currentGames.set(gameId, game);
  console.log("Created game ID: " + gameId);
  res.end(gameId);
});

wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("message", (data) => {
    console.log("Received:");
    console.log(data.toString("utf-8"));
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
      const playerColor =
        game.players.indexOf(ws) == game.white ? "white" : "black";
      ws.send(playerColor);
      console.log(`Player joined as ${playerColor}`);
    }
    if (command === "move" && game.players.includes(ws)) {
      if (game.turn != game.players.indexOf(ws)) {
        console.error("Not your turn");
        console.log("game.turn:", game.turn);
        console.log("game.white:", game.white);
        console.log("game.players.indexOf(ws):", game.players.indexOf(ws));
        ws.send("Error: Not your turn");
        return;
      }
      try {
        game.chess.move(move); // TODO: make this whole step atomic.
        const nextTurn = (game.turn + 1) % 2;
        game.turn = nextTurn;
        game.players[nextTurn].send(move);
        if (game.chess.isGameOver()) {
          console.log("Game over");
          game.players.forEach((player) => {
            player.send("Game over");
            player.close();
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  });
});

httpServer.listen(3000); // TODO: Unhardcode
