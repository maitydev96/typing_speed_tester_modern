// Modern Typing Speed Tester
const sampleTexts = [
  "The sun rose gently over the quiet village. Birds sang in the trees, and a light breeze carried the scent of fresh flowers. Children played in the street while their parents greeted each other with warm smiles. It was a perfect morning to begin the day.",
  "In 2025, cities around the world are changing faster than ever before. Electric cars now line the streets, silent yet powerful. Solar panels decorate rooftops, and vertical gardens climb up tall glass buildings. At the heart of this transformation are engineers, designers, and dreamers who believe in a cleaner future. But progress comes with challenges — balancing technology, nature, and human connection will always be the true test of innovation.",
  "Opportunities are like sunrises,” said the old traveler, “if you wait too long, you’ll miss them.” His words echoed in my mind as I walked through the crowded market. Stalls overflowed with colorful fabrics, steaming food, and sparkling jewelry. Vendors shouted prices — 200 rupees for a scarf, 50 for a glass of lemonade — while children darted between the aisles. The air was a chaotic mix of laughter, music, and the sizzling sound of street food being prepared. Every sense was alive, and every moment felt like a story waiting to be told.",
  "Late one autumn evening, the train sped along the winding tracks, cutting through fields bathed in moonlight. Passengers sat in quiet compartments, some reading, some lost in thought. In the dining car, a man in a gray coat stirred his coffee slowly, as if waiting for something — or someone. Outside, distant mountains rose like dark silhouettes against the star-filled sky. A sudden gust rattled the windows, and a faint whistle echoed through the night. It was a moment of stillness wrapped in motion, where the past, present, and future seemed to share the same breath."
];

const elements = {
  textDisplay: document.getElementById('textDisplay'),
  inputArea: document.getElementById('inputArea'),
  startBtn: document.getElementById('startBtn'),
  restartBtn: document.getElementById('restartBtn'),
  time: document.getElementById('time'),
  wpm: document.getElementById('wpm'),
  accuracy: document.getElementById('accuracy'),
  best: document.getElementById('best'),
  sampleSelect: document.getElementById('sampleSelect'),
  mode: document.getElementById('mode')
};

let state = {
  elapsed: 0,
  duration: 60,
  running: false,
  timerId: null,
  target: '',
  startTime: null,
  typed: '',
  correctChars: 0
};

function init(){
  // populate samples
  sampleTexts.forEach((t,i)=>{
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Sample ${i+1}`;
    elements.sampleSelect.appendChild(opt);
  });
  elements.sampleSelect.selectedIndex = 0;
  loadBest();
  setSample(0);
  bind();
  updateStats();
}

function setSample(idx){
  state.target = sampleTexts[idx];
  renderTarget();
  resetInput();
}

function renderTarget(){
  elements.textDisplay.innerHTML = '';
  // create spans for each char for per-char highlighting
  for (let i=0;i<state.target.length;i++){
    const span = document.createElement('span');
    span.textContent = state.target[i];
    elements.textDisplay.appendChild(span);
  }
}

function resetInput(){
  state.typed = '';
  state.correctChars = 0;
  state.elapsed = 0;
  state.running = false;
  state.startTime = null;
  clearInterval(state.timerId);
  elements.inputArea.value = '';
  elements.inputArea.disabled = false;
  elements.time.textContent = state.duration + 's';
  updateStats();
  Array.from(elements.textDisplay.children).forEach(s=>{
    s.className = '';
  });
}

function bind(){
  elements.sampleSelect.addEventListener('change', e=>{
    setSample(parseInt(e.target.value));
  });
  elements.mode.addEventListener('change', e=>{
    state.duration = (e.target.value === 'time') ? 60 : 9999;
    elements.time.textContent = (state.duration===9999) ? '—' : (state.duration + 's');
    updateStats();
  });
  elements.startBtn.addEventListener('click', ()=>{
    startTest();
    elements.inputArea.focus();
  });
  elements.restartBtn.addEventListener('click', ()=>{
    setSample(elements.sampleSelect.selectedIndex);
    elements.inputArea.focus();
  });
  elements.inputArea.addEventListener('input', onInput);
  elements.inputArea.addEventListener('keydown', (e)=>{
    if(!state.running && e.key.length === 1){
      startTest();
    }
  });
}

function startTest(){
  if(state.running) return;
  state.running = true;
  state.startTime = Date.now();
  // if mode is full text, we don't count down
  if (state.duration !== 9999){
    state.elapsed = 0;
    state.timerId = setInterval(()=>{
      state.elapsed = Math.floor((Date.now() - state.startTime)/1000);
      const remain = Math.max(0, state.duration - state.elapsed);
      elements.time.textContent = remain + 's';
      if(remain <= 0){
        endTest();
      }
      updateStats();
    }, 250);
  } else {
    // update time display to elapsed
    state.timerId = setInterval(()=>{
      state.elapsed = Math.floor((Date.now() - state.startTime)/1000);
      elements.time.textContent = state.elapsed + 's';
      updateStats();
    }, 400);
  }
}

function endTest(){
  state.running = false;
  clearInterval(state.timerId);
  elements.inputArea.disabled = true;
  updateStats(true);
  saveBest();
}

function onInput(e){
  const value = e.target.value;
  state.typed = value;
  // compare char by char
  let correct = 0;
  const target = state.target;
  const spans = elements.textDisplay.children;
  for (let i=0;i<spans.length;i++){
    const ch = value[i];
    spans[i].className = '';
    if(ch == null) continue;
    if(ch === target[i]){
      spans[i].classList.add('correct');
      correct++;
    } else {
      spans[i].classList.add('incorrect');
    }
  }
  // if typed is longer than target, mark the extras as incorrect by creating spans
  if(value.length > target.length){
    // nothing visual in target, but counts as incorrect
  }
  state.correctChars = correct;
  // If user completed the full text in 'words' mode, stop
  if(elements.mode.value === 'words' && value.length >= target.length){
    endTest();
  }
  updateStats();
}

function updateStats(final=false){
  const minutes = Math.max( ( (state.elapsed||0) / 60 ), 1/60 ); // avoid divide by 0
  const grossWords = (state.typed.length) / 5;
  const wpm = Math.round((state.correctChars/5) / (minutes));
  const accuracy = state.typed.length === 0 ? 100 : Math.max(0, Math.round((state.correctChars / state.typed.length) * 100));
  elements.wpm.textContent = isFinite(wpm) ? wpm : 0;
  elements.accuracy.textContent = accuracy + '%';
  if(final) {
    // final results: show chars and percent
    // (already updated)
  }
}

function loadBest(){
  try{
    const b = localStorage.getItem('typing_best_wpm');
    elements.best.textContent = b ? b + ' WPM' : '—';
  }catch(e){}
}

function saveBest(){
  try{
    const cur = parseInt(elements.wpm.textContent) || 0;
    const b = parseInt(localStorage.getItem('typing_best_wpm') || '0');
    if(cur > b){
      localStorage.setItem('typing_best_wpm', String(cur));
      elements.best.textContent = cur + ' WPM';
      // small celebration animation
      elements.card = document.querySelector('.card');
      elements.card.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }], { duration: 700 });
    }
  }catch(e){}
}

// init
init();
