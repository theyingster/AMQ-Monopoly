// ==UserScript==
// @name         AMQ Monopoly Scoring
// @namespace    https://github.com/theyingster
// @version      0.1
// @description  Scoreboard for AMQ Monopoly
// @author       theyingster
// @match        https://animemusicquiz.com/*
// @grant        none
// ==/UserScript==

if (!window.setupDocumentDone) return;

let command = "/Point";
let create = "/Scoreboard";
let help = "/Help";
let winningScore = 0;
let players = [];
let scores = [];
let round = 0;

// listener for commands in chat
let commandListener = new Listener("Game Chat Message", (payload) => {
    if (payload.sender === selfName && payload.message.startsWith(command)) {

        // give the winner of the round a point
        for (let playerId in lobby.players) {
            players.push(lobby.players[playerId]._name);
        }
        let message = payload.message.split(" ");
        updateScore(message[1]);
        players = [];
    }
    else if (payload.sender === selfName && payload.message.startsWith("/ResetScore")) {
        resetScore();
    }
    else if (payload.sender === selfName && payload.message.startsWith(create)) {
        sendChatMessage("Creating Scoreboard...");
        for (let playerId in lobby.players) {
            scores.push(0);
        }
        sendChatMessage("Done!");
    }
    else if (payload.sender === selfName && payload.message.startsWith(help)) {
        sendChatMessage("1. /Point 'player' = give 'player' a point");
        sendChatMessage("2. /ResetScore = reset the scoreboard");
        sendChatMessage("3. /Scoreboard = create scoreboard before game starts");
        sendChatMessage("4. /SetWinningScore 'number' = sets 'number' as the points needed to win");
    }
    else if (payload.sender === selfName && payload.message.startsWith("/SetWinningScore")) {
        let message = payload.message.split(" ");
        winningScore = parseInt(message[1]);
        sendChatMessage("Winning score has been set to " + winningScore + ".");
    }
});

function updateScore(player){
    let index = players.indexOf(player);
    scores[index]++;
    round++;
    displayScore();
    let winner = scores.indexOf(winningScore);
    if (winner >= 0){
        sendChatMessage("Congrats! Player " + players[winner] + " has won!");
    }
}

function displayScore(){
    sendChatMessage("Current Standings (Round " + round + "):");
    for (let i = 0; i < players.length; i++) {
        sendChatMessage("@" + players[i] + ": " + scores[i] + " pts");
    }
}

function resetScore(){
    sendChatMessage("Resetting scores...");
    for (let i = 0; i < scores.length; i++){
        scores[i] = 0;
    }
    sendChatMessage("Scores have been reset.");
}

function sendChatMessage(message) {
    gameChat.$chatInputField.val(message);
    gameChat.sendMessage();
}

commandListener.bindListener();