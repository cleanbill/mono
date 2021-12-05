import { watertowerConnect } from "./dist/watertower.js";

const actions = {};
const data = {};

const obtainNumber = (key) => {
  const lastIndex = key.lastIndexOf('-');
  return key.substring(lastIndex);
}

const obtainElement = (key) => {
  const number = obtainNumber(key);
  const mainID = 'events-' + number;
  const maybeMain = document.getElementById(mainID);
  if (maybeMain) {
    return maybeMain;
  }
  const mainElement = document.createElement('div');
  mainElement.setAttribute('id', mainID);
  mainElement.classList.add('history');

  events.appendChild(mainElement);

  return mainElement;
}

const checkDone = (key, value) => {
  const done = document.getElementById(key);
  if (!done) {
    return false;
  }
  if (value.length == 0) {
    done.parentNode.removeChild(done);
  }
  return true;
}

const addToTable = (key, value) => {
  if (checkDone(key, value)) {
    return;
  }
  const events = obtainElement(key);
  const newElement = document.createElement('div');
  newElement.setAttribute('id', key);
  const end = value.indexOf(',') > -1 ? value.indexOf(',') : value.length;
  const shorten = value.substring(0, end);
  newElement.innerHTML = shorten;
  if (key.indexOf('time') > 0) {
    events.insertBefore(newElement, events.childNodes[0]);
  } else {
    events.appendChild(newElement);
  }
}

const standardAction = id => value => document.getElementById(id).innerHTML = value;

const scoredAction = value => {
  const message = value && value.indexOf("conceded a goal") > -1 ? "conceded a goal" : value;
  if (message == "Play started") {
    startClock();
  }
  if (message == "New Game") {
    const parent = document.getElementById("events");
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
  }
  const whistle = message == "New Game" || message == "Whistle blown" || message == "Final Whistle";
  if (whistle && running) {
    clearInterval(running);
  }
  const messageElement = document.getElementById("alertMessage");
  messageElement.innerHTML = message;
  setInterval(() => { messageElement.innerHTML = "" }, 10000);
  try {
    new Notification(value);
  } catch (error) {
    console.error(error);
  }
}

const setupActions = () => {
  actions.scored = scoredAction;
  const ids = ["score", "opponentScore", "opponentName", "mins", "secs", "teamName"];
  ids.forEach(id => actions[id] = standardAction(id));
}

const sortTheCrosses = (value) => {
  const crosses = JSON.parse(value);
  let el = document.getElementById("events--0");
  let count = 0;
  while (el != null) {
    const crossout = crosses.find(cross => cross.row == count);
    if (crossout) {
      el.classList.add("crossout");
    } else {
      el.classList.remove("crossout");
    }
    count = count + 1;
    el = document.getElementById("events--" + count);
  }
}

let noTable = true;
const waterFlow = (key, value, index, len) => {
  const id = index + 1;
  console.log(id + "/" + len + ". Key is ", key, " set to ", value);
  data[key] = value;
  const action = actions[key];
  if (key == "events-table-classes") {
    sortTheCrosses(value);
  } else if (key.startsWith('events') && key != "events-table-keys" && key != "events-table-length") {
    addToTable(key, value);
    noTable = false;
  } else if (action) {
    action(value);
  }
  if (id < len) {
    return;
  }

  console.log("***************************");
  console.log(data);
  console.log("***************************");

  if (!noTable) {
    // First stab at reversing the events so the most common is at the top
    const parent = document.getElementById("events");
    for (var i = 1; i < parent.childNodes.length; i++) {
      parent.insertBefore(parent.childNodes[i], parent.firstChild);
    }
    return;
  }

  let number = 0;
  while (checkDone("events--" + number, "")) {
    number++;
  }

}

let lastUpdateString;
let running;
const startClock = () => {
  let lastUpdate = lastUpdateString ? new Date(lastUpdateString) : new Date();
  if (running) {
    clearInterval(running);
  }
  running = setInterval(() => {
    lastUpdate = adjust(lastUpdate);
    lastUpdateString = "" + lastUpdate.getTime();
  }, 1000);
};

const adjust = (updatedAt) => {
  const now = new Date();
  const totalSeconds = Math.round(
    (now.getTime() - updatedAt.getTime()) / 1000,
  );
  const underLimit = 20;
  const toAdd = timeDiff(totalSeconds);
  incrementMinutes(underLimit, toAdd.minutes);
  incrementSeconds(underLimit, toAdd.seconds);
  return now;
};

const timeDiff = (totalSeconds) => {
  if (totalSeconds < 60) {
    const minutes = 0;
    const seconds = totalSeconds;
    return { minutes, seconds };
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return { minutes, seconds };
};

const getByName = id => {
  const el = document.getElementById(id);
  return el.innerText;
}

const setByName = (id, innerText) => {
  const el = document.getElementById(id);
  el.innerText = innerText;
}

const addClassByName = (id, cname) => {
  const el = document.getElementById(id);
  el.classList.add(cname);
}

const removeClassByName = (id, cname) => {
  const el = document.getElementById(id);
  el.classList.remove(cname);
}

const incrementSeconds = (underLimit, by) => {
  const parsedValue = parseInt(getByName("secs"));
  const currently = isNaN(parsedValue) ? 0 : parsedValue;
  const secs = currently + by;
  if (secs > 59) {
    setByName("secs", "00");
    incrementMinutes("mins", "secs", underLimit);
    return;
  }
  setByName("secs", secs < 10 ? `0${secs}` : secs);
};

const reset = () => {
  setByName("secs", "00");
  setByName("mins", "00");
  removeClassByName("secs", "red");
  removeClassByName("mins", "red");
};

export function timeFormat(date = new Date()) {
  const hr = zeroFill(date.getHours());
  const mn = zeroFill(date.getMinutes());
  const sc = zeroFill(date.getSeconds());
  return `${hr}:${mn}:${sc}`;
}

const incrementMinutes = (underLimit, by = 1) => {
  const parsedValue = parseInt(getByName("mins"));
  const currently = isNaN(parsedValue) ? 0 : parsedValue;
  const adjustTo = (currently + by);
  const mins = adjustTo > 90 ? 0 : adjustTo;
  if (mins > underLimit) {
    addClassByName("secs", "red");
    addClassByName("mins", "red");
  } else {
    removeClassByName("secs");
    removeClassByName("mins");
  }
  setByName("mins", zeroFill(mins));
};

const zeroFill = (i) => {
  if (i < 10) {
    return "0" + i;
  }
  return i;
};

const go = (socket) => {
  socket.load();
  console.log("Come on Forest");
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
    return;
  }

  // Let's check whether notification permissions have already been granted
  if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    return;
  }

  // Otherwise, we need to ask the user for permission
  if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
      }
    });
  }
}

const stateFn = (state, misc) => {
  setByName('state', state); // Connected, Error or Crashed;    
  if (state == "Connected") {
    go(misc);
  } else {
    console.error(misc);
  }
};

export async function start() {
  try {
    setupActions();
    watertowerConnect(waterFlow, stateFn);
  } catch (error) {
    console.error(error);
  }
}