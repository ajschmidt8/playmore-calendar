const puppeteer = require("puppeteer");
const baseUrl = "https://playmorenj.leagueapps.com";
const upcomingEvents = [];
const locationMap = {};

module.exports.getEvents = async () => {
  const browser = await puppeteer.launch({
    headless: true,
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
  await page.keyboard.press("Enter");
  await page.waitForNavigation();
  const teams = await page.$$eval(
    "#ga-members-table tr td:nth-child(2) > strong a",
    teams =>
      teams.map(team => ({
        name: team.innerText.trim(),
        path: team.getAttribute("href")
      }))
  );

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    await page.goto(`${baseUrl}${team.path}`);
    try {
      await page.waitFor(".schedule-game", { timeout: 5000 });
    } catch (error) {
      console.error(`No games found for ${team.name}: ${baseUrl}${team.path}`);
    }

    const pageEvents = await page.$$eval(
      ".schedule-game:not(.completed)",
      events =>
        events.map(event => {
          const date = event
            .querySelector(".sched-start-date .date")
            .innerText.trim()
            .split(", ")[1];
          const time = event
            .querySelector(".sched-start-date .time")
            .innerText.trim();
          const opponent = event
            .querySelector(".game .event-team a")
            .innerText.trim()
            .slice(0, -4);
          const venueEl = event.querySelector(".game .event-details a");
          const venueStr = venueEl.innerText.trim();
          const venuePath = venueEl.getAttribute("href");

          return {
            summary: `vs. ${opponent}`,
            date: new Date(`${date} 2020 ${time} EST`).toISOString(),
            venue: { name: venueStr, path: venuePath }
          };
        })
    );
    upcomingEvents.push(...pageEvents);
  }

  // resolve locations
  for (let i = 0; i < upcomingEvents.length; i++) {
    const event = upcomingEvents[i];
    const venue = event.venue;

    if (!locationMap[venue.name]) {
      await page.goto(`${baseUrl}${venue.path}`);
      const address = await page.$eval(".vcard .adr", el =>
        el.innerText.replace("\n", " ")
      );
      locationMap[venue.name] = address;
    }

    venue.address = locationMap[venue.name];
  }

  await browser.close();

  return upcomingEvents;
};
