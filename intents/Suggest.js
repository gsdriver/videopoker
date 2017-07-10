//
// Provides a suggestion for play
//

'use strict';

const utils = require('../utils');
const pokerrank = require('poker-ranking');

module.exports = {
  handleIntent: function() {
    const res = require('../' + this.event.request.locale + '/resources');
    let speech;
    const reprompt = res.strings.GENERIC_REPROMPT;

    // Under construction
    speech = suggestJacksOrBetter(this.event.request.locale, this.attributes);
    speech += reprompt;
    utils.emitResponse(this.emit, this.event.request.locale, null, null, speech, reprompt);
  },
};

// From http://www.thegamblersedge.com/vpoker/vpokerstrat96JoB.htm
function suggestJacksOrBetter(locale, attributes) {
  const game = attributes[attributes.currentGame];
  const rules = games[attributes.currentGame];
  let rank;
  const evaluateOptions = {};
  const holdCards = [];

  evaluateOptions.aceCanBeLow = true;
  if (rules.wildCards) {
    evaluateOptions.wildCards = rules.wildCards;
  }
  if (rules.minPair) {
    evaluateOptions.minPair = rules.minPair;
  }

  // See what they have first
  rank = utils.determineWinner(attributes);
  switch (rank) {
    case 'royalflush':
    case 'straightflush':
    case 'flush':
    case 'fullhouse':
    case 'straight':
      // Hold them all
      game.cards.map((card) => holdCards.push(card));
      break;
    case '4ofakind':
    case '2pair':
      // Hold all but the one that doesn't match
      break;
    case '3ofakind':
      // Hold the trips
      break;
    case 'minpair':
    case 'pair':
      // Hold the pair
      break;
  }

  if (!holdCards.length) {
    // Let's check other cases
    // Is it a 4-card straight?
    evaluateOptions.cardsToEvaluate = 4;
    rank = pokerrank.evaluateHand(game.cards.map((card) => card.rank + card.suit), evaluateOptions);
    if ((rank === 'straight') || (rank === 'flush') || (rank === 'straightflush')) {
      // Keep the 4 that match
    }
  }

// 4 Card Straight Flush - inside draw
// 3 Card Royal
// Ten, Jack, Queen and King any suit
// 3 Card Straight Flush - sequential order
// 3 Card Straight Flush - non sequential order
// 2 Card Royal
// 4 Card Straight - non sequential - 3 high cards
// High cards - Ten thru Ace
  return 'Do whatever feels right. ';
}
