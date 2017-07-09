//
// Spins the wheel and determines the payouts!
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  handleIntent: function() {
    // When you spin, you either have to have bets or prior bets
    let bet;
    let speechError;
    let speech = '';
    const res = require('../' + this.event.request.locale + '/resources');
    const game = this.attributes[this.attributes.currentGame];
    const rules = utils.getGame(this.attributes.currentGame);
    let i;
    let newCards;

    if (!game.bet && !game.lastbet) {
      speechError = res.strings.SPIN_NOBETS;
      utils.emitResponse(this.emit, this.event.request.locale, speechError,
          null, speech, res.strings.SPIN_INVALID_REPROMPT);
    } else {
      if (game.bet) {
        bet = game.bet;
      } else if (game.lastbet) {
        // They want to re-use the same bets they did last time - make sure there
        // is enough left in the bankroll and update the bankroll before we spin
        if (game.lastbet > game.bankroll) {
          speechError = res.strings.SPIN_CANTBET_LASTBETS.replace('{0}', utils.readCoins(game.bankroll));
          utils.emitResponse(this.emit, this.event.request.locale,
            speechError, null, speech, res.strings.SPIN_INVALID_REPROMPT);
          return;
        } else {
          bet = game.lastbet;
          game.bankroll -= game.lastbet;
        }
      }

      // What we do depends on whether this is the first or second spin
      if (this.handler.state === 'NEWGAME') {
        // Deal out 5 new cards
        initializeCards(game);
        for (i = 0; i < 5; i++) {
          game.cards = game.deck.pop();
        }
        newCards = game.cards;
      } else {
        // Discard the non-held cards and replace from the deck
        newCards = [];
      }

      // Read the cards
      speech += res.strings.DEALT_CARDS.replace('{0}',
              speechUtils.and(newCards.map((card) => res.sayCard(card)),
                {locale: this.event.request.locale}));

      // Time to determine payout?
      if (this.handler.state === 'FIRSTDEAL') {
        utils.determinePayout(this.attributes, bet, (amount, payout) => {
          if (amount >= (50 * bet)) {
            speech += '<audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/jackpot.mp3\"/> ';
            game.jackpot = (game.jackpot) ? (game.jackpot + 1) : 1;
            utils.writeJackpotDetails(this.event.session.user.userId,
                this.attributes.currentGame, amount);
          }
        });
      }

      // Now let's determine the payouts
      let matchedPayout;

      if (matchedPayout) {
        game.bankroll += (bet * rules.payouts[matchedPayout]);
        speech += res.strings.SPIN_WINNER.replace('{0}', utils.readPayout(this.event.request.locale, rules, matchedPayout)).replace('{1}', utils.readCoins(this.event.request.locale, bet * rules.payouts[matchedPayout]));
      } else {
        // Sorry, you lost
        speech += res.strings.SPIN_LOSER;
      }

      // If they have no units left, reset the bankroll
      if (game.bankroll < 1) {
        game.bankroll = 1000;
        lastbet = undefined;
        speech += res.strings.SPIN_BUSTED;
        reprompt = res.strings.SPIN_BUSTED_REPROMPT;
      } else {
        if (game.bankroll < lastbet) {
          // They still have money left, but if they don't have enough to support
          // the last set of bets again, then reset it to 1 coin
          lastbet = 1;
        }

        speech += res.strings.READ_BANKROLL.replace('{0}', utils.readCoins(locale, game.bankroll));
      }

      // Keep track of spins
      game.timestamp = Date.now();
      game.spins = (game.spins === undefined) ? 1 : (game.spins + 1);

      // Is this a new high for this game?
      if (game.bankroll > game.high) {
        // Just track for now...
        game.high = game.bankroll;
      }

      // And reprompt
      game.lastbet = lastbet;
      game.bet = undefined;
      speech += reprompt;
      utils.emitResponse(this.emit, this.event.request.locale,
                          null, null, speech, reprompt);
    }
  },
};

function initializeCards(game) {
  // Start by initializing the deck
  let i;
  let rank;
  const deck = [];
  const suits = ['C', 'D', 'H', 'S'];
  const ranks = ['0', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  for (rank = 1; rank <= 13; rank++) {
    suits.map((item) => {
      deck.push({'rank': ranks[rank], 'suit': item});
    });
  }

  // OK, let's shuffle the deck - we'll do this by going thru
  // 520 of cards times, and swap random pairs each iteration
  // Yeah, there are probably more elegant solutions but this should do the job
  for (i = 0; i < 520; i++) {
    const card1 = Math.floor(Math.random() * 52);
    const card2 = Math.floor(Math.random() * 52);
    const tempCard = game.deck.cards[card1];

    deck[card1] = deck[card2];
    deck[card2] = tempCard;
  }

  // After that, we only need the top 10 cards
  game.cards = deck.slice(0, 10);
}
