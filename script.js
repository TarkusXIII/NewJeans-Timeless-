const localClock = document.getElementById("relogio-local");
const calendarMonth = document.getElementById("calendar-month");
const calendarDay = document.getElementById("calendar-day");
const calendarWeekday = document.getElementById("calendar-weekday");
const calendarYear = document.getElementById("calendar-year");
const wallpaperButton = document.getElementById("btn-fundo");
const wallpaperHint = document.getElementById("wallpaper-hint");
const clipNumber = document.getElementById("clip-number");
const clipNumberLarge = document.getElementById("clip-number-large");
const clipTitle = document.getElementById("clip-title");
const wallpaperVideo = document.getElementById("wallpaper-video");
const audioBarsContainer = document.getElementById("audio-bars");
const videoToggle = document.getElementById("btn-video-toggle");

// Volume do clipe (0 a 1). No Wallpaper Engine o controle vem da propriedade "volume".
let userVolume = 0.7;

function applyVolume() {
    if (!wallpaperVideo) {
        return;
    }
    wallpaperVideo.volume = userVolume;
    wallpaperVideo.muted = userVolume === 0;
}

applyVolume();

function enableVideoSound() {
    if (!wallpaperVideo) {
        return;
    }
    if (!wallpaperVideo.getAttribute("src")) {
        return;
    }
    applyVolume();
    if (wallpaperVideo.paused) {
        wallpaperVideo.play().catch((error) => {
            console.error("Could not start background clip with sound.", error);
        });
    }
}

// O editor do WE pode nomear a chave como "volume", "volume1", "volume2"...
window.wallpaperPropertyListener = {
    applyUserProperties(properties) {
        const volumeKey = Object.keys(properties).find((key) => /^volume\d*$/.test(key));
        const value = volumeKey ? Number(properties[volumeKey].value) : NaN;
        if (Number.isFinite(value)) {
            userVolume = Math.min(Math.max(value / 100, 0), 1);
            applyVolume();
        }
    }
};

document.addEventListener("pointerdown", enableVideoSound, { once: true });

const preferencesKey = "time-with-newjeans.preferences.v1";

function loadPreferences() {
    let serializedPreferences;

    try {
        serializedPreferences = window.localStorage.getItem(preferencesKey);
    } catch (error) {
        console.error("Could not load wallpaper preferences.", error);
        return {};
    }

    if (!serializedPreferences) {
        return {};
    }

    try {
        const preferences = JSON.parse(serializedPreferences);
        return preferences && typeof preferences === "object" && !Array.isArray(preferences)
            ? preferences
            : {};
    } catch (error) {
        console.error("Could not parse saved wallpaper preferences.", error);
        return {};
    }
}

const preferences = loadPreferences();
wallpaperHint.hidden = preferences.wallpaperHintDismissed === true;

function savePreference(name, value) {
    preferences[name] = value;

    try {
        window.localStorage.setItem(preferencesKey, JSON.stringify(preferences));
    } catch (error) {
        console.error("Could not save wallpaper preferences.", error);
    }
}

function formatClock(date, timeZone) {
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    }).format(date);
}

function updateClocks() {
    const now = new Date();
    localClock.dateTime = now.toISOString();
    localClock.textContent = formatClock(now, Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (calendarMonth && calendarDay && calendarWeekday && calendarYear) {
        calendarMonth.textContent = new Intl.DateTimeFormat("en-US", { month: "short" })
            .format(now).replace(".", "").toUpperCase();
        calendarDay.textContent = String(now.getDate()).padStart(2, "0");
        calendarWeekday.textContent = new Intl.DateTimeFormat("en-US", { weekday: "short" })
            .format(now).replace(".", "").toUpperCase();
        calendarYear.textContent = String(now.getFullYear());
    }
}

function getUnit() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return h > w ? Math.min(w / 1000, h / 1778) : Math.min(w / 1280, h / 720);
}

const wallpapers = [
    {
        video: "Fundos/Attention.webm",
        title: "ATTENTION"
    },
    {
        video: "Fundos/How Sweet.webm",
        title: "HOW SWEET"
    },
    {
        video: "Fundos/Right Now(Jazz ver.).webm",
        title: "RIGHT NOW"
    },
    {
        video: "Fundos/Hurt.webm",
        title: "HURT"
    },
    {
        video: "Fundos/Ditto.webm",
        title: "DITTO"
    },
    {
        video: "Fundos/Get Up.webm",
        title: "GET UP"
    },
    {
        video: "Fundos/NewJeans.webm",
        title: "NEWJEANS"
    },
    {
        image: "Fundos/newjeans.jpg",
        title: "NEWJEANS"
    }
];


const mediaErrorNames = {
    1: "carregamento abortado",
    2: "erro de rede/arquivo",
    3: "falha ao decodificar",
    4: "formato/codec nao suportado ou arquivo nao encontrado"
};

const videoStatus = document.createElement("div");
videoStatus.className = "video-status";
videoStatus.hidden = true;
document.body.append(videoStatus);

function showVideoProblem(message) {
    console.error(message);
    videoStatus.textContent = message;
    videoStatus.hidden = false;
}

function tryPlay() {
    const attempt = wallpaperVideo.play();
    if (!attempt || typeof attempt.catch !== "function") {
        return;
    }
    attempt.catch((error) => {
        if (error && error.name === "NotAllowedError" && !wallpaperVideo.muted) {
            // Sem permissao para autoplay com som: toca mudo em vez de ficar parado.
            wallpaperVideo.muted = true;
            wallpaperVideo.play().catch((err) => console.error("Could not play background clip.", err));
            return;
        }
        if (error && error.name !== "AbortError") {
            console.error("Could not play background clip.", error);
        }
    });
}

function playClip(path) {
    wallpaperVideo.pause();
    wallpaperVideo.src = encodeURI(path);
    wallpaperVideo.load();
    tryPlay();
}

if (wallpaperVideo) {
    wallpaperVideo.addEventListener("error", () => {
        const code = wallpaperVideo.error ? wallpaperVideo.error.code : 0;
        const reason = (mediaErrorNames[code] || "desconhecido").toUpperCase();
        showVideoProblem(`ERRO NO CLIP (${code}): ${reason} | ARQUIVO: ${decodeURI(wallpaperVideo.getAttribute("src") || "")}`);
    });
    wallpaperVideo.addEventListener("playing", () => {
        videoStatus.hidden = true;
    });
}

const savedWallpaperIndex = preferences.wallpaperIndex;
const clockCard = document.querySelector(".clock-card");
const panelToggle = document.getElementById("btn-panel-toggle");
let panelCollapseTimer = null;
let panelGeometryAnimation = null;
const captionAnimations = [];

function animateCaption(direction) {
    captionAnimations.forEach((animation) => animation.cancel());
    captionAnimations.length = 0;

    const caption = document.querySelector(".page-caption");
    const left = document.querySelector(".page-caption__left");
    const star = document.querySelector(".page-caption__star");
    const right = document.querySelector(".page-caption__right");

    if (caption) {
        const captionRect = caption.getBoundingClientRect();
        const minimizedCaptionTop = window.innerHeight * 0.5 - captionRect.height * 0.5;
        const currentTransform = getComputedStyle(caption).transform;
        const currentTranslateY = currentTransform === "none"
            ? 0
            : new DOMMatrixReadOnly(currentTransform).m42;
        const targetTranslateY = direction === "minimize"
            ? minimizedCaptionTop - captionRect.top
            : 0;

        const captionAnimation = caption.animate(
            [
                { transform: `translateY(${currentTranslateY}px)` },
                { transform: `translateY(${targetTranslateY}px)` }
            ],
            {
                duration: 650,
                easing: "cubic-bezier(.2,.75,.25,1)",
                fill: "forwards"
            }
        );
        captionAnimation.finished.then(() => {
            caption.style.transform = targetTranslateY === 0
                ? ""
                : `translateY(${targetTranslateY}px)`;
            captionAnimation.cancel();
        }).catch(() => {});
        captionAnimations.push(captionAnimation);
    }

    const captionPieces = [
        {
            element: left,
            target: direction === "minimize"
                ? `translateX(${24 * getUnit()}px) scale(1) rotate(0deg)`
                : "translateX(0px) scale(1) rotate(0deg)"
        },
        {
            element: star,
            target: direction === "minimize"
                ? "translateX(0px) scale(1.28) rotate(180deg)"
                : "translateX(0px) scale(1) rotate(0deg)"
        },
        {
            element: right,
            target: direction === "minimize"
                ? `translateX(${-24 * getUnit()}px) scale(1) rotate(0deg)`
                : "translateX(0px) scale(1) rotate(0deg)"
        }
    ];

    captionPieces.forEach(({ element, target }) => {
        if (!element) {
            return;
        }
        const current = getComputedStyle(element).transform;
        const animation = element.animate(
            [
                { transform: current === "none" ? "translateX(0px)" : current },
                { transform: target }
            ],
            {
                duration: 650,
                easing: "cubic-bezier(.2,.75,.25,1)",
                fill: "forwards"
            }
        );
        animation.finished.then(() => {
            element.style.transform = target;
            animation.cancel();
        }).catch(() => {});
        captionAnimations.push(animation);
    });
}

function animatePanelCollapse() {
    if (!clockCard) {
        return;
    }

    window.clearTimeout(panelCollapseTimer);
    if (panelGeometryAnimation) {
        panelGeometryAnimation.cancel();
    }

    const startRect = clockCard.getBoundingClientRect();
    const startPadding = getComputedStyle(clockCard).padding;
    clockCard.style.transition = "none";
    clockCard.classList.add("is-collapsed");
    void clockCard.offsetWidth;

    const endRect = clockCard.getBoundingClientRect();
    const endPadding = getComputedStyle(clockCard).padding;
    clockCard.style.overflow = "hidden";
    panelGeometryAnimation = clockCard.animate(
        [
            {
                position: "fixed",
                left: `${startRect.left}px`,
                top: `${startRect.top}px`,
                right: "auto",
                bottom: "auto",
                width: `${startRect.width}px`,
                height: `${startRect.height}px`,
                minHeight: `${startRect.height}px`,
                margin: "0",
                padding: startPadding,
                transform: "translate(0, 0)"
            },
            {
                position: "fixed",
                left: `${endRect.left}px`,
                top: `${endRect.top}px`,
                right: "auto",
                bottom: "auto",
                width: `${endRect.width}px`,
                height: `${endRect.height}px`,
                minHeight: `${endRect.height}px`,
                margin: "0",
                padding: endPadding,
                transform: "translate(0, 0)"
            }
        ],
        {
            duration: 650,
            easing: "cubic-bezier(.2,.75,.25,1)",
            fill: "none"
        }
    );

    panelGeometryAnimation.finished.catch(() => {}).finally(() => {
        clockCard.style.transition = "";
        clockCard.style.overflow = "";
        panelGeometryAnimation = null;
    });
}

function minimizePanel() {
    animatePanelCollapse();
    document.body.classList.add("caption-minimized");
    animateCaption("minimize");
    if (panelToggle) {
        panelToggle.setAttribute("aria-expanded", "false");
        panelToggle.setAttribute("aria-label", "Mostrar painel");
        panelToggle.textContent = "‹";
    }
    savePreference("panelState", "collapsed");
}

function expandPanel() {
    window.clearTimeout(panelCollapseTimer);
    if (clockCard) {
        if (panelGeometryAnimation) {
            panelGeometryAnimation.cancel();
        }
        const startRect = clockCard.getBoundingClientRect();
        const startPadding = getComputedStyle(clockCard).padding;
        document.body.classList.remove("caption-minimized");
        animateCaption("expand");
        clockCard.style.transition = "none";
        clockCard.classList.remove("is-collapsed");
        void clockCard.offsetWidth;
        const endRect = clockCard.getBoundingClientRect();
        clockCard.style.overflow = "hidden";
        panelGeometryAnimation = clockCard.animate(
            [
                {
                    position: "fixed",
                    left: `${startRect.left}px`,
                    top: `${startRect.top}px`,
                    right: "auto",
                    bottom: "auto",
                    width: `${startRect.width}px`,
                    height: `${startRect.height}px`,
                    minHeight: `${startRect.height}px`,
                    margin: "0",
                    padding: startPadding,
                    transform: "translate(0, 0)"
                },
                {
                    position: "fixed",
                    left: `${endRect.left}px`,
                    top: `${endRect.top}px`,
                    right: "auto",
                    bottom: "auto",
                    width: `${endRect.width}px`,
                    height: `${endRect.height}px`,
                    minHeight: `${endRect.height}px`,
                    margin: getComputedStyle(clockCard).margin,
                    padding: getComputedStyle(clockCard).padding,
                    transform: "translate(0, 0)"
                }
            ],
            {
                duration: 650,
                easing: "cubic-bezier(.2,.75,.25,1)",
                fill: "none"
            }
        );

        panelGeometryAnimation.finished.catch(() => {}).finally(() => {
            clockCard.style.transition = "";
            clockCard.style.overflow = "";
            panelGeometryAnimation = null;
        });
    }
    if (panelToggle) {
        panelToggle.setAttribute("aria-expanded", "true");
        panelToggle.setAttribute("aria-label", "Minimizar painel");
        panelToggle.textContent = "−";
    }
    savePreference("panelState", "expanded");
}

function schedulePanelCollapse() {
    window.clearTimeout(panelCollapseTimer);
    panelCollapseTimer = window.setTimeout(() => {
        if (!clockCard) {
            return;
        }
        minimizePanel();
    }, 3000);
}

if (panelToggle) {
    panelToggle.addEventListener("click", () => {
        if (clockCard && clockCard.classList.contains("is-collapsed")) {
            expandPanel();
        } else {
            minimizePanel();
        }
    });
}

function restorePanelState() {
    if (!clockCard || preferences.panelState !== "collapsed") {
        return false;
    }

    clockCard.classList.add("is-collapsed");
    document.body.classList.add("caption-minimized");
    if (panelToggle) {
        panelToggle.setAttribute("aria-expanded", "false");
        panelToggle.setAttribute("aria-label", "Mostrar painel");
        panelToggle.textContent = "‹";
    }
    window.requestAnimationFrame(() => animateCaption("minimize"));
    return true;
}

let currentWallpaper = Number.isInteger(savedWallpaperIndex)
    && savedWallpaperIndex >= 0
    && savedWallpaperIndex < wallpapers.length
    ? savedWallpaperIndex
    : 0;

function showWallpaper(index) {
    const wallpaper = wallpapers[index];
    videoStatus.hidden = true;

    if (wallpaper.image) {
        wallpaperVideo.pause();
        wallpaperVideo.removeAttribute("src");
        wallpaperVideo.load();
        wallpaperVideo.hidden = true;
        document.querySelector(".video-background").style.backgroundImage =
            `url("${wallpaper.image}")`;
        if (videoToggle) {
            videoToggle.hidden = true;
        }
    } else {
        document.querySelector(".video-background").style.backgroundImage = 'url("Fundos/newjeans.jpg")';
        wallpaperVideo.hidden = false;
        playClip(wallpaper.video);
        if (videoToggle) {
            videoToggle.hidden = false;
        }
        const toggleLabel = document.getElementById("video-toggle-label");
        if (toggleLabel) {
            toggleLabel.textContent = "PAUSE";
        }
        const toggleIcon = document.querySelector(".video-toggle__icon");
        if (toggleIcon) {
            toggleIcon.textContent = "Ⅱ";
        }
        if (videoToggle) {
            videoToggle.setAttribute("aria-pressed", "true");
            videoToggle.setAttribute("aria-label", "Pausar vídeo");
        }
    }

    clipNumber.textContent = String(index + 1).padStart(2, "0");
    if (clipNumberLarge) {
        clipNumberLarge.textContent = String(index + 1).padStart(2, "0");
    }
    if (clipTitle) {
        clipTitle.textContent = wallpaper.title;
    }
}

showWallpaper(currentWallpaper);
if (!restorePanelState()) {
    schedulePanelCollapse();
}

wallpaperButton.addEventListener("click", () => {
    currentWallpaper = (currentWallpaper + 1) % wallpapers.length;
    showWallpaper(currentWallpaper);
    savePreference("wallpaperIndex", currentWallpaper);

    if (!wallpaperHint.hidden) {
        wallpaperHint.hidden = true;
        savePreference("wallpaperHintDismissed", true);
    }
});

const videoToggleLabel = document.getElementById("video-toggle-label");
if (videoToggle && wallpaperVideo) {
    videoToggle.addEventListener("click", () => {
        if (wallpaperVideo.paused) {
            wallpaperVideo.play().catch((error) => {
                console.error("Could not resume background clip.", error);
            });
            videoToggle.setAttribute("aria-pressed", "true");
            videoToggle.setAttribute("aria-label", "Pausar vídeo");
            videoToggleLabel.textContent = "PAUSE";
            videoToggle.querySelector(".video-toggle__icon").textContent = "Ⅱ";
        } else {
            wallpaperVideo.pause();
            videoToggle.setAttribute("aria-pressed", "false");
            videoToggle.setAttribute("aria-label", "Reproduzir vídeo");
            videoToggleLabel.textContent = "PLAY";
            videoToggle.querySelector(".video-toggle__icon").textContent = "▶";
        }
    });
}

const audioBars = Array.from({ length: 32 }, () => {
    const bar = document.createElement("span");
    bar.className = "audio-visualizer__bar";
    audioBarsContainer.append(bar);
    return bar;
});
const displayedAudioLevels = new Array(audioBars.length).fill(0);

function updateAudioVisualizer(audioArray) {
    if (!audioArray || audioArray.length < 128) {
        return;
    }

    for (let index = 0; index < audioBars.length; index += 1) {
        const firstFrequency = index * 2;
        const leftLevel = (audioArray[firstFrequency] + audioArray[firstFrequency + 1]) / 2;
        const rightLevel = (
            audioArray[64 + firstFrequency] + audioArray[65 + firstFrequency]
        ) / 2;
        const averageLevel = Math.max((leftLevel + rightLevel) / 2, 0);
        const level = Math.min(Math.sqrt(Math.max(averageLevel - 0.008, 0) * 3.8), 1);
        const previousLevel = displayedAudioLevels[index];
        displayedAudioLevels[index] = level > previousLevel
            ? previousLevel + (level - previousLevel) * 0.65
            : previousLevel * 0.84;
        audioBars[index].style.setProperty(
            "--bar-height",
            `${7 + displayedAudioLevels[index] * 88}%`
        );
    }
}

updateClocks();
setInterval(updateClocks, 1000);

if (typeof window.wallpaperRegisterAudioListener === "function") {
    window.wallpaperRegisterAudioListener(updateAudioVisualizer);
}

window.addEventListener("resize", () => {
    if (clockCard && clockCard.classList.contains("is-collapsed")) {
        window.requestAnimationFrame(() => animateCaption("minimize"));
    }
});
