import {
  addClickFunction,
  broadcast,
  getByName,
  getValue,
  setByName,
} from "./dist/binder.js";
import { addRow } from "./dist/plugins/tablePlugin.js";

import "./index.js";
import "./teamplay.js";
import "./scoreclock.js";

import { timer } from "./time.js";

const getZeroValue = (name) => {
  const stored = getByName(name);
  return stored ? parseInt(stored) : 0;
};

export const currentScore = () => {
  const name = getByName("teamName");
  const opponent = getByName("opponentName");
  const oppScore = getByName("opponentScore");
  const score = getByName("score");
  return name + " " + score + " vrs " + opponent + " " + oppScore;
};

addClickFunction("scored", (event) => {
  const scorer = getValue(event.target);
  const name = scorer + "-scored";
  const goals = getByName(name);
  const currentGoals = goals ? parseInt(goals) + 1 : 1;
  setByName(name, currentGoals);

  const current = getZeroValue("score");
  const score = current + 1;
  setByName("score", score);
  console.log(scorer + " scored! Now have " + score + " goals in this game");
  scored("!!! " + scorer + " scored !!!");
  publish(scorer + " scored!, " + currentScore());
});

const scored = (text) => {
  setByName("scored", text);
  document.getElementById("scored").classList.remove("hide");
  setTimeout(
    () => document.getElementById("scored").classList.add("hide"),
    3000,
  );
};

addClickFunction("opponentScored", () => {
  const teamName = getByName("teamName");
  const opponentName = getByName("opponentName");
  const current = getZeroValue("opponentScore");
  const score = current + 1;
  setByName("opponentScore", score);


    
  const message = teamName + " have conceded a goal, " + currentScore();
  setByName("scored", message);

  console.log(
    opponentName + " have scored. Now have " + score + " goals in this game",
  );
  publish(message);
});

const zeroPad = (n) => (n > 9 ? n : "0" + n)

let running;
export const clock = timer("mins", "secs");

const log = (message) => {
  const dateString = df();
  console.log(dateString + " - " + message);
};

const df = (date = new Date()) => {
  const options = {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  };
  return new Intl.DateTimeFormat("default", options).format(date);
};
export const startClock = () => {
  const lastUpdateString = parseInt(getByName("lastUpdate"));
  let lastUpdate = lastUpdateString ? new Date(lastUpdateString) : new Date();
  running = setInterval(() => {
    lastUpdate = clock.adjust(lastUpdate);
    setByName("lastUpdate", lastUpdate.getTime(), false);
  }, 1000);
};

addClickFunction("whistle", () => {
  if (clock) {
    clearInterval(running);
  }
  setByName("scored", "Whistle blown");
  publish(" Whistle blown");
  broadcast();
  document.location.href = "./whistle.html";
});

export const publish = async (details) => {
  const date = new Date();
  const hh = zeroPad(date.getHours());
  const mm = zeroPad(date.getMinutes());
  const ss = zeroPad(date.getSeconds());
  const ent = {
    date,
    time: hh + ":" + mm + ":" + ss,
    details,
  };
  await addRow("events", ent);
  broadcast();
};
