# Rock Paper Scissors Smash!!
You can play rock paper scissors with anyone else connected to the site. Only 2 players play at a time, and there is a queue system implemented that updates with your position in the queue so you'll know when you play next. 

## Features:
* User authentification in the form of a firebase key that is stored within browser local storage and checked against firebase to retrieve user data on each visit to the site.
* **The firebase queue**
  * When a user clicks 'enter queue', their user information stored in firebase is pushed to ("/Queue")
  * When two players enter the queue, a match is started
  * A few seconds after the game displays winning information, both players are removed from the queue, and the next 2 take their place

## Coming Soon (Features I want to add):
* Global chat feature using firebase
* Instead of implementing a global queue, I'd rather have multiple games of RPS going at the same time so that players can find games quicker, as soon as there are two people in the queue


