import { defaultTo, evolve, map, pick, pipe, prop } from 'ramda';
import { json } from '../utils/fetch';
import { renameKeys } from '../utils/renameKeys';
import { runScript } from '../utils/runScript';
import { Functions } from './functions';
import { Player } from './player';
import { Adjustment } from './adjustment';

const baseUrl = new URL('https://fantasy.espn.com');
const MATCHUPS = 'mMatchupScore';
const SCOREBOARD = 'mScoreboard';

const makeMatchupTransform = isAway =>
  pipe(
    prop(isAway ? 'away' : 'home'),
    pick([
      'adjustments',
      'rosterForCurrentScoringPeriod',
      'teamId',
      'totalAdjustment',
      'totalPoints',
      'totalPointsLive'
    ]),
    ({ rosterForCurrentScoringPeriod, ...rest }) => ({
      ...rest,
      isAway,
      ...pipe(
        pick(['appliedStatTotal', 'entries']),
        defaultTo([]),
        renameKeys({ appliedStatTotal: 'totalPointsRaw', entries: 'players' })
      )(defaultTo({}, rosterForCurrentScoringPeriod))
    }),
    evolve({
      players: map(Player.selector)
    })
  );

const awayTransform = makeMatchupTransform(true);
const homeTransform = makeMatchupTransform(false);

const apiToUi = matchup => {
  const { id } = matchup;
  const away = awayTransform(matchup);
  const home = homeTransform(matchup);

  return { away, home, id };
};

const fetch = async ({ matchupId, settings, weekId }) => {
  const leagueId = runScript(Functions.leagueId);
  const { currentSeason: seasonId } = settings;
  const url = new URL(
    `/apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${leagueId}`,
    baseUrl.href
  );

  url.searchParams.set('view', MATCHUPS);
  url.searchParams.set('scoringPeriodId', weekId);

  const { schedule } = await json(`${url.href}&view=${SCOREBOARD}`);
  const filtered = schedule.filter(
    matchup => matchup.matchupPeriodId === weekId
  );
  const matchups = filtered.map(apiToUi);

  return Adjustment.apiToUi({ matchups, settings });
};

export const Matchups = {
  fetch
};
