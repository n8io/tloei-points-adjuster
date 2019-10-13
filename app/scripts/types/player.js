import { defaultTo, find, pick, pipe } from 'ramda';

import { ScoreType } from './scoreType';
import { parseScore } from '../utils/parseScore';

const isStarter = ({ lineupSlotId }) => [20, 21].indexOf(lineupSlotId) === -1;

const selector = ({ lineupSlotId, playerPoolEntry }) => {
  const { appliedStatTotal, player } = playerPoolEntry;
  const {
    defaultPositionId,
    eligibleSlots,
    firstName,
    id,
    lastName,
    proTeamId,
    stats: statsFeeds
  } = player;

  const stats = pipe(
    find(({ externalId }) => Number(externalId) > 400000000),
    defaultTo({
      appliedStats: {},
      stats: {}
    }),
    pick(['appliedStats', 'stats'])
  )(statsFeeds);

  return {
    appliedStatTotal,
    defaultPositionId,
    eligibleSlots,
    firstName,
    id,
    isStarter: isStarter({ lineupSlotId }),
    lastName,
    lineupSlotId,
    proTeamId,
    ...stats
  };
};

const apiToUi = pick([
  'appliedStatTotal',
  'eligibleSlots',
  'firstName',
  'id',
  'isStarter',
  'lastName'
]);

const clearPlayerAdjustments = () => {
  document
    .querySelectorAll('div[adjustment]')
    .forEach(e => e.parentNode.removeChild(e));
};

const boxScoreUpdate = ({ el, bonus, grossTotal }) => {
  const td = el.closest('td');
  const scoreTd = td.parentElement.querySelector('[title="Fantasy Points"]');

  if (!scoreTd) return;

  scoreTd.querySelector('span').innerText = parseScore(bonus + grossTotal);

  console.info('Player box score', parseScore(scoreTd.innerText));
};

const fantasyCastUpdate = ({ el, bonus, grossTotal }) => {
  const td = el.closest('.Table2__td');
  const isReverse = td.classList.contains('reverse');
  let scoreTd = null;

  if (isReverse) {
    scoreTd = td.previousSibling;
  } else {
    scoreTd = td.nextSibling;
  }

  scoreTd.setAttribute(
    'style',
    `
      align-items: center;
      display: grid;
      grid-auto-flow: column;
      height: 50px;
      justify-content: ${isReverse ? 'start' : 'end'};
      max-width: 100%;
    `
  );

  const previousAdjustments = [...scoreTd.querySelectorAll('div[adjustment]')];

  previousAdjustments.length && scoreTd.removeChild(...previousAdjustments);

  const adjEl = document.createElement('div');

  adjEl.setAttribute('adjustment', true);
  adjEl.setAttribute(
    'style',
    `
      font-size: 14px;
      opacity: 0.5;
    `
  );
  adjEl.innerText = parseScore(bonus + grossTotal);

  scoreTd[isReverse ? 'append' : 'prepend'](adjEl);

  console.info('Player fantasy cast score', parseFloat(scoreTd.innerText, 10));
};

const setPlayerScore = (adjustments, scoreType = ScoreType.FANTASY_CAST) => ({
  player
}) => {
  const bonus = adjustments
    .filter(adj => adj.player.id === player.id)
    .reduce((acc, adj) => acc + adj.bonus, 0);
  const playerImg = document.body.querySelector(`img[src*="${player.id}.png"]`);

  if (scoreType === ScoreType.FANTASY_CAST) {
    fantasyCastUpdate({
      el: playerImg,
      bonus,
      grossTotal: player.appliedStatTotal
    });
  } else if (scoreType === ScoreType.BOX_SCORE) {
    boxScoreUpdate({
      el: playerImg,
      bonus,
      grossTotal: player.appliedStatTotal
    });
  }
};

export const Player = {
  apiToUi,
  clearPlayerAdjustments,
  selector,
  setPlayerScore
};
