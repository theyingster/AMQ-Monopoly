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

function initializeBoard(){
    board.push(new Tile("","Start Tile"));
    board.push(new Tile("",chosenTags[0]));
    board.push(new Tile("","Gacha: Bang Dream!"));
    board.push(new Tile("",chosenTags[0]));
    board.push(new Tile("","NTR"));
    board.push(new Tile("","Galaxy Express 999"));
    board.push(new Tile("",chosenTags[1]));
    board.push(new Tile("","Trap Card"));
    board.push(new Tile("",chosenTags[1]));
    board.push(new Tile("",chosenTags[1]));
    board.push(new Tile("","Just Visiting"));
    board.push(new Tile("",chosenTags[2]));
    board.push(new Tile("","Ugly Bastard"));
    board.push(new Tile("",chosenTags[2]));
    board.push(new Tile("",chosenTags[2]));
    board.push(new Tile("","Kotetsujou"));
    board.push(new Tile("",chosenTags[3]));
    board.push(new Tile("","Gacha: Fate Grand Order"));
    board.push(new Tile("",chosenTags[3]));
    board.push(new Tile("",chosenTags[3]));
    board.push(new Tile("","Kansei Durifto!?"));
    board.push(new Tile("",chosenTags[4]));
    board.push(new Tile("","ARTS (whatever the fuck that means)"));
    board.push(new Tile("",chosenTags[4]));
    board.push(new Tile("",chosenTags[4]));
    board.push(new Tile("","APT-kun"));
    board.push(new Tile("",chosenTags[5]));
    board.push(new Tile("",chosenTags[5]));
    board.push(new Tile("","Drugs"));
    board.push(new Tile("",chosenTags[5]));
    board.push(new Tile("","Go to Jail"));
    board.push(new Tile("",chosenTags[6]));
    board.push(new Tile("",chosenTags[6]));
    board.push(new Tile("","Gacha: Granblue Fantasy"));
    board.push(new Tile("",chosenTags[6]));
    board.push(new Tile("","Flying Pussyfoot"));
    board.push(new Tile("","Counter!"));
    board.push(new Tile("",chosenTags[7]));
    board.push(new Tile("","RAPE!!"));
    board.push(new Tile("",chosenTags[7]));
}

let OVERLAP_MODS = ["Playback","Guess time:","Song diff","Song pop"];


// Gacha tiles
let gacha = [];
gacha.push("Song difficulty: 0-60");
gacha.push("Remove all tags");
gacha.push("Guess time: 30 seconds");
gacha.push("Year range: 2000-2020");
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

let tags = ["Female Protagonist","Magic","Idol","Shounen","Cute Girls Doing Cute Things","Shoujo","School","Male Protagonist",
           "Seinen","Josei","Iyashikei","Tragedy","Super Power","Military","Harem","Historical","Parody",
           "Space","Aliens","Animals","Kids","Politics"];
let defaultTags = ["Female Protagonist","Magic","Idol","Shounen","Cute Girls Doing Cute Things","Shoujo","School","Male Protagonist"];
let chosenTags = [];
let modifiers = [];

let _endResultListener = new Listener("quiz end result", function (payload) {
    // TODO auto add point to winner
    //sendChatMessage("zzz");
    /*
    for (let player in quiz.players){
        sendChatMessage("player " + player.name + ": " + player.points + " points");
        if (player && player.finalPosition == 1){
            updateScore(player.name());
        }
    }*/

});

_endResultListener.bindListener();


let commandListener = new Listener("Game Chat Message", (payload) => {
    if (payload.sender === selfName) {
        if (lobby.inLobby && payload.message.startsWith(command)) {
            if (board.length == 0) {
                sendChatMessage("Please choose your tags first through '/ChooseTags'");
            }
            else {
                // roll the dice
                roll();
            }
        }
        else if (payload.message.startsWith("/Owner")) {
            //update tile owner
            sendChatMessage("Updating ownership...");
            let message = payload.message.split(" ");
            board[current].owner = message[1];
            sendChatMessage("Done! " + message[1] + " is now the owner of the current tile.");
        }
        else if (payload.message.startsWith("/NewGame")) {
            hostModal.selectLastMan();
            hostModal.changeSettings(DEFAULT_SETTINGS);
            setTimeout(() => { lobby.changeGameSettings(); },1);
            sendChatMessage("Creating Scoreboard...");
            players = [];
            scores = [];
            for (let playerId in lobby.players) {
                players.push(lobby.players[playerId]._name);
                scores.push(0);
            }
            sendChatMessage("Done!");
            clearBoard();
        }
        else if (payload.message.startsWith("/Current")) {
            sendChatMessage("We are currently on tile " + current);
        }
        else if (payload.message.startsWith("/Add")) {
            // manually move to tiles for debugging
            let msg = payload.message.split(' ');
            current += parseInt(msg[1],10);
            current %= 40;
        }
        else if (payload.message.startsWith("/Test")) {
            // test event handlling on current tile for debugging
            tileEventHandler(current);
        }
        else if (payload.message.startsWith("/ChooseTags")){
            showTags();
        }
        else if (payload.message.startsWith("/Choosing")){
            if (board.length != 0) {
                sendChatMessage("Please use '/NewGame' to clear the board as the current script does not currently support rechoosing tags :(");
            }
            else {
                let chosen = payload.message.split(" ");
                chosen.shift();
                setTags(chosen);
            }
        }
        else if (payload.message.startsWith("/Default")){
            setDefault();
        }
        else if (payload.message.startsWith(pointCommand)) {
            if (players.length == 0){
                sendChatMessage("Please create a scoreboard first using 'Scoreboard'");
            }
            // give the winner of the round a point
            let message = payload.message.split(" ");
            updateScore(message[1]);
        }
        else if (payload.message.startsWith("/sub")) {
            if (players.length == 0){
                sendChatMessage("Please create a scoreboard first using 'Scoreboard'");
            }
            // give the winner of the round a point
            let message = payload.message.split(" ");
            subtractScore(message[1]);
        }
        else if (payload.message.startsWith("/ResetScore")) {
            resetScore();
        }
        else if (payload.message.startsWith(help)) {
            sendChatMessage("1. /Point 'player' = give 'player' a point");
            sendChatMessage("2. /ResetScore = reset the scoreboard");
            sendChatMessage("3. /NewGame = clear the board and create scoreboard before game starts");
            sendChatMessage("4. /SetWinningScore 'number' = sets 'number' as the points needed to win");
        }
        else if (payload.message.startsWith("/SetWinningScore")) {
            let message = payload.message.split(" ");
            winningScore = parseInt(message[1]);
            sendChatMessage("Winning score has been set to " + winningScore + ".");
        }
    }
});

// display tags that can be chosen
function showTags(){
    sendChatMessage("List of Monopoly tags:")
    for (let i = 1; i <= tags.length; i++){
        sendChatMessage( i + ") " + tags[i-1]);
    }
    sendChatMessage("Use '/Choosing a b ... c' to select 8 different tags by numbering with a space between each for the game");
    sendChatMessage("Use '/Default' for Wolf's original tags...");
    sendChatMessage("Note: The order of tags on the board will be the same as the order chosen.");
}

// Set the current tags to be the chosen tags
function setTags(chosen){
    sendChatMessage("The tags chosen are:");
    let desc;
    for (let i = 0; i < chosen.length; i++){
        let index = parseInt(chosen[i],10);
        desc = tags[index - 1];
        chosenTags[i] = desc;
        sendChatMessage(index + ") " + desc);
    }
    initializeBoard();
    sendChatMessage("Ready for dice roll...");
}

function setDefault(){
    for (let i = 0; i < defaultTags.length; i++){
        chosenTags[i] = defaultTags[i];
    }
    initializeBoard();
    sendChatMessage("Ready for dice roll...");
}


// clear board after game is over
function clearBoard(){
    sendChatMessage("Clearing game board...");
    lives = 1;
    current = 0;
    modifiers = [];
    board = [];
    sendChatMessage("Everything cleared! Ready for new game... Please rechoose tags.");
}

// handles event triggered by moving onto the current tile
function tileEventHandler(current){
    let tile = board[current];
    sendChatMessage("Current tile: " + tile.description);
    let modifyMessage = "";

    if (current == 0 || tile.description.startsWith("Just Visiting")){
        sendChatMessage("Rolling again...");
        setTimeout(roll, 3000);
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
        randomize();
    }
    else if (tile.description === "Ugly Bastard"){
        sendChatMessage("We can't escape Ugly Bastard.");
        sendChatMessage("Song difficulty: 0-20");
        modifyMessage = "Song difficulty: 0-20";
        curDiffRange = [0,20];
        setDifficulty(curDiffRange);
    }
    else if (tile.description === "Drugs"){
        sendChatMessage("Drugs are bad kids, don't do drugs.");
        sendChatMessage("Guess time: 10 seconds");
        modifyMessage = "Guess time: 10 seconds";
        curGuessTime = 10;
        setGuessTime(curGuessTime);
    }
    else if (tile.description === "NTR"){
        sendChatMessage("Everyone gets to choose a partner to coop with. First come, first served.");
        sendChatMessage("Choose your partner now!");
        modifyMessage = "Co-op with partner";
        addModifier(modifyMessage);
    }
    else if (tile.description === "APT-kun"){
        sendChatMessage("Since APT-kun is a training wagon and not meant to be commonly used");
        sendChatMessage("Show type: no TV");
        modifyMessage = "Show type: no TV";
        tv = false;
        changeTVSelection(tv);
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
        curYearRange = [1950,2000]
        setYears(curYearRange);
    }
    else if (tile.description === "Kotetsujou"){
        sendChatMessage("Kabaneri was a clusterfuck, there's no better settings to describe it than this.");
        sendChatMessage("Song selection: Random");
        modifyMessage = "Song selection: Random";
        curType = 1;
        setSongSelection(curType);
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
        curSpeed = 2;
        setSpeed(curSpeed);
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
                filteredTiles = filteredTiles.filter(checkTile);
                if (chosenTags.indexOf(description) > 0 && chosenTags.indexOf(description) < 7) {
                    if (filteredTiles.length === 3){
                        ownerLives ++;
                    }
                }
                else if (filteredTiles.length === 2){
                    ownerLives ++;
                }
                setLives(ownerLives);
                sendChatMessage(owner + ": " + ownerLives + " lives, everyone else " + lives + " lives");
            }
            else {
                setLives(lives);
                sendChatMessage("Everyone: " + lives + " lives");
            }
            if (!tagless){
                curTag = tile.description;
            }
            setTag();
            displayModifiers();
            setTimeout(() => { lobby.changeGameSettings(); },1);
            setTimeout(() => { updateModifiers(); },1);
        }
    }
}

function addModifier(message){
    for (let i = 0; i < modifiers.length; i++){
        let modifier = modifiers[i].modifier;
        if (modifier === message ||
            (modifier.startsWith("Year range") && message.startsWith("Year range")) ||
            (modifier.startsWith("Song difficulty") && message.startsWith("Song difficulty")) ||
            (modifier.startsWith("Guess time") && message.startsWith("Guess time"))
           ){
            modifiers.splice(i,1);
            break;
        }
    }
    modifiers.push(new Condition(message , 3 ));
}

function checkTile(tile){
    return tile.description === board[current].description;
}


function checkOwnerShip(tile){
    return tile.owner === board[current].owner;
}

function handleGacha(diceResult) {
    if (diceResult == 1){
        sendChatMessage("Let's make it easier with 0-60 difficulty!");
        curDiffRange = [0,60];
        setDifficulty(curDiffRange);
    } else if (diceResult == 2){
        sendChatMessage("Who wants tags? No one.");
        tagless = true;
        curTag = "";
    } else if (diceResult == 3){
        sendChatMessage("Brain too slow? No problem.");
        curGuessTime = 30;
        setGuessTime(curGuessTime);
    } else if (diceResult == 4){
        sendChatMessage("No boomers only zoomers.");
        curYearRange = [2000,2020]
        setYears(curYearRange);
    } else if (diceResult == 5){
        sendChatMessage("Get those trash songs out :wave:");
        setLiked(); // no disliked, no mixed, only liked
    } else {
        sendChatMessage("Get those obscure sht out :wave:");
        curAnimeScore = [7,10];
        setAnimeScore();
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
    let sum = diceResult2 + diceResult;
    sendChatMessage("rolls " + diceResult + " & " + diceResult2 + " -> " + sum);
    updateCurrent(sum);
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
    current += diceRoll;
    current %= 40;
}

function updateModifiers() {
    for (let i = 0; i < modifiers.length; i++){
        if (modifiers[i].rounds == 1){
            let modDescription = modifiers[i].modifier;
            if (modifiers.filter(hasRandomize).length == 0){
                if (modDescription.startsWith("Song difficulty")){
                    curDiffRange = [0,40];
                    setDifficulty(curDiffRange);
                }
                if (modDescription === "Playback Speed x2"){
                    curSpeed = 1;
                    setSpeed(curSpeed);
                }
                else if (modDescription === "Song popularity: Liked"){
                    resetSongPop();
                }
                if (modDescription.startsWith("Guess time")){
                    curGuessTime = 20;
                    setGuessTime(curGuessTime);
                }
                if (modDescription.startsWith("Year range")){
                    curYearRange = [1950,2020];
                    setYears(curYearRange);
                }
            }
            else if (modDescription === "Quiz settings Randomized"){
                hostModal.changeSettings(QUIZ_DEFAULT_SETTINGS);
                for (let condition of modifiers){
                    let description = condition.modifier;
                    if (hasOverlapWithRandom(description)){
                        // OVERLAP_MODS = ["Playback","Guess time:","Song diff","Song pop"];
                        if (description.startsWith(OVERLAP_MODS[0])){
                            curSpeed = 2;
                            setSpeed(curSpeed);
                        }
                        else if (description.startsWith(OVERLAP_MODS[1])){
                            if (description.indexOf("30") >= 0){
                                curGuessTime = 30;
                            }
                            else {
                                curGuessTime = 10;
                            }
                            setGuessTime(curGuessTime);
                        }
                        else if (description.startsWith(OVERLAP_MODS[2])){
                            if (description.indexOf("0-20") >= 0){
                                curDiffRange = [0,20];
                            }
                            else {
                                curDiffRange = [0,60];
                            }
                            setDifficulty(curDiffRange);
                        }
                        else {
                            setLiked();
                        }
                    }
                }
            }
            if (modDescription === "Everyone starts with 3 lives"){
                lives = 1;
            }
            else if (modDescription === "Anime score: 7-10"){
                curAnimeScore = [2,10];
                setAnimeScore();
            }
            else if (modDescription.startsWith("Show type:")){
                tv = true;
                changeTVSelection(tv);
            }
            else if (modDescription === "Remove all tags"){
                tagless = false;
            }
            else if (modDescription.startsWith("Song selection")){
                curType = 1;
                setSongSelection(curType);
            }
            modifiers.shift();
            i--;
        }
        else modifiers[i].rounds--;
    }
}

function hasOverlapWithRandom(description){
    return description.startsWith(OVERLAP_MODS[0]) ||
        description.startsWith(OVERLAP_MODS[1]) ||
        description.startsWith(OVERLAP_MODS[2]) ||
        description.startsWith(OVERLAP_MODS[3]);
}

function hasRandomize(condition){
    return condition.modifier === "Quiz settings Randomized";
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

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
// AMQ MONOPOLY SCORING
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

let pointCommand = "/Point";
let help = "/Help";
let winningScore = 0;
let players = [];
let scores = [];
let round = 0;

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

function subtractScore(player){
    let index = players.indexOf(player);
    scores[index]--;
    displayScore();
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

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
// AMQ MONOPOLY Setting Changing Functions & Variables
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

let DEFAULT_SETTINGS = {
		roomName: "testing",
		privateRoom: false,
		password: "",
		roomSize: lobby.players.length,
		numberOfSongs: 100,
		modifiers: {
			skipGuessing: true,
			skipReplay: true,
			queueing: true,
			duplicates: true,
			lootDropping: true
		},
		songSelection: {
			advancedOn: false,
			standardValue: 3,
			advancedValue: {
				watched: 20,
				unwatched: 0,
				random: 0
			}
		},
		showSelection: {
			watched: 100,
			unwatched: 0,
			random: 0
		},
		songType: {
			advancedOn: false,
			standardValue: {
				openings: true,
				endings: true,
				inserts: true
			},
			advancedValue: {
				openings: 0,
				endings: 0,
				inserts: 0,
				random: 100
			}
		},
		guessTime: {
			randomOn: false,
			standardValue: 20,
			randomValue: [5, 60]
		},
		inventorySize: {
			randomOn: false,
			standardValue: 20,
			randomValue: [1, 99]
		},
		lootingTime: {
			randomOn: false,
			standardValue: 90,
			randomValue: [10, 150]
		},
		lives: 1,
		samplePoint: {
			randomOn: true,
			standardValue: 1,
			randomValue: [0, 100]
		},
		playbackSpeed: {
			randomOn: false,
			standardValue: 1,
			randomValue: [true, true, true, true]
		},
		songDifficulity: {
			advancedOn: true,
			standardValue: {
				easy: true,
				medium: true,
				hard: true
			},
			advancedValue: [0, 40]
		},
		songPopularity: {
			advancedOn: false,
			standardValue: {
				disliked: true,
				mixed: true,
				liked: true
			},
			advancedValue: [0, 100]
		},
		playerScore: {
			advancedOn: false,
			standardValue: [1, 10],
			advancedValue: [true, true, true, true, true, true, true, true, true, true]
		},
		animeScore: {
			advancedOn: false,
			standardValue: [2, 10],
			advancedValue: [true, true, true, true, true, true, true, true, true]
		},
		vintage: {
			standardValue: {
				years: [1950, 2020],
				seasons: [0, 3],
			},
			advancedValueList: []
		},
		type: {
			tv: true,
			movie: true,
			ova: true,
			ona: true,
			special: true
		},
		genre: [],
		tags: []
	};

let QUIZ_DEFAULT_SETTINGS = {
    guessTime: {
			randomOn: false,
			standardValue: 20,
			randomValue: [5, 60]
		},
    lives: 1,
		samplePoint: {
			randomOn: true,
			standardValue: 1,
			randomValue: [0, 100]
		},
		playbackSpeed: {
			randomOn: false,
			standardValue: 1,
			randomValue: [true, true, true, true]
		},
		songDifficulity: {
			advancedOn: true,
			standardValue: {
				easy: true,
				medium: true,
				hard: true
			},
			advancedValue: [0, 40]
		},
		songPopularity: {
			advancedOn: false,
			standardValue: {
				disliked: true,
				mixed: true,
				liked: true
			},
			advancedValue: [0, 100]
		},
};

// difficulty ranges and types
//let typeRanges = []; // difficulty ranges for each type (openings, endings and inserts) (eg. [[10, 50], [50, 80], [53, 89]])
let curDiffRange = [0, 40]; // current selected difficulty
let curType = 3; // current selected type of song (op/ed/in)

//let yearRanges = []; // year ranges array for counting by years
let curYearRange = [1950, 2020]; // default year range
let curSpeed = 1; // default 1x playback speed
let tv = true;
let curGuessTime = 20;
let curTag;

// difficulty sliders
let openingsDiffSlider;
let endingsDiffSlider;
let insertsDiffSlider;

// check if the tagless modifier is active
let tagless = false;
let curAnimeScore = [2,10];

// listen for when room settings change
let settingsChangeListener = new Listener("Room Settings Changed", payload => {
    hostModal.changeSettings(payload);
    Object.keys(payload).forEach(key => {
        let newValue = payload[key];
        let oldValue = lobby.settings[key];
        lobby.settings[key] = newValue;
    });

    if (payload.roomSize) {
        lobby.settings.roomSize = payload.roomSize;
    }

    Object.values(lobby.players).forEach(player => {
        player.ready = false;
    });

    lobby.isReady = false;
    lobby.toggleRuleButton();
    lobby.updateMainButton();
    if (payload.roomName) {
        lobby.$roomName.text(payload.roomName);
    }

    lobby.updatePlayerCounter();
});

settingsChangeListener.bindListener();

function setLiked(){
    hostModal.songPopAdvancedSwitch.setOn(false);
    let disliked = hostModal.$songPopDisliked;
    let mixed = hostModal.$songPopMixed;
    let liked = hostModal.$songPopLiked;
    if (disliked.is(":checked")) {
        disliked.click();
    }
    if (mixed.is(":checked")) {
        mixed.click();
    }
    if (!liked.is(":checked")) {
        liked.click();
    }
}

function resetSongPop(){
    hostModal.songPopAdvancedSwitch.setOn(false);
    let disliked = hostModal.$songPopDisliked;
    let mixed = hostModal.$songPopMixed;
    let liked = hostModal.$songPopLiked;
    if (!disliked.is(":checked")) {
        disliked.click();
    }
    if (!mixed.is(":checked")) {
        mixed.click();
    }
    if (!liked.is(":checked")) {
        liked.click();
    }
}

function setAnimeScore(){
    hostModal.animeScoreAdvancedSwitch.setOn(false);
    hostModal.$animeScore.slider('setValue', curAnimeScore);
}

// change song selection to type (1 = random, 2 = mainly watched, 3 = watched only)
function setSongSelection(type) {
    hostModal.$songPool.slider('setValue', type);
}

function setSpeed(speed){
    hostModal.playbackSpeedRandomSwitch.setOn(false);
    hostModal.$playbackSpeed.slider('setValue', speed);
}

function randomize(){
   hostModal._currentView = 'quiz';
   hostModal.$RANDOMIZE_BUTTON.click();
   //hostModal.changeSettings(settingRandomizer.getRandomQuizSettings());
}

function setLives(life){
    hostModal.lifeSliderCombo.setValue(life);
}

function changeTVSelection(on){
    let tvCheckbox = hostModal.$animeTvCheckbox;
    if (on) {
        if (!tvCheckbox.is(":checked")){
            tvCheckbox.click();
        }
    }
    else if (tvCheckbox.is(":checked")){
        tvCheckbox.click();
    }
}

// reset year ranges and yearIndex
function resetYears() {
    curYearRange = [1950, 2020];
}

// set new difficulty
function setDifficulty(diffRange) {
    hostModal.songDiffAdvancedSwitch.setOn(true);
    hostModal.songDiffRangeSliderCombo.setValue(diffRange);
}

function setGuessTime(time) {
    hostModal.playLengthRandomSwitch.setOn(false);
    hostModal.playLengthSliderCombo.setValue(time);
}

// set year setting
function setYears(yearRange) {
    hostModal.vintageRangeSliderCombo.setValue(yearRange);
}

function setTag(){
    hostModal.tagFilter.clear();
    let tagID = getTagIDByName(curTag);
    // check if tag exists
    if (tagID !== undefined) {
        hostModal.tagFilter.addValue({
            id: tagID,
            state: DROPDOWN_INCLUSION_SETTINGS.INCLUDE // INCLUDE, EXCLUDE or ONE_OFF
        })
    }
    else {
        // tag not found
    }
}

// find tag id by name
function getTagIDByName(tagName) {
    let tagObject = hostModal.tagFilter.awesomepleteInstance._list.find(tag => {
        return tag.name === tagName;
    });
    if (tagObject !== undefined) {
        return tagObject.id;
    }
    return undefined;
}

// remove tag by name
function removeTagByName(tagName) {
    $("#mhTagFilter .filterList .filterEntry").each((index, elem) => {
        if ($(elem).text().includes(tagName)) {
            $(elem).find(".filterEntryClose").click();
        }
    })
}


AMQ_addScriptData({
    name: "AMQ Monopoly",
    author: "theyingster",
    description: `
        <p>Simulates monopoly on the website animemusicquiz.com</p>
    `
});