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
const logger = require('alexa-logger');

// Global session ID
let globalEvent;

const games = {
  'jacks': {
    'maxCoins': 5,
    'special': 'JACKS_SPECIAL',
    'help': 'HELP_CARD_TEXT_JACKS',
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
    'special': 'DEUCES_SPECIAL',
    'help': 'HELP_CARD_TEXT_DEUCES',
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
  emitResponse: function(emit, locale, error, response, speech, reprompt, cardTitle, cardText) {
    let numCalls = 0;

    // Save to S3 if environment variable is set
    if (process.env.SAVELOG) {
      numCalls++;
      const result = (error) ? error : ((response) ? response : speech);
        logger.saveLog(globalEvent, result,
        {bucket: 'garrett-alexa-logs', keyPrefix: 'videopoker/', fullLog: true},
        (err) => {
        if (err) {
          console.log(err, err.stack);
        }

        if (--numCalls === 0) {
          emitResult();
        }
      });
    }

    if (response) {
      // Save state
      numCalls++;
      const doc = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
      doc.put({TableName: 'VideoPoker',
          Item: {userId: globalEvent.session.user.userId,
                mapAttr: globalEvent.session.attributes}},
          (err, data) => {
        if (--numCalls === 0) {
          emitResult();
        }
      });
    }

    if (!numCalls) {
      emitResult();
    }

    function emitResult() {
      if (!process.env.NOLOG) {
        console.log(JSON.stringify(globalEvent));
      }

      if (error) {
        const res = require('./' + locale + '/resources');
        console.log('Speech error: ' + error);
        emit(':ask', error, res.ERROR_REPROMPT);
      } else if (response) {
        emit(':tell', response);
      } else if (cardTitle) {
        emit(':askWithCard', speech, reprompt, cardTitle, cardText);
      } else {
        emit(':ask', speech, reprompt);
      }
    }
  },
  setEvent: function(event) {
    globalEvent = event;
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
  getSelectedCards: function(locale, attributes, holding, slots) {
    const res = require('./' + locale + '/resources');
    let index;
    const game = attributes[attributes.currentGame];
    const cardIndex = [];
    const slotValues = ['FirstCard', 'SecondCard', 'ThirdCard', 'FourthCard', 'FifthCard'];
    let error;

    slotValues.map((slot) => {
      if (slots[slot] && slots[slot].value) {
        const ordinal = res.ordinalMapping(slots[slot].value);
        const card = res.getCardFromString(slots[slot].value);

        if (ordinal) {
          cardIndex.push(ordinal);
        } else if (card) {
          const foundCards = [];
          if (card.rank && card.suit) {
            // Find this specific card in the hand
            for (index = 0; index < game.cards.length; index++) {
              if ((game.cards[index].rank === card.rank)
                && (game.cards[index].suit === card.suit)) {
                foundCards.push(index + 1);
              }
            }
          } else if (card.rank) {
            // Select all cards of this rank
            for (index = 0; index < game.cards.length; index++) {
              if (game.cards[index].rank === card.rank) {
                foundCards.push(index + 1);
              }
            }
          } else if (card.suit) {
            // Select all cards of this suit
            for (index = 0; index < game.cards.length; index++) {
              if (game.cards[index].suit === card.suit) {
                foundCards.push(index + 1);
              }
            }
          }

          // If we didn't find a card, error out
          if (foundCards.length) {
            foundCards.map((card) => cardIndex.push(card));
          } else {
            error = ((holding)
              ? res.strings.CARD_NOT_FOUND_HOLD
              : res.strings.CARD_NOT_FOUND_DISCARD)
                .replace('{0}', slots[slot].value);
          }
        } else {
          // Error with this card
          error = ((holding)
            ? res.strings.CARD_NOT_FOUND_HOLD
            : res.strings.CARD_NOT_FOUND_DISCARD)
              .replace('{0}', slots[slot].value);
        }
      }
    });

    // You have to have specified at least one card
    if ((cardIndex.length === 0) && !error) {
      error = (holding)
        ? res.strings.NO_CARD_SPECIFIED_HOLD
        : res.strings.NO_CARD_SPECIFIED_DISCARD;
    }

    // If there's an error, log it
    if (error) {
      console.log('getSelectedCard error: ' + error);
    }

    // Return what we found
    return {error: error, cards: cardIndex};
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
  readAvailableActions: function(locale, attributes, state) {
    const res = require('./' + locale + '/resources');
    const game = attributes[attributes.currentGame];
    let speech;
    const actions = [];

    switch (state) {
      case 'SELECTGAME':
        actions.push(res.strings.SAY_YES_SELECT);
        actions.push(res.strings.SAY_NO_SELECT);
        break;
      case 'NEWGAME':
        actions.push(res.strings.SAY_BET);
        actions.push(res.strings.SAY_DEAL);
        break;
      case 'SUGGESTION':
        actions.push(res.strings.SAY_YES_SUGGEST);
        // Fall through
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
        break;
      default:
        break;
    }

    // Everyone can say read high scores
    actions.push(res.strings.SAY_HIGHSCORE);

    if (actions.length) {
      speech = res.strings.YOU_CAN_SAY
        .replace('{0}', speechUtils.or(actions, {locale: locale, pause: '200ms'}));
    }
    return speech;
  },
  readHand: function(locale, game) {
    // Read the hand and any held cards
    const res = require('./' + locale + '/resources');
    const heldCards = [];
    let speech;

    speech = res.strings.DEALT_CARDS.replace('{0}',
            speechUtils.and(game.cards.map((card) => res.sayCard(card)),
              {pause: '300ms', locale: locale}));

    game.cards.map((card) => {
      if (card.hold) {
        heldCards.push(card);
      }
    });
    if (heldCards.length) {
      speech += res.strings.HELD_CARDS.replace('{0}',
            speechUtils.and(heldCards.map((card) => res.sayCard(card)),
              {pause: '300ms', locale: locale}));
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

    // Note wild cards
    for (i = 0; i < (game.wildCards ? game.wildCards.length : 0); i++) {
      text += res.strings.PAYOUT_WILD.replace('{0}', res.pluralCardRanks({rank: game.wildCards[i]}));
      text += '\n';
    }

    for (payout in game.payouts) {
      if (payout) {
        // Special case if it's the progressive
        text += res.readPayoutHand(payout) + ' ';
        text += module.exports.readPayoutAmount(locale, game, payout);
        text += '\n';
      }
    }

    return text;
  },
  readPayoutAmount: function(locale, game, payout) {
    let text;
    const res = require('./' + locale + '/resources');

    if (game.progressive && (game.progressive.match === payout)) {
      text = res.strings.PAYOUT_PROGRESSIVE;
    } else {
      text = res.strings.PAYOUT_PAYS.replace('{0}', game.payouts[payout]);
    }

    return text;
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
          const ranking = scores.indexOf(game.bankroll) + 1;

          speech += res.strings.LEADER_RANKING
            .replace('{0}', game.bankroll)
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
  // Updates DynamoDB and S3 to note the jackpot win
  updateProgressiveJackpot: function(userId, game, jackpot, callback) {
    let callsToComplete = 3;

    // Write to the DB, and reset the coins played to 0
    dynamodb.putItem({TableName: 'VideoPoker',
        Item: {userId: {S: 'game-' + game}, coins: {N: '0'}}},
        (err, data) => {
      // We don't take a callback, but if there's an error log it
      if (err) {
        console.log(err);
      }
      complete();
    });

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
      complete();
    });

    // And write this jackpot out to S3
    const details = {userId: userId, amount: jackpot};
    const params = {Body: JSON.stringify(details),
      Bucket: 'garrett-alexa-usage',
      Key: 'jackpots/videopoker/' + game + '-' + Date.now() + '.txt'};

    s3.putObject(params, (err, data) => {
      if (err) {
        console.log(err, err.stack);
      }
      complete();
    });

    // This function keeps track of when we've completed all calls
    function complete() {
      callsToComplete--;
      if (callsToComplete === 0) {
        callback();
      }
    }
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
        if (scores[attributes.currentGame].indexOf(game.bankroll) < 0) {
          scores[attributes.currentGame].push(game.bankroll);
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
  if (rules.wildCards) {
    evaluateOptions.wildCards = rules.wildCards;
  }
  if (rules.minPair) {
    evaluateOptions.minPair = rules.minPair;
  }
  const fullHandRank = pokerrank.evaluateAndFindCards(evalCards, evaluateOptions);

  // Royal Flush
  // Straight Flush
  // 4 of a Kind
  if ((fullHandRank.match === 'royalflush') || (fullHandRank.match === 'straightflush')
      || (fullHandRank.match === '4ofakind')) {
    return sayCardsToHold(locale, attributes, fullHandRank.cards);
  }

  // 4 Card Royal
  let royalCards = nCardRoyal(evalCards, 4);
  if (royalCards) {
    return sayCardsToHold(locale, attributes, royalCards);
  }

  // Full House
  // Flush
  // 3 of a Kind
  // Straight
  if ((fullHandRank.match === 'fullhouse') || (fullHandRank.match === 'flush')
    || (fullHandRank.match === 'straight') || (fullHandRank.match === '3ofakind')) {
    return sayCardsToHold(locale, attributes, fullHandRank.cards);
  }

  // 4 Card Straight Flush - open both ends
  evaluateOptions.cardsToEvaluate = 4;
  const fourHandRank = pokerrank.evaluateAndFindCards(evalCards, evaluateOptions);
  if (fourHandRank.match === 'straightflush') {
    return sayCardsToHold(locale, attributes, fourHandRank.cards);
  }

  // Two Pairs
  if (fullHandRank.match === '2pair') {
    return sayCardsToHold(locale, attributes, fullHandRank.cards);
  }

  // 4 Card Straight Flush - inside draw
  if (fourHandRank.match === 'flush') {
    for (i = 0; i < evalCards.length; i++) {
      if (fourHandRank.cards.indexOf(evalCards[i]) < 0) {
        evaluateOptions.wildCards = [evalCards[i]];
      }
    }
    evaluateOptions.cardsToEvaluate = 5;
    if (pokerrank.evaluateHand(evalCards, evaluateOptions) === 'straightflush') {
      return sayCardsToHold(locale, attributes, fourHandRank.cards);
    }
  }

  // Pair of Jacks, Queens, Kings or Aces
  if (fullHandRank.match === 'minpair') {
    return sayCardsToHold(locale, attributes, fullHandRank.cards);
  }

  // 3 Card Royal
  royalCards = nCardRoyal(evalCards, 3);
  if (royalCards) {
    return sayCardsToHold(locale, attributes, royalCards);
  }

  // 4 Card Flush
  if (fourHandRank.match === 'flush') {
    return sayCardsToHold(locale, attributes, fourHandRank.cards);
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
      return sayCardsToHold(locale, attributes, fourHandRank.cards);
    }
  }

  // Low Pair - Two through Ten
  if (fullHandRank.match === 'pair') {
    return sayCardsToHold(locale, attributes, fullHandRank.cards);
  }

  // 4 Card Straight - sequential order
  if (fourHandRank.match === 'straight') {
    return sayCardsToHold(locale, attributes, fourHandRank.cards);
  }

  // 3 Card Straight Flush - sequential order
  evaluateOptions.cardsToEvaluate = 3;
  evaluateOptions.wildCards = [];
  const threeHandRank = pokerrank.evaluateAndFindCards(evalCards, evaluateOptions);
  if (threeHandRank.match === 'straightflush') {
    return sayCardsToHold(locale, attributes, threeHandRank.cards);
  }

  // 4 Card Straight - non sequential order
  // Mark each card wild and see if we hit a straight
  // Note if we got this far, we don't have a pair
  const holdCards = [];
  evaluateOptions.cardsToEvaluate = 5;
  for (i = 0; i < game.cards.length; i++) {
    evaluateOptions.wildCards = [game.cards[i].rank + game.cards[i].suit];
    if (pokerrank.evaluateHand(evalCards, evaluateOptions) === 'straight') {
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
    return sayCardsToHold(locale, attributes, holdCards.map((card) => card.rank + card.suit));
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
    if (pokerrank.evaluateHand(evalCards, evaluateOptions) === 'straightflush') {
      return sayCardsToHold(locale, attributes, threeHandRank.cards);
    }
  }

  // 2 Card Royal
  royalCards = nCardRoyal(evalCards, 2);
  if (royalCards) {
    return sayCardsToHold(locale, attributes, royalCards);
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
    return sayCardsToHold(locale, attributes, highCards.map((card) => card.rank + card.suit));
  }

  // Nothing
  return res.strings.SUGGEST_DISCARD_ALL;
}

function sayCardsToHold(locale, attributes, evalCards) {
  const res = require('./' + locale + '/resources');
  let result;
  const cards = [];
  const game = attributes[attributes.currentGame];

  evalCards.map((card) => {
    cards.push({rank: card.substring(0, card.length -1), suit: card.substring(card.length - 1)});
  });

  // Now for each card, translate into an index to add
  game.suggestedHold = [];
  cards.map((card) => {
    let i;

    for (i = 0; i < game.cards.length; i++) {
      if ((game.cards[i].rank === card.rank)
        && (game.cards[i].suit === card.suit)) {
        game.suggestedHold.push(i + 1);
        break;
      }
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

    // Four cards of same suit?
    if (cards.length === 4) {
      let sameSuit = true;
      cards.map((card) => {
        if (card.suit !== cards[0].suit) {
          sameSuit = undefined;
        }
      });

      if (sameSuit) {
        result = res.strings.SUGGEST_HOLD_MATCHING.replace('{0}', res.pluralCardSuits(cards[0]));
      }
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
  const game = attributes[attributes.currentGame];
  const deuceFunction = [suggestNoDeuce, suggestOneDeuce,
          suggestTwoDeuce, suggestThreeDeuce, suggestFourDeuce];
  let deuces = 0;

  // Count the twos
  game.cards.map((card) => {
    if (card.rank === '2') {
      deuces++;
    }
  });
  return (deuceFunction[deuces])(locale, attributes);
}

function suggestNoDeuce(locale, attributes) {
  const game = attributes[attributes.currentGame];
  const rules = games[attributes.currentGame];
  const evaluateOptions = {};
  const res = require('./' + locale + '/resources');
  let i;
  let j;
  const evalCards = game.cards.map((card) => card.rank + card.suit);
  let royalCards;

  // See if they have a made hand
  evaluateOptions.aceCanBeLow = true;
  if (rules.wildCards) {
    evaluateOptions.wildCards = rules.wildCards;
  }
  const fullHandRank = pokerrank.evaluateAndFindCards(evalCards, evaluateOptions);

  // Royal Flush
  // Straight Flush
  // 4 of a Kind
  if ((fullHandRank.match === 'royalflush') || (fullHandRank.match === 'straightflush')
      || (fullHandRank.match === '4ofakind')) {
    return sayCardsToHold(locale, attributes, fullHandRank.cards);
  }

  // 4 Card Royal
  royalCards = nCardRoyal(evalCards, 4);
  if (royalCards) {
    return sayCardsToHold(locale, attributes, royalCards);
  }

  // Full House
  // Flush
  // 3 of a Kind
  // Straight
  if ((fullHandRank.match === 'fullhouse') || (fullHandRank.match === 'flush')
    || (fullHandRank.match === 'straight') || (fullHandRank.match === '3ofakind')) {
    return sayCardsToHold(locale, attributes, fullHandRank.cards);
  }

  // 4 Card Straight Flush - open both ends
  evaluateOptions.cardsToEvaluate = 4;
  const fourHandRank = pokerrank.evaluateAndFindCards(evalCards, evaluateOptions);
  if (fourHandRank.match === 'straightflush') {
    return sayCardsToHold(locale, attributes, fourHandRank.cards);
  }

  // 4 Card Straight Flush - inside draw
  if (fourHandRank.match === 'flush') {
    for (i = 0; i < game.cards.length; i++) {
      if (game.cards[i].suit !== fourHandRank.cards[0].suit) {
        evaluateOptions.wildCards = [game.cards[i].rank + game.cards[i].suit];
      }
    }
    evaluateOptions.cardsToEvaluate = 5;
    if (pokerrank.evaluateHand(evalCards, evaluateOptions) === 'straightflush') {
      return sayCardsToHold(locale, attributes, fourHandRank.cards);
    }
  }

  // 3 Card Royal
  royalCards = nCardRoyal(evalCards, 3);
  if (royalCards) {
    return sayCardsToHold(locale, attributes, royalCards);
  }

  // One Pair
  // Note with two pairs, only hold one of the pairs
  if (fullHandRank.match === 'pair') {
    return sayCardsToHold(locale, attributes, fullHandRank.cards);
  }
  if (fullHandRank.match === '2pair') {
    const onePair = [];

    onePair.push(fullHandRank.cards[0]);
    for (i = 1; i < fullHandRank.cards.length; i++) {
      if (fullHandRank.cards[i].substring(0, 1) === onePair[0].substring(0, 1)) {
        onePair.push(fullHandRank.cards[i]);
      }
    }
    return sayCardsToHold(locale, attributes, onePair);
  }

  // 4 Card Flush
  // 4 Card Straight - open both ends
  if ((fourHandRank.match === 'flush')
    || (fourHandRank.match === 'straight')) {
    return sayCardsToHold(locale, attributes, fourHandRank.cards);
  }

  // 3 Card Straight Flush - open
  // Four, Five and Six of same suit
  // Three, Four and Five of same suit
  evaluateOptions.cardsToEvaluate = 3;
  const threeHandRank = pokerrank.evaluateAndFindCards(evalCards, evaluateOptions);
  if (threeHandRank.match === 'straightflush') {
    return sayCardsToHold(locale, attributes, threeHandRank.cards);
  }

  // 2 Card Royal
  royalCards = nCardRoyal(evalCards, 2);
  if (royalCards) {
    return sayCardsToHold(locale, attributes, royalCards);
  }

  // Three, Four and Six of same suit
  let someCards = findCardsInHand(evalCards, ['3', '4', '6']);
  if (someCards && (someCards.length === 3) &&
    (someCards[0].substring(someCards[0].length - 1)
        === someCards[1].substring(someCards[1].length - 1)) &&
    (someCards[0].substring(someCards[0].length - 1)
        === someCards[1].substring(someCards[1].length - 1))) {
    return sayCardsToHold(locale, attributes, someCards);
  }

  // Three, Five and Six of same suit
  someCards = findCardsInHand(evalCards, ['3', '5', '6']);
  if (someCards && (someCards.length === 3) &&
    (someCards[0].substring(someCards[0].length - 1)
        === someCards[1].substring(someCards[1].length - 1)) &&
    (someCards[0].substring(someCards[0].length - 1)
        === someCards[1].substring(someCards[1].length - 1))) {
    return sayCardsToHold(locale, attributes, someCards);
  }

  // Three, Four, Five and Six of same suit
  // Caught with four card flush

  // 4 Card Straight - inside draw
  // Mark each card wild and see if we hit a straight
  // Note if we got this far, we don't have a pair
  const holdCards = [];
  evaluateOptions.cardsToEvaluate = 5;
  for (i = 0; i < game.cards.length; i++) {
    evaluateOptions.wildCards = [game.cards[i].rank + game.cards[i].suit];
    if (pokerrank.evaluateHand(evalCards, evaluateOptions) === 'straight') {
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
    return sayCardsToHold(locale, attributes, holdCards.map((card) => card.rank + card.suit));
  }

  // Nothing
  return res.strings.SUGGEST_DISCARD_ALL;
}

function suggestOneDeuce(locale, attributes) {
  const game = attributes[attributes.currentGame];
  const rules = games[attributes.currentGame];
  const evaluateOptions = {};
  const evalCards = game.cards.map((card) => card.rank + card.suit);
  const theDeuce = findCardsInHand(evalCards, ['2'])[0];

  // See if they have a made hand
  evaluateOptions.aceCanBeLow = true;
  if (rules.wildCards) {
    evaluateOptions.wildCards = rules.wildCards;
  }
  const fullHandRank = pokerrank.evaluateAndFindCards(evalCards, evaluateOptions);

  // Royal Flush with Deuce
  // Five of a Kind
  // Straight Flush
  // 4 of a Kind
  if ((fullHandRank.match === 'royalflush')
      || (fullHandRank.match === '5ofakind')
      || (fullHandRank.match === 'straightflush')
      || (fullHandRank.match === '4ofakind')) {
    return sayCardsToHold(locale, attributes, fullHandRank.cards);
  }

  // 4 Card Royal with Deuce
  let royalCards = nCardRoyal(evalCards, 3);
  if (royalCards) {
    // Add the deuce
    royalCards.push(theDeuce);
    return sayCardsToHold(locale, attributes, royalCards);
  }

  // Full House
  if (fullHandRank.match === 'fullhouse') {
    return sayCardsToHold(locale, attributes, fullHandRank.cards);
  }

  // 4 Card Straight Flush - open both ends
  evaluateOptions.cardsToEvaluate = 4;
  const fourHandRank = pokerrank.evaluateAndFindCards(evalCards, evaluateOptions);
  if (fourHandRank.match === 'straightflush') {
    return sayCardsToHold(locale, attributes, fourHandRank.cards);
  }

  // 3 of a Kind
  // Flush
  // Straight
  if ((fullHandRank.match === '3ofakind')
      || (fullHandRank.match === 'flush')
      || (fullHandRank.match === 'straight')) {
    return sayCardsToHold(locale, attributes, fullHandRank.cards);
  }

  // These would be captured by 4 card straight flush
  // Three, Four and Five of same suit with Deuce
  // Four, Five and Six of same suit with Deuce
  // Ace, Three and Four of same suit with Deuce
  // Four, Five and Six of same suit with Deuce

  // Ace, Three and Five of same suit with Deuce
  let anAce;
  game.cards.map((card) => {
    if (card.rank === 'A') {
      anAce = card;
    }
  });
  if (anAce) {
    // Three and five have to match this suit
    if ((evalCards.indexOf('3' + anAce.suit) > -1)
      && (evalCards.indexOf('5' + anAce.suit) > -1)) {
      return sayCardsToHold(locale, attributes, findCardsInHand(evalCards, ['A', '2', '3', '5']));
    }
  }

  // Ace, Four and Five of same suit with Deuce
  if (anAce) {
    if ((evalCards.indexOf('4' + anAce.suit) > -1)
      && (evalCards.indexOf('5' + anAce.suit) > -1)) {
      return sayCardsToHold(locale, attributes, findCardsInHand(evalCards, ['A', '2', '4', '5']));
    }
  }

  // 2 Card Royal Flush with Deuce
  // Ace-King, Ace-Queen, Ace-Jack, Ace-Ten same suit with Deuce
  royalCards = nCardRoyal(evalCards, 2);
  if (royalCards) {
    royalCards.push(theDeuce);
    return sayCardsToHold(locale, attributes, royalCards);
  }

  // Deuce Only - need to find the deuce
  return sayCardsToHold(locale, attributes, [theDeuce]);
}

function suggestTwoDeuce(locale, attributes) {
  const game = attributes[attributes.currentGame];
  const rules = games[attributes.currentGame];
  const evaluateOptions = {};
  const evalCards = game.cards.map((card) => card.rank + card.suit);

  // See if they have a made hand
  evaluateOptions.aceCanBeLow = true;
  if (rules.wildCards) {
    evaluateOptions.wildCards = rules.wildCards;
  }
  const fullHandRank = pokerrank.evaluateAndFindCards(evalCards, evaluateOptions);

  // Royal Flush
  // Five of a Kind
  // Straight Flush
  // 4 of a Kind
  if ((fullHandRank.match === 'royalflush')
      || (fullHandRank.match === '5ofakind')
      || (fullHandRank.match === 'straightflush')
      || (fullHandRank.match === '4ofakind')) {
    return sayCardsToHold(locale, attributes, fullHandRank.cards);
  }

  // 4 Card Royal
  const royalCards = nCardRoyal(evalCards, 2);
  if (royalCards) {
    const wildCards = findCardsInHand(evalCards, ['2']);
    wildCards.map((card) => royalCards.push(card));
    return sayCardsToHold(locale, attributes, royalCards);
  }

  // 4 Card Straight Flush - open both ends
  evaluateOptions.cardsToEvaluate = 4;
  const fourHandRank = pokerrank.evaluateAndFindCards(evalCards, evaluateOptions);
  if (fourHandRank.match === 'straightflush') {
    return sayCardsToHold(locale, attributes, fourHandRank.cards);
  }

  // Two Deuces Only
  return sayCardsToHold(locale, attributes, findCardsInHand(evalCards, ['2']));
}

function suggestThreeDeuce(locale, attributes) {
  const game = attributes[attributes.currentGame];
  const rules = games[attributes.currentGame];
  const evaluateOptions = {};
  const evalCards = game.cards.map((card) => card.rank + card.suit);
  const royalRank = ['10', 'J', 'Q', 'K', 'A'];

  // See if they have a made hand
  evaluateOptions.aceCanBeLow = true;
  if (rules.wildCards) {
    evaluateOptions.wildCards = rules.wildCards;
  }
  const fullHandRank = pokerrank.evaluateAndFindCards(evalCards, evaluateOptions);

  // Royal Flush
  if (fullHandRank.match === 'royalflush') {
    return sayCardsToHold(locale, attributes, fullHandRank.cards);
  }

  // Five of a Kind - Tens through Aces
  if (fullHandRank.match === '5ofakind') {
    let isHigh = false;

    game.cards.map((card) => {
      if (royalRank.indexOf(card.rank) > -1) {
        isHigh = true;
      }
    });

    if (isHigh) {
      return sayCardsToHold(locale, attributes, fullHandRank.cards);
    }
  }

  // Three Deuces Only
  return sayCardsToHold(locale, attributes, findCardsInHand(evalCards, ['2']));
}

function suggestFourDeuce(locale, attributes) {
  // Four Deuces - keep them
  return sayCardsToHold(locale, attributes, ['2C', '2D', '2H', '2S']);
}

function findCardsInHand(cards, cardRanks) {
  const result = [];

  cards.map((card) => {
    if (cardRanks.indexOf(card.substring(0, card.length - 1)) > -1) {
      result.push(card);
    }
  });

  return result;
}

function nCardRoyal(cards, numCards) {
  const royalCards = findCardsInHand(cards, ['10', 'J', 'Q', 'K', 'A']);
  const suits = ['C', 'D', 'H', 'S'];
  const matchedCards = [];

  if (royalCards && (royalCards.length >= numCards)) {
    // Could be - now see if there are numCards with the same suit
    suits.map((suit) => {
      // Clear the array
      if (matchedCards.length !== numCards) {
        matchedCards.map((card) => matchedCards.pop());
        royalCards.map((card) => {
          if (card.substring(card.length - 1) === suit) {
            matchedCards.push(card);
          }
        });
      }
    });

    if (matchedCards.length === numCards) {
      // We have our flush!
      return matchedCards;
    }
  }

  return undefined;
}
