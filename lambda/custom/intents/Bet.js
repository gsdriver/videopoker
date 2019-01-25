//
// Handles betting coins
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();
const seedrandom = require('seedrandom');

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    // Can always handle with Stop and Cancel
    if ((request.type === 'IntentRequest') && game && (game.state === 'NEWGAME')) {
      return ((request.intent.name === 'BetIntent')
        || (request.intent.name === 'BetMaxIntent')
        || (request.intent.name === 'DealIntent')
        || (request.intent.name === 'AMAZON.YesIntent'));
    }

    return false;
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../' + event.request.locale + '/resources');
    let reprompt;
    let speechError;
    let speech = '';
    let amount;
    const game = attributes[attributes.currentGame];
    const rules = utils.getGame(attributes.currentGame);
    let amountValue;

    if (event.request.intent.name === 'BetMaxIntent') {
      // Set last bet to maximum
      game.lastbet = rules.maxCoins;
      attributes.firstBet = true;
    } else if (event.request.intent.slots
        && event.request.intent.slots.Amount
        && event.request.intent.slots.Amount.value) {
      // If the bet amount isn't an integer, we'll use the default value (1 unit)
      amountValue = event.request.intent.slots.Amount.value;
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
      speechError = res.strings.BET_EXCEEDS_MAX.replace('{0}', utils.readCoins(event.request.locale, rules.maxCoins));
      reprompt = res.strings.GENERIC_REPROMPT;
    } else if (amount > game.bankroll) {
      // Oops, you can't bet this much
      speechError = res.strings.BET_EXCEEDS_BANKROLL.replace('{0}', utils.readCoins(event.request.locale, game.bankroll));
      reprompt = res.strings.GENERIC_REPROMPT;
    }

    // If there is partial speech from a previous intent, append
    if (attributes.partialSpeech) {
      if (speechError) {
        speechError = attributes.partialSpeech + speechError;
      } else {
        speech = attributes.partialSpeech;
      }
      attributes.partialSpeech = undefined;
    }

    if (!speechError) {
      utils.incrementProgressive(attributes, amount);
      game.bet = amount;
      game.bankroll -= game.bet;

      // Mention the bet if it's the first bet or the bet changed
      if (attributes.firstBet || (amount != game.lastbet)) {
        speech += res.strings.BET_PLACED.replace('{0}', utils.readCoins(event.request.locale, amount));
        attributes.firstBet = undefined;
      }

      // Deal out 5 new cards
      initializeCards(event.session.user.userId, game);
      game.state = 'FIRSTDEAL';
      speech += res.strings.DEALT_CARDS.replace('{0}',
              ' <audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> ' +
              speechUtils.and(game.cards.map((card) => res.sayCard(card)),
                {preseparator: ' <audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> ',
                  locale: event.request.locale}));

      const rank = utils.determineWinner(attributes);
      if ((rules.payouts['royalflushnatural'] && (rank === 'royalflushnatural'))
          || (!rules.payouts['royalflushnatural'] && (rank === 'royalflush'))) {
        // Natural winner - mark all cards as held
        game.cards.map((card) => card.hold = true);
        reprompt = res.strings.BET_ROYAL_FLUSH;
      } else {
        reprompt = res.strings.BET_PLACED_REPROMPT;
      }

      speech += reprompt;
    }

    return handlerInput.responseBuilder
      .speak((speechError) ? speechError : speech)
      .reprompt(reprompt)
      .getResponse();
  },
};

function initializeCards(userId, game) {
  // Start by initializing the deck
  let i;
  const deck = [];
  const suits = ['C', 'D', 'H', 'S'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  ranks.map((rank) => {
    suits.map((item) => {
      deck.push({'rank': rank, 'suit': item});
    });
  });

  // Shuffle using the Fisher-Yates algorithm
  const start = Date.now();
  for (i = 0; i < deck.length - 1; i++) {
    const randomValue = seedrandom(i + userId + (game.timestamp ? game.timestamp : ''))();
    let j = Math.floor(randomValue * (deck.length - i));
    if (j == (deck.length - i)) {
      j--;
    }
    j += i;
    const tempCard = deck[i];
    deck[i] = deck[j];
    deck[j] = tempCard;
  }
  console.log('Shuffle took ' + (Date.now() - start) + ' ms');

  // Top 5 go into hand, next 5 in reserve
  game.cards = deck.slice(0, 5);
  game.cards.sort((a, b) => (ranks.indexOf(a.rank) - ranks.indexOf(b.rank)));
  game.reserve = deck.slice(6, 11);
}
