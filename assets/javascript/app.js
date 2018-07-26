//---------Initialize Firebase-----------------------------
var config = {
    apiKey: "AIzaSyCT9g-iVUsIVkMJ0rkhlPsCe46QGYc2O6s",
    authDomain: "rps-smash.firebaseapp.com",
    databaseURL: "https://rps-smash.firebaseio.com",
    projectId: "rps-smash",
    storageBucket: "rps-smash.appspot.com",
    messagingSenderId: "1049844944504"
  };

firebase.initializeApp(config);
var db = firebase.database();

//----------Object containing game methods----------------------
var rockPaperScissors = {
    
    /*Holds a local reference to the current player */
    player: {
        ID: localStorage.getItem("rpsKey"),
        losses: 0,
        name: "",
        wins: 0,
        inQueue: false,
        queuePosition: 0,
        queueKey: null,
    },

    /*First checks if there is an RPS key in local storage. If not, the modal is displayed to get the player name. If there is, the playerSearch method is called.*/
    checkPlayer: function(){
        if (this.player.ID != null){
            this.playerSearchAndDisplay(this.player.ID);
        } else {
            $("#new-player-modal").css("display", "block");
        }
    },

    /*Searches the database with the ID in local storage and displays the player name and win count*/
    playerSearchAndDisplay: function(id){
        db.ref(`/Users/${id}`).once("value").then(function(snapshot){
            rockPaperScissors.player.ID = id;
            rockPaperScissors.player.name = snapshot.val().name;
            rockPaperScissors.player.wins = snapshot.val().wins;
            rockPaperScissors.player.losses = snapshot.val().losses;
            $("#player-name-display").text(snapshot.val().name);
            $("#wins-display").text(snapshot.val().wins);
            $("#lose-display").text(snapshot.val().losses);
        });
    },

    /*Adds a new player to the firebase database and stores the Unique ID generated into the browser*/
    addNewPlayer: function(newUser){
        db.ref("/Users").push({
            name: newUser,
            wins: 0,
            losses: 0
        }).then(function(snapshot){
            localStorage.setItem("rpsKey", snapshot.key);
            rockPaperScissors.playerSearchAndDisplay(snapshot.key);
        });
    },

    /*Adds a player to the game queue and stores the generated ID into the player object */
    addPlayerToQueue: function(){
        db.ref("/Queue").push({
            playerID: this.player.ID,
            name: this.player.name,
            wins: this.player.wins,
            losses: this.player.losses
        }).then(function(snapshot){
            rockPaperScissors.player.queueKey = snapshot.key;
        });
    },

    /*Sets up the game board for top 2 players in the queue, showing a spectator display for all others */
    startMatch: function(twoPlayerArr){
        $("#player-one h2").text(twoPlayerArr[0].name);
        $("#player-two h2").text(twoPlayerArr[1].name);
        if (this.player.ID == twoPlayerArr[0].playerID){
            $("#player-one .rps-buttons").css("display", "block");
            $("#player-two .spectator-display").css("display", "block");
        } else if (this.player.ID == twoPlayerArr[1].playerID){
            $("#player-two .rps-buttons").css("display", "block");
            $("#player-one .spectator-display").css("display", "block");
        } else {
            $("#player-one .spectator-display").css("display", "block");
            $("#player-two .spectator-display").css("display", "block");
        }
    },

    /*When the player makes a choice, firebase is updated with their selection */
    logSelection: function(choice){
        db.ref(`/Queue/${this.player.queueKey}`).update({
           selection: choice
        });

        //Checks if both players have made a choice
        this.checkSelections();
    },

    /*When both players have made a selection, the playRPS method determines the winner */
    checkSelections: function(){
        db.ref("/Queue").on("value", function(snapshot){
            var choicesArr = [];
            snapshot.forEach(function(childSnapshot) {
                if (childSnapshot.val().selection != null){
                    choicesArr.push(childSnapshot.val());
                }
            });
            //When firebase has two selections, determine the winner
            if (choicesArr.length == 2){
                rockPaperScissors.playRPS(choicesArr);
            }
        });
    },

    //Actual logic for RPS
    //Because the array remakes itself after the second player makes a selection, player 1 will always be arr[0]
    playRPS: function(choicesArr){
        if (choicesArr[0].selection == choicesArr[1].selection){
            rockPaperScissors.outcomeTie(choicesArr[1].selection);
        } else if (choicesArr[0].selection == "Rock" && choicesArr[1].selection == "Scissors"){
            rockPaperScissors.winner(choicesArr[0], choicesArr[1]);
        } else if (choicesArr[0].selection == "Paper" && choicesArr[1] == "Rock"){
            rockPaperScissors.winner(choicesArr[0], choicesArr[1]);
        } else if (choicesArr[0].selection == "Scissors" && choicesArr[1] == "Paper"){
            rockPaperScissors.winner(choicesArr[0], choicesArr[1]);
        } else {
            rockPaperScissors.winner(choicesArr[1], choicesArr[0])
        }
    }, 

    //Displays the results of the tie, then after 5 seconds removes both players from the queue
    outcomeTie: function(rps){
        $("#player-one").text(`There was a tie!!! You both chose ${rps}`);
        setTimeout(function(){
            rockPaperScissors.removeFromQueue();
            //Resets the player array
            players = [];
            rockPaperScissors.gameOnFalse();
        }, 5000);

    },

    winner: function(winner, loser){
        if (winner.playerID == rockPaperScissors.player.ID){

            //The player will always see his win/loss info in the player 1 box
            $("#player-two").empty();
            $("#player-one").text(`YOU WON, ${winner.name}!!! You played ${winner.selection}`);
            rockPaperScissors.player.wins++;

            //Update winner info in firebase
            db.ref(`/Users/${winner.playerID}`).update({
                wins: rockPaperScissors.player.wins
            });
        } else {
            $("#player-two").empty();
            $("#player-one").text(`Better luck next time ${loser.name}, you played ${loser.selection}`);
            rockPaperScissors.player.losses++;

            //Update loser info in firebase
            db.ref(`/Users/${loser.playerID}`).update({
                losses: rockPaperScissors.player.losses
            });
        }
        //Displays the results to all players for 5 seconds before automatic removal from the queue
        setTimeout(function(){
            rockPaperScissors.removeFromQueue();
            //Resets the player array
            players = [];
            rockPaperScissors.gameOnFalse();
        }, 5000);

    },

    //After the results of the game are displayed, or when a player DCs, the player is removed from the queue
    removeFromQueue: function(){
        db.ref(`/Queue/${rockPaperScissors.player.queueKey}`).remove();
        rockPaperScissors.player.inQueue = false; //Initial values reset
        rockPaperScissors.player.queuePosition = 0;
        $("#queue-position").text("___");
        $("#queue-length").text("___");
    },

    /*When a match is finished and players are removed from the queue, the variable GameOn in firebase is set to false, which triggers the queue puller function*/
    gameOnFalse: function(){
        db.ref().update({
            GameOn: false
        });
    },

    /*When players are selected for a match, gameOn becomes True to prevent the pull2 function from triggering again before the match is up */
    gameOnTrue: function(){
        db.ref().update({
            GameOn: true
        });
    }
}

//----GLOBAL VARIABLES------

/*Easier for this to be global because display is changed if the user is not currently in a match (not in the players array) */
var players = [];

//-----------------------MAIN--------------------------------------

//On page load, check if the user has visited the page before and displays the player name and win record from the db
rockPaperScissors.checkPlayer();

//If there is not match being played, check the queue for players and start a match
db.ref("/GameOn").on("value", function(snapshot){
    console.log(snapshot.val());
    if (snapshot.val() == false){
        pull2FromQueue();
    }
})


//-------------LOCAL EVENT LISTENERS-------------------------------
//If this is the player's first visit to the site, pop up a modal and have them enter their name into the db
$("#add-player").click(function(){
    event.preventDefault();
    rockPaperScissors.addNewPlayer($("#player-name").val());
    $("#new-player-modal").css("display", "none");
});

//Places the player into the game queue when the "Enter Queue" button is clicked
$("#find-game").click(function(){
    if (rockPaperScissors.player.inQueue == false){
        rockPaperScissors.player.inQueue = true;
        rockPaperScissors.addPlayerToQueue();
    }
});

//When the user leaves the page, he is removed from the queue automatically
$(window).on("unload", function() {
    rockPaperScissors.removeFromQueue();
});

/*Calls the log selection method to store the user's choice of rock, paper, or scissors in firebase */
$("body").on("click", ".rps-buttons input", function(){
    rockPaperScissors.logSelection($(this).attr("value"));
})

//------------LOCAL QUEUE UPDATER--------------
/*Each time a player is added to the queue or removed from it, updates the player's position in the queue locally*/
db.ref("/Queue").on("value", function(snapshot){

    //If there are people in the queue...
    if (snapshot.val() != null){

        //and if this player is IN the queue...
        if (rockPaperScissors.player.inQueue){

            /*Set his position to 0 and count the number of players in the queue until it reaches the player, and the length of the array that contains the queue information is equal to the total number of players in the queue*/
            rockPaperScissors.player.queuePosition = 0;
            var newArr = Object.keys(snapshot.val());
            $("#queue-length").text(newArr.length);
            snapshot.forEach(function(childSnapshot) {
                rockPaperScissors.player.queuePosition++;
                if (rockPaperScissors.player.ID == childSnapshot.val().playerID){
                    return true; //breaks the forEach loop when the player
                }
            });
            $("#queue-position").text(rockPaperScissors.player.queuePosition);
        }
    }
});


//--------QUEUE MATCH HANDLER-------
function pull2FromQueue(){
    console.log("waiting...");
    db.ref("/Queue").on("value", function(snapshot){
        //if there are people in the queue...
        if (snapshot.val()!= null){

            //and if there are at least 2 people in the queue...
            if (Object.keys(snapshot.val()).length >= 2){
                var first2 = 0;

                //There is probably a way to do this more elegantly than using a "two" variable, but I'm not sure a for loop can be used to iterate over the snapshot.
                snapshot.forEach(function(childSnapshot) {
                    first2++;
                    players.push(childSnapshot.val())
                    if (first2 == 2){
                        return true;
                    }
                });
                rockPaperScissors.gameOnTrue();
                rockPaperScissors.startMatch(players);
            }
        }
    });
}
