const Port = require('get-port')
const App = require('express')()
const OpenApiMock = require('openapi-mockk')
const args = require('args')
const Log = require('pino')()

args.option(['a', 'api'], 'Path to OpenAPI specification file. JSON or YAML.')
args.example('openapi-mock-server --api=petstore.yaml', 'To run a server serving examples from specification, simply point to a file')
const opts = args.parse(process.argv)

if (opts.api) {
  App.all('*', (req, res, next) => {
    const content = req.headers['content-type'] || 'application/json'
    const path = req.path
    const operation = req.method.toLowerCase()
    Log.trace({path, method: operation, content_type: content}, 'http request')
    OpenApiMock(opts.api).responses({
      path,
      operation,
      response: '200',
      content
    }).then(mock => {
      const response = mock[path][operation].responses
      Log.trace({ response }, 'sending response')
      res.send(response)
    })
  })

  Port({port: 3000}).then(port => {
    App.listen(port, () => Log.info({ port }, `server started`))
  })
} else {
  args.showHelp()
}
