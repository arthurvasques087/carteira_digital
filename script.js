const GOOGLE_SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbwvFIGLhGilsaXBp1o2y9vbUrGg1Imy18fjOzD2_tM20VvlJqskjDxpJZ-fJ2YYyInErQ/exec";

const userData = {
    nome: '',
    perfil: '',
    genero: 'M',
    tomPele: '#fadcac',
    saldo: 0,
    avatarIcon: '👦'
};

const DOM = {
    screenStart: document.getElementById('screen-start'),
    screenRegister: document.getElementById('screen-register'),
    screenMain: document.getElementById('screen-main'),
    tabCarteira: document.getElementById('tab-carteira'),
    tabQrCode: document.getElementById('tab-qrcode'),
    btnTabCarteira: document.getElementById('btn-tab-carteira'),
    btnTabQrCode: document.getElementById('btn-tab-qrcode'),
    usernameInput: document.getElementById('username'),
    profileSelect: document.getElementById('profile'),
    avatarDisplay: document.getElementById('avatar-display'),
    optM: document.getElementById('opt-m'),
    optF: document.getElementById('opt-f'),
    skinOptions: document.querySelectorAll('.skin-option'),
    walletAvatarDisplay: document.getElementById('wallet-avatar-display'),
    walletName: document.getElementById('wallet-name'),
    walletProfile: document.getElementById('wallet-profile'),
    walletBalance: document.getElementById('wallet-balance'),
    transactionLog: document.getElementById('transaction-log'),
    feedbackMsg: document.getElementById('feedback-msg'),
    btnSimulateUrl: document.getElementById('btn-simulate-url'),
    btnGenerateWallet: document.getElementById('btn-generate-wallet'),
    btnResetApp: document.getElementById('btn-reset-app'),
    qrButtons: document.querySelectorAll('.btn-qr')
};

function init() {
    if (DOM.btnSimulateUrl) DOM.btnSimulateUrl.addEventListener('click', simulateQrScan);
    DOM.btnGenerateWallet.addEventListener('click', generateWallet);
    DOM.btnResetApp.addEventListener('click', resetApp);
    
    DOM.optM.addEventListener('click', () => selectGender('M'));
    DOM.optF.addEventListener('click', () => selectGender('F'));

    DOM.skinOptions.forEach(opt => {
        opt.addEventListener('click', (e) => selectSkin(e.target.getAttribute('data-color')));
    });

    DOM.btnTabCarteira.addEventListener('click', () => switchTab('carteira'));
    DOM.btnTabQrCode.addEventListener('click', () => switchTab('qrcode'));

    DOM.qrButtons.forEach(btn => {
        btn.addEventListener('click', () => processTransaction(parseInt(btn.getAttribute('data-value'), 10)));
    });

    checkUrlParameters();
}

function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('modo') === 'cadastro') {
        openRegistration();
    }
}

function simulateQrScan() {
    window.history.pushState({}, '', '?modo=cadastro');
    openRegistration();
}

function openRegistration() {
    DOM.screenStart.classList.add('hidden');
    DOM.screenRegister.classList.remove('hidden');
}

function selectGender(gender) {
    userData.genero = gender;
    DOM.optM.classList.toggle('selected', gender === 'M');
    DOM.optF.classList.toggle('selected', gender === 'F');
    updateAvatarDisplay();
}

function selectSkin(color) {
    userData.tomPele = color;
    DOM.skinOptions.forEach(opt => {
        opt.classList.toggle('selected', opt.getAttribute('data-color') === color);
    });
    updateAvatarDisplay();
}

function updateAvatarDisplay() {
    userData.avatarIcon = userData.genero === 'M' ? '👦' : '👧';
    DOM.avatarDisplay.innerText = userData.avatarIcon;
    DOM.avatarDisplay.style.backgroundColor = userData.tomPele;
}

function saveToGoogleSheets(data) {
    if (GOOGLE_SHEETS_API_URL.includes("SUA_URL_DO_GOOGLE")) return;
    
    fetch(GOOGLE_SHEETS_API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).catch(err => console.error("Erro ao integrar Google Sheets:", err));
}

function generateWallet() {
    const nameInput = DOM.usernameInput.value.trim();
    if (!nameInput) {
        alert('Por favor, informe seu nome.');
        return;
    }

    userData.nome = nameInput;
    const selectedProfile = DOM.profileSelect.value;

    switch (selectedProfile) {
        case 'casual': userData.perfil = 'Casual'; userData.saldo = 50; break;
        case 'hardcore': userData.perfil = 'Hardcore'; userData.saldo = 100; break;
        case 'estrategista': userData.perfil = 'Estrategista'; userData.saldo = 150; break;
        case 'colecionador': userData.perfil = 'Colecionador'; userData.saldo = 200; break;
        case 'random': userData.perfil = 'Aleatório'; userData.saldo = Math.floor(Math.random() * 200) + 10; break;
    }

    saveToGoogleSheets({
        nome: userData.nome,
        genero: userData.genero,
        tomPele: userData.tomPele,
        perfil: userData.perfil,
        saldo: userData.saldo
    });

    renderApp();
}

function renderApp() {
    DOM.screenRegister.classList.add('hidden');
    DOM.screenMain.classList.remove('hidden');

    DOM.walletName.innerText = userData.nome;
    DOM.walletProfile.innerText = userData.perfil;
    DOM.walletBalance.innerText = `$ ${userData.saldo}`;

    DOM.walletAvatarDisplay.innerText = userData.avatarIcon;
    DOM.walletAvatarDisplay.style.backgroundColor = userData.tomPele;

    DOM.transactionLog.innerHTML = '<div style="color:#8c8266; text-align:center;">Nenhuma transação efetuada.</div>';
    switchTab('carteira');
}

function switchTab(tabName) {
    if (tabName === 'carteira') {
        DOM.tabCarteira.classList.remove('hidden');
        DOM.tabQrCode.classList.add('hidden');
        DOM.btnTabCarteira.classList.add('active');
        DOM.btnTabQrCode.classList.remove('active');
    } else {
        DOM.tabCarteira.classList.add('hidden');
        DOM.tabQrCode.classList.remove('hidden');
        DOM.btnTabCarteira.classList.remove('active');
        DOM.btnTabQrCode.classList.add('active');
    }
}

function processTransaction(value) {
    userData.saldo += value;
    DOM.walletBalance.innerText = `$ ${userData.saldo}`;

    if (DOM.transactionLog.innerText.includes('Nenhuma transação')) {
        DOM.transactionLog.innerHTML = '';
    }

    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    
    const isPositive = value > 0;
    const color = isPositive ? 'var(--green-positive)' : 'var(--red-negative)';
    const type = isPositive ? 'Leitura QR (+)' : 'Leitura QR (-)';

    logItem.innerHTML = `<span>${type}</span><strong style="color: ${color}">${isPositive ? '+' : ''}${value}</strong>`;
    DOM.transactionLog.prepend(logItem);

    DOM.feedbackMsg.style.color = color;
    DOM.feedbackMsg.innerText = `QR Code Lido! ${isPositive ? '+' : ''}${value} aplicado.`;
    setTimeout(() => { DOM.feedbackMsg.innerText = ''; }, 3000);
}

function resetApp() {
    window.history.pushState({}, '', window.location.pathname);
    DOM.screenMain.classList.add('hidden');
    DOM.screenStart.classList.remove('hidden');
    DOM.usernameInput.value = '';
}

document.addEventListener('DOMContentLoaded', init);