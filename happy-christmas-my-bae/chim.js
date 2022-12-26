const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const imageSprites = new Image();
imageSprites.src = "flappy-penguin-set.png";

const audio = {
  penguin: new Audio("chimbenguin.aac"),
  hit: new Audio("hit.aac"),
  flappy: new Audio("flappy.aac"),
  score: new Audio("score.aac"),
  benguinnoise: new Audio("benguin-noise.aac"),
};

// general settings
let gameState = "start";
const gravity = 0.6;
const speed = 7.5;
const sizes = [51, 36];
const jump = -8.5;
const cTenth = canvas.width / 10;

let index = 0,
  bestScore = 0,
  flight,
  flyHeight,
  currentScore,
  pipe,
  lastTimeGameOver;

// pipe settings
const pipeWidth = 78;
const pipeGap = 260;
const pipeLoc = () =>
  Math.random() * (canvas.height - (pipeGap + pipeWidth) - pipeWidth) +
  pipeWidth;

const getNgokLevel = () => {
  if (currentScore < 2)
    return "Siêu ngôk. Ngôk hết sức. Không được nổi 3 điểm nữa -_-";
  if (currentScore < 5) return "Ngôk";
  if (currentScore < 10) return "Hơi ngôk";
  if (currentScore < 15) return "Good :>";
  if (currentScore < 20) return "Cố lên, sắp được thông điệp ẩn rùi";

  // Chơi thắng thì mới đọc được, chứ soi code ko hiểu dc đâu :>
  return decodeURIComponent(
    window.atob(
      "QWklMjBuZyVFMSVCQiU5RCUyMGIlRTElQkElQTFuJTIwZyVDMyVBMWklMjB0dWklMjBsJUUxJUJBJUExaSUyMGdpJUUxJUJCJThGaSUyMHYlRTElQkElQTd5JTIwJTNBKSklMjBTbyUyMHByb3VkJTIwb2YlMjB5b3UlMjAlRTIlOUQlQTQlRUYlQjglOEY="
    )
  );
};

const setup = () => {
  currentScore = 0;
  flight = jump;

  // set initial flyHeight (middle of screen - size of the bird)
  flyHeight = canvas.height / 2 - sizes[1] / 2;

  // setup first 3 pipes
  pipes = Array(3)
    .fill()
    .map((a, i) => [canvas.width + i * (pipeGap + pipeWidth), pipeLoc()]);
};

const endGame = () => {
  audio.hit.play();
  setTimeout(() => {
    if (currentScore < 20) {
      audio.penguin.play();
    } else {
      audio.benguinnoise.play();
    }
  }, 200);
  gameState = "start";

  lastTimeGameOver = Number(new Date());
};

const drawGameStatePlaying = () => {
  // Draw pipes
  pipes.map((pipe) => {
    // pipe moving
    pipe[0] -= speed;

    // top pipe
    ctx.drawImage(
      imageSprites,
      432,
      588 - pipe[1],
      pipeWidth,
      pipe[1],
      pipe[0],
      0,
      pipeWidth,
      pipe[1]
    );
    // bottom pipe
    ctx.drawImage(
      imageSprites,
      432 + pipeWidth,
      108,
      pipeWidth,
      canvas.height - pipe[1] + pipeGap,
      pipe[0],
      pipe[1] + pipeGap,
      pipeWidth,
      canvas.height - pipe[1] + pipeGap
    );

    // give 1 point & create new pipe
    if (pipe[0] <= -pipeWidth) {
      currentScore++;
      // check if it's the best score
      bestScore = Math.max(bestScore, currentScore);

      // remove & create new pipe
      pipes = [
        ...pipes.slice(1),
        [pipes[pipes.length - 1][0] + pipeGap + pipeWidth, pipeLoc()],
      ];

      if (currentScore > 0 && currentScore % 5 === 0) {
        audio.score.play();
      }
    }

    // if hit the pipe, end
    if (
      [
        pipe[0] <= cTenth + sizes[0],
        pipe[0] + pipeWidth >= cTenth,
        pipe[1] > flyHeight || pipe[1] + pipeGap < flyHeight + sizes[1],
      ].every((elem) => elem)
    ) {
      endGame();
    }
  });

  // Draw benguin
  ctx.drawImage(
    imageSprites,
    432,
    Math.floor((index % 9) / 3) * sizes[1],
    ...sizes,
    cTenth,
    flyHeight,
    ...sizes
  );
  flight += gravity;
  flyHeight = Math.min(flyHeight + flight, canvas.height - sizes[1]);
};

const drawGameStateStart = () => {
  ctx.drawImage(
    imageSprites,
    432,
    Math.floor((index % 9) / 3) * sizes[1],
    ...sizes,
    canvas.width / 2 - sizes[0] / 2,
    flyHeight,
    ...sizes
  );
  flyHeight = canvas.height / 2 - sizes[1] / 2;
  // text accueil
  ctx.fillText(`Best score : ${bestScore}`, 85, 245);
  if (lastTimeGameOver) {
    ctx.font = "bold 16px courier";
    printAtWordWrap(ctx, getNgokLevel(), 85, 280, 25, 300);
  }
  ctx.font = "bold 30px courier";
  ctx.fillText("Chơi đê", 145, 535);
};

const render = () => {
  // make the pipe and bird moving
  index++;

  // ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background first part
  ctx.drawImage(
    imageSprites,
    0,
    0,
    canvas.width,
    canvas.height,
    -((index * (speed / 2)) % canvas.width) + canvas.width,
    0,
    canvas.width,
    canvas.height
  );
  // background second part
  ctx.drawImage(
    imageSprites,
    0,
    0,
    canvas.width,
    canvas.height,
    -(index * (speed / 2)) % canvas.width,
    0,
    canvas.width,
    canvas.height
  );

  if (gameState === "playing") {
    drawGameStatePlaying();
  } else if (gameState === "start") {
    drawGameStateStart();
  }

  document.getElementById("bestScore").innerHTML = `Best : ${bestScore}`;
  document.getElementById(
    "currentScore"
  ).innerHTML = `Current : ${currentScore}`;

  // tell the browser to perform anim
  window.requestAnimationFrame(render);
};

const handleGameClick = () => {
  if (gameState === "start") {
    if (!lastTimeGameOver) {
      setup();
      gameState = "playing";
    } else if (lastTimeGameOver && +new Date() - lastTimeGameOver > 500) {
      setup();
      gameState = "playing";
    }
  } else if (gameState === "playing") {
    audio.flappy.currentTime = 0;
    audio.flappy.play();
    flight = jump;
  }
};

// launch setup
setup();
imageSprites.onload = render;

// start game
document.addEventListener("click", handleGameClick);

/**
 * UTILS
 */
function printAtWordWrap(context, text, x, y, lineHeight, fitWidth) {
  fitWidth = fitWidth || 0;

  if (fitWidth <= 0) {
    context.fillText(text, x, y);
    return;
  }
  var words = text.split(" ");
  var currentLine = 0;
  var idx = 1;
  while (words.length > 0 && idx <= words.length) {
    var str = words.slice(0, idx).join(" ");
    var w = context.measureText(str).width;
    if (w > fitWidth) {
      if (idx == 1) {
        idx = 2;
      }
      context.fillText(
        words.slice(0, idx - 1).join(" "),
        x,
        y + lineHeight * currentLine
      );
      currentLine++;
      words = words.splice(idx - 1);
      idx = 1;
    } else {
      idx++;
    }
  }
  if (idx > 0)
    context.fillText(words.join(" "), x, y + lineHeight * currentLine);
}
