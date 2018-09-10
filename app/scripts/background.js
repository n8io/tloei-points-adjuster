const storage = chrome.storage;

document.addEventListener('DOMContentLoaded', () => {
  const defaults = {
    tePprBonus: 12
  };

  chrome.runtime.onInstalled.addListener(details => {
    console.log('previousVersion', details.previousVersion);
    storage.sync.set(defaults, () => {
      console.log(`${new Date()}: tePprBonus set to ${defaults.tePprBonus}`);
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
});
