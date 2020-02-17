const { getEvents } = require("./get-playmore-events");
const { addToGcal } = require("./add-to-gcal");
require("dotenv").config();

(async () => {
  const events = await getEvents();
  await addToGcal(events);
})();
