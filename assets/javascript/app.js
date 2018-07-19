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
        //this.checkSelections();
    },

    /*When both players have made a selection, the playRPS method determines the winner */
    checkSelections: function(){
        db.ref("/Queue").on("value", function(snapshot){
            var choicesArr;
            var twoSelections;
            snapshot.forEach(function(childSnapshot) {
                console.log(childSnapshot.val().selection);
            });
        });
    },

    /*Actual logic for RPS UNFINISHED*/
    playRPS: function(choicesArr){
        if (p1choice == p2choice){
            console.log("its a tie game bois");
        } else if (p1choice == "r" && p2Choice == "s"){
            console.log("player 1 wins");
        }
    }

}

//-----------------------MAIN--------------------------------------
//On page load, check if the user has visited the page before and displays the player name and win record from the db
rockPaperScissors.checkPlayer();
var players = [];


//-------------Local Event Listeners-------------------------------
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
    db.ref(`/Queue/${rockPaperScissors.player.queueKey}`).remove();
    rockPaperScissors.player.inQueue = false;
    rockPaperScissors.player.queuePosition = 0;
});

/*Calls the log selection method to store the user input in firebase */
$("body").on("click", ".rps-buttons input", function(){
    rockPaperScissors.logSelection($(this).attr("value"));
})

//------------LOCAL QUEUE LISTENER--------------
/*Each time a player is added to the queue or removed from it, updates the player's position in the queue locally*/
db.ref("/Queue").on("value", function(snapshot){
    if (snapshot.val() != null){
        if (rockPaperScissors.player.inQueue){
            rockPaperScissors.player.queuePosition = 0;
            var newArr = Object.keys(snapshot.val());
            $("#queue-length").text(newArr.length);
            snapshot.forEach(function(childSnapshot) {
                rockPaperScissors.player.queuePosition++;
                if (rockPaperScissors.player.ID == childSnapshot.val().playerID){
                    return true;
                }
            });
            $("#queue-position").text(rockPaperScissors.player.queuePosition);
        }
    }
});


//--------QUEUE MATCH HANDLER-------CHANGE TO CHILD REMOVED AFTER TESTING? WHO KNOWS------------
db.ref("/Queue").on("value", function(snapshot){
    if (snapshot.val()!= null){
        if (Object.keys(snapshot.val()).length >= 2){
            var first2 = 0;
            snapshot.forEach(function(childSnapshot) {
                first2++;
                players.push(childSnapshot.val())
                if (first2 == 2){
                    return true;
                }
            });
            rockPaperScissors.startMatch(players);
        }
    }
});

