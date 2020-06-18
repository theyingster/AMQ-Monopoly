// ==UserScript==
// @name         AMQ Monopoly
// @namespace    https://github.com/theyingster
// @version      1.1.1
// @description  AMQ Monopoly
// @author       theyingster
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      none
// ==/UserScript==

if (!window.setupDocumentDone) return;

// Tile of the board
class Tile {
  constructor(own, desc) {
    this.owner = own;
    this.description = desc;
  }
}

//List.shift() removes first element
// Modifiers applied for r rounds left
class Condition {
    constructor(mod,r){
        this.modifier = mod;
        this.rounds = r;
    }
}

let command = "/Dice";
let diceResult;
let maxRoll = 6;
let current = 0;
let lives = 1;
let board = [];
board.push(new Tile("","Start Tile"));
board.push(new Tile("","Female Protagonist"));
board.push(new Tile("","Gacha: Bang Dream!"));
board.push(new Tile("","Female Protagonist"));
board.push(new Tile("","NTR"));
board.push(new Tile("","Galaxy Express 999"));
board.push(new Tile("","Magic"));
board.push(new Tile("","Trap Card"));
board.push(new Tile("","Magic"));
board.push(new Tile("","Magic"));
board.push(new Tile("","Just Visiting"));
board.push(new Tile("","Idol"));
board.push(new Tile("","Ugly Bastard"));
board.push(new Tile("","Idol"));
board.push(new Tile("","Idol"));
board.push(new Tile("","Kotetsujou"));
board.push(new Tile("","Shounen"));
board.push(new Tile("","Gacha: Fate Grand Order"));
board.push(new Tile("","Shounen"));
board.push(new Tile("","Shounen"));
board.push(new Tile("","Kansei Durifto!?"));
board.push(new Tile("","CGDCT"));
board.push(new Tile("","ARTS (whatever the fuck that means)"));
board.push(new Tile("","CGDCT"));
board.push(new Tile("","CGDCT"));
board.push(new Tile("","APT-kun"));
board.push(new Tile("","Shoujo"));
board.push(new Tile("","Shoujo"));
board.push(new Tile("","Drugs"));
board.push(new Tile("","Shoujo"));
board.push(new Tile("","Go to Jail"));
board.push(new Tile("","School"));
board.push(new Tile("","School"));
board.push(new Tile("","Gacha: Granblue Fantasy"));
board.push(new Tile("","School"));
board.push(new Tile("","Flying Pussyfoot"));
board.push(new Tile("","Counter!"));
board.push(new Tile("","Male Protagonist"));
board.push(new Tile("","RAPE!!"));
board.push(new Tile("","Male Protagonist"));

// Gacha tiles
let gacha = [];
gacha.push("Song difficulty: 0-60");
gacha.push("Remove all tags");
gacha.push("Guess time: 30 seconds");
gacha.push("Time range: 2000-2020");
gacha.push("Song popularity: Liked");
gacha.push("Anime score: 7-10");

// Traps, ARTS, Counters tiles
let mystery = [];
mystery.push("Advance to GO (start tile)");
mystery.push("Advance to next train :train:");
mystery.push("Go to Jail :wave:");
mystery.push("Get out of Jail Free");
mystery.push("Go back 3 tiles");
mystery.push("Go to next bad tag :fearful:");

let tags = ["Shoujo","Shounen","Magic","Idol","Male Protagonist","Female Protagonist","School","CGDCT"];
let modifiers = [];


let commandListener = new Listener("Game Chat Message", (payload) => {
    if (payload.sender === selfName) {
        if (lobby.inLobby && payload.message.startsWith(command)) {
            // roll the dice
            roll();
        }
        else if (payload.message.startsWith("/Owner")) {
            //update tile owner
            sendChatMessage("Updating ownership...");
            let message = payload.message.split(" ");
            board[current].owner = message[1];
            sendChatMessage("Done! " + message[1] + " is now the owner of the current tile.");
        }
        else if (payload.message.startsWith("/NewGame")) {
            clearBoard();
        }
        else if (payload.message.startsWith("/Current")) {
            sendChatMessage("We are currently on tile " + current);
        }
        else if (payload.message.startsWith("/Add")) {
            // manually move to tiles for debugging
            let msg = payload.message.split(' ');
            current += msg[1];
        }
    }
});


// clear board after game is over
function clearBoard(){
    sendChatMessage("Clearing game board...");
    lives = 1;
    current = 0;
    modifiers = [];
    for (let i = 0; i < board.length; i++){
        board[i].owner = "";
    }
    sendChatMessage("Everything cleared! Ready for new game.");
}

// handles event triggered by moving onto the current tile
function tileEventHandler(current){
    let tile = board[current];
    sendChatMessage("Current tile: " + tile.description);
    let modifyMessage = "";

    if (current == 0 || tile.description.startsWith("Just Visiting")){
        sendChatMessage("Rolling again...");
        roll();
    }
    else if (tile.description.startsWith("Gacha")){
        sendChatMessage("Time for RNGesus :pray:");
        diceResult = getRandomIntInclusive(1, 6);
        handleGacha(diceResult);
        modifyMessage = gacha[diceResult-1];
    }
    else if (tile.description.startsWith("Trap") || tile.description.startsWith("ARTS")
            || tile.description.startsWith("Counter")){
        sendChatMessage("Time for RNGesus :pray:");
        diceResult = getRandomIntInclusive(1, 6);
        handleMystery(diceResult, tile);
    }
    else if (tile.description === "RAPE!!"){
        sendChatMessage("Yameteeeeee!!!");
        sendChatMessage("Rape settings: Quiz settings Randomized");
        modifyMessage = "Quiz settings Randomized";
    }
    else if (tile.description === "Ugly Bastard"){
        sendChatMessage("We can't escape Ugly Bastard.");
        sendChatMessage("Song Difficulty: 0-20");
        modifyMessage = "Song Difficulty: 0-20";
    }
    else if (tile.description === "Drugs"){
        sendChatMessage("Drugs are bad kids, don't do drugs.");
        sendChatMessage("Guess time: 10 seconds");
        modifyMessage = "Guess time: 10 seconds";
    }
    else if (tile.description === "NTR"){
        sendChatMessage("Everyone gets to choose a partner to coop with. First come, first served.");
        sendChatMessage("Choose your partner now!");
        modifyMessage = "Co-op with partner";
    }
    else if (tile.description === "APT-kun"){
        sendChatMessage("Since APT-kun is a training wagon and not meant to be commonly used");
        sendChatMessage("Show type: no TV");
        modifyMessage = "Show type: no TV";
    }
    else if (tile.description === "Flying Pussyfoot"){
        sendChatMessage("Baccano! characters are immortal");
        sendChatMessage("Everyone starts with 3 lives");
        modifyMessage = "Everyone starts with 3 lives";
        lives = 3;
    }
    else if (tile.description === "Galaxy Express 999"){
        sendChatMessage("\"Back in my days, anime wasn't only isekai trash\"");
        sendChatMessage("Year range: 1950-2000");
        modifyMessage = "Year range: 1950-2000";
    }
    else if (tile.description === "Kotetsujou"){
        sendChatMessage("Kabaneri was a clusterfuck, there's no better settings to describe it than this.");
        sendChatMessage("Song selection: Random");
        modifyMessage = "Song selection: Random";
    }
    else if (tile.description === "Go to Jail"){
        sendChatMessage("You're in Jail, but since you're a cute anime girl, guards let you out but supervise you");
        sendChatMessage("No dropdown");
        modifyMessage = "No dropdown";
        current = 10;
    }
    else if (tile.description === "Kansei Durifto!?"){
        sendChatMessage("*Eurobeat intensifies*");
        sendChatMessage("Playback Speed x2");
        modifyMessage = "Playback Speed x2";
    }
    if (current != 0 && !tile.description.startsWith("Just Visiting") && modifyMessage !== "" && modifyMessage !== "Co-op with partner"){
        addModifier(modifyMessage);
        sendChatMessage("Rolling again...");
        setTimeout(roll, 3000);
    }
    else {
        if (tags.indexOf(tile.description) >= 0){
            if (tile.owner !== ""){
                let ownerLives = lives + 1;
                let owner = tile.owner;
                let description = tile.description;
                let filteredTiles = board.filter(checkOwnerShip);
                if (description === "Shoujo" || description === "Shounen" ||
                    description === "CGDCT" || description === "Magic" ||
                    description === "School") {
                    if (filteredTiles.length === 3){
                        ownerLives ++;
                    }
                }
                else if (filteredTiles.length === 2){
                    ownerLives ++;
                }
                sendChatMessage(owner + ": " + ownerLives + " lives, everyone else " + lives + " lives");
            }
            else {
                sendChatMessage("Everyone: " + lives + " lives");
            }
            setTimeout(displayModifiers, 3000);
            updateModifiers();
        }
    }
}

function addModifier(message){
    for (let i = 0; i < modifiers.length; i++){
        if (modifiers[i].modifier === message){
            modifiers.splice(i,1);
            break;
        }
    }
    modifiers.push(new Condition(message , 3 ));
}

function checkOwnerShip(tile){
    return tile.owner === board[current].owner;
}

function handleGacha(diceResult) {
    if (diceResult == 1){
        sendChatMessage("Let's make it easier with 0-60 difficulty!");
    } else if (diceResult == 2){
        sendChatMessage("Who wants tags? No one.");
    } else if (diceResult == 3){
        sendChatMessage("Brain too slow? No problem.");
    } else if (diceResult == 4){
        sendChatMessage("No boomers only zoomers.");
    } else if (diceResult == 5){
        sendChatMessage("Get those trash songs out :wave:");
    } else {
        sendChatMessage("Get those obscure sht out :wave:");
    }
}

function handleMystery(diceResult, tile) {
    if (diceResult == 1){
        sendChatMessage("Back to start!");
        current = 0;
    } else if (diceResult == 2){
        sendChatMessage("When's the next train coming?");
        if (tile.description.startsWith("Trap")){
            current += 8;
        }
        else if (tile.description.startsWith("ARTS")){
            current += 3;
        }
        else {
            current += 9;
        }
    } else if (diceResult == 3){
        sendChatMessage("Caught by the cops...");
        current = 30;
    } else if (diceResult == 4){
        sendChatMessage("Vroom Vroom :blue_car:");
        current = 20;
    } else if (diceResult == 5){
        sendChatMessage("Step back!");
        current -= 3;

    } else {
        sendChatMessage("Let's explore some bad tags :)!");
        if (tile.description.startsWith("Trap")){
            current += 5;
        }
        else if (tile.description.startsWith("ARTS")){
            current += 6;
        }
        else {
            current += 2;
        }
    }
    tileEventHandler(current);
}

// roll the dice
function roll(){
    let diceResult2 = getRandomIntInclusive(1, maxRoll);
    diceResult = getRandomIntInclusive(1, maxRoll);
    sendChatMessage("rolls " + diceResult + " and " + diceResult2);
    diceResult += diceResult2;
    updateCurrent(diceResult);
    tileEventHandler(current);
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sendChatMessage(message) {
    gameChat.$chatInputField.val(message);
    gameChat.sendMessage();
}

function updateCurrent(diceRoll) {
    current += diceResult;
    current %= 40;
}

function updateModifiers() {
    for (let i = 0; i < modifiers.length; i++){
        if (modifiers[i].rounds == 1){
            if (modifiers[i].modifier === "Everyone starts with 3 lives"){
                lives = 1;
            }
            modifiers.shift();
            i--;
        }
        else modifiers[i].rounds--;
    }
}

function displayModifiers(){
    sendChatMessage("Current Modifiers:");
    if (modifiers.length == 0) {
        sendChatMessage("None");
    }
    else{
        for (let i = 0; i < modifiers.length; i++){
            sendChatMessage(modifiers[i].modifier + " - " + modifiers[i].rounds + " rounds left");
        }
    }

}

commandListener.bindListener();

AMQ_addScriptData({
    name: "AMQ Monopoly",
    author: "theyingster",
    description: `
        <p>Simulates monopoly on the website animemusicquiz.com</p>
    `
});