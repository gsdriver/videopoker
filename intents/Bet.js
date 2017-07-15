//
// Handles betting coins
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  handleIntent: function() {
    // The bet amount is optional - if not present we will use a default value
    // of either the last bet amount or 1 unit
    let reprompt;
    let speechError;
    let speech;
    let amount;
    const res = require('../' + this.event.request.locale + '/resources');
    const game = this.attributes[this.attributes.currentGame];
    const rules = utils.getGame(this.attributes.currentGame);
    let amountValue;

    // Default to one coin
    if (this.event.request.intent.slots
        && this.event.request.intent.slots.Amount
        && this.event.request.intent.slots.Amount.value) {
      // If the bet amount isn't an integer, we'll use the default value (1 unit)
      amountValue = this.event.request.intent.slots.Amount.value;
      amount = parseInt(amountValue);
    } else if (game.lastbet) {
      amount = game.lastbet;
    } else {
      amount = 1;
    }

    if (isNaN(amount) || (amount == 0)) {
      speechError = res.strings.BET_INVALID_AMOUNT.replace('{0}', amountValue);
      reprompt = res.strings.GENERIC_REPROMPT;
    } else if (amount > rules.maxCoins) {
      speechError = res.strings.BET_EXCEEDS_MAX.replace('{0}', utils.readCoins(this.event.request.locale, rules.maxCoins));
      reprompt = res.strings.GENERIC_REPROMPT;
    } else if (amount > game.bankroll) {
      // Oops, you can't bet this much
      speechError = res.strings.BET_EXCEEDS_BANKROLL.replace('{0}', utils.readCoins(this.event.request.locale, game.bankroll));
      reprompt = res.strings.GENERIC_REPROMPT;
    }

    if (!speechError) {
      game.bet = amount;
      game.bankroll -= game.bet;
      speech = res.strings.BET_PLACED.replace('{0}', utils.readCoins(this.event.request.locale, amount));

      // Deal out 5 new cards
      initializeCards(game);
      this.handler.state = 'FIRSTDEAL';
      speech += res.strings.DEALT_CARDS.replace('{0}',
              speechUtils.and(game.cards.map((card) => res.sayCard(card)),
                {pause: '300ms', locale: this.event.request.locale}));

      reprompt = res.strings.BET_PLACED_REPROMPT;
      speech += reprompt;
    }

    utils.emitResponse(this.emit, this.event.request.locale, speechError, null, speech, reprompt);
  },
  handleMaxIntent: function() {
    const game = this.attributes[this.attributes.currentGame];
    const rules = utils.getGame(this.attributes.currentGame);

    // Set last bet and forward
    game.lastbet = rules.maxCoins;
    this.emitWithState('BetIntent');
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

    const tempCard = deck[card1];
    deck[card1] = deck[card2];
    deck[card2] = tempCard;
  }

  // Top 5 go into hand, next 5 in reserve
  game.cards = deck.slice(0, 5);
  game.reserve = deck.slice(6, 11);
}
