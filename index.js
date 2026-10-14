/* ========================================
   HTML要素を取得
======================================== */

const themeToggleBtn =
    document.getElementById("theme-toggle-btn");

const workInput =
    document.getElementById("work-input");

const breakInput =
    document.getElementById("break-input");

const timerDisplay =
    document.getElementById("timer");

const statusDisplay =
    document.getElementById("status");

const progressBar =
    document.getElementById("progress-bar");

const startBtn =
    document.getElementById("start-btn");

const stopBtn =
    document.getElementById("stop-btn");


/* ========================================
   タイマーの状態
======================================== */

let workTime =
    parseInt(workInput.value) * 60;

let breakTime =
    parseInt(breakInput.value) * 60;

let timeLeft =
    workTime;

let totalTime =
    workTime;

// true = 集中
// false = 休憩
let isWorking = true;

// setIntervalのID
let timerId = null;


/* ========================================
   音声関連
======================================== */

let audioContext = null;


/* ========================================
   音声を準備
======================================== */

function initAudio() {

    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;


    // Web Audio API非対応
    if (!AudioContext) {

        console.log(
            "Web Audio APIに対応していません。"
        );

        return false;
    }


    // AudioContextを作成
    if (audioContext === null) {

        audioContext =
            new AudioContext();
    }


    // suspendedの場合は再開
    if (
        audioContext.state === "suspended"
    ) {

        audioContext.resume();
    }


    return true;
}


/* ========================================
   終了音
======================================== */

function playEndSound() {

    // AudioContextがなければ作成
    if (!audioContext) {
        initAudio();
    }

    if (!audioContext) {
        return;
    }


    // AudioContextを再開
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }


    const now =
        audioContext.currentTime;


    // 3回「ピッ」と鳴らす
    for (let i = 0; i < 3; i++) {

        const oscillator =
            audioContext.createOscillator();

        const gainNode =
            audioContext.createGain();


        oscillator.connect(gainNode);
        gainNode.connect(
            audioContext.destination
        );


        oscillator.type = "sine";


        // 高めの音
        oscillator.frequency.setValueAtTime(
            1000,
            now + i * 0.4
        );


        // 音量
        gainNode.gain.setValueAtTime(
            0.0001,
            now + i * 0.4
        );


        gainNode.gain.exponentialRampToValueAtTime(
            0.8,
            now + i * 0.4 + 0.02
        );


        gainNode.gain.exponentialRampToValueAtTime(
            0.0001,
            now + i * 0.4 + 0.3
        );


        oscillator.start(
            now + i * 0.4
        );


        oscillator.stop(
            now + i * 0.4 + 0.3
        );
    }
}


/* ========================================
   音のテスト
======================================== */

function testSound() {

    initAudio();

    playEndSound();
}


/* ========================================
   ダークモード
======================================== */

const savedTheme =
    localStorage.getItem("theme");


const systemPrefersDark =
    window.matchMedia(
        "(prefers-color-scheme: dark)"
    ).matches;


if (
    savedTheme === "dark" ||
    (!savedTheme && systemPrefersDark)
) {

    setTheme("dark");

} else {

    setTheme("light");
}


function setTheme(theme) {

    document.documentElement.setAttribute(
        "data-theme",
        theme
    );


    themeToggleBtn.textContent =
        theme === "dark"
            ? "Light"
            : "Dark";
}


function toggleTheme() {

    const currentTheme =
        document.documentElement.getAttribute(
            "data-theme"
        );


    const newTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";


    setTheme(newTheme);


    localStorage.setItem(
        "theme",
        newTheme
    );
}


/* ========================================
   タイマー表示を更新
======================================== */

function updateDisplay() {

    const minutes =
        Math.floor(
            timeLeft / 60
        );


    const seconds =
        timeLeft % 60;


    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;


    const progressPercent =
        (timeLeft / totalTime) * 100;


    progressBar.style.width =
        `${progressPercent}%`;
}


/* ========================================
   モード切り替え
======================================== */

function switchMode() {

    isWorking =
        !isWorking;


    if (isWorking) {

        // 集中モード
        timeLeft =
            parseInt(workInput.value) * 60;


        totalTime =
            timeLeft;


        statusDisplay.textContent =
            `集中時間（${workInput.value}分）`;


        statusDisplay.style.color =
            "var(--work-color)";


        progressBar.style.backgroundColor =
            "var(--work-color)";


    } else {

        // 休憩モード
        timeLeft =
            parseInt(breakInput.value) * 60;


        totalTime =
            timeLeft;


        statusDisplay.textContent =
            `休憩時間（${breakInput.value}分）`;


        statusDisplay.style.color =
            "var(--break-color)";


        progressBar.style.backgroundColor =
            "var(--break-color)";
    }


    updateDisplay();
}


/* ========================================
   カウントダウン
======================================== */

function countdown() {

    // 残り時間がある場合
    if (timeLeft > 0) {

        timeLeft--;

        updateDisplay();

        return;
    }


    // タイマー停止
    clearInterval(timerId);

    timerId = null;


    // 終了音を鳴らす
    playEndSound();


    // 少し待ってから次のモードへ
    setTimeout(function () {

        // 集中 ⇔ 休憩
        switchMode();

        // 次のモードを開始
        startTimer();

    }, 1200);
}


/* ========================================
   スタート
======================================== */

function startTimer() {

    // すでに動いている場合
    if (timerId !== null) {
        return;
    }


    // ユーザーがスタートボタンを
    // 押した瞬間に音声を準備する
    initAudio();


    // 設定変更を禁止
    workInput.disabled = true;
    breakInput.disabled = true;


    // ボタン状態
    startBtn.disabled = true;
    stopBtn.disabled = false;


    // カウントダウン開始
    timerId =
        setInterval(
            countdown,
            1000
        );
}


/* ========================================
   ストップ
======================================== */

function stopTimer() {

    if (timerId === null) {
        return;
    }


    clearInterval(timerId);

    timerId = null;


    startBtn.disabled = false;
    stopBtn.disabled = true;
}


/* ========================================
   リセット
======================================== */

function resetTimer() {

    if (timerId !== null) {

        clearInterval(timerId);

        timerId = null;
    }


    workInput.disabled = false;
    breakInput.disabled = false;


    isWorking = true;


    applyCustomTime();


    startBtn.disabled = false;
    stopBtn.disabled = true;
}


/* ========================================
   カスタム時間を適用
======================================== */

function applyCustomTime() {

    const workMinutes =
        Math.min(
            Math.max(
                parseInt(
                    workInput.value
                ) || 25,
                1
            ),
            180
        );


    const breakMinutes =
        Math.min(
            Math.max(
                parseInt(
                    breakInput.value
                ) || 5,
                1
            ),
            60
        );


    workInput.value =
        workMinutes;

    breakInput.value =
        breakMinutes;


    if (isWorking) {

        timeLeft =
            workMinutes * 60;


        totalTime =
            timeLeft;


        statusDisplay.textContent =
            `集中時間（${workMinutes}分）`;


        statusDisplay.style.color =
            "var(--work-color)";


        progressBar.style.backgroundColor =
            "var(--work-color)";


    } else {

        timeLeft =
            breakMinutes * 60;


        totalTime =
            timeLeft;


        statusDisplay.textContent =
            `休憩時間（${breakMinutes}分）`;


        statusDisplay.style.color =
            "var(--break-color)";


        progressBar.style.backgroundColor =
            "var(--break-color)";
    }


    updateDisplay();
}


/* ========================================
   初期化
======================================== */

applyCustomTime();
