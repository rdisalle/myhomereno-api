const EstimatesService = {
    getAllEstimates(knex) {
      return knex.select('*').from('myhomereno_estimates');
    },
    insertEstimate(knex, newEstimate) {
      return knex
        .insert(newEstimate)
        .into('myhomereno_estimates')
        .returning('*')
        .then(rows => {
          return rows[0]
        });
    },
    getById(knex, id) {
      return knex
        .from('myhomereno_estimates')
        .select('*')
        .where('id', id)
        .first()
    },
    deleteEstimate(knex, id) {
      return knex('myhomereno_estimates')
        .where({ id })
        .delete()
    },
    updateEstimate(knex, id, newEstimateFields) {
      return knex('myhomereno_estimates')
        .where({ id })
        .update(newEstimateFields)
    },
  };
  
  module.exports = EstimatesService;