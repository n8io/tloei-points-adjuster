import { ScoreType } from "./scoreType";
import { parseScore } from "../utils/parseScore";

const homeFieldBonus = () =>
  parseInt(
    [...document.body.querySelectorAll("td.additional-scores-label")].find(
      (el) => el.innerText === "Home Field Advantage"
    ).previousSibling.innerText,
    10
  );

const updateTeamBoxScoreTotal = ({ bonus, isAway, grossTotal }) => {
  const AWAY_SCORE_CELL_INDEX = 3;
  const HOME_SCORE_CELL_INDEX = 11;
  const rows = [...document.body.querySelectorAll(".total-col.tar")];
  const awayScore = rows[AWAY_SCORE_CELL_INDEX];
  const homeScore = rows[HOME_SCORE_CELL_INDEX];
  const scoreTd = isAway ? awayScore.childNodes[0] : homeScore.childNodes[0];
  const HOME_FIELD_ADVANTAGE_BONUS = 1;
  const netBonus = parseScore(
    bonus + (isAway ? 0 : HOME_FIELD_ADVANTAGE_BONUS)
  );
  const total = parseScore(netBonus + grossTotal);

  console.info(
    `Setting ${
      isAway ? "away" : "home"
    } team box score total to ${total} (${netBonus} in adjustments)`
  );

  scoreTd.innerText = total;

  const [spanTotalAway, spanTotalHome] = [
    ...document.body.querySelectorAll(".team-score"),
  ];
  const checkTotal = isAway ? spanTotalAway : spanTotalHome;
  const espnTotal = parseScore(checkTotal.innerText);

  if (espnTotal !== total) {
    const diff = espnTotal - total;
    const isPositive = diff > 0;
    console.warn(
      `ESPN scoreboard has been changed from ${total} to ${espnTotal} (${parseScore(
        isPositive ? `+${diff}` : diff
      )})`
    );
  }
};

const updateTeamFantasyCastTotal = ({ bonus, isAway, grossTotal }) => {
  const totalTr = document.body.querySelector("tr.total-row");
  const [awayScore, homeScore] = [
    ...totalTr.querySelectorAll('td[colspan="2"] div'),
  ];
  const scoreTd = isAway ? awayScore : homeScore;
  const netBonus = parseScore(bonus + +(isAway ? 0 : homeFieldBonus()));
  const total = parseScore(netBonus + grossTotal);

  console.info(
    `Setting ${
      isAway ? "away" : "home"
    } team fantasy cast score total to ${total} (${netBonus} in adjustments)`
  );

  scoreTd.innerText = total;
};

const setTeamScore = ({ isAway, scoreType, team }) => {
  const functionMap = {
    [ScoreType.BOX_SCORE]: updateTeamBoxScoreTotal,
    [ScoreType.FANTASY_CAST]: updateTeamFantasyCastTotal,
  };

  functionMap[scoreType]({
    bonus: team.totalAdjustment,
    isAway,
    grossTotal: team.totalPointsRaw,
  });
};

const setTeamScores = ({ matchup, scoreType = ScoreType.FANTASY_CAST }) => {
  setTeamScore({ isAway: true, scoreType, team: matchup.away });
  setTeamScore({ isAway: false, scoreType, team: matchup.home });
};

export const Team = {
  setTeamScores,
};
