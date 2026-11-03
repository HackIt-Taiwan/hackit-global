import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const source = fs.readFileSync("source/static/app.js", "utf8");
const helpers = source.slice(
  source.indexOf("function timelineStops"),
  source.indexOf("function rememberReadingAnchor"),
);
let count = 0;
for (const H of [500, 760, 1000])
  for (const pan of [500, 5000, 20000])
    for (const missionPan of [0, 600, 4000])
      for (const compact of [true, false]) {
        const timeline = {
          lead: H * (compact ? 1 : 3),
          pan,
          wallHold: 120,
          bridge: H * (compact ? 0.65 : 1.2),
          missionPan,
          missionTravel: Math.max(missionPan, H * 0.45),
          outro: H * (compact ? 0.65 : 1.2),
        };
        timeline.total =
          timeline.lead +
          pan +
          timeline.wallHold +
          timeline.bridge +
          timeline.missionTravel +
          timeline.outro;
        const ctx = vm.createContext({
          timeline,
          clamp: (x) => Math.max(0, Math.min(1, x)),
        });
        vm.runInContext(helpers, ctx);
        for (let y = 0; y <= timeline.total; y += 37) {
          const p = ctx.physicalToPhase(y);
          assert.ok(Math.abs(ctx.phaseToPhysical(p) - y) < 1e-7);
          count++;
        }
        for (const offset of [1, 45, 189]) {
          const y = timeline.lead + pan / 3,
            p = ctx.physicalToPhase(y),
            q = ctx.physicalToPhase(y + offset);
          assert.ok(Math.abs(((q - p) / 0.42) * pan - offset) < 1e-7);
          count++;
        }
        if (missionPan > 0) {
          const y =
              timeline.lead +
              pan +
              timeline.wallHold +
              timeline.bridge +
              missionPan / 3,
            p = ctx.physicalToPhase(y),
            q = ctx.physicalToPhase(y + 189);
          assert.ok(Math.abs(((q - p) / 0.08) * missionPan - 189) < 1e-7);
          count++;
        }
      }
assert.ok(!source.includes("updateMobile"));
assert.ok(!source.includes("mix(renderedProgress,target"));
assert.ok(!/addEventListener\(['"](?:touchmove|wheel)['"]/.test(source));
console.log(
  `${count} physical scroll assertions passed; wall and full mission retain 1:1 displacement, no input hijack or lag interpolation.`,
);
