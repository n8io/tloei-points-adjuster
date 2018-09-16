(async () => {
  const Fetch = {
    element: url =>
      Fetch.text(url).then(html => {
        const el = document.createElement('html');

        el.innerHTML = html;

        return el;
      }),
    json: async url =>
      fetch(url)
        .then(r => r.json())
        .catch(() => null),
    text: async url =>
      fetch(url)
        .then(r => r.text())
        .catch(() => '')
  };

  const Parse = {
    gameIdByTeamAbbr: ({ gameScores: games }, teamAbbr) => {
      const team = (teamAbbr || '').toUpperCase();

      const { gameId } =
        games
          .map(({ gameSchedule: game }) => game)
          .filter(
            ({ homeTeamAbbr: home, visitorTeamAbbr: away }) =>
              home === team || away === team
          )[0] || {};

      return gameId;
    },
    gameUrlFromId: gameId =>
      `http://www.nfl.com/liveupdate/game-center/${gameId}/${gameId}_gtd.json?random=${new Date().getTime()}`,
    puntsInside10: ({ drives: tmpDrives }) => {
      const parsePunts = str => {
        const reg = /([a-z][.][a-z-']+) .*yards to [a-z]{2,3} ([0-9]+)/gi;

        const [, name, tmpYL] = reg.exec(str);

        const yardLine = Number(tmpYL);

        return { name: name.toUpperCase(), yardLine };
      };

      const PUNT_PLAY_RESULT = 'Punt';

      const drives = Object.keys(tmpDrives)
        .reduce((acc, key) => [...acc, tmpDrives[key]], [])
        .filter(d => d.result === PUNT_PLAY_RESULT)
        .map(d => d.plays[Object.keys(d.plays).slice(-1)[0]].desc)
        .map(parsePunts)
        .filter(({ yardLine }) => yardLine < 10);

      return drives;
    }
  };

  const Punt = {
    i10Points: async (name, teamAbbr, bonus) => {
      const weekScoresData = await Fetch.json(
        'https://feeds.nfl.com/feeds-rs/scores.json'
      );

      if (!weekScoresData) {
        console.log(`Could not load current scores feed`);

        return 0;
      }

      const gameId = '2018090911'; //await Parse.gameIdByTeamAbbr(weekScoresData, teamAbbr);

      if (!gameId) {
        console.log(`Could not find a game feed for: ${teamAbbr}`);

        return 0;
      }

      const gameUri = Parse.gameUrlFromId(gameId);
      const gameDataResponse = await Fetch.json(gameUri);

      if (!gameDataResponse) {
        console.log(`Could not find a game feed`, gameUri);

        return 0;
      }

      const gameData = gameDataResponse[gameId];

      const puntsInside10 = Parse.puntsInside10(gameData);

      const i10Punts = puntsInside10.filter(
        pit => pit.name.toLowerCase() === name.toLowerCase()
      ).length;

      return i10Punts * bonus;
    }
  };

  const Te = {
    receptionPoints: async (playerId, week, seasonId, bonus) => {
      const baseUrl = `http://games.espn.com/ffl/format/playerpop/overview?leagueId=220779&playerIdType=playerId&seasonId=${seasonId}&xhr=1`;
      const url = new URL(baseUrl);

      url.searchParams.set('playerId', playerId);

      const teDocument = await Fetch.element(url.href);

      if (!teDocument) {
        console.log(`Could not find TE info`, url.href);

        return 0;
      }

      const statMap = [
        'week',
        'opponent',
        'receptions',
        'yards',
        'touchdowns',
        'points'
      ];

      const weeks = [...teDocument.querySelectorAll('#moreStatsView0 tr')]
        .filter((_, i) => i && i <= 17)
        .map(row => {
          const cells = [...row.querySelectorAll('td')].map(td => td.innerText);

          return cells
            .map((c, i) => ({
              [statMap[i]]: i !== 1 ? Number(c.replace(/[^0-9]/, '')) : c
            }))
            .reduce(
              (acc, cell) => ({
                ...acc,
                ...cell
              }),
              {}
            );
        });

      const thisWeek = weeks.find(w => w.week === week);

      if (week === 1 && weeks[week].points) return 0;

      return thisWeek.receptions * bonus;
    }
  };

  const pI10Bonus = await Punt.i10Points('M.Dickson', 'SEA', 30);
  const teBonus = await Te.receptionPoints(9761, 1, 2018, 12);

  console.log({
    pI10Bonus,
    teBonus
  });
})();
