const ProjectsService = {
    getAllProjects(knex) {
      return knex.select('*').from('myhomereno_projects');
    },
    insertProject(knex, newProject) {
      return knex
        .insert(newProject)
        .into('myhomereno_projects')
        .returning('*')
        .then(rows => {
          return rows[0]
        });
    },
    getById(knex, id) {
      return knex
        .from('myhomereno_projects')
        .select('*')
        .where('id', id)
        .first();
    },
    deleteProject(knex, id) {
      return knex('myhomereno_projects')
        .where({ id })
        .delete()
    },
    updateProject(knex, id, newProjectFields) {
      return knex('myhomereno_projects')
        .where({ id })
        .update(newProjectFields);
    },
  };
  
  module.exports = ProjectsService;