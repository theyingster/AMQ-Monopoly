// ==UserScript==
// @name         Change Settings
// @namespace    https://github.com/theyingster/
// @version      0.1
// @description  try to take over the world!
// @author       theyingster
// @match        https://animemusicquiz.com/*
// @grant        none
// ==/UserScript==

if (document.getElementById('startPage')) {
    return
}

// difficulty ranges and types
//let typeRanges = []; // difficulty ranges for each type (openings, endings and inserts) (eg. [[10, 50], [50, 80], [53, 89]])
let curDiffRange = [0, 40]; // current selected difficulty
let curType = 0; // current selected type, index of types array
let types = []; // types ("opening", "ending" and "insert")

//let yearRanges = []; // year ranges array for counting by years
let yearIndex = 0; // current index of the year ranges array
let curYearRange = [2000, 2020]; // default year range

// difficulty sliders
let openingsDiffSlider;
let endingsDiffSlider;
let insertsDiffSlider;

let command = "/test";

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

let commandListener = new Listener("Game Chat Message", (payload) => {
    if (lobby.inLobby){
        if (payload.sender === selfName) {
            if (payload.message === command){
                changeSettings();
            }
            else if (payload.message === "/randomize"){
                randomize();
                
            }
            else if (payload.message === "/kansei durifto!?"){
                changeSpeed();
            }
            setTimeout(lobby.changeGameSettings, 2000);
            //else if (payload.message === "randomizing..."){
              //  randomize();
                //lobby.changeGameSettings();
            //}
        }

    }
});

function changeSpeed(){
    hostModal.playbackSpeedRandomSwitch.setOn(false);
    hostModal.$playbackSpeed.slider('setValue', 2);
    lobby.changeGameSettings();
}

function randomize(){
   //hostModal.$RANDOMIZE_BUTTON.click();
   hostModal.changeSettings(settingRandomizer.getRandomQuizSettings());
}

function changeSettings(){
    // set difficulty range
    //curDiffRange = startDiffRange;
    //curType = startType;

    setDifficulty(curDiffRange);
    setYears(curYearRange);

    setSettings(); // set default lobby settings


}

// set default game settings (only called start of game)
function setSettings() {
    hostModal.$songPool.slider('setValue', 3); // set only watched
    hostModal.$playbackSpeed.slider('setValue', 1);
    hostModal.numberOfSongsSliderCombo.setValue(100); // set 100 songs
    hostModal.songDiffAdvancedSwitch.setOn(true); // set advanced difficulty sliders on
    hostModal.playLengthSliderCombo.setValue(20); // set 5 seconds guess time

    let openings = hostModal.$songTypeOpening;
    let endings = hostModal.$songTypeEnding;
    let inserts = hostModal.$songTypeInsert;

    if (!endings.is(":checked")) {
        endings.click();
    }
    if (!openings.is(":checked")) {
        openings.click();
    }
    if (!inserts.is(":checked")) {
        inserts.click();
    }

    resetYears();
    //change time range
    setYears(curYearRange);

    //lobby.changeGameSettings();

    // enable auto skip during replay
    // options.$AUTO_VOTE_REPLAY.prop("checked", true)
    // options.updateAutoVoteSkipReplay();
}

// reset year ranges and yearIndex
function resetYears() {
    yearIndex = 0;
    curYearRange = [1950, 2020];
}

// set new difficulty
function setDifficulty(diffRange) {
    hostModal.songDiffRangeSliderCombo.setValue(diffRange);
}

// set year setting
function setYears(yearRange) {
    hostModal.vintageRangeSliderCombo.setValue(yearRange);
}


function sendChatMessage(message) {
    gameChat.$chatInputField.val(message);
    gameChat.sendMessage();
}

commandListener.bindListener();
settingsChangeListener.bindListener();

