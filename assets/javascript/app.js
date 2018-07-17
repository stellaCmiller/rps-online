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

//----------Object containing game logic----------------------
var rockPaperScissors = {
    
    /*Holds a local reference to the current player */
    player: {
        ID: localStorage.getItem("rpsKey"),
        name: "",
        wins: 0,
        losses: 0
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
            player: this.player,
        })
    },

}

//-----------------------Main--------------------------------------
//On page load, check if the user has visited the page before and displays the player name and win record from the db
rockPaperScissors.checkPlayer();


//-------------Event Listeners-----------------------------------
//If this is the player's first visit to the site, pop up a modal and have them enter their name into the db
$("#add-player").click(function(){
    event.preventDefault();
    rockPaperScissors.addNewPlayer($("#player-name").val());
    $("#new-player-modal").css("display", "none");
});

//Places the player into the game queue
$("#find-game").click(function(){
    rockPaperScissors.addPlayerToQueue();
})


/*Each time a player is added to the queue, updates the player's position in the queue */
db.ref("/Queue").on("value", function(snapshot){
    var queuePosition = 0;
    var newArr = Object.keys(snapshot.val());
    $("#queue-length").text(newArr.length);
    snapshot.forEach(function(childSnapshot) {
        queuePosition++;
        if (rockPaperScissors.player == childSnapshot.val().player){
            return true;
        }
    });
    $("#queue-position").text(queuePosition);
});
