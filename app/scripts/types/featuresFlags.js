export const isSuperAdmin = async () => {
  const myTeamLink = document.body.querySelector(
    '.myTeam.NavSecondary__Item a'
  );

  if (!myTeamLink) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(isSuperAdmin());
      }, 1000);
    });
  }

  const SUPER_ADMIN_TEAM_ID = 1;

  const teamId = parseInt(new URL(myTeamLink.href).searchParams.get('teamId'));

  return SUPER_ADMIN_TEAM_ID === teamId;
};
