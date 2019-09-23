# DataStax Serverless Examples

The examples in this repo show how to set up a simple Cassandra REST API in Node.js using serverless functions across clouds.

The [serverless framework](serverless.com) is used to facilitate the configuration and deployment.

See the directories in this repo for cloud-specific examples.
- [AWS Lambda](aws)
- [Google Cloud Functions](gcp)
- [Azure Functions](azure)

There are some subtle and interesting differences between the cloud providers serverless functions even though the 
business logic and data access is abstracted away from the function entrypoints in the examples in this repo.
Cassandra and DataStax do allow for increased portability, as the database itself can run in any cloud or on-prem.

## Some Interesting Differences

### 1. The function entrypoint and response structure varies across the clouds.
**AWS** - uses `event` and a standard structure for the HTTP response
```
module.exports.createCatalog = async (event) => {
  return createSchema();
};

module.exports.addItem = async (event) => {
  const data = JSON.parse(event.body);
  return addItem(data.item_id, data.name, data.description, data.price);
};

module.exports.getItem = async (event) => {
  return getItem(event.pathParameters.id);
};
```
**GCP** - uses [expressjs](https://expressjs.com/en/api.html) (req, res)
```
exports.createCatalog = async (req, res) => {
  const result = await createSchema();
  res.status(result.statusCode).json(result.body);
};

exports.addItem = async (req, res) => {
  const result = await addItem(req.body.item_id, req.body.name, req.body.description, req.body.price);
  res.status(result.statusCode).json(JSON.parse(result.body));
};

exports.getItem = async (req, res) => {
  const id = req.path.match(/\d+/g);
  const result = await getItem(id)
  res.status(result.statusCode).json(JSON.parse(result.body));
};
```
**Azure** - uses a `context` object
```
module.exports.createCatalog = async (context) => {
  const result = await createSchema();
  context.res = { status: result.statusCode, body: result.body };
};

module.exports.addItem = async (context) => {
  const result = await addItem(context.req.body.item_id, context.req.body.name, context.req.body.description, context.req.body.price);
  context.res = { status: result.statusCode, body: result.body };
};

module.exports.getItem = async (context) => {
  const result = await getItem(context.req.params.id);
  context.res = { status: result.statusCode, body: result.body };
};
```

### 2. The credential configuration significantly varies across the clouds
AWS - uses classic access keys ( [documentation](https://serverless.com/framework/docs/providers/aws/guide/credentials/) )

GCP - requires API enablement and a keyfile ( [documentation](https://serverless.com/framework/docs/providers/google/guide/credentials/) )

Azure - requires azure cmd line login and Service Principal ( [documentation](https://github.com/serverless/serverless-azure-functions#advanced-authentication) )

### 3. The configuration for functions varies quite a bit across clouds in the serverless framework
**AWS**
```
functions:
  createCatalog:
    handler: handler.createCatalog 
    events: 
      - http:
          path: catalog/create
          method: post
          cors: true
  addItem:
    handler: handler.addItem
    events: 
      - http:
          path: catalog/add
          method: post
          cors: true
  getItem:
    handler: handler.getItem
    events: 
      - http:
          path: catalog/get/{id}
          method: get
          cors: true
```
**GCP**
```
functions:
  createCatalog:
    handler: createCatalog 
    events: 
      # it appears that the path here does not take effect and the endpoint is instead /createCatalog
      - http: catalog/create
  addItem:
    handler: addItem
    events: 
      # it appears that the path here does not take effect and the endpoint is instead /addItem
      - http: catalog/add
  getItem:
    handler: getItem
    events: 
      # it appears that the path here does not take effect and the endpoint is instead /getItem/{id}
      - http: catalog/get/{id}
```
**Azure**
```
functions:
  createCatalog:
    handler: index.createCatalog 
    events: 
      - http: true
        x-azure-settings:
          methods:
            - post
          route: catalog/create
          authLevel: anonymous
  addItem:
    handler: index.addItem
    events: 
      - http: true
        x-azure-settings:
          methods:
            - post
          route: catalog/add
          authLevel: anonymous
  getItem:
    handler: index.getItem
    events: 
      - http: true
        x-azure-settings:
          methods:
            - get
          route: catalog/get/{id}
          authLevel: anonymous
```
