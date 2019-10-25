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
  // console.log('Clearing previous player adjustments...');
  document
    .querySelectorAll('div[adjustment]')
    .forEach(e => e.parentNode.removeChild(e));
};

const boxScoreUpdate = ({ el, bonus, grossTotal }) => {
  const td = el.closest('td');
  const scoreTd = td.parentNode.querySelector('td:nth-child(6)');

  if (!scoreTd) return;

  scoreTd.querySelector('span').innerText = parseScore(bonus + grossTotal);

  console.info('Player box score', parseScore(scoreTd.innerText));
};

const fantasyCastUpdate = ({ el, bonus, grossTotal }) => {
  const td = el.closest('td');
  const tr = td.parentNode;
  const isReverse = tr.children.item(0) !== td;
  let scoreTd = null;
  const isEven = !Boolean(parseInt(tr.getAttribute('data-idx'), 10) % 2);

  if (isReverse) {
    scoreTd = td.previousSibling;
  } else {
    scoreTd = td.nextSibling;
  }

  if (!scoreTd) {
    console.error({
      td,
      tr,
      isReverse,
      isEven
    });
  }

  scoreTd.setAttribute('style', `position: relative;`);

  const previousAdjustments = [...scoreTd.querySelectorAll('div[adjustment]')];

  previousAdjustments.length && scoreTd.removeChild(...previousAdjustments);

  const adjEl = document.createElement('div');

  adjEl.setAttribute('adjustment', true);
  adjEl.setAttribute(
    'style',
    `
      background: ${isEven ? '#FFF' : '#FAFAFA'};
      color: #797B7D;
      font-size: 14px;
      font-weight: 700;
      line-height: 16px;
      position: absolute;
      ${isReverse ? 'left: 0.75rem;' : 'right: 0.75rem;'}
      top: 50%;
      transform: translateY(-50%);
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
  const playerImg = document.body.querySelector(
    `img[src*="/${player.id}.png"]`
  );

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
