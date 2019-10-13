import { filter, map, path, pipe, prop, sum } from 'ramda';
import { adjustments as dlAdjustments } from './dl';
import { adjustments as teAdjustments } from './te';

const addTeamAdjustments = settings => ({ players = [], ...rest }) => {
  const dlAdjs = dlAdjustments(settings)(players);
  const teAdjs = teAdjustments(settings)(players);
  const adjustments = [...dlAdjs, ...teAdjs];

  // console.info('Team adjustments', adjustments);

  return {
    ...rest,
    adjustments,
    players
  };
};

const appendMatchupAdjustments = settings => ({ away, home, id }) => {
  const newAway = addTeamAdjustments(settings)(away);
  const newHome = addTeamAdjustments(settings)(home);

  return {
    away: newAway,
    home: newHome,
    id
  };
};

const addAdjustments = ({ matchups, settings }) =>
  map(appendMatchupAdjustments(settings), matchups);

const sumAdjustments = pipe(
  prop('adjustments'),
  filter(path(['player', 'isStarter'])),
  map(prop('bonus')),
  sum
);

const matchupToAdjustment = ({ away, home, id: matchupId }) => ({
  away: {
    ...away,
    adjustments: prop('adjustments', away),
    teamId: away.teamId,
    totalAdjustment: sumAdjustments(away)
  },
  home: {
    ...home,
    adjustments: prop('adjustments', home),
    teamId: home.teamId,
    totalAdjustment: sumAdjustments(home)
  },
  id: matchupId
});

const apiToUi = pipe(
  addAdjustments,
  map(matchupToAdjustment)
);

const Enumeration = {
  BOX_SCORE: 'boxScore',
  FANTASY_CAST: 'fantasyCast',
  UNKNOWN: 'unknown'
};

export const Adjustment = {
  ...Enumeration,
  apiToUi
};
