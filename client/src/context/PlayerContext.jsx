import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { streamSong } from '../api/axios';

const PlayerContext = createContext();
export const usePlayer = () => useContext(PlayerContext);

let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function isDemo(v) { return v && v.startsWith('demo_'); }

export const PlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off');
  const [shuffledQueue, setShuffledQueue] = useState([]);

  const audioRef = useRef(new Audio());
  const volumeRef = useRef(0.7);
  const repeatRef = useRef('off');
  const queueRef = useRef([]);
  const qIdxRef = useRef(-1);
  const shuffleRef = useRef(false);
  const shufQueueRef = useRef([]);

  // Mantener refs sincronizados
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { qIdxRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { shufQueueRef.current = shuffledQueue; }, [shuffledQueue]);

  // Estado para demo playback
  const demoPosRef = useRef(0);
  const demoTimerRef = useRef(null);
  const demoIsPausedRef = useRef(false);

  const stopDemo = useCallback(() => {
    if (demoTimerRef.current) { clearInterval(demoTimerRef.current); demoTimerRef.current = null; }
    if (audioCtx) {
      try { audioCtx.suspend(); } catch {}
    }
    setIsPlaying(false);
  }, []);

  // Referencias para romper dependencia circular
  const playSongRef = useRef(() => {});
  const nextSongRef = useRef(() => {});

  const startDemo = useCallback((song) => {
    stopDemo();
    demoPosRef.current = 0;
    demoIsPausedRef.current = false;

    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = volumeRef.current * 0.25;
    osc.type = 'sine';
    osc.frequency.value = 440;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    const demoDur = 30;
    setDuration(demoDur);
    setIsPlaying(true);

    demoTimerRef.current = setInterval(() => {
      if (demoIsPausedRef.current) return;
      demoPosRef.current += 0.25;
      setProgress(Math.min(demoPosRef.current, demoDur));
      if (demoPosRef.current >= demoDur) {
        clearInterval(demoTimerRef.current);
        demoTimerRef.current = null;
        try { osc.stop(); } catch {}
        gain.disconnect();
        setProgress(0);
        setIsPlaying(false);
        if (repeatRef.current === 'one') {
          setTimeout(() => startDemo(song), 50);
        } else {
          setTimeout(() => nextSongRef.current(), 50);
        }
      }
    }, 250);

    audioRef.current.demoOsc = osc;
    audioRef.current.demoGain = gain;
  }, [stopDemo]);

  // Eventos del audio real
  useEffect(() => {
    const a = audioRef.current;
    const onT = () => setProgress(a.currentTime);
    const onM = () => setDuration(a.duration);
    const onE = () => {
      if (repeatRef.current === 'one') {
        a.currentTime = 0;
        a.play().catch(() => {});
      } else {
        nextSongRef.current();
      }
    };
    const onP = () => setIsPlaying(true);
    const onP2 = () => setIsPlaying(false);
    a.addEventListener('timeupdate', onT);
    a.addEventListener('loadedmetadata', onM);
    a.addEventListener('ended', onE);
    a.addEventListener('play', onP);
    a.addEventListener('pause', onP2);
    return () => {
      a.removeEventListener('timeupdate', onT);
      a.removeEventListener('loadedmetadata', onM);
      a.removeEventListener('ended', onE);
      a.removeEventListener('play', onP);
      a.removeEventListener('pause', onP2);
    };
  }, []);

  useEffect(() => { audioRef.current.volume = volume; }, [volume]);

  const getActiveQ = useCallback(() => shuffleRef.current ? shufQueueRef.current : queueRef.current, []);

  // Definir nextSong y playSong con refs mutuos
  const realNextSong = useCallback(() => {
    const aq = getActiveQ();
    if (!aq.length) return;
    const qi = qIdxRef.current;
    let ni = (repeatRef.current === 'all' && qi >= aq.length - 1) ? 0 : Math.min(qi + 1, aq.length - 1);
    if (ni < aq.length) {
      const s = aq[ni];
      const oi = shuffleRef.current ? queueRef.current.indexOf(s) : ni;
      playSongRef.current(s, queueRef.current, oi);
    }
  }, [getActiveQ]);

  const realPlaySong = useCallback((song, songQueue = [], index = 0) => {
    stopDemo();
    const osc = audioRef.current.demoOsc;
    const gain = audioRef.current.demoGain;
    if (osc) try { osc.stop(); } catch {}
    if (gain) try { gain.disconnect(); } catch {}

    let nq = songQueue.length ? songQueue : [song];
    let ni = index;
    if (!songQueue.length && queueRef.current.length) { nq = [song]; ni = 0; }

    setQueue(nq);
    setQueueIndex(ni);
    setCurrentSong(song);
    setProgress(0);

    const sq = [...nq];
    for (let i = sq.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sq[i], sq[j]] = [sq[j], sq[i]];
    }
    setShuffledQueue(sq);

    if (isDemo(song.videoId)) {
      startDemo(song);
    } else {
      const a = audioRef.current;
      a.src = streamSong(song.videoId);
      a.currentTime = 0;
      a.play().catch(() => {});
    }
  }, [stopDemo, startDemo]);

  // Sincronizar refs
  playSongRef.current = realPlaySong;
  nextSongRef.current = realNextSong;

  const togglePlay = useCallback(() => {
    if (currentSong && isDemo(currentSong.videoId)) {
      const ctx = getCtx();
      if (isPlaying) {
        demoIsPausedRef.current = true;
        ctx.suspend();
        setIsPlaying(false);
      } else {
        demoIsPausedRef.current = false;
        if (ctx.state === 'suspended') ctx.resume();
        // Si el timer ya terminó, reiniciar
        if (!demoTimerRef.current && demoPosRef.current >= 30) {
          startDemo(currentSong);
          return;
        }
        setIsPlaying(true);
      }
      return;
    }
    const a = audioRef.current;
    if (isPlaying) a.pause();
    else if (currentSong) a.play().catch(() => {});
  }, [isPlaying, currentSong, startDemo]);

  const seekTo = useCallback((time) => {
    if (currentSong && isDemo(currentSong.videoId)) {
      demoPosRef.current = time;
      setProgress(time);
      return;
    }
    audioRef.current.currentTime = time;
    setProgress(time);
  }, [currentSong]);

  const prevSong = useCallback(() => {
    const a = audioRef.current;
    if (currentSong && !isDemo(currentSong.videoId) && a.currentTime > 3) {
      a.currentTime = 0; setProgress(0); return;
    }
    if (currentSong && isDemo(currentSong.videoId) && progress > 3) {
      demoPosRef.current = 0;
      setProgress(0);
      return;
    }
    const aq = getActiveQ();
    if (!aq.length) return;
    let pi = qIdxRef.current - 1;
    if (pi < 0) pi = repeatRef.current === 'all' ? aq.length - 1 : 0;
    if (pi >= 0) {
      const s = aq[pi];
      const oi = shuffleRef.current ? queueRef.current.indexOf(s) : pi;
      playSongRef.current(s, queueRef.current, oi);
    }
  }, [getActiveQ, progress, currentSong]);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    const g = audioRef.current.demoGain;
    if (g) g.gain.value = v * 0.25;
  }, []);

  const toggleShuffle = useCallback(() => setShuffle(p => !p), []);
  const toggleRepeat = useCallback(() => {
    setRepeat(p => p === 'off' ? 'all' : p === 'all' ? 'one' : 'off');
  }, []);

  return (
    <PlayerContext.Provider value={{
      currentSong, queue, queueIndex, isPlaying, volume, progress, duration,
      shuffle, repeat,
      playSong: realPlaySong, togglePlay, seekTo,
      nextSong: realNextSong, prevSong,
      setVolume, toggleShuffle, toggleRepeat
    }}>
      {children}
    </PlayerContext.Provider>
  );
};
