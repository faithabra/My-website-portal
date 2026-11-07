(function(){
var sb=window.TFES_SB,$=function(i){return document.getElementById(i)};
if(!sb||!$("dash"))return;
function say(t,ok){var m=$("msg");m.textContent=t;m.className="note "+(ok?"ok":"err");}
function el(t,x,c){var e=document.createElement(t);if(x!=null)e.textContent=x;if(c)e.className=c;return e;}
function btn(t,fn){var b=el("button",t,"btn sm ghost");b.type="button";b.addEventListener("click",fn);return b;}
var LV={beginner:"Beginner",elementary:"Elementary",intermediate:"Intermediate",advanced:"Advanced"};
var CRS={not_sure:"Course not chosen yet",oxford_phonics_world:"Oxford Phonics World",family_and_friends:"Family and Friends",everybody_up:"Everybody Up",free_conversation:"Free Conversation"};
var ctx,editing=null,sf=$("studform");
async function loadStudents(){
 var x=await sb.from("students").select("id,first_name,age,age_group,level,preferred_course,goals,preferred_schedule,notes").eq("parent_id",ctx.user.id).order("created_at");
 var box=$("studs");box.textContent="";
 if(x.error)return say("Could not load your students. Please refresh the page.");
 if(!x.data.length)box.appendChild(el("p","No students added yet. Add one below."));
 x.data.forEach(function(s){var c=el("div",null,"card");c.appendChild(el("h3",s.first_name));
  c.appendChild(el("p","Age "+s.age+" \u00b7 "+(s.level?LV[s.level]:"Level not set")));
  c.appendChild(el("p",CRS[s.preferred_course||"not_sure"]));
  [["Goals",s.goals],["Schedule",s.preferred_schedule],["Notes",s.notes]].forEach(function(r){if(r[1])c.appendChild(el("p",r[0]+": "+r[1],"small pre"));});
  c.appendChild(btn("Edit",function(){startEdit(s);}));c.appendChild(btn("Remove",function(){removeStudent(s);}));
  box.appendChild(c);});}
function resetForm(){editing=null;sf.reset();$("sftitle").textContent="Add a student";$("sfbtn").textContent="Add Student";$("sfcancel").hidden=true;}
function startEdit(s){editing=s.id;sf.first_name.value=s.first_name;sf.age.value=s.age;sf.level.value=s.level||"";sf.preferred_course.value=s.preferred_course||"not_sure";
 sf.goals.value=s.goals||"";sf.preferred_schedule.value=s.preferred_schedule||"";sf.notes.value=s.notes||"";
 $("sftitle").textContent="Edit student";$("sfbtn").textContent="Save Changes";$("sfcancel").hidden=false;$("sfcard").scrollIntoView({behavior:"smooth"});}
async function removeStudent(s){
 if(!confirm("Remove "+s.first_name+"? This cannot be undone."))return;
 var x=await sb.from("students").delete().eq("id",s.id);
 if(x.error)return say("Could not remove the student.");
 say("Student removed.",true);if(editing===s.id)resetForm();loadStudents();}
sf.addEventListener("submit",async function(e){e.preventDefault();
 var name=sf.first_name.value.trim();if(!name)return say("Please enter the student's name.");
 var age=parseInt(sf.age.value,10);if(!(age>=2&&age<=99))return say("Please enter a valid age (2 to 99).");
 var row={first_name:name,age:age,age_group:age<13?"child":age<18?"teen":"adult",level:sf.level.value||null,preferred_course:sf.preferred_course.value,
  goals:sf.goals.value.trim()||null,preferred_schedule:sf.preferred_schedule.value.trim()||null,notes:sf.notes.value.trim()||null},x;
 if(editing)x=await sb.from("students").update(row).eq("id",editing);
 else{row.parent_id=ctx.user.id;x=await sb.from("students").insert(row);}
 if(x.error)return say("Could not save: "+x.error.message);
 say(editing?"Student updated.":"Student added.",true);resetForm();loadStudents();});
$("sfcancel").addEventListener("click",resetForm);
async function loadAnn(){
 var x=await sb.from("announcements").select("id,title,body,created_at").order("created_at",{ascending:false}).limit(20);
 var box=$("ann");box.textContent="";
 if(x.error)return box.appendChild(el("p","Could not load announcements."));
 if(!x.data.length)return box.appendChild(el("p","No announcements right now."));
 x.data.forEach(function(a){var c=el("div",null,"card");c.appendChild(el("h3",a.title));
  c.appendChild(el("p",new Date(a.created_at).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}),"small"));
  c.appendChild(el("p",a.body,"pre"));
  if(ctx.admin)c.appendChild(btn("Delete",async function(){if(!confirm("Delete this announcement?"))return;
   var d=await sb.from("announcements").delete().eq("id",a.id);if(d.error)return say("Could not delete.");loadAnn();}));
  box.appendChild(c);});}
var af=$("annform");if(af)af.addEventListener("submit",async function(e){e.preventDefault();
 var x=await sb.from("announcements").insert({title:af.elements.title.value.trim(),body:af.body.value.trim()});
 if(x.error)return say("Could not post the announcement.");
 af.reset();say("Announcement posted.",true);loadAnn();});
document.addEventListener("tfes-ready",function(){ctx=window.TFES_CTX;loadStudents();loadAnn();});
})();
