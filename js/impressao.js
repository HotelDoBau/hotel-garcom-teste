import {
    db,
    collection,
    onSnapshot,
    doc,
    getDocs,
    deleteDoc,
    setDoc,
    serverTimestamp
} from "./firebase.js";


// =====================================================
// CONFIGURAÇÕES
// =====================================================

const TEMPO_TRAVA_IMPRESSAO = 30000;

const impressoesAutomaticasEmAndamento =
    new Set();


// =====================================================
// TRAVA CONTRA IMPRESSÃO DUPLICADA
// =====================================================

function adquirirTravaImpressao(chave) {

    const agora = Date.now();

    try {

        const existente =
            localStorage.getItem(
                "hotelBau_impressao_" + chave
            );

        if (existente) {

            const tempo =
                Number(existente);

            if (
                agora - tempo <
                TEMPO_TRAVA_IMPRESSAO
            ) {

                return false;
            }
        }

        localStorage.setItem(
            "hotelBau_impressao_" + chave,
            String(agora)
        );

        return true;

    } catch (erro) {

        console.error(
            "Erro ao criar trava de impressão:",
            erro
        );

        return true;
    }
}


function liberarTravaImpressao(chave) {

    try {

        localStorage.removeItem(
            "hotelBau_impressao_" + chave
        );

    } catch (erro) {

        console.error(
            "Erro ao liberar trava de impressão:",
            erro
        );
    }
}


// =====================================================
// IMPRESSÃO
// =====================================================

function abrirImpressao(conteudo) {

    return new Promise((resolve, reject) => {

        try {

            const iframe =
                document.createElement("iframe");

            iframe.style.position = "fixed";
            iframe.style.width = "1px";
            iframe.style.height = "1px";
            iframe.style.border = "0";
            iframe.style.opacity = "0";
            iframe.style.pointerEvents = "none";

            document.body.appendChild(iframe);

            const documento =
                iframe.contentWindow.document;

            documento.open();

            documento.write(`
                <!DOCTYPE html>

                <html>

                <head>

                    <meta charset="UTF-8">

                    <style>

                        @page {
                            size: 80mm auto;
                            margin: 3mm;
                        }

                        html,
                        body {
                            margin: 0;
                            padding: 0;
                            width: 72mm;
                            font-family: Arial, sans-serif;
                            font-size: 12px;
                            color: #000;
                        }

                        body {
                            padding-bottom: 10px;
                        }

                        .central {
                            text-align: center;
                        }

                        .separador {
                            border-top: 1px dashed #000;
                            margin: 8px 0;
                        }

                        .identificacao-print {
                            font-weight: bold;
                            font-size: 14px;
                        }

                        .mesa-print {
                            font-weight: bold;
                            font-size: 15px;
                            margin-top: 4px;
                        }

                        .linha-item-impressao {
                            display: flex;
                            justify-content: space-between;
                            gap: 8px;
                            margin: 4px 0;
                        }

                        .item-producao {
                            font-size: 13px;
                        }

                        .obs {
                            margin-top: 8px;
                            font-size: 12px;
                        }

                        .total-impressao {
                            font-weight: bold;
                            font-size: 15px;
                            margin-top: 8px;
                        }

                    </style>

                </head>

                <body>

                    ${conteudo}

                </body>

                </html>
            `);

            documento.close();

            setTimeout(() => {

                try {

                    iframe.contentWindow.focus();

                    iframe.contentWindow.print();

                } catch (erro) {

                    console.error(
                        "Erro ao enviar impressão:",
                        erro
                    );

                    reject(erro);

                    return;
                }

                setTimeout(() => {

                    iframe.remove();

                    resolve();

                }, 1200);

            }, 700);

        } catch (erro) {

            reject(erro);
        }
    });
}


// =====================================================
// IDENTIFICAÇÃO DA MESA / QUARTO
// =====================================================

function obterIdentificacao(pedido) {

    const tipo =
        pedido.tipo === "quarto"
            ? "QUARTO"
            : "MESA";

    const numero =
        pedido.quarto ||
        pedido.mesa ||
        pedido.numero;

    return {
        tipo,
        numero
    };
}


// =====================================================
// IMPRESSÃO DA PRODUÇÃO
// =====================================================

async function imprimirGarcom(
    pedido,
    automatica = false
) {

    if (
        !pedido ||
        !Array.isArray(pedido.itens)
    ) {

        console.warn(
            "Pedido inválido para impressão:",
            pedido
        );

        return;
    }

    const {
        tipo,
        numero
    } = obterIdentificacao(pedido);


   let conteudo = `

    <div class="central">

        <div class="identificacao-print">
            HOTEL DO BAÚ
        </div>

        <div>
            PRODUÇÃO
        </div>

    </div>

    <div class="separador"></div>

    <div class="central">

        <div class="mesa-print">
            ${tipo} ${String(numero).padStart(2, "0")}
        </div>

        <div>
            Pedido #${pedido.numeroPedido || ""}
        </div>

        <div style="margin-top: 6px; font-weight: bold;">
            GARÇOM: ${pedido.garcomNome || "Não informado"}
        </div>

    </div>

    <div class="separador"></div>

`;


    pedido.itens.forEach(item => {

        const quantidade =
            Number(item.quantidade || 0);

        conteudo += `

            <div class="item-producao">

                ${quantidade} x ${item.nome}

            </div>

        `;
    });


    if (pedido.observacao) {

        conteudo += `

            <div class="separador"></div>

            <div class="obs">

                <strong>OBSERVAÇÃO:</strong><br>

                ${pedido.observacao}

            </div>

        `;
    }


    conteudo += `

        <div class="separador"></div>

        <div class="central">

            ${pedido.dataHora || ""}

        </div>

    `;


    await abrirImpressao(conteudo);


    // -------------------------------------------------
    // REMOVE SOMENTE DA FILA DE PRODUÇÃO
    // -------------------------------------------------

    if (pedido.id) {

        try {

            await deleteDoc(
                doc(
                    db,
                    "pedidos_producao",
                    pedido.id
                )
            );

            console.log(
                "Pedido removido da fila de produção:",
                pedido.id
            );

        } catch (erro) {

            console.error(
                "Erro ao remover pedido da fila:",
                erro
            );
        }
    }
}


// =====================================================
// IMPRESSÃO DO CONSUMO ACUMULADO
// =====================================================

async function imprimirConsumoMesa(
    pedido,
    automatica = false
) {

    const {
        tipo,
        numero
    } = obterIdentificacao(pedido);


    const idMesa =
        tipo === "QUARTO"
            ? `quarto_${String(numero).padStart(2, "0")}`
            : `mesa_${String(numero).padStart(2, "0")}`;


    const pedidosSnapshot =
        await getDocs(
            collection(
                db,
                "mesas",
                idMesa,
                "pedidos"
            )
        );


    const pedidos = [];


    pedidosSnapshot.forEach(documento => {

        pedidos.push({
            id: documento.id,
            ...documento.data()
        });

    });


    pedidos.sort((a, b) => {

        const tempoA =
            a.criadoEm?.seconds ||
            0;

        const tempoB =
            b.criadoEm?.seconds ||
            0;

        return tempoA - tempoB;
    });


    const itensMap = new Map();

    let total = 0;


    pedidos.forEach(pedidoMesa => {

        const itens =
            Array.isArray(pedidoMesa.itens)
                ? pedidoMesa.itens
                : [];


        itens.forEach(item => {

            const chave =
                String(
                    item.id ??
                    item.nome
                );


            if (!itensMap.has(chave)) {

                itensMap.set(
                    chave,
                    {
                        id: item.id,
                        nome: item.nome,
                        quantidade: 0,
                        preco: Number(
                            item.preco || 0
                        )
                    }
                );
            }


            const existente =
                itensMap.get(chave);


            existente.quantidade +=
                Number(
                    item.quantidade || 0
                );

        });


        total +=
            Number(
                pedidoMesa.total || 0
            );

    });


    let conteudo = `

        <div class="central">

            <div class="identificacao-print">
                HOTEL DO BAÚ
            </div>

            <div>
                CONSUMO ATUAL
            </div>

        </div>

        <div class="separador"></div>

        <div class="central">

            <div class="mesa-print">

                ${tipo} ${String(numero).padStart(2, "0")}

            </div>

        </div>

        <div class="separador"></div>

    `;


    itensMap.forEach(item => {

        const subtotal =
            item.quantidade *
            item.preco;


        conteudo += `

            <div class="linha-item-impressao">

                <span>
                    ${item.quantidade} x ${item.nome}
                </span>

                <span>
                    R$ ${subtotal
                        .toFixed(2)
                        .replace(".", ",")}
                </span>

            </div>

        `;

    });


    conteudo += `

        <div class="separador"></div>

        <div class="linha-item-impressao">

            <strong>
                TOTAL
            </strong>

            <strong>
                R$ ${total
                    .toFixed(2)
                    .replace(".", ",")}
            </strong>

        </div>

        <div class="separador"></div>

        <div class="central">

            CONTA PARCIAL

            <br>

            MESA PERMANECE ABERTA

        </div>

    `;


    await abrirImpressao(conteudo);
}


// =====================================================
// IMPRESSÃO AUTOMÁTICA
// =====================================================

async function imprimirPedidoAutomaticamente(
    pedido,
    origem = "garcom"
) {

    if (!pedido?.id) {
        return;
    }


    const chave =
        `${origem}:${pedido.id}`;


    if (
        impressoesAutomaticasEmAndamento
            .has(chave)
    ) {

        return;
    }


    if (
        !adquirirTravaImpressao(chave)
    ) {

        console.log(
            "Impressão já processada:",
            chave
        );

        return;
    }


    impressoesAutomaticasEmAndamento
        .add(chave);


    try {

        await imprimirGarcom(
            pedido,
            true
        );


        await imprimirConsumoMesa(
            pedido,
            true
        );


    } catch (erro) {

        console.error(
            "Erro na impressão automática:",
            erro
        );

    } finally {

        impressoesAutomaticasEmAndamento
            .delete(chave);

        liberarTravaImpressao(chave);
    }
}


// =====================================================
// MONITORAMENTO DOS PEDIDOS
// =====================================================

onSnapshot(

    collection(
        db,
        "pedidos_producao"
    ),

    snapshot => {

        snapshot.docChanges()
            .forEach(alteracao => {

                if (
                    alteracao.type !== "added"
                ) {

                    return;
                }


                const pedidoNovo = {

                    id:
                        alteracao.doc.id,

                    ...alteracao.doc.data()

                };


                console.log(
                    "NOVO PEDIDO PARA IMPRESSÃO:",
                    pedidoNovo
                );


                imprimirPedidoAutomaticamente(
                    pedidoNovo,
                    "garcom"
                );

            });

    },

    erro => {

        console.error(
            "Erro monitorando pedidos para impressão:",
            erro
        );

    }

);

/* =========================================
   IMPRESSÃO DO FECHAMENTO
========================================= */

async function imprimirFechamentoAutomaticamente(fechamento) {

    try {

        console.log(
            "FECHAMENTO PARA IMPRESSÃO:",
            fechamento
        );


        const ehQuarto =
            fechamento.tipo === "quarto";


        const nomeLocal =
            ehQuarto
                ? "QUARTO"
                : "MESA";


        const numero =
            String(
                fechamento.numero || 0
            ).padStart(
                2,
                "0"
            );


        const itens =
            Array.isArray(
                fechamento.itens
            )
                ? fechamento.itens
                : [];


        let conteudo = `

            <div
                style="
                    text-align:center;
                    font-family:Arial,sans-serif;
                "
            >

                <strong
                    style="
                        font-size:18px;
                    "
                >
                    HOTEL DO BAÚ
                </strong>

                <br>

                <strong
                    style="
                        font-size:16px;
                    "
                >
                    CONTA FINAL
                </strong>

                <hr>

                <div
                    style="
                        text-align:left;
                    "
                >

                    <strong>
                        ${nomeLocal} ${numero}
                    </strong>

                    <br><br>

        `;


        itens.forEach(
            item => {

                const quantidade =
                    Number(
                        item.quantidade || 0
                    );


                const preco =
                    Number(
                        item.preco || 0
                    );


                const subtotal =
                    preco *
                    quantidade;


                conteudo += `

                    <div
                        style="
                            margin-bottom:8px;
                        "
                    >

                        ${quantidade}x
                        ${item.nome}

                        <br>

                        <span
                            style="
                                display:block;
                                text-align:right;
                            "
                        >
                            R$
                            ${subtotal.toFixed(2)}
                        </span>

                    </div>

                `;

            }
        );


        const subtotal =
            Number(
                fechamento.subtotal || 0
            );


        const desconto =
            Number(
                fechamento.desconto || 0
            );


        const total =
            Number(
                fechamento.total || 0
            );


        conteudo += `

                </div>

                <hr>

                <div
                    style="
                        text-align:right;
                        font-size:14px;
                    "
                >

                    Subtotal:
                    R$ ${subtotal.toFixed(2)}

                    <br>

                    Desconto:
                    R$ ${desconto.toFixed(2)}

                    <br><br>

                    <strong
                        style="
                            font-size:18px;
                        "
                    >
                        TOTAL:
                        R$ ${total.toFixed(2)}
                    </strong>

                </div>

                <br>

                <div
                    style="
                        text-align:center;
                        font-size:12px;
                    "
                >

                    ${fechamento.dataHora || ""}

                    <br><br>

                    Obrigado pela preferência!

                </div>

            </div>

        `;


        /*
            IMPRIME PRIMEIRO.
            A limpeza só acontece depois.
        */

        await abrirImpressao(
            conteudo
        );


        console.log(
            "Fechamento impresso:",
            fechamento.id
        );


        /* =====================================
           LIMPAR CONSUMO DA MESA/QUARTO
        ===================================== */

        if (
            fechamento.idMesa
        ) {

            const referenciaPedidos =
                collection(
                    db,
                    "mesas",
                    fechamento.idMesa,
                    "pedidos"
                );


            const snapshot =
                await getDocs(
                    referenciaPedidos
                );


            for (
                const documento
                of snapshot.docs
            ) {

                await deleteDoc(
                    documento.ref
                );

            }

        }


        /* =====================================
           LIBERAR MESA / QUARTO
        ===================================== */

        if (
            fechamento.idMesa
        ) {

            await setDoc(

                doc(
                    db,
                    "mesas",
                    fechamento.idMesa
                ),

                {

                    status:
                        "livre",

                    atualizadoEm:
                        serverTimestamp()

                },

                {
                    merge: true
                }

            );

        }


        /* =====================================
           REMOVER FECHAMENTO DA FILA
        ===================================== */

        await deleteDoc(

            doc(
                db,
                "fechamentos",
                fechamento.id
            )

        );


        console.log(
            "Fechamento finalizado e mesa liberada:",
            fechamento.idMesa
        );

    }
    catch (erro) {

        console.error(
            "Erro ao imprimir fechamento:",
            erro
        );

    }

}


/* =========================================
   ESCUTAR FECHAMENTOS
========================================= */

onSnapshot(

    collection(
        db,
        "fechamentos"
    ),

    snapshot => {

        snapshot.docChanges()
            .forEach(alteracao => {

                if (
                    alteracao.type !== "added"
                ) {

                    return;
                }


                const fechamento = {

                    id:
                        alteracao.doc.id,

                    ...alteracao.doc.data()

                };


                /*
                    Só entram na impressão
                    fechamentos ainda novos.
                */

                if (
                    fechamento.status !== "novo"
                ) {

                    return;

                }


                console.log(
                    "NOVO FECHAMENTO PARA IMPRESSÃO:",
                    fechamento
                );


                imprimirFechamentoAutomaticamente(
                    fechamento
                );

            });

    },

    erro => {

        console.error(
            "Erro ao observar fechamentos:",
            erro
        );

    }

);
console.log(
    "Módulo de impressão Hotel Garcom TESTE carregado."
);
