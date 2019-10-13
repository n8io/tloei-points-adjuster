document.addEventListener('DOMContentLoaded', () => {
  const storage = chrome.storage;

  storage.onChanged.addListener((changes, namespace) => {
    for (key in changes) {
      const storageChange = changes[key];

      console.info(
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
      ({},
      async () => {
        const { season, week } = await fetch(
          'https://feeds.nfl.com/feeds-rs/scores.json'
        ).then(r => r.json());

        const url = `https://fantasy.espn.com/football/fantasycast?leagueId=220779&matchupPeriodId=${week}&seasonId=${season}`;

        console.info('Opening tab', { url });

        window.open(url, '_h2h');
      })
    );
  });
});
