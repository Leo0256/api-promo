import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_classes_ingressos from '../ticketsl_promo/tbl_classes_ingressos.js'


/**
 * Tabela dos ingressos na loja
 * 
 * foreign key:
 * - ticketsl_promo.tbl_classes_ingressos (classId → cla_cod)
 */
const lltckt_product = db_conn.define(
    'lltckt_product',
    {
        product_id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true
        },
        
        model: {
            type: DataTypes.STRING(64)
        },
        
        sku: {
            type: DataTypes.STRING(64)
        },
        
        upc: {
            type: DataTypes.STRING(12)
        },
        
        ean: {
            type: DataTypes.STRING(14)
        },
        
        jan: {
            type: DataTypes.STRING(13)
        },
        
        isbn: {
            type: DataTypes.STRING(13)
        },
        
        mpn: {
            type: DataTypes.STRING(64)
        },

        location: {
            type: DataTypes.STRING(128)
        },

        quantity: {
            type: DataTypes.INTEGER(4)
        },
        
        stock_status_id: {
            type: DataTypes.INTEGER(11)
        },
        
        image: {
            type: DataTypes.STRING
        },
        
        manufacturer_id: {
            type: DataTypes.INTEGER(11)
        },

        shipping: {
            type: DataTypes.TINYINT(1)
        },

        price: {
            type: DataTypes.DECIMAL(15,4)
        },
        
        points: {
            type: DataTypes.INTEGER(8)
        },
        
        tax_class_id: {
            type: DataTypes.INTEGER(11)
        },
        
        date_available: {
            type: DataTypes.DATEONLY
        },
        
        weight: {
            type: DataTypes.DECIMAL(15,8)
        },
        
        weight_class_id: {
            type: DataTypes.INTEGER(11)
        },
        
        length: {
            type: DataTypes.DECIMAL(15,8)
        },
        
        width: {
            type: DataTypes.DECIMAL(15,8)
        },
        
        height: {
            type: DataTypes.DECIMAL(15,8)
        },
        
        length_class_id: {
            type: DataTypes.INTEGER(11)
        },
        
        subtract: {
            type: DataTypes.TINYINT(1)
        },
        
        minimum: {
            type: DataTypes.INTEGER(11)
        },
        
        sort_order: {
            type: DataTypes.INTEGER(11)
        },
        
        status: {
            type: DataTypes.TINYINT(1)
        },
        
        date_added: {
            type: DataTypes.DATE
        },
        
        date_modified: {
            type: DataTypes.DATE
        },
        
        viewed: {
            type: DataTypes.INTEGER(5)
        },
        
        maximo: {
            type: DataTypes.DECIMAL(10,0)
        },
        
        tipo_ingresso: {
            type: DataTypes.STRING(50)
        },
        
        Observacoes: {
            type: DataTypes.STRING
        },
        
        classId: {
            type: DataTypes.INTEGER(11)
        },
        
        half: {
            type: DataTypes.TINYINT(1)
        },
        
        mapa: {
            type: DataTypes.STRING
        },
        
        meia_entrada: {
            type: DataTypes.TINYINT(1)
        },
        
        mapa_id: {
            type: DataTypes.STRING(99)
        },
    },
    { schema: process.env.DB_LOJA }
)

// foreign keys

// ticketsl_promo.tbl_classes_ingressos (classId → cla_cod)
tbl_classes_ingressos.hasMany(lltckt_product, {
    foreignKey: 'classId',
    sourceKey: 'cla_cod',
    onUpdate: 'set null',
    hooks: true
})
lltckt_product.belongsTo(tbl_classes_ingressos, {
    foreignKey: 'classId',
    targetKey: 'cla_cod'
})

export default lltckt_product