import { Adjustment } from './types/adjustment';
import { start as startBoxScore } from './boxscore';
import { start as startFantasyCast } from './fantasycast';

const timeouts = {};

const determineAdjustmentType = () => {
  const { location } = window;
  const { pathname } = location;

  if (pathname.endsWith('/boxscore')) return Adjustment.BOX_SCORE;
  if (pathname.endsWith('/fantasycast')) return Adjustment.FANTASY_CAST;

  return Adjustment.UNKNOWN;
};

const init = () => {
  Object.values(timeouts).map(clearInterval);

  switch (determineAdjustmentType()) {
    case Adjustment.BOX_SCORE:
      console.info('Adjusting box scores...');
      timeouts.box = setInterval(startBoxScore, 5000);
      break;
    case Adjustment.FANTASY_CAST:
      console.info('Adjusting FantasyCast scores...');
      timeouts.fantasyCast = setInterval(startFantasyCast, 5000);
      break;
    default:
      break;
  }
};

const startListeners = () => {
  let oldHref = document.location.href;

  window.onload = () => {
    const bodyList = document.querySelector('body');
    const observer = new MutationObserver(mutations => {
      mutations.forEach(() => {
        if (oldHref != document.location.href) {
          oldHref = document.location.href;

          console.info(`Url changed ${oldHref}. Rerunning init...`);
          init();
        }
      });
    });

    observer.observe(bodyList, {
      childList: true,
      subtree: true
    });
  };

  init();
};

chrome.storage.sync.get({}, startListeners);
