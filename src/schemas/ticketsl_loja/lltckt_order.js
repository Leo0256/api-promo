import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import lltckt_category from './lltckt_category.js'


/**
 * Tabela das vendas no site
 * 
 * foreign keys:
 * - lltckt_category (category_id → category_id)
 */
const lltckt_order = db_conn.define(
    'lltckt_order',
    {
        order_id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true
        },
        
        invoice_no: {
            type: DataTypes.INTEGER(11)
        },
        
        invoice_prefix: {
            type: DataTypes.STRING(26)
        },
        
        store_id: {
            type: DataTypes.INTEGER(11)
        },
        
        store_name: {
            type: DataTypes.STRING(64)
        },
        
        store_url: {
            type: DataTypes.STRING
        },
        
        customer_id: {
            type: DataTypes.INTEGER(11)
        },
        
        customer_group_id: {
            type: DataTypes.INTEGER(11)
        },
        
        firstname: {
            type: DataTypes.STRING(32)
        },
        
        lastname: {
            type: DataTypes.STRING(32)
        },
        email: {
            type: DataTypes.STRING(96)
        },
        
        telephone: {
            type: DataTypes.STRING(32)
        },
        
        fax: {
            type: DataTypes.STRING(32)
        },
        
        payment_firstname: {
            type: DataTypes.STRING(32)
        },
        
        payment_lastname: {
            type: DataTypes.STRING(32)
        },
        
        payment_company: {
            type: DataTypes.STRING(32)
        },
        
        payment_company_id: {
            type: DataTypes.STRING(32)
        },
        
        payment_tax_id: {
            type: DataTypes.STRING(32)
        },
        
        payment_address_1: {
            type: DataTypes.STRING(128)
        },
        
        payment_address_2: {
            type: DataTypes.STRING(128)
        },
        
        payment_city: {
            type: DataTypes.STRING(128)
        },
        
        payment_postcode: {
            type: DataTypes.STRING(10)
        },
        
        payment_country: {
            type: DataTypes.STRING(128)
        },
        
        payment_country_id: {
            type: DataTypes.INTEGER(11)
        },
        
        payment_zone: {
            type: DataTypes.STRING(128)
        },
        
        payment_zone_id: {
            type: DataTypes.INTEGER(11)
        },
        
        payment_address_format: {
            type: DataTypes.TEXT
        },
        
        payment_method: {
            type: DataTypes.STRING(128)
        },
        
        payment_code: {
            type: DataTypes.STRING(128)
        },
        
        shipping_firstname: {
            type: DataTypes.STRING(32)
        },
        
        shipping_lastname: {
            type: DataTypes.STRING(32)
        },
        
        shipping_company: {
            type: DataTypes.STRING(32)
        },
        
        shipping_address_1: {
            type: DataTypes.STRING(128)
        },
        
        shipping_address_2: {
            type: DataTypes.STRING(128)
        },
        
        shipping_city: {
            type: DataTypes.STRING(128)
        },
        
        shipping_postcode: {
            type: DataTypes.STRING(10)
        },
        
        shipping_country: {
            type: DataTypes.STRING(128)
        },
        
        shipping_country_id: {
            type: DataTypes.INTEGER(11)
        },
        
        shipping_zone: {
            type: DataTypes.STRING(128)
        },
        
        shipping_zone_id: {
            type: DataTypes.INTEGER(11)
        },
        
        shipping_address_format: {
            type: DataTypes.TEXT
        },
        
        shipping_method: {
            type: DataTypes.STRING(128)
        },
        
        shipping_code: {
            type: DataTypes.STRING(128)
        },
        
        comment: {
            type: DataTypes.TEXT
        },
        
        total: {
            type: DataTypes.DECIMAL(15,4)
        },
        
        order_status_id: {
            type: DataTypes.INTEGER(11)
        },
        
        affiliate_id: {
            type: DataTypes.INTEGER(11)
        },
        
        commission: {
            type: DataTypes.DECIMAL(15,4)
        },
        
        language_id: {
            type: DataTypes.INTEGER(11)
        },
        
        currency_id: {
            type: DataTypes.INTEGER(11)
        },
        
        currency_code: {
            type: DataTypes.STRING(3)
        },
        
        currency_value: {
            type: DataTypes.DECIMAL(15,8)
        },
        
        ip: {
            type: DataTypes.STRING(40)
        },
        
        forwarded_ip: {
            type: DataTypes.STRING(40)
        },
        
        user_agent: {
            type: DataTypes.STRING
        },
        
        accept_language: {
            type: DataTypes.STRING
        },
        
        date_added: {
            type: DataTypes.DATE
        },
        
        date_modified: {
            type: DataTypes.DATE
        },
        
        category_id: {
            type: DataTypes.INTEGER(11)
        },
        
        pagseguro_code: {
            type: DataTypes.STRING(45)
        },
        
        printed: {
            type: DataTypes.TINYINT(1)
        },
        
        idTransacaoPix: {
            type: DataTypes.STRING(45)
        },
        
        dataCriacaoPix: {
            type: DataTypes.DATE
        },
        
        qrcode: {
            type: DataTypes.BLOB
        },
        
        chaveCopiaCola: {
            type: DataTypes.STRING
        }
    }
)

// foreign keys

// lltckt_category (category_id → category_id)
lltckt_category.hasMany(lltckt_order, {
    foreignKey: 'category_id',
    sourceKey: 'category_id',
    onUpdate: 'cascade',
    onDelete: 'cascade',
    hooks: true
})
lltckt_order.belongsTo(lltckt_category, {
    foreignKey: 'category_id',
    targetKey: 'category_id'
})

export default lltckt_order