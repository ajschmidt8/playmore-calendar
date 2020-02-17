const { google } = require("googleapis");
const key = require("./google-service-account.json");
const auth = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  "https://www.googleapis.com/auth/calendar"
);
const calendar = google.calendar({
  version: "v3",
  auth
});
Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + h * 60 * 60 * 1000);
  return this;
};

module.exports.addToGcal = async events => {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    console.log(event);

    await calendar.events.insert({
      calendarId: process.env.CALENDAR_ID,
      requestBody: {
        summary: event.summary,
        location: event.venue.address,
        start: {
          dateTime: event.date,
          timeZone: "America/New_York"
        },
        end: {
          dateTime: new Date(event.date).addHours(1).toISOString(),
          timeZone: "America/New_York"
        }
      }
    });
  }
};

if (require.main === module) {
  (async () => await this.addToGcal({}))();
}
