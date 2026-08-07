// DICIONÁRIO DOS NOVO PERFIS
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

// ATUALIZA A PRÉVIA DO PERFIL NA TELA DE CADASTRO
function updateProfilePreview() {
    const key = document.getElementById('profile').value;
    const p = PERFIS[key];
    if (p) {
        document.getElementById('profile-quote').innerText = p.quote;
        document.getElementById('profile-desc').innerText = p.desc;
    }
}

// GERA ID DE 6 DÍGITOS (#000000)
function generateRandomID() {
    const num = Math.floor(100000 + Math.random() * 900000);
    return '#' + num;
}

// FORMATA DATA E HORA (FORMATO EXATO DA IMAGEM)
function getFormattedDate() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const now = new Date();
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();

    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${dayName}, ${monthName} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
}

// CADASTRA O JOGADOR E EMITE A CARTEIRA
function generateWallet() {
    const nameInput = document.getElementById('username').value.trim();
    if (!nameInput) {
        alert('Por favor, informe o seu nome para continuar.');
        return;
    }

    const key = document.getElementById('profile').value;
    const perfilObj = PERFIS[key];

    // SALDO SORTEADO ENTRE 50, 100, 150 OU 200
    const saldos = [50, 100, 150, 200];
    const saldoInicial = saldos[Math.floor(Math.random() * saldos.length)];

    userWallet = {
        nome: nameInput.toUpperCase(),
        perfil: perfilObj.nome,
        idJogador: generateRandomID(),
        dataCriacao: getFormattedDate(),
        saldo: saldoInicial,
        historico: []
    };

    localStorage.setItem('user_carteira_cassino', JSON.stringify(userWallet));
    renderApp();
    checkUrlParams();
}

// CONTROLE DE ABAS (EXTRATO OU QR CODE)
function switchTab(tab) {
    document.getElementById('tab-extrato').classList.add('hidden');
    document.getElementById('tab-qrcode').classList.add('hidden');
    document.getElementById('tab-btn-extrato').classList.remove('active');
    document.getElementById('tab-btn-qrcode').classList.remove('active');

    if (tab === 'extrato') {
        document.getElementById('tab-extrato').classList.remove('hidden');
        document.getElementById('tab-btn-extrato').classList.add('active');
    } else {
        document.getElementById('tab-qrcode').classList.remove('hidden');
        document.getElementById('tab-btn-qrcode').classList.add('active');
        renderQRCode();
    }
}

// GERA O QR CODE DO JOGADOR
function renderQRCode() {
    const container = document.getElementById('player-qrcode-container');
    container.innerHTML = '';
    if (userWallet) {
        new QRCode(container, {
            text: `JOGADOR:${userWallet.idJogador}:${userWallet.nome}`,
            width: 150,
            height: 150
        });
    }
}

// PROCESSA DÉBITO OU CRÉDITO LIDO VIA QR CODE
function processTransaction(val) {
    if (!userWallet) return;
    
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

    // TOAST NOTIFICAÇÃO
    const toast = document.getElementById('feedback-toast');
    toast.style.background = isPos ? '#16a34a' : '#dc2626';
    toast.innerText = `${isPos ? '➕ Crédito' : '➖ Débito'} de $${Math.abs(val)} efetuado!`;
    toast.classList.remove('hidden');

    window.history.pushState({}, '', window.location.pathname);
    setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

// VERIFICA SE O QR CODE SCANNER ENVIOU PARÂMETROS
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const valParam = params.get('valor');
    if (valParam && !isNaN(valParam) && userWallet) {
        processTransaction(parseFloat(valParam));
    }
}

// RENDERIZA A INTERFACE NA TELA
function renderApp() {
    if (!userWallet) {
        document.getElementById('screen-register').classList.remove('hidden');
        document.getElementById('screen-main').classList.add('hidden');
        return;
    }

    document.getElementById('screen-register').classList.add('hidden');
    document.getElementById('screen-main').classList.remove('hidden');

    // PREENCHE DADOS NA CREDENCIAL DA IMAGEM
    document.getElementById('wallet-name').innerText = userWallet.nome;
    document.getElementById('wallet-profile-title').innerText = userWallet.perfil;
    document.getElementById('wallet-id-display').innerText = userWallet.idJogador;
    document.getElementById('wallet-date-display').innerText = userWallet.dataCriacao;
    document.getElementById('wallet-balance-display').innerText = `"${userWallet.saldo}"`;

    document.getElementById('meta-id').innerText = userWallet.idJogador.replace('#', '');

    renderLog();
}

// RENDERIZA LISTA DO EXTRATO
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

// ENCERRAR SESSÃO / NOVO CADASTRO
function resetWallet() {
    if (confirm('Deseja encerrar a sessão e criar um novo jogador neste aparelho?')) {
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