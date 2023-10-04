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
} = schemas.ticketsl_loja

/**
 * Regras de negócio dos Relatórios Analíticos dos Eventos
 */
export default class RelatoriosAnaliticos {

    /**
     * Define o status da venda.
     * 
     * @param {number} status_id Id do status
     * @param {boolean} order Venda pelo site
     */
    static set_status(status_id, order) {
        if(order) {
            switch(status_id) {
                case 1:
                    return 'AGUARD. PAGAMENTO'
                
                case 5:
                    return 'APROVADO'
                
                case 6:
                    return 'ESTORNADO'
                
                case 7:
                    return 'NÃO APROVADO'
                
                case 21:
                    return 'AGUARD. PIX'
                
                default: return '-'
            }
        }
        else {
            switch(status_id) {
                case 0:
                    return 'AGUARD. PAGAMENTO'
                
                case 1:
                case 2:
                    return 'APROVADO'
                
                case 3:
                    return 'ESTORNADO'
                
                default: return '-'
            }
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
        let ingressos = await this.getIngressosDetalhados(evento)

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


        // Total de ingressos retornados
        const count = ingressos.length


        // Paginação - início

        // Converte as linhas e páginas em inteiros
        let l_int = parseInt(linhas)
        let p_int = parseInt(pagina)

        // Indicador de com ou sem paginação
        const with_pages = !isNaN(l_int) && !isNaN(p_int)
        
        // Página atual
        let page = undefined

        // Total de páginas
        let total = undefined
        
        // Paginação
        if(with_pages) {
            page = Math.abs(p_int)
            total = Math.ceil(count / l_int)
            ingressos = ingressos.slice((page -1) * l_int, page * l_int)
        }

        // Paginação - fim


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
     * @returns 
     */
    static async getIngressosDetalhados(evento) {

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

        // Retorna todas as vendas de ingressos do evento
        return await tbl_ingressos.findAll({
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
                'ing_mpgto'
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
                            where: {
                                order_status_id: { $in: [ 1, 5, 6, 7, 21 ]}
                            },
                            attributes: [
                                'order_id',
                                'payment_method',
                                'order_status_id',
                                'date_added'
                            ]
                        }
                    }
                }
            ]
        })
        .then(data => (
            data.map(ing => {
                // Auxiliar do valor do ingresso
                let valor = parseFloat(ing.ing_valor)

                // Ingresso vendido nos PDVs
                if(ing.ing_pos) {
                    return {
                        data_compra: ing.ing_data_compra,
                        pdv: ing.tbl_pdv.pdv_nome,
                        pos: ing.ing_pos,
                        pedido: '-',
                        cod_barras: ing.ing_cod_barras,
                        situacao: this.set_status(ing.ing_status, false),
                        ing: ing.tbl_classes_ingresso.cla_nome,
                        ing_num: ing.tbl_classe_numeracao?.cln_num ?? '-',
                        valor: Shared.moneyFormat(valor),
                        pagamento: rename_mpgto(ing.tbl_meio_pgto.mpg_nome, valor),
                        cod_pagseguro: ing?.tbl_venda_ingresso?.vend_pagseguro_cod ?? '-'
                    }
                }

                // Ingresso vendido no site
                else {
                    // Auxiliar do ingresso no site
                    let order = ing.lltckt_order_product_barcode.lltckt_order_product.lltckt_order

                    return {
                        data_compra: ing.ing_data_compra,
                        pdv: 'Quero Ingresso - Internet',
                        pos: null,
                        pedido: order.order_id,
                        cod_barras: ing.ing_cod_barras,
                        situacao: this.set_status(order.order_status_id, true),
                        ing: ing.tbl_classes_ingresso.cla_nome,
                        ing_num: ing.tbl_classe_numeracao?.cln_num ?? '-',
                        valor: Shared.moneyFormat(valor),
                        pagamento: rename_mpgto(order.payment_method, valor),
                        cod_pagseguro: ing?.tbl_venda_ingresso?.vend_pagseguro_cod ?? '-'
                    }
                }
            })
        ))
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

}