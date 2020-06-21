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

let DEFAULT_SETTINGS = {
		roomName: "AMQ Monopoly 20+",
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



// difficulty ranges and types
//let typeRanges = []; // difficulty ranges for each type (openings, endings and inserts) (eg. [[10, 50], [50, 80], [53, 89]])
let curDiffRange = [0, 40]; // current selected difficulty
let curType = 3; // current selected type of song (op/ed/in)

//let yearRanges = []; // year ranges array for counting by years
let curYearRange = [1950, 2020]; // default year range
let curSpeed = 1; // default 1x playback speed
let lives = 1;
let tv = true;
let curGuessTime = 20;
let curTag;

// difficulty sliders
let openingsDiffSlider;
let endingsDiffSlider;
let insertsDiffSlider;

let command = "/test";

// HostModal.selectLastMan() allows change to last man standing

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
        if (payload.sender === selfName && payload.message.startsWith("/")) {
            if (payload.message === command){
                changeSettings();
            }
            else if (payload.message === "/randomize"){
                randomize();
                setTimeout(randomize,1000);
            }
            else if (payload.message === "/kansei durifto!?"){
                curSpeed = 2;
                setSpeed(curSpeed);
            }
            else if (payload.message === "/boomer"){
                curYearRange = [1950,2000]
                setYears(curYearRange);
            }
            else if (payload.message === "/zoomer"){
                curYearRange = [2000,2020]
                setYears(curYearRange);
            }
            else if (payload.message === "/kabaneri"){
                curType = 1;
                setSongSelection(curType);
            }
            else if (payload.message === "/hard"){
                curDiffRange = [0,20];
                setDifficulty(curDiffRange);
            }
            else if (payload.message === "/easy"){
                curDiffRange = [0,60];
                setDifficulty(curDiffRange);
            }
            else if (payload.message === "/3 lives"){
                lives = 3;
                setLives(lives);
            }
            else if (payload.message === "/no tv"){
                tv = false;
                changeTVSelection(tv);
            }
            else if (payload.message === "/shorter"){
                curGuessTime = 10;
                setGuessTime(curGuessTime);
            }
            else if (payload.message.startsWith("/tag")) {
                let tag = payload.message.substring(5);
                curTag = tag;
                setTag();
            }
            else if (payload.message === "/reset"){
                hostModal.changeSettings(DEFAULT_SETTINGS);
            }
            setTimeout(() => { lobby.changeGameSettings(); },1);
        }

    }
});

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

function changeSettings(){
    // set difficulty range
    //curDiffRange = startDiffRange;
    //curType = startType;

    setDifficulty(curDiffRange);
    setYears(curYearRange);

    setSettings(); // set default lobby settings
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

// set default game settings (only called start of game)
function setSettings() {
    this.gameMode = 'Last Man Standing';
    hostModal.selectLastMan();
    hostModal.$songPool.slider('setValue', curType); // set only watched
    hostModal.$playbackSpeed.slider('setValue', curSpeed); //set 1x playback
    hostModal.lifeSliderCombo.setValue(lives); // set 1 life per player
    hostModal.numberOfSongsSliderCombo.setValue(100); // set 100 songs
    setDifficulty(curDiffRange); // set 0-40 difficulty
    hostModal.playLengthSliderCombo.setValue(20); // set 20 seconds guess time

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
    curYearRange = [1950, 2020];
}

// set new difficulty
function setDifficulty(diffRange) {
    hostModal.songDiffAdvancedSwitch.setOn(true);
    hostModal.songDiffRangeSliderCombo.setValue(diffRange);
}

function setGuessTime(time) {
    hostModal.playLengthSliderCombo.setValue(time);
}

// set year setting
function setYears(yearRange) {
    hostModal.vintageRangeSliderCombo.setValue(yearRange);
}



function sendChatMessage(message) {
    gameChat.$chatInputField.val(message);
    gameChat.sendMessage();
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
        sendChatMessage("The tag does not exist. Please choose again."); // tag not found
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


commandListener.bindListener();
settingsChangeListener.bindListener();