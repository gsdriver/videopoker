//
// Spins the wheel and determines the payouts!
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();
const request = require('request');

module.exports = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const game = attributes[attributes.currentGame];

    // Can always handle with Stop and Cancel
    return ((request.type === 'IntentRequest') && game && (game.state === 'FIRSTDEAL')
      && !game.suggestedHold
      && ((request.intent.name === 'DealIntent')
        || (request.intent.name === 'AMAZON.YesIntent')
        || (request.intent.name === 'AMAZON.NextIntent')));
  },
  handle: function(handlerInput) {
    const event = handlerInput.requestEnvelope;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const res = require('../' + event.request.locale + '/resources');
    const game = attributes[attributes.currentGame];
    let speech = '';
    const rules = utils.getGame(attributes.currentGame);
    let i;
    const newCards = [];
    let newCard;
    let result;

    // They shouldn't be able to get this far without a bet
    if (!game.bet) {
      game.state = 'NEWGAME';
      return handlerInput.responseBuilder
        .speak(res.strings.DEAL_NOBETS)
        .reprompt(res.strings.DEAL_INVALID_REPROMPT)
        .getResponse();
    }

    // Discard the non-held cards and replace from the deck
    for (i = 0; i < game.cards.length; i++) {
      if (!game.cards[i].hold) {
        newCard = game.reserve.pop();
        game.cards[i] = newCard;
        newCards.push(newCard);
      }
    }

    // Read the cards that were dealt (if any)
    if (newCards.length > 0) {
      speech += res.strings.DEALT_CARDS.replace('{0}',
              ' <audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> ' +
              speechUtils.and(newCards.map((card) => res.sayCard(card)),
                {preseparator: ' <audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/dealcard.mp3\"/> ',
                  locale: event.request.locale}));
    }

    // OK, let's see if there's a payout associated with this
    const rank = utils.determineWinner(attributes);
    if (rules.payouts[rank] >= 50) {
      // Can only have five sounds per response
      if (newCards.length < 5) {
        speech += ' <audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/jackpot.mp3\"/> ';
      }
      game.jackpot = (game.jackpot) ? (game.jackpot + 1) : 1;

      // Write the jackpot details, UNLESS it's a progressive payout
      // in which case we'll write it out once we know the amount
      if (!(rules.progressive && (rank == rules.progressive.match)
                    && (game.bet == rules.maxCoins))) {
        const params = {
          url: process.env.SERVICEURL + 'videopoker/updateJackpot',
          formData: {
            jackpot: rules.payouts[rank] * game.bet,
            game: attributes.currentGame,
            userId: event.session.user.userId,
          },
        };
        request.post(params, (err, res, body) => {
        });
      }
    }

    // If you won the progressive, then ... wow, you rock!
    if (rules.progressive && (rank == rules.progressive.match)
          && (game.bet == rules.maxCoins)) {
      // OK, read the jackpot from the database
      return utils.getProgressivePayout(attributes)
      .then((coinsWon) => {
        game.bankroll += coinsWon;
        speech += res.strings.DEAL_PROGRESSIVE_WINNER.replace('{0}', utils.readCoins(event.request.locale, coinsWon));

        const params = {
          url: process.env.SERVICEURL + 'videopoker/updateJackpot',
          formData: {
            jackpot: coinsWon,
            game: attributes.currentGame,
            userId: event.session.user.userId,
            resetProgressive: 'true',
          },
        };
        request.post(params, (err, res, body) => {
        });

        game.state = 'NEWGAME';
        result = updateGamePostPayout(event.request.locale, game);
        speech += result.speech;
        return handlerInput.responseBuilder
          .speak(speech)
          .reprompt(result.reprompt)
          .getResponse();
      });
    }

    if (rules.payouts[rank]) {
      game.bankroll += rules.payouts[rank] * game.bet;
      speech += res.strings.DEAL_WINNER
          .replace('{0}', utils.readPayout(event.request.locale, rules, rank))
          .replace('{1}', utils.readCoins(event.request.locale, rules.payouts[rank] * game.bet));
    } else {
      speech += res.strings.DEAL_LOSER;
    }

    game.state = 'NEWGAME';
    result = updateGamePostPayout(event.request.locale, game);
    speech += result.speech;
    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt(result.reprompt)
      .getResponse();
  },
};

function updateGamePostPayout(locale, game) {
  const res = require('../' + locale + '/resources');
  let speech = '';
  let reprompt = res.strings.DEAL_PLAY_AGAIN;

  // If they have no units left, reset the bankroll
  game.suggestedHold = undefined;
  game.lastbet = game.bet;
  if (game.bankroll < 1) {
    game.bankroll = 1000;
    game.lastbet = undefined;
    speech += res.strings.DEAL_BUSTED;
    reprompt = res.strings.DEAL_BUSTED_REPROMPT;
  } else {
    if (game.bankroll < game.lastbet) {
      // They still have money left, but if they don't have enough to support
      // the last set of bets again, then reset it to whatever is left
      game.lastbet = game.bankroll;
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
  game.bet = undefined;
  speech += reprompt;
  return {speech: speech, reprompt: reprompt}
}
