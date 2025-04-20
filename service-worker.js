self.addEventListener("push",t=>{if(t.data){const a=JSON.parse(t.data.text());t.waitUntil(self.registration.showNotification(a.title,{body:a.body}))}});
