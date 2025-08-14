import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { v6 as uuidv6 } from "uuid";

const wss = new WebSocketServer({ port: 3001, clientTracking: true }); // TODO: Unhardcode

let currentGames = [];

const httpServer = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  const gameId = uuidv6();
  currentGames.push(gameId);
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
    if (!currentGames.includes(gameId)) {
      console.error("Game not found");
      ws.send("Error: Game not found");
      return;
    }

    wss.clients.forEach((socket) => socket.send(`Moved ${move} in ${gameId}`));
  });
});

httpServer.listen(3000); // TODO: Unhardcode
