import debug from 'debug';

const espn = () => {
  const scripts = [...document.getElementsByTagName('script')];
  const strEspn = scripts
    .map(script => script.textContent)
    .find(str => str.indexOf('__NEXT_DATA__') > -1)
    .replace('__NEXT_DATA__ =', '')
    .split('module={}')[0];
  const settings = JSON.parse(strEspn);
  const espn = settings.props.pageProps.page.config;

  console.info('ESPN Settings', espn);

  return espn;
};

const leagueId = () => {
  const url = new URL(window.location);
  const leagueId = parseInt(url.searchParams.get('leagueId'), 10);

  console.info('LeagueId', leagueId);

  return leagueId;
};

const matchupId = () =>
  new Promise(resolve => {
    const fetchEl = () => {
      const el = document.body.querySelector('.carousel__slide.selected span');

      if (el) {
        const id = parseInt(el.getAttribute('data-link-id'), 10);

        console.info('MatchupId', id);

        return resolve(id);
      }

      setTimeout(fetchEl, 500);
    };

    fetchEl();
  });

const weekId = async () => {
  const here = new URL(window.location);
  const leagueId = parseInt(here.searchParams.get('leagueId'), 10);
  let weekId = parseInt(here.searchParams.get('matchupPeriodId'), 10);

  if (isNaN(weekId)) {
    const MATCHUPS = 'mMatchupScore';
    const baseUrl = new URL('https://fantasy.espn.com');
    const scripts = [...document.getElementsByTagName('script')];
    const strEspn = scripts
      .map(script => script.textContent)
      .find(str => str.indexOf('__NEXT_DATA__') > -1)
      .replace('__NEXT_DATA__ =', '')
      .split('module={}')[0];
    const settings = JSON.parse(strEspn);
    const { currentSeason: seasonId } = settings.props.pageProps.page.config;
    const url = new URL(
      `/apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${leagueId}`,
      baseUrl.href
    );

    url.searchParams.set('view', MATCHUPS);

    const { scoringPeriodId } = await fetch(url.href).then(r => r.json());

    weekId = scoringPeriodId;
  }

  console.info('WeekId', weekId);

  return weekId;
};

export const Functions = {
  espn,
  leagueId,
  matchupId,
  weekId
};
