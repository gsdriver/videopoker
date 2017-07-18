var utils = require('../utils');

let succeeded = 0
let failed = 0;

function verifySuggestion(currentGame, testName, cards, expectedResult) {
  const rules = utils.getGame(currentGame);
  const attributes = {};

  attributes.currentGame = currentGame;
  attributes[currentGame] = {};
  attributes[currentGame].cards = cards;

  const result = rules.suggest('en-US', attributes);
  if (result == expectedResult) {
//    console.log('SUCCESS: ' + testName + ' returned ' + result);
    succeeded++;
  } else {
    console.log('FAIL: ' + testName + ' returned ' + result + ' rather than ' + expectedResult);
    failed++;
  }
}

// Run the tests
verifySuggestion('jacks', 'Royal Flush', [
  {rank: 'A', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: 'K', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('jacks', 'Striaght Flush', [
  {rank: '9', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: 'K', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('jacks', '4 of a kind', [
  {rank: '6', suit: 'H'},
  {rank: '6', suit: 'S'},
  {rank: 'K', suit: 'C'},
  {rank: '6', suit: 'C'},
  {rank: '6', suit: 'D'},
  ], 'You should hold the sixes. ');
verifySuggestion('jacks', '4 card royal', [
  {rank: 'A', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: 'K', suit: 'C'},
  {rank: 'K', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold the clubs. ');
verifySuggestion('jacks', 'Full House', [
  {rank: 'A', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: 'A', suit: 'D'},
  {rank: 'A', suit: 'H'},
  {rank: 'J', suit: 'S'},
  ], 'You should hold all your cards. ');
verifySuggestion('jacks', 'Flush', [
  {rank: '3', suit: 'C'},
  {rank: '5', suit: 'C'},
  {rank: '2', suit: 'C'},
  {rank: '9', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('jacks', '3 of a kind', [
  {rank: '4', suit: 'D'},
  {rank: '4', suit: 'H'},
  {rank: '4', suit: 'S'},
  {rank: '10', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold the fours. ');
verifySuggestion('jacks', 'Straight', [
  {rank: '9', suit: 'C'},
  {rank: 'J', suit: 'D'},
  {rank: '8', suit: 'H'},
  {rank: '10', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('jacks', '4 card open straight flush', [
  {rank: '3', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: '6', suit: 'C'},
  {rank: '10', suit: 'S'},
  {rank: '5', suit: 'C'},
  ], 'You should hold the clubs. ');
verifySuggestion('jacks', '2 pairs', [
  {rank: '4', suit: 'C'},
  {rank: '3', suit: 'C'},
  {rank: 'K', suit: 'C'},
  {rank: '4', suit: 'S'},
  {rank: '3', suit: 'H'},
  ], 'You should hold the fours and threes. ');
verifySuggestion('jacks', '4 card straight flush - inside draw', [
  {rank: 'Q', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: '3', suit: 'S'},
  {rank: '8', suit: 'C'},
  ], 'You should hold the clubs. ');
verifySuggestion('jacks', 'Jacks or better', [
  {rank: 'J', suit: 'C'},
  {rank: 'J', suit: 'D'},
  {rank: 'K', suit: 'C'},
  {rank: '3', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold the jacks. ');
verifySuggestion('jacks', '3 card royal', [
  {rank: 'A', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: '5', suit: 'D'},
  {rank: '5', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold ace of clubs, jack of clubs, and queen of clubs. ');
verifySuggestion('jacks', '4 card flush', [
  {rank: '4', suit: 'C'},
  {rank: '9', suit: 'C'},
  {rank: '6', suit: 'C'},
  {rank: '3', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold the clubs. ');
verifySuggestion('jacks', '10, Jack, Queen, and King', [
  {rank: '10', suit: 'D'},
  {rank: 'J', suit: 'H'},
  {rank: 'K', suit: 'C'},
  {rank: '3', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold ten of diamonds, jack of hearts, king of clubs, and queen of clubs. ');
verifySuggestion('jacks', 'Low pair', [
  {rank: '8', suit: 'H'},
  {rank: 'J', suit: 'S'},
  {rank: '5', suit: 'C'},
  {rank: '5', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold the fives. ');
verifySuggestion('jacks', '4 card straight', [
  {rank: '5', suit: 'C'},
  {rank: '6', suit: 'D'},
  {rank: '7', suit: 'S'},
  {rank: '8', suit: 'S'},
  {rank: '10', suit: 'C'},
  ], 'You should hold five of clubs, six of diamonds, seven of spades, and eight of spades. ');
verifySuggestion('jacks', '3 card straight flush', [
  {rank: '9', suit: 'C'},
  {rank: '8', suit: 'C'},
  {rank: '7', suit: 'C'},
  {rank: '3', suit: 'S'},
  {rank: 'K', suit: 'D'},
  ], 'You should hold nine of clubs, eight of clubs, and seven of clubs. ');
verifySuggestion('jacks', '4 card inside straight', [
  {rank: '3', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: '6', suit: 'H'},
  {rank: '7', suit: 'S'},
  {rank: 'A', suit: 'C'},
  ], 'You should hold three of clubs, four of clubs, six of hearts, and seven of spades. ');
verifySuggestion('jacks', '3 card straight flush', [
  {rank: '3', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: '10', suit: 'H'},
  {rank: '7', suit: 'S'},
  {rank: 'A', suit: 'C'},
  ], 'You should hold three of clubs, four of clubs, and ace of clubs. ');
verifySuggestion('jacks', '2 card royal', [
  {rank: '10', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: '6', suit: 'H'},
  {rank: '7', suit: 'S'},
  {rank: 'A', suit: 'C'},
  ], 'You should hold ten of clubs and ace of clubs. ');
verifySuggestion('jacks', '3 high cards', [
  {rank: '10', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: 'Q', suit: 'H'},
  {rank: '7', suit: 'S'},
  {rank: 'A', suit: 'D'},
  ], 'You should hold ten of clubs, queen of hearts, and ace of diamonds. ');
verifySuggestion('jacks', '2 high cards', [
  {rank: '2', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: 'Q', suit: 'H'},
  {rank: '7', suit: 'S'},
  {rank: 'A', suit: 'D'},
  ], 'You should hold queen of hearts and ace of diamonds. ');
verifySuggestion('jacks', '1 high card', [
  {rank: '2', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: 'Q', suit: 'H'},
  {rank: '7', suit: 'S'},
  {rank: '9', suit: 'D'},
  ], 'You should hold queen of hearts. ');
verifySuggestion('jacks', 'Nothing', [
  {rank: '8', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: '2', suit: 'H'},
  {rank: '7', suit: 'S'},
  {rank: '9', suit: 'D'},
  ], 'You shouldn\'t hold any of your cards. ');

// A few from wizard of odds
verifySuggestion('jacks', 'Wizard of Odds case 1', [
  {rank: '9', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  {rank: 'K', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('jacks', 'Wizard of Odds case 2', [
  {rank: '2', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  {rank: 'K', suit: 'C'},
  ], 'You should hold the clubs. ');

verifySuggestion('jacks', 'Wizard of Odds case 3', [
  {rank: 'A', suit: 'D'},
  {rank: '10', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  {rank: 'K', suit: 'C'},
  ], 'You should hold the clubs. ');
verifySuggestion('jacks', 'Wizard of Odds case 4', [
  {rank: 'Q', suit: 'S'},
  {rank: '10', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  {rank: 'K', suit: 'C'},
  ], 'You should hold the clubs. ');
verifySuggestion('jacks', 'Wizard of Odds case 5', [
  {rank: 'K', suit: 'C'},
  {rank: 'Q', suit: 'H'},
  {rank: 'J', suit: 'C'},
  {rank: 'Q', suit: 'D'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold the queens. ');
verifySuggestion('jacks', 'Wizard of Odds case 6', [
  {rank: '2', suit: 'C'},
  {rank: '6', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  {rank: 'K', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('jacks', 'Wizard of Odds case 7', [
  {rank: '3', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: '6', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  {rank: '7', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('jacks', 'Wizard of Odds case 8', [
  {rank: '10', suit: 'C'},
  {rank: 'A', suit: 'S'},
  {rank: 'J', suit: 'C'},
  {rank: 'Q', suit: 'H'},
  {rank: 'K', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('jacks', 'Wizard of Odds case 9', [
  {rank: '7', suit: 'C'},
  {rank: '6', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: '8', suit: 'D'},
  {rank: '5', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('jacks', 'Wizard of Odds case 10', [
  {rank: '10', suit: 'C'},
  {rank: 'A', suit: 'C'},
  {rank: '10', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  {rank: 'A', suit: 'H'},
  ], 'You should hold the aces and tens. ');

// Deuces wild
// No deuces
verifySuggestion('deuces', 'No deuce Royal Flush', [
  {rank: 'A', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: 'K', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', 'No deuce Striaght Flush', [
  {rank: '9', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: 'K', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', 'No deuce 4 of a kind', [
  {rank: '6', suit: 'H'},
  {rank: '6', suit: 'S'},
  {rank: 'K', suit: 'C'},
  {rank: '6', suit: 'C'},
  {rank: '6', suit: 'D'},
  ], 'You should hold the sixes. ');
verifySuggestion('deuces', 'No deuce 4 card royal', [
  {rank: 'A', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: 'K', suit: 'C'},
  {rank: 'K', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold the clubs. ');
verifySuggestion('deuces', 'No deuce Full House', [
  {rank: 'A', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: 'A', suit: 'D'},
  {rank: 'A', suit: 'H'},
  {rank: 'J', suit: 'S'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', 'No deuce Flush', [
  {rank: '3', suit: 'C'},
  {rank: '5', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: '9', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', 'No deuce 3 of a kind', [
  {rank: '4', suit: 'D'},
  {rank: '4', suit: 'H'},
  {rank: '4', suit: 'S'},
  {rank: '10', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold the fours. ');
verifySuggestion('deuces', 'No deuce Straight', [
  {rank: '9', suit: 'C'},
  {rank: 'J', suit: 'D'},
  {rank: '8', suit: 'H'},
  {rank: '10', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', 'No deuce 4 card open straight flush', [
  {rank: '3', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: '6', suit: 'C'},
  {rank: '10', suit: 'S'},
  {rank: '5', suit: 'C'},
  ], 'You should hold the clubs. ');
verifySuggestion('deuces', 'No deuce 2 pairs', [
  {rank: '4', suit: 'C'},
  {rank: '3', suit: 'C'},
  {rank: 'K', suit: 'C'},
  {rank: '4', suit: 'S'},
  {rank: '3', suit: 'H'},
  ], 'You should hold the fours. ');
verifySuggestion('deuces', 'No deuce 4 card straight flush - inside draw', [
  {rank: '6', suit: 'C'},
  {rank: '7', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: '3', suit: 'S'},
  {rank: '8', suit: 'C'},
  ], 'You should hold the clubs. ');
verifySuggestion('deuces', 'No deuce 3 card royal', [
  {rank: 'A', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: '5', suit: 'D'},
  {rank: '5', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold ace of clubs, jack of clubs, and queen of clubs. ');
verifySuggestion('deuces', 'No deuce 4 card flush', [
  {rank: '4', suit: 'C'},
  {rank: '9', suit: 'C'},
  {rank: '6', suit: 'C'},
  {rank: '3', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold the clubs. ');
verifySuggestion('deuces', 'No deuce pair', [
  {rank: '8', suit: 'H'},
  {rank: 'J', suit: 'S'},
  {rank: '5', suit: 'C'},
  {rank: '5', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold the fives. ');
verifySuggestion('deuces', 'No deuce 4 card straight', [
  {rank: '5', suit: 'C'},
  {rank: '6', suit: 'D'},
  {rank: '7', suit: 'S'},
  {rank: '8', suit: 'S'},
  {rank: '10', suit: 'C'},
  ], 'You should hold five of clubs, six of diamonds, seven of spades, and eight of spades. ');
verifySuggestion('deuces', 'No deuce 3 card straight flush', [
  {rank: '9', suit: 'C'},
  {rank: '8', suit: 'C'},
  {rank: '7', suit: 'C'},
  {rank: '3', suit: 'S'},
  {rank: 'K', suit: 'D'},
  ], 'You should hold nine of clubs, eight of clubs, and seven of clubs. ');
verifySuggestion('deuces', 'No deuce 3 card inside straight flush', [
  {rank: '3', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: '10', suit: 'H'},
  {rank: '7', suit: 'S'},
  {rank: 'A', suit: 'C'},
  ], 'You shouldn\'t hold any of your cards. ');
verifySuggestion('deuces', 'No deuce 2 card royal', [
  {rank: '10', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: '6', suit: 'H'},
  {rank: '7', suit: 'S'},
  {rank: 'A', suit: 'C'},
  ], 'You should hold ten of clubs and ace of clubs. ');
verifySuggestion('deuces', 'No deuce three, four, six suited', [
  {rank: '3', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: '6', suit: 'C'},
  {rank: '9', suit: 'D'},
  {rank: 'A', suit: 'H'},
  ], 'You should hold three of clubs, four of clubs, and six of clubs. ');
verifySuggestion('deuces', 'No deuce three, five, six suited', [
  {rank: '3', suit: 'C'},
  {rank: '5', suit: 'C'},
  {rank: '6', suit: 'C'},
  {rank: '9', suit: 'D'},
  {rank: 'A', suit: 'H'},
  ], 'You should hold three of clubs, five of clubs, and six of clubs. ');
verifySuggestion('deuces', 'No deuce nothing', [
  {rank: '8', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: '3', suit: 'H'},
  {rank: '7', suit: 'S'},
  {rank: '9', suit: 'D'},
  ], 'You shouldn\'t hold any of your cards. ');

// One deuce
verifySuggestion('deuces', 'One deuce Royal Flush', [
  {rank: '2', suit: 'S'},
  {rank: '10', suit: 'C'},
  {rank: 'A', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', 'One deuce 5 of a kind', [
  {rank: '2', suit: 'C'},
  {rank: '9', suit: 'C'},
  {rank: '9', suit: 'D'},
  {rank: '9', suit: 'S'},
  {rank: '9', suit: 'H'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', 'One deuce Striaght Flush', [
  {rank: '2', suit: 'S'},
  {rank: '6', suit: 'C'},
  {rank: '8', suit: 'C'},
  {rank: '9', suit: 'C'},
  {rank: '10', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', 'One deuce 4 of a kind', [
  {rank: '2', suit: 'D'},
  {rank: '10', suit: 'C'},
  {rank: '10', suit: 'D'},
  {rank: '10', suit: 'H'},
  {rank: 'Q', suit: 'S'},
  ], 'You should hold two of diamonds, ten of clubs, ten of diamonds, and ten of hearts. ');
verifySuggestion('deuces', 'One deuce 4 card royal', [
  {rank: '2', suit: 'D'},
  {rank: '10', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: '3', suit: 'H'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold ten of clubs, jack of clubs, queen of clubs, and two of diamonds. ');
verifySuggestion('deuces', 'One deuce full house', [
  {rank: '2', suit: 'D'},
  {rank: '10', suit: 'C'},
  {rank: '10', suit: 'D'},
  {rank: 'A', suit: 'H'},
  {rank: 'A', suit: 'S'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', 'One deuce 4 card straight flush', [
  {rank: '2', suit: 'D'},
  {rank: '8', suit: 'C'},
  {rank: '6', suit: 'C'},
  {rank: '5', suit: 'C'},
  {rank: '4', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', 'One deuce 3 of a kind', [
  {rank: '2', suit: 'D'},
  {rank: '10', suit: 'C'},
  {rank: '10', suit: 'D'},
  {rank: '4', suit: 'H'},
  {rank: '7', suit: 'S'},
  ], 'You should hold two of diamonds, ten of clubs, and ten of diamonds. ');
verifySuggestion('deuces', 'One deuce flush', [
  {rank: '2', suit: 'S'},
  {rank: '3', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: '9', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', 'One deuce straight', [
  {rank: '2', suit: 'D'},
  {rank: '10', suit: 'C'},
  {rank: '9', suit: 'D'},
  {rank: '7', suit: 'H'},
  {rank: '6', suit: 'S'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', 'One deuce ace, four, and five', [
  {rank: '2', suit: 'D'},
  {rank: 'A', suit: 'C'},
  {rank: '4', suit: 'C'},
  {rank: '5', suit: 'C'},
  {rank: '9', suit: 'S'},
  ], 'You should hold two of diamonds, ace of clubs, four of clubs, and five of clubs. ');
verifySuggestion('deuces', 'One deuce two card royal', [
  {rank: '2', suit: 'D'},
  {rank: 'J', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  {rank: '3', suit: 'H'},
  {rank: '8', suit: 'S'},
  ], 'You should hold jack of clubs, queen of clubs, and two of diamonds. ');
verifySuggestion('deuces', 'One deuce ace ten', [
  {rank: '2', suit: 'D'},
  {rank: '10', suit: 'H'},
  {rank: '3', suit: 'D'},
  {rank: 'A', suit: 'H'},
  {rank: '7', suit: 'S'},
  ], 'You should hold ten of hearts, ace of hearts, and two of diamonds. ');
verifySuggestion('deuces', 'One deuce only', [
  {rank: '2', suit: 'D'},
  {rank: '6', suit: 'C'},
  {rank: '3', suit: 'D'},
  {rank: 'A', suit: 'H'},
  {rank: '9', suit: 'S'},
  ], 'You should hold two of diamonds. ');

// Two deuces
verifySuggestion('deuces', '2 deuce Royal Flush', [
  {rank: '2', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: '2', suit: 'H'},
  {rank: 'J', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', '2 deuce Five of a Kind', [
  {rank: '2', suit: 'C'},
  {rank: '8', suit: 'C'},
  {rank: '2', suit: 'H'},
  {rank: '8', suit: 'S'},
  {rank: '8', suit: 'D'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', '2 deuce Straight Flush', [
  {rank: '2', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: '7', suit: 'C'},
  {rank: '2', suit: 'S'},
  {rank: '6', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', '2 deuce Four of a Kind', [
  {rank: '2', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: '2', suit: 'H'},
  {rank: 'J', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold the twos and jacks. ');
verifySuggestion('deuces', '2 deuce Four Card Royal', [
  {rank: '2', suit: 'C'},
  {rank: 'J', suit: 'C'},
  {rank: '2', suit: 'H'},
  {rank: '10', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold jack of clubs, queen of clubs, two of clubs, and two of hearts. ');
verifySuggestion('deuces', '2 deuce Four Card Straight Flush', [
  {rank: '2', suit: 'C'},
  {rank: '5', suit: 'C'},
  {rank: '2', suit: 'H'},
  {rank: '7', suit: 'C'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold two of clubs, two of hearts, five of clubs, and seven of clubs. ');
verifySuggestion('deuces', '2 deuce Straight', [
  {rank: '2', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: '7', suit: 'D'},
  {rank: '2', suit: 'S'},
  {rank: '6', suit: 'S'},
  ], 'You should hold the twos. ');
verifySuggestion('deuces', '2 deuces', [
  {rank: '2', suit: 'C'},
  {rank: '9', suit: 'C'},
  {rank: '2', suit: 'H'},
  {rank: '4', suit: 'S'},
  {rank: 'Q', suit: 'D'},
  ], 'You should hold the twos. ');

// Three deuces
verifySuggestion('deuces', '3 deuce Royal Flush', [
  {rank: '2', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: '2', suit: 'H'},
  {rank: '2', suit: 'S'},
  {rank: 'Q', suit: 'C'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', '3 deuce Five of a kind', [
  {rank: '2', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: '2', suit: 'H'},
  {rank: '2', suit: 'S'},
  {rank: '10', suit: 'D'},
  ], 'You should hold all your cards. ');
verifySuggestion('deuces', '3 deuces only', [
  {rank: '2', suit: 'C'},
  {rank: '10', suit: 'C'},
  {rank: '2', suit: 'H'},
  {rank: '2', suit: 'S'},
  {rank: 'Q', suit: 'D'},
  ], 'You should hold the twos. ');

// Four deuces
verifySuggestion('deuces', '4 deuces only', [
  {rank: '2', suit: 'C'},
  {rank: '6', suit: 'C'},
  {rank: '2', suit: 'H'},
  {rank: '2', suit: 'S'},
  {rank: '2', suit: 'D'},
  ], 'You should hold the twos. ');

// Final summary
console.log('\r\nRan ' + (succeeded + failed) + ' tests; ' + succeeded + ' passed and ' + failed + ' failed');
