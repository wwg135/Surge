/*
Nextdns_linkedip = type=event,event-name=network-changed,script-path=https://raw.githubusercontent.com/langkhach270389/Surge-LK/main/scripts/langkhach/Surge/nextdns_linkedip.js,script-update-interval=0
*/

async function launch() {
    await linkedip();
    $done();
}
launch()
function linkedip(){ 
$httpClient.post('https://link-ip.nextdns.io/d49521/c274ce33ad2401ca', function(error, response, data){
  if (error) {
console.log('❌');
  } else {
console.log('🔔'+ data);
  }
});
}
