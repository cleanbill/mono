import { go, tools } from "./dist/binder.js";
import { clickPlugin, addClickFunction } from "./dist/plugins/clickPlugin.js";
import { ifPlugin } from "./dist/plugins/ifPlugin.js";
import { tablePlugin, addSetup, addSort } from "./dist/plugins/tablePlugin.js";
import { moverPlugin } from "./dist/plugins/moverPlugin.js";
import data from "./data.js";
console.log("Demo Page ");
// 4.  table - table plugin
const setupData = () => {
    const pops = data();
    return pops.map((list) => {
        return {
            Name: list[0],
            County: list[1],
            "Census 2001-04-29": list[2],
            "Census 2011-03-27": list[3],
            "Estimate 2018-06-30": list[4],
        };
    });
};
addSetup("pops", setupData);
// 1. Simple start
go([clickPlugin, ifPlugin, moverPlugin, tablePlugin]);
// 1. Simple start - extra
const clearSport = (tools, ev) => {
    tools.setByName("sport", "");
};
addClickFunction("clearSport", clearSport);
// 3. A little more - click plugin
const changeHours = (amount) => {
    const hours = parseInt(tools.getByName("danceFor"));
    const calculate = hours + amount;
    const result = calculate < 0 ? 0 : calculate;
    tools.setByName("danceFor", result);
};
addClickFunction("addHour", () => changeHours(1));
addClickFunction("takeHour", () => changeHours(-1));
tools.setByName("danceFor", 0);
// 4. table - extra
const sorter = (field, fn) => (direction) => (a, b) => {
    const first = fn(a[field]);
    const sec = fn(b[field]);
    if (first > sec) {
        return direction;
    }
    if (first < sec) {
        return direction * -1;
    }
    return 0;
};
let direction = 1;
const sort = (ev) => {
    console.log("sort ", ev);
    const est = sorter("Estimate 2018-06-30", (s) => parseInt(s));
    direction = direction * -1;
    console.log("direction ", direction);
    const fn = est(direction);
    addSort("pops", (a, b) => fn(a, b));
};
addClickFunction("sorter", sort);
//# sourceMappingURL=main.js.map