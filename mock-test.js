import { ensurePyodide, runAllTestCases } from "./python-runner.js";
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const MCQS = [
    {q:'Which Python data type stores a whole number such as 12?',o:['float','int','str','bool'],a:1},
    {q:'What is printed by print(3 + 2 * 4)?',o:['20','14','11','24'],a:2},
    {q:'Which keyword is used to define a function in Python?',o:['func','function','define','def'],a:3},
    {q:'What is the result of len("code")?',o:['3','4','5','An error'],a:1},
    {q:'Which operator checks whether two values are equal?',o:['=','!=','==','>='],a:2}
  ];
  const CODING = [
    {title:'Coding 1 · Even or Odd',marks:5,description:'Read one integer from standard input. Print Even if the number is even; otherwise print Odd.',starter:'n = int(input())\n# Write your solution below\n',tests:[['8','Even'],['5','Odd'],['0','Even'],['-3','Odd']]},
    {title:'Coding 2 · Sum of Two Numbers',marks:5,description:'Read two integers separated by whitespace (for example, 4 7). Print their sum.',starter:'# Read two integers and print their sum\n',tests:[['4 7','11'],['-2 9','7'],['0 0','0'],['125 75','200']]}
  ];
  let answers = Array(7).fill(null), codes = [CODING[0].starter, CODING[1].starter], current = 0, started = false, finished = false, violations = 0, seconds = 1200, timer = null, editors = {}, lastViolationAt = 0;
  const violationModal = new bootstrap.Modal($('violationModal'));
  const submitModal = new bootstrap.Modal($('submitModal'));
  const resultModal = new bootstrap.Modal($('resultModal'));
  const questionInfo = i => i < 5 ? {title:`MCQ ${i+1} · Python Basics`,marks:1} : CODING[i-5];
  function renderNav() {
    $('questionNav').innerHTML = '';
    for (let i=0;i<7;i++) {
      const b=document.createElement('button'); b.type='button'; b.className='mock-nav-btn'+(answers[i]!==null?' answered':'')+(current===i?' active':'');
      b.textContent=String(i+1); b.setAttribute('aria-label',`Question ${i+1}${answers[i]!==null?', answered':', not answered'}`); b.addEventListener('click',()=>showQuestion(i)); $('questionNav').appendChild(b);
    }
  }
  function saveEditor() { const ed=editors[current]; if(ed) codes[current-5]=ed.getValue(); }
  function showQuestion(i) {
    if(finished)return; saveEditor(); current=Math.max(0,Math.min(6,i)); const info=questionInfo(current), card=$('questionCard');
    if(current<5){
      const q=MCQS[current]; card.innerHTML=`<div class="d-flex flex-wrap justify-content-between gap-2 mb-3"><span class="badge" style="background:#28203f;color:#c4b5fd">SECTION A · MCQ</span><span class="small mock-muted">1 mark</span></div><h1 class="h4 fw-bold mb-3">Question ${current+1} of 7</h1><p class="fs-5">${q.q}</p><div id="optionsWrap"></div><p class="small mock-muted mt-3 mb-0">Select one option. Your choice is saved as you move between questions.</p>`;
      const wrap=$('optionsWrap'); q.o.forEach((option,j)=>{const b=document.createElement('button');b.type='button';b.className='mock-option';b.setAttribute('aria-pressed',String(answers[current]===j));b.textContent=String.fromCharCode(65+j)+'. '+option;b.addEventListener('click',()=>{answers[current]=j;renderNav();showQuestion(current);});wrap.appendChild(b);});
    } else {
      const q=CODING[current-5]; card.innerHTML=`<div class="d-flex flex-wrap justify-content-between gap-2 mb-3"><span class="badge" style="background:#12323a;color:#a5f3fc">SECTION B · CODING</span><span class="small mock-muted">${q.marks} marks</span></div><h1 class="h4 fw-bold mb-3">${q.title}</h1><p>${q.description}</p><div class="alert alert-secondary py-2 small">Input is provided through standard input. Print only the requested output.</div><label for="codeEditor${current}" class="form-label">Python solution</label><textarea id="codeEditor${current}" class="form-control mock-code" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea><div class="d-flex flex-wrap align-items-center gap-2 mt-3"><button id="runCodeBtn" type="button" class="btn btn-info"><i class="bi bi-play-fill me-1"></i>Run &amp; Check</button><span id="runStatus" class="small mock-muted" role="status" aria-live="polite">Run your code to test sample cases.</span></div><label class="form-label mt-3" for="codingOutput">Sample test results</label><pre id="codingOutput" class="mock-output" tabindex="0">No run yet.</pre>`;
      const textarea=$(`codeEditor${current}`); textarea.value=codes[current-5];
      if(window.CodeMirror){editors[current]=CodeMirror.fromTextArea(textarea,{mode:'python',theme:'dracula',lineNumbers:true,indentUnit:4,tabSize:4,matchBrackets:true});editors[current].setSize(null,230);editors[current].on('change',ed=>{codes[current-5]=ed.getValue();answers[current]=null;renderNav();});}
      $('runCodeBtn').addEventListener('click',async()=>{saveEditor();$('runCodeBtn').disabled=true;$('runStatus').textContent='Loading Python and running tests…';$('codingOutput').textContent='';try{const result=await testCode(codes[current-5],q);$('codingOutput').textContent=result.lines.join('\n');$('runStatus').textContent=`Sample run complete: ${result.passed}/${q.tests.length} tests passed. Final marks are calculated on submission.`;}catch(err){$('codingOutput').textContent=String(err.message||err);$('runStatus').textContent='Could not run the code. Check syntax and try again.';}finally{$('runCodeBtn').disabled=false;}});
    }
    $('prevBtn').disabled=current===0; $('nextBtn').textContent=current===6?'Review & submit →':'Next question →'; renderNav();
  }
  async function testCode(code,q){
    const py=await ensurePyodide();
    const testCases=q.tests.map(([input,expectedOutput])=>({input,expectedOutput}));
    const results=await runAllTestCases(py,code,testCases,5000);
    const passed=results.filter(r=>r.passed).length;
    const lines=results.map((r,i)=>`Test ${i+1}: ${r.passed?'PASS':'FAIL'} · ${r.executionStatus} · expected ${JSON.stringify(r.expectedOutput)} · got ${JSON.stringify(r.actualOutput)}${r.errorMessage?' · '+r.errorMessage:''}`);
    if(results.length<testCases.length) lines.push(`Stopped after ${results[results.length-1]?.executionStatus||'an execution error'}.`);
    return {passed,lines};
  }
  function tick(){if(finished)return;seconds--;if(seconds<0)seconds=0;const m=String(Math.floor(seconds/60)).padStart(2,'0'),s=String(seconds%60).padStart(2,'0');$('timerDisplay').textContent=`${m}:${s}`;$('timeProgress').style.width=`${seconds/1200*100}%`;if(seconds<=60)$('timerDisplay').style.color='#fca5a5';if(seconds===0)submitTest('Time limit reached.',true);}
  async function startTest(){try{await document.documentElement.requestFullscreen();}catch(e){alert('Fullscreen is required for this mock test. Please allow fullscreen in your browser and try again.');return;} $('introScreen').classList.add('d-none');$('mockExam').classList.remove('d-none');started=true;document.body.classList.add('mock-lock');showQuestion(0);timer=setInterval(tick,1000);}
  function recordViolation(reason){if(!started||finished||Date.now()-lastViolationAt<1400)return;lastViolationAt=Date.now();violations++;$('violationCount').textContent=violations;$('violationModalCount').textContent=violations;$('violationMessage').textContent=reason;$('returnFullscreenBtn').textContent=violations>=2?'Submit test':'Return to fullscreen';if(violations>=2){violationModal.show();setTimeout(()=>{violationModal.hide();submitTest('Automatically submitted after 2 exam violations.',true);},900);}else violationModal.show();}
  document.addEventListener('fullscreenchange',()=>{if(started&&!finished&&!document.fullscreenElement)recordViolation('Fullscreen was exited. Please return to fullscreen.');});
  document.addEventListener('visibilitychange',()=>{if(started&&!finished&&document.hidden)recordViolation('You switched away from the test tab. Return to the test.');});
  $('returnFullscreenBtn').addEventListener('click',async()=>{violationModal.hide();if(violations>=2){submitTest('Automatically submitted after 2 exam violations.',true);return;}try{await document.documentElement.requestFullscreen();}catch(e){/* The learner can use the browser fullscreen control. */}});
  $('startMockBtn').addEventListener('click',startTest);$('prevBtn').addEventListener('click',()=>showQuestion(current-1));$('nextBtn').addEventListener('click',()=>{if(current<6)showQuestion(current+1);else submitModal.show();});$('submitBtn').addEventListener('click',()=>submitModal.show());$('confirmSubmitBtn').addEventListener('click',()=>{submitModal.hide();submitTest('You submitted the mock test.',false);});$('retryBtn').addEventListener('click',()=>location.reload());
  async function submitTest(reason,automatic){if(finished)return;finished=true;started=false;if(timer)clearInterval(timer);saveEditor();document.removeEventListener('visibilitychange',()=>{});try{if(document.fullscreenElement)await document.exitFullscreen();}catch(e){}$('resultReason').textContent=reason;let mcqScore=0,codingScore=0;for(let i=0;i<5;i++)if(answers[i]===MCQS[i].a)mcqScore++;let codingRows=[];for(let i=0;i<2;i++){let passed=0;try{const r=await testCode(codes[i],CODING[i]);passed=r.passed;}catch(e){}const marks=Math.round((passed/CODING[i].tests.length)*5);codingScore+=marks;codingRows.push(`${CODING[i].title}: ${passed}/${CODING[i].tests.length} test cases · ${marks}/5 marks`);}const total=mcqScore+codingScore;$('resultScore').textContent=total;$('resultPercent').textContent=`${Math.round(total/15*100)}% · ${total>=6?'Pass (40% threshold)':'Keep practising'}`;$('resultDetails').innerHTML=`<p>MCQs: <strong>${mcqScore}/5</strong></p><p>Coding: <strong>${codingScore}/10</strong></p><p>${codingRows.join('<br>')}</p><p>Violations recorded: <strong>${violations}/2</strong></p>`;resultModal.show();}
  // Prevent accidental context-menu/copy shortcuts while the timed test is active, mirroring the main exam UI.
  document.addEventListener('contextmenu',e=>{if(started)e.preventDefault();});document.addEventListener('copy',e=>{if(started)e.preventDefault();});document.addEventListener('cut',e=>{if(started)e.preventDefault();});document.addEventListener('paste',e=>{if(started)e.preventDefault();});document.addEventListener('keydown',e=>{if(started&&(e.ctrlKey||e.metaKey)&&['c','x','v'].includes(e.key.toLowerCase()))e.preventDefault();});
})();
