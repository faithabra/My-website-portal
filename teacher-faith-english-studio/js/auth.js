(function(){
var CFG=window.TFES_CONFIG,$=function(i){return document.getElementById(i)};
function say(t,ok){var m=$("msg");if(!m)return;m.textContent=t;m.className="note "+(ok?"ok":"err");}
var c=$("chk");
if(!CFG||CFG.url.indexOf("https://")!==0||CFG.key.indexOf("PASTE")===0){say("Site setup is not finished yet (Supabase details missing in js/config.js).");if(c)c.textContent="Site setup is not finished yet.";return;}
var sb=window.supabase.createClient(CFG.url,CFG.key);window.TFES_SB=sb;
var r=$("regform");if(r)r.addEventListener("submit",async function(e){e.preventDefault();
 var n=r.full_name.value.trim(),em=r.email.value.trim(),pw=r.password.value;
 if(!n||!em)return say("Please fill in your name and email.");
 var wx=r.wechat_id.value.trim(),ph=r.phone.value.trim();
 if(!wx&&!ph)return say("Please enter a WeChat ID or a phone number.");
 if(pw.length<8)return say("Password must be at least 8 characters.");
 if(pw!==r.password2.value)return say("Passwords do not match.");
 if(!r.consent.checked)return say("Please tick the agreement box.");
 say("Creating your account...",true);
 var x=await sb.auth.signUp({email:em,password:pw,options:{data:{full_name:n,consent:true,wechat_id:wx,phone:ph},emailRedirectTo:location.origin+"/login.html"}});
 if(x.error)return say("Sorry, we could not create the account: "+x.error.message);
 r.reset();say("Almost done! Check your email and click the confirmation link, then log in.",true);});
var l=$("loginform");if(l){l.addEventListener("submit",async function(e){e.preventDefault();
 var x=await sb.auth.signInWithPassword({email:l.email.value.trim(),password:l.password.value});
 if(x.error)return say("Login failed. Check your email and password, and make sure you confirmed your email.");
 location.href="dashboard.html";});
 $("forgot").addEventListener("click",async function(e){e.preventDefault();var em=l.email.value.trim();
 if(!em)return say("Type your email in the box above first.");
 await sb.auth.resetPasswordForEmail(em,{redirectTo:location.origin+"/reset-password.html"});
 say("If that email has an account, a reset link is on its way.",true);});}
var f=$("resetform");if(f)f.addEventListener("submit",async function(e){e.preventDefault();
 if(f.password.value.length<8)return say("Password must be at least 8 characters.");
 var x=await sb.auth.updateUser({password:f.password.value});
 if(x.error)return say("Could not change the password. Open the link from your email again.");
 say("Password changed. You can now log in.",true);});
var d=$("dash");if(d){(async function(){
 var s=(await sb.auth.getSession()).data.session;
 if(!s){location.href="login.html";return;}
 var p=(await sb.from("profiles").select("full_name,role").eq("id",s.user.id).single()).data;
 $("who").textContent=(p&&p.full_name)||s.user.email;
 if(p&&p.role==="admin")$("adm").hidden=false;
 window.TFES_CTX={user:s.user,admin:!!(p&&p.role==="admin")};c.hidden=true;d.hidden=false;document.dispatchEvent(new Event("tfes-ready"));})();
 $("logout").addEventListener("click",async function(){await sb.auth.signOut();location.href="login.html";});}
})();
