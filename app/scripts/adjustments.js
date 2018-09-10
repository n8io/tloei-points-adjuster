const TE_PPR_BONUS_KEY = 'tePprBonus';

const loadAdjustments = config => {
  const { tePprBonus: TE_RECEPTION_BONUS = 12 } = config;

  console.log({ TE_RECEPTION_BONUS });

  const baseUrl =
    'http://games.espn.com/ffl/format/playerpop/overview?leagueId=220779&playerIdType=playerId&seasonId=2018&xhr=1';

  const week = Number(
    new URL(location.href).searchParams.get('scoringPeriodId')
  );

  const teamIds = [...document.querySelectorAll('#teamInfos a')].map(a =>
    Number(
      new URL(a.getAttribute('href'), 'http://base.com').searchParams.get(
        'teamId'
      )
    )
  );

  const handleScoreChange = ({ teamId, points }) => {
    document
      .getElementById(`tmTotalPts_${teamId}`)
      .setAttribute('title', points);

    refreshTePoints();
  };

  const mutationObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        handleScoreChange({
          teamId: Number(mutation.target.id.replace(/[^0-9]+/, '')),
          points: Number(mutation.addedNodes[0].data)
        });
      }
    });
  });

  teamIds.forEach(teamId => {
    mutationObserver.observe(document.querySelector(`#tmTotalPts_${teamId}`), {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true
    });
  });

  const statMap = [
    'week',
    'opponent',
    'receptions',
    'yards',
    'touchdowns',
    'points'
  ];

  const updatePlayerPoints = ({ playerId, points }) => {
    const playerPointEl = document.querySelector(
      `#plAppliedPoints_${playerId}`
    );

    playerPointEl.innerText = `🏆 ${points}`;
  };

  const updateTotalPoints = ({ teamId, adjustment }) => {
    const totalScoreEl = document.getElementById(`tmTotalPts_${teamId}`);

    const rawScore = Number(totalScoreEl.getAttribute('title'));

    console.info(
      `Adjusting team ${teamId}'s score from ${rawScore} to ${rawScore +
        adjustment} for TE PPR bonus`
    );

    const points = rawScore + adjustment;

    totalScoreEl.innerText = `🏆 ${points}`;
  };

  const refreshTePoints = () => {
    const teIds = [...document.querySelectorAll('.slot_6.playerSlot')].map(el =>
      Number(el.getAttribute('id').replace(/[^0-9]+/, ''))
    );

    teIds.forEach((id, teamIdIndex) => {
      const url = new URL(baseUrl);

      url.searchParams.set('playerId', id);

      $.ajax(url.href).done(data => {
        const weeks = $(data)
          .find('#moreStatsView0 tr')
          .toArray()
          .filter((_, i) => i && i <= 17)
          .map(row => {
            const cells = $(row)
              .find('td')
              .get()
              .map(td => $(td).text());

            return [...cells]
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

        // console.log(JSON.stringify({ week2Points: weeks[week + 1].points}, null, 2));

        if (week === 1 && weeks[week].points) return;

        const adjustment = thisWeek.receptions * TE_RECEPTION_BONUS;

        updatePlayerPoints({
          playerId: id,
          points: thisWeek.points + adjustment
        });

        updateTotalPoints({
          teamId: teamIds[teamIdIndex],
          adjustment
        });
      });
    });
  };

  refreshTePoints();
};

chrome.storage.sync.get(({ [TE_PPR_BONUS_KEY]: '' }, loadAdjustments));
