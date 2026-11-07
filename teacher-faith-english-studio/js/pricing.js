(function(){
var C=window.TFES_CONFIG,box=document.getElementById("pkgs");
if(!C||!box||!window.supabase||C.url.indexOf("https://")!==0)return;
function money(p,c){try{return new Intl.NumberFormat(c==="CNY"?"zh-CN":undefined,{style:"currency",currency:c,minimumFractionDigits:p%1===0?0:2}).format(p);}catch(e){return c+" "+p;}}
function el(t,x,c){var e=document.createElement(t);e.textContent=x;if(c)e.className=c;return e;}
window.TFES_renderPackages=function(list){
 box.textContent="";
 list.forEach(function(k){var c=document.createElement("div");c.className="card";
  var orig=k.original_price==null?k.price:k.original_price,save=orig-k.price;
  c.appendChild(el("h3",k.name));c.appendChild(el("p",money(k.price,k.currency),"price"));
  c.appendChild(el("p",save>0?"Original "+money(orig,k.currency)+" \u00b7 Save "+money(save,k.currency)+" ("+Math.round(save/orig*100)+"% off)":"No discount","small"));
  c.appendChild(el("p",money(k.price/k.lessons,k.currency)+" per lesson"));
  if(k.description)c.appendChild(el("p",k.description));
  c.appendChild(el("p",k.lessons+(k.lessons===1?" lesson":" lessons")+" \u00b7 25 minutes each"+(k.validity_days?" \u00b7 Valid for "+k.validity_days+" days":""),"small"));
  box.appendChild(c);});};
window.supabase.createClient(C.url,C.key).from("packages").select("name,description,lessons,price,original_price,currency,validity_days").eq("active",true).order("sort_order").then(function(x){
 if(x.error||!x.data||!x.data.length)return;
 window.TFES_renderPackages(x.data);});
})();
