const PERFIS = {
    estrategista: {
        nome: "O ESTRATEGISTA",
        quote: '"Para mim, sorte é apenas matemática sem paciência."',
        desc: "Focado em lógica, probabilidade e controle. Prefere jogos de mesa e desafios onde a tomada de decisão inteligente faz toda a diferença."
    },
    colecionador: {
        nome: "O COLECIONADOR",
        quote: '"Cada vitória é um passo a mais para completar o álbum."',
        desc: "Movido a conquistas, missões e recompensas. Seu objetivo principal é desbloquear selos, completar barras de progresso e garantir todos os troféus."
    },
    desafiador: {
        nome: "O DESAFIADOR",
        quote: '"A emoção só vale a pena quando o risco é alto."',
        desc: "Busca o topo das tabelas e a adrenalina das grandes jogadas. Mantém o foco no status, na competitividade e na busca por prêmios lendários."
    },
    social: {
        nome: "O SOCIAL",
        quote: '"A melhor parte de jogar é com quem você compartilha a mesa."',
        desc: "Valoriza a experiência comunitária e a diversão sem pressão. Joga para relaxar, trocar ideias no chat e celebrar vitórias em equipe."
    }
};

let userWallet = JSON.parse(localStorage.getItem('user_carteira_cassino')) || null;
let html5QrCodeScanner = null;

// Padrão apontando para assets/avatars/
let selectedAvatarPath = 'assets/avatars/avatar1.png';

function selectAvatar(element, imagePath) {
    document.querySelectorAll('.avatar-option').forEach(img => img.classList.remove('selected'));
    element.classList.add('selected');
    selectedAvatarPath = imagePath;
}

function updateProfilePreview() {
    const key = document.getElementById('profile').value;
    const p = PERFIS[key];
    if (p) {
        document.getElementById('profile-quote').innerText = p.quote;
        document.getElementById('profile-desc').innerText = p.desc;
    }
}

function generateRandomID() {
    const num = Math.floor(100000 + Math.random() * 900000);
    return num.toString();
}

// FUNÇÃO ATUALIZADA: Padrão DD/MM/AAAA HH:MIN
function obterDataHoraAtual() {
    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
}

function generateWallet() {
    const nameInput = document.getElementById('username').value.trim();
    if (!nameInput) {
        alert('Por favor, informe o seu nome para continuar.');
        return;
    }

    const key = document.getElementById('profile').value;
    const perfilObj = PERFIS[key];

    const saldos = [50, 100, 150, 200];
    const saldoInicial = saldos[Math.floor(Math.random() * saldos.length)];

    userWallet = {
        nome: nameInput.toUpperCase(),
        perfilKey: key,
        perfilNome: perfilObj.nome,
        perfilDesc: perfilObj.desc,
        idJogador: generateRandomID(),
        dataCriacao: obterDataHoraAtual(), // Utilizando o novo formato DD/MM/AAAA HH:MIN
        saldo: saldoInicial,
        avatarImg: selectedAvatarPath,
        historico: []
    };

    localStorage.setItem('user_carteira_cassino', JSON.stringify(userWallet));
    renderApp();
    checkUrlParams();
}

function switchTab(tab) {
    document.getElementById('tab-extrato').classList.add('hidden');
    document.getElementById('tab-scanner').classList.add('hidden');

    document.getElementById('tab-btn-extrato').classList.remove('active');
    document.getElementById('tab-btn-scanner').classList.remove('active');

    if (tab !== 'scanner') {
        stopCameraScanner();
    }

    if (tab === 'extrato') {
        document.getElementById('tab-extrato').classList.remove('hidden');
        document.getElementById('tab-btn-extrato').classList.add('active');
    } else if (tab === 'scanner') {
        document.getElementById('tab-scanner').classList.remove('hidden');
        document.getElementById('tab-btn-scanner').classList.add('active');
        startCameraScanner();
    }
}

function startCameraScanner() {
    const feedback = document.getElementById('scanner-feedback');
    feedback.innerText = "Iniciando câmera...";

    if (!html5QrCodeScanner) {
        html5QrCodeScanner = new Html5Qrcode("qr-reader");
    }

    const config = { fps: 10, qrbox: { width: 220, height: 220 } };

    html5QrCodeScanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
    ).then(() => {
        feedback.innerText = "Aponte para um QR Code de débito ou crédito.";
    }).catch(err => {
        console.error("Erro ao abrir câmera:", err);
        feedback.innerText = "Erro ao acessar a câmera. Autorize a permissão no navegador.";
    });
}

function stopCameraScanner() {
    if (html5QrCodeScanner && html5QrCodeScanner.isScanning) {
        html5QrCodeScanner.stop().catch(err => console.error(err));
    }
}

function onScanSuccess(decodedText) {
    let valorEncontrado = null;

    if (decodedText.includes('valor=')) {
        const match = decodedText.match(/valor=([-\d]+)/);
        if (match) {
            valorEncontrado = parseInt(match[1], 10);
        }
    } else if (!isNaN(decodedText)) {
        valorEncontrado = parseInt(decodedText, 10);
    }

    if (valorEncontrado !== null && !isNaN(valorEncontrado)) {
        stopCameraScanner();
        processTransaction(valorEncontrado);
        switchTab('extrato');
    } else {
        document.getElementById('scanner-feedback').innerText = "QR Code lido, mas não contém valor válido.";
    }
}

function onScanError(errorMessage) {}

function processTransaction(val) {
    if (!userWallet) return;

    // 🛑 VALIDAÇÃO: Impede que o saldo fique menor que 0
    if (val < 0 && (userWallet.saldo + val) < 0) {
        const toast = document.getElementById('feedback-toast');
        if (toast) {
            toast.style.background = '#dc2626'; // Vermelho
            toast.innerText = `⚠️ Saldo insuficiente! Disponível: $${userWallet.saldo}`;
            toast.classList.remove('hidden');

            window.history.pushState({}, '', window.location.pathname);
            setTimeout(() => { toast.classList.add('hidden'); }, 3500);
        }
        return; // Interrompe a execução, não realiza o débito
    }
    
    // Processa a transação normalmente caso haja saldo suficiente
    userWallet.saldo += val;
    const isPos = val > 0;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    userWallet.historico.unshift({
        desc: isPos ? 'Crédito via QR Code' : 'Débito via QR Code',
        valor: val,
        hora: timeStr
    });

    localStorage.setItem('user_carteira_cassino', JSON.stringify(userWallet));
    renderApp();

    const toast = document.getElementById('feedback-toast');
    if (toast) {
        toast.style.background = isPos ? '#16a34a' : '#dc2626';
        toast.innerText = `${isPos ? '➕ Crédito' : '➖ Débito'} de $${Math.abs(val)} efetuado!`;
        toast.classList.remove('hidden');

        window.history.pushState({}, '', window.location.pathname);
        setTimeout(() => { toast.classList.add('hidden'); }, 3000);
    }
}

function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const valParam = params.get('valor');
    if (valParam && !isNaN(valParam) && userWallet) {
        processTransaction(parseFloat(valParam));
    }
}

function renderApp() {
    if (!userWallet) {
        document.getElementById('screen-register').classList.remove('hidden');
        document.getElementById('screen-main').classList.add('hidden');
        return;
    }

    document.getElementById('screen-register').classList.add('hidden');
    document.getElementById('screen-main').classList.remove('hidden');

    const avatarEl = document.getElementById('wallet-avatar');
    if (avatarEl && userWallet.avatarImg) {
        avatarEl.src = userWallet.avatarImg;
    }

    document.getElementById('wallet-name').innerText = userWallet.nome;
    document.getElementById('wallet-id').innerText = userWallet.idJogador;
    document.getElementById('wallet-date').innerText = userWallet.dataCriacao;
    document.getElementById('wallet-balance').innerText = userWallet.saldo;

    const perfilDescEl = document.getElementById('wallet-profile-desc');
    if (perfilDescEl) {
        const descText = userWallet.perfilDesc || (PERFIS[userWallet.perfilKey] ? PERFIS[userWallet.perfilKey].desc : "");
        perfilDescEl.innerText = descText;
    }

    renderLog();
}

function renderLog() {
    const list = document.getElementById('transaction-list');
    if (!userWallet.historico || userWallet.historico.length === 0) {
        list.innerHTML = '<div style="color:#64748b; text-align:center; padding:10px; font-size:0.8rem;">Nenhuma movimentação realizada.</div>';
        return;
    }

    list.innerHTML = '';
    userWallet.historico.forEach(item => {
        const isPos = item.valor > 0;
        const div = document.createElement('div');
        div.className = `log-entry ${isPos ? 'pos' : 'neg'}`;
        div.innerHTML = `
            <div>
                <strong>${item.desc}</strong>
                <div style="color:#64748b; font-size:0.7rem;">${item.hora}</div>
            </div>
            <strong style="color:${isPos ? '#22c55e' : '#ef4444'}; font-size:0.95rem;">
                ${isPos ? '+' : ''}${item.valor}
            </strong>
        `;
        list.appendChild(div);
    });
}

function resetWallet() {
    if (confirm('Deseja encerrar a sessão e criar um novo jogador neste aparelho?')) {
        stopCameraScanner();
        localStorage.removeItem('user_carteira_cassino');
        userWallet = null;
        renderApp();
    }
}

window.onload = () => {
    updateProfilePreview();
    renderApp();
    checkUrlParams();
};

function downloadCarteira(event) {
    if (event) event.preventDefault();

    const carteiraElement = document.querySelector('.carteira-card');
    const linkBtn = document.querySelector('.download-link-carteira');

    if (!carteiraElement) {
        alert('Carteira não encontrada para download.');
        return;
    }

    const textoOriginal = linkBtn ? linkBtn.innerText : '';
    if (linkBtn) linkBtn.innerText = 'gerando imagem...';

    // Captura o elemento da carteira e transforma em imagem PNG
    html2canvas(carteiraElement, {
        scale: 2, // Garante alta resolução na imagem gerada
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
    }).then(canvas => {
        const image = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        const nomeArquivo = userWallet && userWallet.nome ? userWallet.nome.toLowerCase().replace(/\s+/g, '_') : 'jogador';
        
        downloadLink.href = image;
        downloadLink.download = `carteira_${nomeArquivo}.png`;
        downloadLink.click();

        if (linkBtn) linkBtn.innerText = textoOriginal;
    }).catch(err => {
        console.error('Erro ao gerar imagem:', err);
        if (linkBtn) linkBtn.innerText = textoOriginal;
        alert('Ocorreu um erro ao baixar a imagem. Tente novamente.');
    });
}