import {
  addClickFunction,
  canBroadcast,
  getByName,
  setByName,
  watertowerConnect,
} from "./dist/binder.js";
import { showHideSwap } from "./dist/plugins/showhidePlugin.js";



export const connect = async (displayName = "connected", load = true) => {
  const waterFlow = (key, value, index, length) => {
    //    setByName(key, value);
  };

  const stateFn = (state, misc) => {
    console.log("websocket state -", state); // Connected, Error or Crashed;    
    if (state == "Connected") {
      setup(displayName, misc, load);
    } else {
      console.error(misc);
    }
  };
  watertowerConnect(waterFlow, stateFn);
};

const tellUser = (m) => {
  console.log(m);
};

const login = async (displayName, watertower, load) => {
  const u = getByName("u");
  const p = getByName("password");
  try {
    await watertower.login(u, p);
    await watertower.load();
    if (load) {
      canBroadcast();
    }

    showHideSwap(displayName);
  } catch (error) {
    console.error(error);
  }
}

const setup = (displayName, watertower, load) => {
  showHideSwap(displayName);
  window.addEventListener("watertower-message", tellUser);

  addClickFunction("login", async (e) => login(displayName, watertower, true));
  const u = getByName("u");
  const p = getByName("password");
  if (u && p) {
    login(displayName, watertower, load);
  }
};
