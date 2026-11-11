'use client';

import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {MusicNotes} from './music-notes';
import {MusicInvitation} from './music-invitation';

const tracks = [
  {id: '40pWxpbXoBYGPCiofujjZ6', title: 'Chăm Hoa', artist: 'MONO', src: '/audio/cham-hoa.mp3'},
  {id: '6GM4ZOBDcDroldUxI8GZ2B', title: 'Ai Ngoài Anh', artist: 'VSTRA, Tyronee', src: '/audio/ai-ngoai-anh.mp3'},
  {id: '6Qwl74olNi1rl65FNxG5We', title: 'Và Thế Giới Đã Mất Đi Một Người Cô Đơn', artist: 'marzuz, Changg', src: '/audio/va-the-gioi.mp3'},
  {id: 'da-lo-yeu-em-nhieu', title: 'Đã Lỡ Yêu Em Nhiều', artist: 'JustaTee', src: '/audio/da-lo-yeu-em-nhieu.mp3'},
  {id: 'first-dance', title: 'First Dance', artist: 'Uprize', src: '/audio/first-dance.mp3'}
];

function time(seconds: number) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

function Cassette({small = false}: {small?: boolean}) {
  return <svg className={small ? 'music-cassette music-cassette-small' : 'music-cassette'} viewBox="0 0 120 72" fill="none" aria-hidden="true">
    <path d="M4 4h112v64H4z" fill="#dca1ad" stroke="#6c4e60" strokeWidth="4"/>
    <path d="M12 12h96v35H12z" fill="#fff3d8"/>
    <path d="M19 18h12m58 0h12" stroke="#d2b6a7" strokeWidth="2"/>
    <path d="M35 30h50v12H35z" fill="#6c4e60"/>
    <g className="music-reel"><circle cx="35" cy="36" r="10" fill="#a5b58c" stroke="#6c4e60" strokeWidth="3"/><path d="M35 30v12m-6-6h12" stroke="#fff3d8" strokeWidth="3"/></g>
    <g className="music-reel"><circle cx="85" cy="36" r="10" fill="#a5b58c" stroke="#6c4e60" strokeWidth="3"/><path d="M85 30v12m-6-6h12" stroke="#fff3d8" strokeWidth="3"/></g>
    <path d="m29 66 7-14h48l7 14" fill="#edbdc5" stroke="#6c4e60" strokeWidth="3"/>
    <path d="M46 59h28M11 59h4m90 0h4" stroke="#6c4e60" strokeWidth="3"/>
  </svg>;
}

type IconKind = 'previous' | 'next' | 'play' | 'pause' | 'repeat' | 'volume' | 'muted';
function Icon({kind}: {kind: IconKind}) {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {kind === 'play' && <path d="M7 4v16l13-8z"/>}
    {kind === 'pause' && <path d="M5 4h5v16H5zm9 0h5v16h-5z"/>}
    {kind === 'previous' && <path d="M4 5h3v14H4zm15 0v14L8 12z"/>}
    {kind === 'next' && <path d="M17 5h3v14h-3zM5 5l11 7-11 7z"/>}
    {kind === 'repeat' && <path d="M17 2v3H7a4 4 0 0 0-4 4v3h2V9a2 2 0 0 1 2-2h10v3l5-4zM7 22v-3h10a4 4 0 0 0 4-4v-3h-2v3a2 2 0 0 1-2 2H7v-3l-5 4z"/>}
    {(kind === 'volume' || kind === 'muted') && <><path d="M3 9h4l5-4v14l-5-4H3z"/>{kind === 'muted' ? <path d="m16 8 6 6m0-6-6 6" fill="none" stroke="currentColor" strokeWidth="2"/> : <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" fill="none" stroke="currentColor" strokeWidth="2"/>}</>}
  </svg>;
}

export function MusicPlayer() {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const [invitation, setInvitation] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [error, setError] = useState('');
  const audio = useRef<HTMLAudioElement>(null);
  const resume = useRef(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const minimize = useRef<HTMLButtonElement>(null);
  const track = tracks[index];
  const moving = playing && !waiting;

  function dismissInvitation() {
    setInvitation(false);
    try {sessionStorage.setItem('petals-music-invitation-seen', '1');} catch {}
  }

  useEffect(() => {
    try {setInvitation(sessionStorage.getItem('petals-music-invitation-seen') !== '1');}
    catch {setInvitation(true);}
  }, []);

  async function play() {
    const media = audio.current;
    if (!media) return;
    const requestedSource = media.src;
    setError('');
    setWaiting(true);
    if (media.error) media.load();
    try { await media.play(); }
    catch (reason) {
      if (reason instanceof Error && reason.name === 'AbortError') return;
      if (media.src === requestedSource) {
        setError('Không phát được bài hát. Hãy nhấn phát để thử lại.');
        setWaiting(false);
      }
    }
  }

  function selectTrack(next: number, autoplay = playing) {
    if (next === index) return;
    audio.current?.pause();
    resume.current = autoplay;
    setIndex(next);
  }

  useEffect(() => {
    const media = audio.current;
    setPosition(0);
    setDuration(0);
    setError('');
    setWaiting(false);
    media?.load();
    if (resume.current) {
      resume.current = false;
      void play();
    }
  }, [index]);

  useEffect(() => {
    if (audio.current) {
      audio.current.volume = volume;
      audio.current.muted = muted;
    }
  }, [volume, muted]);

  useEffect(() => {
    if (!open) {
      if (opened) launcher.current?.focus();
      return;
    }
    minimize.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, opened]);

  return <aside className="music-dock" aria-label="Góc nhạc" data-playing={moving}>
    <MusicNotes playing={moving} expanded={open}/>
    <audio ref={audio} src={track.src} preload="metadata" loop={repeat}
      onPlay={() => setPlaying(true)} onPlaying={() => setWaiting(false)}
      onPause={() => {setPlaying(false); setWaiting(false);}}
      onWaiting={() => setWaiting(true)} onCanPlay={() => setWaiting(false)}
      onLoadedMetadata={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onDurationChange={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onTimeUpdate={event => setPosition(event.currentTarget.currentTime)}
      onError={() => {setPlaying(false); setWaiting(false); setError('Chưa tải được bài hát. Hãy nhấn phát để thử lại.');}}
      onEnded={() => {setPlaying(false); if (index < tracks.length - 1) selectTrack(index + 1, true);}}/>
    <section className="music-player" id="garden-music-player" hidden={!open} aria-labelledby="garden-music-title">
      <div className="music-titlebar">
        <h2 id="garden-music-title"><span aria-hidden="true">♫</span> THANK YOU MIX</h2>
        <span className="music-titlebar-model">LTPC / 20.10</span>
        <button ref={minimize} type="button" onClick={() => setOpen(false)} aria-label="Thu nhỏ máy nghe nhạc" title="Thu nhỏ">−</button>
      </div>
      <div className="music-body">
        <div className="music-tape">
          <Cassette/>
          <div><span className="music-pixel-label">THANK YOU MIXTAPE</span><p>Một chút nhạc,<br/>một chút thương.</p></div>
        </div>
        <div className="music-display">
          <div className="music-now">
            <div className="music-now-copy" aria-live="polite"><h3>{track.title}</h3><p>{track.artist}</p></div>
            <button className="music-repeat" type="button" onClick={() => setRepeat(!repeat)} aria-pressed={repeat} aria-label="Lặp lại bài hát" title="Lặp lại bài hát"><Icon kind="repeat"/><span>1</span></button>
          </div>
          <div className="music-display-bottom"><span className="music-levels" aria-hidden="true">{Array.from({length: 49}, (_, i) => <i key={i} style={{'--bar': i} as CSSProperties}/>)}</span></div>
        </div>
        <div className="music-timeline">
          <label className="music-sr-only" htmlFor="music-seek">Vị trí phát</label>
          <input id="music-seek" className="music-slider" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(position, duration || 0)} disabled={!duration} aria-valuetext={`${time(position)} / ${time(duration)}`} style={{'--fill': `${duration ? position / duration * 100 : 0}%`} as CSSProperties} onChange={event => {
            const next = Number(event.target.value);
            if (audio.current && duration) {audio.current.currentTime = next; setPosition(next);}
          }}/>
          <div className="music-times"><span>{time(position)}</span><span>{duration ? time(duration) : '–:––'}</span></div>
        </div>
        <div className="music-transport" role="group" aria-label="Điều khiển phát nhạc">
          <button type="button" onClick={() => selectTrack((index + tracks.length - 1) % tracks.length)} aria-label="Bài trước" title="Bài trước"><Icon kind="previous"/></button>
          <button className="music-play" type="button" onClick={() => {if (playing) audio.current?.pause(); else void play();}} aria-label={playing ? 'Tạm dừng' : 'Phát nhạc'} title={playing ? 'Tạm dừng' : 'Phát nhạc'}><Icon kind={playing ? 'pause' : 'play'}/></button>
          <button type="button" onClick={() => selectTrack((index + 1) % tracks.length)} aria-label="Bài tiếp theo" title="Bài tiếp theo"><Icon kind="next"/></button>
        </div>
        <div className="music-volume">
          <button type="button" onClick={() => {if (volume === 0) {setVolume(0.4); setMuted(false);} else setMuted(!muted);}} aria-label={muted || volume === 0 ? 'Bật tiếng nhạc' : 'Tắt tiếng nhạc'} title={muted || volume === 0 ? 'Bật tiếng nhạc' : 'Tắt tiếng nhạc'}><Icon kind={muted || volume === 0 ? 'muted' : 'volume'}/></button>
          <label className="music-sr-only" htmlFor="music-volume">Âm lượng nhạc</label>
          <input id="music-volume" className="music-slider" type="range" min="0" max="100" value={Math.round(volume * 100)} aria-valuetext={`${muted ? 0 : Math.round(volume * 100)}%`} style={{'--fill': `${muted ? 0 : volume * 100}%`} as CSSProperties} onChange={event => {setVolume(Number(event.target.value) / 100); setMuted(false);}}/>
          <span>{muted ? '00' : String(Math.round(volume * 100)).padStart(2, '0')}</span>
        </div>
        {error && <p className="music-error" role="alert">{error}</p>}
      </div>
    </section>
    {!open && invitation && <MusicInvitation onDismiss={dismissInvitation}/>}
    <button className="music-launcher" ref={launcher} hidden={open} data-invitation={invitation} type="button" aria-label="Mở máy nghe nhạc" aria-describedby={invitation ? 'music-invitation-text' : undefined} title={playing ? `Đang phát: ${track.title}` : 'Chạm vào cuộn băng để nghe nhạc'} aria-expanded={open} aria-controls="garden-music-player" onClick={() => {
      dismissInvitation();
      if (!opened && !playing) void play();
      setOpened(true); setOpen(true);
    }}>
      <Cassette small/>
    </button>
  </aside>;
}
