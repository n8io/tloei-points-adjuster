import {
  anyPass,
  filter,
  flatten,
  gt,
  intersection,
  length,
  map,
  pipe,
  prop,
  propEq,
  values,
  __
} from 'ramda';
import { Bonus } from '../bonus';
import { Player } from '../player';
import { Stat } from '../stat';

const processPlayer = player => {
  const bonuses = [];
  const receptions = player.stats[Stat.REC.toString()] || 0;
  const receivingYards = player.stats[Stat.REC_YDS.toString()] || 0;

  const receptionBonus = receptions * Bonus.TE_REC;

  receptionBonus &&
    bonuses.push({
      bonus: receptionBonus,
      player: Player.apiToUi(player),
      type: 'TE_REC'
    });

  const receivingYardsBonus = receivingYards * Bonus.TE_REC_YDS;

  receivingYardsBonus &&
    bonuses.push({
      bonus: receivingYardsBonus,
      player: Player.apiToUi(player),
      type: 'TE_REC_YDS'
    });

  return bonuses;
};

export const adjustments = settings => players => {
  const tePositions = pipe(
    values,
    filter(anyPass([propEq('abbrev', 'TE')])),
    map(prop('id'))
  )(settings.constants.lineupSlotsMap);

  const isTE = pipe(
    prop('eligibleSlots'),
    intersection(tePositions),
    length,
    gt(__, 0)
  );

  const tes = players.filter(isTE);
  const bonuses = tes.map(processPlayer);

  return flatten(bonuses);
};
