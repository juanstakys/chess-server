import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { Chess } from "chess.js";
import { humanId } from "human-id";
// TODO: Implement automated testing

class Game {
  constructor(id, color) {
    console.log("Creating game with P1 being", color);
    this.id = id;
    this.chess = new Chess();
    this.hasStarted = false;
    this.players = [];
    switch (
      color // Determines the index of the white player in .players
    ) {
      case "white":
        this.white = 0;
        break;
      case "black":
        this.white = 1;
        break;
      default:
        this.white = Math.random() > 0.5;
    }
    this.turn = this.white;
  }
}

const wss = new WebSocketServer({
  port: 3001,
  clientTracking: true,
  host: "0.0.0.0", // TODO: secure
}); // TODO: Unhardcode

let currentGames = new Map();

const httpServer = createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Access-Control-Allow-Origin": "*", // TODO: Implement CORS properly and securely
  });
  const gameId = humanId({
    separator: "-",
    capitalize: false,
  });
  const firstPlayerColor = req.url.substring(1);
  const game = new Game(gameId, firstPlayerColor);
  currentGames.set(gameId, game);
  console.log("Created game ID: " + gameId);
  res.end(gameId);
});

wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("message", (data) => {
    console.log("Received:");
    console.log(data.toString("utf-8"));
    const [gameId, command, move] = data.toString("utf-8").split(" "); // TODO: Generalize message parsing
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
        ws.send("Error: Not your turn");
        return;
      }
      if (game.players.length !== 2) {
        console.error("Waiting for second player to join");
        ws.send("Error: Waiting for second player to join");
        return;
      }
      if (!move) {
        console.error("No move specified");
        ws.send("Error: No move specified");
        return;
      }
      try {
        game.chess.move(move); // TODO: make this whole step atomic.
        const nextTurn = (game.turn + 1) % 2;
        game.turn = nextTurn;
        game.players[nextTurn].send(move);
        // DEBUG
        console.log(game.chess.ascii());
        if (game.chess.isGameOver()) {
          let message = game.chess.isStalemate()
            ? "Stalemate"
            : game.chess.isThreefoldRepetition()
              ? "Threefold Repetition"
              : game.chess.isCheckmate()
                ? `${game.chess.turn() == "w" ? "White" : "Black"} checkmated!`
                : "Draw";
          game.players.forEach((player) => {
            player.send("Game over: " + message);
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
