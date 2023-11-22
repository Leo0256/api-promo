import schemas from '../schemas/index.js'
import Shared from './shared.js'

const {
    tbl_ingressos,
    tbl_venda_ingressos,
    tbl_pdvs,
    tbl_classes_ingressos,
    tbl_classe_numeracao,
    tbl_meio_pgto,
} = schemas.ticketsl_promo

const {
    lltckt_order_product,
    lltckt_order,
    lltckt_order_product_barcode,
    lltckt_order_status,
    lltckt_customer,
    lltckt_product,
} = schemas.ticketsl_loja

/**
 * Regras de negócio dos Relatórios Analíticos dos Eventos
 */
export default class RelatoriosAnaliticos {

    /**
     * Define o status da venda.
     * 
     * @param {number} status_id Id do status
     */
    static set_status(status_id) {
        switch(status_id) {
            case 0:
                return 'Processado'
            
            case 1:
            case 2:
                return 'Aprovado'
            
            case 3:
                return 'Estornado'
            
            default: return '-'
        }
    }

    /**
     * Retorna o relatório detalhado
     * dos ingressos emitidos no evento.
     * 
     * Pode-se aplicar:
     * - Busca direta, por PDV, POS ou código de barras;
     * - Filtros debusca;
     * - Paginação.
     * 
     * @param {number} evento Id do evento
     * @param {{
     *  pdv: string?,
     *  pos: string?,
     *  situacao: string?,
     *  tipo: string?,
     *  data_inicio: Date?,
     *  data_fim: Date?
     * }?} filtros Filtros de busca
     * @param {string?} busca 
     * @param {string?} linhas N° de linhas por página
     * @param {string?} pagina Página da lista
     * @returns 
     */
    static async getDetalhados(evento, filtros, busca, linhas, pagina) {

        // Obtêm os ingresso
        let {
            total,
            pagina: page,
            count,
            ingressos
        } = await this.getIngressosDetalhados(evento, parseInt(linhas), parseInt(pagina))

        // Busca - início

        /*
            Efetua a busca por:
            - PDV;
            - POS;
            - ou por Código de barras do ingresso.
        */
        if(busca) {
            let find_aux = busca.trim().toUpperCase()
            ingressos = ingressos.filter(a => (
                a.pdv.toUpperCase().includes(find_aux) ||
                `${a.pos}`.includes(find_aux) ||
                `${a.cod_barras}`.includes(find_aux)
            ))
        }

        // Busca - fim


        // Filtros - início

        /*
            Aplica os filtros.
            Quando a `busca` é informada, ignora os filtros.
        */
        if(filtros && !busca) {
            // Filtro por PDVs
            if(!!filtros.pdv) {
                ingressos = ingressos.filter(a => (
                    a.pdv === filtros.pdv
                ))
            }

            // Filtro por POS
            if(!!filtros.pos) {
                ingressos = ingressos.filter(a => (
                    a.pos === filtros.pos
                ))
            }

            // Filtro por Situação/status
            if(!!filtros.situacao) {
                ingressos = ingressos.filter(a => (
                    a.situacao === filtros.situacao
                ))
            }

            // Filtro por tipo/classe de ingresso
            if(!!filtros.tipo) {
                ingressos = ingressos.filter(a => (
                    a.ing === filtros.tipo
                ))
            }

            // Filtro por data de início
            if(!!filtros.data_inicio) {
                ingressos = ingressos.filter(a => (
                    new Date(a.data_compra) >= new Date(filtros.data_inicio)
                ))
            }

            // Filtro por data de fim
            if(!!filtros.data_fim) {
                ingressos = ingressos.filter(a => (
                    new Date(a.data_compra) <= new Date(filtros.data_fim)
                ))
            }
        }

        // Filtros - fim


        // Retorna os dados
        return {
            pagina: page,
            total,
            count,
            data: ingressos
        }
    }

    /**
     * Retorna o relatório detalhado
     * dos ingressos emitidos no evento.
     * 
     * @param {number} evento Id do evento
     * @param {number?} l Nº de linhas por página
     * @param {number?} p Página da lista
     * @returns 
     */
    static async getIngressosDetalhados(evento, l, p) {

        /**
         * Renomeia a forma de pagamento.
         * 
         * @param {string} nome Forma de pagamento
         * @param {number} valor Valor do ingresso
         * @returns 
         */
        const rename_mpgto = (nome, valor) => {
            // Ingressos sem valor são considerados como cortesias
            if(valor == 0)
                return 'CORTESIA'

            // Alinha as formas de pagamento do site com as dos PDVs
            switch (nome) {
                case 'CREDITO':
                case 'PagSeguro':
                    return 'CARTÃO DE CRÉDITO'
                
                case 'DEBITO':
                    return 'DÉBITO'
            
                default:
                    return nome
            }
        }

        // Indicador de com ou sem paginação
        let with_pages = !isNaN(l) && !isNaN(p)

        // Retorna todas as vendas de ingressos do evento
        return await tbl_ingressos.findAndCountAll({

            // Paginação
            offset: with_pages ? (p -1) * l : undefined,
            limit: with_pages ? l : undefined,

            where: { ing_evento: evento },
            attributes: [
                'ing_data_compra',
                'ing_pdv',
                'ing_pos',
                'ing_cod_barras',
                'ing_status',
                'ing_classe_ingresso',
                'cln_cod',
                'ing_valor',
                'ing_mpgto',
                'ing_solidario'
            ],
            order: [['ing_data_compra', 'DESC']],
            include: [
                // PDV
                {
                    model: tbl_pdvs,
                    attributes: [ 'pdv_nome' ]
                },

                // Classe do ingresso
                {
                    model: tbl_classes_ingressos,
                    attributes: [ 'cla_nome' ]
                },

                // Classe do ingresso numerado
                {
                    model: tbl_classe_numeracao,
                    attributes: [ 'cln_num' ]
                },

                // Forma de pagamento (PDVs)
                tbl_meio_pgto,

                // Dados de venda pelos PDVs
                {
                    model: tbl_venda_ingressos,
                    attributes: ['vend_pagseguro_cod']
                },

                // Ingresso no site
                {
                    model: lltckt_order_product_barcode,
                    include: {
                        model: lltckt_order_product,
                        include: {
                            model: lltckt_order,
                            attributes: [
                                'order_id',
                                'payment_method',
                                'order_status_id',
                                'date_added',
                                'pagseguro_code'
                            ],
                            include: {
                                model: lltckt_order_status,
                                attributes: ['name']
                            }
                        }
                    }
                }
            ]
        })
        .then(({ count, rows }) => ({
            total: with_pages ? Math.ceil(count / l) : undefined,
            pagina: with_pages ? p : undefined,
            count,
            ingressos: rows.map(ing => {
                // Auxiliar do valor do ingresso
                let valor = parseFloat(ing.ing_valor)

                // Classe (+ nome do solidário, se houver)
                let classe = (`${ing.tbl_classes_ingresso.cla_nome} ${ing?.ing_solidario ?? ''}`).trim()

                // Auxiliar do código de transação
                let cod_pagseguro = ing?.tbl_venda_ingresso?.vend_pagseguro_cod?.trim()

                // Ingresso vendido nos PDVs
                if(ing.ing_pos) {
                    return {
                        data_compra: ing.ing_data_compra,
                        pdv: ing.tbl_pdv.pdv_nome,
                        pos: ing.ing_pos,
                        pedido: '-',
                        cod_barras: ing.ing_cod_barras,
                        situacao: this.set_status(ing.ing_status),
                        ing: classe,
                        ing_num: ing.tbl_classe_numeracao?.cln_num ?? '-',
                        valor: Shared.moneyFormat(valor),
                        pagamento: rename_mpgto(ing.tbl_meio_pgto.mpg_nome, valor),
                        cod_pagseguro: !!cod_pagseguro ? cod_pagseguro : '-'
                    }
                }

                // Ingresso vendido no site
                else {
                    // Auxiliar do ingresso no site
                    let order = ing.lltckt_order_product_barcode?.lltckt_order_product?.lltckt_order

                    // Auxiliar do código de transação
                    let cod_pagseguro = ing?.tbl_venda_ingresso?.vend_pagseguro_cod?.trim()
                        ?? order?.pagseguro_code

                    return {
                        data_compra: ing.ing_data_compra,
                        pdv: 'Quero Ingresso - Internet',
                        pos: null,
                        pedido: order?.order_id ?? '-',
                        cod_barras: ing.ing_cod_barras,
                        situacao: order?.lltckt_order_status.name ?? '-',
                        ing: classe,
                        ing_num: ing.tbl_classe_numeracao?.cln_num ?? '-',
                        valor: Shared.moneyFormat(valor),
                        pagamento: rename_mpgto(order?.payment_method ?? '-', valor),
                        cod_pagseguro: !!cod_pagseguro ? cod_pagseguro : '-'
                    }
                }
            })
        }))
    }

    /**
     * Retorna os filtros do relatório detalhado.
     * 
     * @param {number} evento Id do evento
     * @returns 
     */
    static async getDetalhadosFilter(evento) {

        // Obtêm os dados em paralélo
        const promises = [
            // PDVs e POS
            await tbl_ingressos.findAll({
                where: { ing_evento: evento },
                attributes: [ 'ing_pos' ],
                include: {
                    model: tbl_pdvs,
                    attributes: [ 'pdv_nome' ]
                }
            })
            .then(result => {
                let pdv = []  // Lista dos PDVs
                let pos = []  // Lista dos POS
    
                result.map(ing => {
                    // Adiciona na lista os PDVs
                    if(!pdv.find(a => a === ing.tbl_pdv?.pdv_nome)) {
                        pdv.push(ing.tbl_pdv?.pdv_nome)
                    }
    
                    // Adiciona na lista os POS
                    if(!pos.find(a => a === ing.ing_pos)) {
                        pos.push(ing.ing_pos)
                    }
                })
    
                // Filtra os resultados vazios
                pdv = pdv.filter(a => !!a)
                pos = pos.filter(a => !!a)
    
                // Adiciona nos PDVs as vendas pelo site
                pdv.unshift('Quero Ingresso - Internet')
    
                return { pdv, pos }
            }),

            // Tipo/classe de ingresso
            await tbl_classes_ingressos.findAll({
                where: { cla_evento: evento },
                attributes: [ 'cla_nome' ]
            })
            .then(result => ({
                // Lista das classes de ingresso
                tipo: result.map(a => a.cla_nome)
            }))
        ]

        // Situação/status dos ingressos
        const situacao = [
            'AGUARD. PAGAMENTO',
            'APROVADO',
            'ESTORNADO',
            'NÃO APROVADO',
            'AGUARD. PIX',
            '-'
        ]

        // Retorna os dados após terminar as promises
        return await Promise.all(promises).then(result => {
            const {
                pdv, pos
            } = result.find(a => !a.tipo)

            const {
                tipo
            } = result.find(a => !!a.tipo)

            return {
                pdv,
                pos,
                situacao,
                tipo
            }
        })
    }

    /**
     * Retorna o relatório detalhado
     * dos ingressos emitidos no site de vendas.
     * 
     * @param {number} categoria Id do evento no site
     * @param {{
     *  status: string?,
     *  ingresso: string?
     * }?} filtros Filtros de busca
     * @param {string?} busca 
     * @param {string?} linhas N° de linhas por página
     * @param {string?} pagina Página da lista
     * @returns 
     */
    static async getSiteDetalhados(categoria, filtros, busca, linhas, pagina) {
        // Auxiliares da paginação
        let l = parseInt(linhas)
        let p = parseInt(pagina)

        // Indicador de com ou sem paginação
        let with_pages = !isNaN(l) && !isNaN(p)

        // Filtro por status do ingresso
        let status = null
        if(filtros?.status) {
            status = await lltckt_order_status.findOne({
                where: { name: filtros.status },
                attributes: ['order_status_id']
            })
            .then(result => result?.order_status_id ?? 0)
        }

        // Filtro de busca
        let filtro_busca = {}
        if(busca) {
            // Procura pelo RG do cliente
            let find_customer = await lltckt_customer.findAll({
                where: { rg: busca },
                attributes: ['customer_id']
            })
            .then(result => (
                { $or: result.map(a => a.customer_id)}
            ))

            filtro_busca = { $or: [
                { order_id: busca },            // N° do pedido
                { firstname: busca },           // Primeiro nome do cliente
                { lastname: busca },            // Último nome do cliente
                { customer_id: find_customer }, // RG do cliente
                { payment_firstname: busca },   // Primeiro nome do comprador
                { payment_lastname: busca }     // Último nome do comprador
            ]}
        }
        
        // Obtêm os pedidos no site
        return await lltckt_order.findAndCountAll({
            // Paginação
            offset: with_pages ? (p -1) * l : undefined,
            limit: with_pages ? l : undefined,

            where: {
                category_id: categoria,

                // Filtro por status de ingresso
                order_status_id: status ?? { $not: null },

                // Filtros de busca
                ...filtro_busca
            },
            attributes: [
                'order_id',
                'firstname',
                'lastname',
                'email',
                'telephone',
                'payment_firstname',
                'payment_lastname',
                'total',
                'order_status_id',
                'date_added'
            ],
            order: [['date_added', 'desc']],
            include: [
                // Produto no pedido
                {
                    model: lltckt_order_product,
                    attributes: [
                        'order_product_id',
                        'name',
                        'quantity',
                        'price'
                    ],

                    where: {
                        // Filtro por classe de ingresso
                        name: {
                            $like: `%${filtros?.ingresso ?? ''}%`
                        }
                    },

                    // Produto
                    include: {
                        model: lltckt_product,
                        attributes: ['product_id'],

                        // Classe do ingresso
                        include: {
                            model: tbl_classes_ingressos,
                            attributes: ['cla_nome']
                        }
                    }
                },

                // Comprador
                {
                    model: lltckt_customer,
                    attributes: ['rg']
                },

                // Status do pedido
                {
                    model: lltckt_order_status,
                    attributes: ['name']
                }
            ]
        })
        .then(({ count, rows }) => ({
            total: with_pages ? Math.ceil(count / l) : undefined,
            pagina: with_pages ? p : undefined,
            count,
            ingressos: rows.map(order => {
                // Nome + RG do comprador
                let comprador = `${order.payment_firstname} ${order.payment_lastname}`
                    + `\nRG: ${order.lltckt_customer.rg}`
                
                // Quantidade de ingressos no pedido
                let quant = order.lltckt_order_products.reduce((a, b) => a += b.quantity, 0)

                // Ingressos dentro do pedido
                let ingressos = []
                order.lltckt_order_products.map(product => {
                    // Nome da classe
                    let classe = (product.lltckt_product?.tbl_classes_ingresso?.cla_nome ?? '').toUpperCase()

                    // Classe solidária
                    if(classe.toUpperCase() !== product.name.toUpperCase()) {
                        classe += ` ${product.name.toUpperCase()}`
                    }

                    // Valor unitário da classe
                    let valor = Shared.moneyFormat(product.price)

                    // Adiciona o ingresso à listagem do pedido
                    ingressos.push(`${product.quantity}x ${classe} ${valor}`)
                })

                // Retorna a lista de pedidos no site
                return {
                    pedido: order.order_id,
                    data: order.date_added,
                    status: order.lltckt_order_status?.name ?? 'Cancelado',
                    comprador,
                    nominado: `${order.firstname} ${order.lastname}`,
                    email: order.email,
                    telefone: order.telephone,
                    quant,
                    ingressos: ingressos.join('#').replace(/#/, '\n'),
                    valor: Shared.moneyFormat(order.total)
                }
            })
        }))
    }

    /**
     * Retorna os filtros do relatório site detalhado.
     * 
     * @param {number} categoria Id do evento no site
     * @returns 
     */
    static async getSiteDetalhadosFilter(categoria) {
        let promises = [
            lltckt_order_status.findAll({
                where: {
                    order_status_id: [2, 5, 6, 7, 13, 21]
                },
                attributes: ['name']
            })
            .then(result => {
                let status = result.map(a => a.name)
                status.unshift('Cancelado')
                
                return status
            }),

            lltckt_order_product.findAll({
                attributes: ['name'],
                group: [['name']],
                order: [['name', 'asc']],
                include: {
                    model: lltckt_order,
                    attributes: [],
                    where: {
                        category_id: categoria
                    }
                }
            })
            .then(result => result.map(a => a.name))
        ]

        return await Promise.all(promises).then(result => ({
            status: result[0],
            ingressos: result[1]
        }))
    }

}