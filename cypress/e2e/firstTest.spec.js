describe('Test with backend', () => {
  beforeEach('log in to the app', () => {
    cy.intercept('GET', 'https://api.realworld.io/api/tags', { fixture: 'tags.json' }).as('getTags')
    cy.loginToApplication()
  })

  it('post new article and verify request and response', () => {

    cy.intercept('POST', 'https://api.realworld.io/api/articles/').as('postArticle')

    cy.contains('New Article').click()
    cy.get('[placeholder="Article Title"]').type('this is the title')
    cy.get('[formcontrolname="description"]').type('this is the description')
    cy.get('[formcontrolname="body"]').type('this is the body')
    cy.contains('Publish Article').click()

    cy.wait('@postArticle').then( xhr => {
      console.log(xhr)
      expect(xhr.response.statusCode).to.equal(201)
      expect(xhr.response.body.article.body).to.equal('this is the body')
    })

    cy.contains('Delete Article').click()
  })

  it('verify popular tags are displayed', () => {
    cy.get('.tag-list')
    .should('contain', 'cypress')
    .and('contain', 'selenium')
    .and('contain', 'automation')
    .and('contain', 'javascript')
  })

  it.only('verify global feed likes count', () => {
    cy.intercept('GET', 'https://api.realworld.io/api/articles*', { fixture: 'articles' })

    cy.get('app-article-list button').then(buttonList => {
      cy.wrap(buttonList).eq(0).contains('1')
      cy.wrap(buttonList).eq(1).contains('5')
    })

    cy.fixture('articles').then(file => {
      const articleSlug = file.articles[0].slug
      file.articles[0].favoritesCount = 2
      cy.intercept('POST', 'https://api.realworld.io/api/articles/'+articleSlug+'/favorite', file)
    })

    cy.get('app-article-list button').eq(0).click().should('contain', '2')
  })
})