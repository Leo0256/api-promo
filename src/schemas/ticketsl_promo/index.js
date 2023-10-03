//Mapeamento do Banco de Dados: 'ticketsl_promo'

import caixa from './caixa.js'
import devolucao from './devolucao.js'
import item from './item.js'
import tbl_categorias_classes_ingressos from './tbl_categorias_classes_ingressos.js'
import tbl_classe_grupo from './tbl_classe_grupo.js'
import tbl_classe_ingressos_solidario from './tbl_classe_ingressos_solidario.js'
import tbl_classe_numeracao from './tbl_classe_numeracao.js'
import tbl_classes_ingressos from './tbl_classes_ingressos.js'
import tbl_eventos_pdvs from './tbl_eventos_pdvs.js'
import tbl_eventos from './tbl_eventos.js'
import tbl_ingressos from './tbl_ingressos.js'
import tbl_itens_classes_ingressos from './tbl_itens_classes_ingressos.js'
import tbl_meio_pgto from './tbl_meio_pgto.js'
import tbl_pdvs from './tbl_pdvs.js'
import tbl_pos from './tbl_pos.js'
import tbl_sangria from './tbl_sangria.js'
import venda_item from './venda_item.js'
import venda from './venda.js'

/**
 * Tabelas do banco, ordenadas pela referência das foreign keys
 */
const schemas = {
    tbl_eventos,
    tbl_meio_pgto,
    tbl_categorias_classes_ingressos,
    tbl_classes_ingressos,
    tbl_itens_classes_ingressos,
    tbl_classe_grupo,
    tbl_classe_ingressos_solidario,
    tbl_classe_numeracao,
    tbl_pdvs,
    tbl_eventos_pdvs,
    tbl_pos,
    tbl_ingressos,
    tbl_sangria,
    caixa,
    devolucao,
    venda,
    item,
    venda_item,
}

const syncModels = async () => {
    for(let [key, value] of Object.entries(schemas)) {
        schemas[key] = await value.sync()
    }
}

syncModels()

export default schemas