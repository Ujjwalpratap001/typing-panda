import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { auth, db, firebaseConfigured, signInWithGoogle, signOutUser } from './firebase';
import { Activity, ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Clock3, Crown, GraduationCap, Keyboard, LogIn, RotateCcw, Settings2, Trophy, UserRound, X, Zap } from 'lucide-react';

type Result = { wpm: number; accuracy: number; correct: number; errors: number; seconds: number; consistency?: number; createdAt?: unknown };
type Mode = 'time' | 'words' | 'quote' | 'zen' | 'custom';
type Lesson = { id: number; level: string; title: string; description: string; keys: string; text: string };
const DURATIONS = [15, 30, 60, 120];
const WORD_COUNTS = [10, 25, 50, 100];
const WORDS = 'the quick brown fox jumps over the lazy dog and every small step makes a little progress when you practice with patience your fingers learn the rhythm of each sentence typing is a skill that grows stronger one focused minute at a time stay curious keep moving and find your flow create build learn grow focus rhythm gentle steady bright simple'.split(' ');
const QUOTES = [
  'Great things are done by a series of small things brought together.',
  'It always seems impossible until it is done.',
  'The secret of getting ahead is getting started.',
  'Believe you can and you are halfway there.',
  'Small daily improvements are the key to staggering long term results.'
];
const LESSONS: Lesson[] = [
  {id:1,level:'Beginner',title:'Home row basics',description:'Find your home keys: ASDF and JKL;',keys:'ASDF JKL;',text:'asdf jkl; asdf jkl; fj fj dk dk sl sl a; a; f; f; j; j; d; d; k; k; s; s; l; l;'},
  {id:2,level:'Beginner',title:'Reach for the top row',description:'Move gently to QWERTY and return home',keys:'QWERTY UIOP',text:'qwer uiop ty ty we we ru ru io io qp qp type write quiet power'},
  {id:3,level:'Beginner',title:'Bottom row flow',description:'Build confidence with ZXCV and NM',keys:'ZXCV BNM',text:'zxcv bnm zxcv bnm move back come near very nice brave calm'},
  {id:4,level:'Intermediate',title:'Common words',description:'Practice everyday words without looking down',keys:'THE AND YOU',text:'the and you that was for with this have from they will each make like time just know take'},
  {id:5,level:'Intermediate',title:'Capital letters',description:'Use Shift with the opposite hand',keys:'SHIFT + LETTERS',text:'Typing Faster Starts With Good Habits. Practice Makes Progress Every Day.'},
  {id:6,level:'Intermediate',title:'Punctuation practice',description:'Add commas, full stops and question marks',keys:', . ? !',text:'Hello, how are you? I am learning to type faster. Great work! Keep going.'},
  {id:7,level:'Advanced',title:'Numbers and symbols',description:'Reach the number row and symbols',keys:'1234567890',text:'2026 brings 365 new chances to learn, build, explore, and improve by 1% each day.'},
  {id:8,level:'Advanced',title:'Long-form accuracy',description:'Stay relaxed through longer sentences',keys:'FULL KEYBOARD',text:'Consistency is not about being perfect every time; it is about showing up, staying curious, and improving one thoughtful keystroke at a time.'}
];
function makeWords(seed:number,count=90){const out:string[]=[];for(let i=0;i<count;i++)out.push(WORDS[(i*7+seed*11+Math.floor(i/WORDS.length))%WORDS.length]);return out.join(' ');}
function shuffleQuote(){return QUOTES[Math.floor(Math.random()*QUOTES.length)];}

export default function App(){
 const [user,setUser]=useState<User|null>(null);
 const [section,setSection]=useState<'practice'|'learn'>('practice');
 const [mode,setMode]=useState<Mode>('time');
 const [duration,setDuration]=useState(30);
 const [wordCount,setWordCount]=useState(25);
 const [customText,setCustomText]=useState('Typing is a skill that grows stronger with practice.');
 const [text,setText]=useState(()=>makeWords(1));
 const [typed,setTyped]=useState('');
 const [remaining,setRemaining]=useState(30);
 const [started,setStarted]=useState(false);
 const [finished,setFinished]=useState(false);
 const [paused,setPaused]=useState(false);
 const [results,setResults]=useState<Result[]>([]);
 const [best,setBest]=useState(0);
 const [showSettings,setShowSettings]=useState(false);
 const [showProfile,setShowProfile]=useState(false);
 const [notice,setNotice]=useState('');
 const [leaderboard,setLeaderboard]=useState<{name:string;wpm:number;accuracy:number}[]>([]);
 const [lessonIndex,setLessonIndex]=useState(0);
 const [lessonText,setLessonText]=useState(LESSONS[0].text);
 const [lessonTyped,setLessonTyped]=useState('');
 const [lessonDone,setLessonDone]=useState<number[]>([]);
 const [sound,setSound]=useState(false);
 const [showKeyboard,setShowKeyboard]=useState(true);
 const inputRef=useRef<HTMLTextAreaElement>(null);
 const learnInputRef=useRef<HTMLTextAreaElement>(null);
 const startedAt=useRef<number|null>(null);
 const pausedAt=useRef<number|null>(null);
 const pausedTotal=useRef(0);
 const finishedRef=useRef(false);
 const historyRef=useRef<number[]>([]);

 useEffect(()=>{const saved=localStorage.getItem('tp-results');if(saved){try{const parsed:Result[]=JSON.parse(saved);setResults(parsed);setBest(Math.max(0,...parsed.map(r=>r.wpm)));}catch{}}
 const lessons=localStorage.getItem('tp-lessons');if(lessons){try{setLessonDone(JSON.parse(lessons));}catch{}}
 if(!auth)return;return onAuthStateChanged(auth,setUser);},[]);
 useEffect(()=>{if(!user||!db)return;const load=async()=>{try{const q=query(collection(db,'typingResults'),orderBy('wpm','desc'),limit(10));const snap=await getDocs(q);setLeaderboard(snap.docs.map(d=>({name:String(d.data().displayName||'Panda player'),wpm:Number(d.data().wpm||0),accuracy:Number(d.data().accuracy||0)})));}catch{}};void load();},[user]);
 useEffect(()=>{if(!started||finished||paused)return;const id=window.setInterval(()=>{if(startedAt.current===null)return;if(mode==='time'){const elapsed=(Date.now()-startedAt.current-pausedTotal.current)/1000;const next=Math.max(0,duration-elapsed);setRemaining(next);if(next<=0)void completeTest();}else{setRemaining(v=>v===duration?duration-0.001:duration);}},250);return()=>window.clearInterval(id);},[started,finished,paused,duration,typed,mode]);
 const elapsed=mode==='time'?Math.max(0,duration-remaining):started&&startedAt.current!==null?Math.max(0,(Date.now()-startedAt.current-pausedTotal.current)/1000):0;
 const correctChars=useMemo(()=>typed.split('').filter((c,i)=>c===text[i]).length,[typed,text]);
 const errors=useMemo(()=>typed.split('').filter((c,i)=>c!==text[i]).length,[typed,text]);
 const liveWpm=elapsed>0?Math.round(correctChars/5/(elapsed/60)):0;
 const accuracy=typed.length?Math.round(correctChars/typed.length*100):100;
 const consistency=historyRef.current.length>1?Math.max(0,100-Math.round(Math.sqrt(historyRef.current.reduce((s,n)=>s+n*n,0)/historyRef.current.length))):100;
 const activeLesson=LESSONS[lessonIndex];
 const lessonAccuracy=lessonTyped.length?Math.round(lessonTyped.split('').filter((c,i)=>c===lessonText[i]).length/lessonTyped.length*100):100;
 function makeTestText(nextMode:Mode){if(nextMode==='quote')return shuffleQuote();if(nextMode==='zen')return makeWords(Math.floor(Math.random()*20),250);if(nextMode==='custom')return customText.trim()||'Type your own custom text here.';if(nextMode==='words')return makeWords(Math.floor(Math.random()*20),Math.max(wordCount,10));return makeWords(Math.floor(Math.random()*20),100);}
 function resetTest(nextText?:string){setTyped('');setStarted(false);setFinished(false);setPaused(false);finishedRef.current=false;startedAt.current=null;pausedAt.current=null;pausedTotal.current=0;historyRef.current=[];setRemaining(duration);if(nextText)setText(nextText);window.setTimeout(()=>inputRef.current?.focus(),40);}
 function changeMode(next:Mode){setMode(next);resetTest(makeTestText(next));}
 async function completeTest(){if(finishedRef.current)return;finishedRef.current=true;const actualSeconds=Math.max(1,(Date.now()-(startedAt.current??Date.now())-pausedTotal.current)/1000);const seconds=mode==='time'?Math.min(duration,actualSeconds):actualSeconds;const correct=typed.split('').filter((c,i)=>c===text[i]).length;const errorCount=typed.split('').filter((c,i)=>c!==text[i]).length;const wpm=Math.round(correct/5/(seconds/60));const acc=typed.length?Math.round(correct/typed.length*100):100;const result:Result={wpm,accuracy:acc,correct,errors:errorCount,seconds:Math.round(seconds),consistency,createdAt:new Date().toISOString()};setFinished(true);setStarted(false);setPaused(false);setRemaining(0);setResults(prev=>{const next=[result,...prev].slice(0,100);localStorage.setItem('tp-results',JSON.stringify(next));return next;});setBest(prev=>Math.max(prev,wpm));if(user&&db){try{await addDoc(collection(db,'typingResults'),{uid:user.uid,displayName:user.displayName||'Panda player',wpm,accuracy:acc,correct,errors:errorCount,seconds:Math.round(seconds),mode,createdAt:serverTimestamp(),dayKey:new Date().toISOString().slice(0,10)});setNotice('Your result is synced to your account.');}catch{setNotice('Result saved on this device. Check Firestore rules to sync online.');}}else setNotice('Nice run! Sign in with Google to sync your results across devices.');}
 function handleTyping(value:string){if(finished||paused)return;if(!started&&value.length){setStarted(true);startedAt.current=Date.now();}const delta=value.length-typed.length;if(delta>0){const last=value.slice(-delta);for(const c of last)historyRef.current.push(c===text[value.indexOf(c)]?0:1);}setTyped(value);if(mode==='words'&&value.trim().split(/\s+/).filter(Boolean).length>=wordCount)window.setTimeout(()=>void completeTest(),0);else if(value.length>=text.length)window.setTimeout(()=>void completeTest(),0);}
 function togglePause(){if(!started||finished)return;if(!paused){pausedAt.current=Date.now();setPaused(true);}else{if(pausedAt.current)pausedTotal.current+=Date.now()-pausedAt.current;pausedAt.current=null;setPaused(false);inputRef.current?.focus();}}
 function handleKeys(e:KeyboardEvent<HTMLTextAreaElement>){if(e.key==='Tab'){e.preventDefault();resetTest(makeTestText(mode));}if(e.key==='Escape'){e.preventDefault();togglePause();}}
 async function handleLogin(){try{await signInWithGoogle();setNotice('Signed in successfully.');}catch(err){setNotice(err instanceof Error?err.message:'Sign-in was unsuccessful.');}}
 function startLesson(){setLessonTyped('');setLessonText(activeLesson.text);window.setTimeout(()=>learnInputRef.current?.focus(),30);}
 function handleLesson(value:string){setLessonTyped(value);if(value.length>=lessonText.length){setLessonDone(prev=>{const next=Array.from(new Set([...prev,activeLesson.id]));localStorage.setItem('tp-lessons',JSON.stringify(next));return next;});setNotice('Lesson completed! Great progress.');}}
 const displayed=useMemo(()=>text.split('').map((c,i)=>{let cls='letter';if(i<typed.length)cls+=typed[i]===c?' is-correct':' is-error';if(i===typed.length)cls+=' is-current';return <span className={cls} key={i}>{c}</span>;}),[text,typed]);
 const lessonDisplay=useMemo(()=>lessonText.split('').map((c,i)=>{let cls='letter';if(i<lessonTyped.length)cls+=lessonTyped[i]===c?' is-correct':' is-error';if(i===lessonTyped.length)cls+=' is-current';return <span className={cls} key={i}>{c}</span>;}),[lessonText,lessonTyped]);
 const keyboardRows=['qwertyuiop','asdfghjkl','zxcvbnm'];
 const currentKey=section==='practice'?text[typed.length]?.toLowerCase():lessonText[lessonTyped.length]?.toLowerCase();
 return <div className={'app-shell '+(section==='learn'?'learn-theme':'practice-theme')}>
  <header className="topbar"><a className="brand" href="#top" onClick={()=>setSection('practice')}><span className="brand-icon">🐼</span><span>typing<span className="brand-accent">panda</span></span></a>
   <nav className="main-nav"><button className={section==='practice'?'nav-active':''} onClick={()=>setSection('practice')}><Keyboard size={15}/> Practice</button><button className={section==='learn'?'nav-active':''} onClick={()=>setSection('learn')}><GraduationCap size={15}/> Learn</button><a href="#leaderboard">Leaderboard</a><a href="#progress">Progress</a></nav>
   <div className="top-actions"><button className="icon-btn" aria-label="Preferences" onClick={()=>setShowSettings(!showSettings)}><Settings2 size={18}/></button>{user?<button className="user-pill" onClick={()=>setShowProfile(!showProfile)}><span className="avatar">{user.displayName?.slice(0,1)||'P'}</span><span>{user.displayName?.split(' ')[0]||'Panda'}</span><ChevronDown size={14}/></button>:<button className="login-btn" onClick={handleLogin}><LogIn size={15}/> Sign in</button>}</div>
  </header>
  <main id="top">
   {section==='practice'?<section className="workspace">
    <div className="workspace-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR DAILY PRACTICE</div><h1>Practice<span>.</span></h1><p>Find your rhythm. Focus on accuracy. Let speed follow.</p></div><div className="session-chip"><span className="online-dot"/> {started?'SESSION IN PROGRESS':'READY WHEN YOU ARE'}</div></div>
    <div className="mode-toolbar"><div className="mode-tabs">{(['time','words','quote','zen','custom'] as Mode[]).map(m=><button key={m} className={mode===m?'selected':''} onClick={()=>changeMode(m)}>{m==='time'?<Clock3 size={14}/>:m==='words'?<Keyboard size={14}/>:m==='quote'?<BookOpen size={14}/>:m==='zen'?<Zap size={14}/>:<Settings2 size={14}/>} {m[0].toUpperCase()+m.slice(1)}</button>)}</div>
     {mode==='time'?<div className="option-tabs">{DURATIONS.map(n=><button key={n} className={duration===n?'active':''} onClick={()=>{setDuration(n);setRemaining(n);resetTest(makeTestText(mode));}}>{n}</button>)}</div>:mode==='words'?<div className="option-tabs">{WORD_COUNTS.map(n=><button key={n} className={wordCount===n?'active':''} onClick={()=>{setWordCount(n);resetTest(makeWords(Math.floor(Math.random()*20),n));}}>{n}</button>)}</div>:mode==='custom'?<div className="custom-entry"><input value={customText} onChange={e=>setCustomText(e.target.value)} aria-label="Custom typing text"/><button onClick={()=>resetTest(makeTestText('custom'))}>Apply</button></div>:<span className="mode-note">{mode==='quote'?'A thought worth typing':'No timer. Stay in your flow.'}</span>}
     <button className="restart-btn" onClick={()=>resetTest(makeTestText(mode))} aria-label="Restart"><RotateCcw size={16}/></button>
    </div>
    <div className="stats-row"><div><span>TIME LEFT</span><strong className={remaining<=5?'urgent':''}>{mode==='time'?Math.ceil(remaining)+'s':'∞'}</strong></div><div><span>WPM</span><strong>{liveWpm}</strong></div><div><span>ACCURACY</span><strong>{accuracy}%</strong></div><div><span>ERRORS</span><strong>{errors}</strong></div><div><span>CONSISTENCY</span><strong>{consistency}%</strong></div></div>
    {finished?<div className="result-panel"><div className="result-kicker">TEST COMPLETE · NICE WORK</div><h2>{results[0]?.wpm??liveWpm}<small> WPM</small></h2><p>{results[0]?.accuracy??accuracy}% accuracy · {results[0]?.errors??errors} errors · {results[0]?.consistency??consistency}% consistency</p><div className="result-actions"><button className="primary-btn" onClick={()=>resetTest(makeTestText(mode))}>Try again <RotateCcw size={15}/></button><button className="secondary-btn" onClick={handleLogin}>Sync progress <ArrowRight size={15}/></button></div></div>:<div className={'typing-panel '+(paused?'paused':'')} onClick={()=>inputRef.current?.focus()}><div className="typing-text" aria-label="Text to type">{displayed}</div>{paused&&<div className="pause-overlay">PAUSED <button onClick={togglePause}>Resume</button></div>}<textarea ref={inputRef} value={typed} onChange={e=>handleTyping(e.target.value)} onKeyDown={handleKeys} onPaste={e=>e.preventDefault()} spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off" aria-label="Typing input" placeholder="Start typing here…" disabled={paused}/><div className="typing-footer"><span><kbd>tab</kbd> restart <span>·</span> <kbd>esc</kbd> {started?'pause':'shortcuts'}</span><span>{typed.length} / {text.length} characters</span></div></div>}
    <div className="practice-bottom"><span><span className="online-dot"/> {started?'Keep your eyes on the text, not the keyboard.':'Click the text area or start typing to begin.'}</span><div><button onClick={togglePause} disabled={!started||finished}>{paused?'Resume':'Pause'}</button><button onClick={()=>resetTest(makeTestText(mode))}>New test <ArrowRight size={14}/></button></div></div>
   </section>:<section className="learn-workspace">
    <div className="workspace-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> BUILD YOUR FOUNDATION</div><h1>Learn<span>.</span></h1><p>Structured lessons, one comfortable keystroke at a time.</p></div><div className="lesson-progress-chip"><BookOpen size={16}/> {lessonDone.length} / {LESSONS.length} lessons complete</div></div>
    <div className="learn-layout"><aside className="lesson-sidebar"><div className="sidebar-title">YOUR CURRICULUM <span>{LESSONS.length} LESSONS</span></div>{(['Beginner','Intermediate','Advanced']).map(level=><div className="lesson-group" key={level}><h3>{level}</h3>{LESSONS.filter(l=>l.level===level).map(lesson=><button key={lesson.id} className={'lesson-item '+(lesson.id===activeLesson.id?'chosen':'')} onClick={()=>{setLessonIndex(lesson.id-1);setLessonText(lesson.text);setLessonTyped('');}}><span className="lesson-number">{lessonDone.includes(lesson.id)?<Check size={13}/>:String(lesson.id).padStart(2,'0')}</span><span><b>{lesson.title}</b><small>{lesson.description}</small></span></button>)}</div>)}</aside>
     <div className="lesson-main"><div className="lesson-heading"><div><span className="lesson-level">{activeLesson.level.toUpperCase()} · LESSON {String(activeLesson.id).padStart(2,'0')}</span><h2>{activeLesson.title}</h2><p>{activeLesson.description}</p></div><div className="lesson-completion">{lessonDone.includes(activeLesson.id)?<><Check size={15}/> Completed</>:'IN PROGRESS'}</div></div>
      <div className="finger-tip"><Keyboard size={17}/><span>Focus keys</span><b>{activeLesson.keys}</b></div>
      <div className="typing-panel lesson-typing" onClick={()=>learnInputRef.current?.focus()}><div className="typing-text">{lessonDisplay}</div><textarea ref={learnInputRef} value={lessonTyped} onChange={e=>handleLesson(e.target.value)} onPaste={e=>e.preventDefault()} spellCheck={false} aria-label="Lesson typing input" placeholder="Type the lesson text here…"/><div className="typing-footer"><span>Accuracy <b>{lessonAccuracy}%</b></span><span>{lessonTyped.length} / {lessonText.length} characters</span></div></div>
      <div className="keyboard-guide"><div className="keyboard-guide-heading"><span><Keyboard size={15}/> KEYBOARD GUIDE</span><button onClick={()=>setShowKeyboard(!showKeyboard)}>{showKeyboard?'Hide':'Show'}</button></div>{showKeyboard&&<div className="keyboard-keys">{keyboardRows.map((row,i)=><div className="key-row" key={row}>{row.split('').map(k=><span key={k} className={currentKey===k?'key-highlight':''}>{k}</span>)}</div>)}<div className="key-row space-row"><span>space</span></div><p>Keep both index fingers on F and J. Return to the home row after every reach.</p></div>}</div>
      <div className="lesson-actions"><button className="secondary-btn" onClick={startLesson}><RotateCcw size={14}/> Restart lesson</button><button className="primary-btn" onClick={()=>{const next=(lessonIndex+1)%LESSONS.length;setLessonIndex(next);setLessonText(LESSONS[next].text);setLessonTyped('');}}>{lessonIndex===LESSONS.length-1?'Start again':'Next lesson'} <ArrowRight size={15}/></button></div>
     </div></div>
   </section>}
   <section className="progress-strip" id="progress"><div className="progress-intro"><span className="progress-icon"><Activity size={20}/></span><div><b>Your progress</b><small>Every session adds up.</small></div></div><div className="progress-metric"><span>PERSONAL BEST</span><strong>{best}<small> WPM</small></strong></div><div className="progress-metric"><span>TESTS COMPLETED</span><strong>{results.length}</strong></div><div className="progress-metric"><span>AVG. ACCURACY</span><strong>{results.length?Math.round(results.reduce((s,r)=>s+r.accuracy,0)/results.length):0}<small>%</small></strong></div><div className="progress-metric"><span>LESSONS DONE</span><strong>{lessonDone.length}<small> / {LESSONS.length}</small></strong></div></section>
   <section className="community-section" id="leaderboard"><div className="community-heading"><div><span className="eyebrow"><span className="eyebrow-dot"/> THE COMMUNITY</span><h2>Friendly competition<span>.</span></h2></div><span className="leaderboard-label"><Crown size={15}/> ALL-TIME LEADERS</span></div><div className="leaderboard-list">{leaderboard.length?leaderboard.map((p,i)=><div className="leader-row" key={p.name+i}><span className={'rank rank-'+(i+1)}>{String(i+1).padStart(2,'0')}</span><span className="leader-avatar">{['🐼','🦊','🐨','🐸','🐯'][i%5]}</span><b>{p.name}</b><strong>{p.wpm}<small> WPM</small></strong><span className="leader-accuracy">{p.accuracy}% accuracy</span></div>):<div className="empty-board"><Trophy size={22}/><span>Leaderboard is waiting for its first champions. Sign in and complete a test to join.</span><button onClick={handleLogin}>Sign in <ArrowRight size={14}/></button></div>}</div></section>
  </main>
  <footer className="footer"><a className="brand" href="#top"><span className="brand-icon">🐼</span><span>typing<span className="brand-accent">panda</span></span></a><span>Practice with purpose. Progress at your pace.</span><div><a href="#progress">Your progress</a><a href="#leaderboard">Leaderboard</a><a href="https://github.com/Ujjwalpratap001/typing-panda" target="_blank" rel="noreferrer">GitHub</a></div></footer>
  {showSettings&&<div className="settings-popover"><div className="popover-heading"><b><Settings2 size={16}/> Preferences</b><button onClick={()=>setShowSettings(false)}><X size={15}/></button></div><label><span>Show keyboard guide in Learn</span><input type="checkbox" checked={showKeyboard} onChange={e=>setShowKeyboard(e.target.checked)}/></label><label><span>Sound feedback (coming soon)</span><input type="checkbox" checked={sound} onChange={e=>setSound(e.target.checked)} /></label><p>Use Tab to restart and Esc to pause a typing test.</p></div>}
  {showProfile&&<div className="modal-backdrop" onClick={()=>setShowProfile(false)}><div className="profile-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowProfile(false)}><X size={18}/></button><div className="profile-panda">🐼</div><h3>{user?'Welcome back, '+(user.displayName?.split(' ')[0]||'Panda'):'Your panda profile'}</h3><p>{user?user.email:'Sign in to sync your typing results across devices.'}</p><div className="profile-stats"><div><b>{best}</b><span>Best WPM</span></div><div><b>{results.length}</b><span>Tests</span></div><div><b>{lessonDone.length}</b><span>Lessons</span></div></div>{user?<button className="secondary-btn full-btn" onClick={async()=>{await signOutUser();setShowProfile(false);}}>Sign out</button>:<button className="primary-btn full-btn" onClick={handleLogin}><LogIn size={15}/> Continue with Google</button>}<small>{firebaseConfigured?'Connected with Firebase Authentication.':'Add your Firebase web configuration to enable Google sign-in.'}</small></div></div>}
  {notice&&<div className="toast"><span><Check size={15}/></span>{notice}<button onClick={()=>setNotice('')}><X size={14}/></button></div>}
 </div>;
}