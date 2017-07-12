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
    console.log('SUCCESS: ' + testName + ' returned ' + result);
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
  ], 'You should hold ace of clubs, jack of clubs, king of clubs, and queen of clubs. ');
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
  ], 'You should hold three of clubs, four of clubs, six of clubs, and five of clubs. ');
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
  ], 'You should hold queen of clubs, jack of clubs, ten of clubs, and eight of clubs. ');
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
  ], 'You should hold four of clubs, nine of clubs, six of clubs, and queen of clubs. ');
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


// Final summary
console.log('\r\nRan ' + (succeeded + failed) + ' tests; ' + succeeded + ' passed and ' + failed + ' failed');
