// ==========================================================================
// ==                          CONFIGURATION TARIFS                        ==
// ==========================================================================
const API_CONFIG = { apiUrl: 'https://script.google.com/macros/s/AKfycbynjy2Su-M-PD5ksc9yHsVSsi1F57PdLKJsDh4yXP2eCKQClv-lTHdxNuEBgcAKHAVy/exec', }; // <--- METTRE L'URL UNIQUE /exec
const tariffsDataCache = { timestamp: null, data: null, ttl: 15 * 60 * 1000 };
const ABSOLUTE_BASE_CATEGORY_NAME = 'Double Classique';
const BASE_RATE_PLAN_NAME = 'OTA-RO-FLEX';
const DISPLAY_PLAN_CODES_INSTEAD_OF_DESC = false; // Affichage des descriptions dans les menus
const ratePlanDescriptions = { /* --- VOS DESCRIPTIONS ICI --- */ 'OTA-RO-FLEX': 'Chambre Seule, Flexible', /* ... etc ... */ };
// Structures globales
let partnerToPlansMap = new Map(); let planToCategoriesMap = new Map(); let categoryToPlansMap = new Map();
let allPartners = new Set(); let allCategories = new Set(); let allPlans = new Set(); let originalPlanOrder = {};
let baseRatesByDate = new Map(); // Ajouté pour stocker base OTA
let travcoBaseRatesByDate = new Map(); // Ajouté pour stocker base Travco
let comparisonAdvChartInstance = null; // Pour le nouveau graphique
// --- Fin Configuration ---

// --- Fonctions Utilitaires ---
// (showGlobalMessage, showLoading, hideResult, formatDateYYYYMMDD, formatDateLocale, generateStayDates, getElementValue, getElementValueAsInt, getElementValueAsFloat comme avant)
function showGlobalMessage(message, type = 'error', duration = 7000) { const messageArea=document.getElementById('global-message-area-tarifs'); if(!messageArea){console.error("Zone 'global-message-area-tarifs' manquante!"); return;} const alertId=`alert-tarifs-${Date.now()}`; let b,brd,txt,ico; switch(type){case 'success':b='bg-emerald-900/40';brd='border-emerald-700';txt='text-emerald-200';ico='fa-check-circle';break; case 'warning':b='bg-yellow-900/40';brd='border-yellow-700';txt='text-yellow-300';ico='fa-exclamation-triangle';break; case 'info':b='bg-sky-900/40';brd='border-sky-700';txt='text-sky-300';ico='fa-info-circle';break; case 'error':default:b='bg-red-900/40';brd='border-red-700';txt='text-red-300';ico='fa-exclamation-circle';break;} const alertHtml=`<div id="${alertId}" class="alert ${b} border-l-4 ${brd} ${txt} p-4 fade-in flex items-center mb-4 shadow-md rounded-r-lg" role="alert"><i class="fas ${ico} mr-3 text-xl"></i><span class="flex-grow text-sm">${message.replace(/\n/g,'<br>')}</span><button type="button" class="ml-auto -mx-1.5 -my-1.5 bg-transparent rounded-lg focus:ring-2 focus:ring-gray-400 p-1.5 hover:bg-gray-700/50 inline-flex h-8 w-8 close-alert-button" aria-label="Close"><span class="sr-only">Close</span><i class="fas fa-times"></i></button></div>`; messageArea.insertAdjacentHTML('beforeend',alertHtml); const el=messageArea.querySelector(`#${alertId}`); if(el){const btn=el.querySelector(`.close-alert-button`); if(btn) btn.addEventListener('click', ()=>el.remove()); if(duration>0) setTimeout(()=>el.remove(), duration);}}
function showLoading(elementId, message = "Chargement...") { const e=document.getElementById(elementId); if(e){e.innerHTML=`<div class="loading p-4 text-center text-gray-400 italic">${message} <i class="fas fa-spinner fa-spin ml-2"></i></div>`;e.classList.remove('hidden');} else console.warn(`showLoading: ID '${elementId}' introuvable.`);}
function hideResult(elementId) { const e=document.getElementById(elementId); if(e){e.classList.add('hidden');e.innerHTML='';} else console.warn(`hideResult: ID '${elementId}' introuvable.`);}
function formatDateYYYYMMDD(date) { if (!(date instanceof Date) || isNaN(date.getTime())) return null; const y=date.getUTCFullYear(), m=(date.getUTCMonth()+1).toString().padStart(2,'0'), d=date.getUTCDate().toString().padStart(2,'0'); return `${y}-${m}-${d}`; }
function formatDateLocale(date) { if (!(date instanceof Date) || isNaN(date.getTime())) return "Date invalide"; const opts={day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}; try{return date.toLocaleDateString('fr-FR',opts);}catch(e){return formatDateYYYYMMDD(date)||"Date invalide";}}
function generateStayDates(arrivalDateString, nights) { if (!arrivalDateString) throw new Error("Date d'arrivée manquante."); const nightsInt=parseInt(nights,10); if (!nightsInt || isNaN(nightsInt) || nightsInt < 1) throw new Error("Nombre de nuits invalide."); const dates = []; let currentDate; try { currentDate = new Date(arrivalDateString + 'T00:00:00Z'); if (isNaN(currentDate.getTime())) throw new Error('Format date invalide'); } catch(e) { throw new Error("Format de date d'arrivée incorrect."); } for (let i = 0; i < nightsInt; i++) { dates.push(new Date(currentDate)); currentDate.setUTCDate(currentDate.getUTCDate() + 1); } return dates; }
function getElementValue(id) { const el=document.getElementById(id); return el ? el.value : null; }
function getElementValueAsInt(id) { const v=getElementValue(id); const p=v?parseInt(v, 10):NaN; return isNaN(p)?null:p; }
function getElementValueAsFloat(id) { const v=getElementValue(id); const p=v?parseFloat(String(v).replace(',','.')):NaN; return isNaN(p)?null:p; }
function updateRatePlanHelp(planCode, helpTextId) { const h = document.getElementById(helpTextId); if (h) h.textContent = ratePlanDescriptions[planCode] || (planCode ? '' : '...'); }

// --- Récupération et Initialisation ---
async function fetchAndProcessData() {
    // ... (Fonction fetchAndProcessData comme dans script.js v4, utilisant ?module=tarifs) ...
    // Assurez-vous qu'elle peuple bien les structures globales :
    // baseRatesByDate, partnerToPlansMap, categoryToPlansMap, allPartners, allCategories, allPlans, originalPlanOrder
     const now = Date.now(); if (tariffsDataCache.data && tariffsDataCache.timestamp && (now - tariffsDataCache.timestamp < tariffsDataCache.ttl)) { console.log("Cache HIT"); if (allCategories.size === 0) processFetchedData(tariffsDataCache.data); return tariffsDataCache.data; } console.log("Cache MISS. Appel API Tarifs..."); showGlobalMessage("Chargement config...", "info", 0); if (!API_CONFIG.apiUrl || API_CONFIG.apiUrl.includes('COLLE')) { const m="URL API non configurée!"; showGlobalMessage(m,'error',0); throw new Error(m); } try { const url = `${API_CONFIG.apiUrl}?module=tarifs`; const c=new AbortController(); const t=setTimeout(()=>c.abort(),45000); const r=await fetch(url,{method:'GET',signal:c.signal}); clearTimeout(t); const l=document.querySelector('#global-message-area-tarifs .alert-info'); if(l)l.remove(); if (!r.ok){let txt=await r.text(); try{const j=JSON.parse(txt); if(j.error&&j.message)txt=j.message;}catch(e){} throw new Error(`Erreur API ${r.status}: ${txt}`);} const data = await r.json(); if (data.error){throw new Error(data.message||"Erreur API");} if (!data||typeof data!=='object'||!Array.isArray(data.gridData)||!Array.isArray(data.partners)||!Array.isArray(data.categories)||!Array.isArray(data.plans)||typeof data.partnerPlanMap!=='object'||typeof data.categoryPlanMap!=='object'){ throw new Error("Structure données tarifs invalide."); } processFetchedData(data); tariffsDataCache.data=data; tariffsDataCache.timestamp=now; showGlobalMessage("Configuration chargée.", "success", 4000); return data; } catch (error){ console.error("Erreur fetch/process:", error); showGlobalMessage(`Erreur critique: ${error.message}.`, 'error', 0); throw error; }
}

function processFetchedData(data) {
    // ... (Fonction processFetchedData comme dans script.js v4, peuple les structures globales) ...
     console.log("Début traitement données reçues..."); clearProcessedData(); if (data.baseRates) baseRatesByDate = new Map(Object.entries(data.baseRates)); if (data.travcoBaseRates) travcoBaseRatesByDate = new Map(Object.entries(data.travcoBaseRates)); const structureData = data.tariffStructure || []; const partnerData = data.partners || []; const catIdx=0, planIdx=1, partCol=0, planPartCol=1; if(structureData.length>1){for(let i=1; i<structureData.length; i++){const row=structureData[i]; if(!row||row.length<2)continue; const cat=String(row[catIdx]||'').trim(); const plan=String(row[planIdx]||'').trim(); if(cat&&plan){allCategories.add(cat); allPlans.add(plan); if(!categoryToPlansMap.has(cat)){categoryToPlansMap.set(cat, new Set()); originalPlanOrder[cat]=[];} if(!categoryToPlansMap.get(cat).has(plan)){categoryToPlansMap.get(cat).add(plan); originalPlanOrder[cat].push(plan);} if(!planToCategoriesMap.has(plan))planToCategoriesMap.set(plan, new Set()); planToCategoriesMap.get(plan).add(cat);}}} if(partnerData.length>1){const missingPlanWarn=new Set(); for(let i=1; i<partnerData.length; i++){const row=partnerData[i]; if(!row||row.length<2)continue; const partner=String(row[partCol]||'').trim(); const planStr=String(row[planPartCol]||'').trim(); const planCode=getPlanCodeFromPartnerString(planStr); if(partner&&planCode){allPartners.add(partner); if(!partnerToPlansMap.has(partner))partnerToPlansMap.set(partner,new Set()); if(allPlans.has(planCode))partnerToPlansMap.get(partner).add(planCode); else if(!missingPlanWarn.has(planCode)){console.warn(`Plan '${planCode}' partenaire '${partner}' non trouvé dans Tarifs.`); missingPlanWarn.add(planCode);}}else if(partner||planStr)console.warn(`Ligne partenaire invalide: ${row}`);} if(missingPlanWarn.size>0)showGlobalMessage(`${missingPlanWarn.size} plan(s) partenaire(s) ignoré(s) (non trouvés dans Tarifs). Voir console.`, 'warning', 10000);} console.log(`Traitement terminé: ${allCategories.size} cat, ${allPlans.size} plans, ${allPartners.size} part.`);
}

function clearProcessedData() { baseRatesByDate.clear(); travcoBaseRatesByDate.clear(); partnerToPlansMap.clear(); planToCategoriesMap.clear(); categoryToPlansMap.clear(); allPartners.clear(); allCategories.clear(); allPlans.clear(); originalPlanOrder = {}; }
function getPlanCodeFromPartnerString(str) { if (!str) return null; const m=/\(([^)]+)\)$/.exec(str); return m?m[1].trim():str; } // Simplifié

// --- Mise à Jour des Dropdowns ---
function populateSelect(selectElementId, options, defaultText, addAllOption = false, allValue = "all", allText = "Tous / Aucun") {
    const select = document.getElementById(selectElementId);
    if (!select) { console.warn(`Select #${selectElementId} non trouvé.`); return; }
    const currentVal = select.value; select.innerHTML = ''; select.disabled = true;
    const defaultOpt = document.createElement('option'); defaultOpt.value = ""; defaultOpt.textContent = defaultText; defaultOpt.disabled = true; defaultOpt.selected = true; select.appendChild(defaultOpt);
    if (addAllOption) { const opt = document.createElement('option'); opt.value = allValue; opt.textContent = allText; select.appendChild(opt); }
    let foundCurrent = false; let optionAdded = false;
    options.forEach(item => { const option = document.createElement('option'); option.value = item; option.textContent = item; if (item === currentVal) { option.selected = true; foundCurrent = true; } select.appendChild(option); optionAdded = true; });
    select.value = foundCurrent ? currentVal : (addAllOption ? allValue : "");
    select.disabled = !optionAdded && !addAllOption; // Désactivé si vide (sauf si "Tous" existe)
    if (select.id.includes('-rate-plan')) updateRatePlanHelp(select.value, select.id.replace('rate-plan', 'rate-plan-help'));
}

function updateDropdowns(triggerId) {
    if (allCategories.size === 0) return; // Ne rien faire si pas de données
    const form = document.getElementById(triggerId)?.closest('form');
    if (!form) return;
    const prefix = form.id.replace('-form', '');

    const partnerSelect = document.getElementById(`${prefix}-partner`);
    const categorySelect = document.getElementById(`${prefix}-room-category`);
    const planSelects = form.querySelectorAll(`select[id^="${prefix}-rate-plan"]`);

    const selectedPartner = partnerSelect?.value || 'all';
    const currentCategory = categorySelect?.value || null; // Catégorie sélectionnée actuellement

    // 1. Met à jour Catégories (si déclencheur est le partenaire)
    if (triggerId.includes('-partner')) {
        let validCategories = new Set(allCategories);
        if (selectedPartner !== 'all') {
            const partnerPlans = partnerToPlansMap.get(selectedPartner) || new Set();
            if (partnerPlans.size === 0) validCategories = new Set();
            else validCategories = new Set([...allCategories].filter(cat => [...(categoryToPlansMap.get(cat) || new Set())].some(plan => partnerPlans.has(plan))));
        }
        populateSelect(`${prefix}-room-category`, [...validCategories], "Sélectionnez Catégorie", false, "", "", currentCategory); // Garde la sélection si possible
    }

     // 2. Met à jour Plans (toujours, basé sur catégorie et partenaire actuels)
    const finalSelectedCategory = categorySelect?.value || null; // Relire après mise à jour potentielle
    let validPlans = new Set();
    if (finalSelectedCategory) {
        const categoryPlans = categoryToPlansMap.get(finalSelectedCategory) || new Set();
        if (selectedPartner === 'all') validPlans = categoryPlans;
        else { const partnerPlans = partnerToPlansMap.get(selectedPartner) || new Set(); validPlans = new Set([...categoryPlans].filter(plan => partnerPlans.has(plan))); }
    }

    let orderedPlans = []; const orderKey = finalSelectedCategory || ABSOLUTE_BASE_CATEGORY_NAME;
    if (originalPlanOrder[orderKey]) { orderedPlans = originalPlanOrder[orderKey].filter(p => validPlans.has(p)); const remaining = [...validPlans].filter(p => !orderedPlans.includes(p)).sort((a,b)=>a.localeCompare(b)); orderedPlans = [...orderedPlans, ...remaining];}
    else { orderedPlans = [...validPlans].sort((a,b)=>a.localeCompare(b)); }

    planSelects.forEach(select => {
        const currentPlan = select.value;
        populateSelect(select.id, orderedPlans, "Sélectionnez Plan", false, "", "", currentPlan);
        select.disabled = !finalSelectedCategory || orderedPlans.length === 0;
        if (select.disabled) {
            select.innerHTML = `<option value="" disabled selected>${finalSelectedCategory ? 'Aucun plan compatible' : 'Choisissez Catégorie'}</option>`;
            updateRatePlanHelp('', select.id.replace('-rate-plan', '-help')); // Vide l'aide aussi
        }
    });
     // Cas spécial Compare Avancé : peupler les deux selects plan
     if (prefix === 'compare-adv') {
        updateRatePlanHelp(document.getElementById('compare-adv-rate-plan1')?.value || '', 'compare-adv-rate-plan1-help');
        updateRatePlanHelp(document.getElementById('compare-adv-rate-plan2')?.value || '', 'compare-adv-rate-plan2-help');
     }
}

// --- Fonctions de Calcul (Comme avant, utilisent les Maps/Sets globaux) ---
// findAbsoluteBaseRate, calculateDailyRate, calculateDetailedCost, compareDetailedCosts...
// ... (COPIEZ les fonctions de calcul depuis la v7 Stable) ...
function findAbsoluteBaseRate(requestedDate) { /* ... utilise baseRatesByDate ... */ }
function calculateDailyRate(date, requestedCategory, requestedPlan) { /* ... utilise findAbsoluteOtaBaseRate, findAbsoluteTravcoBaseRate ... */ }
async function calculateDetailedCost(formData) { /* ... utilise calculateDailyRate ... */ }
async function compareDetailedCosts(formData) { /* ... utilise calculateDailyRate ... */ }
async function compareAdvancedCosts(formData) { // NOUVELLE fonction pour la comparaison avancée
    const resultDivId = 'compare-adv-results';
    showLoading(resultDivId, "Comparaison avancée...");
    if (baseRatesByDate.size === 0) { try { await fetchAndProcessData(); } catch (error) { hideResult(resultDivId); return null; } if (baseRatesByDate.size === 0) { showGlobalMessage("Données indisponibles.", "error"); hideResult(resultDivId); return null; } }
    let stayDates; try { stayDates = generateStayDates(formData.arrivalDate, formData.endDate); } catch (e) { showGlobalMessage(e.message, 'error'); hideResult(resultDivId); return null; }
    const comparisonResults = []; let missingRateWarning = false; let totalRate1 = 0; let totalRate2 = 0; let firstMissingDate = null;
    const chartLabels = []; const chartData1 = []; const chartData2 = [];

    for (const date of stayDates) {
        const dateStr = formatDateYYYYMMDD(date);
        // Note: calculateDailyRate gère déjà l'absence de tarif base en retournant null
        const rate1 = calculateDailyRate(date, formData.roomCategory, formData.ratePlan1);
        const rate2 = calculateDailyRate(date, formData.roomCategory, formData.ratePlan2);
        let diff = null;
        let baseRateForDay = findAbsoluteOtaBaseRate(date); // Base OTA pour référence table

        if (rate1 === null || rate2 === null) {
            missingRateWarning = true; if (!firstMissingDate) firstMissingDate = formatDateLocale(date);
        } else {
            diff = Math.round((rate1 - rate2) * 100) / 100;
            totalRate1 += rate1; totalRate2 += rate2;
        }
        // Pour le graph, on met NaN si une valeur manque pour ce jour
        chartLabels.push(dateStr);
        chartData1.push(rate1 === null ? NaN : rate1);
        chartData2.push(rate2 === null ? NaN : rate2);

        comparisonResults.push({ date: formatDateLocale(date), baseRateValue: baseRateForDay, rate1: rate1, rate2: rate2, diff: diff });
    }
    totalRate1 = Math.round(totalRate1 * 100) / 100; totalRate2 = Math.round(totalRate2 * 100) / 100;
    const totalDiff = Math.round((totalRate1 - totalRate2) * 100) / 100;
    if (missingRateWarning) { showGlobalMessage(`Tarif base manquant dès ${firstMissingDate}. Comparaison incomplète.`, "warning", 10000); }

    return { dailyComparison: comparisonResults, totalRate1: totalRate1, totalRate2: totalRate2, totalDiff: totalDiff, missingRateWarning: missingRateWarning, chartLabels, chartData1, chartData2 };
}


// --- Fonctions d'Affichage des Résultats ---
// (displayCalculateResult, displayVerifyResult, displayCompareResult comme dans v7 Stable + Modifs Texte/Style)
function displayCalculateResult(formData, result) { /* ... Collez depuis v7 Stable + Modifs ... */ }
function displayVerifyResult(formData, calculatedResult) { /* ... Collez depuis v7 Stable + Modifs ... */ }
function displayCompareResult(formData, result) { /* ... Collez depuis v7 Stable + Modifs ... */ }
// NOUVELLE fonction pour affichage comparaison avancée
function displayCompareAdvResult(formData, result) {
    const resultsContainer = document.getElementById('compare-adv-results');
    const tableContainer = document.getElementById('comparisonAdvTableContainer');
    const chartCanvas = document.getElementById('comparisonAdvChart');
    if (!resultsContainer || !tableContainer || !chartCanvas) return;

    // Affichage Tableau
    const tableRows = result.dailyComparison.map(day => { const base=day.baseRateValue!==null?day.baseRateValue.toFixed(2)+'€':'<i class="fas fa-times-circle text-red-500 text-xs"></i>'; const r1=day.rate1!==null?day.rate1.toFixed(2)+'€':'<i class="fas fa-times-circle text-red-500 text-xs"></i>'; const r2=day.rate2!==null?day.rate2.toFixed(2)+'€':'<i class="fas fa-times-circle text-red-500 text-xs"></i>'; let diff='<span class="text-gray-500">-</span>'; if(day.diff!==null){const d=day.diff.toFixed(2); const c=day.diff>0?'text-red-400':(day.diff<0?'text-green-400':'text-gray-400'); diff=`<span class="${c} font-medium">${day.diff>=0?'+':''}${d}€</span>`;} return `<tr><td class="px-3 py-2 text-sm">${day.date}</td><td class="px-3 py-2 text-end text-sm text-gray-400">${base}</td><td class="px-3 py-2 text-end text-sm">${r1}</td><td class="px-3 py-2 text-end text-sm">${r2}</td><td class="px-3 py-2 text-end text-sm">${diff}</td></tr>`;}).join('');
    const headerP1 = formData.ratePlan1 || 'Plan 1'; const headerP2 = formData.ratePlan2 || 'Plan 2';
    tableContainer.innerHTML = `<div class="overflow-y-auto max-h-96"><table class="min-w-full divide-y divide-gray-700 table"><thead class="bg-darker-charcoal sticky top-0 z-10"><tr><th class="th-style text-left">Date</th><th class="th-style text-end">Base OTA</th><th class="th-style text-end">${headerP1} (${formData.partner1 || 'Tous'})</th><th class="th-style text-end">${headerP2} (${formData.partner2 || 'Tous'})</th><th class="th-style text-end">Écart</th></tr></thead><tbody class="divide-y divide-gray-700 bg-charcoal-dark/40">${tableRows}</tbody><tfoot class="bg-darker-charcoal/80 font-semibold text-gray-100"><tr class="border-t-2 border-gray-600"><td class="px-3 py-2 text-sm text-left" colspan="2">Total Période</td><td class="px-3 py-2 text-end text-sm">${result.totalRate1.toFixed(2)}€</td><td class="px-3 py-2 text-end text-sm">${result.totalRate2.toFixed(2)}€</td><td class="px-3 py-2 text-end text-sm ${result.totalDiff > 0 ? 'text-red-400' : (result.totalDiff < 0 ? 'text-green-400' : 'text-gray-400')}">${result.totalDiff >= 0 ? '+' : ''}${result.totalDiff.toFixed(2)}€</td></tr></tfoot></table></div>`;

    // Affichage Graphique
    const ctx = chartCanvas.getContext('2d'); if (comparisonAdvChartInstance) comparisonAdvChartInstance.destroy();
    const chartContainer = chartCanvas.parentNode; const noDataMsgElement = chartContainer.querySelector('.no-chart-data'); if(noDataMsgElement) noDataMsgElement.remove();
    if (result.chartLabels.length === 0) { chartCanvas.style.display = 'none'; if(chartContainer) chartContainer.insertAdjacentHTML('beforeend', `<p class="text-center text-gray-500 p-4 no-chart-data">Données insuffisantes.</p>`); return;}
    else { chartCanvas.style.display = 'block'; }
    comparisonAdvChartInstance = new Chart(ctx, {
        type:'line', data:{labels:result.chartLabels, datasets:[ {label:`${formData.ratePlan1} (${formData.partner1||'Tous'})`, data:result.chartData1, borderColor:'#F97316', backgroundColor:'rgba(249,115,22,0.1)', tension:0.1, borderWidth:2, pointRadius:3, pointBackgroundColor:'#F97316', fill:'origin', spanGaps:false}, {label:`${formData.ratePlan2} (${formData.partner2||'Tous'})`, data:result.chartData2, borderColor:'#3B82F6', backgroundColor:'rgba(59,130,246,0.1)', tension:0.1, borderWidth:2, pointRadius:3, pointBackgroundColor:'#3B82F6', fill:'origin', spanGaps:false} ]},
        options: { responsive:true, maintainAspectRatio:false, scales:{ x:{ type:'time', time:{unit:'day', tooltipFormat:'dd MMM yy', displayFormats:{day:'dd/MM'}}, ticks:{color:'#a0aec0'}, grid:{color:'rgba(74, 85, 104, 0.3)'}}, y:{beginAtZero:false, ticks:{color:'#a0aec0', callback:function(v){return v+'€';}}, grid:{color:'rgba(74, 85, 104, 0.3)'}} }, plugins:{ legend:{display:true, labels:{color:'#cbd5e0'}}, tooltip:{backgroundColor:'rgba(45,55,72,0.9)', titleColor:'#f7fafc', bodyColor:'#cbd5e0', callbacks:{label:function(c){return `${c.dataset.label}: ${c.parsed.y.toFixed(2)}€`;}}}} }
    });

    resultsContainer.classList.remove('hidden');
}
// ==========================================================================
// ==             ACTIVATION/DÉSACTIVATION FORMULAIRES                 ==
// ==========================================================================

function disableAllForms() {
    console.log("Désactivation des formulaires et choix...");
    const choiceSection = document.getElementById('choice-section');
    if (choiceSection) {
        choiceSection.style.opacity = '0.5';
        choiceSection.style.pointerEvents = 'none';
    }
    ['calculate', 'verify', 'compare', 'compare-adv'].forEach(prefix => {
        const form = document.getElementById(`${prefix}-form`);
        if (form) {
            form.querySelectorAll('input, select, button').forEach(el => {
                 // Ne pas désactiver le bouton retour pour pouvoir revenir en arrière
                 if (!el.classList.contains('btn-back')) {
                    el.disabled = true;
                 }
            });
             // Vider les selects (sauf partenaire qui a l'option "Tous")
             form.querySelectorAll('select:not([id$="-partner"])').forEach(s => {
                  s.innerHTML = `<option value="">...</option>`;
             });
        }
        hideResult(`${prefix}-result` + (prefix==='compare-adv' ? 's' : '')); // Cache résultat
    });
}

function enableAllForms() {
    console.log("Activation formulaires et peuplement initial options...");
    const choiceSection = document.getElementById('choice-section');
    if (choiceSection) {
        choiceSection.style.opacity = '1';
        choiceSection.style.pointerEvents = 'auto';
    }

    // Peuple Partenaires et Catégories partout
    const allPartnerSelects = document.querySelectorAll('select[id$="-partner"]');
    allPartnerSelects.forEach(select => {
         populateSelect(select.id, [...allPartners], "Sélectionnez Partenaire...", true, "all", "Tous / Aucun");
         select.disabled = false;
    });
    const allCategorySelects = document.querySelectorAll('select[id$="-room-category"]');
     allCategorySelects.forEach(select => {
         populateSelect(select.id, [...allCategories], "Sélectionnez Catégorie");
         select.disabled = false; // Active catégorie
         // Pré-sélection
        if((select.id === 'calculate-room-category' || select.id === 'verify-room-category' || select.id === 'compare-room-category' || select.id === 'compare-adv-room-category') && allCategories.has(ABSOLUTE_BASE_CATEGORY_NAME)) {
             select.value = ABSOLUTE_BASE_CATEGORY_NAME;
        }
     });

    // Active les autres inputs/boutons (sauf plans qui dépendent des filtres)
    ['calculate', 'verify', 'compare', 'compare-adv'].forEach(prefix => {
        const form = document.getElementById(`${prefix}-form`);
        if (form) {
            form.querySelectorAll('input[type="date"], input[type="number"], button').forEach(el => el.disabled = false);
            // Initialise l'état des plans (sera probablement désactivé au début)
             handleFilterChange(`${prefix}-room-category`); // Déclenche màj plans basée sur catégorie initiale
        }
    });

     // Défaut Plan pour Calculer et Vérifier après initialisation des plans
     ['calculate','verify'].forEach(prefix => {
          const planSelect = document.getElementById(`${prefix}-rate-plan`);
          if (planSelect && planSelect.querySelector(`option[value="${BASE_RATE_PLAN_NAME}"]`)) {
               planSelect.value = BASE_RATE_PLAN_NAME;
               updateRatePlanHelp(BASE_RATE_PLAN_NAME, `${prefix}-rate-plan-help`);
          } else if(planSelect && planSelect.options.length > 1 && planSelect.options[1]) {
               // Si le plan base n'est pas une option valide, sélectionne le premier plan disponible
               planSelect.value = planSelect.options[1].value;
               updateRatePlanHelp(planSelect.value, `${prefix}-rate-plan-help`);
          }
     });
}

// --- Validation de Formulaire ---
function validateForm(formData, mode = 'calculate') { /* ... Votre code de validation ... */ }

// --- Initialisation et Écouteurs d'Événements ---
// ... (Le reste de votre code DOMContentLoaded, y compris l'appel à disableAllForms au début,
//      l'appel à enableAllForms après fetchAndProcessData, et les appels à setupFormListeners) ...

// --- Validation de Formulaire ---
function validateForm(formData, mode = 'calculate') { /* ... (Identique v7) ... */ }

// --- Initialisation et Écouteurs ---
document.addEventListener('DOMContentLoaded', async () => {
    const choiceSection=document.getElementById('choice-section'), calculateSection=document.getElementById('calculate-section'), verifySection=document.getElementById('verify-section'), compareSection=document.getElementById('compare-section'), compareAdvSection=document.getElementById('compare-adv-section'); // Ajout Adv
    const calculateForm=document.getElementById('calculate-form'), verifyForm=document.getElementById('verify-form'), compareForm=document.getElementById('compare-form'), compareAdvForm=document.getElementById('compare-adv-form'); // Ajout Adv
    if (!choiceSection||!calculateSection||!verifySection||!compareSection||!compareAdvSection||!calculateForm||!verifyForm||!compareForm||!compareAdvForm) { console.error("FATAL: Elements HTML manquants!"); return; }

    const today=new Date(), yyyy=today.getFullYear(), mm=String(today.getMonth()+1).padStart(2,'0'), dd=String(today.getDate()).padStart(2,'0'), todayStr=`${yyyy}-${mm}-${dd}`;
    ['calculate-arrival-date', 'verify-arrival-date', 'compare-arrival-date', 'compare-adv-start-date'].forEach(id=>{const i=document.getElementById(id); if(i&&i.type==='date')try{i.value=todayStr;}catch(e){}});
    const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 6);
    const nextWeekStr = formatDateYYYYMMDD(nextWeek);
    const compareAdvEndDate = document.getElementById('compare-adv-end-date'); if (compareAdvEndDate) compareAdvEndDate.value = nextWeekStr;


    disableAllForms(); // Désactive tout

    try {
        await fetchAndProcessData(); // Charge et traite
        enableAllForms(); // Réactive
        setupChoiceListeners(); setupBackButtons();
        setupFormListeners('calculate'); setupFormListeners('verify'); setupFormListeners('compare'); setupFormListeners('compare-adv'); // Ajout Adv
        showGlobalMessage("Interface prête.", "success", 4000);
    } catch (error) { /* Erreur déjà gérée */ }

}); // Fin DOMContentLoaded


function setupChoiceListeners() {
    const choiceSection=document.getElementById('choice-section'), calculateSection=document.getElementById('calculate-section'), verifySection=document.getElementById('verify-section'), compareSection=document.getElementById('compare-section'), compareAdvSection=document.getElementById('compare-adv-section');
     document.querySelectorAll('.choice-card[data-target]').forEach(card => { card.addEventListener('click', () => { const targetId = card.getAttribute('data-target'); const targetSection = document.getElementById(targetId); if (targetSection && choiceSection) { console.log(`Affichage section: ${targetId}`); choiceSection.classList.add('hidden'); [calculateSection, verifySection, compareSection, compareAdvSection].forEach(sec => sec.classList.add('hidden')); targetSection.classList.remove('hidden'); hideResult('calculate-result'); hideResult('verify-result'); hideResult('compare-result'); hideResult('compare-adv-results'); } else console.error(`Cible invalide: ${targetId}`); }); });
}
function setupBackButtons() {
     const choiceSection=document.getElementById('choice-section'), calculateSection=document.getElementById('calculate-section'), verifySection=document.getElementById('verify-section'), compareSection=document.getElementById('compare-section'), compareAdvSection=document.getElementById('compare-adv-section');
     document.querySelectorAll('.btn-back').forEach(btn=>{btn.addEventListener('click', ()=>{ if(choiceSection)choiceSection.classList.remove('hidden'); [calculateSection, verifySection, compareSection, compareAdvSection].forEach(sec => sec.classList.add('hidden')); hideResult('calculate-result'); hideResult('verify-result'); hideResult('compare-result'); hideResult('compare-adv-results');});});
}

function setupFormListeners(formPrefix) {
    console.log(`Attaching listeners for prefix: ${formPrefix}`);
    const formElement = document.getElementById(`${formPrefix}-form`);
    if (!formElement || formElement.dataset.listenersAttached === 'true') { console.warn(`Listeners déjà attachés ou formulaire ${formPrefix} non trouvé.`); return; }

    // Listeners spécifiques pour chaque section
    if (formPrefix === 'calculate' || formPrefix === 'verify') {
        document.getElementById(`${formPrefix}-room-category`)?.addEventListener('change', (e) => updateRatePlansForCategory(e.target.id, `${formPrefix}-rate-plan`, `${formPrefix}-rate-plan-help`));
        document.getElementById(`${formPrefix}-rate-plan`)?.addEventListener('change', e => { updateRatePlanHelp(e.target.value, `${formPrefix}-rate-plan-help`); });
    } else if (formPrefix === 'compare') {
        document.getElementById('compare-room-category')?.addEventListener('change', (e) => { updateRatePlansForCategory(e.target.id, 'compare-rate-plan-1', 'compare-rate-plan-1-help'); updateRatePlansForCategory(e.target.id, 'compare-rate-plan-2', 'compare-rate-plan-2-help'); });
        document.getElementById('compare-rate-plan-1')?.addEventListener('change', e => { updateRatePlanHelp(e.target.value, 'compare-rate-plan-1-help'); });
        document.getElementById('compare-rate-plan-2')?.addEventListener('change', e => { updateRatePlanHelp(e.target.value, 'compare-rate-plan-2-help'); });
    } else if (formPrefix === 'compare-adv') {
        document.getElementById('compare-adv-room-category')?.addEventListener('change', (e) => { updatePartnerOptionsForCategory(e.target.value); updatePlanOptionsForPartner('compare-adv-partner1', 'compare-adv-rate-plan1'); updatePlanOptionsForPartner('compare-adv-partner2', 'compare-adv-rate-plan-2'); });
        document.getElementById('compare-adv-partner1')?.addEventListener('change', (e) => { updatePlanOptionsForPartner(e.target.id, 'compare-adv-rate-plan1'); });
        document.getElementById('compare-adv-partner2')?.addEventListener('change', (e) => { updatePlanOptionsForPartner(e.target.id, 'compare-adv-rate-plan-2'); });
        document.getElementById('compare-adv-rate-plan1')?.addEventListener('change', e => { updateRatePlanHelp(e.target.value, 'compare-adv-rate-plan1-help'); });
        document.getElementById('compare-adv-rate-plan2')?.addEventListener('change', e => { updateRatePlanHelp(e.target.value, 'compare-adv-rate-plan2-help'); });
    }

    // Listener de soumission commun
    formElement.addEventListener('submit', async (e) => {
         e.preventDefault(); const resultDivId = `${formPrefix}-result` + (formPrefix === 'compare-adv' ? 's' : ''); hideResult(resultDivId); showLoading(resultDivId, "Traitement..."); let formData = { formPrefix: formPrefix }; let validationMode = formPrefix;
         try { /* Récupération données formulaire */ formData.arrivalDate = getElementValue(`${formPrefix}-arrival-date`); formData.nights = getElementValueAsInt(`${formPrefix}-nights`); formData.roomCategory = getElementValue(`${formPrefix}-room-category`); if (formPrefix === 'calculate' || formPrefix === 'verify') { formData.ratePlan = getElementValue(`${formPrefix}-rate-plan`); formData.discount = getElementValueAsFloat(`${formPrefix}-discount`) ?? 0; if (formPrefix === 'verify') formData.receivedTotal = getElementValue('received-total'); } else if (formPrefix === 'compare') { formData.ratePlan1 = getElementValue('compare-rate-plan-1'); formData.ratePlan2 = getElementValue('compare-rate-plan-2'); } else if (formPrefix === 'compare-adv') { formData.endDate = getElementValue('compare-adv-end-date'); formData.partner1 = getElementValue('compare-adv-partner1'); formData.ratePlan1 = getElementValue('compare-adv-rate-plan1'); formData.partner2 = getElementValue('compare-adv-partner2'); formData.ratePlan2 = getElementValue('compare-adv-rate-plan-2'); validationMode = 'compare-adv'; /* Valider P1/P2 etc. */ } const validation = validateForm(formData, validationMode); if (!validation.isValid) { showGlobalMessage(`Erreurs Formulaire ${formPrefix}:\n- ${validation.errors.join('\n- ')}`, 'warning'); hideResult(resultDivId); return; } let resultData = null; if (formPrefix === 'calculate') { resultData = await calculateDetailedCost(formData); if (resultData) displayCalculateResult(formData, resultData); } else if (formPrefix === 'verify') { resultData = await calculateDetailedCost(formData); if (resultData) displayVerifyResult(formData, resultData); } else if (formPrefix === 'compare') { resultData = await compareDetailedCosts(formData); if (resultData) displayCompareResult(formData, resultData); } else if (formPrefix === 'compare-adv') { resultData = await compareAdvancedCosts(formData); if (resultData) displayCompareAdvResult(formData, resultData); } if (!resultData) { hideResult(resultDivId); } } catch (error) { console.error(`Erreur submit ${formPrefix}:`, error); showGlobalMessage(`Erreur ${formPrefix}: ${error.message}`, 'error'); hideResult(resultDivId); }
    });
    formElement.dataset.listenersAttached = 'true'; console.log(`Listeners attachés pour ${formPrefix}.`);
}