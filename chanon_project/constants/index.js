const databaseNames = {
    ar: '2_prolexbase_3_1_other_data',
    en: '2_prolexbase_3_1_eng_data',
    fr: '2_prolexbase_3_1_fra_data',
    pl: '2_prolexbase_3_1_pol_data',
};
module.exports.databaseNames = databaseNames;

const tableNames = {
    ar: 'prolexeme_arb',
    en: 'prolexeme_eng',
    fr: 'alias_fra',
    pl: 'prolexeme_pol',
};
module.exports.tableNames = tableNames;

const columnNames = {
    prolexeme_arb: 'LABEL_PROLEXEME',
    prolexeme_eng: 'LABEL_PROLEXEME',
    alias_fra: 'LABEL_ALIAS',
    prolexeme_pol: 'LABEL_PROLEXEME',
};
module.exports.columnNames = columnNames;

const languageMap = {
    'ar': 'arabic',
    'fr': 'french',
    'en': 'english',
    'pl': 'polish'
}
module.exports.languageMap = languageMap;