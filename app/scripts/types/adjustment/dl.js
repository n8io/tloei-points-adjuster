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
  const tackles = player.stats[Stat.TKS.toString()] || 0;
  const assists = player.stats[Stat.TKA.toString()] || 0;
  const assistsBonus = assists * Bonus.DL_AST;
  const tacklesBonus = tackles * Bonus.DL_TKS;

  assistsBonus &&
    bonuses.push({
      bonus: assistsBonus,
      player: Player.apiToUi(player),
      type: 'DL_AST'
    });

  tacklesBonus &&
    bonuses.push({
      bonus: tacklesBonus,
      player: Player.apiToUi(player),
      type: 'DL_TKS'
    });

  return bonuses;
};

// eslint-disable-next-line complexity, max-statements
const adjustments = settings => {
  const dlPositions = pipe(
    values,
    filter(
      anyPass([
        propEq('abbrev', 'DL'),
        propEq('abbrev', 'DE'),
        propEq('abbrev', 'DT')
      ])
    ),
    map(prop('id'))
  )(settings.constants.lineupSlotsMap);

  const isDL = pipe(
    prop('eligibleSlots'),
    intersection(dlPositions),
    length,
    gt(__, 0)
  );

  return players => {
    const dls = players.filter(isDL);
    const bonuses = dls.map(processPlayer);

    return flatten(bonuses);
  };
};
export { adjustments };
