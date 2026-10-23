import * as THREE from 'three';

export type Team = 'ct' | 't';
export type GameScreen = 'menu' | 'playing' | 'paused' | 'result';
export type Hud = { health: number; armor: number; ammo: number; reserve: number; enemies: number; kills: number; time: number; grenades: number; round: number; hit: boolean; damage: boolean; reloading: boolean; feed: string; x: number; z: number };
export const initialHud: Hud = { health: 100, armor: 100, ammo: 30, reserve: 90, enemies: 4, kills: 0, time: 120, grenades: 1, round: 1, hit: false, damage: false, reloading: false, feed: '', x: 0, z: 22 };
type Solid = { x: number; z: number; w: number; d: number; mesh: THREE.Mesh };
type Bot = { group: THREE.Group; hp: number; alive: boolean; cooldown: number; strafe: number; phase: number; name: string };
type Grenade = { mesh: THREE.Mesh; velocity: THREE.Vector3; fuse: number };

const material = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: .9, flatShading: true });
function addBox(scene: THREE.Scene, solids: Solid[], x: number, z: number, w: number, d: number, h: number, color: number, solid = true, y = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
  mesh.position.set(x, y + h / 2, z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
  if (solid) solids.push({ x, z, w, d, mesh });
  return mesh;
}

function buildWorld(scene: THREE.Scene, solids: Solid[]) {
  scene.background = new THREE.Color('#a9c5d3');
  scene.fog = new THREE.FogExp2('#b6ced7', .012);
  scene.add(new THREE.HemisphereLight(0xe6f5ff, 0x8296a0, 2.1));
  const sun = new THREE.DirectionalLight(0xfff1d7, 2.4);
  sun.position.set(-24, 42, -25); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -55; sun.shadow.camera.right = 55; sun.shadow.camera.top = 55; sun.shadow.camera.bottom = -55;
  sun.shadow.normalBias = .025; scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), material(0xdbe9ee));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  // A compact, symmetrical outpost with three routes and plenty of cover.
  addBox(scene, solids, 0, 0, 8, 9, 5.2, 0x8798a0);
  [[-13,-8,9,3.5,0x455e6e],[13,8,9,3.5,0xb26248],[13,-11,7,3.5,0x5b7480],[-13,11,7,3.5,0x687b7e]].forEach(([x,z,w,d,c]) => {
    addBox(scene, solids, x,z,w,d,3.3,c);
    for(let i=-w/2+.55;i<w/2;i+=.8) addBox(scene,solids,x+i,z+d/2+.035,.065,.09,2.9,0x344753,false);
    addBox(scene,solids,x,z,w+.18,d+.18,.16,0xe8f2f2,false,3.3);
  });
  addBox(scene,solids,0,0,8.5,9.5,.26,0xe7f2f3,false,5.2);
  addBox(scene,solids,-22,0,3,9,3,0x788b91); addBox(scene,solids,22,0,3,9,3,0x788b91);
  [[-7,-16],[7,16],[8,-3],[-8,3],[-19,16],[19,-16]].forEach(([x,z],i) => addBox(scene,solids,x,z,i<2?3.3:2.5,2.4,1.7,i%2?0x88969a:0x9a8971));
  const fence = material(0x82969b);
  for(let i=-29;i<=29;i+=2) for(const side of [-29,29]) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(.13,3,.13),fence); a.position.set(i,1.5,side); scene.add(a);
    const b = new THREE.Mesh(new THREE.BoxGeometry(.13,3,.13),fence); b.position.set(side,1.5,i); scene.add(b);
  }
  for(const side of [-29,29]) for(const y of [1.05,2.6]) {
    addBox(scene,solids,0,side,59,.07,.08,0x7b8e94,false,y);
    addBox(scene,solids,side,0,.07,59,.08,0x7b8e94,false,y);
  }
  const peak = material(0xc4d7dd), distant = material(0x9db6be);
  for(let i=0;i<34;i++) {
    const a=i/34*Math.PI*2,r=55+i%4*6,h=15+(i*13)%19;
    const mountain=new THREE.Mesh(new THREE.ConeGeometry(12+i%7,h,4),i%3?peak:distant);
    mountain.position.set(Math.cos(a)*r,h/2-3,Math.sin(a)*r); mountain.rotation.y=a; scene.add(mountain);
  }
  const trunk=material(0x52635f),pine=material(0x476a69);
  for(let i=0;i<48;i++) {
    const a=i*2.399,r=32+i%7*2.3,x=Math.cos(a)*r,z=Math.sin(a)*r,h=4+i%5;
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.17,.24,h*.65,5),trunk); stem.position.set(x,h*.32,z); scene.add(stem);
    for(let j=0;j<3;j++) {const cone=new THREE.Mesh(new THREE.ConeGeometry(1.7-j*.3,2.5,6),pine);cone.position.set(x,h*.5+j*.9,z);scene.add(cone);}
  }
  const snow=material(0xf5fbfc);
  for(let i=0;i<110;i++) {
    const patch=new THREE.Mesh(new THREE.CircleGeometry(.2+i%5*.19,5),snow);
    patch.rotation.x=-Math.PI/2;patch.rotation.z=i;patch.position.set(Math.sin(i*91.7)*26,.015,Math.cos(i*47.3)*26);scene.add(patch);
  }
  for(const x of [-5,5]) {
    addBox(scene,solids,x,0,.3,.3,6.3,0x3e5057,false);
    const lamp=new THREE.Mesh(new THREE.BoxGeometry(.55,.25,.55),new THREE.MeshBasicMaterial({color:0xffd598}));lamp.position.set(x,6.35,0);scene.add(lamp);
  }
  for(const z of [-22,22]) {
    const ring=new THREE.Mesh(new THREE.RingGeometry(2.2,2.28,32),new THREE.MeshBasicMaterial({color:0xd3a96d}));
    ring.rotation.x=-Math.PI/2;ring.position.set(0,.025,z);scene.add(ring);
  }
}

function makeSnow(scene: THREE.Scene) {
  const positions = new Float32Array(330 * 3);
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (Math.random() - .5) * 82;
    positions[i + 1] = Math.random() * 24;
    positions[i + 2] = (Math.random() - .5) * 82;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const snow = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffffff, size: .12, transparent: true, opacity: .78, sizeAttenuation: true }));
  scene.add(snow);
  return snow;
}

function makeBot(scene: THREE.Scene, team: Team, name: string, x: number, z: number): Bot {
  const group=new THREE.Group();
  const uniform=material(team==='ct'?0x254c61:0x886748),dark=material(team==='ct'?0x192e39:0x39332c);
  const accent=material(team==='ct'?0x5b8591:0xb39263),skin=material(0xb99378);
  const part=(w:number,h:number,d:number,mat:THREE.Material,px:number,py:number,pz:number)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(px,py,pz);mesh.castShadow=true;group.add(mesh);return mesh;
  };
  part(.66,.78,.36,uniform,0,1.35,0);part(.7,.46,.42,dark,0,1.43,-.035);
  for(const side of [-1,1]) {
    part(.25,.57,.27,uniform,side*.2,.66,0);part(.28,.16,.42,dark,side*.2,.28,-.07);
    part(.2,.63,.27,uniform,side*.47,1.34,-.13).rotation.z=side*.28;
  }
  part(.36,.34,.34,skin,0,1.95,0);part(.49,.19,.46,dark,0,2.15,0);
  part(.38,.11,.15,accent,0,2.02,-.2);part(.66,.1,.15,dark,.18,1.43,-.42);
  part(.1,.1,.72,dark,.31,1.43,-.75);
  group.position.set(x,0,z);scene.add(group);
  return {group,hp:100,alive:true,cooldown:1+Math.random(),strafe:Math.random()>.5?1:-1,phase:Math.random()*10,name};
}

function makeWeapon(team: Team) {
  const group=new THREE.Group();
  const metal=new THREE.MeshStandardMaterial({color:0x18242b,metalness:.65,roughness:.42});
  const edge=new THREE.MeshStandardMaterial({color:0x48565a,metalness:.6,roughness:.45});
  const grip=material(team==='ct'?0x26353b:0x795134);
  const part=(w:number,h:number,d:number,mat:THREE.Material,x:number,y:number,z:number)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);group.add(mesh);return mesh;
  };
  part(.16,.15,.57,metal,0,0,-.14);part(.17,.115,.39,grip,0,-.015,-.52);
  part(.12,.14,.34,grip,0,-.035,.3);part(.13,.31,.15,grip,0,-.22,.01).rotation.x=-.28;
  part(.12,.24,.13,metal,0,-.23,-.25).rotation.x=team==='t'?-.22:.1;
  part(.11,.045,.31,edge,0,.105,-.13);part(.08,.07,.055,metal,0,.16,-.35);
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.036,.036,team==='ct'?.65:.47,10),metal);
  barrel.rotation.x=Math.PI/2;barrel.position.set(0,.01,team==='ct'?-1.03:-.91);group.add(barrel);
  if(team==='ct') {
    const suppressor=new THREE.Mesh(new THREE.CylinderGeometry(.064,.064,.38,12),edge);
    suppressor.rotation.x=Math.PI/2;suppressor.position.set(0,.01,-1.37);group.add(suppressor);
  } else part(.15,.05,.32,grip,0,.105,-.5);
  group.position.set(.35,-.32,-.61);group.rotation.y=-.08;return group;
}

export class FrostGame {
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(70,1,.08,180);
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  solids:Solid[]=[]; bots:Bot[]=[]; grenadesActive:Grenade[]=[];
  snow:THREE.Points;
  effects:{mesh:THREE.Mesh;life:number;blast?:boolean}[]=[];
  player=new THREE.Vector3(0,1.7,22); weapon=makeWeapon('ct');
  team:Team='ct';screen:GameScreen='menu';locked=false;firing=false;aiming=false;ended=false;
  yaw=0;pitch=0;keys=new Set<string>();lastShot=0;lastFrame=performance.now();lastHud=0;
  time=120;health=100;armor=100;ammo=30;reserve=90;kills=0;grenades=1;round=0;
  reloadUntil=0;hitUntil=0;damageUntil=0;feedUntil=0;feed='';muted=false;
  audio:AudioContext|null=null;raf=0;
  onHud:(hud:Hud)=>void;onEnd:(outcome:'win'|'lose')=>void;

  constructor(mount:HTMLElement,onHud:(hud:Hud)=>void,onEnd:(outcome:'win'|'lose')=>void) {
    this.onHud=onHud;this.onEnd=onEnd;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.45;
    mount.appendChild(this.renderer.domElement);
    buildWorld(this.scene,this.solids);
    this.snow=makeSnow(this.scene);
    this.weapon.visible=false;this.camera.add(this.weapon);this.scene.add(this.camera);
    this.resize(mount);
    this.raf=requestAnimationFrame(this.tick);
  }

  resize(mount:HTMLElement) {
    this.camera.aspect=mount.clientWidth/mount.clientHeight;this.camera.updateProjectionMatrix();
    this.renderer.setSize(mount.clientWidth,mount.clientHeight);
  }
  collision(x:number,z:number,r=.34) {
    return Math.abs(x)>28.2||Math.abs(z)>28.2||this.solids.some(s=>Math.abs(x-s.x)<s.w/2+r&&Math.abs(z-s.z)<s.d/2+r);
  }
  hud() {
    this.onHud({health:Math.max(0,Math.ceil(this.health)),armor:Math.ceil(this.armor),ammo:this.ammo,reserve:this.reserve,
      enemies:this.bots.filter(b=>b.alive).length,kills:this.kills,time:Math.max(0,Math.ceil(this.time)),grenades:this.grenades,
      round:this.round,hit:performance.now()<this.hitUntil,damage:performance.now()<this.damageUntil,
      reloading:this.reloadUntil>performance.now(),feed:performance.now()<this.feedUntil?this.feed:'',x:this.player.x,z:this.player.z});
  }
  tone(type:'shot'|'hit'|'reload'|'hurt'|'boom') {
    if(this.muted||!this.audio)return;
    try {
      const ctx=this.audio,osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;
      const freq={shot:90,hit:650,reload:280,hurt:120,boom:55}[type];
      osc.type=type==='shot'||type==='boom'?'sawtooth':'triangle';
      osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(Math.max(35,freq*.35),now+(type==='boom'?.35:.12));
      gain.gain.setValueAtTime(type==='shot'?.055:.035,now);
      gain.gain.exponentialRampToValueAtTime(.001,now+(type==='boom'?.4:.14));
      osc.connect(gain).connect(ctx.destination);osc.start(now);osc.stop(now+(type==='boom'?.41:.15));
    }catch{/* Audio is optional when blocked by the browser. */}
  }
  tracer(from:THREE.Vector3,to:THREE.Vector3,color:number) {
    const vector=to.clone().sub(from);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,vector.length(),5),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8}));
    mesh.position.copy(from).add(to).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vector.normalize());
    this.scene.add(mesh);this.effects.push({mesh,life:.11});
  }
  start(team:Team) {
    this.bots.forEach(b=>this.scene.remove(b.group));this.bots=[];
    this.grenadesActive.forEach(g=>this.scene.remove(g.mesh));this.grenadesActive=[];
    this.effects.forEach(e=>this.scene.remove(e.mesh));this.effects=[];
    this.team=team;this.ended=false;this.time=120;this.health=100;this.armor=100;this.ammo=30;
    this.reserve=90;this.kills=0;this.grenades=1;this.reloadUntil=0;this.feed='';this.feedUntil=0;
    this.yaw=team==='ct'?0:Math.PI;this.pitch=0;
    this.player.set(0,1.7,team==='ct'?22:-22);this.camera.position.copy(this.player);
    this.camera.rotation.set(0,this.yaw,0,'YXZ');
    this.camera.remove(this.weapon);this.weapon=makeWeapon(team);this.camera.add(this.weapon);this.weapon.visible=true;
    const enemyZ=team==='ct'?-20:20;
    [[-17,enemyZ],[-6,enemyZ+(enemyZ<0?3:-3)],[7,enemyZ],[18,enemyZ+(enemyZ<0?3:-3)]].forEach(([x,z],i)=>this.bots.push(makeBot(this.scene,team==='ct'?'t':'ct',['VIPER','GHOST','ROOK','ECHO'][i],x,z)));
    this.round++;this.keys.clear();this.firing=false;this.screen='playing';this.hud();
    this.renderer.domElement.requestPointerLock?.();
    if(!this.audio)try{this.audio=new AudioContext();}catch{/* Silent fallback. */}
  }
  end(outcome:'win'|'lose') {
    if(this.ended)return;
    this.ended=true;this.firing=false;this.screen='result';this.hud();
    document.exitPointerLock?.();this.onEnd(outcome);
  }
  menu() {
    this.bots.forEach(b=>this.scene.remove(b.group));this.bots=[];
    this.grenadesActive.forEach(g=>this.scene.remove(g.mesh));this.grenadesActive=[];
    this.weapon.visible=false;this.firing=false;this.screen='menu';
  }
  reload() {
    if(this.screen!=='playing'||this.ammo===30||this.reserve<=0||this.reloadUntil>performance.now())return;
    this.reloadUntil=performance.now()+1950;this.tone('reload');this.hud();
  }
  shoot() {
    if(this.screen!=='playing'||!this.locked||this.ended)return;
    const now=performance.now();
    if(now-this.lastShot<(this.team==='ct'?105:115)||this.reloadUntil>now)return;
    if(this.ammo<=0){this.reload();return;}
    this.lastShot=now;this.ammo--;this.tone('shot');
    this.pitch=Math.min(1.25,this.pitch+(this.aiming?.008:.019));
    this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
    const origin=this.camera.position.clone(),direction=new THREE.Vector3();this.camera.getWorldDirection(direction);
    direction.x+=(Math.random()-.5)*(this.aiming?.003:.009);
    direction.y+=(Math.random()-.5)*(this.aiming?.003:.009);direction.normalize();
    const ray=new THREE.Raycaster(origin,direction,.1,100);
    const wall=ray.intersectObjects(this.solids.map(s=>s.mesh),false)[0];
    const hit=ray.intersectObjects(this.bots.filter(b=>b.alive).map(b=>b.group),true).find(h=>h.distance<(wall?.distance??100));
    const end=hit?.point??wall?.point??origin.clone().addScaledVector(direction,60);
    this.tracer(origin.clone().add(new THREE.Vector3(.16,-.12,0)),end,0xffdf9e);
    if(hit) {
      let object:THREE.Object3D|null=hit.object;
      while(object&&!this.bots.some(b=>b.group===object))object=object.parent;
      const bot=this.bots.find(b=>b.group===object);
      if(bot) {
        bot.hp-=hit.point.y>1.85?100:this.team==='t'?39:35;
        this.hitUntil=now+180;this.tone('hit');
        if(bot.hp<=0) {
          bot.alive=false;this.scene.remove(bot.group);this.kills++;
          this.feed=`YOU  [ ${this.team==='ct'?'M4A1-S':'AK-47'} ]  ${bot.name}`;this.feedUntil=now+3500;
          if(this.bots.every(b=>!b.alive))this.end('win');
        }
      }
    }
    this.hud();
  }
  throwGrenade() {
    if(this.screen!=='playing'||this.grenades<1||!this.locked)return;
    this.grenades--;
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),material(0x343e3c));
    const direction=new THREE.Vector3();this.camera.getWorldDirection(direction);
    mesh.position.copy(this.camera.position).addScaledVector(direction,.65);
    this.scene.add(mesh);this.grenadesActive.push({mesh,velocity:direction.multiplyScalar(13).add(new THREE.Vector3(0,4,0)),fuse:2.2});this.hud();
  }
  tick=(now:number)=>{
    this.raf=requestAnimationFrame(this.tick);
    const dt=Math.min((now-this.lastFrame)/1000,.05);this.lastFrame=now;
    const flakes=this.snow.geometry.attributes.position as THREE.BufferAttribute;
    for(let i=0;i<flakes.count;i++) {
      const next=flakes.getY(i)-dt*(1.1+i%5*.26);
      flakes.setY(i,next<0?24:next);
    }
    flakes.needsUpdate=true;
    if(this.screen==='menu') {
      const angle=now*.000055;
      this.camera.position.set(20+Math.sin(angle)*2.5,10.2,20+Math.cos(angle)*2.5);
      this.camera.lookAt(0,1.2,0);this.camera.fov=67;this.camera.updateProjectionMatrix();
    }
    if(this.screen==='playing') {
      if(this.locked) {
        const forward=Number(this.keys.has('KeyW'))-Number(this.keys.has('KeyS'));
        const side=Number(this.keys.has('KeyD'))-Number(this.keys.has('KeyA'));
        const length=Math.hypot(forward,side)||1;
        const speed=this.keys.has('ShiftLeft')?9:this.keys.has('ControlLeft')?3.3:6.3;
        const dx=((-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*side)/length)*speed*dt;
        const dz=((-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*side)/length)*speed*dt;
        if(!this.collision(this.player.x+dx,this.player.z))this.player.x+=dx;
        if(!this.collision(this.player.x,this.player.z+dz))this.player.z+=dz;
        const eye=this.keys.has('ControlLeft')?1.05:1.7;
        this.player.y+=(eye-this.player.y)*Math.min(1,dt*12);this.camera.position.copy(this.player);
        const moving=Math.hypot(dx,dz);
        this.weapon.position.set(.35+Math.sin(now*.01)*moving*.4,-.32+Math.abs(Math.cos(now*.011))*moving*.35,-.61);
        this.weapon.rotation.x=this.reloadUntil>now?Math.sin((this.reloadUntil-now)/1950*Math.PI)*-.65:0;
        this.camera.fov+=((this.aiming?53:70)-this.camera.fov)*Math.min(1,dt*12);this.camera.updateProjectionMatrix();
        if(this.firing)this.shoot();
      }
      if(this.reloadUntil&&now>=this.reloadUntil) {
        const amount=Math.min(30-this.ammo,this.reserve);this.ammo+=amount;this.reserve-=amount;this.reloadUntil=0;this.hud();
      }
      this.time-=dt;if(this.time<=0)this.end('lose');
      for(const bot of this.bots) {
        if(!bot.alive)continue;
        bot.phase+=dt;
        const toward=new THREE.Vector3(this.player.x-bot.group.position.x,0,this.player.z-bot.group.position.z);
        const distance=toward.length();bot.group.rotation.y=Math.atan2(-toward.x,-toward.z);
        if(distance>5&&distance<55) {
          const dir=toward.normalize(),approach=distance>12?1:.2;
          const stepX=(dir.x*approach+dir.z*bot.strafe*.45)*dt*2.3;
          const stepZ=(dir.z*approach-dir.x*bot.strafe*.45)*dt*2.3;
          if(!this.collision(bot.group.position.x+stepX,bot.group.position.z,.48))bot.group.position.x+=stepX;else bot.strafe*=-1;
          if(!this.collision(bot.group.position.x,bot.group.position.z+stepZ,.48))bot.group.position.z+=stepZ;else bot.strafe*=-1;
        }
        bot.group.position.y=Math.sin(bot.phase*8)*.018;bot.cooldown-=dt;
        if(distance<25&&bot.cooldown<=0&&this.locked) {
          const from=bot.group.position.clone().add(new THREE.Vector3(0,1.65,0));
          const target=this.player.clone();target.y=1.35;
          const ray=new THREE.Raycaster(from,target.clone().sub(from).normalize(),.1,distance);
          if(!ray.intersectObjects(this.solids.map(s=>s.mesh),false).length) {
            bot.cooldown=1.05+Math.random()*.7;this.tracer(from,target,0xffa870);
            if(Math.random()<(distance<9?.72:.47)) {
              const damage=9+Math.round(Math.random()*7),absorbed=Math.min(this.armor,Math.ceil(damage*.45));
              this.armor-=absorbed;this.health-=damage-absorbed;this.damageUntil=now+260;this.tone('hurt');
              if(this.health<=0)this.end('lose');
            }
          }else bot.cooldown=.3;
        }
      }
      for(let i=this.grenadesActive.length-1;i>=0;i--) {
        const grenade=this.grenadesActive[i];grenade.velocity.y-=15*dt;
        const next=grenade.mesh.position.clone().addScaledVector(grenade.velocity,dt);
        if(this.collision(next.x,next.z,.17)){grenade.velocity.x*=-.35;grenade.velocity.z*=-.35;}
        else{grenade.mesh.position.x=next.x;grenade.mesh.position.z=next.z;}
        grenade.mesh.position.y=Math.max(.16,next.y);
        if(next.y<=.16){grenade.velocity.y*= -.4;grenade.velocity.x*=.8;grenade.velocity.z*=.8;}
        grenade.mesh.rotation.x+=dt*7;grenade.fuse-=dt;
        if(grenade.fuse<=0) {
          const pos=grenade.mesh.position.clone();this.scene.remove(grenade.mesh);this.grenadesActive.splice(i,1);
          const blast=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshBasicMaterial({color:0xffc87a,transparent:true,opacity:.55,depthWrite:false}));
          blast.position.copy(pos);this.scene.add(blast);this.effects.push({mesh:blast,life:.36,blast:true});this.tone('boom');
          this.bots.filter(b=>b.alive).forEach(b=>{
            const distance=b.group.position.distanceTo(pos);
            if(distance<7){b.hp-=Math.round((7-distance)*26);if(b.hp<=0){b.alive=false;this.scene.remove(b.group);this.kills++;this.feed=`YOU  [ GRENADE ]  ${b.name}`;this.feedUntil=now+3500;}}
          });
          if(this.bots.every(b=>!b.alive))this.end('win');
        }
      }
      for(let i=this.effects.length-1;i>=0;i--) {
        const effect=this.effects[i];effect.life-=dt;if(effect.blast)effect.mesh.scale.addScalar(dt*20);
        if(effect.life<=0){this.scene.remove(effect.mesh);this.effects.splice(i,1);}
      }
      if(now-this.lastHud>180){this.hud();this.lastHud=now;}
    }
    this.renderer.render(this.scene,this.camera);
  };
  dispose() {
    cancelAnimationFrame(this.raf);this.audio?.close();this.renderer.domElement.remove();this.renderer.dispose();
  }
}