import { moveAction } from "./swapperMoveSubplugin.js";
// Just for testing....
let storage = window.localStorage;
export function setStorage(s) {
    storage = s;
}
// Just for testing....
let doc = document;
export function setDocument(d) {
    doc = d;
}
let binder;
const actions = new Array();
const movers = new Array();
export const actionMover = (dataMove) => {
    movers.push(dataMove);
};
export const swapAction = (actionF) => {
    actions.push(actionF);
};
export const swapDataPlugin = (tools) => {
    binder = tools;
    return {
        attributes: ["swap-data", "swap-data-action"],
        process: (element, name) => {
            registerMover(tools, element);
            tools.clickListener(element, (e) => click(element));
            return true;
        },
    };
};
const getGroupName = (element) => {
    const actionName = element.getAttribute("swap-data-action");
    if (actionName != null) {
        return false;
    }
    const groupName = element.getAttribute("swap-data");
    if (groupName == null) {
        return false;
    }
    return groupName;
};
const registerMover = (tools, element) => {
    const groupName = getGroupName(element);
    if (!groupName) {
        return;
    }
    movers
        .filter((mover) => mover.group === groupName)
        .forEach((mover) => {
        const creator = moveAction(tools, mover, element.id);
        swapAction(creator);
    });
};
const registerSelection = (element, groupName) => {
    element.classList.add("swap-data-selected");
    storage.setItem("swap-data-" + groupName, element.id);
    const actionID = storage.getItem("swap-data-action-" + groupName);
    if (actionID == null) {
        return;
    }
    const actionElement = doc.getElementById(actionID);
    if (actionElement == null) {
        console.error(actionID + " action is missing??");
        return;
    }
    doAction(actionElement, groupName);
};
const registerActionSelection = (element, groupName) => {
    element.classList.add("swap-data-selected");
    storage.setItem("swap-data-action-" + groupName, element.id);
};
const clickAction = (element) => {
    const groupName = element.getAttribute("swap-data-action");
    if (groupName == null) {
        console.error("swap-data action has no group? ", element);
        return;
    }
    doAction(element, groupName);
};
const doAction = (actionElement, groupName) => {
    const idSelected = storage.getItem("swap-data-" + groupName);
    const actionID = storage.getItem("swap-data-action-" + groupName);
    if (actionID == null && idSelected == null) {
        registerActionSelection(actionElement, groupName);
        return;
    }
    storage.removeItem("swap-data-action-" + groupName);
    if (idSelected == null) {
        console.log("Nothing selected for action yet");
        return;
    }
    storage.removeItem("swap-data-" + groupName);
    actionElement.classList.remove("swap-data-selected");
    const selected = doc.getElementById(idSelected);
    if (selected == null) {
        console.error(idSelected + " is missing??");
        return;
    }
    selected.classList.remove("swap-data-selected");
    const action = actions.find((acts) => acts.id === actionElement.id);
    if (action == null) {
        console.error("No id action registered for " + actionElement.id);
        return;
    }
    action.callback(selected);
};
export const click = (element) => {
    const groupName = element.getAttribute("swap-data");
    if (groupName == null) {
        clickAction(element);
        return;
    }
    const idSelected = storage.getItem("swap-data-" + groupName);
    if (!idSelected) {
        registerSelection(element, groupName);
        return;
    }
    storage.removeItem("swap-data-" + groupName);
    const selected = doc.getElementById(idSelected);
    if (selected == null) {
        console.error(idSelected + " is missing ???!");
        return;
    }
    selected.classList.remove("swap-data-selected");
    if (idSelected === element.id) {
        console.error("what are you doing swap with itself???!");
        return;
    }
    const swapValue = binder.getValue(selected) + "";
    const value = binder.getValue(element);
    if (value === swapValue) {
        console.log("Don't swap to itself '" + value + "'");
        return;
    }
    binder.setValue(element, swapValue + "");
    binder.setValue(selected, value + "");
    binder.put(element);
    binder.put(selected);
};
//# sourceMappingURL=swapDataPlugin.js.map