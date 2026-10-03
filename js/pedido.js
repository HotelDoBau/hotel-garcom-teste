let carrinho = [];

let produtosDisponiveis = [];

const listaProdutos =
    document.getElementById("listaProdutos");

const buscar =
    document.getElementById("buscar");

const qtdItens =
    document.getElementById("qtdItens");

const totalPedido =
    document.getElementById("totalPedido");


const numeroMesa =
    localStorage.getItem("mesaSelecionada");

const tipoSelecionado =
    localStorage.getItem("tipoSelecionado") || "mesa";


const ehQuarto =
    tipoSelecionado === "quarto";


const nomeLocal =
    ehQuarto ? "Quarto" : "Mesa";


const prefixoLocal =
    ehQuarto ? "quarto_" : "mesa_";


// ===========================
// VERIFICA MESA
// ===========================

if (!numeroMesa) {

    window.location.href =
        "index.html";

}


// ===========================
// TÍTULO
// ===========================

document.getElementById(
    "tituloMesa"
).textContent =

    nomeLocal +
    " " +
    String(numeroMesa).padStart(2, "0");


// ===========================
// IMAGENS
// ===========================

function obterImagem(produto) {

    /*
     * Produto cadastrado pelo sistema:
     * usa primeiro a foto salva no Cloudinary.
     */

    if (produto.foto) {

        return produto.foto;

    }


    /*
     * Mantém compatibilidade caso
     * algum produto ainda possua
     * a propriedade imagem.
     */

    if (produto.imagem) {

        return produto.imagem;

    }


    const nome =
        String(
            produto.nome || ""
        ).toLowerCase();


    if (
        produto.categoria ===
        "Cafeteria"
    ) {

        if (

            nome.includes("cappuccino") ||
            nome.includes("frapp") ||
            nome.includes("affogato") ||
            nome.includes("mochac")

        ) {

            return "img/cappuccino-espresso.webp";

        }


        return "img/cafe-espresso.webp";

    }


    if (
        produto.categoria ===
        "Salgados"
    ) {

        return "img/salgados.webp";

    }


    if (
        produto.categoria ===
        "Lanches"
    ) {

        return "img/lanche.webp";

    }


    if (
        produto.categoria ===
        "Pratos Feitos"
    ) {

        return "img/pf.webp";

    }


    if (
        produto.categoria ===
        "Bebidas"
    ) {

        return "img/bebidas.webp";

    }


    if (
        produto.categoria ===
        "Cervejas e Vinhos"
    ) {

        return "img/bebidas.webp";

    }


    if (
        produto.categoria ===
        "Adicionais"
    ) {

        return "img/adicionais.webp";

    }


    if (
        produto.categoria ===
        "Doces"
    ) {

        return "img/doces.webp";

    }


    if (
        produto.categoria ===
        "Petiscos"
    ) {

        return "img/petiscos.webp";

    }


    if (
        produto.categoria ===
        "Drinks"
    ) {

        return "img/drinks.webp";

    }


    if (
        produto.categoria ===
        "Outros"
    ) {

        return "";

    }


    return "";

}


// ===========================
// AGUARDAR FIREBASE
// ===========================

async function aguardarFirebase() {

    let tentativas = 0;


    while (

        !window.firebaseHotel &&
        tentativas < 50

    ) {

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    100
                )
        );

        tentativas++;

    }


    return !!window.firebaseHotel;

}


// ===========================
// CARREGAR PRODUTOS
// ===========================

async function carregarProdutosFirebase() {

    /*
     * Agora os produtos vêm
     * exclusivamente do Firestore.
     */

    produtosDisponiveis = [];


    const conectado =
        await aguardarFirebase();


    if (!conectado) {

        console.error(
            "Firebase não conectado. Não foi possível carregar os produtos."
        );

        listaProdutos.innerHTML = `

            <div
                style="
                    padding: 20px;
                    text-align: center;
                "
            >

                Não foi possível carregar
                os produtos.

            </div>

        `;

        return;

    }


    try {

        const {

            db,
            collection,
            getDocs

        } = window.firebaseHotel;


        const referencia =
            collection(
                db,
                "produtos"
            );


        const resultado =
            await getDocs(
                referencia
            );


        resultado.forEach(
            documento => {

                const dados =
                    documento.data();


                produtosDisponiveis.push({

                    /*
                     * ID do documento do Firestore.
                     */

                    id:
                        documento.id,

                    nome:
                        dados.nome || "",

                    categoria:
                        dados.categoria ||
                        "Outros",

                    descricao:
                        dados.descricao || "",

                    preco:
                        Number(
                            dados.preco || 0
                        ),

                    foto:
                        dados.foto || ""

                });

            }
        );


        /*
         * Ordena primeiro pela categoria
         * e depois pelo nome.
         */

        produtosDisponiveis.sort(
            (a, b) => {

                const categoriaA =
                    String(
                        a.categoria || ""
                    ).toLowerCase();

                const categoriaB =
                    String(
                        b.categoria || ""
                    ).toLowerCase();


                if (
                    categoriaA <
                    categoriaB
                ) {

                    return -1;

                }


                if (
                    categoriaA >
                    categoriaB
                ) {

                    return 1;

                }


                return String(
                    a.nome || ""
                ).localeCompare(
                    String(
                        b.nome || ""
                    ),
                    "pt-BR"
                );

            }
        );


        console.log(
            "Produtos carregados do Firestore:",
            produtosDisponiveis
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar produtos do Firebase:",
            erro
        );


        listaProdutos.innerHTML = `

            <div
                style="
                    padding: 20px;
                    text-align: center;
                "
            >

                Erro ao carregar os produtos.

            </div>

        `;

    }

}


// ===========================
// CARREGAR LISTA DE PRODUTOS
// ===========================

function renderizarProdutos(
    filtro = ""
) {

    listaProdutos.innerHTML = "";


    const categorias = [

        ...new Set(

            produtosDisponiveis.map(
                produto =>
                    produto.categoria
            )

        )

    ];


    const iconesCategoria = {

        "Cafeteria": "☕",

        "Salgados": "🥐",

        "Lanches": "🥪",

        "Pratos Feitos": "🍽️",

        "Bebidas": "🥤",

        "Cervejas e Vinhos": "🍺",

        "Adicionais": "➕",

        "Doces": "🍰",

        "Petiscos": "🍟",

        "Drinks": "🍹",

        "Outros": "•"

    };


    categorias.forEach(
        categoria => {

            const itens =
