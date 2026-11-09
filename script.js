//
// FASE 1: Modelagem dos dados (Classe Base)
//
class Produto {
    constructor(nome, preco, quantidade) {
        this.nome = nome;
        this.preco = parseFloat(preco);
        this.quantidade = parseInt(quantidade);
    }

    // Método que calcula o subtotal do produto
    calcularSubtotal() {
        return this.preco * this.quantidade;
    }
}

//
// FASE 2: Gerenciamento de Estado (Memória)
//
const listaDeProdutos = [];

// 🆕 FASE 2.2: Estado auxiliar de edição
// null = "Modo Cadastro" | número = "Modo Edição" (índice do produto sendo editado)
let indiceEdicao = null;

//
// 🆕 FASE 2.1: Persistência com localStorage
//
// Definimos uma constante para evitar erros de digitação ao usar a chave do localStorage
const CHAVE_STORAGE = "sistema_estoque_produtos";

// 1. Função para SALVAR os dados no navegador
function salvarNoLocalStorage() {
    // JSON.stringify converte o Array de Objetos JS em uma String JSON
    const listaEmTexto = JSON.stringify(listaDeProdutos);
    localStorage.setItem(CHAVE_STORAGE, listaEmTexto);
}

// 2. Função para CARREGAR os dados salvos quando a página abrir
function carregarDoLocalStorage() {
    const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);

    // Se existirem dados salvos anteriormente no navegador...
    if (dadosSalvos) {
        // Converte a string JSON de volta para um Array de objetos genéricos
        const produtosObjetos = JSON.parse(dadosSalvos);

        // ATENÇÃO (Conceito POO): Reinstanciamos cada produto com "new Produto()"
        // para garantir que os objetos recuperem o método .calcularSubtotal()
        produtosObjetos.forEach((prod) => {
            const produtoInstanciado = new Produto(prod.nome, prod.preco, prod.quantidade);
            listaDeProdutos.push(produtoInstanciado);
        });
    }
}

//
// FASE 3: Captura de Elementos do DOM
//
const formProduto = document.getElementById("produto-form");
const btnLimparTudo = document.getElementById("limpar-tabela");
const totalEstoqueEl = document.getElementById("total-estoque");
const btnSubmit = document.querySelector(".btn-primary");
// 🆕 V4: campo de pesquisa
const campoBusca = document.getElementById("campo-busca");

//
// FASE 4: Escuta de Eventos
//

// 1. Adicionar ou Editar Produto pelo Formulário
formProduto.addEventListener("submit", function (event) {
    event.preventDefault();

    // Sanitização: .trim() remove espaços no início e no fim do nome
    const nome = document.getElementById("nome").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);
    const quantidade = parseInt(document.getElementById("quantidade").value);

    // Guard Clauses: interrompem a execução caso algum dado seja inválido
    if (!nome) {
        alert("Por favor, informe um nome válido para o produto.");
        return;
    }

    if (isNaN(preco) || preco <= 0 || isNaN(quantidade) || quantidade <= 0) {
        alert("O preço e a quantidade devem ser valores numéricos maiores que zero.");
        return;
    }

    // Dados válidos: prossegue com a inclusão ou a edição
    const novoProduto = new Produto(nome, preco, quantidade);

    if (indiceEdicao === null) {
        // Modo Inclusão
        listaDeProdutos.push(novoProduto);
    } else {
        // Modo Edição: substitui o item na posição correspondente
        listaDeProdutos[indiceEdicao] = novoProduto;
    }

    salvarNoLocalStorage();
    atualizarInterface();
    resetarFormulario();
});

// 2. Limpar toda a tabela
btnLimparTudo.addEventListener("click", function () {
    if (listaDeProdutos.length === 0) {
        alert("A tabela já está vazia!");
        return;
    }

    if (confirm("Tem certeza que deseja remover todos os produtos?")) {
        listaDeProdutos.length = 0;

        // 🆕 Remove a chave inteira do localStorage
        localStorage.removeItem(CHAVE_STORAGE);

        resetarFormulario();
        atualizarInterface();
    }
});

// 3. 🆕 V4: Pesquisa em tempo real (dispara a cada tecla digitada)
campoBusca.addEventListener("input", function () {
    atualizarInterface();
});

//
// FASE 5: Funções de Atualização e Renderização da Interface
//

// 🆕 Preenche o formulário com os dados do produto e entra no Modo Edição
function prepararEdicao(index) {
    const produto = listaDeProdutos[index];

    // 1. Preenche os campos com os dados existentes
    document.getElementById("nome").value = produto.nome;
    document.getElementById("preco").value = produto.preco;
    document.getElementById("quantidade").value = produto.quantidade;

    // 2. Transfere o estado para Modo Edição e atualiza a interface
    indiceEdicao = index;
    btnSubmit.textContent = "Salvar Alterações";
    document.getElementById("nome").focus();
}

// 🆕 Restaura o Modo Cadastro (limpa campos, indiceEdicao e texto do botão)
function resetarFormulario() {
    formProduto.reset();
    indiceEdicao = null;
    btnSubmit.textContent = "Adicionar Produto";
}

// Função responsável por remover um único produto pelo índice
function removerProduto(index) {
    listaDeProdutos.splice(index, 1);

    // Os índices mudam após remover, então saímos do Modo Edição por segurança
    if (indiceEdicao !== null) {
        resetarFormulario();
    }

    // 🆕 Salva a nova lista (sem o item removido) no localStorage
    salvarNoLocalStorage();

    atualizarInterface();
}

// 🆕 V4: Retorna somente os produtos cujo nome contém o termo pesquisado.
// .filter() cria uma NOVA lista, sem alterar a listaDeProdutos original.
function obterProdutosFiltrados() {
    const termo = campoBusca.value.trim().toLowerCase();
    return listaDeProdutos.filter((produto) =>
        produto.nome.toLowerCase().includes(termo)
    );
}

// Função responsável por calcular e renderizar o total em estoque
// 🆕 V4: considera apenas os itens visíveis (filtrados) na tela
function atualizarTotalEstoque() {
    const total = obterProdutosFiltrados().reduce((acc, produto) => {
        return acc + produto.calcularSubtotal();
    }, 0);

    totalEstoqueEl.textContent = `Total em Estoque: R$ ${total.toFixed(2)}`;
}

// Função responsável por re-desenhar a tabela
function renderizarTabela() {
    const tabelaBody = document.querySelector("#tabela-produtos tbody");

    tabelaBody.innerHTML = "";

    const produtosVisiveis = obterProdutosFiltrados();

    // 🆕 V4: mensagem quando a busca não encontra nenhum produto
    if (produtosVisiveis.length === 0 && listaDeProdutos.length > 0) {
        tabelaBody.innerHTML = `<tr><td colspan="5" class="sem-resultados">Produto não encontrado.</td></tr>`;
        return;
    }

    produtosVisiveis.forEach((produto) => {
        // Índice real na lista original (necessário para editar/remover corretamente)
        const index = listaDeProdutos.indexOf(produto);
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${produto.nome}</td>
            <td>R$ ${produto.preco.toFixed(2)}</td>
            <td>${produto.quantidade}</td>
            <td>R$ ${produto.calcularSubtotal().toFixed(2)}</td>
            <td>
                <button class="btn-editar">Editar</button>
                <button class="btn-remover">Remover</button>
            </td>
        `;

        // 🆕 Desafio: botão Editar chama prepararEdicao(index)
        const btnEditar = linha.querySelector(".btn-editar");
        btnEditar.addEventListener("click", () => prepararEdicao(index));

        const btnRemover = linha.querySelector(".btn-remover");
        btnRemover.addEventListener("click", () => removerProduto(index));

        tabelaBody.appendChild(linha);
    });
}

// Função principal que sincroniza a tela com os dados
function atualizarInterface() {
    renderizarTabela();
    atualizarTotalEstoque();
}

//
// 🆕 FASE 6: Inicialização da Aplicação
//
// Ao carregar o script pela primeira vez, restaura os dados do localStorage
// e atualiza a interface gráfica.
carregarDoLocalStorage();
atualizarInterface();