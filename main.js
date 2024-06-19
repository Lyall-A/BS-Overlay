// Get params
const urlParams = new URLSearchParams(location.search);
const params = {
    host: urlParams.get("host") || "localhost",
    port: parseInt(urlParams.get("port")) || 2946,
    wsType: urlParams.get("wsType") || "BSDataPuller",
    reconnectInterval: parseInt(urlParams.get("reconnectInterval")) || 5000,
    showTime: parseInt(urlParams.get("showTime")) || 5000
}
console.log("Params:", params);


function updateOverlay(data) {
    console.log("Overlay data:", data);

    // Elements
    const info = document.getElementById("info");

    const bpm = document.getElementById("bpm");
    const bsr = document.getElementById("bsr");
    const cover = document.getElementById("cover");
    const difficulty = document.getElementById("difficulty");
    const duration = document.getElementById("duration");
    const mapper = document.getElementById("mapper");
    const modifiers = document.getElementById("modifiers");
    const njs = document.getElementById("njs");
    const author = document.getElementById("author");
    const name = document.getElementById("name");
    const star = document.getElementById("star");

    if (data.bpm) bpm.innerHTML = `${data.bpm} BPM`;
    if (data.bsr) bsr.innerHTML = `bsr://${data.bsr}`;
    if (data.coverImage) cover.src = data.coverImage;
    if (data.difficulty) difficulty.innerHTML = `${data.customDifficulty || data.difficulty.replace(/Plus/, "+")}`;
    if (data.duration) duration.innerHTML = `${new Date(data.duration * 1000).toISOString().split(":").slice(1).join(":").split(".")[0]}`;
    if (data.mapper) mapper.innerHTML = `${data.mapper}`;
    if (data.modifiers) modifiers.innerHTML = `${data.modifiers.join(", ")}`;
    if (data.njs) njs.innerHTML = `${data.njs}`;
    if (data.author) author.innerHTML = `${data.author}`;
    if (data.name) name.innerHTML = `${data.name}${data.subName ? `, ${data.subName}` : ""}`;
    if (data.star) star.innerHTML = `${data.star}`;

    info.style.opacity = "1";
    info.style.transform = null;

    setTimeout(() => {
        info.style.opacity = "0";
        info.style.transform = "translateX(-100%)";
    }, params.showTime);
}

(function connectWs() {
    let url;
    if (params.wsType == "BSDataPuller") {
        url = `ws://${params.host}:${params.port}/BSDataPuller/MapData`;
    } else {
        return console.log("Unsupported WebSocket type!");
    }

    console.log(`Connecting to ${url}...`);
    const ws = new WebSocket(url);

    ws.onopen = () => {
        console.log("Connected to WebSocket!");
    };

    ws.onmessage = msg => {
        const data = {
            bpm: null, // BPM
            bsr: null, // BSR number
            coverImage: null, // Cover image URL
            customDifficulty: null, // Custom difficulty, default to https://cdn.scoresaber.com/covers/<hash>.png
            difficulty: null, // Difficulty
            duration: null, // Duration in seconds
            hash: null, // Map hash
            mapper: null, // Mapper(s) as string
            modifiers: null, // Modifiers as array of short codes
            njs: null, // NJS
            pp: null, // PP rounded to 2 decimals
            author: null, // Song author(s) as string
            name: null, // Song name
            subName: null, // Song sub name
            star: null // Stars rounded to 2 decimals
        };

        if (params.wsType == "BSDataPuller") {
            const json = JSON.parse(msg.data);

            if (!(json.Hash && !json.InLevel && !json.LevelQuit)) return; // Return unless map getting started
            // console.log(json);
            
            data.bpm = json.BPM || null;
            data.bsr = json.BSRKey || null; // TODO: never seen this defined, is this formatted bsr://12345 or 12345?
            data.coverImage = json.CoverImage || `https://cdn.scoresaber.com/covers/${json.Hash}.png`;
            data.customDifficulty = json.CustomDifficultyLabel || null;
            data.difficulty = json.Difficulty || null;
            data.duration = json.Duration || null;
            data.mapper = json.Mapper || null;
            data.hash = json.Hash || null,
            // data.modifiers = json.Modifiers || null; // TODO
            data.njs = json.NJS || null;
            data.pp = parseFloat(json.PP?.toFixed(2)) || null;
            data.author = json.SongAuthor || null;
            data.name = json.SongName || null;
            data.subName = json.SongSubName || null;
            data.star = parseFloat(json.Star?.toFixed(2)) || null;
        } else {
            ws.close();
            return console.log("Unsupported WebSocket type!");
        }

        updateOverlay(data);
    }

    ws.onclose = () => {
        console.log(`WebSocket closed, reconnecting in ${params.reconnectInterval / 1000} seconds...`);
        setTimeout(() => connectWs(), params.reconnectInterval);
    };
})();