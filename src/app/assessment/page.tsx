'use client'

import { useState, useEffect, useRef } from 'react'
import { createPendingStudent, type AssessmentResult } from '@/actions/assessment'

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
:root {
  --ink:#1a1a18;--ink2:#3d3d38;--ink3:#6e6e68;
  --paper:#f5f3ee;--paper2:#ede9e0;--paper3:#e3dfd4;
  --white:#ffffff;
  --green:#2d6a4f;--green-bg:rgba(45,106,79,.09);--green-b:rgba(45,106,79,.28);
  --amber:#7a5c10;--amber-bg:rgba(232,160,32,.09);--amber-b:rgba(232,160,32,.32);
  --red:#993c1d;--red-bg:rgba(153,60,29,.09);--red-b:rgba(153,60,29,.28);
  --border:rgba(26,26,24,.12);--border2:rgba(26,26,24,.06);
  --serif:'DM Serif Display',Georgia,serif;
  --sans:'DM Sans',sans-serif;--mono:'DM Mono',monospace;
  --r:6px;--rl:10px;
}
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:var(--sans);background:var(--paper);color:var(--ink);font-size:14px;line-height:1.65;}
.brand{font-family:var(--serif);font-size:28px;font-weight:400;margin-bottom:6px;}
.brand-sub{font-size:11px;color:var(--ink3);font-family:var(--mono);letter-spacing:.06em;margin-bottom:40px;}
.landing{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;text-align:center;}
.test-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:760px;width:100%;}
@media(max-width:600px){.test-cards{grid-template-columns:1fr;}}
.test-card{background:var(--white);border:1px solid var(--border);border-radius:var(--rl);padding:20px;cursor:pointer;text-align:left;transition:border-color .18s,transform .14s;}
.test-card:hover{border-color:rgba(26,26,24,.3);transform:translateY(-2px);}
.card-level{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);margin-bottom:8px;}
.card-title{font-family:var(--serif);font-size:18px;font-weight:400;margin-bottom:4px;}
.card-desc{font-size:12px;color:var(--ink3);margin-bottom:12px;line-height:1.5;}
.topic-pill{display:inline-block;font-size:10px;font-family:var(--mono);background:var(--paper2);border:1px solid var(--border2);border-radius:20px;padding:1px 7px;margin:2px 2px 0 0;}
.card-cta{margin-top:14px;font-size:12px;color:var(--ink3);}
.name-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
.name-box{background:var(--white);border:1px solid var(--border);border-radius:var(--rl);padding:36px;max-width:400px;width:100%;text-align:center;}
.name-box h2{font-family:var(--serif);font-size:22px;font-weight:400;margin-bottom:4px;}
.name-box p{font-size:12px;color:var(--ink3);margin-bottom:22px;}
.name-input{width:100%;padding:9px 13px;border:1px solid var(--border);border-radius:var(--r);font-family:var(--sans);font-size:14px;color:var(--ink);outline:none;background:var(--paper);margin-bottom:14px;}
.name-input:focus{border-color:rgba(26,26,24,.4);}
.btn{padding:9px 22px;border-radius:var(--r);font-family:var(--sans);font-size:13px;font-weight:500;cursor:pointer;border:none;transition:background .14s,transform .1s;letter-spacing:.02em;}
.btn:active{transform:scale(.98);}
.btn-dark{background:var(--ink);color:var(--paper);}
.btn-dark:hover{background:var(--ink2);}
.btn-dark:disabled{background:var(--paper3);color:var(--ink3);cursor:not-allowed;transform:none;}
.btn-ghost{background:none;border:1px solid var(--border);color:var(--ink3);}
.btn-ghost:hover{border-color:var(--ink3);color:var(--ink2);}
.btn-full{width:100%;}
.test-header{background:var(--white);border-bottom:1px solid var(--border);padding:12px 32px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20;}
.test-header-title{font-family:var(--serif);font-size:17px;font-weight:400;}
.test-header-sub{font-size:11px;color:var(--ink3);font-family:var(--mono);margin-top:2px;}
.prog-wrap{width:160px;height:4px;background:var(--paper3);border-radius:20px;overflow:hidden;margin-top:5px;}
.prog-fill{height:100%;background:var(--ink2);border-radius:20px;transition:width .3s;}
.q-counter{font-size:11px;color:var(--ink3);font-family:var(--mono);}
.test-body{max-width:680px;margin:0 auto;padding:36px 20px 100px;}
.section-block{margin-bottom:36px;}
.section-title{font-family:var(--serif);font-size:17px;font-weight:400;margin-bottom:3px;}
.section-instr{font-size:12px;color:var(--ink3);font-style:italic;margin-bottom:18px;line-height:1.5;}
.q-row{display:flex;align-items:baseline;gap:8px;margin-bottom:13px;}
.q-num{font-family:var(--mono);font-size:10px;color:var(--ink3);min-width:28px;flex-shrink:0;padding-top:2px;}
.q-body{flex:1;font-size:14px;color:var(--ink2);line-height:1.9;}
.q-fill{border:none;border-bottom:1.5px solid var(--border);background:transparent;font-family:var(--sans);font-size:14px;color:var(--ink);outline:none;padding:1px 4px;min-width:80px;width:140px;transition:border-color .15s;}
.q-fill:focus{border-bottom-color:var(--ink2);}
.q-fill.wide{width:200px;}
.q-fill.xwide{width:270px;}
.mc-opts{display:flex;flex-direction:column;gap:5px;margin-top:5px;}
.mc-opt{display:flex;align-items:center;gap:8px;padding:7px 11px;border:1px solid var(--border);border-radius:var(--r);cursor:pointer;font-size:13px;color:var(--ink2);background:var(--white);transition:border-color .14s,background .14s;}
.mc-opt:hover{border-color:rgba(26,26,24,.3);background:var(--paper2);}
.mc-opt.selected{border-color:var(--ink2);background:var(--paper);}
.mc-opt input{accent-color:var(--ink);}
.submit-bar{position:fixed;bottom:0;left:0;right:0;background:var(--white);border-top:1px solid var(--border);padding:12px 32px;display:flex;align-items:center;gap:14px;z-index:20;}
.unanswered{font-size:12px;color:var(--amber);font-family:var(--mono);}
.results-header{background:var(--white);border-bottom:1px solid var(--border);padding:16px 32px;}
.results-header h2{font-family:var(--serif);font-size:20px;font-weight:400;}
.results-header p{font-size:11px;color:var(--ink3);font-family:var(--mono);}
.results-body{max-width:680px;margin:0 auto;padding:36px 20px 60px;}
.verdict{border-radius:var(--rl);padding:22px;margin-bottom:18px;border:1px solid;text-align:center;position:relative;overflow:hidden;}
.verdict::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:currentColor;opacity:.4;}
.v-pass{background:var(--green-bg);border-color:var(--green-b);color:var(--green);}
.v-border{background:var(--amber-bg);border-color:var(--amber-b);color:var(--amber);}
.v-fail{background:var(--red-bg);border-color:var(--red-b);color:var(--red);}
.v-label{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.7;margin-bottom:8px;}
.v-main{font-family:var(--serif);font-size:40px;font-weight:400;line-height:1.1;margin-bottom:4px;}
.v-pct{font-size:13px;opacity:.8;}
.v-name{font-size:11px;font-family:var(--mono);opacity:.55;margin-top:5px;}
.conf-row{display:flex;align-items:center;gap:10px;margin-bottom:18px;}
.conf-outer{flex:1;height:5px;background:var(--paper3);border-radius:20px;overflow:hidden;}
.conf-inner{height:100%;border-radius:20px;background:var(--ink2);}
.conf-lbl{font-size:11px;font-family:var(--mono);color:var(--ink3);white-space:nowrap;}
.r-block{background:var(--white);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:14px;}
.r-head{padding:9px 13px;background:var(--paper2);border-bottom:1px solid var(--border2);font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink3);}
.r-body{padding:13px;font-size:13px;color:var(--ink2);line-height:1.75;}
.score-row{display:flex;align-items:center;gap:8px;padding:7px 13px;border-bottom:1px solid var(--border2);}
.score-row:last-child{border-bottom:none;}
.score-name{flex:1;font-size:13px;color:var(--ink2);}
.score-pct{font-family:var(--mono);font-size:11px;color:var(--ink3);min-width:32px;text-align:right;}
.score-bar-w{width:72px;height:4px;background:var(--paper3);border-radius:20px;overflow:hidden;}
.score-bar-f{height:100%;border-radius:20px;background:var(--ink2);opacity:.5;}
.qr-row{display:flex;align-items:flex-start;gap:7px;padding:6px 13px;border-bottom:1px solid var(--border2);font-size:12px;}
.qr-row:last-child{border-bottom:none;}
.qr-n{font-family:var(--mono);font-size:10px;color:var(--ink3);min-width:26px;padding-top:1px;}
.qr-icon{min-width:14px;padding-top:1px;}
.qr-student{color:var(--ink);}
.qr-correct{color:var(--green);font-size:11px;font-family:var(--mono);}
.qr-note{color:var(--ink3);font-size:11px;font-style:italic;}
.flag{background:var(--amber-bg);border:1px solid var(--amber-b);border-radius:var(--r);padding:9px 13px;font-size:12px;color:var(--amber);margin-bottom:14px;display:flex;gap:8px;align-items:flex-start;}
.spin{width:26px;height:26px;border:2px solid var(--border);border-top-color:var(--ink);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 14px;}
@keyframes spin{to{transform:rotate(360deg)}}
.loading-txt{font-family:var(--mono);font-size:12px;color:var(--ink3);text-align:center;}
.saved-banner{background:var(--green-bg);border:1px solid var(--green-b);border-radius:var(--r);padding:14px 16px;font-size:13px;color:var(--green);margin-bottom:18px;text-align:center;}
`

const TESTS: Record<number, {
  title: string
  level: string
  sections: Array<{
    id: string
    title: string
    instr: string
    qs: Array<{
      n: number
      type: string
      pre?: string
      sent?: string
      opts?: string[]
      prefix?: string
      ans: string | number
      wide?: boolean
      xwide?: boolean
    }>
  }>
  sysPrompt: string
}> = {
1:{
  title:"Einstufungstest 1",level:"A1 / A2 · Grundstufe",
  sections:[
    {id:"praesens",title:"Verben im Präsens",instr:"Konjugiere die Verben in der angegebenen Person!",qs:[
      {n:1,type:"fill",pre:"sprechen: du",ans:"sprichst"},
      {n:2,type:"fill",pre:"arbeiten: ihr",ans:"arbeitet"},
      {n:3,type:"fill",pre:"lesen: er",ans:"liest"},
      {n:4,type:"fill",pre:"wissen: ich",ans:"weiß"},
      {n:5,type:"fill",pre:"essen: du",ans:"isst"},
      {n:6,type:"fill",pre:"finden: du",ans:"findest"},
      {n:7,type:"fill",pre:"mögen: er",ans:"mag"},
      {n:8,type:"fill",pre:"sein: ihr",ans:"seid"},
    ]},
    {id:"perfekt",title:"Verben im Perfekt",instr:"Konjugiere (Hilfsverb und Partizip Perfekt)!",qs:[
      {n:9,type:"fill",pre:"fahren: ich",ans:"bin gefahren",wide:true},
      {n:10,type:"fill",pre:"haben: ich",ans:"habe gehabt",wide:true},
      {n:11,type:"fill",pre:"sein: ich",ans:"bin gewesen",wide:true},
      {n:12,type:"fill",pre:"gehen: ich",ans:"bin gegangen",wide:true},
      {n:13,type:"fill",pre:"machen: ich",ans:"habe gemacht",wide:true},
    ]},
    {id:"modal",title:"Modalverben im Präsens",instr:'Ergänze mit "dürfen", "können", "müssen" und "wollen"!',qs:[
      {n:14,type:"sent",sent:"Rauchen verboten! Hier ___ man nicht rauchen.",ans:"darf"},
      {n:15,type:"sent",sent:"Ich habe kein Brot. Ich ___ einkaufen gehen.",ans:"muss"},
      {n:16,type:"sent",sent:"Ich brauche Hilfe. ___ du mir bitte helfen?",ans:"Kannst"},
      {n:17,type:"sent",sent:"___ du heute mit mir ins Kino gehen? Hast du Lust?",ans:"Willst"},
    ]},
    {id:"praep1",title:"Präpositionen",instr:"Ergänze die Sätze mit Präpositionen!",qs:[
      {n:18,type:"sent",sent:"Ich komme ___ Polen.",ans:"aus"},
      {n:19,type:"sent",sent:"Ich lebe ___ Teneriffa.",ans:"auf"},
      {n:20,type:"sent",sent:"Ich arbeite ___ VW.",ans:"bei"},
      {n:21,type:"sent",sent:"Ich komme um 18 Uhr ___ Hause.",ans:"nach"},
      {n:22,type:"sent",sent:"Ich bin ab 19 Uhr ___ Hause.",ans:"zu"},
      {n:23,type:"sent",sent:"Ich habe keine Zeit ___ Hobbys.",ans:"für"},
      {n:24,type:"sent",sent:"Wir reisen oft ___ Frankreich.",ans:"nach"},
      {n:25,type:"sent",sent:"Ich war noch nie ___ Berlin.",ans:"in"},
    ]},
    {id:"praep2",title:"Präpositionen und Deklination",instr:"Ergänze mit Präpositionen und dem bestimmten Artikel!",qs:[
      {n:26,type:"sent",sent:"Was machst du ___ Wochenende?",ans:"am"},
      {n:27,type:"sent",sent:"Ich mache ___ Winter einen Skikurs.",ans:"im"},
      {n:28,type:"sent",sent:"Wir fahren ___ März in Urlaub.",ans:"im"},
      {n:29,type:"sent",sent:"___ Morgen frühstücke ich.",ans:"Am"},
      {n:30,type:"sent",sent:"Wir gehen ___ Theater.",ans:"ins"},
      {n:31,type:"sent",sent:"Wir sind ___ Schwimmbad.",ans:"im"},
      {n:32,type:"sent",sent:"Ich fahre ___ U-Bahn.",ans:"mit der"},
      {n:33,type:"sent",sent:"Ich wohne ___ Bergstraße.",ans:"in der"},
      {n:34,type:"sent",sent:"Die Stadt ist ___ Westen von Bonn.",ans:"im"},
      {n:35,type:"sent",sent:"Das Dorf liegt ___ Nähe von Frankfurt.",ans:"in der"},
    ]},
    {id:"poss",title:"Possessivartikel",instr:"Ergänze mit den Possessivartikeln!",qs:[
      {n:36,type:"sent",sent:"Er hat ein Auto, aber ___ Auto ist kaputt.",ans:"sein"},
      {n:37,type:"sent",sent:"Sie hat eine Freundin. ___ Freundin heißt Klara.",ans:"Ihre"},
      {n:38,type:"sent",sent:"Ich gehe mit ___ Hund spazieren.",ans:"meinem"},
      {n:39,type:"sent",sent:"Fährst du mit ___ Freunden in Urlaub?",ans:"deinen"},
      {n:40,type:"sent",sent:"Wir sind oft in ___ Garten.",ans:"unserem"},
    ]},
    {id:"neg",title:"Negation",instr:'Ergänze mit "kein-" (dekliniert) oder "nicht"!',qs:[
      {n:41,type:"sent",sent:"Ich komme ___ mit.",ans:"nicht"},
      {n:42,type:"sent",sent:"Ich habe ___ Lust.",ans:"keine"},
      {n:43,type:"sent",sent:"Das ist ___ mein Deutschbuch.",ans:"nicht"},
      {n:44,type:"sent",sent:"Ich brauche ___ Hilfe.",ans:"keine"},
      {n:45,type:"sent",sent:"Ich habe ___ viel gelernt.",ans:"nicht"},
      {n:46,type:"sent",sent:"Ich habe ___ Geld.",ans:"kein"},
    ]},
    {id:"konn1",title:"Konnektoren und Adverbien",instr:'Ergänze mit "aber", "denn", "deshalb", "und" und "weil"!',qs:[
      {n:47,type:"sent",sent:"Ich habe ein Motorrad, ___ kein Auto.",ans:"aber"},
      {n:48,type:"sent",sent:"Ich fahre mit dem Zug, ___ mein Auto ist kaputt.",ans:"denn"},
      {n:49,type:"sent",sent:"Ich bin krank, ___ gehe ich nicht arbeiten.",ans:"deshalb"},
      {n:50,type:"sent",sent:"Ich spiele manchmal Klavier ___ gehe oft ins Kino.",ans:"und"},
      {n:51,type:"sent",sent:"Ich lerne Deutsch, ___ ich in Deutschland leben will.",ans:"weil"},
    ]},
    {id:"syntax",title:"Syntax",instr:"Welcher Satz ist richtig?",qs:[
      {n:52,type:"mc",opts:["Danach ich bereite das Frühstück vor.","Danach das Frühstück ich bereite vor.","Danach bereite ich das Frühstück vor."],ans:2},
      {n:53,type:"mc",opts:["Ich bin im Herbst in Bonn.","In Bonn ich bin im Herbst.","Ich bin in Bonn im Herbst."],ans:0},
      {n:54,type:"mc",opts:["Ich habe viel Zeit nicht.","Ich nicht habe viel Zeit.","Ich habe nicht viel Zeit."],ans:2},
      {n:55,type:"mc",opts:["Ich verstehe nicht Sie.","Ich verstehe Sie nicht.","Ich nicht Sie verstehe."],ans:1},
      {n:56,type:"mc",opts:["Wiederholen Sie bitte den Satz!","Sie wiederholen bitte den Satz!","Sie holen bitte den Satz wieder!"],ans:0},
      {n:57,type:"mc",opts:["Können Sie bitte das Wort schreiben?","Bitte Sie können das Wort schreiben?","Können Sie bitte schreiben das Wort?"],ans:0},
    ]},
    {id:"geschmack",title:"Geschmack und Vorlieben",instr:'Ergänze mit "gefallen", "gern", "mögen" und "möchten"!',qs:[
      {n:58,type:"sent",sent:"Trinkst du ___ Tee?",ans:"gern"},
      {n:59,type:"sent",sent:"___ du Fußball?",ans:"Magst"},
      {n:60,type:"sent",sent:"Ich höre ___ Rockmusik.",ans:"gern"},
      {n:61,type:"sent",sent:"Ich ___ in Urlaub fahren.",ans:"möchte"},
      {n:62,type:"sent",sent:"Die Stadt ___ mir.",ans:"gefällt"},
    ]},
    {id:"wort1a",title:"Wortschatz — Sprachen, Geschäfte, Berufe",instr:"Ergänze mit den richtigen Wörtern!",qs:[
      {n:63,type:"sent",sent:"In Frankreich spricht man ___.",ans:"Französisch",xwide:true},
      {n:64,type:"sent",sent:"In England spricht man ___.",ans:"Englisch",xwide:true},
      {n:65,type:"sent",sent:"In Spanien spricht man ___.",ans:"Spanisch",xwide:true},
      {n:66,type:"sent",sent:"Brot kauft man in der ___.",ans:"Bäckerei",xwide:true},
      {n:67,type:"sent",sent:"Wurst kauft man in der ___.",ans:"Metzgerei",xwide:true},
      {n:68,type:"sent",sent:"Ich kaufe die Lebensmittel im ___.",ans:"Supermarkt",xwide:true},
      {n:69,type:"sent",sent:"Im Geschäft arbeitet die ___.",ans:"Verkäuferin",xwide:true},
      {n:70,type:"sent",sent:"Ich bin ___. Ich arbeite bei der Polizei.",ans:"Polizist/in",xwide:true},
      {n:71,type:"sent",sent:"Ich bin ___. Ich unterrichte Deutsch an einer Sprachschule.",ans:"Lehrer/in",xwide:true},
      {n:72,type:"sent",sent:"Ich bin krank. Ich gehe zum ___.",ans:"Arzt",xwide:true},
    ]},
    {id:"wort1b",title:"Wortschatz — Uhrzeiten, Zahlen, Datum, Tageszeiten",instr:"Ergänze die Lücken!",qs:[
      {n:73,type:"sent",sent:"Wie ___ Uhr ist es?",ans:"viel"},
      {n:74,type:"sent",sent:"9:15 — Es ist ___.",ans:"Viertel nach neun",xwide:true},
      {n:75,type:"sent",sent:"10:30 — Es ist ___.",ans:"halb elf",xwide:true},
      {n:76,type:"sent",sent:"7:50 — Es ist ___.",ans:"zehn vor acht",xwide:true},
      {n:77,type:"sent",sent:"Morgen, Vormittag, Mittag, Nachmittag, ___, Nacht",ans:"Abend"},
      {n:78,type:"sent",sent:"Montag, ___, Mittwoch, Donnerstag …",ans:"Dienstag"},
      {n:79,type:"sent",sent:"… Mai, Juni, Juli, ___, September …",ans:"August"},
      {n:80,type:"sent",sent:"6 = ___",ans:"sechs"},
      {n:81,type:"sent",sent:"12 = ___",ans:"zwölf"},
      {n:82,type:"sent",sent:"47 = ___",ans:"siebenundvierzig",xwide:true},
      {n:83,type:"sent",sent:"53 = ___",ans:"dreiundfünfzig",xwide:true},
      {n:84,type:"sent",sent:"Am ___ (3.) Februar beginnt der Kurs.",ans:"dritten"},
      {n:85,type:"sent",sent:"Das ist am ___ (24.) Oktober.",ans:"vierundzwanzigsten",xwide:true},
    ]},
    {id:"fragen",title:"Fragen — Interrogativpronomen",instr:"Ergänze mit den richtigen Fragewörtern!",qs:[
      {n:86,type:"sent",sent:"___ heißt du?",ans:"Wie"},
      {n:87,type:"sent",sent:"___ wohnst du?",ans:"Wo"},
      {n:88,type:"sent",sent:"___ kommt ihr? (Herkunft)",ans:"Woher"},
      {n:89,type:"sent",sent:"___ alt bist du?",ans:"Wie"},
      {n:90,type:"sent",sent:"___ Sprachen sprichst du?",ans:"Wie viele"},
      {n:91,type:"sent",sent:"___ beginnt der Kurs?",ans:"Wann"},
      {n:92,type:"sent",sent:"___ geht es dir?",ans:"Wie"},
      {n:93,type:"sent",sent:"___ machst du in deiner Freizeit?",ans:"Was"},
      {n:94,type:"sent",sent:"___ findest du den Film?",ans:"Wie"},
    ]},
    {id:"themen1",title:"Themen — Familie, Wohnung, Arbeit, Tagesablauf",instr:"Ergänze die Texte mit den richtigen Wörtern!",qs:[
      {n:95,type:"sent",sent:"Ich habe zwei Geschwister, einen Bruder und eine ___.",ans:"Schwester"},
      {n:96,type:"sent",sent:"Ich bin ___, mein Mann heißt Franz.",ans:"verheiratet"},
      {n:97,type:"sent",sent:"Er ___ 55 Jahre alt.",ans:"ist"},
      {n:98,type:"sent",sent:"Wir haben zwei Kinder, einen ___ …",ans:"Sohn"},
      {n:99,type:"sent",sent:"… und eine ___.",ans:"Tochter"},
      {n:100,type:"sent",sent:"Ich wohne in ___ Wohnung im Stadtzentrum.",ans:"einer"},
      {n:101,type:"sent",sent:"Die Wohnung ist ___ groß, sie ist klein.",ans:"nicht"},
      {n:102,type:"sent",sent:"Die Wohnung ___ drei Zimmer.",ans:"hat"},
      {n:103,type:"sent",sent:"Wir kochen in der ___.",ans:"Küche"},
      {n:104,type:"sent",sent:"Im ___ gibt es ein Sofa, zwei Sessel und einen Fernseher.",ans:"Wohnzimmer",xwide:true},
      {n:105,type:"sent",sent:"Wir duschen im ___.",ans:"Badezimmer"},
      {n:106,type:"sent",sent:"Wir haben die Wohnung nicht gekauft, wir haben sie ___.",ans:"gemietet"},
      {n:107,type:"sent",sent:"Ich ___ die Wohnung sehr schön.",ans:"finde"},
      {n:109,type:"sent",sent:"Ich bin Lehrer von ___.",ans:"Beruf"},
      {n:110,type:"sent",sent:"Ich arbeite schon 13 Jahre ___ Lehrer.",ans:"als"},
      {n:111,type:"sent",sent:"Ich arbeite von Montag ___ Freitag.",ans:"bis"},
      {n:112,type:"sent",sent:"Samstags und sonntags ___ ich frei.",ans:"bin"},
      {n:114,type:"sent",sent:"Ich stehe um 6 Uhr ___.",ans:"auf"},
      {n:115,type:"sent",sent:"Zum ___ esse ich ein Brot und trinke einen Kaffee.",ans:"Frühstück"},
      {n:116,type:"sent",sent:"Danach fahre ich ___ Arbeit.",ans:"zur"},
      {n:117,type:"sent",sent:"Um ein Uhr esse ich ___ Mittag.",ans:"zu"},
      {n:118,type:"sent",sent:"Am Nachmittag gehe ich in den Park und ___ Sport.",ans:"mache"},
      {n:119,type:"sent",sent:"Um 23 Uhr gehe ich ins Bett und schlafe ___.",ans:"ein"},
      {n:120,type:"sent",sent:"Meine Hobbys ___ Musik und Sport.",ans:"sind"},
    ]},
  ],
  sysPrompt:`You assess a German A1/A2 placement test (approx 120 questions). Be lenient with capitalisation. Accept Präposition+Artikel contractions (am, im, ins, zur, zum, in der, mit der etc.). For Wortschatz: accept all valid German equivalents (Fleischerei=Metzgerei, Polizist/Polizistin both ok). For Uhrzeiten accept all correct informal forms. For Ordinalzahlen (Q84-85) accept "dritten"/"dritte" etc. For Fragewörter Q89/92/94 "Wie" is correct; Q90 accept "Wie viele" or "Wie viel". For Themen accept any correct word fitting context. Return ONLY valid JSON no markdown:
{"placement":"A1"|"A2"|"A2/B1","confidence":80,"score_pct":72,"gate_fail":false,"gate_fail_topics":[],"section_scores":{"praesens":80,"perfekt":60,"modal":100,"praep1":75,"praep2":60,"poss":80,"neg":100,"konn1":80,"syntax":83,"geschmack":80,"wort1a":70,"wort1b":65,"fragen":78,"themen1":70},"question_results":[{"n":1,"correct":true,"student_ans":"sprichst","correct_ans":"sprichst","note":""}],"reasoning":"3-4 sentences.","recommendation":"2 sentences for teacher.","focus_areas":"Specific topics to practise."}`
},

2:{
  title:"Einstufungstest 2",level:"A2 / B1 · Mittelstufe",
  sections:[
    {id:"praesens2",title:"Verben im Präsens",instr:"Konjugiere die Verben!",qs:[
      {n:1,type:"fill",pre:"nehmen: du",ans:"nimmst"},
      {n:2,type:"fill",pre:"geben: du",ans:"gibst"},
      {n:3,type:"fill",pre:"werden: er",ans:"wird"},
      {n:4,type:"fill",pre:"wissen: er",ans:"weiß"},
      {n:5,type:"fill",pre:"sehen: du",ans:"siehst"},
      {n:6,type:"fill",pre:"treffen: er",ans:"trifft"},
      {n:7,type:"fill",pre:"lesen: du",ans:"liest"},
      {n:8,type:"fill",pre:"ausschlafen: er",ans:"schläft aus"},
      {n:9,type:"fill",pre:"vorbereiten: du",ans:"bereitest vor"},
    ]},
    {id:"perfekt2",title:"Verben im Perfekt",instr:"Konjugiere (Hilfsverb + Partizip Perfekt)!",qs:[
      {n:10,type:"fill",pre:"sein: ihr",ans:"seid gewesen",wide:true},
      {n:11,type:"fill",pre:"haben: wir",ans:"haben gehabt",wide:true},
      {n:12,type:"fill",pre:"umziehen: er",ans:"ist umgezogen",wide:true},
      {n:13,type:"fill",pre:"passieren: Was",ans:"ist passiert",wide:true},
      {n:14,type:"fill",pre:"denken: ich",ans:"habe gedacht",wide:true},
      {n:15,type:"fill",pre:"verstehen: ich",ans:"habe verstanden",wide:true},
      {n:16,type:"fill",pre:"bleiben: ich",ans:"bin geblieben",wide:true},
      {n:17,type:"fill",pre:"treffen: ich",ans:"habe getroffen",wide:true},
      {n:18,type:"fill",pre:"leihen: wir",ans:"haben geliehen",wide:true},
      {n:19,type:"fill",pre:"gefallen: es",ans:"hat gefallen",wide:true},
    ]},
    {id:"praet2",title:"Verben im Präteritum",instr:"Konjugiere!",qs:[
      {n:20,type:"sent",sent:"sein: Wir ___ im Mai zusammen in Bern.",ans:"waren"},
      {n:21,type:"sent",sent:"haben: Er ___ kein Glück.",ans:"hatte"},
      {n:22,type:"sent",sent:"müssen: Warum ___ du gestern früher nach Hause gehen?",ans:"musstest"},
      {n:23,type:"sent",sent:"dürfen: Die Kinder ___ den Film sehen.",ans:"durften"},
      {n:24,type:"sent",sent:"wollen: Er ___ früher nach Hause gehen.",ans:"wollte"},
      {n:25,type:"sent",sent:"können: Ich ___ gestern leider nicht kommen.",ans:"konnte"},
      {n:26,type:"sent",sent:"sollen: Alle ___ etwas mitbringen.",ans:"sollten"},
      {n:27,type:"sent",sent:"werden: Er ___ 96 Jahre alt.",ans:"wurde"},
    ]},
    {id:"trennbar",title:"Trennbare Verben",instr:"Ergänze das Präfix oder Verb!",qs:[
      {n:28,type:"sent",sent:"Es ist zu dunkel. Mach bitte das Licht ___!",ans:"an"},
      {n:29,type:"sent",sent:"Ich möchte schlafen. Mach bitte das Licht ___!",ans:"aus"},
      {n:30,type:"sent",sent:"Es ist zu kalt. Machen Sie bitte das Fenster ___!",ans:"zu"},
      {n:31,type:"sent",sent:"Es ist sehr heiß. Mach bitte das Fenster ___!",ans:"auf"},
      {n:32,type:"sent",sent:"Sie bereitet sich auf die Prüfung ___.",ans:"vor"},
      {n:33,type:"sent",sent:"Ich wache morgens immer sehr früh ___.",ans:"auf"},
      {n:34,type:"sent",sent:"Mein Wecker klingelt um halb sechs. Ich muss jeden Morgen ___.",ans:"aufstehen",xwide:true},
      {n:35,type:"sent",sent:"Ich bin erst 3 Stunden später ___.",ans:"eingeschlafen",xwide:true},
      {n:36,type:"sent",sent:"Gestern war ich auf einer Hochzeit und habe mich sehr elegant ___.",ans:"angezogen",xwide:true},
      {n:37,type:"sent",sent:"Gib mir bitte deine Telefonnummer. Dann kann ich dich morgen ___.",ans:"anrufen",xwide:true},
    ]},
    {id:"modal2",title:"Modalverben im Präsens",instr:"Ergänze mit Modalverb!",qs:[
      {n:38,type:"sent",sent:"Sie ist krank und ___ leider nicht an dem Treffen teilnehmen.",ans:"kann"},
      {n:39,type:"sent",sent:"___ ich vorstellen? Das ist Frau Menze, unsere Sekretärin.",ans:"Darf"},
      {n:40,type:"sent",sent:"Willst du, dass ich etwas mitbringe? = ___ ich etwas mitbringen?",ans:"Soll"},
      {n:41,type:"sent",sent:"Du ___ nicht einkaufen gehen. Ich habe schon alles gekauft.",ans:"musst"},
    ]},
    {id:"praep3",title:"Präpositionen",instr:"Ergänze mit Präpositionen!",qs:[
      {n:42,type:"sent",sent:"Vielen Dank ___ die Einladung!",ans:"für"},
      {n:43,type:"sent",sent:"Wir kennen uns ___ 30 Jahren.",ans:"seit"},
      {n:44,type:"sent",sent:"Wir haben uns ___ 30 Jahren kennengelernt.",ans:"vor"},
      {n:45,type:"sent",sent:"Ich interessiere mich ___ Sport.",ans:"für"},
      {n:46,type:"sent",sent:"Ich fahre oft ___ Anne. (Besuch)",ans:"zu"},
      {n:47,type:"sent",sent:"Ich wohne noch ___ meinen Eltern.",ans:"bei"},
      {n:48,type:"sent",sent:"Ich warte ___ dich.",ans:"auf"},
    ]},
    {id:"praep4",title:"Präpositionen und Deklination",instr:"Ergänze mit Präpositionen und dem bestimmten Artikel!",qs:[
      {n:49,type:"sent",sent:"Er war krank und ist ___ Arzt gegangen.",ans:"zum"},
      {n:50,type:"sent",sent:"Wir sind ___ Party gegangen.",ans:"zur"},
      {n:51,type:"sent",sent:"Am Wochenende gehen wir ___ Strand.",ans:"an den"},
      {n:52,type:"sent",sent:"Ich gehe gern ___ Wald spazieren.",ans:"im"},
      {n:53,type:"sent",sent:"Wir haben Urlaub ___ Bergen gemacht.",ans:"in den"},
      {n:54,type:"sent",sent:"Nächstes Jahr wollen wir Urlaub ___ Meer machen.",ans:"am"},
      {n:55,type:"sent",sent:"___ Arbeit fahre ich nach Hause.",ans:"Nach der"},
      {n:56,type:"sent",sent:"Ich habe ein Jahr lang ___ Ausland studiert.",ans:"im"},
      {n:57,type:"sent",sent:"Wir haben uns ___ Marktplatz gesehen.",ans:"auf dem"},
      {n:58,type:"sent",sent:"Ich wohne ___ Bergstraße.",ans:"in der"},
    ]},
    {id:"fragewort2",title:"Fragewörter",instr:"Nominativ, Dativ oder Akkusativ!",qs:[
      {n:59,type:"sent",sent:"Mit ___ hast du gesprochen?",ans:"wem"},
      {n:60,type:"sent",sent:"___ kommt mit ins Kino?",ans:"Wer"},
      {n:61,type:"sent",sent:"___ hast du eingeladen?",ans:"Wen"},
    ]},
    {id:"pronomen",title:"Personal- und Reflexivpronomen",instr:"Ergänze mit den deklinierten Pronomen!",qs:[
      {n:62,type:"sent",sent:"Ich habe ___ sehr gefreut.",ans:"mich"},
      {n:63,type:"sent",sent:"Peter und Heike, wann habt ihr ___ kennengelernt?",ans:"euch"},
      {n:64,type:"sent",sent:"Brauchst du das Buch? Ich kann es ___ leihen.",ans:"dir"},
      {n:65,type:"sent",sent:"Sag ___ bitte, wann du kommst. (1. Pers. Sg.)",ans:"mir"},
      {n:66,type:"sent",sent:"Petra, ich liebe ___. (2. Pers. Sg.)",ans:"dich"},
      {n:67,type:"sent",sent:"Er ist so alt wie ___. (1. Pers. Sg.)",ans:"ich"},
    ]},
    {id:"konn2",title:"Konnektoren",instr:'Ergänze mit "aber", "als", "da", "damit", "dass", "denn", "deshalb", "wenn" und "weil"!',qs:[
      {n:68,type:"sent",sent:"Ich habe nicht viel Zeit, ___ ich helfe dir.",ans:"aber"},
      {n:69,type:"sent",sent:"Ich kann nicht mitkommen, ___ ich muss arbeiten.",ans:"denn"},
      {n:70,type:"sent",sent:"Ich habe nicht gut geschlafen, ___ bin ich so müde.",ans:"deshalb"},
      {n:71,type:"sent",sent:"___ ich ein Kind war, wollte ich Polizist werden.",ans:"Als"},
      {n:72,type:"sent",sent:"Ich gebe dir meine Adresse, ___ du mir schreiben kannst.",ans:"damit"},
      {n:73,type:"sent",sent:"___ ich eine Prüfung habe, muss ich viel lernen.",ans:"Wenn"},
      {n:74,type:"sent",sent:"Ich hoffe, ___ wir uns bald wiedersehen.",ans:"dass"},
      {n:75,type:"sent",sent:"Ich lerne Deutsch, ___ ich es für meine Arbeit brauche.",ans:"weil"},
      {n:76,type:"sent",sent:"___ du willst, kannst du mitkommen.",ans:"Wenn"},
    ]},
    {id:"komp",title:"Komparativ und Superlativ",instr:"Ergänze!",qs:[
      {n:77,type:"sent",sent:"groß – ___ – am größten",ans:"größer"},
      {n:78,type:"sent",sent:"schlecht – schlechter – am ___",ans:"schlechtesten"},
      {n:79,type:"sent",sent:"gut – ___ – am besten",ans:"besser"},
      {n:80,type:"sent",sent:"gern – ___ – am liebsten",ans:"lieber"},
      {n:81,type:"sent",sent:"viel – mehr – am ___",ans:"meisten"},
    ]},
    {id:"adj2",title:"Adjektivdeklination",instr:"Dekliniere die Adjektive!",qs:[
      {n:82,type:"sent",sent:"Wir wohnen in einem klein___ Haus.",ans:"kleinen"},
      {n:83,type:"sent",sent:"Das Haus hat einen groß___ Garten.",ans:"großen"},
      {n:84,type:"sent",sent:"Hast du das schön___ Foto gemacht?",ans:"schöne"},
      {n:85,type:"sent",sent:"Ich habe mit meiner best___ Freundin telefoniert.",ans:"besten"},
      {n:86,type:"sent",sent:"Der neu___ Nachbar ist sehr nett.",ans:"neue"},
      {n:87,type:"sent",sent:"Letzt___ Jahr habe ich mein Studium beendet.",ans:"Letztes"},
      {n:88,type:"sent",sent:"Nächst___ Woche habe ich eine Deutschprüfung.",ans:"Nächste"},
      {n:89,type:"sent",sent:"Nächst___ Wochenende fahren wir nach München.",ans:"Nächstes"},
    ]},
    {id:"syntax2",title:"Syntax",instr:"Welcher Satz ist richtig?",qs:[
      {n:90,type:"mc",prefix:"Der Vater gibt dem Kind Geld,…",opts:["damit es sich ein Eis kaufen kann.","damit es sich ein Eis kann kaufen.","damit es kann sich ein Eis kaufen."],ans:0},
      {n:91,type:"mc",opts:["Ich habe nicht dich gesehen.","Ich habe dich nicht gesehen.","Ich nicht dich habe gesehen."],ans:1},
      {n:92,type:"mc",opts:["Ich gehe ins Kino am Wochenende mit meinen Freunden.","Ich gehe am Wochenende mit meinen Freunden ins Kino.","Ich gehe mit meinen Freunden ins Kino am Wochenende."],ans:1},
      {n:93,type:"mc",opts:["Ich bin 1991 in Wien geboren.","1991 ich bin in Wien geboren.","Ich bin in Wien 1991 geboren."],ans:0},
    ]},
    {id:"wort2",title:"Wortschatz und Grammatik — Themen",instr:"Ergänze die Texte mit den richtigen Wörtern!",qs:[
      {n:94,type:"sent",sent:"Auf der Arbeit ___ ich eine Uniform. (Kleidung)",ans:"trage"},
      {n:95,type:"sent",sent:"In meiner Freizeit ___ ich mich sportlich und bequem an.",ans:"ziehe"},
      {n:96,type:"sent",sent:"Ich mag sowohl Kleider ___ auch Hosen.",ans:"als"},
      {n:97,type:"sent",sent:"Ich ___ gern Klamotten kaufen.",ans:"kaufe"},
      {n:98,type:"sent",sent:"Ich bin 1,87 Meter ___ und 81 Kilo ___. (Aussehen: groß/schwer)",ans:"groß / schwer"},
      {n:99,type:"sent",sent:"Ich habe blaue ___ und kurze blonde ___. (Augen/Haare)",ans:"Augen / Haare"},
      {n:100,type:"sent",sent:"Ich trage eine ___, weil ich nicht so gut sehe.",ans:"Brille"},
      {n:101,type:"sent",sent:"Monika: Ich wohne ___ dem Land, aber ich arbeite in der Stadt.",ans:"auf"},
      {n:102,type:"sent",sent:"Ich brauche mein Auto, ___ zur Arbeit zu fahren.",ans:"um"},
      {n:103,type:"sent",sent:"Frank: Ich habe alles in ___ Nähe.",ans:"meiner"},
      {n:104,type:"sent",sent:"Es ___ viele Geschäfte, Kneipen, Museen usw.",ans:"gibt"},
      {n:105,type:"sent",sent:"Ich kann immer ___ Fuß gehen.",ans:"zu"},
      {n:106,type:"sent",sent:"Helena: Es ist nicht so stressig ___ in der Stadt.",ans:"wie"},
      {n:107,type:"sent",sent:"Anna: Ein ___ ist, dass es ein gutes kulturelles Angebot gibt.",ans:"Vorteil"},
      {n:108,type:"sent",sent:"Aber ein ___ ist, dass das Leben in der Stadt sehr teuer ist.",ans:"Nachteil"},
      {n:109,type:"sent",sent:"Maika: Ich ___, ein eigenes Auto ist praktischer.",ans:"finde"},
      {n:110,type:"sent",sent:"Peter: Ich fahre ___ mit dem Bus ___ mit dem Auto.",ans:"sowohl / als auch"},
      {n:111,type:"sent",sent:"Laura: Meiner Meinung ___ ist Zugfahren bequemer.",ans:"nach"},
      {n:112,type:"sent",sent:"Lorenz: In die Stadt fahre ich entweder mit dem Bus ___ mit der S-Bahn.",ans:"oder"},
      {n:113,type:"sent",sent:"Heinz: Ich fahre weder mit dem Bus ___ mit dem Zug.",ans:"noch"},
      {n:114,type:"sent",sent:"Wir haben Glück: Die Sonne ___ und es ist warm.",ans:"scheint"},
      {n:115,type:"sent",sent:"Hoffentlich ___ es nicht. (Picknick-Wetter)",ans:"regnet"},
      {n:116,type:"sent",sent:"Es sind viele dunkle ___ am Himmel.",ans:"Wolken"},
      {n:117,type:"sent",sent:"Es gibt bestimmt ein ___ mit Blitzen und Donner.",ans:"Gewitter"},
    ]},
  ],
  sysPrompt:`You assess a German A2/B1 placement test. Accept suffix-only answers for Adjektivdeklination. Accept Präposition+Artikel contractions. For trennbare Verben Q34-37 accept Infinitiv or Partizip Perfekt. Q98: two blanks (groß/schwer) — correct if student writes both. Q99: two blanks (Augen/Haare). Q110: two blanks (sowohl/als auch). Accept finde/denke/meine for Q109. Return ONLY valid JSON no markdown:
{"placement":"A2"|"B1"|"B1/B2","confidence":80,"score_pct":72,"section_scores":{"praesens2":80,"perfekt2":70,"praet2":75,"trennbar":80,"modal2":75,"praep3":80,"praep4":70,"fragewort2":100,"pronomen":83,"konn2":78,"komp":80,"adj2":75,"syntax2":75,"wort2":70},"question_results":[{"n":1,"correct":true,"student_ans":"nimmst","correct_ans":"nimmst","note":""}],"reasoning":"3-4 sentences.","recommendation":"2 sentences.","focus_areas":"Specific topics."}`
},

3:{
  title:"Einstufungstest 3",level:"B1 Abschluss · B1 → B2",
  sections:[
    {id:"perfekt3",title:"Verben im Perfekt",instr:"Konjugiere (Hilfsverb + Partizip Perfekt)!",qs:[
      {n:1,type:"fill",pre:"kennen: ich",ans:"habe gekannt",wide:true},
      {n:2,type:"fill",pre:"verlieren: er",ans:"hat verloren",wide:true},
      {n:3,type:"fill",pre:"werden: ich",ans:"bin geworden",wide:true},
      {n:4,type:"fill",pre:"helfen: du",ans:"hast geholfen",wide:true},
      {n:5,type:"fill",pre:"mögen: ich",ans:"habe gemocht",wide:true},
    ]},
    {id:"praet3",title:"Verben im Präteritum",instr:"Konjugiere!",qs:[
      {n:6,type:"sent",sent:"kommen: Er ___ zu spät.",ans:"kam"},
      {n:7,type:"sent",sent:"schlafen: Er ___ immer sehr lange.",ans:"schlief"},
      {n:8,type:"sent",sent:"fliegen: Wir ___ Urlaub.",ans:"flogen"},
      {n:9,type:"sent",sent:"geben: Es ___ keine Möglichkeit.",ans:"gab"},
      {n:10,type:"sent",sent:"mögen: Er ___ kein Gemüse.",ans:"mochte"},
      {n:11,type:"sent",sent:"bleiben: Ich ___ drei Wochen dort.",ans:"blieb"},
      {n:12,type:"sent",sent:"denken: Er ___ nicht daran.",ans:"dachte"},
      {n:13,type:"sent",sent:"fahren: Trotz seines Alters ___ er immer noch mit dem Auto.",ans:"fuhr"},
    ]},
    {id:"konj2",title:"Verben im Konjunktiv II",instr:"Konjugiere! (Gate-Thema)",qs:[
      {n:14,type:"sent",sent:"haben: Ich ___ gern mehr Zeit.",ans:"hätte"},
      {n:15,type:"sent",sent:"sein: Ich ___ vorsichtiger.",ans:"wäre"},
      {n:16,type:"sent",sent:"können: ___ Sie mir bitte helfen?",ans:"Könnten"},
      {n:17,type:"sent",sent:"mögen: Ich ___ etwas trinken.",ans:"möchte"},
      {n:18,type:"sent",sent:"müssen: Du ___ mal Urlaub machen.",ans:"müsstest"},
      {n:19,type:"sent",sent:"sollen: Du ___ mal mit ihm sprechen.",ans:"solltest"},
      {n:20,type:"sent",sent:"werden: Was ___ du tun?",ans:"würdest"},
    ]},
    {id:"futur",title:"Verben im Futur",instr:"Ergänze mit dem konjugierten Hilfsverb!",qs:[
      {n:21,type:"sent",sent:"Was ___ du jetzt tun?",ans:"wirst"},
      {n:22,type:"sent",sent:"Ich ___ bald umziehen.",ans:"werde"},
      {n:23,type:"sent",sent:"___ ihr auch auf das Fest kommen?",ans:"Werdet"},
      {n:24,type:"sent",sent:"Er ___ das nicht noch einmal tun.",ans:"wird"},
    ]},
    {id:"passiv",title:"Passiv",instr:"Ergänze mit dem Hilfsverb! (Gate-Thema)",qs:[
      {n:25,type:"sent",sent:"Er hatte sich schwer verletzt und musste operiert ___.",ans:"werden"},
      {n:26,type:"sent",sent:"Das Prüfungsergebnis ___ in Kürze veröffentlicht.",ans:"wird"},
      {n:27,type:"sent",sent:"Er ist schon gestern über die Ereignisse informiert ___.",ans:"worden"},
      {n:28,type:"sent",sent:"Auf dem gestrigen Ausflug ___ wir von dem Regenschauer überrascht.",ans:"wurden"},
    ]},
    {id:"praep5",title:"Präpositionen und Pronominaladverbien",instr:"Ergänze!",qs:[
      {n:29,type:"sent",sent:"Hast du dich ___ ihm bedankt?",ans:"bei"},
      {n:30,type:"sent",sent:"Ich habe mich sehr ___ das Geschenk gefreut.",ans:"über"},
      {n:31,type:"sent",sent:"Ich freue mich schon ___ ihren Besuch.",ans:"auf"},
      {n:32,type:"sent",sent:"Ich möchte ___ diesem Kurs teilnehmen.",ans:"an"},
      {n:33,type:"sent",sent:"Ich bitte dich ___ Hilfe.",ans:"um"},
      {n:34,type:"sent",sent:"Ich habe ___ dem Weg gefragt.",ans:"auf"},
      {n:35,type:"sent",sent:"Mein Mann kümmert sich ___ die Kinder.",ans:"um"},
      {n:36,type:"sent",sent:"Er hat sich sehr ___ geärgert. (Pronominaladverb)",ans:"darüber"},
      {n:37,type:"sent",sent:"Denk bitte ___, ihr schöne Grüße zu bestellen.",ans:"daran"},
      {n:38,type:"sent",sent:"Es hängt ___ ab, wie viel Geld wir haben.",ans:"davon"},
      {n:39,type:"sent",sent:"___ hast du geträumt? (Fragewort)",ans:"Wovon"},
      {n:40,type:"sent",sent:"___ wartest du? (Fragewort)",ans:"Worauf"},
      {n:41,type:"sent",sent:"___ interessieren Sie sich? (Fragewort)",ans:"Wofür"},
    ]},
    {id:"relativ",title:"Relativpronomen",instr:"Ergänze mit Relativpronomen!",qs:[
      {n:42,type:"sent",sent:"Ein guter Freund ist jemand, mit ___ ich über alles sprechen kann.",ans:"dem"},
      {n:43,type:"sent",sent:"Ist das der Wagen, ___ du letztes Jahr gekauft hast?",ans:"den"},
      {n:44,type:"sent",sent:"Das ist die Frau, von ___ ich gesprochen habe.",ans:"der"},
      {n:45,type:"sent",sent:"Das Buch, ___ ich gerade lese, ist sehr spannend.",ans:"das"},
      {n:46,type:"sent",sent:"Im Sommer waren wir in der Stadt, in ___ wir uns kennengelernt haben.",ans:"der"},
      {n:47,type:"sent",sent:"Auf dem Foto siehst du die Kinder, mit ___ wir den Geburtstag gefeiert haben.",ans:"denen"},
      {n:48,type:"sent",sent:"Bonn, ___ ich lange gelebt habe, ist meine Lieblingsstadt.",ans:"wo"},
      {n:49,type:"sent",sent:"Der Mann, ___ Lebensgeschichte verfilmt wurde, war bei der Uraufführung anwesend.",ans:"dessen"},
    ]},
    {id:"konn3",title:"Konnektoren",instr:'Ergänze mit "als", "bevor", "bis", "damit", "deswegen", "nachdem", "ob", "obwohl", "sodass", "wenn" und "trotzdem"! (Gate-Thema)',qs:[
      {n:50,type:"sent",sent:"Ich gehe arbeiten, ___ ich Geld verdiene.",ans:"damit"},
      {n:51,type:"sent",sent:"___ ich ein Kind war, verging die Zeit viel langsamer.",ans:"Als"},
      {n:52,type:"sent",sent:"Ich warte hier, ___ er kommt.",ans:"bis"},
      {n:53,type:"sent",sent:"___ ich sehr viel gelernt habe, habe ich die Prüfung nicht bestanden.",ans:"Obwohl"},
      {n:54,type:"sent",sent:"___ du mir alles erklärt hast, habe ich mehr Verständnis für dein Verhalten.",ans:"Nachdem"},
      {n:55,type:"sent",sent:"Er hat sie oft enttäuscht, ___ hat sie sich nicht von ihm getrennt.",ans:"trotzdem"},
      {n:56,type:"sent",sent:"___ man etwas kauft, sollte man sich gut überlegen, ob man es wirklich braucht.",ans:"Wenn"},
      {n:57,type:"sent",sent:"___ ich wollte, würde ich mitfahren. Aber ich will nicht.",ans:"Wenn"},
      {n:58,type:"sent",sent:"Viele junge Menschen wollen zuerst arbeiten, ___ bekommen sie später Kinder.",ans:"deswegen"},
      {n:59,type:"sent",sent:"Es hat den ganzen Tag stark geregnet, ___ wir das Haus nicht verlassen konnten.",ans:"sodass"},
      {n:60,type:"sent",sent:"Ich bin mir nicht sicher, ___ wir es wirklich schaffen werden.",ans:"ob"},
    ]},
    {id:"posverb",title:"Positionsverben und Deklination",instr:"Ergänze mit hängen, legen, liegen, setzen, sitzen, stellen, stehen und dem deklinierten bestimmten Artikel!",qs:[
      {n:61,type:"sent",sent:"Er ___ die Gläser auf ___ Tisch. (Verb + Artikel)",ans:"stellt / den"},
      {n:62,type:"sent",sent:"Ich habe mich neben ___ Frau ___, weil neben ihr noch ein Stuhl frei war.",ans:"der / gesetzt"},
      {n:63,type:"sent",sent:"Du hast jetzt lang genug im Bett ___!",ans:"gelegen"},
      {n:64,type:"sent",sent:"Ich ___ abends oft noch stundenlang vor ___ Computer.",ans:"sitze / dem"},
      {n:65,type:"sent",sent:"Ich brauche Hammer und Nagel, um das Bild an ___ Wand zu ___.",ans:"die / hängen"},
      {n:66,type:"sent",sent:"Wir haben stundenlang in ___ Kälte ___. Jetzt tun mir die Füße weh.",ans:"der / gestanden"},
      {n:67,type:"sent",sent:"Ich weiß nicht, wohin ich mein Portemonnaie ___ habe.",ans:"gelegt"},
    ]},
    {id:"adj3",title:"Adjektivdeklination",instr:"Dekliniere die Adjektive!",qs:[
      {n:73,type:"sent",sent:"Wir haben den Tag mit gut___ Freunden verbracht.",ans:"guten"},
      {n:74,type:"sent",sent:"Es gibt leider keine frei___ Sitzplätze mehr.",ans:"freien"},
      {n:75,type:"sent",sent:"Dieser teur___ Wein schmeckt nicht viel besser.",ans:"teure"},
      {n:76,type:"sent",sent:"Wir haben Besuch von unserer neu___ Nachbarin bekommen.",ans:"neuen"},
      {n:77,type:"sent",sent:"Im Ausland vermisste er vor allem deutsch___ Brot.",ans:"deutsches"},
      {n:78,type:"sent",sent:"In welcher deutsch___ Stadt sind Sie schon gewesen?",ans:"deutschen"},
      {n:79,type:"sent",sent:"Er erzählt immer dieselben alt___ Geschichten.",ans:"alten"},
      {n:80,type:"sent",sent:"Wegen des schlecht___ Wetters wurde die Veranstaltung abgesagt.",ans:"schlechten"},
      {n:81,type:"sent",sent:"Sie erinnert sich an dieses schrecklich___ Erlebnis.",ans:"schreckliche"},
      {n:82,type:"sent",sent:"Die Liebhaber schnell___ Autos werden voll auf ihre Kosten kommen.",ans:"schneller"},
    ]},
    {id:"wort3",title:"Wortschatz und Grammatik",instr:"Ergänze die Sätze mit dem passenden Wort!",qs:[
      {n:83,type:"sent",sent:"Kannst du mir einen Gefallen ___?",ans:"tun"},
      {n:84,type:"sent",sent:"Es ___ darauf an, was du willst.",ans:"kommt"},
      {n:85,type:"sent",sent:"Sie war schwanger und hat ihr Kind ___.",ans:"bekommen"},
      {n:86,type:"sent",sent:"Die ___ ist ohne Komplikationen verlaufen.",ans:"Geburt"},
      {n:87,type:"sent",sent:"Der Arzt hat mich für eine Woche ___.",ans:"krankgeschrieben"},
      {n:88,type:"sent",sent:"Ich habe Rückenschmerzen und weiß nicht, was ich ___ tun kann.",ans:"dagegen"},
      {n:89,type:"sent",sent:"Können Sie mir einen Rat ___?",ans:"geben"},
      {n:90,type:"sent",sent:"Ja, ich ___ Ihnen, regelmäßig Rückengymnastik zu machen.",ans:"empfehle"},
      {n:91,type:"sent",sent:"Eine gesunde und ausgewogene ___ ist sehr wichtig.",ans:"Ernährung"},
      {n:92,type:"sent",sent:"Ich habe 16 Kilo ___.",ans:"zugenommen"},
      {n:93,type:"sent",sent:"Jetzt will ich versuchen, wieder ___.",ans:"abzunehmen"},
      {n:94,type:"sent",sent:"Ich ___ dir einen Rat.",ans:"gebe"},
      {n:95,type:"sent",sent:"An deiner ___ würde ich mehr Sport treiben.",ans:"Stelle"},
      {n:96,type:"sent",sent:"Die Temperaturen sollen bis auf 30 Grad ___.",ans:"steigen"},
      {n:97,type:"sent",sent:"Es wird heute also sehr heiß ___.",ans:"werden"},
      {n:98,type:"sent",sent:"Ich verliere langsam die ___.",ans:"Geduld"},
      {n:99,type:"sent",sent:"Ich frage mich wirklich, ___ er endlich anruft.",ans:"ob"},
      {n:100,type:"sent",sent:"Wir versuchen, Petra davon zu ___, dass ein Strandurlaub am besten ist.",ans:"überzeugen"},
      {n:101,type:"sent",sent:"Das kommt für mich nicht in ___.",ans:"Frage"},
      {n:102,type:"sent",sent:"Was ___ ihr davon, heute Abend zusammen essen zu gehen?",ans:"haltet"},
      {n:103,type:"sent",sent:"Heute Abend ___ es leider nicht.",ans:"klappt"},
      {n:104,type:"sent",sent:"Wir haben schon etwas ___.",ans:"geplant"},
      {n:105,type:"sent",sent:"Ich sehe mir Spielfilme lieber zu Hause ___, denn da habe ich meine Ruhe.",ans:"an"},
      {n:106,type:"sent",sent:"… und werde von ___ gestört.",ans:"niemanden"},
      {n:107,type:"sent",sent:"Liebe Annika, ich wünsche ___ alles Gute zum Geburtstag!",ans:"dir"},
      {n:108,type:"sent",sent:"Ich bin mir nicht sicher, was Sie sagen wollen. Was ___ Sie damit?",ans:"meinen"},
      {n:109,type:"sent",sent:"Wenn du Hilfe benötigst, ___ du nur zu fragen.",ans:"brauchst"},
      {n:110,type:"sent",sent:"Aus der Statistik geht hervor, dass immer ___ Menschen in Einpersonenhaushalten leben.",ans:"mehr"},
      {n:111,type:"sent",sent:"Die Wohnung, die ich mir angesehen ___, ist nicht nur sehr groß, …",ans:"habe"},
      {n:112,type:"sent",sent:"… ___ auch sehr billig.",ans:"sondern"},
      {n:113,type:"sent",sent:"___ du willst, erzähle ich dir, wovon er handelt.",ans:"Wenn"},
      {n:114,type:"sent",sent:"Ich kann dir eine kurze Zusammenfassung machen, wovon er ___.",ans:"handelt"},
      {n:115,type:"sent",sent:"Herr Schulz, da bin ich überhaupt nicht ___ Meinung.",ans:"Ihrer"},
      {n:116,type:"sent",sent:"Hoffentlich ___ er nicht, die Blumen zu gießen.",ans:"vergisst"},
      {n:117,type:"sent",sent:"Mein Auto ist kaputt. Ich muss es reparieren zu ___.",ans:"lassen"},
      {n:118,type:"sent",sent:"Eine Gefahr ist, dass man zu viel Zeit mit seinem Smartphone ___.",ans:"verbringt"},
      {n:119,type:"sent",sent:"Ich finde es sehr unhöflich, wenn jemand ___ eines Gesprächs auf sein Smartphone schaut.",ans:"während"},
      {n:120,type:"sent",sent:"Ich nehme ___, dass er die Verabredung absagen wird.",ans:"an"},
    ]},
  ],
  sysPrompt:`You assess a German B1 end-of-course test for B2 readiness.

GATE TOPICS — failure here overrides other scores:
- konj2: True KII forms required (hätte, wäre, könnten, müsstest, solltest, würdest). "würde" for haben/sein/modals = B1 marker.
- passiv: Distinguish Vorgangspassiv (wird/wurde) vs Zustandspassiv (ist...worden). "geworden" instead of "worden" = hard error.
- konn3: Correct subordinating conjunctions with verb-final word order.

HIGH WEIGHT: relativ (esp. Q49 "dessen"), adj3, praet3 irregular forms, posverb.
SUPPORTING: perfekt3, praep5, wort3.

For posverb Q61,62,64,65,66: two blanks — award correct if both parts right.
Accept suffix-only answers for adj3. Accept near-synonyms in wort3 (bekommen/geboren for Q85; klappt/schafft for Q103; haltet/denkt for Q102).
Be lenient on capitalisation at sentence start.

Return ONLY valid JSON no markdown:
{"placement":"B1 — nicht B2-bereit"|"B1/B2 — Grenzfall"|"Bereit für B2","confidence":85,"score_pct":72,"gate_fail":false,"gate_fail_topics":[],"section_scores":{"perfekt3":80,"praet3":62,"konj2":85,"futur":75,"passiv":50,"praep5":77,"relativ":75,"konn3":72,"posverb":60,"adj3":80,"wort3":65},"question_results":[{"n":1,"correct":true,"student_ans":"habe gekannt","correct_ans":"habe gekannt","note":""}],"reasoning":"4-5 sentences on gate topics and overall pattern.","recommendation":"2-3 sentences for teacher.","focus_areas":"Specific areas before B2."}`
}
}

type Q = typeof TESTS[1]['sections'][0]['qs'][0]
type Answers = Record<number, string | number>

export default function AssessmentPage() {
  const [screen, setScreen] = useState<'landing'|'name'|'test'|'results'>('landing')
  const [testId, setTestId] = useState<number|null>(null)
  const [studentName, setStudentName] = useState('')
  const [studentPhone, setStudentPhone] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [answers, setAnswers] = useState<Answers>({})
  const [result, setResult] = useState<AssessmentResult & { error?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadMsg, setLoadMsg] = useState('Antworten werden ausgewertet…')
  const [saved, setSaved] = useState(false)
  const loadRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)

  useEffect(() => {
    if (!styleRef.current) {
      const s = document.createElement('style')
      s.textContent = css
      document.head.appendChild(s)
      styleRef.current = s
    }
  }, [])

  const test = testId ? TESTS[testId] : null
  const allQs = test ? test.sections.flatMap(s => s.qs) : []
  const answered = Object.keys(answers).length
  const total = allQs.length
  const pct = total ? Math.round(answered / total * 100) : 0

  function setAns(n: number, val: string | number) {
    setAnswers(prev => ({ ...prev, [n]: val }))
  }

  async function submit() {
    if (!test) return
    setScreen('results')
    setLoading(true)
    setResult(null)
    setSaved(false)

    const msgs = allQs.map(q => {
      const sec = test.sections.find(s => s.qs.includes(q))
      const raw = answers[q.n]
      const sa = q.type === 'mc'
        ? (raw !== undefined ? (q.opts as string[])[raw as number] : '(keine Antwort)')
        : ((raw as string || '').trim() || '(keine Antwort)')
      return `Q${q.n} [${sec?.id}] korrekt:"${q.ans}" student:"${sa}"`
    }).join('\n')

    const lm = ['Antworten werden analysiert…','Grammatik wird geprüft…','Gesamtbild wird bewertet…','Empfehlungen werden erstellt…']
    let li = 0
    loadRef.current = setInterval(() => { li = (li + 1) % lm.length; setLoadMsg(lm[li]) }, 1200)

    try {
      const resp = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 8000,
          system: test.sysPrompt,
          messages: [{ role: 'user', content: `Student: ${studentName}\nTest: ${test.title} (${test.level})\n\nAntworten:\n${msgs}\n\nBitte bewerte und gib das JSON zurück.` }]
        })
      })
      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.error || `API ${resp.status}`)
      }
      const data = await resp.json()
      const raw = data.content?.find((b: { type: string }) => b.type === 'text')?.text || ''
      const parsed: AssessmentResult = JSON.parse(raw.replace(/```json|```/g, '').trim())
      if (loadRef.current) clearInterval(loadRef.current)
      setResult(parsed)

      // Save student to CRM silently
      try {
        await createPendingStudent(studentName, studentPhone, studentEmail, parsed)
        setSaved(true)
      } catch {
        // Non-blocking — don't surface this to the student
      }
    } catch (err) {
      if (loadRef.current) clearInterval(loadRef.current)
      setResult({ error: (err as Error).message } as AssessmentResult & { error: string })
    }
    setLoading(false)
  }

  function restart() {
    setScreen('landing')
    setTestId(null)
    setStudentName('')
    setStudentPhone('')
    setStudentEmail('')
    setAnswers({})
    setResult(null)
    setSaved(false)
  }

  if (screen === 'landing') return <Landing onSelect={id => { setTestId(id); setScreen('name') }} />
  if (screen === 'name') return <NameScreen test={test!} onStart={(name, phone, email) => { setStudentName(name); setStudentPhone(phone); setStudentEmail(email); setScreen('test') }} onBack={() => setScreen('landing')} />
  if (screen === 'test') return <TestScreen test={test!} answers={answers} setAns={setAns} answered={answered} total={total} pct={pct} studentName={studentName} onSubmit={submit} />
  if (screen === 'results') return <ResultsScreen loading={loading} loadMsg={loadMsg} result={result} test={test} studentName={studentName} saved={saved} onRestart={restart} />
  return null
}

function Landing({ onSelect }: { onSelect: (id: number) => void }) {
  const cards = [
    { id:1, level:'Test 1 · A1 / A2', title:'Grundstufe', desc:'Für Anfänger und Grundkenntnisse', topics:['Präsens','Perfekt','Modalverben','Präpositionen','Possessivartikel','Negation','Konnektoren','Syntax','Wortschatz','Themen'] },
    { id:2, level:'Test 2 · A2 / B1', title:'Mittelstufe', desc:'Für fortgeschrittene Grundkenntnisse', topics:['Perfekt/Präteritum','Trennbare Verben','Reflexivpronomen','Komparativ','Adjektivdeklination','Konnektoren','Wortschatz'] },
    { id:3, level:'Test 3 · B1 Abschluss', title:'B1 → B2 Einstufung', desc:'Prüft B2-Bereitschaft', topics:['Konjunktiv II','Passiv','Relativpronomen','Konnektoren','Positionsverben','Adjektivdeklination','Wortschatz'] },
  ]
  return (
    <div className="landing">
      <div className="brand">Deutsch Einstufungstest</div>
      <div className="brand-sub">Automatische Einstufung · Sprachschule</div>
      <div className="test-cards">
        {cards.map(c => (
          <div key={c.id} className="test-card" onClick={() => onSelect(c.id)}>
            <div className="card-level">{c.level}</div>
            <div className="card-title">{c.title}</div>
            <div className="card-desc">{c.desc}</div>
            <div>{c.topics.map(t => <span key={t} className="topic-pill">{t}</span>)}</div>
            <div className="card-cta">Test starten →</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NameScreen({ test, onStart, onBack }: { test: typeof TESTS[1]; onStart: (name: string, phone: string, email: string) => void; onBack: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  function handleStart() { if (name.trim()) onStart(name.trim(), phone.trim(), email.trim()) }
  return (
    <div className="name-screen">
      <div className="name-box">
        <h2>{test.title}</h2>
        <p>{test.level}</p>
        <input className="name-input" placeholder="Vor- und Nachname *" value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleStart()}
          autoFocus />
        <input className="name-input" placeholder="Telefonnummer" value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleStart()} />
        <input className="name-input" placeholder="E-Mail-Adresse" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleStart()} />
        <button className="btn btn-dark btn-full" style={{ marginBottom: 10 }} onClick={handleStart} disabled={!name.trim()}>
          Test beginnen →
        </button>
        <button className="btn btn-ghost btn-full" onClick={onBack}>← Zurück</button>
      </div>
    </div>
  )
}

function TestScreen({ test, answers, setAns, answered, total, pct, studentName, onSubmit }: {
  test: typeof TESTS[1]; answers: Answers; setAns: (n: number, v: string | number) => void
  answered: number; total: number; pct: number; studentName: string; onSubmit: () => void
}) {
  return (
    <div>
      <div className="test-header">
        <div>
          <div className="test-header-title">{test.title}</div>
          <div className="test-header-sub">{studentName} · {test.level}</div>
          <div className="prog-wrap"><div className="prog-fill" style={{ width: pct + '%' }} /></div>
        </div>
        <div className="q-counter">{answered} / {total}</div>
      </div>
      <div className="test-body">
        {test.sections.map(sec => (
          <div key={sec.id} className="section-block">
            <div className="section-title">{sec.title}</div>
            <div className="section-instr">{sec.instr}</div>
            {sec.qs.map(q => <QuestionRow key={q.n} q={q} value={answers[q.n]} onChange={v => setAns(q.n, v)} />)}
          </div>
        ))}
      </div>
      <div className="submit-bar">
        <button className="btn btn-dark" onClick={onSubmit}>Abgeben & auswerten</button>
        {answered < total && <span className="unanswered">{total - answered} offen</span>}
      </div>
    </div>
  )
}

function QuestionRow({ q, value, onChange }: { q: Q; value: string | number | undefined; onChange: (v: string | number) => void }) {
  const cls = 'q-fill' + (q.xwide ? ' xwide' : q.wide ? ' wide' : '')
  if (q.type === 'fill') return (
    <div className="q-row">
      <span className="q-num">{q.n}.</span>
      <span className="q-body">{q.pre} <input className={cls} value={(value as string) || ''} onChange={e => onChange(e.target.value)} autoComplete="off" /></span>
    </div>
  )
  if (q.type === 'sent') {
    const parts = (q.sent as string).split('___')
    return (
      <div className="q-row">
        <span className="q-num">{q.n}.</span>
        <span className="q-body">{parts.map((p, i) => <span key={i}>{p}{i < parts.length - 1 && <input className={cls} value={(value as string) || ''} onChange={e => onChange(e.target.value)} autoComplete="off" />}</span>)}</span>
      </div>
    )
  }
  if (q.type === 'mc') return (
    <div className="q-row">
      <span className="q-num">{q.n}.</span>
      <div className="q-body">
        {q.prefix && <div style={{ fontSize: 13, color: 'var(--ink2)', marginBottom: 6, fontStyle: 'italic' }}>{q.prefix}</div>}
        <div className="mc-opts">
          {(q.opts as string[]).map((opt, i) => (
            <label key={i} className={'mc-opt' + (value === i ? ' selected' : '')} onClick={() => onChange(i)}>
              <input type="radio" name={'q' + q.n} checked={value === i} onChange={() => onChange(i)} />{opt}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
  return null
}

function ResultsScreen({ loading, loadMsg, result, test, studentName, saved, onRestart }: {
  loading: boolean
  loadMsg: string
  result: (AssessmentResult & { error?: string }) | null
  test: typeof TESTS[1] | null
  studentName: string
  saved: boolean
  onRestart: () => void
}) {
  const [confW, setConfW] = useState(0)
  useEffect(() => { if (result && !result.error) setTimeout(() => setConfW(result.confidence || 0), 200) }, [result])
  const sectionNames: Record<string, string> = {}
  if (test) test.sections.forEach(s => sectionNames[s.id] = s.title)
  const pct = result?.score_pct || 0
  const vclass = pct >= 70 ? 'v-pass' : pct >= 50 ? 'v-border' : 'v-fail'
  return (
    <div>
      <div className="results-header">
        <h2>Auswertung</h2>
        <p>{studentName} · {test?.level} · {new Date().toLocaleDateString('de-DE')}</p>
      </div>
      <div className="results-body">
        {loading && <div style={{ textAlign: 'center', padding: '60px 20px' }}><div className="spin" /><div className="loading-txt">{loadMsg}</div></div>}
        {!loading && result?.error && <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-b)', borderRadius: 'var(--r)', padding: 16, color: 'var(--red)', fontSize: 13 }}>Fehler: {result.error}</div>}
        {!loading && result && !result.error && <>
          {saved && (
            <div className="saved-banner">
              Ihre Ergebnisse wurden gespeichert. Die Schule wird sich in Kürze bei Ihnen melden.
            </div>
          )}
          <div className={'verdict ' + vclass}>
            <div className="v-label">Einstufungsergebnis</div>
            <div className="v-main">{result.placement}</div>
            <div className="v-pct">{pct}% Gesamtergebnis</div>
            <div className="v-name">{studentName}</div>
          </div>
          <div className="conf-row">
            <span className="conf-lbl" style={{ minWidth: 32 }}>{result.confidence}%</span>
            <div className="conf-outer"><div className="conf-inner" style={{ width: confW + '%', transition: 'width 1s ease' }} /></div>
            <span className="conf-lbl">Konfidenz</span>
          </div>
          {result.gate_fail && result.gate_fail_topics?.length > 0 && (
            <div className="flag"><span>⚠</span><span><strong>Gate-Thema nicht bestanden:</strong> {result.gate_fail_topics.join(', ')} — verhindert B2-Einstufung.</span></div>
          )}
          {result.section_scores && (
            <div className="r-block"><div className="r-head">Ergebnisse nach Abschnitt</div>
              {Object.entries(result.section_scores).map(([k, v]) => (
                <div key={k} className="score-row">
                  <span className="score-name">{sectionNames[k] || k}</span>
                  <span className="score-pct">{v}%</span>
                  <div className="score-bar-w"><div className="score-bar-f" style={{ width: v + '%' }} /></div>
                </div>
              ))}
            </div>
          )}
          <div className="r-block"><div className="r-head">Begründung</div><div className="r-body">{result.reasoning}</div></div>
          <div className="r-block"><div className="r-head">Empfehlung für die Lehrkraft</div><div className="r-body">{result.recommendation}</div></div>
          {result.focus_areas && <div className="r-block"><div className="r-head">Schwerpunkte für die weitere Arbeit</div><div className="r-body">{result.focus_areas}</div></div>}
          {result.question_results?.length > 0 && (
            <div className="r-block"><div className="r-head">Detaillierte Auswertung</div>
              {result.question_results.map(qr => (
                <div key={qr.n} className="qr-row">
                  <span className="qr-n">{qr.n}.</span>
                  <span className="qr-icon" style={{ color: qr.correct ? 'var(--green)' : 'var(--red)' }}>{qr.correct ? '✓' : '✗'}</span>
                  <div>
                    <span className="qr-student">{String(qr.student_ans || '')}</span>
                    {!qr.correct && <span className="qr-correct"> → {String(qr.correct_ans || '')}</span>}
                    {qr.note && <div className="qr-note">{qr.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button className="btn btn-ghost" onClick={onRestart}>Neuen Test starten</button>
            <button className="btn btn-ghost" onClick={() => window.print()}>Drucken</button>
          </div>
        </>}
      </div>
    </div>
  )
}
