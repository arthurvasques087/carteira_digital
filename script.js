// Função para gerar o ID automático (# + 6 dígitos)
function generatePlayerId() {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return '#' + randomDigits;
}

// Função para formatar a data/hora exata (DD/MM/AAAA 00:00 AM/PM)
function getFormattedDateTime() {
    const now = new Date();
    const data = now.toLocaleDateString('pt-BR'); // Ex: 06/08/2026
    const hora = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // Ex: 06:54 PM
    return `${data} ${hora}`;
}

// Atualização do cadastro do jogador
function generateWallet() {
    const nameInput = DOM.usernameInput.value.trim();
    if (!nameInput) {
        alert('Por favor, informe seu nome.');
        return;
    }

    userData.nome = nameInput;
    
    // Perfil selecionado
    const selectedKey = DOM.profileSelect.value;
    userData.perfil = PERFIS_JOGADOR[selectedKey].nome;

    // 1. Gera o ID do Jogador (# + 6 números aleatórios)
    userData.idJogador = generatePlayerId();

    // 2. Registra o Dia / Hora da criação da carteira
    userData.dataHora = getFormattedDateTime();

    // 3. Sorteia o Saldo Total entre 50, 100 ou 150
    const saldosPossiveis = [50, 100, 150];
    userData.saldo = saldosPossiveis[Math.floor(Math.random() * saldosPossiveis.length)];

    userData.historico = [];
    saveLocalState();

    // Salva no Google Sheets incluindo ID e Data/Hora
    saveToGoogleSheets({
        idJogador: userData.idJogador,
        dataHora: userData.dataHora,
        nome: userData.nome,
        genero: userData.genero,
        tomPele: userData.tomPele,
        perfil: userData.perfil,
        saldo: userData.saldo
    });

    renderApp();
}

// Renderiza as informações na tela
function renderApp() {
    DOM.screenStart.classList.add('hidden');
    DOM.screenRegister.classList.add('hidden');
    DOM.screenMain.classList.remove('hidden');

    DOM.walletName.innerText = userData.nome;
    DOM.walletProfile.innerText = userData.perfil;
    DOM.walletBalance.innerText = `$ ${userData.saldo}`;

    // Preenche ID e Data/Hora no cartão
    document.getElementById('wallet-id').innerText = userData.idJogador || generatePlayerId();
    document.getElementById('wallet-date').innerText = userData.dataHora || getFormattedDateTime();

    DOM.walletAvatarDisplay.innerText = userData.avatarIcon;
    DOM.walletAvatarDisplay.style.backgroundColor = userData.tomPele;

    renderLog();
    switchTab('carteira');
}