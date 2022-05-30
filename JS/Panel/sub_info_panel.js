/*
Surge配置

[Script]
Sub_info = type=generic,timeout=10,script-path=https://raw.githubusercontent.com/wwg135/Surge/main/JS/Panel/sub_info_panel.js,script-update-interval=0,argument=url=[URL encode 后的机场节点链接]&reset_day=4&expire=2023-05-03&title=𝓪𝓲𝓻𝓹𝓵𝓪𝓷&icon=airplane.departure&color=#FF00FF

[Panel]
Sub_info = script-name=Sub_info,update-interval=600

*/

let args = getArgs();

(async () => {
  let info = await getDataInfo(args.url);
  if (!info) $done();
  let resetDayLeft = getRmainingDays(parseInt(args["reset_day"]));

  let used = info.download + info.upload;
  let total = info.total;
  let expire = info.expire;
  let prec = precent(used,total);
  let proportion = used / total;
  let content = [`已用：${toPercent(proportion)} | 总量：${bytesToSize(total)}\n进度: ${prec}`];

  if (resetDayLeft) {
    content.push(`重置：剩余${resetDayLeft}天`);
  }
  if (expire && expire !== "false") {
    if (/^[\d.]+$/.test(expire)) expire *= 1000;
    content.push(`到期：${formatTime(expire)}`);
  }

  let now = new Date();
  let hour = now.getHours();
  let minutes = now.getMinutes();
  hour = hour > 9 ? hour : "0" + hour;
  minutes = minutes > 9 ? minutes : "0" + minutes;

  $done({
    title: `🧗𝓪𝓲𝓻𝓹𝓵𝓪𝓷 | ⏰更新时间: ${hour}:${minutes}`,
    content: content.join("\n"),
    icon: "airplane.departure",
    "icon-color": "#FF00FF",
  });
})();

function getArgs() {
  return Object.fromEntries(
    $argument
      .split("&")
      .map((item) => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
}

function getUserInfo(url) {
  let method = args.method || "head";
  let request = { headers: { "User-Agent": "Quantumult%20X" }, url };
  return new Promise((resolve, reject) =>
    $httpClient[method](request, (err, resp) => {
      if (err != null) {
        reject(err);
        return;
      }
      if (resp.status !== 200) {
        reject(resp.status);
        return;
      }
      let header = Object.keys(resp.headers).find(
        (key) => key.toLowerCase() === "subscription-userinfo"
      );
      if (header) {
        resolve(resp.headers[header]);
        return;
      }
      reject("链接响应头不带有流量信息");
    })
  );
}

async function getDataInfo(url) {
  const [err, data] = await getUserInfo(url)
    .then((data) => [null, data])
    .catch((err) => [err, null]);
  if (err) {
    console.log(err);
    return;
  }

  return Object.fromEntries(
    data
      .match(/\w+=[\d.eE+]+/g)
      .map((item) => item.split("="))
      .map(([k, v]) => [k, Number(v)])
  );
}

function getRmainingDays(resetDay) {
  if (!resetDay) return;

  let now = new Date();
  let today = now.getDate();
  let month = now.getMonth();
  let year = now.getFullYear();
  let daysInMonth;

  if (resetDay > today) {
    daysInMonth = 0;
  } else {
    daysInMonth = new Date(year, month + 1, 0).getDate();
  }

  return daysInMonth - today + resetDay;
}

function bytesToSize(bytes) {
  if (bytes === 0) return "0B";
  let k = 1024;
  sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

function formatTime(time) {
  let dateObj = new Date(time);
  let year = dateObj.getFullYear();
  let month = dateObj.getMonth() + 1;
  let day = dateObj.getDate();
  return year + "年" + month + "月" + day + "日";
}

function precent(res,total){
  let num = Number(((res / total)*10).toFixed(0));
  let precentprint = '';
  for (var i =1;i<=10;i++){
    if (i <= num) {
      precentprint += '🥀';
    }else{
      precentprint += '🌹';
    }
  };
  return precentprint;
}

function toPercent(proportion) {
  const percent = Number(proportion*100).toFixed(2);
  return percent + "%";
}
