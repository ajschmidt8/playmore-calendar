const { getEvents } = require("./get-playmore-events");
require("dotenv").config();

(async () => {
  const events = await getEvents();
  console.log(events);
})();
