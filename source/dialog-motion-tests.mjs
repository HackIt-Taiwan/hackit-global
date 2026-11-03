import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const source = fs.readFileSync(
  new URL("./static/app.js", import.meta.url),
  "utf8",
);
const code = source.slice(
  source.indexOf("// V12: one race-safe"),
  source.indexOf("// Explicit wrap also keeps keyboard"),
);
class Dialog {
  constructor() {
    this.open = false;
    this.dataset = {};
    this.style = { setProperty() {}, removeProperty() {} };
    this.events = {};
    this.closeButton = {
      addEventListener: (type, fn) => (this.events["button:" + type] = fn),
    };
    this.animations = [];
    this.closes = 0;
    this.opens = 0;
  }
  querySelector() {
    return this.closeButton;
  }
  addEventListener(type, fn) {
    this.events[type] = fn;
  }
  showModal() {
    this.open = true;
    this.opens++;
  }
  close() {
    this.open = false;
    this.closes++;
    this.events.close?.();
  }
  getBoundingClientRect() {
    return { left: 10, right: 100, top: 10, bottom: 100 };
  }
  animate(frames, options) {
    let resolve, reject;
    const a = {
      frames,
      options,
      finished: new Promise((yes, no) => {
        resolve = yes;
        reject = no;
      }),
      finish() {
        resolve();
      },
      cancel() {
        reject(new Error("cancelled"));
      },
    };
    this.animations.push(a);
    return a;
  }
}
const join = new Dialog(),
  story = new Dialog(),
  reduce = {
    matches: false,
    addEventListener(type, fn) {
      this.changed = fn;
    },
  };
const context = {
  WeakMap,
  document: {
    getElementById: (id) => (id === "join-dialog" ? join : story),
    querySelectorAll: () => [],
  },
  window: {},
  reduce,
  getComputedStyle: () => ({ opacity: "1", transform: "none" }),
};
vm.createContext(context);
vm.runInContext(code + "\nglobalThis.api={openDialog,closeDialog};", context);
const { openDialog, closeDialog } = context.api;
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
openDialog(join);
assert(join.open);
assert.equal(join.animations.at(-1).options.duration, 180);
assert.equal(join.animations.at(-1).frames[0].opacity, "0");
join.animations.at(-1).finish();
await flush();
assert.equal(join.dataset.dialogMotion, undefined);
closeDialog(join);
assert(join.open, "native dialog remains modal during exit");
assert.equal(join.animations.at(-1).options.duration, 140);
const closing = join.animations.at(-1),
  count = join.animations.length;
closeDialog(join);
assert.equal(join.animations.length, count, "repeated close does not restart");
openDialog(join);
closing.finish();
await flush();
assert(join.open, "reopen cancels pending close");
assert.equal(join.closes, 0);
assert.equal(join.opens, 1, "already-open dialog keeps native focus owner");
join.animations.at(-1).finish();
await flush();
let prevented = false;
join.events.cancel({
  preventDefault() {
    prevented = true;
  },
});
assert(prevented);
assert(join.open);
join.animations.at(-1).finish();
await flush();
assert(!join.open);
assert.equal(join.closes, 1);
openDialog(story);
story.animations.at(-1).finish();
await flush();
story.events.click({ target: story.closeButton, clientX: 0, clientY: 0 });
assert.equal(
  story.dataset.dialogMotion,
  undefined,
  "keyboard-generated child click is not backdrop",
);
assert(story.open);
story.events.click({ target: story, clientX: 0, clientY: 0 });
assert.equal(story.dataset.dialogMotion, "closing");
reduce.matches = true;
reduce.changed();
assert(
  !story.open,
  "changing reduced-motion finishes pending close immediately",
);
const before = story.animations.length;
openDialog(story);
assert(story.open);
assert.equal(story.animations.length, before);
closeDialog(story);
assert(!story.open);
console.log(
  "Dialog motion tests passed: 180/140ms, modal exit hold, reopen race, repeated close, Escape, backdrop, native focus-owner retention and reduced-motion immediate path.",
);
