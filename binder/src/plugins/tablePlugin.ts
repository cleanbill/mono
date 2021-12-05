import { BinderTools, BinderPlugin } from "../binderTypes";
import data from "../data";
import worker from "./tablePluginWorker";

let binder: BinderTools;
const done = Array<String>();

const sortFuncs = new Map<string, Function>();
const tables = new Map<string, TableData>();
interface TableData {
  div: Element;
  name: string;
  template: string;
  mapList: any[];
  save: boolean;
}

const getStoredData = (name: string, binder: BinderTools): Array<any> => {
  const keysJSON = binder.getByName(name + "-table-keys");
  if (!keysJSON) {
    return [];
  }
  const keys = <Array<any>>JSON.parse(keysJSON);
  const data = keys.map((key) => binder.getStartsWith(name + "-" + key));

  const dataMap = Array<any>();
  keys.forEach((key, index) => {
    const fieldArray = data[index];
    fieldArray.forEach((field, fieldIndex) => {
      const row = dataMap[fieldIndex] ? dataMap[fieldIndex] : {};
      row[key] = field;
      dataMap[fieldIndex] = row;
    });
  });
  return dataMap;
};

export const clearTable = (name: string, bdr = binder) => {
  //  const keysJSON = bdr.getByName(name + "-table-keys");
  //  if (!keysJSON) {
  //    return [];
  //  }
  //  const keys = <Array<any>>JSON.parse(keysJSON);
  // const length = parseInt(bdr.getByName(name + "-table-length"));
  //  if (!length) {
  //    return [];
  //  }
  //  keys.forEach((key) => {
  //    bdr.removeStartsWith(name + "-" + key);
  //  });
  return bdr.removeStartsWith(name + "-");
};

export const addSetup = (name: string, setupData: any[]) => {
  if (setupData == undefined) {
    return Promise.reject('No setup data');
  }
  const tableData: TableData | undefined = tables.get(name);
  const storedData = getStoredData(name, binder);
  const mapList: any[] = storedData.length > 0 ? storedData : setupData;
  if (tableData == undefined) {
    return Promise.reject('No table data');
  }  
  tableData.mapList = mapList;
  return processData(tableData);
};

export const addRow = (name: string, rowData: any[]) => {
  if (rowData == undefined) {
    return Promise.reject('No row data');
  }
  const tableData: TableData | undefined = tables.get(name);
  if (tableData == undefined) {
    return Promise.reject('No table data');
  }  
  tableData.mapList.push(rowData);
  tableData.save = true;
  return processData(tableData);  
};

export const takeRow = (name: string, index: number) => {
  if (index < 0) {
    return;
  }
  const tableData: TableData | undefined = tables.get(name);
  if (tableData != undefined && tableData.mapList.length > index) {
    delete tableData.mapList[index];
    processData(tableData);
  }
};

export const overWrite = (name: string, setupData: any[]) => {
  if (setupData == undefined) {
    return;
  }
  const tableData: TableData | undefined = tables.get(name);
  if (tableData != undefined) {
    tableData.mapList = setupData;
    processData(tableData);
  }
};

export const addSort = (name: string, sortFn: Function) => {
  const tableData: TableData | undefined = tables.get(name);
  sortFuncs.set(name, sortFn);
  if (tableData != undefined) {
    tableData.save = true;
    processData(tableData);
  }
};

export const tablePlugin: BinderPlugin = (tools: BinderTools) => {
  binder = tools;
  console.log("** Table plugin **");
  return {
    attributes: ["table"],
    process: (div: Element, name: string): boolean | Promise<boolean> => {
      if (done[name]) {
        return false;
      }
      done.push(name);
      if (!window.Worker) {
        console.error("TABLE: No worker, what old browser are you using!?!");
        return false;
      }
      const data = generateData(binder, name, div);
      processData(data);
      return true;
    },
  };
};

const generateData = (
  binder: BinderTools,
  name: string,
  div: Element
): TableData => {
  //const tableWorker = new Worker("./tablePluginWorker.js");
  const children = Array.prototype.slice.call(div.children);
  const templateRows = children.map((child) => child.outerHTML);
  const template = templateRows.join("\n");

  binder.populateStartsWith(name + "-");
  const storedData = getStoredData(name, binder);
  const mapList: any[] = storedData.length > 0 ? storedData : [];
  const save = storedData.length === 0;

  return { name, div, template, mapList, save };
};

const processData = (data: TableData) => {
  return new Promise((resolve, reject) =>{
    const tableWorker = new Worker("./dist/plugins/tablePluginWorker.js");
    //const tableWorker = new Worker("./tablePluginWorker.js");
    const sortFn = sortFuncs.get(data.name);
    if (sortFn) {
      const sorted = data.mapList.sort((a, b) => sortFn(a, b));
      data.mapList = sorted.map((item, index) => {
        item.index = index;
        if (item.updates) {
          item.updates.push(new Date());
        } else {
          item.updates = [new Date()];
        }
        return item;
      });
    }
  
    tables.set(data.name, data);
  
    const workerData = [data.name, data.template, data.mapList];
    tableWorker.postMessage(workerData);
  
    tableWorker.onmessage = (mess) => {
      populateTemplate(data.name, mess, data.div, data.save);
      tableWorker.terminate();
      resolve(data.name);
    };
  });
};

export const toggleClass = (name: string, row: number, classname: string) => {
  const keysJSON = binder.getByName(name + "-table-keys");
  if (!keysJSON) {
    return;
  }
  const keys = <Array<any>>JSON.parse(keysJSON);
  const classes = adjustClasses(name, row, classname);
  binder.setByName(name + "-table-classes", JSON.stringify(classes));
  setClass(name, row, classname, keys);
};

export const rowsWithoutClass = (name: string, classname: string) => {
  const data = getStoredData(name, binder);
  const classesJSON = binder.getByName(name + "-table-classes");
  if (!classesJSON) {
    return data;
  }
  const classes: Array<any> = JSON.parse(classesJSON);
  classes.forEach((cl) => {
    delete data[cl.row];
  });
  return data;
};

const adjustClasses = (name: string, row: number, classname: string) => {
  const classesJSON = binder.getByName(name + "-table-classes");
  if (!classesJSON) {
    return [{ row, classname }];
  }
  const classes: Array<any> = JSON.parse(classesJSON);
  const alreadyHas = classes.find(
    (rc) => rc.row === row && rc.classname === classname
  );
  if (alreadyHas) {
    // toggle out
    return classes.filter((rc) => rc.row !== row || rc.classname !== classname);
  }
  // Over write or insert
  const newClasses = classes.filter((rc) => rc.row != row);
  newClasses.push({ row, classname });
  return newClasses;
};

const setClass = (
  name: string,
  row: number,
  classname: string,
  keys: Array<any>
) => {
  keys.forEach((key) => {
    const id = name + "-" + key + "-" + row;
    const element = document.getElementById(id);
    if (element?.classList.contains(classname)) {
      element?.classList.remove(classname);
    } else {
      element?.classList.add(classname);
    }
  });
};

const reclass = (name: string) => {
  const keysJSON = binder.getByName(name + "-table-keys");
  if (!keysJSON) {
    return;
  }
  const keys = <Array<any>>JSON.parse(keysJSON);
  const classesJSON = binder.getByName(name + "-table-classes");
  if (!classesJSON) {
    return;
  }
  const classes: Array<any> = JSON.parse(classesJSON);
  classes.forEach((cr) => setClass(name, cr.row, cr.classname, keys));
};

const populateTemplate = (
  name: string,
  workerData,
  div: Element,
  save: boolean
) => {
  const html = workerData.data.html;
  const returnData = workerData.data.data;

  const generated = new DOMParser().parseFromString(html, "text/html");
  const body = generated.getElementsByTagName("BODY")[0];
  const children = Array.prototype.slice.call(body.children);
  const keys = new Set<String>();
  div.innerHTML = "";
  const datas = children.map((child, index) => {
    const id = child.id;
    const data = returnData[id];
    const end = id.lastIndexOf("-");
    const key = id.substring(name.length + 1, end);
    if (key.indexOf("$index") === -1 && data) {
      keys.add(key);
    }
    if (data) {
      child.innerText = data;
    }
    div.appendChild(child);
    return data;
  });

  if (save) {
    binder.putElements(children, datas);
    binder.setByName(name + "-table-keys", JSON.stringify([...keys]));
    const length = keys.size === 0 ? 0 : datas.length / keys.size;
    binder.setByName(name + "-table-length", length + "");
  }

  reclass(name);
};
