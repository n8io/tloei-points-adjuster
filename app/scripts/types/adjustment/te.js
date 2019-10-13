import { flatten, pipe, prop, propEq, __ } from 'ramda';
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
  const lineSlotIdMap = Stat.map(settings);
  const isTe = pipe(
    prop('lineupSlotId'),
    prop(__, lineSlotIdMap),
    propEq('abbrev', 'TE')
  );
  const tes = players.filter(isTe);
  const bonuses = tes.map(processPlayer);

  return flatten(bonuses);
};
