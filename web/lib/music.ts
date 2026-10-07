// The song plays through YouTube's own embedded player, which has to stay
// visible on screen while it plays (YouTube's embed rules), so it lives in
// the "now playing" card in the corner.

export const SONG = {
  videoId: "sP0us82q1ck",
  title: "Nettles",
  artist: "Ethel Cain",
};

type YTPlayer = {
  playVideo: () => void;
  stopVideo: () => void;
  setVolume: (v: number) => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
};

type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      width: number;
      height: number;
      playerVars: Record<string, string | number>;
      events: {
        onReady: () => void;
        onError: () => void;
      };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let player: YTPlayer | null = null;
let ready = false;
let wantsPlay = false;
let muted = false;
let volume = 100;
let fade: number | undefined;

function loadApi() {
  return new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.querySelector("script[data-yt-api]")) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.dataset.ytApi = "";
      script.onerror = () => reject(new Error("youtube api failed to load"));
      document.head.appendChild(script);
    }
  });
}

export async function mountSong(el: HTMLElement, size: number, onFail: () => void) {
  try {
    const YT = await loadApi();
    player = new YT.Player(el, {
      videoId: SONG.videoId,
      width: size,
      height: size,
      playerVars: {
        loop: 1,
        playlist: SONG.videoId,
        controls: 1,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: () => {
          ready = true;
          applyVolume();
          if (wantsPlay) player?.playVideo();
        },
        onError: onFail,
      },
    });
  } catch {
    onFail();
  }
}

export function unmountSong() {
  window.clearInterval(fade);
  player?.destroy();
  player = null;
  ready = false;
  wantsPlay = false;
}

export function playSong() {
  wantsPlay = true;
  if (ready) player?.playVideo();
}

export function stopSong() {
  wantsPlay = false;
  player?.stopVideo();
}

function applyVolume() {
  if (!player || !ready) return;
  if (muted) player.mute();
  else {
    player.unMute();
    player.setVolume(Math.round(volume));
  }
}

export function setSongMuted(value: boolean) {
  muted = value;
  applyVolume();
}

// eases the song down while a letter is open
export function setSongHush(amount: number) {
  const target = 100 - amount * 70;
  window.clearInterval(fade);
  fade = window.setInterval(() => {
    volume += (target - volume) * 0.15;
    if (Math.abs(target - volume) < 0.5) {
      volume = target;
      window.clearInterval(fade);
    }
    applyVolume();
  }, 50);
}
