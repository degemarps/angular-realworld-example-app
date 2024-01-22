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

  it('verify global feed likes count', () => {
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

  it('delete a new article in a global feed', () => {
    

    const bodyRequest = {
      "article": {
          "title": "The article",
          "description": "Some good article",
          "body": "A very good article",
          "tagList": []
      }
    }
    // Get token to use after
    cy.get('@token').then(token => {

      // Create a new article
      cy.request({
        url: 'https://api.realworld.io/api/articles/',
        headers: { 'Authorization': 'Token '+token },
        method: 'POST',
        body: bodyRequest
      }).then(response => {
        console.log(response)
        expect(response.status).to.equal(201)
        const slugID = response.body.article.slug

        // Verify if the new article show up on the list
        cy.request({
          url: 'https://api.realworld.io/api/articles?limit=10&offset=0',
          method: 'GET',
          headers: { 'Authorization': 'Token '+token }
        }).its('body').then(body => {
          expect(body.articles[0].title).to.equal('The article')
        })

        // Delete the created article
        cy.request({
          url: 'https://api.realworld.io/api/articles/'+slugID,
          method: 'DELETE',
          headers: { 'Authorization': 'Token '+token }
        }).then(response => {
          expect(response.status).to.equal(204)
        })

        // Verify if the article don't show up on the list
        cy.request({
          url: 'https://api.realworld.io/api/articles?limit=10&offset=0',
          method: 'GET',
          headers: { 'Authorization': 'Token '+token }
        }).its('body').then(body => {
          expect(body.articles[0].title).not.to.equal('The article')
        })
      })
    })
  })
})