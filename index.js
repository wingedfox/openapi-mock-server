const Port = require('get-port')
const App = require('express')()
const OpenApiMock = require('openapi-mockk')
const args = require('args')
const debug = require('debug')('openapi-mock-server')
const Log = require('pino')()

args.option(['a', 'api'], 'Path to OpenAPI specification file. JSON or YAML.')
args.example('openapi-mock-server --api=petstore.yaml', 'To run a server serving examples from specification, simply point to a file')
const opts = args.parse(process.argv)

debug(`Reading OpenAPI in ${opts.api}`)
const mock = OpenApiMock(opts.api)
mock.openapi.then(api => {
  debug(`OpenAPI specification for ${api.info.title} loaded successfuly`)
})

if (opts.api) {
  App.all('*', (req, res, next) => {
    const content = req.headers['content-type'] || 'application/json'
    const path = req.path
    const operation = req.method.toLowerCase()
    debug(`HTTP ${req.method} ${req.path}; content-type=${content}`)
    mock.responses({
      path,
      operation,
      response: '200',
      content
    }).then(mock => {
      if (path in mock) {
        const response = mock[path][operation].responses
        debug(`200: ${response}`)  
        res.send(response)
      } else {
        debug(`404: path not found`)
        res.sendStatus(404)
      }
    })
  })

  Port({port: 3000}).then(port => {
    App.listen(port, () => Log.info({ port }, `server started`))
  })
} else {
  args.showHelp()
}
