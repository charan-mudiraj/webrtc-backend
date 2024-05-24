import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let senderSocket: null | WebSocket = null;
let receiverSocket: null | WebSocket = null;
enum MessageType {
  Sender = "sender",
  Receiver = "receiver",
  CreateOffer = "createOffer",
  CreateAnswer = "createAnswer",
  IceCandidate = "iceCandidate",
}
type Message = {
  type: MessageType;
  sdp: any;
  candidate: any;
};

//  WS Connection => Message => [ ( Sender WS Connection => Create Offer ) || ( Receiver WS Connection => Create Answer) || ( Ice Candidate => Send "candidate" ) ]

function message(data: any, ws: WebSocket) {
  const message: Message = JSON.parse(data);

  switch (message.type) {
    case MessageType.Sender:
      senderSocket = ws;
      break;
    case MessageType.Receiver:
      receiverSocket = ws;
      break;
    case MessageType.CreateOffer:
      if (ws !== senderSocket) return;
      receiverSocket?.send(
        JSON.stringify({ type: MessageType.CreateOffer, sdp: message.sdp })
      );
      break;
    case MessageType.CreateAnswer:
      if (ws !== receiverSocket) return;
      senderSocket?.send(
        JSON.stringify({ type: MessageType.CreateAnswer, sdp: message.sdp })
      );
      break;
    case MessageType.IceCandidate:
      if (ws === senderSocket) {
        receiverSocket?.send(
          JSON.stringify({
            type: MessageType.IceCandidate,
            candidate: message.candidate,
          })
        );
      } else if (ws === receiverSocket) {
        senderSocket?.send(
          JSON.stringify({
            type: MessageType.IceCandidate,
            candidate: message.sdp,
          })
        );
      }
      break;
  }
}

function connection(ws: WebSocket) {
  ws.on("error", console.error);

  ws.on("message", (data: any) => {
    message(data, ws);
    console.log("Got a message");
  });

  ws.on("close", () => {
    senderSocket = null;
    receiverSocket = null;
    console.log("Connection closed");
  });
}

wss.on("connection", (ws) => {
  connection(ws);
  console.log("Got a connection request");
});
