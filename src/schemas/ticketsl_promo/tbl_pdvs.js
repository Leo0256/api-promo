import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'


/**
 * Tabela dos PDVs (Pontos de Venda)
 */
const tbl_pdvs = db_conn.define(
    'tbl_pdvs',
    {
        pdv_id: {
            type: DataTypes.INTEGER(60),
            autoIncrement: true,
            primaryKey: true
        },

	    pdv_nome: {
            type: DataTypes.STRING(60)
        },

	    pdv_endereco: {
            type: DataTypes.STRING(60)
        },
        
        pdv_telefone: {
            type: DataTypes.STRING(60)
        },
    
	    pdv_observacao: {
            type: DataTypes.STRING(150)
        },
        
	    pdv_data_inclusao: {
            type: DataTypes.DATE
        },

	    pdv_cliente: {
            type: DataTypes.INTEGER(60)
        },

	    pdv_empresa: {
            type: DataTypes.INTEGER(60)
        },

	    pdv_cartao: {
            type: DataTypes.INTEGER(1).UNSIGNED
        },

	    pdv_login: {
            type: DataTypes.STRING(300)
        }, 
	
        pdv_senha: {
            type: DataTypes.STRING(300)
        },

	    pdv_ativo: {
            type: DataTypes.TINYINT(1)
        },
	
        pdv_tipo: {
            type: DataTypes.INTEGER(1)
        }, 
	
        pos_ativacao_smart_card: {
            type: DataTypes.STRING
        }, 
	
        pos_password: {
            type: DataTypes.STRING
        }, 
	
        pos_quantidade_parcela: {
            type: DataTypes.INTEGER(11)
        }, 
	
        pos_percentual_taxa: {
            type: DataTypes.INTEGER(11)
        }
    },
    { schema: process.env.DB_PROMO }
)

export default tbl_pdvs