const settings = chrome.storage.sync;
const manifest = chrome.runtime.getManifest();

const getElement = selector => document.querySelector(selector);

const loadOption = (key, callback) => settings.get({ [key]: '' }, callback);

const setInputValue = ({ key, value }) => {
  console.log(`${new Date()}: Setting #${key} input value: ${value}`);

  getElement(`#${key}`).value = value;
};

const loadOptions = () => {
  const keys = ['leagueId', 'pI10Bonus', 'teamId', 'tePprBonus'];

  keys.forEach(key =>
    loadOption(
      key,
      data =>
        console.log(JSON.stringify(data, null, 2)) ||
        setInputValue({ key, value: Number(data[key]) })
    )
  );
};

const saveOptions = options => {
  settings.set(options, () => {
    console.log(`${new Date()}: Saved options`, options);

    const status = getElement('#status');

    status.setAttribute('title', manifest.version);

    status.textContent = '✅ Options saved';

    setTimeout(function() {
      status.textContent = `🏆 ${status.getAttribute('title')}`;
    }, 750);
  });
};

const onSave = () => {
  const leagueId = Number(getElement('#leagueId').value);
  const pI10Bonus = Number(getElement('#pI10Bonus').value);
  const teamId = Number(getElement('#teamId').value);
  const tePprBonus = Number(getElement('#tePprBonus').value);

  saveOptions({ leagueId, pI10Bonus, teamId, tePprBonus });
};

document.addEventListener('DOMContentLoaded', () => {
  loadOptions();

  const status = getElement('#status');

  status.setAttribute('title', manifest.version);
  status.innerText = `🏆 ${status.getAttribute('title')}`;

  getElement('#saveBtn').addEventListener('click', onSave);
});
