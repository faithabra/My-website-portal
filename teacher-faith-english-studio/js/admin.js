(function(){
var C=window.TFES_CONFIG,$=function(i){return document.getElementById(i)};
if(!C||C.url.indexOf("https://")!==0){$("chk").textContent="Site setup is not finished yet.";return;}
var sb=window.supabase.createClient(C.url,C.key),me,profs=[],studs=[],pkgs=[],editS=null,editP=null;
function say(t,ok){var m=$("msg");m.textContent=t;m.className="note "+(ok?"ok":"err");}
function el(t,x,c){var e=document.createElement(t);if(x!=null)e.textContent=x;if(c)e.className=c;return e;}
function btn(t,fn){var b=el("button",t,"btn sm ghost");b.type="button";b.addEventListener("click",fn);return b;}
function money(p,c){try{return new Intl.NumberFormat(c==="CNY"?"zh-CN":undefined,{style:"currency",currency:c,minimumFractionDigits:p%1===0?0:2}).format(p);}catch(e){return c+" "+p;}}
var CRS={not_sure:"Course not chosen",oxford_phonics_world:"Oxford Phonics World",family_and_friends:"Family and Friends",everybody_up:"Everybody Up",free_conversation:"Free Conversation"},LV={beginner:"Beginner",elementary:"Elementary",intermediate:"Intermediate",advanced:"Advanced"};
async function init(){
 var s=(await sb.auth.getSession()).data.session;
 if(!s){location.href="login.html";return;}
 me=s.user;
 var p=(await sb.from("profiles").select("role").eq("id",me.id).single()).data;
 if(!p||p.role!=="admin"){location.href="dashboard.html";return;}
 $("chk").hidden=true;$("adminwrap").hidden=false;await loadAll();}
async function loadAll(){
 var a=await sb.from("profiles").select("id,full_name,email,wechat_id,phone,role,created_at").order("created_at",{ascending:false});
 var b=await sb.from("students").select("id,parent_id,first_name,age,age_group,level,preferred_course,goals,preferred_schedule,notes").order("created_at");
 var c=await sb.from("packages").select("*").order("sort_order").order("created_at");
 if(a.error||b.error||c.error)return say("Could not load some data. Please refresh.");
 profs=a.data;studs=b.data;pkgs=c.data;renderParents();renderPkgs();}
function renderParents(){
 var q=$("q").value.trim().toLowerCase(),box=$("plist");box.textContent="";
 var parents=profs.filter(function(p){return p.role==="parent";});
 $("sum").textContent=parents.length+" parent account(s), "+studs.length+" student(s) in total.";
 var shown=0;
 profs.forEach(function(p){
  var mine=studs.filter(function(s){return s.parent_id===p.id;});
  var hay=((p.full_name||"")+" "+(p.email||"")+" "+mine.map(function(s){return s.first_name;}).join(" ")).toLowerCase();
  if(q&&hay.indexOf(q)<0)return;shown++;
  var c=el("div",null,"card");c.style.margin="10px 0";
  c.appendChild(el("h3",(p.full_name||"(no name)")+(p.role==="admin"?" (teacher/admin)":"")));
  c.appendChild(el("p",(p.email||"no email")+" \u00b7 WeChat: "+(p.wechat_id||"-")+" \u00b7 Phone: "+(p.phone||"-")+" \u00b7 joined "+new Date(p.created_at).toLocaleDateString(),"small"));
  if(!mine.length)c.appendChild(el("p","No students added."));
  mine.forEach(function(s){var r=el("p",s.first_name+" \u2014 age "+s.age+" \u00b7 "+(s.level?LV[s.level]:"Level not set")+" \u00b7 "+CRS[s.preferred_course||"not_sure"]+"  ");
   r.appendChild(btn("Edit",function(){startEditS(s);}));r.appendChild(btn("Remove",function(){delS(s);}));c.appendChild(r);
   [["Goals",s.goals],["Schedule",s.preferred_schedule],["Notes",s.notes]].forEach(function(x){if(x[1])c.appendChild(el("p",x[0]+": "+x[1],"small pre"));});});
  box.appendChild(c);});
 if(!shown)box.appendChild(el("p","No matching accounts."));}
$("q").addEventListener("input",renderParents);
var ef=$("editform");
function startEditS(s){editS=s.id;ef.first_name.value=s.first_name;ef.level.value=s.level||"";ef.age.value=s.age;ef.preferred_course.value=s.preferred_course||"not_sure";$("editcard").hidden=false;$("editcard").scrollIntoView({behavior:"smooth"});}
$("editcancel").addEventListener("click",function(){editS=null;$("editcard").hidden=true;});
ef.addEventListener("submit",async function(e){e.preventDefault();var n=ef.first_name.value.trim();if(!n)return say("Please enter a first name.");
 var ag=parseInt(ef.age.value,10);if(!(ag>=2&&ag<=99))return say("Please enter a valid age.");
 var x=await sb.from("students").update({first_name:n,age:ag,age_group:ag<13?"child":ag<18?"teen":"adult",level:ef.level.value||null,preferred_course:ef.preferred_course.value}).eq("id",editS);
 if(x.error)return say("Could not save: "+x.error.message);
 say("Student updated.",true);editS=null;$("editcard").hidden=true;loadAll();});
async function delS(s){if(!confirm("Remove student "+s.first_name+"? This cannot be undone."))return;
 var x=await sb.from("students").delete().eq("id",s.id);if(x.error)return say("Could not remove the student.");say("Student removed.",true);loadAll();}
function renderPkgs(){var box=$("pkglist");box.textContent="";
 if(!pkgs.length)box.appendChild(el("p","No packages yet. Add your first one below."));
 pkgs.forEach(function(k){var c=el("div",null,"card");c.appendChild(el("h3",k.name));
  c.appendChild(el("p",money(k.price,k.currency),"price"));
  if(k.original_price>k.price)c.appendChild(el("p","Original "+money(k.original_price,k.currency)+" \u00b7 saves "+money(k.original_price-k.price,k.currency),"small"));
  if(k.description)c.appendChild(el("p",k.description));
  c.appendChild(el("p",k.lessons+" lesson(s) \u00b7 order "+k.sort_order+" \u00b7 "+(k.validity_days?"valid "+k.validity_days+" days \u00b7 ":"")+(k.active?"Shown publicly":"Hidden"),"small"));
  c.appendChild(btn("Edit",function(){startEditP(k);}));c.appendChild(btn("Delete",function(){delP(k);}));box.appendChild(c);});}
var pf=$("pkgform");
function resetP(){editP=null;pf.reset();pf.currency.value="CNY";pf.active.checked=true;$("pkgtitle").textContent="Add a package";$("pkgbtn").textContent="Add Package";$("pkgcancel").hidden=true;}
function startEditP(k){editP=k.id;pf.elements.name.value=k.name;pf.description.value=k.description||"";pf.lessons.value=k.lessons;pf.price.value=k.price;pf.original_price.value=k.original_price==null?"":k.original_price;pf.validity_days.value=k.validity_days==null?"":k.validity_days;pf.currency.value=k.currency;pf.sort_order.value=k.sort_order;pf.active.checked=k.active;
 $("pkgtitle").textContent="Edit package";$("pkgbtn").textContent="Save Changes";$("pkgcancel").hidden=false;$("pkgcard").scrollIntoView({behavior:"smooth"});}
$("pkgcancel").addEventListener("click",resetP);
pf.addEventListener("submit",async function(e){e.preventDefault();
 var row={name:pf.elements.name.value.trim(),description:pf.description.value.trim()||null,lessons:parseInt(pf.lessons.value,10),price:parseFloat(pf.price.value),original_price:pf.original_price.value===""?null:parseFloat(pf.original_price.value),validity_days:pf.validity_days.value===""?null:parseInt(pf.validity_days.value,10),
  currency:pf.currency.value.trim().toUpperCase(),sort_order:parseInt(pf.sort_order.value,10)||0,active:pf.active.checked};
 if(!row.name)return say("Please enter a package name.");
 if(!(row.lessons>=1))return say("Lessons must be at least 1.");
 if(!(row.price>=0))return say("Please enter a valid price.");
 if(row.original_price!==null&&!(row.original_price>=row.price))return say("Original price cannot be lower than the package price.");
 if(!/^[A-Z]{3}$/.test(row.currency))return say("Currency must be a 3-letter code like USD.");
 var x=editP?await sb.from("packages").update(row).eq("id",editP):await sb.from("packages").insert(row);
 if(x.error)return say("Could not save: "+x.error.message);
 say(editP?"Package updated.":"Package added.",true);resetP();loadAll();});
async function delP(k){if(!confirm("Delete package \""+k.name+"\"? This cannot be undone."))return;
 var x=await sb.from("packages").delete().eq("id",k.id);if(x.error)return say("Could not delete.");say("Package deleted.",true);loadAll();}
$("logout").addEventListener("click",async function(){await sb.auth.signOut();location.href="login.html";});
init();
})();
