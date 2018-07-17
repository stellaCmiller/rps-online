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
        queuePosition: 0
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

    addPlayerToQueue: function(){
        db.ref("/Queue").push({
            playerID: this.player.ID,
            name: this.player.name,
            wins: this.player.wins,
            losses: this.player.losses
        });
        this.player.inQueue = true;
    },

    startMatch: function(twoPlayerArr){
        $("#player-one h2").text(twoPlayerArr[0].name);
        $("#player-two h2").text(twoPlayerArr[1].name);
        if (this.player.ID == twoPlayerArr[0].ID){
            $("#player-one .rps-buttons").css("display", "block");
            $("#player-two .spectator-display").css("display", "block");
        } else if (this.player.ID == twoPlayerArr[1].ID){
            $("#player-two .rps-buttons").css("display", "block");
            $("#player-one .spectator-display").css("display", "block");
        } else {
            $("#player-one .spectator-display").css("display", "block");
            $("#player-two .spectator-display").css("display", "block");
        }
    }

}

//-----------------------MAIN--------------------------------------
//On page load, check if the user has visited the page before and displays the player name and win record from the db
rockPaperScissors.checkPlayer();


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
        rockPaperScissors.addPlayerToQueue();
    }
});

//When the user leaves the page, he is removed from the queue automatically
$("#test").click(function() {
    console.log(db.ref("/Queue").child("player").val());
});

//------------LOCAL QUEUE LISTENER--------------
/*Each time a player is added to the queue or removed from it, updates the player's position in the queue locally*/
db.ref("/Queue").on("value", function(snapshot){
    if (snapshot.val() != null){
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
});


//--------QUEUE MATCH HANDLER-------CHANGE TO CHILD REMOVED AFTER TESTING------------
db.ref("/Queue").on("value", function(snapshot){
    if (snapshot.val()!= null){
        if (Object.keys(snapshot.val()).length >= 2){
            var first2 = 0;
            var players = [];
            snapshot.forEach(function(childSnapshot) {
                first2++;
                players.push(childSnapshot.val().player)
                if (first2 == 2){
                    return true;
                }
            });
            rockPaperScissors.startMatch(players);
        }
    }
});
