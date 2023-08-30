import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_classes_ingressos from './tbl_classes_ingressos.js'
import tbl_pos from './tbl_pos.js'
import tbl_pdvs from './tbl_pdvs.js'
import tbl_classe_numeracao from './tbl_classe_numeracao.js'
import tbl_eventos from './tbl_eventos.js'
import tbl_meio_pgto from './tbl_meio_pgto.js'
import tbl_itens_classes_ingressos from './tbl_itens_classes_ingressos.js'


/**
 * Tabela dos Ingressos
 * 
 * foreign keys:
 * - tbl_classes_ingressos (ing_classe_ingresso → cla_cod)
 * - tbl_pos (ing_pos → pos_serie)
 * - tbl_pdvs (ing_pdv → pdv_id)
 * - tbl_classe_numeracao (cln_cod → cln_cod)
 * - tbl_eventos (ing_evento → eve_cod)
 * - tbl_meio_pgto (ing_mpgto → mpg_codigo)
 * - tbl_itens_classes_ingressos (ing_item_classe_ingresso → itc_cod)
 */
const tbl_ingressos = db_conn.define(
    'tbl_ingressos',
    {
        ing_cod_barras: {
            type: DataTypes.DECIMAL(60,0),
            primaryKey: true
        },

        ing_evento: {
            type: DataTypes.INTEGER(60)
        },

        ing_status: {
            type: DataTypes.SMALLINT(10)
        },

        ing_data_compra: {
            type: DataTypes.DATE
        },

        ing_item_classe_ingresso: {
            type: DataTypes.INTEGER(60)
        },

        ing_valor: {
            type: DataTypes.DECIMAL(7,2)
        },

        ing_classe_ingresso: {
            type: DataTypes.INTEGER(60)
        },

        ing_pos: {
            type: DataTypes.STRING(60)
        },

        ing_pdv: {
            type: DataTypes.INTEGER(60)
        },

        ing_rg: {
            type: DataTypes.STRING(60)
        },

        ing_data_val: {
            type: DataTypes.DATE
        },

        ing_tipo: {
            type: DataTypes.CHAR(1)
        },

        ing_qtd_uso: {
            type: DataTypes.SMALLINT(6)
        },

        ing_max_uso: {
            type: DataTypes.SMALLINT(6)
        },

        ing_data_ult_uso: {
            type: DataTypes.DATE
        },

        ing_sexo: {
            type: DataTypes.CHAR(1)
        },

        ing_meia: {
            type: DataTypes.TINYINT(4)
        },

        ing_por_id: {
            type: DataTypes.INTEGER(10)
        },

        ing_empresa: {
            type: DataTypes.INTEGER(60)
        },

        ing_taxa: {
            type: DataTypes.DECIMAL(7,2)
        },

        cln_cod: {
            type: DataTypes.INTEGER(60).UNSIGNED,
        },

        ing_numeracao: {
            type: DataTypes.STRING(15)
        },

        ing_mpgto: {
            type: DataTypes.INTEGER(10).UNSIGNED
        },

        ing_cartao_auth: {
            type: DataTypes.STRING(6)
        },

        ing_nome: {
            type: DataTypes.STRING
        },

        ing_cpf: {
            type: DataTypes.STRING(14)
        },

        ing_email: {
            type: DataTypes.STRING(45)
        },

        ing_fone: {
            type: DataTypes.STRING(45)
        },

        ing_data_nominacao: {
            type: DataTypes.DATE
        },

        ing_solidario: {
            type: DataTypes.STRING
        },

        ing_enviado: {
            type: DataTypes.INTEGER(11)
        },

        ing_venda: {
            type: DataTypes.INTEGER(11)
        }
    },
    { schema: process.env.DB_PROMO }
)

// foreign keys

// tbl_classes_ingressos (ing_classe_ingresso → cla_cod)
tbl_classes_ingressos.hasMany(tbl_ingressos, {
    foreignKey: 'ing_classe_ingresso',
    sourceKey: 'cla_cod',
    onUpdate: 'restrict',
    hooks: true
})
tbl_ingressos.belongsTo(tbl_classes_ingressos, {
    foreignKey: 'ing_classe_ingresso',
    targetKey: 'cla_cod'
})

// tbl_pos (ing_pos → pos_serie)
tbl_pos.hasMany(tbl_ingressos, {
    foreignKey: 'ing_pos',
    sourceKey: 'pos_serie',
    hooks: true
})
tbl_ingressos.belongsTo(tbl_pos, {
    foreignKey: 'ing_pos',
    targetKey: 'pos_serie'
})

// tbl_pdvs (ing_pdv → pdv_id)
tbl_pdvs.hasMany(tbl_ingressos, {
    foreignKey: 'ing_pdv',
    sourceKey: 'pdv_id',
    onUpdate: 'restrict',
    onDelete: 'restrict',
    hooks: true
})
tbl_ingressos.belongsTo(tbl_pdvs, {
    foreignKey: 'ing_pdv',
    targetKey: 'pdv_id'
})

// tbl_classe_numeracao (cln_cod → cln_cod)
tbl_classe_numeracao.hasMany(tbl_ingressos, {
    foreignKey: 'cln_cod',
    sourceKey: 'cln_cod',
    onUpdate: 'restrict',
    onDelete: 'restrict',
    hooks: true
})
tbl_ingressos.belongsTo(tbl_classe_numeracao, {
    foreignKey: 'cln_cod',
    targetKey: 'cln_cod'
})

// tbl_eventos (ing_evento → eve_cod)
tbl_eventos.hasMany(tbl_ingressos, {
    foreignKey: 'ing_evento',
    sourceKey: 'eve_cod',
    onUpdate: 'restrict',
    onDelete: 'restrict',
    hooks: true
})
tbl_ingressos.belongsTo(tbl_eventos, {
    foreignKey: 'ing_evento',
    targetKey: 'eve_cod'
})

// tbl_meio_pgto (ing_mpgto → mpg_codigo)
tbl_meio_pgto.hasMany(tbl_ingressos, {
    foreignKey: 'ing_mpgto',
    sourceKey: 'mpg_codigo',
    onUpdate: 'restrict',
    onDelete: 'restrict',
    hooks: true
})
tbl_ingressos.belongsTo(tbl_meio_pgto, {
    foreignKey: 'ing_mpgto',
    targetKey: 'mpg_codigo'
})

// tbl_itens_classes_ingressos (ing_item_classe_ingresso → itc_cod)
tbl_itens_classes_ingressos.hasMany(tbl_ingressos, {
    foreignKey: 'ing_item_classe_ingresso',
    sourceKey: 'itc_cod',
    onUpdate: 'restrict',
    onDelete: 'restrict',
    hooks: true
})
tbl_ingressos.belongsTo(tbl_itens_classes_ingressos, {
    foreignKey: 'ing_item_classe_ingresso',
    targetKey: 'itc_cod'
})

export default tbl_ingressos