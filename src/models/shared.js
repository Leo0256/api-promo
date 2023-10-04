export default class Shared {

    /**
     * Retorna o total de dias entre duas datas.
     * 
     * @param {Date} first Data inicial
     * @param {Date} end Data final
     * @returns 
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
     * Converte datas em formato dia/mês/ano
     * para o formato ISO.
     * 
     * @param {string} date 
     * @returns 
     */
    static formatDate(date) {
        let aux = date.split('/')
        let dateString = `${aux[2]}-${aux[1]}-${aux[0]}`

        return new Date(dateString)
    }

    /**
     * Retorna o dia da semana, em referencia à
     * data informada.
     * 
     * @param {Date} date 
     * @returns 
     */
    static getWeekday(date) {
        let utc_day = date.getUTCDay()

        const week = [
            'Domingo',
            'Segunda-feira',
            'Terça-feira',
            'Quarta-feira',
            'Quinta-feira',
            'Sexta-feira',
            'Sábado'
        ]

        return week[utc_day]
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

    /**
     * Calcula o percentual de um valor
     * sobre o total.
     * 
     * @param {number} value 
     * @param {number} total 
     * @returns 
     */
    static percentage(value, total) {
        let perc = (value * 100 / total).toFixed(2)

        return `${perc.replace(/\./, ',')}%`
    }

}