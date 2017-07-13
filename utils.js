//
// Utility functions
//

'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const speechUtils = require('alexa-speech-utils')();
const pokerrank = require('poker-ranking');

const games = {
  'jacks': {
    'maxCoins': 5,
    'minPair': 'J',
    'progressive': {
      'start': 4000,
      'rate': 0.25,
      'match': 'royalflush',
    },
    'payouts': {
      'royalflush': 250,
      'straightflush': 50,
      '4ofakind': 25,
      'fullhouse': 9,
      'flush': 6,
      'straight': 4,
      '3ofakind': 3,
      '2pair': 2,
      'minpair': 1,
    },
    'suggest': suggestJacksOrBetter,
  },
  'deuces': {
    'maxCoins': 5,
    'special': 'WILD_SPECIAL',
    'wildCards': ['2'],
    'progressive': {
      'start': 4000,
      'rate': 0.25,
      'match': 'royalflushnatural',
    },
    'payouts': {
      'royalflushnatural': 250,
      '4wild': 200,
      'royalflush': 25,
      '5ofakind': 15,
      'straightflush': 9,
      '4ofakind': 5,
      'fullhouse': 3,
      'flush': 2,
      'straight': 2,
      '3ofakind': 1,
    },
    'suggest': suggestDeucesWild,
  },
};

module.exports = {
  emitResponse: function(emit, locale, error, response, speech, reprompt) {
    if (error) {
      const res = require('./' + locale + '/resources');
      console.log('Speech error: ' + error);
      emit(':ask', error, res.GENERIC_REPROMPT);
    } else if (response) {
      emit(':tell', response);
    } else {
      emit(':ask', speech, reprompt);
    }
  },
  getGame: function(name) {
    return games[name];
  },
  determineWinner: function(attributes) {
    const game = attributes[attributes.currentGame];
    const rules = games[attributes.currentGame];
    let rank;
    const evaluateOptions = {};

    evaluateOptions.aceCanBeLow = true;
    if (rules.wildCards) {
      evaluateOptions.wildCards = rules.wildCards;
    }
    if (rules.minPair) {
      evaluateOptions.minPair = rules.minPair;
    }
    rank = pokerrank.evaluateHand(game.cards.map((card) => card.rank + card.suit), evaluateOptions);

    // Override for some special cases
    if (rules.payouts['royalflushnatural']) {
      if (rank === 'royalflush') {
        // If it's a natural, then mark as such
        let hasWild = false;

        game.cards.map((card) => {
          if (rules.wildCards.indexOf(card.rank) > -1) {
            hasWild = true;
          }
        });
        if (!hasWild) {
          rank = 'royalflushnatural';
        }
      }
    }
    if (rules.payouts['4wild']) {
      if (rank === '5ofakind') {
        // If this is really 4 wild cards, mark it as such
        let numWild = 0;

        game.cards.map((card) => {
          if (rules.wildCards.indexOf(card.rank) > -1) {
            numWild++;
          }
        });

        if (numWild === 4) {
          rank = '4wild';
        }
      }
    }

    return rank;
  },
  getSelectedCards: function(locale, attributes, slots) {
    const res = require('./' + locale + '/resources');
    let index;
    const game = attributes[attributes.currentGame];

    // You can say the card in lots of different ways
    if (slots.CardNumber && slots.CardNumber.value) {
      index = parseInt(slots.CardNumber.value);
      if (isNaN(index) || (index < 1) || (index > 5)) {
        return [];
      } else {
        return [index];
      }
    }
    if (slots.CardOrdinal && slots.CardOrdinal.value) {
      return res.ordinalMapping(slots.CardOrdinal.value);
    }
    if (slots.CardRank && slots.CardRank.value) {
      const foundCards = [];
      const rank = res.getRank(slots.CardRank.value);
      if (slots.CardSuit && slots.CardSuit.value) {
        const suit = res.getSuit(slots.CardSuit.value);

        // Make sure this is in the hand
        for (index = 0; index < game.cards.length; index++) {
          if ((game.cards[index].rank === rank) && (game.cards[index].suit === suit)) {
            foundCards.push(index + 1);
          }
        }
      } else {
        // Select all cards of this rank
        for (index = 0; index < game.cards.length; index++) {
          if (game.cards[index].rank === rank) {
            foundCards.push(index + 1);
          }
        }
      }

      return foundCards;
    }
  },
  // Returns the text of what they asked for
  getCardSlotText: function(locale, slots) {
    const res = require('./' + locale + '/resources');

    // You can say the card in lots of different ways
    if (slots.CardNumber && slots.CardNumber.value) {
      return slots.CardNumber.value;
    }
    if (slots.CardOrdinal && slots.CardOrdinal.value) {
      return slots.CardOrdinal.value;
    }
    if (slots.CardRank && slots.CardRank.value) {
      const rank = res.getRank(slots.CardRank.value);
      if (slots.CardSuit && slots.CardSuit.value) {
        const suit = res.getSuit(slots.CardSuit.value);
        const card = res.sayCard({rank: rank, suit: suit});

        // Let's see if we can say this card
        if (card) {
          return card;
        } else {
          // Just spit back what they said
          return (slots.CardRank.value + ' ' + slots.CardSuit.value);
        }
      } else {
        return slots.CardRank.value;
      }
    }

    // Didn't find anything
    return undefined;
  },
  readAvailableGames: function(locale, currentGame, currentFirst, callback) {
    const res = require('./' + locale + '/resources');
    let speech;
    const choices = [];
    const choiceText = [];
    let game;
    let count = 0;

    for (game in games) {
      if (game) {
        count++;
        // Put the last played game at the front of the list
        if (game != currentGame) {
         choices.push(game);
         choiceText.push(res.sayGame(game));
       }
      }
    }

    // And now the current game - either first or last in the list
    if (currentGame && games[currentGame]) {
      if (currentFirst) {
        choices.unshift(currentGame);
        choiceText.unshift(res.sayGame(currentGame));
      } else {
         choices.push(currentGame);
         choiceText.push(res.sayGame(currentGame));
      }
    }

    speech = res.strings.AVAILABLE_GAMES.replace('{0}', count);
    speech += speechUtils.and(choiceText, {locale: locale});
    speech += '. ';
    callback(speech, choices);
  },
  readAvailableActions(locale, attributes, state) {
    const res = require('./' + locale + '/resources');
    const game = attributes[attributes.currentGame];
    let speech;
    const actions = [];

    switch (state) {
      case 'SELECTGAME':
        actions.push(res.strings.SAY_YES);
        actions.push(res.strings.SAY_NO);
        actions.push(res.strings.SAY_HIGHSCORE);
        break;
      case 'NEWGAME':
        actions.push(res.strings.SAY_BET);
        actions.push(res.strings.SAY_DEAL);
        actions.push(res.strings.SAY_HIGHSCORE);
        break;
      case 'FIRSTDEAL':
        let held = 0;
        game.cards.map((card) => held += (card.hold) ? 1 : 0);
        if (held < 5) {
          actions.push(res.strings.SAY_HOLD);
        }
        if (held) {
          actions.push(res.strings.SAY_DISCARD);
        }
        actions.push(res.strings.SAY_DEAL);
        actions.push(res.strings.SAY_HIGHSCORE);
        break;
      default:
        speech = '';
        break;
    }

    if (actions.length) {
      speech = res.strings.YOU_CAN_SAY
        .replace('{0}', speechUtils.or(actions, {locale: locale, pause: '200ms'}));
    }
    return speech;
  },
  readCoins: function(locale, coins) {
    const res = require('./' + locale + '/resources');
    return speechUtils.numberOfItems(coins, res.strings.SINGLE_COIN, res.strings.PLURAL_COIN);
  },
  readPayout: function(locale, game, payout) {
    const res = require('./' + locale + '/resources');
    return (res.readPayoutHand(payout) + ' <break time=\"200ms\"/> ');
  },
  readPayoutTable: function(locale, game) {
    const res = require('./' + locale + '/resources');
    let text = '';
    let payout;
    let i;

    for (i = 0; i < (game.wild ? game.wild.length : 0); i++) {
      text += res.strings.WILD_SYMBOL.replace('{0}', res.saySymbol(game.wild[i]));
      text += '\n';
    }

    for (payout in game.payouts) {
      if (payout) {
        // Special case if it's the progressive
        text += res.readPayoutHand(payout) + ' ';
        text += readPayoutAmountInternal(locale, game, payout);
        text += '\n';
      }
    }

    return text;
  },
  readPayoutAmount: function(locale, game, payout) {
    return readPayoutAmountInternal(locale, game, payout);
  },
  readLeaderBoard: function(locale, attributes, callback) {
    const res = require('./' + locale + '/resources');
    const game = attributes[attributes.currentGame];

    getTopScoresFromS3(attributes, (err, scores) => {
      let speech = '';

      // OK, read up to five high scores
      if (!scores || (scores.length === 0)) {
        // No scores to read
        speech = res.strings.LEADER_NO_SCORES;
      } else {
        // What is your ranking - assuming you've done a spin
        if (game.spins > 0) {
          const ranking = scores.indexOf(game.high) + 1;

          speech += res.strings.LEADER_RANKING
            .replace('{0}', game.high)
            .replace('{1}', res.sayGame(attributes.currentGame))
            .replace('{2}', ranking)
            .replace('{3}', scores.length);
        }

        // And what is the leader board?
        const toRead = (scores.length > 5) ? 5 : scores.length;
        const topScores = scores.slice(0, toRead).map((x) => res.strings.LEADER_FORMAT.replace('{0}', x));
        speech += res.strings.LEADER_TOP_SCORES.replace('{0}', toRead);
        speech += speechUtils.and(topScores, {locale: locale, pause: '300ms'});
      }

      callback(speech);
    });
  },
  getProgressivePayout: function(attributes, callback) {
    const rules = games[attributes.currentGame];

    // If there is no progressive for this game, just return undefined
    if (rules && rules.progressive) {
      // Read from Dynamodb
      dynamodb.getItem({TableName: 'VideoPoker', Key: {userId: {S: 'game-' + attributes.currentGame}}},
              (err, data) => {
        if (err || (data.Item === undefined)) {
          console.log(err);
          callback((attributes[attributes.currentGame].progressiveJackpot)
                ? attributes[attributes.currentGame].progressiveJackpot
                : rules.progressive.start);
        } else {
          let coins;

          if (data.Item.coins && data.Item.coins.N) {
            coins = parseInt(data.Item.coins.N);
          } else {
            coins = rules.progressive.start;
          }

          callback(Math.floor(rules.progressive.start + (coins * rules.progressive.rate)));
        }
      });
    } else {
      callback(undefined);
    }
  },
  incrementProgressive: function(attributes, coinsToAdd) {
    if (games[attributes.currentGame].progressive) {
      const params = {
          TableName: 'VideoPoker',
          Key: {userId: {S: 'game-' + attributes.currentGame}},
          AttributeUpdates: {coins: {
              Action: 'ADD',
              Value: {N: coinsToAdd.toString()}},
          }};

      dynamodb.updateItem(params, (err, data) => {
        if (err) {
          console.log(err);
        }
      });
    }
  },
  // Updates DynamoDB to note that the progressive was won!
  // Note this function does not callback
  resetProgressive: function(game) {
    // Write to the DB, and reset the coins played to 0
    dynamodb.putItem({TableName: 'VideoPoker',
        Item: {userId: {S: 'game-' + game}, coins: {N: '0'}}},
        (err, data) => {
      // We don't take a callback, but if there's an error log it
      if (err) {
        console.log(err);
      }
    });
  },
  // Write jackpot details to S3
  writeJackpotDetails: function(userId, game, jackpot) {
    // It's not the same, so try to write it out
    const details = {userId: userId, amount: jackpot};
    const params = {Body: JSON.stringify(details),
      Bucket: 'garrett-alexa-usage',
      Key: 'jackpots/videopoker/' + game + '-' + Date.now() + '.txt'};

    s3.putObject(params, (err, data) => {
      // Don't care about teh error
      if (err) {
        console.log(err, err.stack);
      }
      // Update number of progressive wins while you're at it
      dynamodb.updateItem({TableName: 'VideoPoker',
          Key: {userId: {S: 'game-' + game}},
          AttributeUpdates: {jackpots: {
              Action: 'ADD',
              Value: {N: '1'}},
      }}, (err, data) => {
        // Again, don't care about the error
        if (err) {
          console.log(err);
        }
      });
    });
  },
  saveNewUser: function() {
    // Brand new player - let's log this in our DB (async call)
    const params = {
              TableName: 'VideoPoker',
              Key: {userId: {S: 'game'}},
              AttributeUpdates: {newUsers: {
                  Action: 'ADD',
                  Value: {N: '1'}},
              }};

    dynamodb.updateItem(params, (err, data) => {
      if (err) {
        console.log(err);
      }
    });
  },
};

function readPayoutAmountInternal(locale, game, payout) {
  let text;
  const res = require('./' + locale + '/resources');

  if (game.progressive && (game.progressive.match === payout)) {
    text = res.strings.PAYOUT_PROGRESSIVE;
  } else {
    text = res.strings.PAYOUT_PAYS.replace('{0}', game.payouts[payout]);
  }

  return text;
}

function getTopScoresFromS3(attributes, callback) {
  const game = attributes[attributes.currentGame];

  // Read the S3 buckets that has everyone's scores
  s3.getObject({Bucket: 'garrett-alexa-usage', Key: 'VideoPokerScores.txt'}, (err, data) => {
    if (err) {
      console.log(err, err.stack);
      callback(err, null);
    } else {
      // Yeah, I can do a binary search (this is sorted), but straight search for now
      const ranking = JSON.parse(data.Body.toString('ascii'));
      const scores = ranking.scores;

      if (scores && scores[attributes.currentGame]) {
        // If their current high score isn't in the list, add it
        if (scores[attributes.currentGame].indexOf(game.high) < 0) {
          scores[attributes.currentGame].push(game.high);
        }

        callback(null, scores[attributes.currentGame].sort((a, b) => (b - a)));
      } else {
        console.log('No scores for ' + attributes.currentGame);
        callback('No scoreset', null);
      }
    }
  });
}

// From http://www.thegamblersedge.com/vpoker/vpokerstrat96JoB.htm
function suggestJacksOrBetter(locale, attributes) {
  const game = attributes[attributes.currentGame];
  const rules = games[attributes.currentGame];
  const evaluateOptions = {};
  const res = require('./' + locale + '/resources');
  let i;
  let j;
  const evalCards = game.cards.map((card) => card.rank + card.suit);
  const royalRank = ['10', 'J', 'Q', 'K', 'A'];

  // See if they have a made hand
  evaluateOptions.aceCanBeLow = true;
  evaluateOptions.getDetails = true;
  if (rules.wildCards) {
    evaluateOptions.wildCards = rules.wildCards;
  }
  if (rules.minPair) {
    evaluateOptions.minPair = rules.minPair;
  }
  const fullHandRank = pokerrank.evaluateHand(evalCards, evaluateOptions);

  // Royal Flush
  // Straight Flush
  // 4 of a Kind
  if ((fullHandRank.match === 'royalflush') || (fullHandRank.match === 'straightflush')
      || (fullHandRank.match === '4ofakind')) {
    return sayCardsToHold(locale, fullHandRank.cards);
  }

  // 4 Card Royal
  evaluateOptions.cardsToEvaluate = 4;
  const fourHandRank = pokerrank.evaluateHand(evalCards, evaluateOptions);
  if (fourHandRank.match === 'royalflush') {
    return sayCardsToHold(locale, fourHandRank.cards);
  }

  // Full House
  // Flush
  // 3 of a Kind
  // Straight
  if ((fullHandRank.match === 'fullhouse') || (fullHandRank.match === 'flush')
    || (fullHandRank.match === 'straight') || (fullHandRank.match === '3ofakind')) {
    return sayCardsToHold(locale, fullHandRank.cards);
  }

  // 4 Card Straight Flush - open both ends
  // Two Pairs
  if (fourHandRank.match === 'straightflush') {
    return sayCardsToHold(locale, fourHandRank.cards);
  }

  // Two Pairs
  if (fullHandRank.match === '2pair') {
    return sayCardsToHold(locale, fullHandRank.cards);
  }

  // 4 Card Straight Flush - inside draw
  if (fourHandRank.match === 'flush') {
    for (i = 0; i < game.cards.length; i++) {
      if (game.cards[i].suit !== fourHandRank.cards[0].suit) {
        evaluateOptions.wildCards = [game.cards[i].rank + game.cards[i].suit];
      }
    }
    evaluateOptions.cardsToEvaluate = 5;
    if (pokerrank.evaluateHand(evalCards, evaluateOptions).match === 'straightflush') {
      return sayCardsToHold(locale, fourHandRank.cards);
    }
  }

  // Pair of Jacks, Queens, Kings or Aces
  if (fullHandRank.match === 'minpair') {
    return sayCardsToHold(locale, fullHandRank.cards);
  }

  // 3 Card Royal
  evaluateOptions.cardsToEvaluate = 3;
  evaluateOptions.wildCards = [];
  const threeHandRank = pokerrank.evaluateHand(evalCards, evaluateOptions);
  if ((threeHandRank.match === 'flush') || (threeHandRank.match === 'royalflush')) {
    // Make sure these cards are royal
    let royalCount = 0;
    const royalCards = ['1', 'J', 'Q', 'K', 'A'];

    threeHandRank.cards.map((card) => {
      if (royalCards.indexOf(card.substring(0, 1)) > -1) {
        royalCount++;
      }
    });
    if (royalCount === 3) {
      return sayCardsToHold(locale, threeHandRank.cards);
    }
  }

  // 4 Card Flush
  if (fourHandRank.match === 'flush') {
    return sayCardsToHold(locale, fourHandRank.cards);
  }

  // Ten, Jack, Queen and King any suit
  if (fourHandRank.match === 'straight') {
    const keepers = ['10', 'J', 'Q', 'K'];
    let toKeep = 0;

    game.cards.map((card) => {
      if (keepers.indexOf(card.rank) > -1) {
        toKeep++;
      }
    });

    if (toKeep === 4) {
      return sayCardsToHold(locale, fourHandRank.cards);
    }
  }

  // Low Pair - Two through Ten
  if (fullHandRank.match === 'pair') {
    return sayCardsToHold(locale, fullHandRank.cards);
  }

  // 4 Card Straight - sequential order
  if (fourHandRank.match === 'straight') {
    return sayCardsToHold(locale, fourHandRank.cards);
  }

  // 3 Card Straight Flush - sequential order
  if (threeHandRank.match === 'straightflush') {
    return sayCardsToHold(locale, threeHandRank.cards);
  }

  // 4 Card Straight - non sequential order
  // Mark each card wild and see if we hit a straight
  // Note if we got this far, we don't have a pair
  const holdCards = [];
  evaluateOptions.cardsToEvaluate = 5;
  for (i = 0; i < game.cards.length; i++) {
    evaluateOptions.wildCards = [game.cards[i].rank + game.cards[i].suit];
    if (pokerrank.evaluateHand(evalCards, evaluateOptions).match === 'straight') {
      // This is the card to discard - so hold the others
      for (j = 0; j < game.cards.length; j++) {
        if (j !== i) {
          holdCards.push(game.cards[j]);
        }
      }
      break;
    }
  }
  if (holdCards.length) {
    return sayCardsToHold(locale, holdCards.map((card) => card.rank + card.suit));
  }

  // 3 Card Straight Flush - non sequential order
  if (threeHandRank.match === 'flush') {
    // Is it also a non-sequential straight?  Mark the non-flush cards wild and see what happens
    const flushSuit = threeHandRank.cards[0].substring(threeHandRank.cards[0].length - 1,
                  threeHandRank.cards[0].length);

    evaluateOptions.wildCards = [];
    for (i = 0; i < game.cards.length; i++) {
      if (game.cards[i].suit !== flushSuit) {
        evaluateOptions.wildCards.push(game.cards[i].rank + game.cards[i].suit);
      }
    }
    evaluateOptions.cardsToEvaluate = 5;
    if (pokerrank.evaluateHand(evalCards, evaluateOptions).match === 'straightflush') {
      return sayCardsToHold(locale, threeHandRank.cards);
    }
  }

  // 2 Card Royal
  evaluateOptions.cardsToEvaluate = 2;
  evaluateOptions.wildCards = [];
  const twoHandRank = pokerrank.evaluateHand(evalCards, evaluateOptions);
  if (twoHandRank.match === 'royalflush') {
    return sayCardsToHold(locale, twohandRank.cards);
  }

  // 4 Card Straight - non sequential - 3 high cards (isn't this caught above?)

  // 3 High Cards - Ten through Ace
  // 2 High Cards - Ten through Ace
  // 1 High Card - Ten through Ace
  const highCards = [];
  game.cards.map((card) => {
    if (royalRank.indexOf(card.rank) > -1) {
      highCards.push(card);
    }
  });
  if (highCards.length > 0) {
    return sayCardsToHold(locale, highCards.map((card) => card.rank + card.suit));
  }

  // Nothing
  return res.strings.SUGGEST_DISCARD_ALL;
}

function sayCardsToHold(locale, evalCards) {
  const res = require('./' + locale + '/resources');
  let result;
  const cards = [];

  evalCards.map((card) => {
    if (card.substring(0, 2) === '10') {
      cards.push({rank: '10', suit: card.substring(2, 3)});
    } else {
      cards.push({rank: card.substring(0, 1), suit: card.substring(1, 2)});
    }
  });

  if (cards.length === 5) {
    result = res.strings.SUGGEST_HOLD_ALL;
  } else if (cards.length > 1) {
    let match = cards[0].rank;

    cards.map((card) => {
      if (card.rank !== match) {
        match = undefined;
      }
    });

    if (match) {
      result = res.strings.SUGGEST_HOLD_MATCHING.replace('{0}', res.pluralCardRanks(cards[0]));
    }
  }

  // Two pairs?
  if (!result && (cards.length === 4)) {
    // Is this two and two?
    const pairOne = [];
    const pairTwo = [];

    cards.map((card) => {
      if (pairOne.length > 0) {
        if (card.rank === pairOne[0].rank) {
          pairOne.push(card);
        } else if (!pairTwo.length
            || (card.rank === pairTwo[0].rank)) {
          pairTwo.push(card);
        }
      } else {
        pairOne.push(card);
      }
    });

    if ((pairOne.length === 2) && (pairTwo.length === 2)) {
      result = res.strings.SUGGEST_HOLD_MATCHING.replace('{0}',
            speechUtils.and([res.pluralCardRanks(pairOne[0]),
                res.pluralCardRanks(pairTwo[0])], {locale: locale}));
    }
  }

  if (!result) {
    result = res.strings.SUGGEST_HOLD_CARDS.replace('{0}', speechUtils.and(
              cards.map((card) => res.sayCard(card)), {locale: locale}));
  }

  return result;
}

function suggestDeucesWild(locale, attributes) {
  return 'Do whatever feels right. ';
}
