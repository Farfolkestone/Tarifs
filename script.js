// ==========================================================================
// ==                          CONFIGURATION TARIFS                        ==
// ==========================================================================
const API_CONFIG = {
    // !! IMPORTANT !!
    // REMPLACE CETTE URL PAR CELLE OBTENUE APRÈS LE DÉPLOIEMENT DE TON NOUVEAU SCRIPT GOOGLE APPS (Code.gs)
    // Le format sera : https://script.google.com/macros/s/VOTRE_ID_DEPLOIEMENT/exec
    apiUrl: 'https://script.google.com/macros/s/AKfycbyeP_sn8L_2g7f_R7wcDPBsbuyNbtMWJWmPZIXRWDEgUROdj2I5eS8wMKVixOpeSjYxhg/exec', // <--- METS TON URL ICI !
};
const sheetDataCache = {
    timestamp: null,
    data: null, // Contiendra { baseRates:{}, travcoBaseRates:{}, tariffStructure:[], partners:[] }
    ttl: 0 // Cache de 15 minutes
};

// Références pour calculs et affichage
const ABSOLUTE_BASE_CATEGORY_NAME = 'Double Classique'; // Utilisé pour les tarifs de base OTA
const BASE_RATE_PLAN_NAME = 'OTA-RO-FLEX'; // Le plan de référence OTA
const TRAVCO_BASE_CATEGORY = 'Double Classique'; // Référence pour les calculs Travco
const TRAVCO_BASE_PLAN = 'TRAVCO-BB-FLEX-NET'; // Le plan de référence Travco

// Descriptions des plans pour l'aide contextuelle (Gardé tel quel)
const ratePlanDescriptions = {
    'OTA-RO-FLEX': 'Chambre Seule, Flexible',
    'OTA-RO-NANR': 'Chambre Seule, Non-Annulable',
    'OTA-BB-FLEX-1P': 'Petit Déj. inclus (1p), Flexible',
    'OTA-BB-FLEX-2P': 'Petit Déj. inclus (2p), Flexible',
    'OTA-BB-FLEX-4P': 'Petit Déj. inclus (4p), Flexible',
    'OTA-BB-NANR-1P': 'Petit Déj. inclus (1p), Non-Annulable',
    'OTA-BB-NANR-2P': 'Petit Déj. inclus (2p), Non-Annulable',
    'OTA-BB-NANR-4P': 'Petit Déj. inclus (4p), Non-Annulable',
    'MOBILE-RO-FLEX': 'Mobile - Chambre Seule, Flexible',
    'MOBILE-RO-NANR': 'Mobile - Chambre Seule, Non-Annulable',
    'MOBILE-BB-FLEX-1-P': 'Mobile - Petit Déj. inclus (1p), Flexible',
    'MOBILE-BB-FLEX-1P': 'Mobile - Petit Déj. inclus (1p), Flexible',
    'MOBILE-BB-FLEX-2P': 'Mobile - Petit Déj. inclus (2p), Flexible',
    'MOBILE-BB-FLEX-4P': 'Mobile - Petit Déj. inclus (4p), Flexible',
    'MOBILE-BB-NANR-1P': 'Mobile - Petit Déj. inclus (1p), Non-Annulable',
    'MOBILE-BB-NANR-2P': 'Mobile - Petit Déj. inclus (2p), Non-Annulable',
    'MOBILE-BB-NANR-4P': 'Mobile - Petit Déj. inclus (4p), Non-Annulable',
    'VIP-RATE-FLEX': 'VIP - Chambre Seule, Flexible',
    'VIP-RO-FLEX': 'VIP - Chambre Seule, Flexible', // Alias
    'VIP-RO-NANR': 'VIP - Chambre Seule, Non-Annulable',
    'VIP-BB-FLEX-1P': 'VIP - Petit Déj. inclus (1p), Flexible',
    'VIP-BB-FLEX-2P': 'VIP - Petit Déj. inclus (2p), Flexible',
    'VIP-BB-FLEX-4P': 'VIP - Petit Déj. inclus (4p), Flexible',
    'VIP-BB-NANR-1P': 'VIP - Petit Déj. inclus (1p), Non-Annulable',
    'VIP-BB-NANR-2P': 'VIP - Petit Déj. inclus (2p), Non-Annulable',
    'VIP-BB-NANR-4P': 'VIP - Petit Déj. inclus (4p), Non-Annulable',
    'HB-RO-FLEX-BRUT': 'Hotelbeds RO Flex Brut',
    'TO-RO-FLEX-NET': 'TO RO Flex Net',
    'TO-RO-NANR-BRUT': 'TO RO NANR Brut',
    'TO-RO-NANR-NET': 'TO RO NANR Net',
    'TO-BB-FLEX-BRUT-1P': 'TO BB Flex Brut 1P',
    'TO-BB-FLEX-BRUT-2P': 'TO BB Flex Brut 2P',
    'TO-BB-FLEX-BRUT-4P': 'TO BB Flex Brut 4P',
    'TO-BB-NANR-BRUT-1P': 'TO BB NANR Brut 1P',
    'TO-BB-NANR-BRUT-2P': 'TO BB NANR Brut 2P',
    'TO-BB-NANR-BRUT-4P': 'TO BB NANR Brut 4P',
    'TO-BB-FLEX-NET-1P': 'TO BB Flex Net 1P',
    'TO-BB-FLEX-NET-2P': 'TO BB Flex Net 2P',
    'TO-BB-FLEX-NET-4P': 'TO BB Flex Net 4P',
    'TO-BB-NANR-NET-1P': 'TO BB NANR Net 1P',
    'TO-BB-NANR-NET-2P': 'TO BB NANR Net 2P',
    'TO-BB-NANR-NET-4P': 'TO BB NANR Net 4P',
    'HOTUSA-RO-FLEX': 'Hotusa RO Flex',
    'HOTUSA-RO-NANR': 'Hotusa RO NANR',
    'HOTUSA-BB-FLEX-1P': 'Hotusa BB Flex 1P',
    'HOTUSA-BB-FLEX-2P': 'Hotusa BB Flex 2P',
    'HOTUSA-BB-FLEX-4P': 'Hotusa BB Flex 4P',
    'HOTUSA-BB-NANR-1P': 'Hotusa BB NANR 1P',
    'HOTUSA-BB-NANR-2P': 'Hotusa BB NANR 2P',
    'HOTUSA-BB-NANR-4P': 'Hotusa BB NANR 4P',
    'FB-CORPO-RO-FLEX': 'FB Corpo RO Flex',
    'FB-CORPO-BB-FLEX-1P': 'FB Corpo BB Flex 1P',
    'FB-CORPO-BB-FLEX-2P': 'FB Corpo BB Flex 2P',
    'FB-CORPO-BB-FLEX-4P': 'FB Corpo BB Flex 4P',
    'AMEX-GBT': 'AMEX GBT',
    'AMEX-GBT - AMEX GBT': 'AMEX GBT (Alt)',
    'CWT-BB-FLEX': 'CWT BB Flex',
    'PKG-EXP-RO-FLEX': 'Package Expedia RO Flex',
    'PKG-EXP-RO-NANR': 'Package Expedia RO NANR',
    'PKG-EXP-BB-FLEX-1P': 'Package Expedia BB Flex 1P',
    'PKG-EXP-BB-FLEX-2P': 'Package Expedia BB Flex 2P',
    'PKG-EXP-BB-FLEX-4P': 'Package Expedia BB Flex 4P',
    'PKG-EXP-BB-NANR-1P': 'Package Expedia BB NANR 1P',
    'PKG-EXP-BB-NANR-2P': 'Package Expedia BB NANR 2P',
    'PKG-EXP-BB-NANR-4P': 'Package Expedia BB NANR 4P',
    'PROMO-TO-RO-FLEX': 'Promo TO RO Flex',
    'PROMO-TO-RO-NANR': 'Promo TO RO NANR',
    'PROMO-TO-BB-1-FLEX': 'Promo TO BB 1P Flex',
    'PROMO-TO-BB-1P-FLEX': 'Promo TO BB 1P Flex', // Alias
    'PROMO-TO-BB-1P-NANR': 'Promo TO BB 1P NANR',
    'PROMO-TO-BB-2P-FLEX': 'Promo TO BB 2P Flex',
    'PROMO-TO-BB-2P-NANR': 'Promo TO BB 2P NANR',
    'PROMO-TO-BB-4P-FLEX': 'Promo TO BB 4P Flex',
    'PROMO-TO-BB-4P-NANR': 'Promo TO BB 4P NANR',
    'PROMO-HB-RO-FLEX': 'Promo HB RO Flex',
    'PROMO-HB-RO-NANR': 'Promo HB RO NANR',
    'PROMO-HB-BB-FLEX-1P': 'Promo HB BB Flex 1P',
    'PROMO-HB-BB-FLEX-2P': 'Promo HB BB Flex 2P',
    'PROMO-HB-BB-FLEX-4P': 'Promo HB BB Flex 4P',
    'PROMO-HB-BB-NANR-1P': 'Promo HB BB NANR 1P',
    'PROMO-HB-BB-NANR-2P': 'Promo HB BB NANR 2P',
    'PROMO-HB-BB-NANR-4P': 'Promo HB BB NANR 4P',
    'TRAVCO-BB-FLEX-NET': 'Travco BB Flex Net',
    'TRAVCO-BB-NANR-NET': 'Travco BB NANR Net',
};
// --- Fin Configuration ---

// --- Structures globales pour les données chargées ---
let baseRatesByDate = new Map(); // Map: 'YYYY-MM-DD' -> rate (OTA-RO-FLEX Double Classique)
let travcoBaseRatesByDate = new Map(); // Map: 'YYYY-MM-DD' -> rate (TRAVCO-BB-FLEX-NET Double Classique)
let partnerToPlansMap = new Map(); // Map: PartnerName -> Set<PlanCode>
let planToCategoriesMap = new Map(); // Map: PlanCode -> Set<CategoryName>
let categoryToPlansMap = new Map(); // Map: CategoryName -> Set<PlanCode>
let allPartners = new Set();
let allCategories = new Set();
let allPlans = new Set();
let originalPlanOrder = {}; // Map: CategoryName -> Array<PlanCode> (pour conserver l'ordre d'affichage)

// --- Fonctions Utilitaires ---
function showGlobalMessage(message, type = 'error', duration = 7000) {
    const messageArea = document.getElementById('global-message-area');
    if (!messageArea) { console.error("ERREUR FATALE: Zone de message 'global-message-area' non trouvée !"); alert(`Erreur: ${message}`); return; }
    const alertId = `alert-${Date.now()}`;
    let alertClass = 'alert-error'; // Défaut
    let iconClass = 'fa-exclamation-circle';
    switch (type) {
        case 'success': alertClass = 'alert-success'; iconClass = 'fa-check-circle'; break;
        case 'warning': alertClass = 'alert-warning'; iconClass = 'fa-exclamation-triangle'; break;
        case 'info': alertClass = 'alert-info'; iconClass = 'fa-info-circle'; break;
    }
    const alertHtml = `<div id="${alertId}" class="alert ${alertClass} fade-in" role="alert">
        <i class="fas ${iconClass}"></i>
        <span class="flex-grow ml-3">${message.replace(/\n/g, '<br>')}</span>
        <button type="button" class="ml-auto -mx-1.5 -my-1.5 close-alert-button" aria-label="Close">
            <span class="sr-only">Close</span><i class="fas fa-times"></i>
        </button>
    </div>`;
    messageArea.insertAdjacentHTML('beforeend', alertHtml);
    const alertElement = messageArea.querySelector(`#${alertId}`);
    if (alertElement) {
        const closeButton = alertElement.querySelector(`.close-alert-button`);
        if (closeButton) { closeButton.addEventListener('click', () => alertElement.remove()); }
        if (duration > 0) { setTimeout(() => { alertElement.style.opacity = '0'; setTimeout(() => alertElement.remove(), 300); }, duration); }
    }
}

function showLoading(elementId, message = "Chargement...") {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="loading-indicator">${message} <i class="fas fa-spinner fa-spin"></i></div>`;
        element.classList.remove('hidden');
    } else { console.warn(`showLoading: Element ID '${elementId}' introuvable.`); }
}

function hideResult(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('hidden');
        element.innerHTML = ''; // Vide le contenu
    } else { console.warn(`hideResult: Element ID '${elementId}' introuvable.`); }
}

function formatDateYYYYMMDD(date) {
    // Fonction inchangée
    if (!(date instanceof Date) || isNaN(date.getTime())) { return null; }
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateLocale(date) {
    // Fonction inchangée
    if (!(date instanceof Date) || isNaN(date.getTime())) { return "Date invalide"; }
    const options = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' };
    try { return date.toLocaleDateString('fr-FR', options); }
    catch (e) { return formatDateYYYYMMDD(date) || "Date invalide"; }
}

function generateStayDates(arrivalDateString, nights) {
    // Fonction inchangée
    if (!arrivalDateString) { throw new Error("Date d'arrivée manquante."); }
    const nightsInt = parseInt(nights, 10);
    if (isNaN(nightsInt) || nightsInt < 1) { throw new Error("Nombre de nuits invalide."); }
    const dates = [];
    let currentDate;
    try {
         currentDate = new Date(arrivalDateString + 'T00:00:00Z'); // Utilise Z pour UTC
         if (isNaN(currentDate.getTime())) { throw new Error('Format date invalide'); }
    } catch(e) {
         throw new Error("Format de date d'arrivée incorrect ou invalide.");
    }
    for (let i = 0; i < nightsInt; i++) {
        dates.push(new Date(currentDate)); // Ajoute copie de la date
        currentDate.setUTCDate(currentDate.getUTCDate() + 1); // Incrémente la date UTC
    }
    return dates;
}

function getElementValue(id) {
    const element = document.getElementById(id);
    if (!element) { console.warn(`getElementValue: Element ID '${id}' non trouvé.`); return null; }
    return element.value;
}
function getElementValueAsInt(id) {
    const value = getElementValue(id);
    const parsed = value ? parseInt(value, 10) : NaN;
    return isNaN(parsed) ? null : parsed;
}
function getElementValueAsFloat(id) {
    const value = getElementValue(id);
    const parsed = value ? parseFloat(String(value).replace(',', '.')) : NaN; // Remplace virgule par point
    return isNaN(parsed) ? null : parsed;
}

// --- Fonctions de Récupération & Traitement des Données ---

async function fetchAndProcessData() {
    const now = Date.now();
    if (sheetDataCache.data && sheetDataCache.timestamp && (now - sheetDataCache.timestamp < sheetDataCache.ttl)) {
        console.log("Utilisation données cache.");
        return sheetDataCache.data;
    }

    console.log("Appel Apps Script pour toutes les données...");
    showGlobalMessage("Chargement des données depuis Google Sheets...", "info", 0); // 0 = pas de disparition auto

    if (!API_CONFIG.apiUrl || API_CONFIG.apiUrl.includes('YOUR_DEPLOYMENT_ID')) {
        const errorMsg = "URL API non configurée dans script.js ! Déploie ton script Google Apps et colle l'URL.";
        const loadingMessage = document.querySelector('#global-message-area .alert-info');
        if (loadingMessage) { loadingMessage.remove(); }
        showGlobalMessage(errorMsg, 'error', 0);
        throw new Error(errorMsg);
    }

    try {
        // Ajout de ?action=getAllData (même si le GAS ne l'utilise plus, ça peut être utile pour logs/filtrage futur)
        const url = `${API_CONFIG.apiUrl}?action=getAllData&t=${Date.now()}`; // Ajout timestamp pour éviter cache navigateur agressif
        console.log(`Fetching: ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // Timeout 45s

        const response = await fetch(url, { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);

        // Enlève le message "Chargement..."
        const loadingMessage = document.querySelector('#global-message-area .alert-info');
        if (loadingMessage) { loadingMessage.remove(); }

        if (!response.ok) {
            let errorText = `Erreur ${response.status} ${response.statusText}`;
            try {
                const errorBody = await response.text(); console.error("Réponse erreur brute:", errorBody);
                errorText += ` - ${errorBody.substring(0, 300)}`;
            } catch (e) { /* ignore si lecture body échoue */ }
            throw new Error(`Erreur API (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        console.log("Données brutes reçues:", JSON.stringify(data).substring(0, 500) + '...');

        if (data.error) { throw new Error(data.message || "Erreur renvoyée par l'API Google Apps Script."); }

        // Validation basique de la structure attendue
        if (!data || typeof data !== 'object' || typeof data.baseRates !== 'object' || typeof data.travcoBaseRates !== 'object' || !Array.isArray(data.tariffStructure) || !Array.isArray(data.partners)) {
            console.error("Format de données invalide reçu:", data);
            throw new Error("Format des données (baseRates/travcoBaseRates/tariffStructure/partners) invalide.");
        }

        console.log(`Données Base Rates (OTA) reçues: ${Object.keys(data.baseRates).length} dates.`);
        console.log(`Données Base Rates (Travco) reçues: ${Object.keys(data.travcoBaseRates).length} dates.`);
        console.log(`Données Structure Tarifs reçues: ${data.tariffStructure.length} lignes.`);
        console.log(`Données Partenaires reçues: ${data.partners.length} lignes.`);

        processFetchedData(data); // Traite et stocke les données
        sheetDataCache.data = data; // Met en cache
        sheetDataCache.timestamp = now;

        showGlobalMessage("Données Google Sheets chargées avec succès.", "success", 5000);
        return data;

    } catch (error) {
        console.error("Erreur détaillée fetch/process:", error);
        const loadingMessage = document.querySelector('#global-message-area .alert-info');
        if (loadingMessage) { loadingMessage.remove(); }
        // Affiche message erreur persistant
        showGlobalMessage(`Erreur critique chargement données: ${error.message}. Vérifie la configuration et la console (F12). Recharge la page ou contacte le support.`, 'error', 0);
        // Réinitialise tout en cas d'erreur critique
        clearProcessedData();
        sheetDataCache.data = null; sheetDataCache.timestamp = null;
        disableAllForms();
        throw error; // Propage l'erreur
    }
}

function clearProcessedData() {
    baseRatesByDate.clear();
    travcoBaseRatesByDate.clear();
    partnerToPlansMap.clear();
    planToCategoriesMap.clear();
    categoryToPlansMap.clear();
    allPartners.clear();
    allCategories.clear();
    allPlans.clear();
    originalPlanOrder = {};
}

function processFetchedData(data) {
    console.log("Début du traitement des données reçues...");
    clearProcessedData(); // Vide les structures avant de remplir

    // 1. Process Base Rates (OTA)
    if (data.baseRates && typeof data.baseRates === 'object') {
         baseRatesByDate = new Map(Object.entries(data.baseRates));
         console.log(`Map baseRatesByDate (OTA) créée avec ${baseRatesByDate.size} entrées.`);
    } else {
         console.warn("Données baseRates (OTA) manquantes ou invalides.");
    }

    // 2. Process Base Rates (Travco)
    if (data.travcoBaseRates && typeof data.travcoBaseRates === 'object') {
         travcoBaseRatesByDate = new Map(Object.entries(data.travcoBaseRates));
         console.log(`Map travcoBaseRatesByDate créée avec ${travcoBaseRatesByDate.size} entrées.`);
    } else {
         console.warn("Données travcoBaseRates manquantes ou invalides.");
    }

    // 3. Process Tariff Structure [Category, PlanCode]
    const structureData = data.tariffStructure || [];
    if (structureData.length > 0) {
        structureData.forEach(row => {
            if (!row || row.length < 2) return; // Ignore lignes invalides
            const category = String(row[0] || '').trim();
            const plan = String(row[1] || '').trim();

            if (category && plan) {
                allCategories.add(category);
                allPlans.add(plan);

                // Map Catégorie -> Plans (avec ordre)
                if (!categoryToPlansMap.has(category)) {
                    categoryToPlansMap.set(category, new Set());
                    originalPlanOrder[category] = []; // Initialise l'ordre pour cette catégorie
                }
                if (!categoryToPlansMap.get(category).has(plan)) {
                    categoryToPlansMap.get(category).add(plan);
                    originalPlanOrder[category].push(plan); // Ajoute à la fin pour conserver l'ordre
                }

                // Map Plan -> Catégories
                if (!planToCategoriesMap.has(plan)) {
                    planToCategoriesMap.set(plan, new Set());
                }
                planToCategoriesMap.get(plan).add(category);
            }
        });
    }
    console.log(`${allCategories.size} Catégories trouvées:`, [...allCategories].sort());
    console.log(`${allPlans.size} Plans trouvés.`);

    // 4. Process Partner Data [PartnerName, PlanCode]
    const partnerData = data.partners || [];
    let missingPlanWarnings = new Set();
    if (partnerData.length > 0) {
        partnerData.forEach(row => {
             if (!row || row.length < 2) return; // Ignore lignes invalides
             const partnerName = String(row[0] || '').trim();
             const planCode = String(row[1] || '').trim();

             if (partnerName && planCode) {
                 allPartners.add(partnerName);

                 if (!partnerToPlansMap.has(partnerName)) {
                     partnerToPlansMap.set(partnerName, new Set());
                 }

                 // Vérifie si le plan existe dans la structure tarifaire
                 if (allPlans.has(planCode)) {
                    partnerToPlansMap.get(partnerName).add(planCode);
                 } else {
                     // Affiche un avertissement seulement une fois par plan manquant
                     if (!missingPlanWarnings.has(planCode)) {
                         console.warn(`Plan '${planCode}' (associé à '${partnerName}') non trouvé dans la structure tarifs globale. Association ignorée.`);
                         missingPlanWarnings.add(planCode);
                     }
                 }
             }
        });
    }
    if (missingPlanWarnings.size > 0) {
        showGlobalMessage(`Avertissement: ${missingPlanWarnings.size} plan(s) tarifaire(s) mentionné(s) dans les partenaires n'existent pas dans la structure tarifaire. Voir console (F12).`, 'warning', 10000);
    }
    console.log(`${allPartners.size} Partenaires trouvés:`, [...allPartners].sort());
    console.log("Traitement des données terminé.");
}


// --- Fonctions de Mise à Jour des Dropdowns ---
// (Fonctions populateDropdown, updateRatePlanHelp inchangées)
function populateDropdown(selectElementId, optionsSet, defaultText, addAllOption = false, allOptionValue = "", allOptionText = "Tous") {
    const select = document.getElementById(selectElementId);
    if (!select) { console.error(`Dropdown #${selectElementId} introuvable.`); return; }

    const currentVal = select.value; // Sauvegarde valeur actuelle
    select.innerHTML = ''; // Vide les options
    select.disabled = true; // Désactive pendant remplissage

    // Option par défaut (placeholder)
    const defaultOpt = document.createElement('option');
    defaultOpt.value = "";
    defaultOpt.textContent = defaultText;
    defaultOpt.disabled = true;
    defaultOpt.selected = true; // Sélectionnée par défaut
    select.appendChild(defaultOpt);

    // Option "Tous" si demandée
    if (addAllOption) {
        const allOpt = document.createElement('option');
        allOpt.value = allOptionValue; // Souvent ""
        allOpt.textContent = allOptionText;
        select.appendChild(allOpt);
    }

    // Tri des options (alphabétique pour partenaires/catégories)
    let sortedOptions = [...optionsSet];
    if (selectElementId.includes('partner') || selectElementId.includes('category')) {
        sortedOptions.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    }
    // Pour les plans, on utilisera l'ordre original ou alpha si pas d'ordre spécifique

    // Ajout des options triées
    sortedOptions.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item; // Affiche la valeur brute (nom/code)
        select.appendChild(option);
    });

    // Ré-sélectionne l'ancienne valeur si elle existe toujours
    if (select.querySelector(`option[value="${currentVal}"]`)) {
        select.value = currentVal;
    } else {
        // Sinon, sélectionne "Tous" si présent, sinon le placeholder reste sélectionné
        select.value = addAllOption ? allOptionValue : "";
    }

    // Réactive le select SI il y a des options (ou si c'est le partenaire avec "Tous")
    select.disabled = optionsSet.size === 0 && !addAllOption;
    // Cas spécial: le select partenaire avec "Tous" doit toujours être actif
    if (addAllOption && selectElementId.includes('partner')) {
         select.disabled = false;
    }

    // Met à jour le texte d'aide si c'est un select de plan tarifaire
    if (selectElementId.includes('rate-plan')) {
        const helpTextId = selectElementId.replace('rate-plan', 'rate-plan-help');
        updateRatePlanHelp(select.value, helpTextId);
    }
}

function updateRatePlanHelp(planCode, helpTextId) {
    const helpTextElement = document.getElementById(helpTextId);
    if (helpTextElement) {
        const description = ratePlanDescriptions[planCode];
        helpTextElement.textContent = description || (planCode ? '' : ''); // Affiche description ou rien
    }
}

// --- Mise à jour dynamique des selects en cascade ---

function updatePartnerOptions(formPrefix) {
    populateDropdown(`${formPrefix}-partner`, allPartners, 'Sélectionnez Partenaire...', true, "", "Tous les partenaires");
}

function updateCategoryOptions(formPrefix) {
    const partnerSelectId = `${formPrefix}-partner`;
    const categorySelectId = `${formPrefix}-room-category`;
    const planSelectId = (formPrefix !== 'compare') ? `${formPrefix}-rate-plan` : null; // Pas de plan unique pour Compare à ce stade

    const selectedPartner = getElementValue(partnerSelectId);
    const selectedPlan = planSelectId ? getElementValue(planSelectId) : null;

    let availableCategories = new Set();
    let placeholder = "Sélectionnez Catégorie...";

    if (formPrefix === 'compare') {
        // Pour Compare: les catégories dépendent SEULEMENT du partenaire choisi
        if (!selectedPartner) { // "Tous les partenaires"
            availableCategories = new Set(allCategories); // Toutes les catégories
        } else { // Partenaire spécifique
            const plansForPartner = partnerToPlansMap.get(selectedPartner) || new Set();
            // Trouve toutes les catégories associées aux plans de ce partenaire
            plansForPartner.forEach(plan => {
                const catsForPlan = planToCategoriesMap.get(plan) || new Set();
                catsForPlan.forEach(cat => availableCategories.add(cat));
            });
            if (availableCategories.size === 0) {
                placeholder = "Aucune catégorie pour ce partenaire";
            }
        }
    } else {
        // Pour Calcul/Vérif: les catégories dépendent du PLAN choisi (et potentiellement partenaire)
        if (!selectedPlan) {
            placeholder = "Sélectionnez un Plan...";
            availableCategories = new Set(); // Pas de plan = pas de catégorie
        } else {
            const categoriesForPlan = planToCategoriesMap.get(selectedPlan) || new Set();
            if (!selectedPartner) { // "Tous partenaires"
                availableCategories = categoriesForPlan;
            } else { // Partenaire spécifique
                // On vérifie juste que le plan est bien lié au partenaire (normalement oui grâce à updateRatePlanOptions)
                 const plansForPartner = partnerToPlansMap.get(selectedPartner) || new Set();
                 if (plansForPartner.has(selectedPlan)) {
                      availableCategories = categoriesForPlan;
                 } else {
                      // Cas d'incohérence (ne devrait pas arriver avec la logique en place)
                      console.warn(`Incohérence: Plan '${selectedPlan}' sélectionné mais non associé au partenaire '${selectedPartner}'.`);
                      availableCategories = new Set();
                      placeholder = "Incohérence Plan/Partenaire";
                 }
            }
            if (availableCategories.size === 0) {
                placeholder = "Aucune catégorie pour ce plan";
            }
        }
    }

    populateDropdown(categorySelectId, availableCategories, placeholder);
    const categorySelect = document.getElementById(categorySelectId);
    if (categorySelect) {
        // Active/Désactive en fonction du contexte
        categorySelect.disabled = availableCategories.size === 0 || (formPrefix !== 'compare' && !selectedPlan);
    }
}

function updateRatePlanOptions(formPrefix) {
    // Valable pour Calculate et Verify (pas Compare)
    if (formPrefix === 'compare') return;

    const partnerSelectId = `${formPrefix}-partner`;
    const categorySelectId = `${formPrefix}-room-category`;
    const ratePlanSelectId = `${formPrefix}-rate-plan`;

    const selectedPartner = getElementValue(partnerSelectId);
    const selectedCategory = getElementValue(categorySelectId); // Peut être vide

    let availablePlans = new Set();
    let placeholder = "Sélectionnez Plan...";
    let orderSourceCategory = null; // Pour tri

    if (!selectedCategory) {
        // Si pas de catégorie, on se base sur le partenaire
        if (!selectedPartner) { // Tous partenaires, pas de catégorie
            availablePlans = new Set(allPlans);
            placeholder = "Sélectionnez Plan...";
            orderSourceCategory = ABSOLUTE_BASE_CATEGORY_NAME; // Tri basé sur ordre Dbl Classique
        } else { // Partenaire spécifique, pas de catégorie
            availablePlans = partnerToPlansMap.get(selectedPartner) || new Set();
            placeholder = "Sélectionnez Plan...";
             // Essaye de trier selon Dbl Classique si possible
            orderSourceCategory = ABSOLUTE_BASE_CATEGORY_NAME;
        }
    } else {
        // Si une catégorie est sélectionnée
        const plansForCategory = categoryToPlansMap.get(selectedCategory) || new Set();
        orderSourceCategory = selectedCategory; // Tri basé sur l'ordre de cette catégorie

        if (!selectedPartner) { // Tous partenaires, catégorie sélectionnée
            availablePlans = plansForCategory;
            placeholder = "Sélectionnez Plan...";
        } else { // Partenaire spécifique, catégorie sélectionnée
            const plansForPartner = partnerToPlansMap.get(selectedPartner) || new Set();
            // Intersection des plans pour la catégorie ET le partenaire
            availablePlans = new Set([...plansForCategory].filter(plan => plansForPartner.has(plan)));
            if (availablePlans.size === 0) {
                placeholder = "Aucun plan commun";
            } else {
                placeholder = "Sélectionnez Plan...";
            }
        }
    }

    // Tri des plans selon l'ordre original de la catégorie source, puis alpha
    let orderedPlans = [];
    if (orderSourceCategory && originalPlanOrder[orderSourceCategory]) {
        // Prend les plans de l'ordre original qui sont dans les plans disponibles
        orderedPlans = originalPlanOrder[orderSourceCategory].filter(plan => availablePlans.has(plan));
        // Ajoute les plans disponibles qui n'étaient pas dans l'ordre original (triés alpha)
        const remainingPlans = [...availablePlans].filter(plan => !orderedPlans.includes(plan));
        remainingPlans.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
        orderedPlans = [...orderedPlans, ...remainingPlans];
         console.log(`Tri plans pour ${ratePlanSelectId} basé sur ordre catégorie '${orderSourceCategory}'.`);
    } else {
        // Fallback: tri alphabétique simple
        orderedPlans = [...availablePlans].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
         console.log(`Tri plans pour ${ratePlanSelectId} en mode fallback (alphabétique).`);
    }

    // Peuplement du dropdown
    const select = document.getElementById(ratePlanSelectId);
    if (!select) { console.error(`Dropdown #${ratePlanSelectId} introuvable.`); return; }

    const currentVal = select.value;
    select.innerHTML = ''; // Vide

    const defaultOpt = document.createElement('option');
    defaultOpt.value = "";
    defaultOpt.textContent = placeholder;
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    select.appendChild(defaultOpt);

    orderedPlans.forEach(planCode => {
        const option = document.createElement('option');
        option.value = planCode;
        option.textContent = planCode; // Affiche le code brut
        select.appendChild(option);
    });

    // Restaure sélection si possible
    if (select.querySelector(`option[value="${currentVal}"]`)) {
        select.value = currentVal;
    } else {
        select.value = "";
    }

    // Active/désactive le select
    select.disabled = orderedPlans.length === 0;
    updateRatePlanHelp(select.value, `${formPrefix}-rate-plan-help`);
}

function updateCompareRatePlanOptions() {
    const comparePrefix = 'compare';
    const partnerSelectId = `${comparePrefix}-partner`;
    const categorySelectId = `${comparePrefix}-room-category`;
    const ratePlanSelectId1 = `${comparePrefix}-rate-plan-1`;
    const ratePlanSelectId2 = `${comparePrefix}-rate-plan-2`;

    const selectedPartner = getElementValue(partnerSelectId);
    const selectedCategory = getElementValue(categorySelectId);

    let availablePlans = new Set();
    let placeholder = "Sélectionnez Plan...";
    let orderSourceCategory = null;

    if (!selectedCategory) {
        placeholder = "Sélectionnez Catégorie d'abord...";
        availablePlans = new Set(); // Pas de catégorie = pas de plans
    } else {
        orderSourceCategory = selectedCategory; // Tri basé sur cette catégorie
        const plansForCategory = categoryToPlansMap.get(selectedCategory) || new Set();

        if (!selectedPartner) { // Tous partenaires
            availablePlans = plansForCategory;
        } else { // Partenaire spécifique
            const plansForPartner = partnerToPlansMap.get(selectedPartner) || new Set();
            availablePlans = new Set([...plansForCategory].filter(plan => plansForPartner.has(plan)));
            if (availablePlans.size === 0) {
                placeholder = "Aucun plan pour cette combinaison";
            }
        }
    }

     // Tri des plans selon l'ordre original de la catégorie source, puis alpha
    let orderedPlans = [];
    if (orderSourceCategory && originalPlanOrder[orderSourceCategory]) {
        orderedPlans = originalPlanOrder[orderSourceCategory].filter(plan => availablePlans.has(plan));
        const remainingPlans = [...availablePlans].filter(plan => !orderedPlans.includes(plan));
        remainingPlans.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
        orderedPlans = [...orderedPlans, ...remainingPlans];
         console.log(`Tri plans (Compare) basé sur ordre catégorie '${orderSourceCategory}'.`);
    } else {
        orderedPlans = [...availablePlans].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
         console.log(`Tri plans (Compare) en mode fallback (alphabétique).`);
    }

    // Peuplement des deux selects de plans
    [ratePlanSelectId1, ratePlanSelectId2].forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) { console.error(`Dropdown #${selectId} introuvable.`); return; }

        const currentVal = select.value;
        select.innerHTML = ''; // Vide

        const defaultOpt = document.createElement('option');
        defaultOpt.value = "";
        defaultOpt.textContent = placeholder;
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        select.appendChild(defaultOpt);

        orderedPlans.forEach(planCode => {
            const option = document.createElement('option');
            option.value = planCode;
            option.textContent = planCode; // Affiche le code
            select.appendChild(option);
        });

        // Restaure sélection
        if (select.querySelector(`option[value="${currentVal}"]`)) {
            select.value = currentVal;
        } else {
            select.value = "";
        }

        // Active/désactive
        select.disabled = orderedPlans.length === 0 || !selectedCategory;

        // Met à jour aide
        const helpTextId = selectId.replace('rate-plan', 'rate-plan-help');
        updateRatePlanHelp(select.value, helpTextId);
    });
}

// --- Activation/Désactivation des formulaires ---
function disableAllForms() {
    console.log("Désactivation des formulaires et de la section choix.");
    ['calculate', 'verify', 'compare'].forEach(prefix => {
        const form = document.getElementById(`${prefix}-form`);
        if (form) {
            form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
        }
        hideResult(`${prefix}-result`);
    });
    const choiceSection = document.getElementById('choice-section');
    if (choiceSection) {
        choiceSection.style.opacity = '0.5'; // Grise la section choix
        choiceSection.style.pointerEvents = 'none'; // Empêche clics
    }
}

function enableAllForms() {
   console.log("Activation des formulaires et peuplement initial...");
   ['calculate', 'verify', 'compare'].forEach(prefix => {
       const form = document.getElementById(`${prefix}-form`);
       if (form) {
            console.log(`Activation formulaire: ${prefix}-form`);
            // Active les champs de base et le partenaire
            form.querySelectorAll('input[type="date"], input[type="number"], button').forEach(el => el.disabled = false);
            updatePartnerOptions(prefix); // Peuple et active le select partenaire
            const partnerSelect = document.getElementById(`${prefix}-partner`);
             if (partnerSelect) partnerSelect.disabled = false; // S'assure qu'il est actif

            // Désactive les selects dépendants initialement
            const categorySelect = document.getElementById(`${prefix}-room-category`);
            if (categorySelect) { categorySelect.innerHTML = `<option value="" disabled selected>...</option>`; categorySelect.disabled = true;}

            if (prefix === 'compare') {
                 const rp1 = document.getElementById('compare-rate-plan-1');
                 const rp2 = document.getElementById('compare-rate-plan-2');
                 if (rp1) { rp1.innerHTML = `<option value="" disabled selected>Sélectionnez Catégorie...</option>`; rp1.disabled = true; updateRatePlanHelp("", 'compare-rate-plan-1-help');}
                 if (rp2) { rp2.innerHTML = `<option value="" disabled selected>Sélectionnez Catégorie...</option>`; rp2.disabled = true; updateRatePlanHelp("", 'compare-rate-plan-2-help');}
            } else {
                 const ratePlanSelect = document.getElementById(`${prefix}-rate-plan`);
                 if (ratePlanSelect) { ratePlanSelect.innerHTML = `<option value="" disabled selected>...</option>`; ratePlanSelect.disabled = true; updateRatePlanHelp("", `${prefix}-rate-plan-help`);}
            }
            // Marque comme non initialisé pour les listeners
            form.dataset.listenersAttached = 'false';
       } else {
           console.warn(`Formulaire introuvable pour le préfixe: ${prefix}`);
       }
   });
   // Réactive la section de choix
   const choiceSection = document.getElementById('choice-section');
   if (choiceSection) {
       choiceSection.style.opacity = '1';
       choiceSection.style.pointerEvents = 'auto';
       console.log("Section de choix réactivée.");
   }
}


// ==========================================================================
// ==                       NOYAU DE CALCUL DES TARIFS                     ==
// ==========================================================================

/**
 * Trouve le tarif de base OTA (Double Classique) pour une date donnée.
 * @param {Date} requestedDate Objet Date UTC.
 * @returns {number|null} Le tarif ou null si non trouvé/invalide.
 */
function findAbsoluteOtaBaseRate(requestedDate) {
    if (!(requestedDate instanceof Date) || isNaN(requestedDate.getTime())) { return null; }
    const requestedDateStr = formatDateYYYYMMDD(requestedDate);
    if (!requestedDateStr || !baseRatesByDate.has(requestedDateStr)) {
        return null; // Pas de date ou pas de tarif trouvé pour cette date
    }
    const rate = baseRatesByDate.get(requestedDateStr);
    // Vérifie si la valeur est un nombre valide et positif
    if (rate !== null && typeof rate === 'number' && !isNaN(rate) && rate >= 0) {
         return rate;
    } else {
         console.warn(`findAbsoluteOtaBaseRate: Valeur invalide (${rate}) pour ${requestedDateStr} dans baseRatesByDate.`);
         return null; // Valeur invalide
    }
}

/**
 * Trouve le tarif de base Travco (Double Classique) pour une date donnée.
 * @param {Date} requestedDate Objet Date UTC.
 * @returns {number|null} Le tarif ou null si non trouvé/invalide.
 */
function findAbsoluteTravcoBaseRate(requestedDate) {
    if (!(requestedDate instanceof Date) || isNaN(requestedDate.getTime())) { return null; }
    const requestedDateStr = formatDateYYYYMMDD(requestedDate);
    if (!requestedDateStr || !travcoBaseRatesByDate.has(requestedDateStr)) {
        return null;
    }
    const rate = travcoBaseRatesByDate.get(requestedDateStr);
    if (rate !== null && typeof rate === 'number' && !isNaN(rate) && rate >= 0) {
         return rate;
    } else {
         console.warn(`findAbsoluteTravcoBaseRate: Valeur invalide (${rate}) pour ${requestedDateStr} dans travcoBaseRatesByDate.`);
         return null;
    }
}


/**
 * Calcule le tarif journalier final pour une catégorie et un plan donnés,
 * en fonction du tarif de base absolu (OTA ou Travco) du jour.
 * @param {Date} date La date UTC pour laquelle calculer le tarif.
 * @param {string} requestedCategory La catégorie de chambre demandée.
 * @param {string} requestedPlan Le plan tarifaire demandé.
 * @returns {number|null} Le tarif journalier calculé et arrondi, ou null en cas d'erreur critique (ex: tarif base manquant).
 */
function calculateDailyRate(date, requestedCategory, requestedPlan) {

    // --- Logique Spécifique TRAVCO ---
    if (requestedPlan && requestedPlan.startsWith('TRAVCO-')) {
        const travcoBaseRateDoubleClassique = findAbsoluteTravcoBaseRate(date);

        if (travcoBaseRateDoubleClassique === null) {
             console.warn(`Tarif base TRAVCO (${TRAVCO_BASE_PLAN} / ${TRAVCO_BASE_CATEGORY}) manquant pour ${formatDateYYYYMMDD(date)}.`);
             return null; // Important de retourner null si base manque
        }

        let travcoFlexRateForCategory = travcoBaseRateDoubleClassique;

        // Appliquer les suppléments fixes par catégorie (selon règles fournies)
        switch (requestedCategory) {
            case 'Double Classique': travcoFlexRateForCategory = travcoBaseRateDoubleClassique; break;
            case 'Double Single Use Classique': travcoFlexRateForCategory = travcoBaseRateDoubleClassique - 10; break;
            case 'Twin Classique': travcoFlexRateForCategory = travcoBaseRateDoubleClassique + 10; break;
            case 'Double Classique Terrasse': travcoFlexRateForCategory = travcoBaseRateDoubleClassique + 50; break;
            case 'Double Deluxe': travcoFlexRateForCategory = travcoBaseRateDoubleClassique + 50; break;
            case 'Twin Deluxe': travcoFlexRateForCategory = travcoBaseRateDoubleClassique + 60; break;
            case 'Double Deluxe Terrasse': travcoFlexRateForCategory = travcoBaseRateDoubleClassique + 100; break;
            case 'Deux Chambres Adjacentes 4 personnes': travcoFlexRateForCategory = (travcoBaseRateDoubleClassique * 2) + 10; break;
            default:
                console.warn(`Catégorie inconnue pour TRAVCO: '${requestedCategory}'. Utilisation tarif Double Classique.`);
                travcoFlexRateForCategory = travcoBaseRateDoubleClassique;
                break;
        }

        // Appliquer la règle NANR si nécessaire
        let finalTravcoRate = travcoFlexRateForCategory;
        if (requestedPlan.includes('-NANR-')) {
            finalTravcoRate = travcoFlexRateForCategory * 0.95;
        }

        return Math.round(finalTravcoRate * 100) / 100; // Arrondi final

    } else {
        // --- Logique Standard (Non-Travco) ---
        const absoluteOtaBaseRateForDay = findAbsoluteOtaBaseRate(date);

        if (absoluteOtaBaseRateForDay === null) {
            console.warn(`Tarif base OTA (${BASE_RATE_PLAN_NAME} / ${ABSOLUTE_BASE_CATEGORY_NAME}) manquant pour ${formatDateYYYYMMDD(date)}.`);
            return null; // Important de retourner null si base manque
        }
        const baseRateDoubleClassique = parseFloat(absoluteOtaBaseRateForDay);

        // Calculer le tarif OTA-RO-FLEX pour la catégorie demandée
        let categoryOtaRoFlexRate = baseRateDoubleClassique;
        switch (requestedCategory) {
            case 'Double Classique': case 'Double Single Use Classique': categoryOtaRoFlexRate = baseRateDoubleClassique; break;
            case 'Twin Classique': categoryOtaRoFlexRate = baseRateDoubleClassique + 10; break;
            case 'Double Classique Terrasse': categoryOtaRoFlexRate = baseRateDoubleClassique + 50; break;
            case 'Double Deluxe': categoryOtaRoFlexRate = baseRateDoubleClassique + 70; break;
            case 'Twin Deluxe': categoryOtaRoFlexRate = baseRateDoubleClassique + 80; break;
            case 'Double Deluxe Terrasse': categoryOtaRoFlexRate = baseRateDoubleClassique + 120; break;
            case 'Deux Chambres Adjacentes 4 personnes': categoryOtaRoFlexRate = (baseRateDoubleClassique * 2) + 60; break;
            default:
                console.warn(`Catégorie standard inconnue: '${requestedCategory}'. Utilisation tarif Double Classique.`);
                categoryOtaRoFlexRate = baseRateDoubleClassique;
                break;
        }
        categoryOtaRoFlexRate = Math.round(categoryOtaRoFlexRate * 100) / 100; // Arrondi intermédiaire

        // Appliquer les formules spécifiques au plan tarifaire demandé
        let finalRate = categoryOtaRoFlexRate; // Base de départ
        const plan = requestedPlan; // Alias pour lisibilité

        // Variables intermédiaires basées sur categoryOtaRoFlexRate (pour TO/HB/HOTUSA etc.)
        const toRoNet = categoryOtaRoFlexRate * 0.83;
        const toRoNanrNet = (categoryOtaRoFlexRate * 0.95) * 0.83;
        const hbRoBrut = toRoNet * 1.252;
        const toRoNanrBrut = hbRoBrut * 0.95; // Calculé à partir de HB Brut Flex

        switch (plan) {
            // --- Plans basés sur OTA ---
            case 'OTA-RO-FLEX': finalRate = categoryOtaRoFlexRate; break;
            case 'OTA-RO-NANR': finalRate = categoryOtaRoFlexRate * 0.95; break;
            case 'OTA-BB-FLEX-1P': finalRate = categoryOtaRoFlexRate + 15; break;
            case 'OTA-BB-FLEX-2P': finalRate = categoryOtaRoFlexRate + 30; break;
            case 'OTA-BB-FLEX-4P': finalRate = categoryOtaRoFlexRate + 60; break;
            case 'OTA-BB-NANR-1P': finalRate = (categoryOtaRoFlexRate * 0.95) + 15; break;
            case 'OTA-BB-NANR-2P': finalRate = (categoryOtaRoFlexRate * 0.95) + 30; break;
            case 'OTA-BB-NANR-4P': finalRate = (categoryOtaRoFlexRate * 0.95) + 60; break;

            // --- Plans MOBILE (-10% sur OTA correspondant) ---
            case 'MOBILE-RO-FLEX': finalRate = categoryOtaRoFlexRate * 0.90; break;
            case 'MOBILE-RO-NANR': finalRate = (categoryOtaRoFlexRate * 0.95) * 0.90; break;
            case 'MOBILE-BB-FLEX-1P': case 'MOBILE-BB-FLEX-1-P': finalRate = (categoryOtaRoFlexRate + 15) * 0.90; break;
            case 'MOBILE-BB-FLEX-2P': finalRate = (categoryOtaRoFlexRate + 30) * 0.90; break;
            case 'MOBILE-BB-FLEX-4P': finalRate = (categoryOtaRoFlexRate + 60) * 0.90; break;
            case 'MOBILE-BB-NANR-1P': finalRate = ((categoryOtaRoFlexRate * 0.95) + 15) * 0.90; break;
            case 'MOBILE-BB-NANR-2P': finalRate = ((categoryOtaRoFlexRate * 0.95) + 30) * 0.90; break;
            case 'MOBILE-BB-NANR-4P': finalRate = ((categoryOtaRoFlexRate * 0.95) + 60) * 0.90; break;

            // --- Plans VIP (-15% sur OTA correspondant) ---
            case 'VIP-RATE-FLEX': case 'VIP-RO-FLEX': finalRate = categoryOtaRoFlexRate * 0.85; break;
            case 'VIP-RO-NANR': finalRate = (categoryOtaRoFlexRate * 0.95) * 0.85; break;
            case 'VIP-BB-FLEX-1P': finalRate = (categoryOtaRoFlexRate + 15) * 0.85; break;
            case 'VIP-BB-FLEX-2P': finalRate = (categoryOtaRoFlexRate + 30) * 0.85; break;
            case 'VIP-BB-FLEX-4P': finalRate = (categoryOtaRoFlexRate + 60) * 0.85; break;
            case 'VIP-BB-NANR-1P': finalRate = ((categoryOtaRoFlexRate * 0.95) + 15) * 0.85; break;
            case 'VIP-BB-NANR-2P': finalRate = ((categoryOtaRoFlexRate * 0.95) + 30) * 0.85; break;
            case 'VIP-BB-NANR-4P': finalRate = ((categoryOtaRoFlexRate * 0.95) + 60) * 0.85; break;

            // --- Plans TO/HB ---
            case 'TO-RO-FLEX-NET': finalRate = toRoNet; break;
            case 'TO-RO-NANR-NET': finalRate = toRoNanrNet; break;
            case 'HB-RO-FLEX-BRUT': finalRate = hbRoBrut; break;
            case 'TO-RO-NANR-BRUT': finalRate = toRoNanrBrut; break; // basé sur hbRoBrut * 0.95

            case 'TO-BB-FLEX-NET-1P': finalRate = (categoryOtaRoFlexRate + 15) * 0.83; break;
            case 'TO-BB-FLEX-NET-2P': finalRate = (categoryOtaRoFlexRate + 30) * 0.83; break;
            case 'TO-BB-FLEX-NET-4P': finalRate = (categoryOtaRoFlexRate + 60) * 0.83; break;
            case 'TO-BB-NANR-NET-1P': finalRate = ((categoryOtaRoFlexRate * 0.95) + 15) * 0.83; break;
            case 'TO-BB-NANR-NET-2P': finalRate = ((categoryOtaRoFlexRate * 0.95) + 30) * 0.83; break;
            case 'TO-BB-NANR-NET-4P': finalRate = ((categoryOtaRoFlexRate * 0.95) + 60) * 0.83; break;

            case 'TO-BB-FLEX-BRUT-1P': finalRate = ((categoryOtaRoFlexRate + 15) * 0.83) * 1.252; break;
            case 'TO-BB-FLEX-BRUT-2P': finalRate = ((categoryOtaRoFlexRate + 30) * 0.83) * 1.252; break;
            case 'TO-BB-FLEX-BRUT-4P': finalRate = ((categoryOtaRoFlexRate + 60) * 0.83) * 1.252; break;
            case 'TO-BB-NANR-BRUT-1P': finalRate = (((categoryOtaRoFlexRate * 0.95) + 15) * 0.83) * 1.252; break;
            case 'TO-BB-NANR-BRUT-2P': finalRate = (((categoryOtaRoFlexRate * 0.95) + 30) * 0.83) * 1.252; break;
            case 'TO-BB-NANR-BRUT-4P': finalRate = (((categoryOtaRoFlexRate * 0.95) + 60) * 0.83) * 1.252; break;

            // --- Plans HOTUSA (TO NET * 1.31) ---
            case 'HOTUSA-RO-FLEX': finalRate = toRoNet * 1.31; break;
            case 'HOTUSA-RO-NANR': finalRate = toRoNanrNet * 1.31; break;
            case 'HOTUSA-BB-FLEX-1P': finalRate = ((categoryOtaRoFlexRate + 15) * 0.83) * 1.31; break;
            case 'HOTUSA-BB-FLEX-2P': finalRate = ((categoryOtaRoFlexRate + 30) * 0.83) * 1.31; break;
            case 'HOTUSA-BB-FLEX-4P': finalRate = ((categoryOtaRoFlexRate + 60) * 0.83) * 1.31; break;
            case 'HOTUSA-BB-NANR-1P': finalRate = (((categoryOtaRoFlexRate * 0.95) + 15) * 0.83) * 1.31; break;
            case 'HOTUSA-BB-NANR-2P': finalRate = (((categoryOtaRoFlexRate * 0.95) + 30) * 0.83) * 1.31; break;
            case 'HOTUSA-BB-NANR-4P': finalRate = (((categoryOtaRoFlexRate * 0.95) + 60) * 0.83) * 1.31; break;

            // --- Plans FB CORPO (Comme OTA) ---
            case 'FB-CORPO-RO-FLEX': finalRate = categoryOtaRoFlexRate; break;
            case 'FB-CORPO-BB-FLEX-1P': finalRate = categoryOtaRoFlexRate + 15; break;
            case 'FB-CORPO-BB-FLEX-2P': finalRate = categoryOtaRoFlexRate + 30; break;
            case 'FB-CORPO-BB-FLEX-4P': finalRate = categoryOtaRoFlexRate + 60; break;

            // --- Plans GDS/Autres ---
            case 'AMEX-GBT': case 'AMEX-GBT - AMEX GBT': finalRate = categoryOtaRoFlexRate * 0.85; break; // Comme VIP RO FLEX
            case 'CWT-BB-FLEX': finalRate = (categoryOtaRoFlexRate * 0.95) + 15; break; // Comme OTA BB NANR 1P

             // --- Plans PKG EXP (-10% sur OTA, comme MOBILE) ---
            case 'PKG-EXP-RO-FLEX': finalRate = categoryOtaRoFlexRate * 0.90; break;
            case 'PKG-EXP-RO-NANR': finalRate = (categoryOtaRoFlexRate * 0.95) * 0.90; break;
            case 'PKG-EXP-BB-FLEX-1P': finalRate = (categoryOtaRoFlexRate + 15) * 0.90; break;
            case 'PKG-EXP-BB-FLEX-2P': finalRate = (categoryOtaRoFlexRate + 30) * 0.90; break;
            case 'PKG-EXP-BB-FLEX-4P': finalRate = (categoryOtaRoFlexRate + 60) * 0.90; break;
            case 'PKG-EXP-BB-NANR-1P': finalRate = ((categoryOtaRoFlexRate * 0.95) + 15) * 0.90; break;
            case 'PKG-EXP-BB-NANR-2P': finalRate = ((categoryOtaRoFlexRate * 0.95) + 30) * 0.90; break;
            case 'PKG-EXP-BB-NANR-4P': finalRate = ((categoryOtaRoFlexRate * 0.95) + 60) * 0.90; break;

             // --- Plans PROMO TO (-10% sur TO NET) ---
            case 'PROMO-TO-RO-FLEX': finalRate = toRoNet * 0.9; break;
            case 'PROMO-TO-RO-NANR': finalRate = toRoNanrNet * 0.9; break;
            case 'PROMO-TO-BB-1-FLEX': case 'PROMO-TO-BB-1P-FLEX': finalRate = ((categoryOtaRoFlexRate + 15) * 0.83) * 0.9; break;
            case 'PROMO-TO-BB-1P-NANR': finalRate = (((categoryOtaRoFlexRate * 0.95) + 15) * 0.83) * 0.9; break;
            case 'PROMO-TO-BB-2P-FLEX': finalRate = ((categoryOtaRoFlexRate + 30) * 0.83) * 0.9; break;
            case 'PROMO-TO-BB-2P-NANR': finalRate = (((categoryOtaRoFlexRate * 0.95) + 30) * 0.83) * 0.9; break;
            case 'PROMO-TO-BB-4P-FLEX': finalRate = ((categoryOtaRoFlexRate + 60) * 0.83) * 0.9; break;
            case 'PROMO-TO-BB-4P-NANR': finalRate = (((categoryOtaRoFlexRate * 0.95) + 60) * 0.83) * 0.9; break;

             // --- Plans PROMO HB (-10% sur HB BRUT) ---
            case 'PROMO-HB-RO-FLEX': finalRate = hbRoBrut * 0.9; break;
            case 'PROMO-HB-RO-NANR': finalRate = toRoNanrBrut * 0.9; break; // Basé sur TO RO NANR Brut * 0.9
            case 'PROMO-HB-BB-FLEX-1P': finalRate = (((categoryOtaRoFlexRate + 15) * 0.83) * 1.252) * 0.9; break;
            case 'PROMO-HB-BB-FLEX-2P': finalRate = (((categoryOtaRoFlexRate + 30) * 0.83) * 1.252) * 0.9; break;
            case 'PROMO-HB-BB-FLEX-4P': finalRate = (((categoryOtaRoFlexRate + 60) * 0.83) * 1.252) * 0.9; break;
            case 'PROMO-HB-BB-NANR-1P': finalRate = ((((categoryOtaRoFlexRate * 0.95) + 15) * 0.83) * 1.252) * 0.9; break;
            case 'PROMO-HB-BB-NANR-2P': finalRate = ((((categoryOtaRoFlexRate * 0.95) + 30) * 0.83) * 1.252) * 0.9; break;
            case 'PROMO-HB-BB-NANR-4P': finalRate = ((((categoryOtaRoFlexRate * 0.95) + 60) * 0.83) * 1.252) * 0.9; break;

            default:
                console.warn(`Plan tarifaire standard inconnu ou non géré: '${plan}'. Utilisation du tarif OTA-RO-FLEX de la catégorie (${categoryOtaRoFlexRate}).`);
                finalRate = categoryOtaRoFlexRate; // Fallback
                break;
        }

        // Arrondi final
        return Math.round(finalRate * 100) / 100;
    } // Fin du else (Logique Standard)
} // Fin de la fonction calculateDailyRate


// --- Fonctions de Calcul Global (calculateDetailedCost, compareDetailedCosts) ---

async function calculateDetailedCost(formData) {
    const resultDivId = `${formData.formPrefix}-result`;
    showLoading(resultDivId, "Calcul en cours...");

    // Assure que les données sont chargées (ou tente de les charger)
    if (baseRatesByDate.size === 0 || travcoBaseRatesByDate.size === 0) { // Vérifie les deux maps de base
         console.log("Données de base manquantes, tentative de fetch...");
         try { await fetchAndProcessData(); }
         catch (error) { hideResult(resultDivId); return null; } // Echec chargement
         // Re-vérifie après tentative
         if (baseRatesByDate.size === 0 || travcoBaseRatesByDate.size === 0) {
              showGlobalMessage("Impossible de calculer: données tarifs de base (OTA ou Travco) indisponibles.", "error");
              hideResult(resultDivId);
              return null;
         }
    }

    let stayDates;
    try {
        stayDates = generateStayDates(formData.arrivalDate, formData.nights);
    } catch (e) {
        showGlobalMessage(`Erreur dates: ${e.message}`, 'error');
        hideResult(resultDivId);
        return null;
    }

    let subtotal = 0;
    const dailyRatesDetails = [];
    let missingRateWarning = false;
    let firstMissingDate = null;

    for (const date of stayDates) {
        const dailyRate = calculateDailyRate(date, formData.roomCategory, formData.ratePlan);

        if (dailyRate === null) {
            // Si calculateDailyRate retourne null, c'est qu'un tarif base (OTA ou Travco) manque
            missingRateWarning = true;
            if (!firstMissingDate) firstMissingDate = formatDateLocale(date);
            dailyRatesDetails.push({
                date: formatDateLocale(date),
                baseRateSource: formData.ratePlan.startsWith('TRAVCO-') ? 'Travco' : 'OTA', // Indique quelle base manquait
                baseRateValue: null,
                finalRate: 0 // Compte comme 0 pour le total
            });
        } else {
            subtotal += dailyRate;
            // Pour l'affichage, on récupère aussi la valeur du tarif base utilisé
             const baseRateValue = formData.ratePlan.startsWith('TRAVCO-')
                 ? findAbsoluteTravcoBaseRate(date)
                 : findAbsoluteOtaBaseRate(date);
             dailyRatesDetails.push({
                 date: formatDateLocale(date),
                 baseRateSource: formData.ratePlan.startsWith('TRAVCO-') ? 'Travco' : 'OTA',
                 baseRateValue: baseRateValue, // Peut être null même si dailyRate n'est pas null (si formule fixe genre Travco)
                 finalRate: dailyRate
             });
        }
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const discountPercentage = parseFloat(formData.discount) || 0;
    const discountAmount = Math.round((subtotal * (discountPercentage / 100)) * 100) / 100;
    const finalTotal = Math.round((subtotal - discountAmount) * 100) / 100;

    if (missingRateWarning) {
        showGlobalMessage(`Attention: Tarif base manquant pour certaines dates (à partir du ${firstMissingDate}). Nuits calculées à 0€.`, "warning", 10000);
    }

    // Avertissement si total 0 sans erreur apparente de date manquante
    if (finalTotal === 0 && subtotal === 0 && !missingRateWarning && formData.nights > 0) {
        showGlobalMessage("Avertissement: Le total résultant est 0€. Vérifiez les tarifs de base ou les formules pour ces dates.", "warning");
    }

    return {
        dailyRates: dailyRatesDetails,
        subtotal: subtotal,
        discountAmount: discountAmount,
        total: finalTotal,
        missingRateWarning: missingRateWarning
    };
}

async function compareDetailedCosts(formData) {
    const resultDivId = 'compare-result';
    showLoading(resultDivId, "Comparaison en cours...");

     // Assure que les données sont chargées
    if (baseRatesByDate.size === 0 || travcoBaseRatesByDate.size === 0) {
        console.log("Données de base manquantes, tentative de fetch...");
        try { await fetchAndProcessData(); }
        catch (error) { hideResult(resultDivId); return null; }
        if (baseRatesByDate.size === 0 || travcoBaseRatesByDate.size === 0) {
             showGlobalMessage("Impossible de comparer: données tarifs de base indisponibles.", "error");
             hideResult(resultDivId); return null;
        }
    }

    let stayDates;
    try { stayDates = generateStayDates(formData.arrivalDate, formData.nights); }
    catch (e) { showGlobalMessage(`Erreur dates: ${e.message}`, 'error'); hideResult(resultDivId); return null; }

    const comparisonResults = [];
    let missingRateWarning = false;
    let totalRate1 = 0;
    let totalRate2 = 0;
    let firstMissingDate = null;

    for (const date of stayDates) {
        const rate1 = calculateDailyRate(date, formData.roomCategory, formData.ratePlan1);
        const rate2 = calculateDailyRate(date, formData.roomCategory, formData.ratePlan2);
        let diff = null;
         let baseRateInfo = { source: 'N/A', value: null }; // Pour affichage

        // Détermine quelle base est pertinente (plutôt Plan 1 comme référence)
        const isPlan1Travco = formData.ratePlan1.startsWith('TRAVCO-');
        baseRateInfo.source = isPlan1Travco ? 'Travco' : 'OTA';
        baseRateInfo.value = isPlan1Travco ? findAbsoluteTravcoBaseRate(date) : findAbsoluteOtaBaseRate(date);


        if (rate1 === null || rate2 === null) {
            // Si l'un des tarifs n'a pas pu être calculé (base manquante)
            missingRateWarning = true;
            if (!firstMissingDate) firstMissingDate = formatDateLocale(date);
            // On met les deux à null pour la ligne, mais on n'ajoute rien aux totaux
        } else {
            diff = Math.round((rate1 - rate2) * 100) / 100;
            totalRate1 += rate1;
            totalRate2 += rate2;
        }

        comparisonResults.push({
            date: formatDateLocale(date),
            baseRateSource: baseRateInfo.source,
            baseRateValue: baseRateInfo.value,
            rate1: rate1, // Sera null si erreur
            rate2: rate2, // Sera null si erreur
            diff: diff   // Sera null si erreur
        });
    }

    totalRate1 = Math.round(totalRate1 * 100) / 100;
    totalRate2 = Math.round(totalRate2 * 100) / 100;
    const totalDiff = Math.round((totalRate1 - totalRate2) * 100) / 100;

    if (missingRateWarning) {
        showGlobalMessage(`Attention: Tarif base manquant pour certaines dates (à partir du ${firstMissingDate}). Comparaison incomplète.`, "warning", 10000);
    }

    return {
        dailyComparison: comparisonResults,
        totalRate1: totalRate1,
        totalRate2: totalRate2,
        totalDiff: totalDiff,
        missingRateWarning: missingRateWarning
    };
}


// --- Fonctions d'Affichage des Résultats ---
// (Adaptées pour afficher la source du tarif de base)

function displayCalculateResult(formData, result) {
    const resultDiv = document.getElementById('calculate-result');
    if (!resultDiv) { console.error("Element 'calculate-result' introuvable."); return; }
    if (!result) { resultDiv.innerHTML = `<div class='text-red-400 p-4'>Calcul détaillé échoué.</div>`; resultDiv.classList.remove('hidden'); return; }

    let arrivalDate, departureDate;
    try {
         arrivalDate = new Date(formData.arrivalDate + 'T00:00:00Z');
         departureDate = new Date(arrivalDate);
         departureDate.setUTCDate(arrivalDate.getUTCDate() + formData.nights);
         if (isNaN(arrivalDate.getTime()) || isNaN(departureDate.getTime())) throw new Error();
    } catch (e) { showGlobalMessage("Erreur interne: Impossible de formater les dates.", "error"); return; }

    const planDescription = ratePlanDescriptions[formData.ratePlan] || `(Description non disponible)`;
    const partnerText = formData.partner ? `Partenaire: ${formData.partner}` : 'Partenaire: Tous';

    const tableRows = result.dailyRates.map(rate => {
        let baseRateText = '<span class="italic text-xs text-gray-500">Manquant</span>';
        let baseRateTitle = `Tarif base ${rate.baseRateSource} manquant`;
        if (rate.baseRateValue !== null) {
            baseRateText = `${rate.baseRateValue.toFixed(2)}€`;
             baseRateTitle = `Tarif Base ${rate.baseRateSource} (${rate.baseRateSource === 'OTA' ? BASE_RATE_PLAN_NAME : TRAVCO_BASE_PLAN} / ${rate.baseRateSource === 'OTA' ? ABSOLUTE_BASE_CATEGORY_NAME : TRAVCO_BASE_CATEGORY})`;
        }
        const finalRateText = rate.finalRate !== null ? `${rate.finalRate.toFixed(2)}€` : '<span class="italic text-xs text-red-400">Erreur Calcul</span>';

        return `<tr>
                    <td class="px-3 py-2 text-sm text-gray-300">${rate.date}</td>
                    <td class="px-3 py-2 text-end text-sm text-gray-400" title="${baseRateTitle}">${baseRateText}</td>
                    <td class="px-3 py-2 text-end text-sm font-medium text-gray-100">${finalRateText}</td>
                </tr>`;
    }).join('');

    const resultHtml = `
        <h5 class="text-xl font-semibold mb-4 text-light-orange highlight-orange">Détail du calcul pour ${formData.nights} nuit(s)</h5>
        <div class="text-sm text-gray-300 mb-4 space-y-1">
            <p><i class="fas fa-calendar-alt fa-fw mr-2 text-gray-400"></i>Du ${formatDateLocale(arrivalDate)} au ${formatDateLocale(departureDate)}</p>
            <p><i class="fas fa-users fa-fw mr-2 text-gray-400"></i>${partnerText}</p>
            <p><i class="fas fa-bed fa-fw mr-2 text-gray-400"></i>Chambre: <strong>${formData.roomCategory}</strong></p>
            <p><i class="fas fa-tag fa-fw mr-2 text-gray-400"></i>Plan: <strong>${formData.ratePlan}</strong> <span class="text-xs italic text-gray-400 ml-1">${planDescription}</span></p>
        </div>
        ${result.missingRateWarning ? `<p class="alert alert-warning text-xs"><i class="fas fa-exclamation-triangle"></i> Certains tarifs de base journaliers manquaient (nuit calculée à 0€).</p>` : ''}
        <div class="overflow-x-auto rounded-md border border-gray-700 mb-5 shadow-md">
            <table class="min-w-full divide-y divide-gray-700 table">
                <caption class="caption-top text-xs text-gray-400 p-1 bg-darker-charcoal rounded-t-md">Détail par nuit</caption>
                <thead class="bg-darker-charcoal">
                    <tr>
                        <th class="th-style text-left">Date</th>
                        <th class="th-style text-end">Tarif Base Absolu<br><span class="text-xs normal-case">(Source: ${result.dailyRates[0]?.baseRateSource || 'N/A'})</span></th>
                        <th class="th-style text-end">Tarif Calculé<br><span class="text-xs normal-case">Journalier</span></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700 bg-charcoal-dark/40">${tableRows}</tbody>
            </table>
        </div>
        <hr class="border-gray-600 my-4">
        <div class="flex justify-end text-sm">
            <div class="text-right text-gray-300 mr-4 space-y-1">
                <p>Sous-total :</p>
                ${formData.discount > 0 ? `<p>Remise (${formData.discount}%) :</p>` : ''}
                <p class="text-base font-semibold text-gray-100 mt-1">Total Calculé :</p>
            </div>
            <div class="text-right space-y-1">
                <p class="text-gray-200 font-mono">${result.subtotal.toFixed(2)}€</p>
                ${formData.discount > 0 ? `<p class="text-red-400 font-mono">-${result.discountAmount.toFixed(2)}€</p>` : ''}
                <p class="text-lg font-bold text-vibrant-orange mt-1 font-mono"><strong>${result.total.toFixed(2)}€</strong></p>
            </div>
        </div>`;
    resultDiv.innerHTML = resultHtml;
    resultDiv.classList.remove('hidden');
}

function displayVerifyResult(formData, calculatedResult) {
    const resultDiv = document.getElementById('verify-result');
    if (!resultDiv) { console.error("Element 'verify-result' introuvable."); return; }
    if (!calculatedResult) { resultDiv.innerHTML = `<div class='text-red-400 p-4'>Calcul pour vérification échoué.</div>`; resultDiv.classList.remove('hidden'); return; }

    let arrivalDate, departureDate;
    try { arrivalDate = new Date(formData.arrivalDate + 'T00:00:00Z'); departureDate = new Date(arrivalDate); departureDate.setUTCDate(arrivalDate.getUTCDate() + formData.nights); if (isNaN(arrivalDate.getTime()) || isNaN(departureDate.getTime())) throw new Error(); }
    catch (e) { showGlobalMessage("Erreur interne: Impossible de formater les dates.", "error"); return; }

    const receivedTotalNum = getElementValueAsFloat('received-total'); // Utilise la fonction pour gérer la virgule
    let difference = NaN; let isEqual = false;
    if (receivedTotalNum !== null && !isNaN(receivedTotalNum)) {
        difference = Math.abs(calculatedResult.total - receivedTotalNum);
        isEqual = difference < 0.01; // Tolérance pour erreurs virgule flottante
    }

    const planDescription = ratePlanDescriptions[formData.ratePlan] || `(Description N/A)`;
    const partnerText = formData.partner ? `Partenaire: ${formData.partner}` : 'Partenaire: Tous';

    let alertClass = 'alert-error'; let alertIcon = 'fa-exclamation-triangle'; let alertTitle = 'ERREUR'; let alertMessage = 'Total reçu invalide.';
    if (receivedTotalNum !== null && !isNaN(receivedTotalNum)) {
         alertClass = isEqual ? 'alert-success' : 'alert-warning'; // Warning pour écart, success si OK
         alertIcon = isEqual ? 'fa-check-circle' : 'fa-exclamation-triangle';
         alertTitle = isEqual ? 'CONCORDANCE OK' : 'ÉCART DÉTECTÉ';
         alertMessage = isEqual ? '' : `<span class="text-sm">(Différence : ${difference.toFixed(2)}€)</span>`;
    }

    const alertHtml = `<div class="alert ${alertClass} text-base mb-4 shadow-lg"><i class="fas ${alertIcon} text-xl"></i><div class="ml-3"><span class="font-semibold block">${alertTitle}</span>${alertMessage}</div></div>`;

    const tableRows = calculatedResult.dailyRates.map(rate => {
        let baseRateText = '<span class="italic text-xs text-gray-500">Manquant</span>';
        let baseRateTitle = `Tarif base ${rate.baseRateSource} manquant`;
        if (rate.baseRateValue !== null) {
            baseRateText = `${rate.baseRateValue.toFixed(2)}€`;
             baseRateTitle = `Tarif Base ${rate.baseRateSource} (${rate.baseRateSource === 'OTA' ? BASE_RATE_PLAN_NAME : TRAVCO_BASE_PLAN} / ${rate.baseRateSource === 'OTA' ? ABSOLUTE_BASE_CATEGORY_NAME : TRAVCO_BASE_CATEGORY})`;
        }
         const finalRateText = rate.finalRate !== null ? `${rate.finalRate.toFixed(2)}€` : '<span class="italic text-xs text-red-400">Erreur</span>';
        return `<tr>
                    <td class="px-3 py-2 text-sm text-gray-300">${rate.date}</td>
                    <td class="px-3 py-2 text-end text-sm text-gray-400" title="${baseRateTitle}">${baseRateText}</td>
                    <td class="px-3 py-2 text-end text-sm font-medium text-gray-100">${finalRateText}</td>
                </tr>`;
    }).join('');

    const resultHtml = `
        <h5 class="text-xl font-semibold mb-3 text-light-orange highlight-orange">Résultat de la Vérification</h5>
        ${alertHtml}
        <div class="text-sm text-gray-300 mb-4 space-y-1">
            <p><i class="fas fa-calendar-alt fa-fw mr-2 text-gray-400"></i>Du ${formatDateLocale(arrivalDate)} au ${formatDateLocale(departureDate)} (${formData.nights} nuit(s))</p>
            <p><i class="fas fa-users fa-fw mr-2 text-gray-400"></i>${partnerText}</p>
            <p><i class="fas fa-bed fa-fw mr-2 text-gray-400"></i>Chambre: <strong>${formData.roomCategory}</strong></p>
            <p><i class="fas fa-tag fa-fw mr-2 text-gray-400"></i>Plan: <strong>${formData.ratePlan}</strong> <span class="text-xs italic text-gray-400 ml-1">${planDescription}</span> | Remise: ${formData.discount}%</p>
        </div>
        ${calculatedResult.missingRateWarning ? `<p class="alert alert-warning text-xs"><i class="fas fa-exclamation-triangle"></i> Certains tarifs de base manquaient (calcul système à 0€ pour ces nuits).</p>` : ''}
        <div class="overflow-x-auto rounded-md border border-gray-700 mb-5 shadow-md">
             <table class="min-w-full divide-y divide-gray-700 table">
                <caption class="caption-top text-xs text-gray-400 p-1 bg-darker-charcoal rounded-t-md">Détail du calcul système</caption>
                <thead class="bg-darker-charcoal">
                    <tr>
                        <th class="th-style text-left">Date</th>
                         <th class="th-style text-end">Tarif Base Absolu<br><span class="text-xs normal-case">(Source: ${calculatedResult.dailyRates[0]?.baseRateSource || 'N/A'})</span></th>
                        <th class="th-style text-end">Tarif Calculé<br><span class="text-xs normal-case">Journalier</span></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700 bg-charcoal-dark/40">${tableRows}</tbody>
            </table>
        </div>
        <hr class="border-gray-600 my-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="bg-darker-charcoal/30 p-3 rounded border border-gray-700/50">
                <p class="font-medium text-gray-200 mb-2">Récapitulatif Calcul Système :</p>
                <div class="space-y-1 text-gray-300">
                    <p>Sous-total: <span class="float-right font-mono">${calculatedResult.subtotal.toFixed(2)}€</span></p>
                    ${formData.discount > 0 ? `<p>Remise (${formData.discount}%): <span class="float-right font-mono text-red-400">-${calculatedResult.discountAmount.toFixed(2)}€</span></p>` : ''}
                    <p class="font-semibold text-gray-100 pt-1 border-t border-gray-600/50 mt-1">Total Calculé: <strong class="text-lg float-right font-mono">${calculatedResult.total.toFixed(2)}€</strong></p>
                </div>
            </div>
            <div class="bg-darker-charcoal/30 p-3 rounded border border-gray-700/50">
                <p class="font-medium text-gray-200 mb-2">Comparaison :</p>
                <div class="space-y-1 text-gray-300">
                    <p class="font-semibold text-gray-100">Total Reçu Indiqué: <strong class="text-lg float-right font-mono">${receivedTotalNum !== null ? receivedTotalNum.toFixed(2) + '€' : 'N/A'}</strong></p>
                </div>
            </div>
        </div>`;
    resultDiv.innerHTML = resultHtml;
    resultDiv.classList.remove('hidden');
}

function displayCompareResult(formData, result) {
    const resultDiv = document.getElementById('compare-result');
    if (!resultDiv) { console.error("Element 'compare-result' introuvable."); return; }
    if (!result) { resultDiv.innerHTML = `<div class='text-red-400 p-4'>Comparaison échouée.</div>`; resultDiv.classList.remove('hidden'); return; }

    let arrivalDate, departureDate;
    try { arrivalDate = new Date(formData.arrivalDate + 'T00:00:00Z'); departureDate = new Date(arrivalDate); departureDate.setUTCDate(arrivalDate.getUTCDate() + formData.nights); if (isNaN(arrivalDate.getTime()) || isNaN(departureDate.getTime())) throw new Error(); }
    catch (e) { showGlobalMessage("Erreur interne: Impossible de formater les dates.", "error"); return; }

    const descPlan1 = ratePlanDescriptions[formData.ratePlan1] || `(N/A)`;
    const descPlan2 = ratePlanDescriptions[formData.ratePlan2] || `(N/A)`;
    const headerPlan1 = formData.ratePlan1 || 'Plan 1';
    const headerPlan2 = formData.ratePlan2 || 'Plan 2';
    const partnerText = formData.partner ? `Partenaire: ${formData.partner}` : 'Partenaire: Tous';

    const tableRows = result.dailyComparison.map(day => {
        let baseRateText = '<span class="italic text-xs text-gray-500">N/A</span>';
        let baseRateTitle = `Tarif base (${day.baseRateSource}) manquant`;
        if (day.baseRateValue !== null) {
             baseRateText = day.baseRateValue.toFixed(2) + '€';
             baseRateTitle = `Tarif Base ${day.baseRateSource} (${day.baseRateSource === 'OTA' ? BASE_RATE_PLAN_NAME : TRAVCO_BASE_PLAN} / ${day.baseRateSource === 'OTA' ? ABSOLUTE_BASE_CATEGORY_NAME : TRAVCO_BASE_CATEGORY})`;
        }
        const rate1Text = day.rate1 !== null ? day.rate1.toFixed(2) + '€' : '<span class="italic text-xs text-red-400">N/A</span>';
        const rate2Text = day.rate2 !== null ? day.rate2.toFixed(2) + '€' : '<span class="italic text-xs text-red-400">N/A</span>';

        let diffText = '<span class="text-gray-500 italic text-xs">N/A</span>';
        if (day.diff !== null) {
            const diffValue = day.diff.toFixed(2);
            const diffClass = day.diff > 0 ? 'text-red-400' : (day.diff < 0 ? 'text-green-400' : 'text-gray-400');
            diffText = `<span class="${diffClass} font-medium">${diffValue >= 0 ? '+' : ''}${diffValue}€</span>`; // Ajoute + si positif ou 0
        }
        return `<tr>
                    <td class="px-3 py-2 text-sm text-gray-300">${day.date}</td>
                    <td class="px-3 py-2 text-end text-sm text-gray-400" title="${baseRateTitle}">${baseRateText}</td>
                    <td class="px-3 py-2 text-end text-sm text-gray-100 font-mono">${rate1Text}</td>
                    <td class="px-3 py-2 text-end text-sm text-gray-100 font-mono">${rate2Text}</td>
                    <td class="px-3 py-2 text-end text-sm font-mono">${diffText}</td>
                </tr>`;
    }).join('');

    const totalDiffClass = result.totalDiff > 0 ? 'text-red-400' : (result.totalDiff < 0 ? 'text-green-400' : 'text-gray-400');
    const totalDiffText = `${result.totalDiff >= 0 ? '+' : ''}${result.totalDiff.toFixed(2)}€`;

    const resultHtml = `
        <h5 class="text-xl font-semibold mb-3 text-light-orange highlight-orange">Comparaison pour ${formData.nights} nuit(s)</h5>
        <div class="text-sm text-gray-300 mb-4 space-y-1">
            <p><i class="fas fa-calendar-alt fa-fw mr-2 text-gray-400"></i>Du ${formatDateLocale(arrivalDate)} au ${formatDateLocale(departureDate)}</p>
            <p><i class="fas fa-users fa-fw mr-2 text-gray-400"></i>${partnerText}</p>
            <p><i class="fas fa-bed fa-fw mr-2 text-gray-400"></i>Chambre: <strong>${formData.roomCategory}</strong></p>
        </div>
        ${result.missingRateWarning ? `<p class="alert alert-warning text-xs"><i class="fas fa-exclamation-triangle"></i> Certains tarifs de base manquaient. Comparaison incomplète.</p>` : ''}
        <div class="overflow-x-auto rounded-md border border-gray-700 mb-5 shadow-md">
            <table class="min-w-full divide-y divide-gray-700 table">
                <caption class="caption-top text-xs text-gray-400 p-1 bg-darker-charcoal rounded-t-md">Comparaison journalière</caption>
                <thead class="bg-darker-charcoal">
                    <tr>
                        <th class="th-style text-left">Date</th>
                        <th class="th-style text-end">Tarif Base<br><span class="text-xs normal-case">Absolu</span></th>
                        <th class="th-style text-end">${headerPlan1}</th>
                        <th class="th-style text-end">${headerPlan2}</th>
                        <th class="th-style text-end">Écart<br><span class="text-xs normal-case">(Plan 1 - Plan 2)</span></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700 bg-charcoal-dark/40">${tableRows}</tbody>
                <tfoot class="bg-darker-charcoal/80 font-semibold text-gray-100">
                    <tr class="border-t-2 border-gray-600">
                        <td class="px-3 py-2 text-sm text-left" colspan="2">Total Séjour</td>
                        <td class="px-3 py-2 text-end text-sm font-mono">${result.totalRate1.toFixed(2)}€</td>
                        <td class="px-3 py-2 text-end text-sm font-mono">${result.totalRate2.toFixed(2)}€</td>
                        <td class="px-3 py-2 text-end text-sm ${totalDiffClass} font-mono">${totalDiffText}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-3 text-xs italic text-gray-400">
            <div class="mb-1 md:mb-0"><strong>Plan 1 (${headerPlan1}):</strong> ${descPlan1}</div>
            <div><strong>Plan 2 (${headerPlan2}):</strong> ${descPlan2}</div>
        </div>`;
    resultDiv.innerHTML = resultHtml;
    resultDiv.classList.remove('hidden');
}


// --- Validation de Formulaire ---
function validateForm(formData, mode = 'calculate') {
    const errors = [];
    // Champs communs
    if (!formData.arrivalDate) { errors.push("Date d'arrivée requise."); }
    else { try { const d = new Date(formData.arrivalDate + 'T00:00:00Z'); if (isNaN(d.getTime())) errors.push("Date d'arrivée invalide."); } catch (e) { errors.push("Format date arrivée incorrect."); } }
    if (!formData.nights || isNaN(formData.nights) || formData.nights < 1 || formData.nights > 90) { errors.push('Nombre de nuits valide (1-90) requis.'); }
    if (!formData.roomCategory) { errors.push('Catégorie de chambre requise.'); }

    // Champs spécifiques
    if (mode === 'calculate' || mode === 'verify') {
        if (!formData.ratePlan) { errors.push('Plan tarifaire requis.'); }
        const discount = formData.discount; // Déjà parsé en float ou 0
        if (discount === null || isNaN(discount) || discount < 0 || discount > 100) { errors.push('Remise invalide (nombre 0-100 requis).'); }
    }
    if (mode === 'verify') {
        const receivedTotal = getElementValueAsFloat('received-total');
        if (receivedTotal === null || isNaN(receivedTotal) || receivedTotal < 0) { errors.push('Total reçu valide (nombre >= 0) requis.'); }
    }
    if (mode === 'compare') {
        if (!formData.ratePlan1) { errors.push('Plan tarifaire 1 requis.'); }
        if (!formData.ratePlan2) { errors.push('Plan tarifaire 2 requis.'); }
        if (formData.ratePlan1 && formData.ratePlan2 && formData.ratePlan1 === formData.ratePlan2) {
            errors.push('Veuillez sélectionner deux plans tarifaires différents.');
        }
    }
    return { isValid: errors.length === 0, errors: errors };
}

// --- Initialisation et Écouteurs d'Événements ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Chargé. Initialisation de l'application...");
    const choiceSection = document.getElementById('choice-section');
    const calculateSection = document.getElementById('calculate-section');
    const verifySection = document.getElementById('verify-section');
    const compareSection = document.getElementById('compare-section');
    const sections = [calculateSection, verifySection, compareSection];

    if (!choiceSection || sections.some(s => !s)) {
        console.error("ERREUR FATALE: Elements HTML principaux manquants !");
        showGlobalMessage("Erreur critique: Interface non initialisable. Vérifiez la console (F12).", "error", 0);
        return;
    }

    // --- Mise à jour date par défaut ---
    try {
        const today = new Date(); const yyyy = today.getFullYear(); const mm = String(today.getMonth() + 1).padStart(2, '0'); const dd = String(today.getDate()).padStart(2, '0'); const todayStr = `${yyyy}-${mm}-${dd}`;
        ['calculate-arrival-date', 'verify-arrival-date', 'compare-arrival-date'].forEach(id => {
            const input = document.getElementById(id); if (input) input.value = todayStr;
        });
    } catch (e) { console.error("Erreur mise à jour date défaut:", e); }

    // --- Désactive tout au départ ---
    disableAllForms();

    // --- Chargement des données initiales ---
    try {
        await fetchAndProcessData(); // Charge les données
        console.log("Données chargées et traitées. Activation interface.");
        enableAllForms(); // Active les formulaires et la section choix
        // Attache les listeners une seule fois après l'activation initiale
        setupFormListeners('calculate');
        setupFormListeners('verify');
        setupFormListeners('compare');
        setupChoiceListeners(); // Attache listeners pour les cartes de choix
        setupBackButtons(); // Attache listeners pour les boutons retour
        // Message succès enlevé car enableAllForms fait déjà un log
    } catch (error) {
        console.error("Échec final du chargement initial des données. L'interface reste limitée.");
        // Message d'erreur déjà affiché par fetchAndProcessData
    }
}); // Fin DOMContentLoaded


// --- Setup des Listeners (appelé une fois après chargement données) ---

function setupChoiceListeners() {
     const choiceSection = document.getElementById('choice-section');
     const calculateSection = document.getElementById('calculate-section');
     const verifySection = document.getElementById('verify-section');
     const compareSection = document.getElementById('compare-section');
     const sections = [calculateSection, verifySection, compareSection];

     document.querySelectorAll('.choice-card').forEach(card => {
        card.addEventListener('click', () => {
            const targetSectionId = card.getAttribute('data-target');
            const targetSection = document.getElementById(targetSectionId);

            if (targetSection && choiceSection) {
                console.log(`Affichage section: ${targetSectionId}`);
                choiceSection.classList.add('hidden'); // Masque choix
                sections.forEach(section => section.classList.add('hidden')); // Masque toutes les sections
                targetSection.classList.remove('hidden'); // Affiche la cible
                hideResult('calculate-result'); hideResult('verify-result'); hideResult('compare-result'); // Cache anciens résultats

                // Pas besoin de repeupler les dropdowns ici, ils sont déjà peuplés par enableAllForms
                // et les listeners vont gérer les mises à jour en cascade.

            } else {
                console.error(`Cible invalide ou non trouvée pour la carte cliquée: ${targetSectionId}`);
                showGlobalMessage("Erreur: Impossible d'afficher la section demandée.", "error");
            }
        });
    });
}

function setupBackButtons() {
     const choiceSection = document.getElementById('choice-section');
     const calculateSection = document.getElementById('calculate-section');
     const verifySection = document.getElementById('verify-section');
     const compareSection = document.getElementById('compare-section');
     const sections = [calculateSection, verifySection, compareSection];

     document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', () => {
            console.log("Clic sur bouton Retour");
            if (choiceSection) choiceSection.classList.remove('hidden'); // Affiche choix
            sections.forEach(section => section.classList.add('hidden')); // Masque toutes les sections formulaire
            hideResult('calculate-result'); hideResult('verify-result'); hideResult('compare-result'); // Cache résultats
        });
    });
}

function setupFormListeners(formPrefix) {
    console.log(`Attachement listeners pour préfixe: ${formPrefix}`);
    const formElement = document.getElementById(`${formPrefix}-form`);

    // Évite double attachement (sécurité)
    if (!formElement || formElement.dataset.listenersAttached === 'true') {
        console.warn(`Listeners déjà attachés ou formulaire non trouvé pour ${formPrefix}. Skipping.`);
        return;
    }

    const partnerSelect = document.getElementById(`${formPrefix}-partner`);
    const categorySelect = document.getElementById(`${formPrefix}-room-category`);

    // --- Listener Partenaire ---
    partnerSelect?.addEventListener('change', () => {
        console.log(`Listener ${formPrefix}-partner changé`);
        // Met à jour les catégories possibles
        updateCategoryOptions(formPrefix);
        if (categorySelect) categorySelect.value = ""; // Réinitialise catégorie

        // Met à jour les plans possibles (spécifique pour Compare)
        if (formPrefix === 'compare') {
            updateCompareRatePlanOptions(); // Met à jour les plans basés sur partenaire + catégorie
            const rp1 = document.getElementById('compare-rate-plan-1');
            const rp2 = document.getElementById('compare-rate-plan-2');
            if (rp1) rp1.value = ""; updateRatePlanHelp("", 'compare-rate-plan-1-help');
            if (rp2) rp2.value = ""; updateRatePlanHelp("", 'compare-rate-plan-2-help');
        } else {
             // Pour Calcul/Vérif, met à jour les plans ET réinitialise
            updateRatePlanOptions(formPrefix);
            const ratePlanSelect = document.getElementById(`${formPrefix}-rate-plan`);
            if (ratePlanSelect) ratePlanSelect.value = "";
             updateRatePlanHelp("", `${formPrefix}-rate-plan-help`);
             if (categorySelect) categorySelect.disabled = true; // Désactive catégorie tant que plan pas choisi
        }
    });

    // --- Listener Catégorie ---
    categorySelect?.addEventListener('change', () => {
        console.log(`Listener ${formPrefix}-room-category changé`);
        if (formPrefix === 'compare') {
            // Pour Compare, la catégorie débloque les plans
            updateCompareRatePlanOptions();
            const rp1 = document.getElementById('compare-rate-plan-1');
            const rp2 = document.getElementById('compare-rate-plan-2');
            if (rp1) rp1.value = ""; updateRatePlanHelp("", 'compare-rate-plan-1-help');
            if (rp2) rp2.value = ""; updateRatePlanHelp("", 'compare-rate-plan-2-help');
        } else {
            // Pour Calcul/Vérif, la catégorie est choisie APRES le plan,
            // donc on met juste à jour les plans (qui dépendent aussi de la cat)
            updateRatePlanOptions(formPrefix);
            // Pas besoin de réinitialiser le plan ici normalement
        }
    });

    // --- Listener Plan Tarifaire (pour Calcul/Vérif ET Compare) ---
    if (formPrefix === 'compare') {
        const ratePlanSelect1 = document.getElementById('compare-rate-plan-1');
        const ratePlanSelect2 = document.getElementById('compare-rate-plan-2');
        ratePlanSelect1?.addEventListener('change', e => updateRatePlanHelp(e.target.value, 'compare-rate-plan-1-help'));
        ratePlanSelect2?.addEventListener('change', e => updateRatePlanHelp(e.target.value, 'compare-rate-plan-2-help'));
    } else {
        const ratePlanSelect = document.getElementById(`${formPrefix}-rate-plan`);
        ratePlanSelect?.addEventListener('change', (e) => {
            console.log(`Listener ${formPrefix}-rate-plan changé pour ${e.target.value}`);
            // La sélection d'un plan débloque/met à jour les catégories
            updateCategoryOptions(formPrefix);
            if (categorySelect) categorySelect.value = ""; // Réinitialise catégorie à chaque changement de plan
            // Met à jour l'aide du plan
            updateRatePlanHelp(e.target.value, `${formPrefix}-rate-plan-help`);
        });
    }

     // --- Listener Soumission Formulaire ---
     formElement.addEventListener('submit', async (e) => {
         e.preventDefault(); // Empêche rechargement page
         console.log(`Formulaire ${formPrefix} soumis.`);
         const resultDivId = `${formPrefix}-result`;
         hideResult(resultDivId); // Cache ancien résultat
         showLoading(resultDivId, "Traitement..."); // Affiche indicateur

         // Récupération des données du formulaire
         let formData = { formPrefix: formPrefix };
         try {
             formData.arrivalDate = getElementValue(`${formPrefix}-arrival-date`);
             formData.nights = getElementValueAsInt(`${formPrefix}-nights`);
             formData.partner = getElementValue(`${formPrefix}-partner`); // Peut être "" pour "Tous"
             formData.roomCategory = getElementValue(`${formPrefix}-room-category`);

             if (formPrefix === 'calculate' || formPrefix === 'verify') {
                 formData.ratePlan = getElementValue(`${formPrefix}-rate-plan`);
                 formData.discount = getElementValueAsFloat(`${formPrefix}-discount`) ?? 0; // Défaut 0 si invalide
                 if (formPrefix === 'verify') {
                     formData.receivedTotal = getElementValue('received-total'); // Garde en string pour validation
                 }
             } else if (formPrefix === 'compare') {
                 formData.ratePlan1 = getElementValue('compare-rate-plan-1');
                 formData.ratePlan2 = getElementValue('compare-rate-plan-2');
             }

             // Validation
             console.log(`Validation formulaire ${formPrefix} avec données:`, JSON.parse(JSON.stringify(formData)));
             const validation = validateForm(formData, formPrefix);
             if (!validation.isValid) {
                 showGlobalMessage(`Erreurs Formulaire ${formPrefix.charAt(0).toUpperCase() + formPrefix.slice(1)}:\n- ${validation.errors.join('\n- ')}`, 'warning');
                 hideResult(resultDivId); // Cache le loading
                 return; // Arrête le traitement
             }

             // Exécution de l'action (calcul, vérif, comparaison)
             console.log(`Soumission formulaire ${formPrefix} validée. Exécution action...`);
             let resultData = null;
             if (formPrefix === 'calculate') {
                 resultData = await calculateDetailedCost(formData);
                 if (resultData) displayCalculateResult(formData, resultData);
             } else if (formPrefix === 'verify') {
                 resultData = await calculateDetailedCost(formData); // On recalcule pour comparer
                 if (resultData) displayVerifyResult(formData, resultData);
             } else if (formPrefix === 'compare') {
                 resultData = await compareDetailedCosts(formData);
                 if (resultData) displayCompareResult(formData, resultData);
             }

             // Si le calcul/comparaison a échoué (resultData est null) et qu'aucun résultat n'est affiché
             if (!resultData && document.querySelector(`#${resultDivId} .loading-indicator`)) {
                  hideResult(resultDivId); // Cache le loading si l'action a échoué silencieusement
                  showGlobalMessage("Une erreur s'est produite pendant le calcul.", "error");
             }

         } catch (error) {
             console.error(`Erreur lors de la soumission du formulaire ${formPrefix}:`, error);
             showGlobalMessage(`Erreur inattendue (${formPrefix}): ${error.message}`, 'error');
             hideResult(resultDivId); // Cache le loading en cas d'erreur JS
         }
     });

     formElement.dataset.listenersAttached = 'true'; // Marque comme initialisé
     console.log(`Listeners attachés pour ${formPrefix}.`);
} // Fin setupFormListeners