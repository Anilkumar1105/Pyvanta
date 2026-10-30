import { requireRole, wireLogoutButtons } from "./auth.js";
import { db } from "./firebase-config.js";
import { invalidateCollection } from "./firestore-cache.js";
import { collection, doc, setDoc, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

wireLogoutButtons();
const $ = id => document.getElementById(id);
let pending = [];
const legacySheets = ["SQL_CONTENT","SQL_MCQ","SQL_QUERIES","SQL_SPECIAL","SQL_VISUALIZATIONS"];
const sharedSheets = ["MODULES","TOPICS","TOPIC_CONTENT","TOPIC_MCQ","PRACTICE_QUESTIONS"];
const headers = {
  MODULES:["subject","moduleId","title","description","order","phase","passMark","active"],
  TOPICS:["subject","moduleId","topicId","title","description","content","order","published"],
  TOPIC_CONTENT:["subject","moduleId","topicId","title","description","content","order","published"],
  TOPIC_MCQ:["subject","moduleId","topicId","id","questionText","OptionA","OptionB","OptionC","OptionD","correctOptionIndex","marks","explanation","difficulty","published"],
  PRACTICE_QUESTIONS:["subject","moduleId","topicId","id","title","description","language","starterCode","schemaSql","solution","examplesJson","visibleTestCasesJson","hiddenTestCasesJson","marks","difficulty","published"],
  SQL_CONTENT:["id","title","description","content","order","published"],
  SQL_MCQ:["id","questionText","OptionA","OptionB","OptionC","OptionD","correctOptionIndex","explanation","topic","difficulty","published"],
  SQL_QUERIES:["id","title","prompt","starter","solution","topic","difficulty","tables","order","published"],
  SQL_SPECIAL:["id","title","prompt","starter","solution","topic","difficulty","tables","order","published"],
  SQL_VISUALIZATIONS:["id","title","query","stepsJson","explanation","topic","published"]
};
const norm = v => String(v ?? "").toLowerCase().replace(/[^a-z0-9]/g,"");
const clean = row => Object.fromEntries(Object.entries(row).map(([k,v])=>[norm(k),v]));
const val = (r,...keys) => { for(const k of keys){const v=r[norm(k)];if(v!==undefined&&v!=="")return v;} return ""; };
const truth = v => v === "" || v === true || ["true","yes","1","published","active"].includes(String(v).trim().toLowerCase());
const slug = v => String(v||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80) || "item";
const subjectOf = r => String(val(r,"subject")||"SQL").trim().toUpperCase()==="PYTHON" ? "Python" : "SQL";
const levelIdOf = (subject,moduleId) => `${subject.toLowerCase()}-${slug(moduleId)}`;
function pushSet(path,id,data){ pending.push({kind:"set",path,id,data}); }
function pushAdd(path,data){ pending.push({kind:"add",path,data}); }

function parseWorkbook(wb){
  pending=[];
  const moduleMeta = new Map();
  const conceptMeta = new Map();
  const sheetsFound = wb.SheetNames.filter(n=>headers[n]);
  if(!sheetsFound.length) throw new Error("No supported sheets found. Download the Unified Learning Excel Template.");
  // First pass: module records (the legacy SQL workbook is treated as one module).
  if(wb.Sheets.MODULES){
    XLSX.utils.sheet_to_json(wb.Sheets.MODULES,{defval:""}).forEach((raw,i)=>{
      const r=clean(raw), subject=subjectOf(r), moduleId=String(val(r,"moduleId","id")||`${subject.toLowerCase()}-module-${i+1}`);
      const levelId=levelIdOf(subject,moduleId), data={subject,title:String(val(r,"title")||`Module ${i+1}`),description:String(val(r,"description")||""),order:Number(val(r,"order")||i+1),phase:String(val(r,"phase")||""),passMark:Number(val(r,"passMark")||40),active:truth(val(r,"active"))};
      moduleMeta.set(`${subject}:${moduleId}`,{levelId,...data});
      pushSet("learningLevels",levelId,{...data,conceptCount:0,updatedAt:serverTimestamp()});
    });
  }
  // Legacy SQL content becomes Module 1 with each row as a lesson/concept.
  const legacyContent=wb.Sheets.SQL_CONTENT ? XLSX.utils.sheet_to_json(wb.Sheets.SQL_CONTENT,{defval:""}) : [];
  if(legacyContent.length){
    const moduleId="module-1-database-fundamentals", key=`SQL:${moduleId}`, levelId=levelIdOf("SQL",moduleId);
    moduleMeta.set(key,{levelId,subject:"SQL",title:"Module 1 – Database Fundamentals",description:"Learn database fundamentals and SQLite concepts.",order:1,passMark:40,active:true});
    pushSet("learningLevels",levelId,{subject:"SQL",title:"Module 1 – Database Fundamentals",description:"Learn database fundamentals and SQLite concepts.",order:1,passMark:40,active:true,conceptCount:legacyContent.length,phase:"Modules 1–6",updatedAt:serverTimestamp()});
    legacyContent.forEach((raw,i)=>{
      const r=clean(raw), id=String(val(r,"id")||`sql-m1-topic-${i+1}`), conceptId=`sql-${slug(id)}`;
      const concept={levelId,title:String(val(r,"title")||`Topic ${i+1}`),description:String(val(r,"description")||""),content:String(val(r,"content")||""),order:Number(val(r,"order")||i+1),published:truth(val(r,"published")),subject:"SQL",createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
      conceptMeta.set(`SQL:${id}`,{conceptId,levelId,title:concept.title});
      pushSet("learningConcepts",conceptId,concept);
    });
  }
  // Shared topic sheets create the same learningLevels/learningConcepts records used by Python.
  for(const sheet of ["TOPICS","TOPIC_CONTENT"]){
    if(!wb.Sheets[sheet]) continue;
    XLSX.utils.sheet_to_json(wb.Sheets[sheet],{defval:""}).forEach((raw,i)=>{
      const r=clean(raw), subject=subjectOf(r), moduleId=String(val(r,"moduleId")||`${subject.toLowerCase()}-module-1`);
      const levelId=levelIdOf(subject,moduleId), module=moduleMeta.get(`${subject}:${moduleId}`);
      if(!module && !moduleMeta.has(`${subject}:${moduleId}`)) throw new Error(`${sheet} row ${i+2}: moduleId "${moduleId}" is missing from MODULES.`);
      const topicId=String(val(r,"topicId","id")||`${moduleId}-topic-${i+1}`), conceptId=`${subject.toLowerCase()}-${slug(moduleId)}-${slug(topicId)}`;
      const data={levelId,subject,title:String(val(r,"title")||`Topic ${i+1}`),description:String(val(r,"description")||""),content:String(val(r,"content")||""),order:Number(val(r,"order")||i+1),published:truth(val(r,"published")),updatedAt:serverTimestamp()};
      conceptMeta.set(`${subject}:${topicId}`,{conceptId,levelId,title:data.title});
      pushSet("learningConcepts",conceptId,data);
    });
  }
  // Topic MCQs use the standard Python learning MCQ collection, with subject retained.
  for(const sheet of ["TOPIC_MCQ","SQL_MCQ"]){
    if(!wb.Sheets[sheet]) continue;
    XLSX.utils.sheet_to_json(wb.Sheets[sheet],{defval:""}).forEach((raw,i)=>{
      const r=clean(raw), subject=sheet==="SQL_MCQ"?"SQL":subjectOf(r);
      let moduleId=String(val(r,"moduleId")||(subject==="SQL"?"module-1-database-fundamentals":""));
      if(!moduleId) throw new Error(`${sheet} row ${i+2}: moduleId is required.`);
      const levelId=levelIdOf(subject,moduleId), topic=String(val(r,"topicId","topic")||"");
      const matched=[...conceptMeta.entries()].find(([k,v])=>k===`${subject}:${topic}`||v.title.toLowerCase()===topic.toLowerCase());
      const options=["OptionA","OptionB","OptionC","OptionD"].map(k=>String(val(r,k)));
      const correct=Number(val(r,"correctOptionIndex"));
      if(!String(val(r,"questionText"))||options.some(x=>!x)||!Number.isInteger(correct)||correct<0||correct>3) throw new Error(`${sheet} row ${i+2}: question, four options and correctOptionIndex 0–3 are required.`);
      const id=String(val(r,"id")||`${subject.toLowerCase()}-${moduleId}-mcq-${i+1}`);
      pushSet("learningMcqQuestions",`${subject.toLowerCase()}-${slug(id)}`,{levelId,subject,conceptId:matched?.[1]?.conceptId||"",topicId:topic,questionText:String(val(r,"questionText")),options,correctOptionIndex:correct,marks:Number(val(r,"marks")||1),explanation:String(val(r,"explanation")||""),difficulty:String(val(r,"difficulty")||"Easy"),order:i+1,published:truth(val(r,"published")),updatedAt:serverTimestamp()});
    });
  }
  // Shared Python practice questions enter the existing coding practice bank.
  if(wb.Sheets.PRACTICE_QUESTIONS){
    XLSX.utils.sheet_to_json(wb.Sheets.PRACTICE_QUESTIONS,{defval:""}).forEach((raw,i)=>{
      const r=clean(raw), subject=subjectOf(r), moduleId=String(val(r,"moduleId")||"");
      if(!moduleId) throw new Error(`PRACTICE_QUESTIONS row ${i+2}: moduleId is required.`);
      const levelId=levelIdOf(subject,moduleId), language=String(val(r,"language")||(subject==="SQL"?"sql":"python")).toLowerCase();
      const item={levelId,subject,language,title:String(val(r,"title")),description:String(val(r,"description")||""),starterCode:String(val(r,"starterCode")||""),marks:Number(val(r,"marks")||1),difficulty:String(val(r,"difficulty")||"Medium"),published:truth(val(r,"published")),order:i+1};
      if(language==="sql"){
        item.prompt=item.description; item.solution=String(val(r,"solution")||""); item.schemaSql=String(val(r,"schemaSql")||"");
        item.tables=[]; try{item.visibleTestCases=JSON.parse(val(r,"visibleTestCasesJson")||"[]");item.hiddenTestCases=JSON.parse(val(r,"hiddenTestCasesJson")||"[]");}catch{throw new Error(`PRACTICE_QUESTIONS row ${i+2}: test case JSON is invalid.`);}
        pushSet("learningCodingQuestions",`sql-${slug(val(r,"id")||`${moduleId}-practice-${i+1}`)}`,{...item,subject:"SQL",language:"sql",topic:String(val(r,"topicId")||""),createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
      } else {
        let examples=[];let visibleTestCases=[];let hiddenTestCases=[];
        try{examples=JSON.parse(val(r,"examplesJson")||"[]");visibleTestCases=JSON.parse(val(r,"visibleTestCasesJson")||"[]");hiddenTestCases=JSON.parse(val(r,"hiddenTestCasesJson")||"[]");}catch{throw new Error(`PRACTICE_QUESTIONS row ${i+2}: examples/test case JSON is invalid.`);}
        pushSet("learningCodingQuestions",`python-${slug(val(r,"id")||`${moduleId}-practice-${i+1}`)}`,{...item,language:"python",examples,visibleTestCases,hiddenTestCases,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
      }
    });
  }
  // Legacy query/special banks remain in the SQL Lab while preserving their module/topic reference.
  for(const sheet of ["SQL_QUERIES","SQL_SPECIAL"]){
    if(!wb.Sheets[sheet]) continue;
    XLSX.utils.sheet_to_json(wb.Sheets[sheet],{defval:""}).forEach((raw,i)=>{
      const r=clean(raw), title=String(val(r,"title")), solution=String(val(r,"solution"));
      if(!title||!String(val(r,"prompt"))||!solution) throw new Error(`${sheet} row ${i+2}: title, prompt and solution are required.`);
      pushSet("sqlChallenges",`sql-${slug(val(r,"id")||`${sheet}-${title}`)}`,{title,prompt:String(val(r,"prompt")),starter:String(val(r,"starter")||"SELECT * FROM students;"),solution,topic:String(val(r,"topic")||""),difficulty:String(val(r,"difficulty")||"Easy"),tables:String(val(r,"tables")||"").split(",").map(x=>x.trim()).filter(Boolean),special:sheet==="SQL_SPECIAL",published:truth(val(r,"published")),order:Number(val(r,"order")||i+1),createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    });
  }
  // SQL visualization rows are stored in the shared visualization collection and tagged SQL.
  if(wb.Sheets.SQL_VISUALIZATIONS){
    XLSX.utils.sheet_to_json(wb.Sheets.SQL_VISUALIZATIONS,{defval:""}).forEach((raw,i)=>{
      const r=clean(raw);let steps=[];try{steps=JSON.parse(val(r,"stepsJson")||"[]");}catch{throw new Error(`SQL_VISUALIZATIONS row ${i+2}: stepsJson must be valid JSON.`);}
      const title=String(val(r,"title"));if(!title)throw new Error(`SQL_VISUALIZATIONS row ${i+2}: title is required.`);
      pushSet("codeVisualizations",`sql-${slug(val(r,"id")||title)}`,{subject:"SQL",title,topic:String(val(r,"topic")||"SQL"),difficulty:String(val(r,"difficulty")||"Beginner"),description:String(val(r,"explanation")||""),code:String(val(r,"query")||""),type:"sql",visualizationSteps:JSON.stringify(steps),published:truth(val(r,"published")),createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    });
  }
  // Update cached concept counts from this workbook for each touched module.
  const levelCounts={};
  pending.filter(x=>x.path==="learningConcepts").forEach(x=>{levelCounts[x.data.levelId]=(levelCounts[x.data.levelId]||0)+1;});
  Object.entries(levelCounts).forEach(([id,count])=>pushSet("learningLevels",id,{conceptCount:count,updatedAt:serverTimestamp()}));
  return {sheets:sheetsFound,rows:pending.length};
}
function template(){
  const wb=XLSX.utils.book_new();
  for(const [name,cols] of Object.entries(headers)){
    const ws=XLSX.utils.aoa_to_sheet([cols]);ws["!cols"]=cols.map(h=>({wch:Math.min(44,Math.max(15,h.length+3))}));
    XLSX.utils.book_append_sheet(wb,ws,name);
  }
  XLSX.writeFile(wb,"pyvanta-unified-learning-python-sql-template.xlsx");
}
$("templateBtn").addEventListener("click",template);
$("sqlFile").addEventListener("change",async e=>{
  pending=[];$("saveSqlImport").disabled=true;$("sqlImportPreview").innerHTML="";const file=e.target.files?.[0];if(!file)return;
  try{
    const wb=XLSX.read(await file.arrayBuffer(),{type:"array"}),summary=parseWorkbook(wb);
    $("sqlImportStatus").innerHTML=`<div class="alert alert-success">Validated ${summary.rows} records across ${summary.sheets.join(", ")}. Preview only — nothing has been saved yet.</div>`;
    const groups={};pending.forEach(x=>groups[x.path]=(groups[x.path]||0)+1);
    $("sqlImportPreview").innerHTML=`<div class="border rounded p-3"><strong>Import preview</strong><div class="small text-secondary mb-2">Python and SQL use the same learning collections. SQL query banks and visualizations retain their own execution data.</div><ul class="mb-0">${Object.entries(groups).map(([k,v])=>`<li><strong>${k}</strong>: ${v} record(s)</li>`).join("")}</ul></div>`;
    $("saveSqlImport").disabled=false;
  }catch(err){pending=[];$("sqlImportStatus").innerHTML=`<div class="alert alert-danger">${String(err.message||err)}</div>`;}
});
$("saveSqlImport").addEventListener("click",async()=>{
  const btn=$("saveSqlImport");btn.disabled=true;let done=0;
  try{
    for(const item of pending){
      const payload={...item.data,createdAt:item.data.createdAt||serverTimestamp(),updatedAt:serverTimestamp()};
      if(item.kind==="add") await addDoc(collection(db,item.path),payload);
      else await setDoc(doc(db,item.path,item.id),payload,{merge:true});
      done++;
    }
    ["learningLevels","learningConcepts","learningMcqQuestions","learningCodingQuestions","sqlChallenges","codeVisualizations"].forEach(invalidateCollection);
    $("sqlImportStatus").innerHTML=`<div class="alert alert-success">Imported ${done} records successfully. Python/SQL modules, topics and MCQs now use the shared Learning Hub. Refresh the student dashboard to see published modules.</div>`;
    pending=[];
  }catch(err){$("sqlImportStatus").innerHTML=`<div class="alert alert-warning">Saved ${done} records before stopping: ${String(err.message||err)}. Re-import is safe for records with IDs; check records without IDs before retrying.</div>`;}
  finally{btn.disabled=!pending.length;}
});
async function migratePreviouslyImportedSqlRows(){
  try{
    const [contentSnap,mcqSnap,visualSnap]=await Promise.all([
      getDocs(collection(db,"sqlContent")).catch(()=>({docs:[]})),
      getDocs(collection(db,"sqlMcqs")).catch(()=>({docs:[]})),
      getDocs(collection(db,"sqlVisualizations")).catch(()=>({docs:[]}))
    ]);
    if(!contentSnap.docs.length&&!mcqSnap.docs.length&&!visualSnap.docs.length)return;
    const levelId="sql-module-1-database-fundamentals";
    await setDoc(doc(db,"learningLevels",levelId),{
      subject:"SQL",title:"Module 1 – Database Fundamentals",
      description:"Learn database fundamentals and SQLite concepts.",
      order:1,phase:"Modules 1–6",passMark:40,active:true,
      conceptCount:contentSnap.docs.length,updatedAt:serverTimestamp()
    },{merge:true});
    const conceptsByTitle=new Map();
    for(let i=0;i<contentSnap.docs.length;i++){
      const snap=contentSnap.docs[i],row=snap.data(),conceptId=`sql-${slug(snap.id)}`;
      conceptsByTitle.set(String(row.title||"").trim().toLowerCase(),conceptId);
      await setDoc(doc(db,"learningConcepts",conceptId),{
        levelId,subject:"SQL",title:String(row.title||`Topic ${i+1}`),
        description:String(row.description||""),content:String(row.content||""),
        order:Number(row.order||i+1),published:row.published!==false,
        migratedFrom:"sqlContent",updatedAt:serverTimestamp()
      },{merge:true});
    }
    for(let i=0;i<mcqSnap.docs.length;i++){
      const snap=mcqSnap.docs[i],row=snap.data(),options=Array.isArray(row.options)?row.options:[row.OptionA,row.OptionB,row.OptionC,row.OptionD].filter(Boolean);
      if(!row.questionText||options.length<2)continue;
      const topic=String(row.topic||"").trim().toLowerCase();
      const conceptId=conceptsByTitle.get(topic)||"";
      await setDoc(doc(db,"learningMcqQuestions",`sql-${slug(snap.id)}`),{
        levelId,subject:"SQL",conceptId,topicId:row.topic||"",
        questionText:row.questionText,options,
        correctOptionIndex:Number(row.correctOptionIndex||0),
        marks:Number(row.marks||1),explanation:row.explanation||"",
        difficulty:row.difficulty||"Easy",order:Number(row.order||i+1),
        published:row.published!==false,migratedFrom:"sqlMcqs",
        updatedAt:serverTimestamp()
      },{merge:true});
    }
    for(const snap of visualSnap.docs){
      const row=snap.data();
      await setDoc(doc(db,"codeVisualizations",`sql-${slug(snap.id)}`),{
        subject:"SQL",title:row.title||"SQL visualization",topic:row.topic||"SQL",
        difficulty:row.difficulty||"Beginner",description:row.explanation||row.description||"",
        code:row.query||row.code||"",type:"sql",
        visualizationSteps:typeof row.steps==="string"?row.steps:JSON.stringify(row.steps||[]),
        published:row.published!==false,migratedFrom:"sqlVisualizations",
        updatedAt:serverTimestamp()
      },{merge:true});
    }
    ["learningLevels","learningConcepts","learningMcqQuestions","codeVisualizations"].forEach(invalidateCollection);
    $("sqlImportStatus").innerHTML=`<div class="alert alert-success">Found and connected your previously imported SQL content: ${contentSnap.docs.length} lessons, ${mcqSnap.docs.length} MCQs and ${visualSnap.docs.length} visualizations. They now use the shared Learning Hub collections.</div>`;
  }catch(error){
    console.warn("Previous SQL content migration did not complete:",error);
    $("sqlImportStatus").innerHTML=`<div class="alert alert-warning">Automatic connection of previously imported SQL content could not finish. You can re-import the workbook using the updated importer. Details: ${String(error.message||error)}</div>`;
  }
}
requireRole("admin",async()=>{
  await migratePreviouslyImportedSqlRows();
  const catalog=[
    {id:"sql_practice_mcq",title:"SQL Practice · MCQ",sqlExamType:"mcq",examType:"mcq",duration:15,totalMarks:10},
    {id:"sql_practice_query",title:"SQL Practice · Query",sqlExamType:"query",examType:"coding",duration:20,totalMarks:3},
    {id:"sql_practice_mixed",title:"SQL Practice · Mixed",sqlExamType:"mixed",examType:"mixed",duration:25,totalMarks:7}
  ];
  for(const item of catalog){const {id,...data}=item;await setDoc(doc(db,"exams",id),{...data,course:"SQL",subject:"SQL",isSqlPractice:true,description:"Timed SQL assessment from the SQL Learning Lab.",active:false,showResult:true,maxViolations:0,createdAt:serverTimestamp(),updatedAt:serverTimestamp()},{merge:true});}
  invalidateCollection("exams");
});
