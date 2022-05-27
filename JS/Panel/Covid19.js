var list = ["东莞","广东"];
const url = "https://view.inews.qq.com/g2/getOnsInfo?name=disease_h5";
var ala="";
function nowtime(){
 let now = new Date();
 let time = now.getHours()+":"+now.getMinutes()+":"+now.getSeconds();
 return time
}
function num(location, result) {
  var loc = location;
  var resu = result;
  var loc_new = new RegExp(loc + "[\\s\\S]*?confirm[\\s\\S]{3}(\\d+)");
  var loc_now = new RegExp(loc + "[\\s\\S]*?nowConfirm[\\s\\S]{3}(\\d+)");
  var loc_wzzadd = new RegExp(loc + "[\\s\\S]*?wzz_add[\\s\\S]{3}(\\d+)"); 
  var loc_wzz = new RegExp(loc + "[\\s\\S]*?wzz[\\s\\S]{3}(\\d+)"); 
  let loc_new_res = loc_new.exec(resu);
  let loc_wzzadd_res = loc_wzzadd.exec(resu);
  let loc_now_res = loc_now.exec(resu);
  let loc_wzz_res = loc_wzz.exec(resu);
  if (loc_new_res) {
    //console.log("已获取" + loc + "的信息");
    ala = ala +loc +" :  " +loc_new_res[1].padStart(5,'-')+"|"+loc_wzzadd_res[1].padStart(5,'-')+"|"+loc_now_res[1].padStart(5,'-')+"|"+loc_wzz_res[1].padStart(5,'-')+ "\n";
  } else {
    //console.log("获取" + loc + "的信息失败");
    ala = ala + loc + " : 查无数据\n";
  }
};
$httpClient.get(url, function(error, response, data){
  let res = data;
  for (var i = 0; i < list.length; i++) {
    num(list[i], res);
    if (i == list.length - 1) {
     $done({
       title: "疫情 : 新增-无症状|现存-无症状"+ "   "+nowtime(),
       icon:"facemask.fill",
       "icon-color":"#FF0000",
       content: ala.replace(/\n$/, "")
     });
    }
  }
});
