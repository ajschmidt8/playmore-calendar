const puppeteer = require("puppeteer");
const baseUrl = "https://playmorenj.leagueapps.com";
require("dotenv").config();
const upcomingEvents = [];
const locationMap = {};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
    // args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1900,900"]
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1
  });
  await page.goto(`${baseUrl}/dashboard`);
  await page.type("#login_username", process.env.PM_USERNAME);
  await page.type("#login_password", process.env.PM_PASSWORD);
  await page.click('[data-id="login-submit"]');
  await page.waitForNavigation();
  const teamsPaths = await page.$$eval(
    "#ga-members-table tr td:nth-child(2) > strong a",
    teams => teams.map(team => team.getAttribute("href"))
  );

  for (let i = 0; i < teamsPaths.length; i++) {
    const teamPath = teamsPaths[i];
    await page.goto(`${baseUrl}${teamPath}`);
    await new Promise(res => setTimeout(res, 3000));
    const ownTeamName = await page.$eval("#page-title", el =>
      el.innerText.trim()
    );

    const pageEvents = await page.$$eval(
      ".schedule-game:not(.completed)",
      events =>
        events.map(event => {
          const date = event
            .querySelector(".sched-start-date .date")
            .innerText.trim();
          const time = event
            .querySelector(".sched-start-date .time")
            .innerText.trim();
          const opponent = event
            .querySelector(".game .event-team a")
            .innerText.trim()
            .slice(0, -4);
          const locationEl = event.querySelector(".game .event-details a");
          const locationStr = locationEl.innerText.trim();
          const locationUrl = locationEl.getAttribute("href");

          return {
            summary: `vs. ${opponent}`,
            date: `${date} ${time}`,
            location: { str: locationStr, url: locationUrl }
          };
        }),
      ownTeamName,
      locationMap
    );
    upcomingEvents.push(...pageEvents);
    // break;
  }

  console.log(upcomingEvents);

  // await new Promise(res => setTimeout(res, 5000));

  await browser.close();
})();
