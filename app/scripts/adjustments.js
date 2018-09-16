import debug from 'debug';

(async () => {
  let configuration = {};

  const Fetch = {
    element: url =>
      Fetch.text(url).then(html => {
        if (!html) return null;

        const log = debug('tloei:fetch:element');
        const element = document.createElement('html');

        element.innerHTML = html;

        log(`Fetched element from html at url`, { url, element });

        return element;
      }),
    json: async url => {
      const log = debug('tloei:fetch:json');

      return fetch(url)
        .then(async r => {
          const json = await r.json();

          log(`Fetched json from url`, { url, json });

          return json;
        })
        .catch(() => null);
    },
    text: async url => {
      const log = debug('tloei:fetch:text');

      return fetch(url)
        .then(async r => {
          log(`Fetched text from url`, { url, text: await r.text() });

          return r.text();
        })
        .catch(() => '');
    }
  };

  const Parse = {
    gameIdByTeamAbbr: ({ gameScores: games }, teamAbbr) => {
      const log = debug('tloei:parse:gameIdByTeamAbbr');
      const team = (teamAbbr || '').toUpperCase();

      const { gameId } =
        games
          .map(({ gameSchedule: game }) => game)
          .filter(
            ({ homeTeamAbbr: home, visitorTeamAbbr: away }) =>
              home === team || away === team
          )[0] || {};

      log('Games', { gameId, games });

      return gameId;
    },
    gameUrlFromId: gameId => {
      const log = debug('tloei:parse:gameUrlFromId');
      const url = `http://www.nfl.com/liveupdate/game-center/${gameId}/${gameId}_gtd.json?random=${new Date().getTime()}`;

      log({ url });

      return url;
    },
    puntsInside10: ({ drives: tmpDrives }) => {
      const parsePunts = str => {
        const log = debug('tloei:parse:puntsInside10:parsePunts');
        const reg = /([a-z][.][a-z-']+) .*yards to [a-z]{2,3} ([0-9]+)/gi;
        const [, name, tmpYL] = reg.exec(str);
        const yardLine = Number(tmpYL);

        const output = { name: name.toUpperCase(), yardLine };

        log('Punts parsed', { raw: str, ...output });

        return output;
      };

      const PUNT_PLAY_RESULT = 'Punt';

      const drives = Object.keys(tmpDrives)
        .reduce((acc, key) => [...acc, tmpDrives[key]], [])
        .filter(d => d.result === PUNT_PLAY_RESULT)
        .map(d => d.plays[Object.keys(d.plays).slice(-1)[0]].desc)
        .map(parsePunts)
        .filter(({ yardLine }) => yardLine < 10);

      const log = debug('tloei:parse:puntsInside10');

      log('Drive data', { drives });

      return drives;
    },
    todaysGameKey: () => {
      const d = new Date();
      const yr = d.getFullYear();
      const mon = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d
        .getDate()
        .toString()
        .padStart(2, '0');

      return `${yr}${mon}${day}`;
    }
  };

  const Punt = {
    i10Points: async (name, teamAbbr, bonus) => {
      const log = debug('tloei:punt:i10Points');
      const weekScoresData = await Fetch.json(
        'https://feeds.nfl.com/feeds-rs/scores.json'
      );

      if (!weekScoresData) {
        log(`Could not load current scores feed`);

        return 0;
      }

      const gameId = await Parse.gameIdByTeamAbbr(weekScoresData, teamAbbr);

      if (!gameId) {
        log(`Could not find a game feed for ${teamAbbr}`);

        return 0;
      }

      const todaysGameKey = Parse.todaysGameKey();

      if (gameId.toString().startsWith(todaysGameKey) === false) {
        log(
          `This punter's game is not playing today. ${gameId} doesn't start with ${todaysGameKey}`
        );

        return 0;
      }

      const gameUri = Parse.gameUrlFromId(gameId);
      const gameDataResponse = await Fetch.json(gameUri);

      if (!gameDataResponse) {
        log(`Could not find a game feed`, { gameUri });

        return 0;
      }

      const gameData = gameDataResponse[gameId];

      const puntsInside10 = Parse.puntsInside10(gameData);

      log({ puntsInside10 });

      const i10Punts = puntsInside10.filter(
        pit => pit.name.toLowerCase() === name.toLowerCase()
      ).length;

      const total = i10Punts * bonus;

      log({ i10Bonus: total });

      return total;
    }
  };

  const Te = {
    receptionPoints: async (playerId, week, seasonId, bonus) => {
      const log = debug('tloei:te:receptionPoints');
      const baseUrl = `http://games.espn.com/ffl/format/playerpop/overview?leagueId=220779&playerIdType=playerId&seasonId=${seasonId}&xhr=1`;
      const url = new URL(baseUrl);

      url.searchParams.set('playerId', playerId);

      const teDocument = await Fetch.element(url.href);

      if (!teDocument) {
        log(`Could not find TE info`, { url: url.href });

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

      log(`TE stat weeks`, { weeks });

      const thisWeek = weeks.find(w => w.week === week);

      if (week === 1 && weeks[week].points) return 0;

      const total = thisWeek.receptions * bonus;

      log({ teReceptionBonus: total });

      return total;
    }
  };

  const Dom = {
    punters: () =>
      [...document.querySelectorAll('.slot_18.playerSlot')].map(el => {
        const id = Number(el.getAttribute('id').replace(/[^0-9]+/, ''));
        const fullname = document.querySelector(`[playerid="${id}"]`).innerText;
        const [first, ...rest] = fullname.split(' ');
        const last = rest.join(' ').trim();
        const firstInitial = first.split('')[0];
        const name = `${firstInitial}.${last}`.toUpperCase();

        const teamAbbr = /, ([A-Z]{2,3})/i.exec(
          document.querySelector(`#playername_${id}`).innerText
        )[1];

        const log = debug('tloei:dom:punters');

        const punter = { id, name, teamAbbr };

        log('Punter', { punter });

        return punter;
      }),
    teIds: () =>
      [...document.querySelectorAll('.slot_6.playerSlot')].map(el =>
        Number(el.getAttribute('id').replace(/[^0-9]+/, ''))
      ),
    teamIds: () =>
      [...document.querySelectorAll('#teamInfos a')].map(a =>
        Number(
          new URL(a.getAttribute('href'), 'http://base.com').searchParams.get(
            'teamId'
          )
        )
      ),
    seasonId: () => Number(new URL(location.href).searchParams.get('seasonId')),
    week: () =>
      Number(new URL(location.href).searchParams.get('scoringPeriodId')),
    handleScoreChange: ({ teamId, points }) => {
      const log = debug('tloei:dom:handleScoreChange');
      const totalPointEl = document.getElementById(`tmTotalPts_${teamId}`);

      if (!totalPointEl) return;

      totalPointEl.setAttribute('title', points);

      log(`Team point change event`, { points });

      Process.punterAdjustments();
      Process.teAdjustments();
    },
    hasScoringAdjustments: () => {
      const saKey = 'SCORING ADJUSTMENT:'.toLowerCase();
      const scoringAdjustments = [
        ...document.querySelectorAll('.boxscoreDangler')
      ];

      return scoringAdjustments
        .map(div => div.innerText)
        .map(text =>
          text
            .toLowerCase()
            .replace(saKey, '')
            .trim()
        )
        .map(Number)
        .some(points => !isNaN(points));
    },
    mutationObserver: () =>
      new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            Dom.handleScoreChange({
              teamId: Number(mutation.target.id.replace(/[^0-9]+/, '')),
              points: Number(mutation.addedNodes[0].data)
            });
          }
        });
      }),
    updatePunterPoints: ({ playerId, bonus }) => {
      if (!bonus) return;

      const playerPointEl = document.querySelector(
        `#plAppliedPoints_${playerId}`
      );

      if (!playerPointEl) return;

      playerPointEl.setAttribute('score', playerPointEl.innerText);

      const points =
        (!isNaN(playerPointEl.innerText)
          ? Number(playerPointEl.innerText)
          : 0) + bonus;

      playerPointEl.innerText = `🏆 ${points}`;
    },
    updateTePoints: ({ playerId, points }) => {
      if (!points) return;

      const playerPointEl = document.querySelector(
        `#plAppliedPoints_${playerId}`
      );

      if (!playerPointEl) return;

      playerPointEl.innerText = `🏆 ${points}`;
    },
    updateTotalPoints: ({ teamId, adjustment, adjustmentType }) => {
      // if (!adjustment) return;

      const log = debug('tloei:dom:updateTotalPoints');
      const totalScoreEl = document.getElementById(`tmTotalPts_${teamId}`);

      if (!totalScoreEl) return;

      totalScoreEl.setAttribute(adjustmentType, adjustment);

      const totalAdjustments = ['adj-te', 'adj-p'].reduce((acc, key) => {
        const attr = totalScoreEl.getAttribute(key);

        if (!attr) return acc;

        return acc + Number(attr);
      }, 0);

      const rawScore = Number(totalScoreEl.getAttribute('title'));

      log(
        `Adjusting team ${teamId}'s score from ${rawScore} to ${totalAdjustments +
          rawScore} (${totalAdjustments} bonus)`
      );

      const points = rawScore + totalAdjustments;

      totalScoreEl.innerText = `🏆 ${points}`;
    }
  };

  const Process = {
    punterAdjustments: async () => {
      const log = debug('tloei:process:punterAdjustments');
      const { pI10Bonus: P_I10_BONUS = 30 } = configuration;

      return Dom.punters().forEach(
        async ({ id: playerId, name, teamAbbr }, teamIdIndex) => {
          const bonus = await Punt.i10Points(name, teamAbbr, P_I10_BONUS);

          log({ playerId, punterBonus: bonus });

          await Dom.updatePunterPoints({ playerId, bonus });

          await Dom.updateTotalPoints({
            teamId: Dom.teamIds()[teamIdIndex],
            adjustment: bonus,
            adjustmentType: 'adj-p'
          });
        }
      );
    },
    setupMutations: () => {
      Dom.teamIds().forEach(teamId => {
        const teamPointEl = document.querySelector(`#tmTotalPts_${teamId}`);

        if (!teamPointEl) return;

        Dom.mutationObserver().observe(teamPointEl, {
          childList: true
        });
      });
    },
    init: async () => {
      const log = debug('tloei:process:start');

      if (await Dom.hasScoringAdjustments()) {
        log(`Scoring adjustments detected. No further processing`);

        return;
      }

      Process.setupMutations();
      Process.start();
    },
    start: async () => {
      await Process.teAdjustments();
      await Process.punterAdjustments();
    },
    teAdjustments: async () => {
      const log = debug('tloei:process:teAdjustments');
      const { tePprBonus: TE_RECEPTION_BONUS = 12 } = configuration;

      return Dom.teIds().forEach(async (playerId, teamIdIndex) => {
        const bonus = await Te.receptionPoints(
          playerId,
          Dom.week(),
          Dom.seasonId(),
          TE_RECEPTION_BONUS
        );

        log({ playerId, teBonus: bonus });

        await Dom.updateTePoints({ playerId, points: bonus });

        await Dom.updateTotalPoints({
          teamId: Dom.teamIds()[teamIdIndex],
          adjustment: bonus,
          adjustmentType: 'adj-te'
        });
      });
    }
  };

  const TE_PPR_BONUS_KEY = 'tePprBonus';
  const P_I10_BONUS_KEY = 'pI10Bonus';

  chrome.storage.sync.get(
    ({ [TE_PPR_BONUS_KEY]: '', [P_I10_BONUS_KEY]: '' },
    config => {
      const log = debug('tloei:chrome:storage');
      configuration = config;

      log('Configuration', configuration);

      Process.init();
    })
  );
})();
