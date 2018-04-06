const Port = require('get-port')
const App = require('express')()
const OpenApiMock = require('openapi-mockk')
const Opts = require('mri')

const args = Opts(process.argv.slice(2))

if (args.api) {
  App.all('*', (req, res, next) => {
    const content = req.headers['content-type'] || 'application/json'
    const path = req.path
    const operation = req.method.toLowerCase()
    OpenApiMock(args.api).responses({
      path,
      operation,
      response: '200',
      content
    }).then(mock => {
      res.send(mock[path][operation].responses)
    })
  })

  Port({port: 3000}).then(port => {
    App.listen(port, () => console.log(`OpenApiMock server listening on port ${port}`))
  })
} else {
  console.log('OpenAPI file required, --api=api.yaml. Supports json and yaml.')
}
