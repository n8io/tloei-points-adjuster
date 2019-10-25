import { Functions } from './types/functions';
import { Matchups } from './types/matchups';
import { Player } from './types/player';
import { ScoreType } from './types/scoreType';
import { Team } from './types/team';
import { runScript } from './utils/runScript';

const updateScores = async ({ settings, weekId }) => {
  const matchupId = await runScript(Functions.matchupId);
  const matchups = await Matchups.fetch({ matchupId, settings, weekId });
  const matchup = matchups.find(({ id }) => id === matchupId);

  console.info({
    matchupId,
    matchup,
    matchups
  });

  Player.clearPlayerAdjustments();

  const aAdjuster = Player.setPlayerScore(
    matchup.away.adjustments,
    ScoreType.FANTASY_CAST
  );
  const hAdjuster = Player.setPlayerScore(
    matchup.home.adjustments,
    ScoreType.FANTASY_CAST
  );

  matchup.away.adjustments.map(aAdjuster);
  matchup.home.adjustments.map(hAdjuster);

  Team.setTeamScores({ matchup, scoreType: ScoreType.FANTASY_CAST });
};

export const start = async () => {
  const settings = await runScript(Functions.espn);
  const weekId = await runScript(Functions.weekId);

  updateScores({ settings, weekId });
};
