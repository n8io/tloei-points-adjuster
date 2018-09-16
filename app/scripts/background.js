document.addEventListener('DOMContentLoaded', () => {
  const storage = chrome.storage;

  const defaults = {
    tePprBonus: 12,
    pI10Bonus: 30,
    leagueId: 220779,
    teamId: 1
  };

  const settingsValues = Object.keys(defaults).reduce(
    (acc, key) => ({ ...acc, [key]: '' }),
    {}
  );

  const loadOptions = callback => storage.sync.get(settingsValues, callback);

  chrome.runtime.onInstalled.addListener(details => {
    console.log('previousVersion', details.previousVersion);

    loadOptions(currentSettings => {
      const reducedSettings = Object.keys(currentSettings).reduce(
        (acc, key) => ({
          ...acc,
          ...(currentSettings[key] ? { [key]: currentSettings[key] } : {})
        }),
        {}
      );

      const settings = {
        ...defaults,
        ...reducedSettings
      };

      storage.sync.set(settings, () => {
        console.log('Settings set', settings);

        chrome.tabs.create({
          url: chrome.extension.getURL('pages/options.html')
        });
      });
    });
  });

  storage.onChanged.addListener((changes, namespace) => {
    for (key in changes) {
      const storageChange = changes[key];

      console.log(
        `${new Date()}: Storage key "%s" in namespace "%s" changed. ' +
            'Old value was "%s", new value is "%s".`,
        key,
        namespace,
        storageChange.oldValue,
        storageChange.newValue
      );
    }
  });

  chrome.browserAction.onClicked.addListener(function clicked(tab) {
    storage.sync.get(
      ({ leagueId: 0, teamId: 0 },
      async ({ leagueId, teamId }) => {
        const { season, week } = await fetch(
          'https://feeds.nfl.com/feeds-rs/scores.json'
        ).then(r => r.json());

        const { url: currentTabUrl } = tab;
        const uri = new URL(currentTabUrl);
        const url = `http://games.espn.com/ffl/boxscorequick?leagueId=${leagueId}&teamId=${teamId}&seasonId=${season}&scoringPeriodId=${week}&view=scoringperiod&version=quick`;

        const tabLeagueId = Number(uri.searchParams.get('leagueId')) || 0;
        const tabTeamId = Number(uri.searchParams.get('teamId')) || 0;
        const tabSeasonId = Number(uri.searchParams.get('seasonId')) || 0;
        const tabWeekId = Number(uri.searchParams.get('scoringPeriodId')) || 0;

        console.log({ tabLeagueId, tabTeamId, leagueId, teamId });

        const shouldOpen =
          currentTabUrl
            .toLowerCase()
            .indexOf('games.espn.com/ffl/boxscorequick') === -1 ||
          tabTeamId !== teamId ||
          tabLeagueId !== leagueId ||
          tabSeasonId !== season ||
          tabWeekId !== week;

        console.log({ shouldOpen, url });

        if (shouldOpen) {
          console.log('Opening tab', { url });

          window.open(url, '_h2h');
        }
      })
    );
  });
});
