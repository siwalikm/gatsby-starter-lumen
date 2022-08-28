'use strict';

const path = require('path');
const createCategoriesPages = require('./pagination/create-categories-pages.js');
const createTagsPages = require('./pagination/create-tags-pages.js');
const createPostsPages = require('./pagination/create-posts-pages.js');

const createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;

  // 404
  createPage({
    path: '/404',
    component: path.resolve('./src/templates/not-found-template.js')
  });

  // Tags list
  createPage({
    path: '/tags',
    component: path.resolve('./src/templates/tags-list-template.js')
  });

  // Categories list
  createPage({
    path: '/categories',
    component: path.resolve('./src/templates/categories-list-template.js')
  });

  // Posts and pages from markdown
  const result = await graphql(`
    {
      allMarkdownRemark(
        filter: {frontmatter: {draft: {ne: true}}}, sort: {fields: frontmatter___date, order: DESC}
      ) {
        edges {
          node {
            frontmatter {
              template
              title
            }
            fields {
              slug
            }
          }
        }
      }
    }
  `);

  const { edges } = result.data.allMarkdownRemark;
  const pages = edges.filter((edge) => edge.node.frontmatter.template === 'page');
  const posts = edges.filter((edge) => edge.node.frontmatter.template === 'post');
  console.log(pages, posts);
  pages.forEach((edge) => {
    createPage({
      path: edge.node.fields.slug,
      component: path.resolve('./src/templates/page-template.js'),
      context: { slug: edge.node.fields.slug }
    });
  });

  posts.forEach((edge, index) => {
    createPage({
      path: edge.node.fields.slug,
      component: path.resolve('./src/templates/post-template.js'),
      context: {
        slug: edge.node.fields.slug,
        prevPost: index === posts.length - 1 ? null : posts[index + 1],
        nextPost: index === 0 ? null : posts[index - 1],
      }
    });
  });

  // Feeds
  await createTagsPages(graphql, actions);
  await createCategoriesPages(graphql, actions);
  await createPostsPages(graphql, actions);
};

module.exports = createPages;
