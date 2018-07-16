//Initialize Firebase
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

//Object containing game logic
var rockPaperScissors = {
    /*First checks if there is an RPS key in local storage. If not, the getNewPlayerInfo method is called. If there is, the playerSearch method is called.*/
    checkPlayer: function(){
        var playerID = localStorage.getItem("rpsKey");
        if (playerID != null){
            this.playerSearchAndDisplay(playerID);
        } else {
            this.getNewPlayerInfo();
        }
    },

    /*Searches the database with the ID in local storage and displays the player name and win count*/
    playerSearchAndDisplay: function(id){
        db.ref(id).once("value").then(function(snapshot){
            console.log(snapshot.val());
            $("#player-name-display").text(snapshot.val().name);
            $("#wins-display").text(snapshot.val().wins);
            $("#lose-display").text(snapshot.val().losses);
        });
    },

    getNewPlayerInfo: function(){
        $("#new-player-modal").css("display", "block");
    },

    /*Adds a new player to the firebase database and stores the Unique ID generated into the browser*/
    addNewPlayer: function(newUser){
        db.ref().push({
            name: newUser,
            wins: 0,
            losses: 0
        }).then(function(snapshot){
            localStorage.setItem("rpsKey", snapshot.key);
        });
    },

    addPlayerToQueue: function(){

    },

}

//ADD NEW PLAYER TEST FUNCTION
$("#test-button").click(function(){
    $("#new-player-modal").css("display", "block");
});

$("#add-player").click(function(){
    event.preventDefault();
    rockPaperScissors.addNewPlayer($("#player-name").val());
    $("#new-player-modal").css("display", "none");
});


rockPaperScissors.checkPlayer();
