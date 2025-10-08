// Generating .mp4 stimuli for Perceived Animacy task
// Adapted from jsPsych version to Node.js
// by Krisztina Jedlovszky 10/2025

import fs from "fs";
import path from "path";
import { createCanvas } from "canvas";
import { execSync } from "child_process";
import { Parser } from "json2csv";

// ---------------- CONFIG ----------------
const numTrials = 10;
const trialLengthSeconds = 5;
const fps = 60;
const msPerFrame = 1000 / fps;
const canvasWidth = 600;
const canvasHeight = 600;
const videosDir = path.join(process.cwd(), "videos"); // folder to save outputs to
const N_dots_total = 9;
const N_chasers = 0;   // in this logic 1 or 0
const N_distractors = N_dots_total - N_chasers;

// Sheep
const Target_radius = 12;
const Target_linewidth = 5;
const Target_destination_update_lower = 6; //6 frames = 100ms;
const Target_destination_update_upper = 24; // 24 frames = 400ms;

// Wolf
const Chaser_radius = 12;
const Chaser_motion_noise_level = 0.08;
const Chaser_initial_speed = 2;
const Chaser_final_speed = 3.33;
const speed_increase_window = 10000;
const Chaser_destination_update_lower = 12; //12 frames = 200;
const Chaser_destination_update_upper = 48; //48 frames = 800;
const chaser_to_target_v_ratio_upper = 2.0;
const chaser_to_target_v_ratio_lower = 1.2;
const chasingSubtlety = 30; // degrees
const chasingAngleOffsetMax = chasingSubtlety * Math.PI / 180;

// Distractors
const Distractor_color = "black";
const Distractor_linewidth = 3;
const Distractor_speed_change_likelihood = 0.15;
const Distractor_angle_change_max = Math.PI / 2;
const safety_margin = 15;

// Ensure folder
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir);

// ---------------- UTILITY FUNCTIONS ----------------
const randomFromRange = (min, max) => Math.random() * (max - min) + min;
const getDistance = (x1, y1, x2, y2) =>
  Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
const keepInBounds = (pos, radius, max) => {
  if (pos < radius) return radius;
  if (pos > max - radius) return max - radius;
  return pos;
};

// ---------------- DRAW FUNCTIONS ----------------
function drawTarget(ctx, x, y) {
  ctx.lineWidth = Target_linewidth;
  ctx.strokeStyle = "green";
  ctx.beginPath();
  ctx.ellipse(x, y, Target_radius, Target_radius, 0, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.closePath();
}

function drawChaser(ctx, x, y) {
  ctx.lineWidth = Distractor_linewidth;
  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.ellipse(x, y, Chaser_radius, Chaser_radius, 0, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.closePath();
}

function drawDistractor(ctx, x, y) {
  ctx.lineWidth = Distractor_linewidth;
  ctx.strokeStyle = Distractor_color;
  ctx.beginPath();
  ctx.ellipse(x, y, Chaser_radius, Chaser_radius, 0, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.closePath();
}

// ---------------- MAIN ----------------
(async function generate() {
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  for (let trial = 1; trial <= numTrials; trial++) {
    console.log(`Generating trial ${trial}/${numTrials}`);

    const trialFramesDir = path.join(videosDir, `trial_${trial}_frames`);
    if (!fs.existsSync(trialFramesDir)) fs.mkdirSync(trialFramesDir);
    const csvData = [];

    // Initial positions
    let target = {
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      angle: Math.random() * 2 * Math.PI,
      counter: 0,
      nextChange: randomFromRange(
        Target_destination_update_lower,
        Target_destination_update_upper
      ),
    };
    let chaser = null;
    if (N_chasers > 0) {
      chaser = {
        x: randomFromRange(Target_radius + safety_margin, canvasWidth - Target_radius - safety_margin),
        y: randomFromRange(Target_radius + safety_margin, canvasHeight - Target_radius - safety_margin),
        angle: Math.random() * 2 * Math.PI,
        nextChangeFrame: Math.floor(randomFromRange(Chaser_destination_update_lower, Chaser_destination_update_upper)),
        chasingAngleOffset: randomFromRange(-chasingAngleOffsetMax, +chasingAngleOffsetMax),
        vx: 0,
        vy: 0,
      };
    }
    let distractors = Array.from({ length: N_distractors }, () => ({
      x: randomFromRange(Chaser_radius, canvasWidth - Chaser_radius),
      y: randomFromRange(Chaser_radius, canvasHeight - Chaser_radius),
      angle: Math.random() * 2 * Math.PI,
    }));

    const t0 = performance.now();

    // Frame loop
    for (let f = 0; f < fps * trialLengthSeconds; f++) {
      const timeNow = performance.now();
      const elapsed = timeNow - t0;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // --- Speeds ---
      const general_chaser_speed =
          Math.min(Chaser_final_speed,Chaser_initial_speed +
              (elapsed / speed_increase_window) *(Chaser_final_speed - Chaser_initial_speed)
          );
      const Target_speed_limit = general_chaser_speed * chaser_to_target_v_ratio_upper;
      const Target_speed_lower_limit =
        general_chaser_speed * chaser_to_target_v_ratio_lower;

      // --- Target (sheep) motion ---
      if (!target.v)
        target.v = randomFromRange(Target_speed_lower_limit, Target_speed_limit);
      if (!target.vx)
        target.vx = target.v * Math.cos(target.angle),
        (target.vy = target.v * Math.sin(target.angle));

      target.x += target.vx;
      target.y += target.vy;

      // Keep inside bounds and reflect smoothly
      if (target.x + Target_radius >= canvasWidth || target.x - Target_radius <= 0)
        target.vx *= -1, (target.angle = Math.PI - target.angle);
      if (target.y + Target_radius >= canvasHeight || target.y - Target_radius <= 0)
        target.vy *= -1, (target.angle *= -1);

      target.x = keepInBounds(target.x, Target_radius, canvasWidth);
      target.y = keepInBounds(target.y, Target_radius, canvasHeight);

      target.counter++;
      if (target.counter > target.nextChange) {
        target.counter = 0;
        target.nextChange = randomFromRange(
          Target_destination_update_lower,
          Target_destination_update_upper
        );
        const angleChange = (Math.random() - 0.5) * (Math.PI / 2);
        target.angle += angleChange;
        const speedChange = (Math.random() * 0.1 - 0.05) * Target_speed_limit;
        target.v = Math.max(
          Target_speed_lower_limit,
          Math.min(Target_speed_limit, target.v + speedChange)
        );
        target.vx = target.v * Math.cos(target.angle);
        target.vy = target.v * Math.sin(target.angle);
      }

      // --- Chaser (wolf) motion ---
      if (N_chasers > 0) {
        if (f >= chaser.nextChangeFrame) {
          const angleToTarget = Math.atan2(target.y - chaser.y, target.x - chaser.x);
          chaser.chasingAngleOffset = randomFromRange(-chasingAngleOffsetMax, chasingAngleOffsetMax);
          chaser.angle = angleToTarget + chaser.chasingAngleOffset;
          chaser.nextChangeFrame = f + Math.floor(randomFromRange(Chaser_destination_update_lower, Chaser_destination_update_upper));
        }

        // Velocity with per-frame noise
        chaser.vx = general_chaser_speed * Math.cos(chaser.angle) + randomFromRange(-Chaser_motion_noise_level, Chaser_motion_noise_level);
        chaser.vy = general_chaser_speed * Math.sin(chaser.angle) + randomFromRange(-Chaser_motion_noise_level, Chaser_motion_noise_level);

        chaser.x += chaser.vx;
        chaser.y += chaser.vy;

        // Bounce at edges
        if (chaser.x <= Chaser_radius || chaser.x >= canvasWidth - Chaser_radius) chaser.vx *= -1;
        if (chaser.y <= Chaser_radius || chaser.y >= canvasHeight - Chaser_radius) chaser.vy *= -1;

        chaser.x = keepInBounds(chaser.x, Chaser_radius, canvasWidth);
        chaser.y = keepInBounds(chaser.y, Chaser_radius, canvasHeight);
      }
      // --- Distractors ---
      distractors.forEach((d) => {
        if (Math.random() < Distractor_speed_change_likelihood)
          d.angle += randomFromRange(
            -Distractor_angle_change_max,
            Distractor_angle_change_max
          );
        d.vx = general_chaser_speed * Math.cos(d.angle);
        d.vy = general_chaser_speed * Math.sin(d.angle);
        d.x += d.vx;
        d.y += d.vy;

        if (d.x - Chaser_radius < 0 || d.x + Chaser_radius > canvasWidth)
          (d.vx *= -1), (d.angle = Math.PI - d.angle);
        if (d.y - Chaser_radius < 0 || d.y + Chaser_radius > canvasHeight)
          (d.vy *= -1), (d.angle *= -1);

        d.x = keepInBounds(d.x, Chaser_radius, canvasWidth);
        d.y = keepInBounds(d.y, Chaser_radius, canvasHeight);
      });

      // --- Draw ---
      drawTarget(ctx, target.x, target.y);
      if (N_chasers > 0) {
        drawChaser(ctx, chaser.x, chaser.y);
      }
      distractors.forEach((d) => drawDistractor(ctx, d.x, d.y));

      // --- Log positions ---
      const row = {
        frame: f,
        targetX: target.x,
        targetY: target.y,
        //chaserX: chaser.x,
        //chaserY: chaser.y,
        chaserX: N_chasers > 0 ? chaser.x : null,
        chaserY: N_chasers > 0 ? chaser.y : null,
      };
      distractors.forEach((d, i) => {
        row[`d${i}_x`] = d.x;
        row[`d${i}_y`] = d.y;
      });
      csvData.push(row);

      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(
        path.join(trialFramesDir, `frame_${String(f).padStart(4, "0")}.png`),
        buffer
      );
    }

    // Save outputs
    const parser = new Parser();
    const csv = parser.parse(csvData);
    fs.writeFileSync(path.join(videosDir, `trial_${trial}_positions.csv`), csv);

    const videoPath = path.join(videosDir, `trial_${trial}.mp4`);
    execSync(
      `ffmpeg -y -r ${fps} -i "${trialFramesDir}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p "${videoPath}"`,
      { stdio: "inherit" }
    );
    fs.rmSync(trialFramesDir, { recursive: true, force: true });
    console.log(`Trial ${trial} video saved: ${videoPath}`);
  }

  console.log("All trials generated!");
})();
