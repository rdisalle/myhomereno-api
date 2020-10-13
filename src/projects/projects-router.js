const path = require('path');
const express = require('express');
const xss = require('xss');
const ProjectsService = require('./projects-service');
const projectsRouter = express.Router();
const jsonParser = express.json();

const serializeProjects = project => ({
    id: project.id,
    name: xss(project.name),
    summary: project.summary,
    estimated_cost: project.estimated_cost,
    room: project.room,
    details: project.details,
    total_time: project.total_time,
    type: project.type,
    status: project.status,
    date_created: project.date_created,
  });

projectsRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    ProjectsService.getAllProjects(knexInstance)
      .then(projects => {
        res.json(projects.map(serializeProjects));
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const addProject = req.body;
    const newProject = addProject;

    for (const [key, value] of Object.entries(newProject))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });

    ProjectsService.insertProject(
      req.app.get('db'),
      newProject
    )
      .then(project => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${project.id}`))
          .json(serializeProjects(project))
      })
      .catch(next)
  });

projectsRouter
  .route('/:project_id')
  .all((req, res, next) => {
    ProjectsService.getById(
      req.app.get('db'),
      req.params.project_id
    )
      .then(project => {
        if (!project) {
          return res.status(404).json({
            error: { message: `Project doesn't exist` }
          });
        }
        res.project = project
        next()
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json(serializeProjects(res.project));
  })
  .delete((req, res, next) => {
    ProjectsService.deleteProject(
      req.app.get('db'),
      req.params.project_id
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const projectUpdate = req.body;
    const projectToUpdate = projectUpdate;
    const numberOfValues = Object.values(projectToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain '${key}'`
        }
      });
    }

      ProjectsService.updateProject(
        req.app.get('db'),
        req.params.project_id,
        projectToUpdate
      )
        .then(numRowsAffected => {
          res.status(204).end()
        })
        .catch(next)
  });

module.exports = projectsRouter;