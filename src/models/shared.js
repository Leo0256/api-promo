export default class Shared {

    /**
     * Retorna o total de dias entre duas datas.
     * 
     * @param {Date} first Data inicial
     * @param {Date} end Data final
     */
    static calcDaysBetween(first, end) {
        // Datas iguais
        if(first.getTime() == end.getTime())
            return 0

        // Auxiliar no cálculo dos dias
        const one_day = 24 * 60 * 60 * 1000

        // Calcula os dias
        return Math.ceil((first - end) / one_day)
    }

    /**
     * Retorna a data completa, no
     * formato dia/mês/ano.
     * 
     * @param {Date} date 
     * @returns 
     */
    static getFullDate(date) {
        return date.toLocaleString(
            'pt-BR',
            { timeZoneName: 'short' }
        )
        .split(' ')[0]
    }

    /**
     * Converte valores numéricos no formato
     * monetário brasileiro.
     * 
     * @param {string|number} value 
     * @returns 
     */
    static moneyFormat(value) {
        return (Number(value ?? 0)).toLocaleString(
            'pt-BR', 
            {currency: 'BRL', style: 'currency'}
        )
    }

    /**
     * Converte um valor no formato monetário
     * brasileiro para um float
     * 
     * @param {string} value 
     * @returns 
     */
    static moneyToFloat(value) {
        return parseFloat(
            value.replace('R$', '')
            .replace(/\./, '')
            .replace(/,/, '.')
            .trim()
        )
    }

}