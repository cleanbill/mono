interface UpdateValue {
  (key: string, value: string, indexi: number, length: number);
}

const options = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hour12: false,
};

const log = (message: string) => {
  const date = new Intl.DateTimeFormat("default", options).format(new Date());
  console.log(date, message);
};

const error = (message: string) => {
  const date = new Intl.DateTimeFormat("default", options).format(new Date());
  console.error(date, message);
};

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;


let connected = false;
const watertowerConnect = async (
  updateFn: UpdateValue,
  stateFn: Function,
  doc = document,
  address = ((window.location.protocol == "http:") ? "ws://" : "wss://") + window.location.hostname + ":" + window.location.port + "/ws",
) =>
  new Promise((resolve, reject) => {
    const wtConnection = connectSetup(updateFn, stateFn);
    let watertower;
    let connectionPoll;
    const connect = async (e) => {
      try {
        watertower = await wtConnection(doc, address);
        console.log("Connected at last!");
        clearInterval(connectionPoll);
        resolve(watertower);
      } catch (er) {
        console.error("Connection failed");
        console.error(er);
      }
    };

    const firstConnect = async () => {
      try {
        watertower = await wtConnection(doc, address);
        console.log("Connected first time!");
        resolve(watertower);
      } catch (er) {
        console.error("First Connection failed");
        console.error(er);
        connectionPoll = setInterval(connect, 30000);
      }
    };
    firstConnect();
  });

const extraUUID = (text: string) => {
  if (!text) {
    return -1;
  }
  try {
    const obj = JSON.parse(text);
    return obj.data ? obj.data.__UUID : '- None -';
  } catch (err) {
    console.error('bad object after parse ', text);
    console.error(err);
  }
  return -1;
}


const send = (data: string) => {
  if (data.indexOf("logon") > -1) {
    log("Sending log on");
  } else {
    log(data);
    log("Sending UUID " + extraUUID(data));
  }
  try {
    ws.send(data);
  } catch (err) {
    console.error('Cannot send via websocker ', ws);
    console.error(err);
  }
};

const isString = (value: any) => typeof value === 'string' || value instanceof String;

const makeData = (message: any) => {
  const data = message.data;
  if (data) {
    const keys = Object.keys(data);
    keys.forEach((key) => {
      if (key != "password" && key != "u") {
        data[key] = escape(data[key]);
      }
    });
  }
  const sendingData = isString(message) ? message : JSON.stringify(message);
  return sendingData;
};

const sender =
  (message = {
    "action": "update",
    "data": <any>window.localStorage,
  }) => {
    const data = makeData(message);
    if (ws.readyState == OPEN) {
      send(data);
      return;
    }

    const state = ws.readyState == CLOSED ? "closed" : "closing";
    error("Websocket is " + state);
    const waiting = () => {
      send(data);
      ws.removeEventListener("open", waiting);
    };
    ws.addEventListener("open", waiting);
  };

const login = (id, p) => {
  const data = { action: "logon", data: { id, p } };
  sender(data);
};

const store = (doc: Document) => {
  const data = {
    "action": "update",
    "data": window.localStorage,
  };
  const event = new CustomEvent("storage", { detail: data });
  doc.dispatchEvent(event);
};

const load = (uuid = null) => {
  const data = uuid ? { uuid } : null;
  const message = {
    "action": "load",
    data,
  };
  log("loading");
  sender(message);
};

const listenerSetup = (incoming: Function) =>
  async ({ target }) => {
    log("websocket open");
    ws.addEventListener("message", incoming);
  };

const escape = (value) => {
  if (!value) {
    return "";
  }
  if (value == "undefined") {
    return "";
  }
  if (value == "null") {
    return "";
  }
  return value;
};

const messageListenerSetup = (
  updateFn: UpdateValue,
  load: Function,
  doc: Document,
) =>
  (event) => {
    const msg = JSON.parse(event.data);
    log(msg);
    if (msg.state == 409) {
      error("Out of sync... overwriting, maybe should merge???");
      //load();
      updateFn('__UUID', msg.data.__UUID, 1, 1);
    }

    const reply = new CustomEvent(
      "watertower-message",
      { detail: msg.message },
    );
    doc.dispatchEvent(reply);
    if (msg.state == 400 && msg.action === "update") {
      error("Data is out of step! :::" + msg.message);
      error("Gonna sync back");
    } else if (msg.state != 200) {
      return;
    }

    if (msg.action == "logon") {
      connected = true;
    }

    if (
      msg.action != "update" && msg.action != "load" &&
      msg.action != "broadcast"
    ) {
      log("Doing nothing with action " + msg.action);
      return;
    }
    const data = msg.data;
    if (!data) {
      error("no data");
      return;
    }
    const keys = Object.keys(data);
    keys.forEach((key, index) => {
      if (key != "password") {
        updateFn(key, escape(data[key]), index, keys.length);
      }
    });
  };

const createWebsocket = (address, incoming, stateFn) => {
  ws = new WebSocket(address);
  ws.onerror = function (event) {
    error("Socket error");
    error(event);
    stateFn("Error", event);
    setTimeout(function () {
      createWebsocket(address, incoming, stateFn);
    }, 5000);
  };
  ws.onclose = function (event) {
    error("Socket closed, retrying connection in 5 secs");
    error(event);
    stateFn("Closed", event);
    setTimeout(function () {
      createWebsocket(address, incoming, stateFn);
    }, 5000);
  };
  ws.onmessage = function (event) {
    log("Incoming message");
    incoming(event);
  };
  ws.onopen = function (event) {
    log("Websocket open for business");
    const api = { load, login, store };
    stateFn("Connected", api);
  };

}

let ws;
const websocketSetup = (address, incoming, stateFn) => {
  try {
    createWebsocket(address, incoming, stateFn);
  } catch (err) {
    stateFn('Crashed', err);
    throw err;
  }
}

const connectSetup = (updateFn: UpdateValue, stateFn: Function) =>
  async (
    doc = document,
    address = ((window.location.protocol == "http:") ? "ws://" : "wss://") + window.location.hostname + ":" + window.location.port + "/ws",
  ) => {
    try {
      const incoming = messageListenerSetup(updateFn, load, doc)
      websocketSetup(address, incoming, stateFn);
      doc.addEventListener("storage", (e: any) => {
        const data = e.detail
        sender(data);
      });
    } catch (err) {
      error(err);
      throw err;
    }
  };

export { connectSetup, UpdateValue, connected, watertowerConnect };