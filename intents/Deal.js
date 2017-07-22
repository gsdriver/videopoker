//
// Spins the wheel and determines the payouts!
//

'use strict';

const utils = require('../utils');
const speechUtils = require('alexa-speech-utils')();

module.exports = {
  handleIntent: function() {
    let speech = '';
    const res = require('../' + this.event.request.locale + '/resources');
    const game = this.attributes[this.attributes.currentGame];
    const rules = utils.getGame(this.attributes.currentGame);
    let i;
    const newCards = [];
    let newCard;

    // They shouldn't be able to get this far without a bet
    if (!game.bet) {
      this.handler.state = 'NEWGAME';
      utils.emitResponse(this.emit, this.event.request.locale,
          res.strings.DEAL_NOBETS, null, null,
          res.strings.DEAL_INVALID_REPROMPT);
      return;
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
              speechUtils.and(newCards.map((card) => res.sayCard(card)),
                {pause: '300ms', locale: this.event.request.locale}));
    }

    // OK, let's see if there's a payout associated with this
    const rank = utils.determineWinner(this.attributes);
    if (rules.payouts[rank] >= 50) {
      speech += '<audio src=\"https://s3-us-west-2.amazonaws.com/alexasoundclips/jackpot.mp3\"/> ';
      game.jackpot = (game.jackpot) ? (game.jackpot + 1) : 1;

      // Write the jackpot details, UNLESS it's a progressive payout
      // in which case we'll write it out once we know the amount
      if (!(rules.progressive && (rank == rules.progressive.match)
                    && (game.bet == rules.maxCoins))) {
        utils.writeJackpotDetails(this.event.session.user.userId,
            this.attributes.currentGame, rules.payouts[rank] * game.bet);
      }
    }

    // If you won the progressive, then ... wow, you rock!
    if (rules.progressive && (rank == rules.progressive.match)
          && (game.bet == rules.maxCoins)) {
      // OK, read the jackpot from the database
      utils.getProgressivePayout(this.attributes, (coinsWon) => {
        game.bankroll += coinsWon;
        speech += res.strings.DEAL_PROGRESSIVE_WINNER.replace('{0}', utils.readCoins(this.event.request.locale, coinsWon));
        utils.resetProgressive(this.attributes.currentGame);
        utils.writeJackpotDetails(this.event.session.user.userId,
              this.attributes.currentGame,
              coinsWon);
        this.handler.state = 'NEWGAME';
        updateGamePostPayout(this.event.request.locale, game, (speechText, reprompt) => {
          speech += speechText;
          utils.emitResponse(this.emit, this.event.request.locale,
                              null, null, speech, reprompt);
        });
      });
      return;
    }

    if (rules.payouts[rank]) {
      game.bankroll += rules.payouts[rank] * game.bet;
      speech += res.strings.DEAL_WINNER
          .replace('{0}', utils.readPayout(this.event.request.locale, rules, rank))
          .replace('{1}', utils.readCoins(this.event.request.locale, rules.payouts[rank] * game.bet));
    } else {
      speech += res.strings.DEAL_LOSER;
    }

    this.handler.state = 'NEWGAME';
    updateGamePostPayout(this.event.request.locale, game, (speechText, reprompt) => {
      speech += speechText;
      utils.emitResponse(this.emit, this.event.request.locale,
                          null, null, speech, reprompt);
    });
  },
};

function updateGamePostPayout(locale, game, callback) {
  const res = require('../' + locale + '/resources');
  let speech = '';
  let reprompt = res.strings.DEAL_PLAY_AGAIN;

  // If they have no units left, reset the bankroll
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
  callback(speech, reprompt);
}
