import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Crosshair, Headphones, Info, Maximize2, Menu, Shield, Skull, Volume2, VolumeX, X } from 'lucide-react';
import { FrostGame, initialHud, type GameScreen, type Hud, type Team } from './game';
import './index.css';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<FrostGame | null>(null);
  const screenRef = useRef<GameScreen>('menu');
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [team, setTeam] = useState<Team>('ct');
  const [hud, setHud] = useState<Hud>(initialHud);
  const [result, setResult] = useState<'win' | 'lose'>('win');
  const [muted, setMuted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const changeScreen = useCallback((value: GameScreen) => {
    screenRef.current = value;
    setScreen(value);
    if (gameRef.current) gameRef.current.screen = value;
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const game = new FrostGame(mount, setHud, outcome => {
      setResult(outcome);
      changeScreen('result');
    });
    gameRef.current = game;
    const resize = () => game.resize(mount);
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      game.dispose();
      gameRef.current = null;
    };
  }, [changeScreen]);

  useEffect(() => {
    const onLock = () => {
      const game = gameRef.current;
      if (!game) return;
      game.locked = document.pointerLockElement === game.renderer.domElement;
      if (!game.locked && screenRef.current === 'playing' && !game.ended) {
        game.firing = false;
        changeScreen('paused');
      }
    };
    const onMouse = (event: MouseEvent) => {
      const game = gameRef.current;
      if (!game || !game.locked || game.screen !== 'playing') return;
      game.yaw -= event.movementX * .0022;
      game.pitch = Math.max(-1.35, Math.min(1.35, game.pitch - event.movementY * .0022));
      game.camera.rotation.set(game.pitch, game.yaw, 0, 'YXZ');
    };
    const onDown = (event: MouseEvent) => {
      const game = gameRef.current;
      if (!game || !game.locked || game.screen !== 'playing') return;
      if (event.button === 0) { game.firing = true; game.shoot(); }
      if (event.button === 2) game.aiming = true;
    };
    const onUp = (event: MouseEvent) => {
      const game = gameRef.current;
      if (!game) return;
      if (event.button === 0) game.firing = false;
      if (event.button === 2) game.aiming = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const game = gameRef.current;
      if (!game) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
      game.keys.add(event.code);
      if (event.code === 'KeyR') game.reload();
      if (event.code === 'KeyG' && !event.repeat) game.throwGrenade();
      if (event.code === 'KeyM' && !event.repeat && game.screen === 'playing') setShowMap(v => !v);
    };
    const onKeyUp = (event: KeyboardEvent) => gameRef.current?.keys.delete(event.code);
    const onContext = (event: MouseEvent) => event.preventDefault();
    document.addEventListener('pointerlockchange', onLock);
    document.addEventListener('mousemove', onMouse);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('contextmenu', onContext);
    return () => {
      document.removeEventListener('pointerlockchange', onLock);
      document.removeEventListener('mousemove', onMouse);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('contextmenu', onContext);
    };
  }, [changeScreen]);

  const startRound = (selected = team) => {
    setShowGuide(false);
    setShowMap(false);
    gameRef.current?.start(selected);
    changeScreen('playing');
  };
  const resume = () => {
    changeScreen('playing');
    gameRef.current?.renderer.domElement.requestPointerLock?.();
  };
  const goMenu = () => {
    document.exitPointerLock?.();
    gameRef.current?.menu();
    setShowMap(false);
    changeScreen('menu');
  };
  const toggleSound = () => {
    if (gameRef.current) gameRef.current.muted = !muted;
    setMuted(!muted);
  };
  const formattedTime = `${Math.floor(hud.time / 60)}:${String(hud.time % 60).padStart(2, '0')}`;

  return (
    <div className="app-shell">
      <div className="game-canvas" ref={mountRef} onClick={() => { if (screen === 'playing' && !gameRef.current?.locked) resume(); }} />
      <div className="screen-vignette" />

      {screen === 'menu' && (
        <div className="menu-screen">
          <header className="site-header">
            <div className="brand-lockup"><span className="brand-mark"><Crosshair size={22} strokeWidth={2.3} /></span><span>FROST<span className="brand-accent">LINE</span><small>TACTICAL ARENA</small></span></div>
            <div className="header-right"><span className="online-dot" /> SOLO TRAINING <span className="header-divider" /><button className="icon-button" aria-label={muted ? 'Unmute sound' : 'Mute sound'} onClick={toggleSound}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button></div>
          </header>
          <main className="menu-content">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> ONE MAP. TWO SIDES. NO SECOND CHANCES.</div>
              <h1>FROST<br /><span>LINE.</span></h1>
              <p>A fast-paced tactical firefight in a frozen outpost. Pick your side, hold your angles, and clear the field.</p>
              <div className="hero-actions"><button className="primary-button" onClick={() => startRound()}>DEPLOY NOW <ArrowRight size={19} /></button><button className="text-button" onClick={() => setShowGuide(true)}><Info size={17} /> HOW TO PLAY</button></div>
            </div>
            <div className="team-picker" aria-label="Choose your team">
              <div className="picker-heading"><span>01 / SELECT YOUR SIDE</span><span className="picker-line" /></div>
              <button className={`team-option ${team === 'ct' ? 'selected' : ''}`} onClick={() => setTeam('ct')}>
                <span className="team-symbol ct-symbol"><Shield size={24} strokeWidth={1.7} /></span>
                <span className="team-info"><strong>COUNTER-TERRORIST</strong><small>M4A1-S <span className="dot-sep">/</span> DEFEND THE OUTPOST</small></span>
                <span className="selector-ring"><span /></span>
              </button>
              <button className={`team-option ${team === 't' ? 'selected' : ''}`} onClick={() => setTeam('t')}>
                <span className="team-symbol t-symbol"><Crosshair size={24} strokeWidth={1.7} /></span>
                <span className="team-info"><strong>TERRORIST</strong><small>AK-47 <span className="dot-sep">/</span> TAKE THE OUTPOST</small></span>
                <span className="selector-ring"><span /></span>
              </button>
              <div className="picker-footnote"><span className="small-diamond" /> 1 MAP: SNOWBOUND <span className="footnote-sep">/</span> 4 ENEMY OPERATIVES</div>
            </div>
          </main>
          <footer className="menu-footer"><span>BUILT FOR THE BROWSER <span className="footer-slash">//</span> NO DOWNLOAD REQUIRED</span><span>MOVE WITH WASD <span className="footer-slash">/</span> AIM WITH MOUSE <span className="footer-slash">/</span> SHOOT TO SURVIVE</span></footer>
        </div>
      )}

      {screen === 'playing' && (
        <div className="hud-layer">
          <div className="top-hud"><div className="hud-team"><span className={`hud-team-icon ${team}`}><Shield size={20} /></span><span>{team === 'ct' ? 'COUNTER-TERRORIST' : 'TERRORIST'}<small>SNOWBOUND / SOLO TRAINING</small></span></div><div className="round-clock"><small>ROUND {hud.round.toString().padStart(2, '0')}</small><strong>{formattedTime}</strong></div><div className="top-right-hud"><span className="enemy-count">{hud.enemies.toString().padStart(2, '0')} <small>ENEMIES LEFT</small></span><button onClick={() => setShowMap(v => !v)} className="hud-icon-button" title="Toggle map (M)"><Menu size={19} /></button></div></div>
          {hud.feed && <div className="kill-feed">{hud.feed}</div>}
          <div className={`damage-flash ${hud.damage ? 'active' : ''}`} />
          <div className={`crosshair ${hud.hit ? 'crosshair-hit' : ''}`}><i /><i /><i /><i /><span /></div>
          {hud.reloading && <div className="reload-notice">RELOADING...</div>}
          <div className="bottom-hud"><div className="vitals"><div className="vital-number"><span className="vital-icon">+</span><strong>{hud.health}</strong><small>HEALTH</small></div><div className="vital-divider" /><div className="vital-number armor"><Shield size={19} /><strong>{hud.armor}</strong><small>ARMOR</small></div></div><div className="bottom-center">{hud.kills} ELIMINATIONS <span>/</span> {hud.grenades} GRENADE</div><div className="ammo-section"><div className="ammo-label">{team === 'ct' ? 'M4A1-S' : 'AK-47'} <span>PRIMARY</span></div><div className="ammo-numbers"><strong>{hud.ammo.toString().padStart(2, '0')}</strong><span>/ {hud.reserve.toString().padStart(2, '0')}</span></div></div></div>
          <div className="game-hint">WASD MOVE <span>/</span> SHIFT SPRINT <span>/</span> R RELOAD <span>/</span> G GRENADE <span>/</span> ESC PAUSE</div>
          {showMap && <div className="minimap"><div className="minimap-title">SNOWBOUND <button onClick={() => setShowMap(false)} aria-label="Close map"><X size={14} /></button></div><div className="map-area"><div className="map-block central" /><div className="map-block map-a" /><div className="map-block map-b" /><div className="map-block map-c" /><div className="map-block map-d" /><div className={`player-marker ${team}`} style={{ left: `${50 + hud.x / 58 * 100}%`, top: `${50 + hud.z / 58 * 100}%` }} /></div><div className="minimap-footer">M TO TOGGLE MAP</div></div>}
        </div>
      )}

      {(screen === 'paused' || screen === 'result') && (
        <div className="modal-backdrop"><div className="state-modal">
          <span className="modal-kicker">{screen === 'paused' ? 'MATCH INTERRUPTED' : 'ROUND COMPLETE'}</span>
          <div className={`modal-emblem ${screen === 'result' && result === 'lose' ? 'defeat' : ''}`}>{screen === 'paused' ? <Maximize2 size={27} /> : result === 'win' ? <Shield size={29} /> : <Skull size={29} />}</div>
          <h2>{screen === 'paused' ? 'PAUSED' : result === 'win' ? 'VICTORY' : 'DEFEAT'}</h2>
          <p>{screen === 'paused' ? 'Take a breath. The outpost will be here when you get back.' : result === 'win' ? 'The outpost is secure. Nice shooting, operator.' : 'The enemy has the outpost. Run it back.'}</p>
          {screen === 'result' && <div className="result-line"><span>ELIMINATIONS <strong>{hud.kills}</strong></span><span>ENEMIES REMAINING <strong>{hud.enemies}</strong></span></div>}
          <button className="primary-button modal-primary" onClick={screen === 'paused' ? resume : () => startRound()}>{screen === 'paused' ? 'RESUME MATCH' : 'PLAY AGAIN'} <ArrowRight size={18} /></button>
          <button className="modal-link" onClick={goMenu}>{screen === 'paused' ? 'LEAVE MATCH' : 'BACK TO MENU'}</button>
        </div></div>
      )}

      {showGuide && screen === 'menu' && <div className="modal-backdrop" onClick={() => setShowGuide(false)}><div className="guide-modal" onClick={e => e.stopPropagation()}><button className="guide-close" aria-label="Close guide" onClick={() => setShowGuide(false)}><X size={20} /></button><span className="modal-kicker">FIELD MANUAL / 001</span><h2>KNOW THE <span>GROUND.</span></h2><p>Eliminate all four enemy operatives before the timer runs out. Use cover, keep moving, and make every magazine count.</p><div className="guide-grid"><div><kbd>W A S D</kbd><span>MOVE</span></div><div><kbd>MOUSE</kbd><span>LOOK & AIM</span></div><div><kbd>LEFT CLICK</kbd><span>FIRE</span></div><div><kbd>RIGHT CLICK</kbd><span>AIM DOWN SIGHTS</span></div><div><kbd>R</kbd><span>RELOAD</span></div><div><kbd>G</kbd><span>THROW GRENADE</span></div><div><kbd>SHIFT</kbd><span>SPRINT</span></div><div><kbd>CTRL</kbd><span>CROUCH</span></div><div><kbd>M</kbd><span>TOGGLE MAP</span></div><div><kbd>ESC</kbd><span>PAUSE</span></div></div><div className="guide-note"><Headphones size={17} /> Best played on desktop with a mouse and keyboard.</div><button className="primary-button" onClick={() => startRound()}>READY TO DEPLOY <ArrowRight size={18} /></button></div></div>}
    </div>
  );
}