const settings = chrome.storage.sync;

const getElement = selector => document.querySelector(selector);

const loadOption = (key, callback) => settings.get({ [key]: '' }, callback);

const setInputValue = ({ key, value }) => {
  console.log(`${new Date()}: Setting #${key} input value: ${value}`);

  getElement(`#${key}`).value = value;
};

const loadOptions = () => {
  const keys = ['tePprBonus'];

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

    status.textContent = '✅ Options saved';

    setTimeout(function() {
      status.textContent = ' ';
    }, 750);
  });
};

const onSave = () => {
  const tePprBonus = Number(getElement('#tePprBonus').value);

  saveOptions({ tePprBonus });
};

document.addEventListener('DOMContentLoaded', () => {
  loadOptions();

  getElement('#saveBtn').addEventListener('click', onSave);
});

// {
//   loadOptions();

//   chrome.storage.sync.get('tePprBonus', data => {

//     console.log({ tePprBonus });

//     tePprBonusInput.value = tePprBonus;

//     tePprBonusInput.addEventListener(
//       'change',
//       ({ target: { value } }) => {
//         chrome.storage.sync.set({ tePprBonus: value }, () => {
//           console.log('The tePointPerReception is set to ' + value);
//         });
//       }
//     );
//   });
// });
