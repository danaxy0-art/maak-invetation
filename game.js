'use strict';
// Buildless HTML game. No server, API keys, Python or paid service required.
const $=id=>document.getElementById(id),canvas=$('scene'),ctx=canvas.getContext('2d');
const W=1280,H=720,images={},keys=new Set();
// A single deployment supports a different recipient in each shared URL.
function inviteName(search){
 const value=new URLSearchParams(search).get('name')||'';
 return Array.from(value.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,'').trim()).slice(0,32).join('');
}
const recipient=inviteName(window.location.search);
$('personalInvite').textContent=recipient?`${recipient}، ننتظرك في بوث معك` : '';
$('personalInvite').classList.toggle('hidden',!recipient);

const state={scene:'loading',hero:{x:850,y:651},target:null,moving:false,time:0,sceneTime:0,sequence:0,lit:0,muted:true,transitioning:false};
const assets=['campus_map','college_entrance','booth_off','booth_on','logo','hero_idle','volunteer_idle','hero_seated','volunteer_seated',...Array.from({length:8},(_,i)=>`hero_${i}`),...Array.from({length:8},(_,i)=>`volunteer_${i}`),...Array.from({length:4},(_,i)=>`back_${i}`)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const ease=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};const lerp=(a,b,u)=>a+(b-a)*u;
function visible(id,on){$(id).classList.toggle('hidden',!on)}
let audioContext;function tone(f=660,d=.15){if(state.muted)return;try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.05,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+d);o.connect(g).connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+d)}catch{}}
function chime(){[392,494,587,784].forEach((f,i)=>setTimeout(()=>tone(f,.5),i*130))}
let toastUntil=0;function toast(text,seconds=3){$('toast').textContent=text;visible('toast',true);toastUntil=state.time+seconds}
function scene(name){$('game').dataset.scene=name;state.scene=name;state.sceneTime=state.time;state.target=null;keys.clear();visible('mapUI',name==='map');visible('controls',['entrance','hall'].includes(name));visible('ending',name==='ending');visible('dialogue',false);visible('question',false);visible('toast',false);$('stageLabel').textContent=({map:'اختاري وجهتك',entrance:'قبل الدخول',hall:'وجهتك: بوث معك',conversation:'معك، مو لحالك',ending:'GROUP 11 · BOOTH 5'})[name]||'معك';}
function transition(next,setup){if(state.transitioning)return;state.transitioning=true;keys.clear();$('fade').classList.add('on');setTimeout(()=>{scene(next);setup?.();$('fade').classList.remove('on');setTimeout(()=>state.transitioning=false,400)},420)}
function start(){state.sequence=0;state.lit=0;state.hero={x:850,y:651};state.questionAnswered=false;scene('map')}
$('college').onclick=()=>{tone();transition('entrance',()=>{state.hero={x:850,y:651};state.questionAnswered=false})};
document.querySelectorAll('[data-answer]').forEach(btn=>btn.onclick=()=>{if(state.questionAnswered)return;if(btn.dataset.answer==='volunteer'){state.questionAnswered=true;btn.classList.add('correct');$('feedback').textContent='إجابة صحيحة! تفضّلي بالدخول';chime();state.answerAt=state.time;document.querySelectorAll('[data-answer]').forEach(b=>b.disabled=true)}else{btn.classList.add('wrong');$('feedback').textContent='جرّبي مرة ثانية... شخص مرّ بتجربة تشبهك ويسمعك.';tone(220,.12)}});
function resetQuestion(){document.querySelectorAll('[data-answer]').forEach(b=>{b.disabled=false;b.classList.remove('correct','wrong')});$('feedback').textContent='اختاري الإجابة المناسبة'}
$('restart').onclick=$('again').onclick=()=>{resetQuestion();transition('map',start)};
$('sound').onclick=()=>{state.muted=!state.muted;$('sound').textContent=state.muted?'الصوت: مغلق':'الصوت: يعمل';$('sound').setAttribute('aria-label',state.muted?'تشغيل الصوت':'إيقاف الصوت');tone()};
const door={x:480,y:465},seat={x:741,y:564};function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function act(){if(state.transitioning)return;if(state.scene==='entrance'&&state.questionAnswered&&$('question').classList.contains('hidden')){if(distance(state.hero,door)<105){transition('hall',()=>{state.hero={x:150,y:650};toast('امشي للكرسي المشمشي واجلسي',4)})}else{state.target={...door};toast('اتجهي إلى الباب')}}else if(state.scene==='hall'){if(distance(state.hero,seat)<100){scene('conversation');state.hero={...seat};state.sequence=0;tone(520)}else{state.target={...seat};toast('اقتربي من الكرسي المشمشي')}}}
$('action').onclick=act;
window.addEventListener('keydown',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','e',' '].includes(key)){e.preventDefault();if(key==='e'||key===' '){if(!e.repeat)act()}else{keys.add(key);state.target=null}}});window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',()=>keys.clear());
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);state.target=null});for(const n of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(n,()=>keys.delete(b.dataset.key))});
canvas.addEventListener('pointerdown',e=>{if(!['entrance','hall'].includes(state.scene)||state.transitioning||!$('question').classList.contains('hidden'))return;const r=canvas.getBoundingClientRect();state.target={x:clamp((e.clientX-r.left)/r.width*W,100,1180),y:clamp((e.clientY-r.top)/r.height*H,state.scene==='hall'?560:465,675)}});
function sprite(name,x,y,h,alpha=1){const im=images[name];if(!im)return;ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#17273144';ctx.beginPath();ctx.ellipse(x,y,h*.14,5,0,0,Math.PI*2);ctx.fill();const w=im.width/im.height*h;ctx.drawImage(im,Math.round(x-w/2),Math.round(y-h),Math.round(w),Math.round(h));ctx.restore()}
function background(im){ctx.drawImage(im,0,0,W,H)}
function player(back=false){const h=state.scene==='entrance'?lerp(110,177,clamp((state.hero.y-465)/186,0,1)):200;const id=state.moving?(back?`back_${Math.floor(state.time*7)%4}`:`hero_${Math.floor(state.time*10)%8}`):'hero_idle';sprite(id,state.hero.x,state.hero.y,h)}
function bubble(who,text){visible('dialogue',true);$('speaker').textContent=who;$('dialogueText').textContent=text}
function update(dt){const elapsed=state.time-state.sceneTime;if(state.scene==='entrance'){if(!state.questionAnswered&&elapsed>.85)visible('question',true);if(state.questionAnswered&&state.time-state.answerAt>1.1&&!$('question').classList.contains('hidden')){visible('question',false);toast('تفضّلي... امشي إلى باب الكلية',4)}}
 const canMove=['entrance','hall'].includes(state.scene)&&$('question').classList.contains('hidden')&&!state.transitioning;state.moving=false;
 if(canMove){let dx=(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0),dy=(keys.has('ArrowDown')||keys.has('s')?1:0)-(keys.has('ArrowUp')||keys.has('w')?1:0);if(!dx&&!dy&&state.target){dx=state.target.x-state.hero.x;dy=state.target.y-state.hero.y;if(Math.hypot(dx,dy)<5){state.target=null;dx=dy=0}}const l=Math.hypot(dx,dy);if(l>0){const step=Math.min(180*dt,l>2?l:180*dt);state.hero.x=clamp(state.hero.x+dx/l*step,100,1180);state.hero.y=clamp(state.hero.y+dy/l*step,state.scene==='hall'?560:465,675);state.moving=true}if(state.scene==='entrance'){$('action').textContent=distance(state.hero,door)<105?'دخول الكلية · E':'اذهبي إلى الباب';if(state.questionAnswered&&distance(state.hero,door)<30)act()}else $('action').textContent=distance(state.hero,seat)<100?'اجلسي · E':'اذهبي إلى الكرسي'}
 if(state.scene==='conversation'){state.lit=ease((elapsed-5)/1.5);if(elapsed<4.5){visible('dialogue',false)}else if(elapsed<8.2){bubble('المتطوعة','خذي راحتك... أنا أسمعك.');if(state.sequence===0){state.sequence=1;chime()}}else if(elapsed<11.5){bubble('أنتِ','شكراً إنك هنا.')}else if(elapsed<14){visible('dialogue',false)}else transition('ending')}
 if(state.time>toastUntil)visible('toast',false)
}
function draw(){ctx.imageSmoothingEnabled=false;ctx.fillStyle='#243642';ctx.fillRect(0,0,W,H);if(state.scene==='loading')return;
 if(state.scene==='map'){const im=images.campus_map;const h=im.height/im.width*W;ctx.drawImage(im,0,145,W,h);return}
 if(state.scene==='entrance'){background(images.college_entrance);player(state.moving);return}
 background(images.booth_off);
 // Place the exact supplied brand asset and legible Arabic on the backdrop.
 const drawBrand=()=>{const im=images.logo;ctx.drawImage(im,69,76,1835,546,754,236,132,132*546/1835);ctx.textAlign='center';ctx.direction='rtl';ctx.fillStyle='#593b31';ctx.font='16px Arabic';ctx.fillText('لأن بعض الرحلات تصبح أخف',820,305);ctx.fillText('حين لا نخوضها وحدنا...',820,334)};
 if(['conversation','ending'].includes(state.scene)){ctx.save();ctx.globalAlpha=state.lit;ctx.drawImage(images.booth_on,0,0,W,H);ctx.restore();drawBrand();sprite('hero_seated',741,564,170);const t=state.scene==='ending'?Infinity:state.time-state.sceneTime;if(t<3.7){const u=ease(t/3.7);sprite(`volunteer_${Math.floor(state.time*10)%8}`,lerp(1350,901,u),lerp(640,564,u),lerp(225,200,u))}else sprite('volunteer_seated',901,564,170);}else{drawBrand();player(state.moving)}
}
let last=0;function loop(ms){const dt=Math.min((ms-last)/1000,.05);last=ms;state.time+=dt;update(dt);draw();requestAnimationFrame(loop)}
Promise.all(assets.map(name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[name]=im;resolve()};im.onerror=()=>reject(new Error(name));im.src=`assets/${name}.png`;}))).then(async()=>{await document.fonts.ready;visible('loader',false);start();requestAnimationFrame(loop)}).catch(e=>{$('loadingText').textContent=`تعذّر تحميل الصورة: ${e.message}. أعيدي تحميل الصفحة.`});
