import { bagItAndTagIt, put, setMode, tools } from "./dist/binder.js";
import { swapperPlugin } from "./dist/plugins/swapperPlugin.js";
import { togglePlugin } from "./dist/plugins/togglePlugin.js";
import { showHidePlugin, showHideSwap } from "./dist/plugins/showhidePlugin.js";
import {
  moverPlugin,
  moverValue,
  moverCallback,
} from "./dist/plugins/moverPlugin.js";
import { ifPlugin } from "./dist/plugins/ifPlugin.js";
import { swapPlugin, actionMover } from "./dist/plugins/swapPlugin.js";
import { clickPlugin, addClickFunction } from "./dist/plugins/clickPlugin.js";

const group = "swaps";
const actionID = "captain-butt";
const data = "- Assigned Data -";
const dataIDpostFix = "data";
const mover = { group, actionID, data, dataIDpostFix };
actionMover(mover);

moverValue("Captain");
moverCallback(() => {
  showHideSwap("capshow");
});

console.log("TESTER ");

bagItAndTagIt([
  swapperPlugin,
  togglePlugin,
  showHidePlugin,
  moverPlugin,
  ifPlugin,
  swapPlugin,
  clickPlugin,
]);

const clearSport = (tools, ev) => {
  tools.setByName("sport", "");
};
addClickFunction("clearSport", clearSport);

const titleClicked = (tools, ev) => {
  alert(" boomer " + ev + tools);
  tools.setByName("mainTitle", "Hell");
};

addClickFunction("titleClicked", titleClicked);

const incrementSeconds = (minutes, seconds) => {
  seconds.innerText = 0;
  const mins = parseInt(minutes.innerText) + 1;
  if (mins < 10) {
    minutes.innerText = "0" + mins;
  }
  minutes.innerText = mins;
  seconds.classList.add("red");
  minutes.classList.add("red");
};

const increment = () => {
  const seconds = document.getElementById("seconds");
  const minutes = document.getElementById("minutes");
  const secs = parseInt(seconds.innerText) + 1;
  if (secs > 59) {
    incrementSeconds(minutes, seconds);
    return;
  }
  seconds.innerText = secs < 10 ? `0${secs}` : secs;
};

const zeroFill = (i) => {
  if (i < 10) {
    return "0" + i;
  }
  return i;
};

const timeFormat = () => {
  const date = new Date();
  const hr = zeroFill(date.getHours());
  const mn = zeroFill(date.getMinutes());
  return `${hr}:${mn}`;
};

const main = document.getElementById("results");

const modeButt = document.getElementById("mode");
let mode = "enable all";
tools.clickListener(modeButt, () => {
  if (mode === "enable all") {
    setMode("disable");
    mode = "disable some";
  } else {
    setMode("");
    mode = "enable all";
  }
  modeButt.innerText = "Mode now is " + mode;
  console.log("mode is " + mode);
});

const results = (what) => {
  const time = document.createElement("div");
  time.innerText = what.time;
  const event = document.createElement("div");
  event.innerText = what.event;
  const row = document.createElement("div");
  row.classList.add("results");
  row.classList.add("result");
  row.appendChild(time);
  row.appendChild(event);
  main.appendChild(row);
};

const kickoff = document.getElementById("kickoff");
let running;
tools.clickListener(kickoff, (e) => {
  e.target.style.display = "none";
  document.getElementById("playing").classList.remove("hide");
  document.getElementById("bench").classList.add("hide");
  document.getElementById("kickoff").classList.remove("hide");
  document.getElementById("state").classList.remove("hide");
  const time = timeFormat();
  results({ time, event: "Kick off" });
  running = setInterval(increment, 1000);
  const scoreLabel = document.getElementById("score");
  scoreLabel.innerText = "0";
  const vrsScoreLabel = document.getElementById("vrsScore");
  vrsScoreLabel.innerText = "0";
});

const state = document.getElementById("state");
tools.clickListener(state, (e) => {
  const pause = e.target.innerText === "Play On";
  if (pause) {
    document.getElementById("playing").classList.add("hide");
    document.getElementById("bench").classList.remove("hide");
    clearInterval(running);
  } else {
    running = setInterval(increment, 1000);
    document.getElementById("playing").classList.remove("hide");
    document.getElementById("bench").classList.add("hide");
  }
});

const concede = document.getElementById("vrsScore");
tools.clickListener("click", (e) => {
  const el = e.target;
  el.innerText = parseInt(el.innerText) + 1;
  const time = timeFormat();
  const name = document.getElementById("opposition").value;
  results({ time, event: "Conceded a goal by " + name });
});

for (let n = 1; n < 17; n++) {
  const el = document.getElementById("position" + n);
  if (el) {
    el.addEventListener("click", (e) => playerScored(e));
  }
}

const playerScored = (e) => {
  console.log(e.target.innerText + " scored!");
  const who = e.target.innerText;
  if (!who) {
    console.log(
      e.target.name + " (" + e.target.id + ") has no player defined!"
    );
    return;
  }
  const scoreLabel = document.getElementById("score");
  scoreLabel.innerText = parseInt(scoreLabel.innerText) + 1;
  const time = timeFormat();
  results({ time, event: "Goal by " + who });
  const scored = document.getElementById("scored");
  scored.innerText = "!!! " + who + " scored !!!";
  scored.classList.remove("hide");
  put(scored);
  setTimeout(() => {
    document.getElementById("scored").classList.add("hide");
  }, 3000);
};
