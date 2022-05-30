/*

----------------------------------------

[Panel]
Sub_info_lite = script-name=Sub_info_lite

[Script]
Sub_info_lite = type=generic,timeout=10,script-path=https://raw.githubusercontent.com/wwg135/Surge/main/JS/Panel/sub_info_lite.js,script-update-interval=0,argument=url=(URL encode后的机场节点链接)&reset_day=4&expire=2023-05-03&title=𝓪𝓲𝓻𝓹𝓵𝓪𝓷

----------------------------------------

let now = new Date();
let today = now.getDate();
let month = now.getMonth();
let year = now.getFullYear();
let args = getArgs($request.url);
let resetDay = parseInt(args["due_day"] || args["reset_day"]);
let resetDayLeft = getRmainingDays(resetDay);

(async () => {
  let is_enhanced = await is_enhanced_mode();
  if (is_enhanced) await sleep(2000)
  let usage = await getDataInfo(args.url);
  if (!usage) {
    $done({})
    return;
  }
  let used = usage.download + usage.upload;
  let total = usage.total;
  let expire = usage.expire || args.expire;
  let localProxy = ['=http, localhost, 6152','=http, 127.0.0.1, 6152','=socks5,127.0.0.1, 6153']
  let infoList = [`已用：${bytesToSize(used)} | 总量：${bytesToSize(total)}`];

  if (resetDayLeft) {
    infoList.push(`重置：剩余${resetDayLeft}天`);
  }
  if (expire) {
    if (/^[\d.]+$/.test(expire)) expire *= 1000;
    infoList.push(`到期：${formatTime(expire)}`);
  }
  sendNotification(used / total, expire, infoList);
  let body = infoList.map((item, index) => item+localProxy[index]).join("\n");
  $done({ response: { body } });
})();

function getArgs(url) {
  return Object.fromEntries(
    url
      .slice(url.indexOf("?") + 1)
      .split("&")
      .map((item) => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
}

function getUserInfo(url) {
  let request = { headers: { "User-Agent": "Quantumult%20X" }, url };
  return new Promise((resolve, reject) =>
    $httpClient.head(request, (err, resp) => {
      if (err != null) {
        reject(err);
        return;
      }
      if (resp.status !== 200) {
        reject("Not Available");
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
      .match(/\w+=\d+/g)
      .map((item) => item.split("="))
      .map(([k, v]) => [k, parseInt(v)])
  );
}

function getRmainingDays(resetDay) {
  if (!resetDay) return 0;
  let daysInMonth = new Date(year, month + 1, 0).getDate();
  if (resetDay > today) daysInMonth = 0;

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

function sendNotification(usageRate, expire, infoList) {
  if (!args.alert) return;
  let title = args.title || "Sub Info";
  let subtitle = infoList[0];
  let body = infoList.slice(1).join("\n");
  usageRate = usageRate * 100;

  if (resetDay <= today) month += 1;
  let resetTime = new Date(year, month, resetDay);
  //通知计数器，每月重置日重置
  let notifyCounter = JSON.parse($persistentStore.read(title) || "{}");
  if (!notifyCounter[resetTime]) {
    notifyCounter = {
      [resetTime]: { usageRate: 80, resetDayLeft: 3, expire: 31, resetDay: 1 },
    };
  }

  let count = notifyCounter[resetTime];

  if (usageRate > count.usageRate && resetDay != today) {
    $notification.post(
      `${title} | 剩余流量不足${Math.ceil(100 - usageRate)}%`,
      subtitle,
      body
    );
    while (usageRate > count.usageRate) {
      if (count.usageRate < 95) {
        count.usageRate += 5;
      } else {
        count.usageRate += 4;
      }
    }
  }
  if (resetDayLeft && resetDayLeft < count.resetDayLeft && resetDay != today) {
    $notification.post(
      `${title} | 流量将在${resetDayLeft}天后重置`,
      subtitle,
      body
    );
    count.resetDayLeft = resetDayLeft;
  }
  if (resetDay == today && count.resetDay && usageRate < 5) {
    $notification.post(`${title} | 流量已重置`, subtitle, body);
    count.resetDay = 0;
  }
  if (expire) {
    let diff = (new Date(expire) - now) / (1000 * 3600 * 24);
    if (diff < count.expire) {
      $notification.post(
        `${title} | 套餐剩余时间不足${Math.ceil(diff)}天`,
        subtitle,
        body
      );
      count.expire -= 5;
    }
  }
  $persistentStore.write(JSON.stringify(notifyCounter), title);
}

function is_enhanced_mode() {
  return new Promise((resolve) =>
    $httpAPI("GET", "v1/features/enhanced_mode", null, (data) => {
      resolve(data.enabled);
    })
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
