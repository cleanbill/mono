export interface ToolGet {
  (key: string): RegEntry | undefined;
}

export interface ValueGet {
  (key: string): string;
}

export interface ValuesGet {
  (key: string): Array<string>;
}

export interface Do {
  (key: string);
}

export interface Get {
  (): string;
}

export interface ToolPut {
  (element: Element);
}

export interface ToolPuts {
  (element: Array<Element>, values: Array<string>);
}

export interface ToolGetValue {
  (element: Element): string | null;
}

export interface ToolSetValue {
  (element: Element, value: string);
}

export interface ClickFunction {
  (e: Event, tools: BinderTools): void;
}

export interface ToolSetName {
  (name: string, value: string, ignoreBroadcast?: boolean);
}

export interface ClickListener {
  (element: Element, fn: Function);
}

export interface StateListener {
  (fieldID: string, fn: Function);
}

export interface Checker {
  (element: HTMLElement);
}

export interface IDFixer {
  (element: HTMLElement, name: string): HTMLElement;
}

export interface BinderTools {
  put: ToolPut;
  putElements: ToolPuts;
  get: ToolGet;
  getValue: ToolGetValue;
  getStartsWith: ValuesGet;
  populateStartsWith: Do;
  removeStartsWith: Do;
  setValue: ToolSetValue;
  setByName: ToolSetName;
  clickListener: ClickListener;
  stateListener: StateListener;
  fixID: IDFixer;
  getByName: ValueGet;
}

export interface BinderPlugin {
  (tools: BinderTools): BinderPluginLogic;
}

export interface BinderPluginLogic {
  attributes: Array<string>;
  process: BinderPluginProcessor;
}

export interface BinderPluginProcessor {
  (element: Element, name: string): boolean | Promise<boolean>;
}

export interface RegEntry {
  currentValue: string;
  elements: Array<Element>;
}
