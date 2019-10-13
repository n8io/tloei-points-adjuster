const runScript = func => {
  try {
    return eval('(' + func + ')();');
  } catch (e) {
    console.error(e);
  }
};
export { runScript };
