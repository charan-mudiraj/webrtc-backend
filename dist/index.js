"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let senderSocket = null;
let receiverSocket = null;
var MessageType;
(function (MessageType) {
    MessageType["Sender"] = "sender";
    MessageType["Receiver"] = "receiver";
    MessageType["CreateOffer"] = "createOffer";
    MessageType["CreateAnswer"] = "createAnswer";
    MessageType["IceCandidate"] = "iceCandidate";
})(MessageType || (MessageType = {}));
//  WS Connection => Message => [ ( Sender WS Connection => Create Offer ) || ( Receiver WS Connection => Create Answer) || ( Ice Candidate => Send "candidate" ) ]
function message(data, ws) {
    const message = JSON.parse(data);
    switch (message.type) {
        case MessageType.Sender:
            senderSocket = ws;
            break;
        case MessageType.Receiver:
            receiverSocket = ws;
            break;
        case MessageType.CreateOffer:
            if (ws !== senderSocket)
                return;
            receiverSocket === null || receiverSocket === void 0 ? void 0 : receiverSocket.send(JSON.stringify({ type: MessageType.CreateOffer, sdp: message.sdp }));
            break;
        case MessageType.CreateAnswer:
            if (ws !== receiverSocket)
                return;
            senderSocket === null || senderSocket === void 0 ? void 0 : senderSocket.send(JSON.stringify({ type: MessageType.CreateAnswer, sdp: message.sdp }));
            break;
        case MessageType.IceCandidate:
            if (ws === senderSocket) {
                receiverSocket === null || receiverSocket === void 0 ? void 0 : receiverSocket.send(JSON.stringify({
                    type: MessageType.IceCandidate,
                    candidate: message.candidate,
                }));
            }
            else if (ws === receiverSocket) {
                senderSocket === null || senderSocket === void 0 ? void 0 : senderSocket.send(JSON.stringify({
                    type: MessageType.IceCandidate,
                    candidate: message.sdp,
                }));
            }
            break;
    }
}
function connection(ws) {
    ws.on("error", console.error);
    ws.on("message", (data) => {
        message(data, ws);
        console.log("Got a message");
    });
}
wss.on("connection", (ws) => {
    connection(ws);
    console.log("Got a connection request");
});
